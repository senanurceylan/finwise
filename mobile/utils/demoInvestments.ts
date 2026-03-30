export const DEMO_INVESTMENT_ID_PREFIX = '__demo__';

export function isDemoInvestment(item: { id: string } | null | undefined) {
  return item != null && String(item.id).startsWith(DEMO_INVESTMENT_ID_PREFIX);
}

const ISO = '2025-01-15T10:00:00.000Z';

export function getDemoInvestments() {
  return [
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}usd`,
      userId: '',
      symbol: 'USDTRY',
      assetType: 'FOREX',
      quantity: 2200,
      buyPriceTry: 40.85,
      note: 'Demo: USD pozisyonu',
      paymentSource: 'bank_account',
      cardId: null,
      sourceLabel: 'Vadesiz TL',
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}eur`,
      userId: '',
      symbol: 'EURTRY',
      assetType: 'FOREX',
      quantity: 950,
      buyPriceTry: 47.2,
      note: 'Demo: EUR mevduat',
      paymentSource: 'transfer_eft',
      cardId: null,
      sourceLabel: '',
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}xau`,
      userId: '',
      symbol: 'XAUTRY',
      assetType: 'METAL',
      quantity: 1.25,
      buyPriceTry: 198500,
      note: 'Demo: altın (ons)',
      paymentSource: 'cash',
      cardId: null,
      sourceLabel: '',
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
  ];
}
