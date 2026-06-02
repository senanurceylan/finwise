const { Prisma } = require('@prisma/client');
const { prisma } = require('../utils/prisma');
const {
  validateCreateBudget,
  validateUpdateBudget,
  validateBudgetCategoryParam,
} = require('../validators/budgetValidator');

function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startOfMonth, startOfNextMonth };
}

function serializeBudget(row) {
  return {
    id: row.id,
    category: row.category,
    monthlyLimit: toNumber(row.monthlyLimit),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function resolveUsageStatus(usagePercent) {
  if (usagePercent >= 100) {
    return { status: 'exceeded', message: 'Aylık limitinizi aştınız.' };
  }
  if (usagePercent >= 80) {
    return { status: 'warning', message: 'Limitinize yaklaştınız.' };
  }
  return { status: 'safe', message: 'Harcamalarınız limit dahilinde.' };
}

function buildStatusRow(budget, spentMap) {
  const monthlyLimit = toNumber(budget.monthlyLimit);
  const spent = spentMap[budget.category] ?? 0;
  const usagePercent =
    monthlyLimit > 0 ? Math.round((spent / monthlyLimit) * 100) : 0;
  const { status, message } = resolveUsageStatus(usagePercent);

  return {
    id: budget.id,
    category: budget.category,
    monthlyLimit,
    spent,
    usagePercent,
    status,
    message,
  };
}

async function findOwnedBudget(userId, category) {
  return prisma.budget.findUnique({
    where: {
      userId_category: { userId, category },
    },
  });
}

async function list(req, res, next) {
  try {
    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId },
      orderBy: { category: 'asc' },
    });

    return res.json({
      success: true,
      data: budgets.map(serializeBudget),
    });
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  const parsed = validateCreateBudget(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz veri.',
      details: parsed.error.errors,
    });
  }

  const { category, monthlyLimit } = parsed.data;

  try {
    const row = await prisma.budget.upsert({
      where: {
        userId_category: {
          userId: req.userId,
          category,
        },
      },
      create: {
        userId: req.userId,
        category,
        monthlyLimit,
      },
      update: {
        monthlyLimit,
      },
    });

    return res.status(201).json({
      success: true,
      data: serializeBudget(row),
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Bu kategori için bütçe zaten tanımlı.',
      });
    }
    return next(e);
  }
}

async function update(req, res, next) {
  const categoryParsed = validateBudgetCategoryParam(req.params.category);
  if (!categoryParsed.success) {
    return res.status(400).json({
      success: false,
      error: categoryParsed.error.errors[0]?.message || 'Geçersiz kategori.',
    });
  }

  const bodyParsed = validateUpdateBudget(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      success: false,
      error: bodyParsed.error.errors[0]?.message || 'Geçersiz veri.',
      details: bodyParsed.error.errors,
    });
  }

  const category = categoryParsed.data;
  const { monthlyLimit } = bodyParsed.data;

  try {
    const existing = await findOwnedBudget(req.userId, category);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Bütçe bulunamadı.',
      });
    }

    const row = await prisma.budget.update({
      where: {
        userId_category: {
          userId: req.userId,
          category,
        },
      },
      data: { monthlyLimit },
    });

    return res.json({
      success: true,
      data: serializeBudget(row),
    });
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  const categoryParsed = validateBudgetCategoryParam(req.params.category);
  if (!categoryParsed.success) {
    return res.status(400).json({
      success: false,
      error: categoryParsed.error.errors[0]?.message || 'Geçersiz kategori.',
    });
  }

  const category = categoryParsed.data;

  try {
    const existing = await findOwnedBudget(req.userId, category);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Bütçe bulunamadı.',
      });
    }

    await prisma.budget.delete({
      where: {
        userId_category: {
          userId: req.userId,
          category,
        },
      },
    });

    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}

async function status(req, res, next) {
  try {
    const { startOfMonth, startOfNextMonth } = getCurrentMonthRange();

    const budgets = await prisma.budget.findMany({
      where: { userId: req.userId },
      orderBy: { category: 'asc' },
    });

    if (budgets.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const spentByCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId: req.userId,
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      _sum: { amount: true },
    });

    const spentMap = Object.fromEntries(
      spentByCategory.map((row) => [row.category, toNumber(row._sum.amount)])
    );

    const data = budgets.map((budget) => buildStatusRow(budget, spentMap));

    return res.json({
      success: true,
      data,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  status,
};
