const z = require('zod');
const { PAYMENT_SOURCES } = require('../constants/paymentSources');

const paymentSourceSchema = z.enum(PAYMENT_SOURCES, {
  errorMap: () => ({ message: 'Ödeme kaynağı geçersiz.' }),
});

const createRegularPaymentSchema = z.object({
  user_id: z.string().min(1, 'Kullanıcı bilgisi gerekli.'),
  title: z.string().trim().min(1, 'Ödeme adı zorunludur.').max(120),
  category: z.string().trim().min(1, 'Kategori zorunludur.').max(60),
  amount: z.coerce.number().positive('Tutar pozitif olmalıdır.'),
  payment_day: z.coerce.number().int().min(1).max(31),
  reminder_days_before: z.coerce.number().int().min(0).max(31).default(1),
  paymentSource: paymentSourceSchema.optional(),
  cardId: z.union([z.string().min(1), z.null()]).optional(),
});

function validateCreateRegularPayment(body) {
  return createRegularPaymentSchema.safeParse(body);
}

module.exports = { validateCreateRegularPayment };
