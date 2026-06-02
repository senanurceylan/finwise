const { z } = require('zod');
const { ExpenseCategory } = require('@prisma/client');

const categorySchema = z.nativeEnum(ExpenseCategory, {
  errorMap: () => ({ message: 'Geçersiz kategori.' }),
});

const monthlyLimitSchema = z
  .number({ invalid_type_error: 'Aylık limit sayı olmalıdır.' })
  .positive('Aylık limit 0\'dan büyük olmalıdır.');

const createBudgetSchema = z.object({
  category: categorySchema,
  monthlyLimit: monthlyLimitSchema,
});

const updateBudgetSchema = z.object({
  monthlyLimit: monthlyLimitSchema,
});

function validateCreateBudget(body) {
  return createBudgetSchema.safeParse(body);
}

function validateUpdateBudget(body) {
  return updateBudgetSchema.safeParse(body);
}

function validateBudgetCategoryParam(category) {
  return categorySchema.safeParse(category);
}

module.exports = {
  validateCreateBudget,
  validateUpdateBudget,
  validateBudgetCategoryParam,
};
