const { prisma } = require('../utils/prisma');
const { validateCreateCard, validateUpdateCard } = require('../validators/cardValidator');

function serialize(card) {
  return {
    id: card.id,
    userId: card.userId,
    cardName: card.cardName,
    bankName: card.bankName,
    cardType: card.cardType,
    last4Digits: card.last4Digits,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

async function list(req, res, next) {
  try {
    const items = await prisma.paymentCard.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(items.map(serialize));
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  const parsed = validateCreateCard(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz veri.',
      details: parsed.error.errors,
    });
  }
  try {
    const row = await prisma.paymentCard.create({
      data: {
        userId: req.userId,
        cardName: parsed.data.cardName,
        bankName: parsed.data.bankName,
        cardType: parsed.data.cardType,
        last4Digits: parsed.data.last4Digits,
      },
    });
    return res.status(201).json(serialize(row));
  } catch (e) {
    return next(e);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  const parsed = validateUpdateCard(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz veri.',
    });
  }
  try {
    const existing = await prisma.paymentCard.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Kart bulunamadı.' });
    }
    const row = await prisma.paymentCard.update({
      where: { id },
      data: {
        ...(parsed.data.cardName != null ? { cardName: parsed.data.cardName } : {}),
        ...(parsed.data.bankName != null ? { bankName: parsed.data.bankName } : {}),
        ...(parsed.data.cardType != null ? { cardType: parsed.data.cardType } : {}),
        ...(parsed.data.last4Digits != null ? { last4Digits: parsed.data.last4Digits } : {}),
      },
    });
    return res.json(serialize(row));
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  const { id } = req.params;
  try {
    const existing = await prisma.paymentCard.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Kart bulunamadı.' });
    }
    await prisma.paymentCard.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update, remove };
