/**
 * Örnek kullanıcı ve harcama verisi.
 * Çalıştırma: node prisma/seed.js (veya npm run db:seed)
 */
const { PrismaClient, ExpenseCategory } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@finwise.local' },
    update: {},
    create: {
      name: 'Demo Kullanıcı',
      email: 'demo@finwise.local',
      passwordHash: hash,
      role: 'USER',
    },
  });

  const count = await prisma.expense.count({ where: { userId: user.id } });
  if (count === 0) {
    await prisma.expense.createMany({
      data: [
        { userId: user.id, amount: 45.99, category: ExpenseCategory.GIDA, date: new Date('2025-03-01'), description: 'Market alışverişi' },
        { userId: user.id, amount: 29.5, category: ExpenseCategory.ULASIM, date: new Date('2025-03-02'), description: 'Yakıt' },
      ],
    });
  }

  console.log('Seed tamamlandı. Demo: demo@finwise.local / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
