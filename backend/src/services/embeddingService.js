/**
 * OpenAI Embeddings API — yalnızca backend config/.env üzerinden.
 */

const config = require('../config');

function isEmbeddingConfigured() {
  return Boolean(config.openai?.apiKey?.trim());
}

async function createEmbeddings(inputs) {
  const values = (Array.isArray(inputs) ? inputs : [inputs])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  if (values.length === 0) {
    throw new Error('Embedding oluşturmak için en az bir metin gerekli.');
  }

  const apiKey = config.openai.apiKey.trim();
  const url = `${config.openai.baseUrl}/embeddings`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.embeddingModel,
      input: values.length === 1 ? values[0] : values,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      body?.error?.message ||
      body?.error?.code ||
      response.statusText ||
      'Embedding isteği başarısız.';
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  const rows = Array.isArray(body?.data) ? body.data : [];
  if (rows.length !== values.length) {
    throw new Error('Embedding yanıtı beklenen parça sayısıyla eşleşmiyor.');
  }

  return rows
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((row) => {
      const embedding = row?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Geçersiz embedding yanıtı alındı.');
      }
      return embedding.map((value) => Number(value));
    });
}

module.exports = {
  isEmbeddingConfigured,
  createEmbeddings,
};
