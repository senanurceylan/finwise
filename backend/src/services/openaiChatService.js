/**
 * FinWise Finans Asistanı — OpenAI Chat Completions entegrasyonu.
 * API anahtarı yalnızca backend config/.env üzerinden okunur.
 */

const config = require('../config');

const PDF_CONTEXT_HINT =
  'Banka ekstresinden ilgili metin parçaları verildiyse, ekstreyle ilgili sorularda öncelikle bu parçalara dayan; finans özetiyle çelişen ekstre bilgisini ekstre parçalarına göre açıkla.';

function buildSystemPrompt(hasPdfContext) {
  const base = [
    'Sen FinWise Finans Asistanısın.',
    'Yanıtlarını yalnızca sana verilen finans özetindeki verilere dayandır; özet dışında rakam veya kategori uydurma.',
    'Gelir bilgisi özetinde yoksa gelir hakkında varsayım yapma; gerekirse gelirin kayıtlı olmadığını belirt.',
    'Kullanıcının mesajının dilinde (Türkçe veya İngilizce) yanıt ver.',
    'Para birimi Türk Lirası (₺). Kısa, net ve yardımcı ol.',
    'Yatırım tavsiyesi verme; genel bütçe ve harcama rehberliği sun.',
  ].join(' ');

  return hasPdfContext ? `${base} ${PDF_CONTEXT_HINT}` : base;
}

function isOpenAiConfigured() {
  return Boolean(config.openai?.apiKey?.trim());
}

async function generateFinanceAssistantReply({ userMessage, financeSummary, pdfContext = '' }) {
  const apiKey = config.openai.apiKey.trim();
  const url = `${config.openai.baseUrl}/chat/completions`;
  const hasPdfContext = Boolean(String(pdfContext || '').trim());

  const userContent = [
    'Kullanıcının finans özeti:',
    financeSummary,
  ];

  if (hasPdfContext) {
    userContent.push('', 'Banka ekstresinden ilgili bölümler:', pdfContext);
  }

  userContent.push('', 'Kullanıcı mesajı:', userMessage);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        { role: 'system', content: buildSystemPrompt(hasPdfContext) },
        {
          role: 'user',
          content: userContent.join('\n'),
        },
      ],
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      body?.error?.message ||
      body?.error?.code ||
      response.statusText ||
      'OpenAI isteği başarısız.';
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  const reply = body?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('OpenAI yanıtı boş döndü.');
  }

  return reply;
}

module.exports = {
  isOpenAiConfigured,
  generateFinanceAssistantReply,
};
