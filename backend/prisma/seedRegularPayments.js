/**
 * Sadece senanurceylan001@gmail.com için düzenli ödeme test verisi.
 * Kullanıcı yoksa işlem durur (fallback yok).
 *
 * Çalıştırma: npm run db:seed:regular-payments
 */
require('dotenv').config();

const { PrismaClient, RegularPaymentStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_EMAIL = 'senanurceylan001@gmail.com';

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(base, days) {
  const x = new Date(base);
  x.setDate(x.getDate() + days);
  return startOfDay(x);
}

function atTime(d, hour, minute = 0) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0, 0);
}

function reminderAt(dueDate, daysBefore, hour = 9) {
  return atTime(addDays(dueDate, -daysBefore), hour);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) {
    throw new Error(
      `Kullanıcı bulunamadı: ${TARGET_EMAIL}. Önce bu e-posta ile kayıt olun.`
    );
  }

  const today = startOfDay(new Date());

  const definitions = [
    {
      title: 'Spotify',
      category: 'Abonelik',
      amount: 59.99,
      payment_day: 5,
      reminder_days_before: 2,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 2),
      last_paid_at: null,
      last_reminded_at: null,
    },
    {
      title: 'Netflix',
      category: 'Abonelik',
      amount: 149.9,
      payment_day: 12,
      reminder_days_before: 3,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 1),
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -2), 8, 30),
    },
    {
      title: 'Kira',
      category: 'Kira',
      amount: 18500,
      payment_day: 1,
      reminder_days_before: 5,
      status: RegularPaymentStatus.paid,
      next_due_date: addDays(today, 25),
      last_paid_at: atTime(addDays(today, -5), 10),
      last_reminded_at: atTime(addDays(today, -8), 9),
    },
    {
      title: 'Elektrik',
      category: 'Fatura',
      amount: 847.35,
      payment_day: 15,
      reminder_days_before: 4,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, -6),
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -10), 8),
    },
    {
      title: 'Su',
      category: 'Fatura',
      amount: 218.5,
      payment_day: 8,
      reminder_days_before: 2,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, -3),
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -5), 7, 15),
    },
    {
      title: 'Doğalgaz',
      category: 'Fatura',
      amount: 1198.0,
      payment_day: 20,
      reminder_days_before: 3,
      status: RegularPaymentStatus.paid,
      next_due_date: addDays(today, 18),
      last_paid_at: atTime(addDays(today, -12), 11),
      last_reminded_at: atTime(addDays(today, -15), 9),
    },
    {
      title: 'İnternet',
      category: 'Fatura',
      amount: 449.99,
      payment_day: 10,
      reminder_days_before: 2,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 3),
      last_paid_at: null,
      last_reminded_at: null,
    },
    {
      title: 'Telefon',
      category: 'Fatura',
      amount: 389.0,
      payment_day: 14,
      reminder_days_before: 1,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 7),
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -1), 8),
    },
    {
      title: 'YouTube Premium',
      category: 'Abonelik',
      amount: 39.99,
      payment_day: 22,
      reminder_days_before: 1,
      status: RegularPaymentStatus.paid,
      next_due_date: addDays(today, 26),
      last_paid_at: atTime(addDays(today, -4), 14),
      last_reminded_at: atTime(addDays(today, -5), 10),
    },
    {
      title: 'Amazon Prime',
      category: 'Abonelik',
      amount: 39.0,
      payment_day: 3,
      reminder_days_before: 2,
      status: RegularPaymentStatus.pending,
      next_due_date: today,
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -2), 9),
    },
    {
      title: 'Yurt / Aidat',
      category: 'Eğitim',
      amount: 3500,
      payment_day: 5,
      reminder_days_before: 7,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, -8),
      last_paid_at: null,
      last_reminded_at: atTime(addDays(today, -15), 8),
    },
    {
      title: 'Gym üyeliği',
      category: 'Spor',
      amount: 899.0,
      payment_day: 18,
      reminder_days_before: 2,
      status: RegularPaymentStatus.paid,
      next_due_date: addDays(today, 11),
      last_paid_at: atTime(addDays(today, -7), 12),
      last_reminded_at: atTime(addDays(today, -9), 10),
    },
    {
      title: 'Apple iCloud',
      category: 'Abonelik',
      amount: 24.99,
      payment_day: 25,
      reminder_days_before: 1,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 5),
      last_paid_at: null,
      last_reminded_at: null,
    },
    {
      title: 'Dijital gazete',
      category: 'Diğer',
      amount: 129.0,
      payment_day: 7,
      reminder_days_before: 2,
      status: RegularPaymentStatus.pending,
      next_due_date: addDays(today, 2),
      last_paid_at: null,
      last_reminded_at: atTime(today, 7, 45),
    },
  ];

  const createdAtBase = atTime(addDays(today, -100), 10);

  const data = definitions.map((def, i) => {
    const nextReminderAt = reminderAt(def.next_due_date, def.reminder_days_before, 8 + (i % 4));
    const createdAt = atTime(addDays(createdAtBase, i * 3), 10 + (i % 5));
    const updatedAt = atTime(today, 9 + (i % 6));

    return {
      userId: user.id,
      title: def.title,
      category: def.category,
      amount: def.amount,
      paymentDay: def.payment_day,
      reminderDaysBefore: def.reminder_days_before,
      status: def.status,
      lastPaidAt: def.last_paid_at,
      nextDueDate: def.next_due_date,
      nextReminderAt,
      lastRemindedAt: def.last_reminded_at,
      isActive: true,
      createdAt,
      updatedAt,
    };
  });

  await prisma.regularPayment.deleteMany({ where: { userId: user.id } });
  await prisma.regularPayment.createMany({ data });

  const count = await prisma.regularPayment.count({ where: { userId: user.id } });

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: TARGET_EMAIL,
        userId: user.id,
        inserted: data.length,
        totalForUser: count,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
