const z = require('zod');
const { VALID_CATEGORIES } = require('../utils/categoryMap');

const categorySchema = z.enum(VALID_CATEGORIES, {
  errorMap: () => ({ message: `Kategori şunlardan biri olmalı: ${VALID_CATEGORIES.join(', ')}` }),
});

const createExpenseSchema = z.object({
  amount: z.coerce.number().positive('Tutar pozitif olmalı.'),
  category: categorySchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalı.'),
  description: z.string().max(500).trim().optional().or(z.literal('')),
});

const updateExpenseSchema = createExpenseSchema.partial();

function validateCreateExpense(body) {
  return createExpenseSchema.safeParse(body);
}

function validateUpdateExpense(body) {
  return updateExpenseSchema.safeParse(body);
}

module.exports = { validateCreateExpense, validateUpdateExpense };
