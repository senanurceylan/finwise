export const PAYMENT_SOURCE_OPTIONS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi kartı' },
  { value: 'debit_card', label: 'Banka kartı' },
  { value: 'bank_account', label: 'Banka hesabı' },
  { value: 'transfer_eft', label: 'Havale / EFT' },
  { value: 'automatic_payment', label: 'Otomatik ödeme' },
  { value: 'investment_platform', label: 'Yatırım platformu' },
  { value: 'other', label: 'Diğer' },
] as const;

export function paymentSourceLabel(value?: string | null) {
  if (!value) return '—';
  return PAYMENT_SOURCE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function isCardPaymentSource(value?: string | null) {
  return value === 'credit_card' || value === 'debit_card';
}
