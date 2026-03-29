const { z } = require('zod');
const { SUPPORTED_MARKET_SYMBOLS } = require('../services/marketPrices');
const { PAYMENT_SOURCES } = require('../constants/paymentSources');

const ASSET_TYPES = ['FOREX', 'CRYPTO', 'METAL'];
const SUPPORTED_SYMBOLS = SUPPORTED_MARKET_SYMBOLS;

const paymentSourceSchema = z.enum(PAYMENT_SOURCES, {
  errorMap: () => ({ message: 'Ödeme kaynağı geçersiz.' }),
});

const createInvestmentSchema = z.object({
  symbol: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => SUPPORTED_SYMBOLS.includes(value), 'Desteklenmeyen varlık sembolü.'),
  assetType: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => ASSET_TYPES.includes(value), 'Geçersiz varlık tipi.'),
  quantity: z.coerce.number().positive('Miktar 0\'dan büyük olmalı.'),
  buyPriceTry: z.coerce.number().nonnegative('Alış fiyatı negatif olamaz.'),
  note: z.string().trim().max(300, 'Not en fazla 300 karakter olabilir.').optional(),
  paymentSource: paymentSourceSchema.optional(),
  cardId: z.union([z.string().min(1), z.null()]).optional(),
  sourceLabel: z.string().trim().max(120, 'Kaynak etiketi en fazla 120 karakter.').optional().nullable(),
});

const updateInvestmentSchema = createInvestmentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Güncelleme için en az bir alan göndermelisiniz.'
);

module.exports = {
  ASSET_TYPES,
  SUPPORTED_SYMBOLS,
  validateCreateInvestment: (payload) => createInvestmentSchema.safeParse(payload),
  validateUpdateInvestment: (payload) => updateInvestmentSchema.safeParse(payload),
};
