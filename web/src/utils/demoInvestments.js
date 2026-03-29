/**
 * API yanıdıyla uyumlu demo yatırım kayıtları (yalnızca gerçek kayıt yokken UI'da kullanılır).
 * id: __demo__* ile başlar — düzenleme/silme devre dışı.
 */

export const DEMO_INVESTMENT_ID_PREFIX = "__demo__";

export function isDemoInvestment(item) {
  return item != null && String(item.id).startsWith(DEMO_INVESTMENT_ID_PREFIX);
}

const ISO = "2025-01-15T10:00:00.000Z";

/**
 * 2 döviz + 1 metal + 3 kripto — semboller backend market fiyatlarıyla birebir uyumludur.
 * Alış fiyatları yaklaşık; kâr/zarar canlı kur ile hesaplanır.
 */
export function getDemoInvestments() {
  return [
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}usd`,
      userId: "",
      symbol: "USDTRY",
      assetType: "FOREX",
      quantity: 2200,
      buyPriceTry: 40.85,
      note: "Demo: USD pozisyonu",
      paymentSource: "bank_account",
      cardId: null,
      sourceLabel: "Vadesiz TL",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}eur`,
      userId: "",
      symbol: "EURTRY",
      assetType: "FOREX",
      quantity: 950,
      buyPriceTry: 47.2,
      note: "Demo: EUR mevduat",
      paymentSource: "transfer_eft",
      cardId: null,
      sourceLabel: "",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}xau`,
      userId: "",
      symbol: "XAUTRY",
      assetType: "METAL",
      quantity: 1.25,
      buyPriceTry: 198500,
      note: "Demo: altın (ons)",
      paymentSource: "cash",
      cardId: null,
      sourceLabel: "",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}btc`,
      userId: "",
      symbol: "BTCTRY",
      assetType: "CRYPTO",
      quantity: 0.018,
      buyPriceTry: 2750000,
      note: "Demo: Bitcoin",
      paymentSource: "investment_platform",
      cardId: null,
      sourceLabel: "Binance",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}eth`,
      userId: "",
      symbol: "ETHTRY",
      assetType: "CRYPTO",
      quantity: 0.65,
      buyPriceTry: 86500,
      note: "Demo: Ethereum",
      paymentSource: "investment_platform",
      cardId: null,
      sourceLabel: "Paribu",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
    {
      id: `${DEMO_INVESTMENT_ID_PREFIX}xrp`,
      userId: "",
      symbol: "XRPTRY",
      assetType: "CRYPTO",
      quantity: 220,
      buyPriceTry: 52.5,
      note: "Demo: XRP",
      paymentSource: "investment_platform",
      cardId: null,
      sourceLabel: "Binance",
      card: null,
      createdAt: ISO,
      updatedAt: ISO,
    },
  ];
}
