/**
 * Demo chatbot expense verisi.
 * Tekrar çalıştırıldığında hedef ay için aynı kayıtları çoğaltmaz.
 *
 * Kullanım:
 *   npm run seed:chatbot
 *   SEED_CHATBOT_EMAIL=you@mail.com npm run seed:chatbot
 *   SEED_CHATBOT_EMAIL=you@mail.com SEED_CHATBOT_MONTH=2026-06 npm run seed:chatbot
 */
const { PrismaClient, ExpenseCategory } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@finwise.local';
const DEMO_PASSWORD = 'demo1234';
const DEMO_MARKER = '[finwise-chatbot-demo]';

const DEMO_EXPENSES = [
  { category: ExpenseCategory.GIDA, amount: 1250, label: 'Gıda', day: 3 },
  { category: ExpenseCategory.ULASIM, amount: 850, label: 'Ulaşım', day: 7 },
  { category: ExpenseCategory.FATURA, amount: 1450, label: 'Fatura', day: 10 },
  { category: ExpenseCategory.EGLENCE, amount: 600, label: 'Eğlence', day: 14 },
  { category: ExpenseCategory.DIGER, amount: 2200, label: 'Alışveriş', day: 18 },
];

function parseTargetMonth() {
  const raw = process.env.SEED_CHATBOT_MONTH?.trim();
  if (raw) {
    const match = /^(\d{4})-(\d{2})$/.exec(raw);
    if (!match) {
      throw new Error('SEED_CHATBOT_MONTH YYYY-MM formatında olmalıdır. Örn: 2026-06');
    }
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error('SEED_CHATBOT_MONTH geçersiz ay.');
    }
    return { year, monthIndex };
  }

  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

/** chatbotService.js ile aynı mantık; SEED_CHATBOT_MONTH ile sabit ay seçilebilir */
function getTargetMonthRange() {
  const { year, monthIndex } = parseTargetMonth();
  const startOfMonth = new Date(year, monthIndex, 1);
  const startOfNextMonth = new Date(year, monthIndex + 1, 1);
  return { startOfMonth, startOfNextMonth, year, monthIndex };
}

function formatLocalMonthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatLocalMonthLabel(date) {
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function expenseDateForDay(day, year, monthIndex) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return new Date(year, monthIndex, safeDay, 12, 0, 0, 0);
}

function demoDescription(label) {
  return `${DEMO_MARKER} ${label}`;
}

async function resolveTargetUser() {
  const targetEmail = process.env.SEED_CHATBOT_EMAIL?.trim();

  if (targetEmail) {
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      throw new Error(`Kullanıcı bulunamadı: ${targetEmail}`);
    }
    return user;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: 'Demo Kullanıcı',
      email: DEMO_EMAIL,
      passwordHash,
      role: 'USER',
    },
  });
}

async function seedDemoExpenses(userId) {
  const { startOfMonth, startOfNextMonth, year, monthIndex } = getTargetMonthRange();
  let inserted = 0;
  let skipped = 0;

  for (const item of DEMO_EXPENSES) {
    const description = demoDescription(item.label);
    const existing = await prisma.expense.findFirst({
      where: {
        userId,
        category: item.category,
        description,
        date: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.expense.create({
      data: {
        userId,
        amount: item.amount,
        category: item.category,
        date: expenseDateForDay(item.day, year, monthIndex),
        description,
      },
    });
    inserted += 1;
  }

  return { inserted, skipped };
}

async function main() {
  const user = await resolveTargetUser();
  const { startOfMonth } = getTargetMonthRange();
  const { inserted, skipped } = await seedDemoExpenses(user.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name },
        month: formatLocalMonthKey(startOfMonth),
        monthLabel: formatLocalMonthLabel(startOfMonth),
        inserted,
        skipped,
        totalDemoExpenses: DEMO_EXPENSES.length,
        expectedMonthlyTotal: DEMO_EXPENSES.reduce((sum, row) => sum + row.amount, 0),
        note:
          skipped === DEMO_EXPENSES.length
            ? 'Bu ay için demo kayıtlar zaten mevcut; yeni kayıt eklenmedi.'
            : 'Eksik demo kayıtlar eklendi.',
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
