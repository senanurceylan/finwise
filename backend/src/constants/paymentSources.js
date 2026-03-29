/**
 * Ödeme kaynağı — Prisma PaymentSource enum ile uyumlu (snake_case değerler).
 */
const PAYMENT_SOURCES = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_account',
  'transfer_eft',
  'automatic_payment',
  'investment_platform',
  'other',
];

function isCardPaymentSource(source) {
  return source === 'credit_card' || source === 'debit_card';
}

module.exports = {
  PAYMENT_SOURCES,
  isCardPaymentSource,
};
