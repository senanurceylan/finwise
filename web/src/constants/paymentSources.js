/** Backend PaymentSource enum ile uyumlu değerler */
export const PAYMENT_SOURCE_OPTIONS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi kartı" },
  { value: "debit_card", label: "Banka kartı" },
  { value: "bank_account", label: "Banka hesabı" },
  { value: "transfer_eft", label: "Havale / EFT" },
  { value: "automatic_payment", label: "Otomatik ödeme" },
  { value: "investment_platform", label: "Yatırım platformu" },
  { value: "other", label: "Diğer" },
];

export function paymentSourceLabel(value) {
  if (value == null || value === "") return "—";
  return PAYMENT_SOURCE_OPTIONS.find((o) => o.value === value)?.label || String(value);
}

export function isCardPaymentSource(value) {
  return value === "credit_card" || value === "debit_card";
}
