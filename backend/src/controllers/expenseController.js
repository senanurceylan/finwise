const { prisma } = require('../utils/prisma');
const { toEnum, toLabel } = require('../utils/categoryMap');
const { validateCreateExpense, validateUpdateExpense } = require('../validators/expenseValidator');

function serializeExpense(expense) {
  return {
    id: expense.id,
    amount: Number(expense.amount),
    category: toLabel(expense.category),
    date: expense.date.toISOString().slice(0, 10),
    description: expense.description || '',
    userId: expense.userId,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

async function list(req, res, next) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
    });
    return res.json(expenses.map(serializeExpense));
  } catch (e) {
    next(e);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const expense = await prisma.expense.findFirst({
      where: { id, userId: req.userId },
    });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Harcama bulunamadı.' });
    }
    return res.json(serializeExpense(expense));
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  const parsed = validateCreateExpense(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Geçersiz veri.', details: parsed.error.errors });
  }

  const { amount, category, date, description } = parsed.data;
  const categoryEnum = toEnum(category);
  if (!categoryEnum) {
    return res.status(400).json({ success: false, error: 'Geçersiz kategori.' });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        amount,
        category: categoryEnum,
        date: new Date(date),
        description: description || null,
        userId: req.userId,
      },
    });
    return res.status(201).json(serializeExpense(expense));
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Harcama bulunamadı.' });
  }

  const parsed = validateUpdateExpense(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || 'Geçersiz veri.' });
  }

  const data = {};
  if (parsed.data.amount != null) data.amount = parsed.data.amount;
  if (parsed.data.category != null) {
    const categoryEnum = toEnum(parsed.data.category);
    if (!categoryEnum) return res.status(400).json({ success: false, error: 'Geçersiz kategori.' });
    data.category = categoryEnum;
  }
  if (parsed.data.date != null) data.date = new Date(parsed.data.date);
  if (parsed.data.description !== undefined) data.description = parsed.data.description || null;

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data,
    });
    return res.json(serializeExpense(expense));
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  const { id } = req.params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: req.userId } });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Harcama bulunamadı.' });
  }
  try {
    await prisma.expense.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getById, create, update, remove };
