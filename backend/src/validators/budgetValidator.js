const { z } = require('zod');
const { ExpenseCategory } = require('@prisma/client');

const createBudgetSchema = z.object({
  category: z.nativeEnum(ExpenseCategory, {
    errorMap: () => ({ message: 'Geçersiz kategori.' }),
  }),
  monthlyLimit: z
    .number({ invalid_type_error: 'Aylık limit sayı olmalıdır.' })
    .positive('Aylık limit 0\'dan büyük olmalıdır.'),
});

module.exports = {
  validateCreateBudget: (body) => createBudgetSchema.safeParse(body),
};
