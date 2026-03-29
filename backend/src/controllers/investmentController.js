const { prisma } = require('../utils/prisma');
const { validateCreateInvestment, validateUpdateInvestment } = require('../validators/investmentValidator');
const { assertCardOwnedByUser } = require('../utils/cardAccess');
const { normalizePaymentSourceAndCard } = require('../utils/paymentSourceNormalize');

function toPayload(item) {
  return {
    id: item.id,
    userId: item.userId,
    symbol: item.symbol,
    assetType: item.assetType,
    quantity: Number(item.quantity),
    buyPriceTry: Number(item.buyPriceTry),
    note: item.note || '',
    paymentSource: item.paymentSource,
    cardId: item.cardId || null,
    sourceLabel: item.sourceLabel || '',
    card: item.card
      ? {
          cardName: item.card.cardName,
          bankName: item.card.bankName,
          last4Digits: item.card.last4Digits,
        }
      : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function list(req, res, next) {
  try {
    const items = await prisma.userInvestment.findMany({
      where: { userId: req.userId },
      orderBy: [{ createdAt: 'desc' }],
      include: { card: true },
    });
    return res.json(items.map(toPayload));
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  const parsed = validateCreateInvestment(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz yatırım verisi.',
      details: parsed.error.errors,
    });
  }

  try {
    const { paymentSource, cardId } = normalizePaymentSourceAndCard(
      parsed.data.paymentSource,
      parsed.data.cardId,
      'investment_platform'
    );
    if (cardId) {
      await assertCardOwnedByUser(cardId, req.userId);
    }

    const created = await prisma.userInvestment.create({
      data: {
        userId: req.userId,
        symbol: parsed.data.symbol,
        assetType: parsed.data.assetType,
        quantity: parsed.data.quantity,
        buyPriceTry: parsed.data.buyPriceTry,
        note: parsed.data.note || null,
        paymentSource,
        cardId,
        sourceLabel: parsed.data.sourceLabel?.trim() || null,
      },
      include: { card: true },
    });
    return res.status(201).json(toPayload(created));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

async function update(req, res, next) {
  const { id } = req.params;
  const parsed = validateUpdateInvestment(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz güncelleme verisi.',
      details: parsed.error.errors,
    });
  }

  try {
    const existing = await prisma.userInvestment.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Yatırım kaydı bulunamadı.' });
    }

    const data = {};
    if (parsed.data.symbol) data.symbol = parsed.data.symbol;
    if (parsed.data.assetType) data.assetType = parsed.data.assetType;
    if (parsed.data.quantity != null) data.quantity = parsed.data.quantity;
    if (parsed.data.buyPriceTry != null) data.buyPriceTry = parsed.data.buyPriceTry;
    if (parsed.data.note !== undefined) data.note = parsed.data.note || null;
    if (parsed.data.sourceLabel !== undefined) data.sourceLabel = parsed.data.sourceLabel?.trim() || null;

    if (parsed.data.paymentSource !== undefined || parsed.data.cardId !== undefined) {
      const { paymentSource, cardId } = normalizePaymentSourceAndCard(
        parsed.data.paymentSource ?? existing.paymentSource,
        parsed.data.cardId !== undefined ? parsed.data.cardId : existing.cardId,
        'investment_platform'
      );
      data.paymentSource = paymentSource;
      data.cardId = cardId;
      if (cardId) {
        await assertCardOwnedByUser(cardId, req.userId);
      }
    }

    const updated = await prisma.userInvestment.update({
      where: { id },
      data,
      include: { card: true },
    });

    return res.json(toPayload(updated));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

async function remove(req, res, next) {
  const { id } = req.params;
  try {
    const existing = await prisma.userInvestment.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Yatırım kaydı bulunamadı.' });
    }
    await prisma.userInvestment.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
