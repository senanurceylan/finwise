let pdfjsLibPromise = null;

async function getPdfJsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLibPromise;
}

const DATE_REGEX = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/g;
const AMOUNT_REGEX = /(?:\d{1,3}(?:[.,]\d{3})+|\d+)[.,]\d{2}(?:\s*TL)?/gi;
const TX_DATE_REGEX = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/;

function normalizeAmount(raw) {
  if (!raw) return null;
  const text = raw.replace(/\s*TL/gi, '').trim();

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let decimalSep = null;
  if (lastComma > -1 && lastDot > -1) decimalSep = lastComma > lastDot ? ',' : '.';
  else decimalSep = lastComma > -1 ? ',' : '.';

  let normalized = text;
  if (decimalSep === ',') {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function tryExtractAmountAfterLabel(text, labels) {
  for (const label of labels) {
    const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${safeLabel}[\\s:]*((?:\\d{1,3}(?:[.,]\\d{3})+|\\d+)[.,]\\d{2}(?:\\s*TL)?)`, 'i');
    const match = text.match(re);
    if (match?.[1]) {
      const amount = normalizeAmount(match[1]);
      if (amount != null) return amount;
    }
  }
  return null;
}

function tryExtractDateAfterLabel(text, labels) {
  for (const label of labels) {
    const safeLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${safeLabel}[\\s:]*(${DATE_REGEX.source})`, 'i');
    const match = text.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function likelyTransactionLine(line) {
  const amountMatches = line.match(AMOUNT_REGEX);
  if (!amountMatches?.length) return false;
  const hasDate = TX_DATE_REGEX.test(line);
  const letters = line.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '').length;
  return hasDate || letters >= 4;
}

function parseTransactionLine(line, index) {
  const amountMatches = [...line.matchAll(AMOUNT_REGEX)];
  if (!amountMatches.length) return null;
  const last = amountMatches[amountMatches.length - 1][0];
  const amount = normalizeAmount(last);
  if (amount == null) return null;

  const dateMatch = line.match(TX_DATE_REGEX);
  const date = dateMatch?.[1] || null;

  let description = line;
  if (date) description = description.replace(date, '');
  description = description.replace(last, '').replace(/\s+/g, ' ').trim();
  if (!description) description = line.trim().slice(0, 140);

  return {
    id: `tx-${index + 1}`,
    date,
    description,
    amount,
  };
}

function parseTransactions(text) {
  const linesFromNewline = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const lines =
    linesFromNewline.length > 2
      ? linesFromNewline
      : text
          .split(/(?=\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b)/)
          .map((line) => line.trim())
          .filter(Boolean);

  const transactions = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!likelyTransactionLine(line)) continue;
    const tx = parseTransactionLine(line, transactions.length);
    if (!tx) continue;
    transactions.push(tx);
  }

  return transactions;
}

function estimateCategory(description) {
  const norm = String(description || '')
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I');

  if (norm.includes('TOPLU TASIMA')) return 'Ulaşım';
  if (norm.includes('MARKET') || norm.includes('YUNUS')) return 'Market';
  if (
    norm.includes('MCDONALDS') ||
    norm.includes(' ET ') ||
    norm.includes(' KANTIN') ||
    norm.includes('TESIS')
  ) {
    return 'Yemek';
  }
  return 'Diğer';
}

function buildTopExpenses(transactions) {
  return [...transactions]
    .filter((tx) => typeof tx.amount === 'number' && tx.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((tx) => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      category: estimateCategory(tx.description),
    }));
}

function buildCategorySummary(transactions) {
  const summary = {};
  for (const tx of transactions) {
    const category = estimateCategory(tx.description);
    if (!summary[category]) {
      summary[category] = { category, count: 0, total: 0 };
    }
    summary[category].count += 1;
    summary[category].total += Number(tx.amount || 0);
  }
  return Object.values(summary).sort((a, b) => b.total - a.total);
}

function resolveTotalSpending(text, transactions) {
  const fromTransactions = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const fromLabel =
    tryExtractAmountAfterLabel(text, [
      'Harcamalar Toplamı',
      'Harcamalar Toplami',
      'Toplam Harcama',
      'Toplam Harcamalar',
    ]) ?? null;

  if (typeof fromLabel === 'number') return fromLabel;
  return fromTransactions > 0 ? fromTransactions : null;
}

async function extractTextFromPdfBuffer(buffer) {
  const pdfjsLib = await getPdfJsLib();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  });
  const pdf = await loadingTask.promise;

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => (typeof item?.str === 'string' ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n').trim();
}

async function analyzeStatementPdfBuffer(buffer) {
  const text = await extractTextFromPdfBuffer(buffer);
  if (!text) {
    const err = new Error('PDF içinden metin çıkarılamadı.');
    err.statusCode = 422;
    throw err;
  }

  const donemBorcu = tryExtractAmountAfterLabel(text, ['Dönem Borcu', 'Donem Borcu', 'Toplam Borç', 'Toplam Borc']);
  const asgariOdemeTutari = tryExtractAmountAfterLabel(text, ['Asgari Ödeme', 'Asgari Odeme', 'Minimum Ödeme', 'Minimum Odeme']);
  const sonOdemeTarihi = tryExtractDateAfterLabel(text, ['Son Ödeme Tarihi', 'Son Odeme Tarihi', 'Ödeme Son Tarihi', 'Odeme Son Tarihi']);
  const islemListesi = parseTransactions(text);
  const harcamalarToplami = resolveTotalSpending(text, islemListesi);
  const enYuksekUcHarcama = buildTopExpenses(islemListesi);
  const kategoriOzeti = buildCategorySummary(islemListesi);

  return {
    periodDebt: donemBorcu,
    minimumPayment: asgariOdemeTutari,
    dueDate: sonOdemeTarihi,
    transactions: islemListesi,
    totalSpending: harcamalarToplami,
    top3Expenses: enYuksekUcHarcama,
    categorySummary: kategoriOzeti,
    extractedTextPreview: text.slice(0, 1200),
  };
}

module.exports = {
  analyzeStatementPdfBuffer,
};
