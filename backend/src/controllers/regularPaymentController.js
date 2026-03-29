const { prisma } = require('../utils/prisma');
const { validateCreateRegularPayment } = require('../validators/regularPaymentValidator');
const { assertCardOwnedByUser } = require('../utils/cardAccess');
const { normalizePaymentSourceAndCard } = require('../utils/paymentSourceNormalize');

function serializeRegularPayment(payment) {
  return {
    id: payment.id,
    user_id: payment.userId,
    title: payment.title,
    category: payment.category,
    amount: Number(payment.amount),
    payment_day: payment.paymentDay,
    reminder_days_before: payment.reminderDaysBefore,
    status: payment.status,
    last_paid_at: payment.lastPaidAt ? payment.lastPaidAt.toISOString() : null,
    next_due_date: payment.nextDueDate ? payment.nextDueDate.toISOString().slice(0, 10) : null,
    next_reminder_at: payment.nextReminderAt ? payment.nextReminderAt.toISOString() : null,
    last_reminded_at: payment.lastRemindedAt ? payment.lastRemindedAt.toISOString() : null,
    is_active: payment.isActive,
    payment_source: payment.paymentSource,
    card_id: payment.cardId || null,
    card: payment.card
      ? {
          cardName: payment.card.cardName,
          bankName: payment.card.bankName,
          last4Digits: payment.card.last4Digits,
        }
      : null,
    created_at: payment.createdAt.toISOString(),
    updated_at: payment.updatedAt.toISOString(),
  };
}

function calculateNextDueDate(paymentDay, baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), maxDay);
  const currentMonthDue = new Date(year, month, safeDay);
  if (currentMonthDue >= new Date(year, month, baseDate.getDate())) {
    return currentMonthDue;
  }
  const nextMonthMaxDay = new Date(year, month + 2, 0).getDate();
  const nextSafeDay = Math.min(Math.max(Number(paymentDay) || 1, 1), nextMonthMaxDay);
  return new Date(year, month + 1, nextSafeDay);
}

async function list(req, res, next) {
  try {
    const payments = await prisma.regularPayment.findMany({
      where: { userId: req.userId },
      orderBy: [{ createdAt: 'desc' }],
      include: { card: true },
    });
    return res.json(payments.map(serializeRegularPayment));
  } catch (e) {
    return next(e);
  }
}

async function create(req, res, next) {
  const parsed = validateCreateRegularPayment(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors[0]?.message || 'Geçersiz veri.',
      details: parsed.error.errors,
    });
  }

  const data = parsed.data;
  if (data.user_id !== req.userId) {
    return res.status(403).json({ success: false, error: 'Kullanıcı eşleşmiyor.' });
  }

  try {
    const { paymentSource, cardId } = normalizePaymentSourceAndCard(
      data.paymentSource,
      data.cardId,
      'automatic_payment'
    );
    if (cardId) {
      await assertCardOwnedByUser(cardId, req.userId);
    }

    const nextDueDate = calculateNextDueDate(data.payment_day, new Date());
    const nextReminderAt = new Date(
      nextDueDate.getTime() - data.reminder_days_before * 24 * 60 * 60 * 1000
    );

    const payment = await prisma.regularPayment.create({
      data: {
        userId: req.userId,
        title: data.title,
        category: data.category,
        amount: data.amount,
        paymentDay: data.payment_day,
        reminderDaysBefore: data.reminder_days_before,
        status: 'pending',
        nextDueDate,
        nextReminderAt,
        isActive: true,
        paymentSource,
        cardId,
      },
      include: { card: true },
    });
    return res.status(201).json(serializeRegularPayment(payment));
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ success: false, error: e.message });
    }
    return next(e);
  }
}

async function markPaid(req, res, next) {
  const { id } = req.params;
  try {
    const existing = await prisma.regularPayment.findFirst({
      where: { id, userId: req.userId },
      include: { card: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Düzenli ödeme bulunamadı.' });
    }

    const now = new Date();
    const nextDueDate = calculateNextDueDate(existing.paymentDay, now);
    const nextReminderAt = new Date(
      nextDueDate.getTime() - existing.reminderDaysBefore * 24 * 60 * 60 * 1000
    );
    const updated = await prisma.regularPayment.update({
      where: { id },
      data: {
        status: 'paid',
        lastPaidAt: now,
        nextDueDate,
        nextReminderAt,
      },
      include: { card: true },
    });
    return res.json(serializeRegularPayment(updated));
  } catch (e) {
    return next(e);
  }
}

async function remove(req, res, next) {
  const { id } = req.params;
  try {
    const existing = await prisma.regularPayment.findFirst({
      where: { id, userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Düzenli ödeme bulunamadı.' });
    }
    await prisma.regularPayment.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, markPaid, remove };
