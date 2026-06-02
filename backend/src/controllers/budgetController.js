const { prisma } = require('../utils/prisma');
const { validateCreateBudget } = require('../validators/budgetValidator');

/** Geçici in-memory bütçe deposu (userId -> category -> limit kaydı) */
const budgetsByUser = new Map();

function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startOfMonth, startOfNextMonth };
}

function getUserBudgetStore(userId) {
  if (!budgetsByUser.has(userId)) {
    budgetsByUser.set(userId, new Map());
  }
  return budgetsByUser.get(userId);
}

function serializeBudget(row) {
  return {
    category: row.category,
    monthlyLimit: row.monthlyLimit,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
    const store = getUserBudgetStore(req.userId);
    const now = new Date().toISOString();
    const existing = store.get(category);

    const row = {
      category,
      monthlyLimit,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    store.set(category, row);

    return res.status(201).json({
      success: true,
      data: serializeBudget(row),
    });
  } catch (e) {
    return next(e);
  }
}

async function status(req, res, next) {
  try {
    const { startOfMonth, startOfNextMonth } = getCurrentMonthRange();
    const store = getUserBudgetStore(req.userId);
    const budgets = [...store.values()].sort((a, b) => a.category.localeCompare(b.category));

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
      spentByCategory.map((row) => [row.category, Number(row._sum.amount || 0)])
    );

    const data = budgets.map((budget) => {
      const monthlyLimit = Number(budget.monthlyLimit);
      const spent = spentMap[budget.category] ?? 0;
      const usagePercent = Math.round((spent / monthlyLimit) * 100);
      const { status: budgetStatus, message } = resolveUsageStatus(usagePercent);

      return {
        category: budget.category,
        monthlyLimit,
        spent,
        usagePercent,
        status: budgetStatus,
        message,
      };
    });

    return res.json({
      success: true,
      data,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  create,
  status,
};
