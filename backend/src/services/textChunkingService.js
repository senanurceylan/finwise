/**
 * Metin parçalama — banka ekstresi RAG için chunk üretimi.
 */

function normalizeWhitespace(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function findChunkEnd(text, start, maxSize, minSize) {
  const hardEnd = Math.min(start + maxSize, text.length);
  if (hardEnd >= text.length) return hardEnd;

  const slice = text.slice(start, hardEnd);
  const breakCandidates = [
    slice.lastIndexOf('\n\n'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf('; '),
    slice.lastIndexOf(', '),
    slice.lastIndexOf(' '),
  ];

  for (const breakAt of breakCandidates) {
    if (breakAt >= minSize) {
      return start + breakAt + (slice[breakAt] === ' ' || slice[breakAt] === '.' || slice[breakAt] === ';' || slice[breakAt] === ',' ? 1 : 0);
    }
  }

  return hardEnd;
}

function chunkText(text, options = {}) {
  const minSize = options.minSize ?? 500;
  const maxSize = options.maxSize ?? 800;
  const normalized = normalizeWhitespace(text);

  if (!normalized) return [];
  if (normalized.length <= maxSize) return [normalized];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const end = findChunkEnd(normalized, start, maxSize, Math.min(minSize, maxSize));
    const chunk = normalized.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end <= start) break;
    start = end;
  }

  return chunks;
}

module.exports = {
  chunkText,
};
