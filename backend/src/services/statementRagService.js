/**
 * Banka ekstresi RAG — PDF chunk indexleme ve benzer parça arama.
 */

const config = require('../config');
const { prisma } = require('../utils/prisma');
const { extractTextFromPdfBuffer } = require('./statementAnalysis');
const { chunkText } = require('./textChunkingService');
const { createEmbeddings, isEmbeddingConfigured } = require('./embeddingService');

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return -1;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function toEmbeddingVector(value) {
  if (!Array.isArray(value)) return null;
  const vector = value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  return vector.length > 0 ? vector : null;
}

function formatPdfContext(chunks) {
  return chunks
    .map((chunk, index) => `[Ekstre parçası ${index + 1}]\n${chunk.content}`)
    .join('\n\n');
}

async function indexStatementPdfBuffer({ userId, buffer, fileName = null }) {
  if (!isEmbeddingConfigured()) {
    return { indexed: false, reason: 'openai_not_configured' };
  }

  const text = await extractTextFromPdfBuffer(buffer);
  if (!text) {
    const error = new Error('PDF içinden metin çıkarılamadı.');
    error.statusCode = 422;
    throw error;
  }

  const chunks = chunkText(text, {
    minSize: config.rag.chunkMinSize,
    maxSize: config.rag.chunkMaxSize,
  });

  if (chunks.length === 0) {
    return { indexed: false, reason: 'empty_text', chunkCount: 0 };
  }

  const embeddings = await createEmbeddings(chunks);

  const result = await prisma.$transaction(async (tx) => {
    await tx.statementChunk.deleteMany({ where: { userId } });
    await tx.statementDocument.deleteMany({ where: { userId } });

    const document = await tx.statementDocument.create({
      data: {
        userId,
        fileName: fileName ? String(fileName).slice(0, 255) : null,
        textLength: text.length,
        chunkCount: chunks.length,
      },
    });

    for (let i = 0; i < chunks.length; i += 1) {
      await tx.statementChunk.create({
        data: {
          userId,
          documentId: document.id,
          chunkIndex: i,
          content: chunks[i],
          embedding: embeddings[i],
        },
      });
    }

    return document;
  });

  return {
    indexed: true,
    documentId: result.id,
    chunkCount: chunks.length,
    textLength: text.length,
  };
}

async function findRelevantStatementChunks(userId, query, topK = config.rag.topK) {
  if (!isEmbeddingConfigured()) return [];

  const storedChunks = await prisma.statementChunk.findMany({
    where: { userId },
    select: {
      content: true,
      embedding: true,
      chunkIndex: true,
    },
    orderBy: { chunkIndex: 'asc' },
  });

  if (storedChunks.length === 0) return [];

  const [queryEmbedding] = await createEmbeddings([query]);

  const scored = storedChunks
    .map((row) => {
      const vector = toEmbeddingVector(row.embedding);
      return {
        content: row.content,
        score: vector ? cosineSimilarity(queryEmbedding, vector) : -1,
      };
    })
    .filter((row) => row.score >= config.rag.minSimilarity)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

module.exports = {
  indexStatementPdfBuffer,
  findRelevantStatementChunks,
  formatPdfContext,
  cosineSimilarity,
};
