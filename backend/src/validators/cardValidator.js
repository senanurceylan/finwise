const { z } = require('zod');

const CARD_TYPES = ['credit', 'debit', 'commercial'];

const createCardSchema = z.object({
  cardName: z.string().trim().min(1, 'Kart adı gerekli.').max(80),
  bankName: z.string().trim().min(1, 'Banka adı gerekli.').max(80),
  cardType: z.enum(CARD_TYPES, { errorMap: () => ({ message: 'Geçersiz kart tipi.' }) }),
  last4Digits: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Son 4 hane 4 rakam olmalıdır.'),
});

const updateCardSchema = createCardSchema.partial().refine((o) => Object.keys(o).length > 0, {
  message: 'Güncelleme için en az bir alan gönderin.',
});

module.exports = {
  CARD_TYPES,
  validateCreateCard: (body) => createCardSchema.safeParse(body),
  validateUpdateCard: (body) => updateCardSchema.safeParse(body),
};
