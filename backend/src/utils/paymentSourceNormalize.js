const { isCardPaymentSource } = require('../constants/paymentSources');

/**
 * cardId yalnızca kredi/banka kartı kaynaklarında kabul edilir.
 */
function normalizePaymentSourceAndCard(paymentSource, cardId, defaultSource) {
  const src = paymentSource || defaultSource;
  const raw = cardId != null && cardId !== '' ? String(cardId).trim() : null;
  const cid = raw || null;
  if (cid && !isCardPaymentSource(src)) {
    const err = new Error('Kart yalnızca "Kredi Kartı" veya "Banka Kartı" ödeme kaynağı seçildiğinde kullanılabilir.');
    err.statusCode = 400;
    throw err;
  }
  return { paymentSource: src, cardId: cid };
}

module.exports = { normalizePaymentSourceAndCard };
