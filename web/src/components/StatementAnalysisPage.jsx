import { useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const AMOUNT_PATTERN = /(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*TL)?/gi;
const DATE_PATTERN = /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/;

const CATEGORY_KEYWORDS = {
  MARKET: ["market", "migros", "bim", "a101", "şok", "sok", "carrefour", "macrocenter"],
  ULAŞIM: ["toplu taşıma", "toplu tasima", "otobüs", "otobus", "metro", "ulaşım", "ulasim", "tasima", "taşıma"],
  RESTORAN: ["restoran", "cafe", "café", "yemek", "mcdonalds", "burger", "starbucks"],
  SAĞLIK: ["eczane", "hastane", "sağlık", "saglik"],
  EĞİTİM: ["okul", "öğrenci", "ogrenci", "kurs", "üniversite", "universite"],
};

const SKIP_LINE_PATTERN =
  /toplam|bakiye|limit|önceki|onceki|kalan|borç|borc|alacak|devreden|hesap özeti|hesap ozeti|kart no|sayfa|tarih aralığı|donem/i;

const COPY = {
  tr: {
    intro: "PDF ekstrenizi seçin ve metnini görüntülemek için okuyun.",
    selectPdf: "PDF dosyası seç",
    selectedFile: "Seçilen dosya",
    noFileSelected: "Henüz dosya seçilmedi.",
    readPdf: "PDF'i Oku",
    selectFileWarning: "Lütfen okumadan önce bir PDF dosyası seçin.",
    loading: "PDF okunuyor, lütfen bekleyin…",
    analysisTitle: "Ekstre analizi",
    totalSpend: "Toplam harcama",
    transactionCount: "İşlem sayısı",
    highestTransaction: "En yüksek işlem",
    topCategory: "En çok görünen kategori",
    transactionsTitle: "İşlem listesi",
    colDate: "Tarih",
    colDescription: "Açıklama",
    colCategory: "Kategori",
    colAmount: "Tutar",
    noTransactions: "PDF metni okundu ancak işlem satırı tespit edilemedi.",
    extractedTitle: "Ham PDF metni",
    noTextFound: "PDF okundu ancak çıkarılabilir metin bulunamadı.",
    readError: "PDF okunamadı. Dosyanın geçerli ve şifresiz bir PDF olduğundan emin olun.",
    noDate: "—",
  },
  en: {
    intro: "Select your PDF statement and read it to view the extracted text.",
    selectPdf: "Choose PDF file",
    selectedFile: "Selected file",
    noFileSelected: "No file selected yet.",
    readPdf: "Read PDF",
    selectFileWarning: "Please select a PDF file before reading.",
    loading: "Reading PDF, please wait…",
    analysisTitle: "Statement analysis",
    totalSpend: "Total spending",
    transactionCount: "Transaction count",
    highestTransaction: "Highest transaction",
    topCategory: "Most common category",
    transactionsTitle: "Transaction list",
    colDate: "Date",
    colDescription: "Description",
    colCategory: "Category",
    colAmount: "Amount",
    noTransactions: "PDF text was read but no transaction lines could be detected.",
    extractedTitle: "Raw PDF text",
    noTextFound: "PDF was read but no extractable text was found.",
    readError: "Could not read the PDF. Make sure the file is valid and not password-protected.",
    noDate: "—",
  },
};

function formatAmount(value, language) {
  const locale = language === "en" ? "en-US" : "tr-TR";
  return `${Number(value).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

function parseTurkishAmount(amountText) {
  const normalized = amountText
    .replace(/\s*TL\b/gi, "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function normalizeForMatch(text) {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function guessCategory(text) {
  const normalized = normalizeForMatch(text);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)))) {
      return category;
    }
  }
  return "DİĞER";
}

function splitIntoLines(text) {
  const byNewline = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byNewline.length > 2) {
    return byNewline;
  }

  return text
    .split(/(?=\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isSummaryLine(line) {
  if (SKIP_LINE_PATTERN.test(line)) return true;
  const upper = line.toLocaleUpperCase("tr-TR");
  if (upper === line && line.length < 40 && !DATE_PATTERN.test(line)) return true;
  return false;
}

function looksLikeTransactionLine(line) {
  if (line.length < 8) return false;
  if (isSummaryLine(line)) return false;
  const amounts = line.match(AMOUNT_PATTERN);
  if (!amounts || amounts.length === 0) return false;
  if (DATE_PATTERN.test(line)) return true;
  const letters = line.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "").length;
  return letters >= 4;
}

function buildDescription(line, date, amountText) {
  let description = line;
  if (date) description = description.replace(date, "");
  description = description.replace(amountText, "");
  description = description.replace(
    /(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?:\s*TL)?/gi,
    "",
  );
  description = description.replace(/\s+/g, " ").trim();
  return description || line.slice(0, 120);
}

function analyzeStatementText(text) {
  const lines = splitIntoLines(text);
  const transactions = [];

  for (const line of lines) {
    if (!looksLikeTransactionLine(line)) continue;

    const amountMatches = [...line.matchAll(AMOUNT_PATTERN)];
    if (amountMatches.length === 0) continue;

    const amountText = amountMatches[amountMatches.length - 1][0];
    const amount = parseTurkishAmount(amountText);
    if (amount == null || amount <= 0 || amount > 5_000_000) continue;

    const dateMatch = line.match(DATE_PATTERN);
    const date = dateMatch ? dateMatch[1] : "";
    const description = buildDescription(line, date, amountText);
    const category = guessCategory(`${description} ${line}`);

    transactions.push({
      id: `${date}-${amount}-${transactions.length}`,
      date,
      description,
      category,
      amount,
    });
  }

  if (transactions.length === 0) {
    return { transactions: [], summary: null };
  }

  const totalSpend = transactions.reduce((sum, item) => sum + item.amount, 0);
  const highest = transactions.reduce((max, item) => (item.amount > max.amount ? item : max), transactions[0]);

  const categoryCounts = transactions.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

  return {
    transactions,
    summary: {
      totalSpend,
      transactionCount: transactions.length,
      highest,
      topCategory,
    },
  };
}

async function extractTextFromPdf(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pageTexts = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    pageTexts.push(pageText);
  }

  return pageTexts.filter(Boolean).join("\n\n");
}

export default function StatementAnalysisPage({ language = "tr" }) {
  const t = COPY[language] || COPY.tr;
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPdfText("");
    setAnalysis(null);
    setWarning("");
    setError("");
  };

  const handleReadPdf = async () => {
    if (!selectedFile) {
      setWarning(t.selectFileWarning);
      setPdfText("");
      setAnalysis(null);
      setError("");
      return;
    }

    setWarning("");
    setError("");
    setPdfText("");
    setAnalysis(null);
    setLoading(true);

    try {
      const text = await extractTextFromPdf(selectedFile);
      if (!text.trim()) {
        setError(t.noTextFound);
        setPdfText("");
        setAnalysis(null);
        return;
      }
      setPdfText(text);
      setAnalysis(analyzeStatementText(text));
    } catch {
      setError(t.readError);
      setPdfText("");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const hasTransactions = analysis?.transactions?.length > 0;

  return (
    <>
      <section className="card">
        <p className="expense-date">{t.intro}</p>

        <div className="form-field">
          <label htmlFor="statement-pdf-input">{t.selectPdf}</label>
          <input
            id="statement-pdf-input"
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>

        <p className="expense-date">
          <strong>{t.selectedFile}:</strong>{" "}
          {selectedFile ? selectedFile.name : t.noFileSelected}
        </p>

        <button type="button" className="btn-primary" onClick={handleReadPdf} disabled={loading}>
          {t.readPdf}
        </button>
      </section>

      {warning ? <p className="app-error">{warning}</p> : null}
      {error ? <p className="app-error">{error}</p> : null}
      {loading ? <p className="expenses-empty">{t.loading}</p> : null}

      {pdfText && !loading ? (
        <>
          <section className="card">
            <h2 className="section-title">{t.analysisTitle}</h2>

            {hasTransactions ? (
              <>
                <div className="dashboard-stats">
                  <article className="dashboard-stat-card card">
                    <p className="dashboard-stat-label">{t.totalSpend}</p>
                    <p className="dashboard-stat-value">
                      {formatAmount(analysis.summary.totalSpend, language)}
                    </p>
                  </article>
                  <article className="dashboard-stat-card card">
                    <p className="dashboard-stat-label">{t.transactionCount}</p>
                    <p className="dashboard-stat-value">{analysis.summary.transactionCount}</p>
                  </article>
                  <article className="dashboard-stat-card card">
                    <p className="dashboard-stat-label">{t.highestTransaction}</p>
                    <p className="dashboard-stat-value dashboard-stat-value-accent">
                      {formatAmount(analysis.summary.highest.amount, language)}
                    </p>
                  </article>
                  <article className="dashboard-stat-card card">
                    <p className="dashboard-stat-label">{t.topCategory}</p>
                    <p className="dashboard-stat-value">{analysis.summary.topCategory}</p>
                  </article>
                </div>

                <section className="expenses-section" style={{ marginTop: "1rem" }}>
                  <h3 className="section-title">{t.transactionsTitle}</h3>
                  <ul className="expense-list">
                    {analysis.transactions.map((item) => (
                      <li key={item.id} className="expense-item">
                        <div className="expense-item-content">
                          <div className="expense-row-main">
                            <span className="expense-category">{item.category}</span>
                            <span className="expense-amount">{formatAmount(item.amount, language)}</span>
                          </div>
                          <div className="expense-row-meta">
                            <span className="expense-date">{item.date || t.noDate}</span>
                            <span className="expense-description">{item.description}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            ) : (
              <p className="expenses-empty">{t.noTransactions}</p>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">{t.extractedTitle}</h2>
            <div className="form-field">
              <textarea
                readOnly
                value={pdfText}
                rows={18}
                aria-label={t.extractedTitle}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "0.65rem 0.75rem",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  color: "#eaecef",
                  background: "#1e2329",
                  border: "1px solid #2b3139",
                  borderRadius: 4,
                  resize: "vertical",
                }}
              />
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
