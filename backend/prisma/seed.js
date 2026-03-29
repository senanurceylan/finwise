/**
 * Kullanım: npm run db:seed
 * Opsiyonel: SEED_USER_EMAIL=you@mail.com veya SEED_USER_ID=clxxx
 * (yoksa demo@finwise.local kullanıcısı oluşturulur / kullanılır)
 */
const { PrismaClient, ExpenseCategory } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const BUCKETS = [
  {
    label: 'Market',
    category: ExpenseCategory.GIDA,
    min: 45,
    max: 2800,
    descriptions: [
      'Migros haftalık alışveriş',
      'A101 temel gıda',
      'BİM market',
      'Şok indirimli ürünler',
      'CarrefourSA',
      'Geleneksel pazar',
      'Organik ürünler',
      'İçecek ve atıştırmalık',
    ],
  },
  {
    label: 'Yeme İçme',
    category: ExpenseCategory.GIDA,
    min: 35,
    max: 850,
    descriptions: [
      'Kahve molası',
      'Öğle yemeği restoran',
      'Fast food',
      'Pizza siparişi',
      'Kahvaltı cafe',
      'Akşam yemeği',
      'Sokak lezzeti',
      'Pastane',
    ],
  },
  {
    label: 'Ulaşım',
    category: ExpenseCategory.ULASIM,
    min: 8,
    max: 1200,
    descriptions: [
      'Benzin',
      'Toplu taşıma bakiye',
      'Taksi',
      'Otopark ücreti',
      'Otoyol geçiş',
      'Uber',
      'Bisiklet servisi',
      'Araç bakımı',
    ],
  },
  {
    label: 'Fatura',
    category: ExpenseCategory.FATURA,
    min: 120,
    max: 4200,
    descriptions: [
      'Elektrik faturası',
      'Doğalgaz',
      'İnternet ADSL',
      'Cep telefonu faturası',
      'Su faturası',
      'Dijital abonelik',
      'TV yayın paketi',
    ],
  },
  {
    label: 'Eğlence',
    category: ExpenseCategory.EGLENCE,
    min: 50,
    max: 1800,
    descriptions: [
      'Sinema biletleri',
      'Konser',
      'Netflix',
      'Spor salonu günlük',
      'Kitap / dergi',
      'Oyun platformu',
      'Müze giriş',
    ],
  },
  {
    label: 'Teknoloji',
    category: ExpenseCategory.TEKNOLOJIK_ALET,
    min: 99,
    max: 18500,
    descriptions: [
      'Kulaklık',
      'Telefon aksesuarı',
      'Bilgisayar parçası',
      'Yazılım lisansı',
      'Bulut depolama',
      'E-kitap okuyucu',
      'Tablet kılıfı',
    ],
  },
  {
    label: 'Sağlık',
    category: ExpenseCategory.DIGER,
    min: 80,
    max: 3500,
    descriptions: [
      'Eczane',
      'Doktor muayenesi',
      'Laboratuvar tahlili',
      'Diş hekimi',
      'Fizyoterapi',
      'Gözlük camı',
      'Vitamin takviyesi',
    ],
  },
  {
    label: 'Kira',
    category: ExpenseCategory.DIGER,
    min: 7500,
    max: 28000,
    descriptions: [
      'Aylık kira ödemesi',
      'Konut kirası',
      'Aidat ile birlikte kira',
      'Depozito taksidi',
    ],
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function randomDateBetween(start, end) {
  const a = start.getTime();
  const b = end.getTime();
  return new Date(a + Math.random() * (b - a));
}

function atSameDayRandomTime(d) {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    9 + Math.floor(Math.random() * 10),
    Math.floor(Math.random() * 60),
    0,
    0
  );
}

async function resolveUserId() {
  const email = process.env.SEED_USER_EMAIL?.trim();
  const id = process.env.SEED_USER_ID?.trim();

  if (id) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw new Error(`SEED_USER_ID bulunamadı: ${id}`);
    return u.id;
  }

  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) throw new Error(`SEED_USER_EMAIL bulunamadı: ${email}`);
    return u.id;
  }

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
  return user.id;
}

async function main() {
  const userId = await resolveUserId();

  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);

  const total = 50 + Math.floor(Math.random() * 51);
  const per = Math.floor(total / BUCKETS.length);
  let rem = total % BUCKETS.length;

  const rows = [];
  for (let b = 0; b < BUCKETS.length; b += 1) {
    const n = per + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    const bucket = BUCKETS[b];
    for (let j = 0; j < n; j += 1) {
      const day = randomDateBetween(start, end);
      const ts = atSameDayRandomTime(day);
      rows.push({
        userId,
        amount: randomAmount(bucket.min, bucket.max),
        category: bucket.category,
        date: new Date(day.getFullYear(), day.getMonth(), day.getDate()),
        description: pick(bucket.descriptions),
        createdAt: ts,
        updatedAt: ts,
      });
    }
  }

  for (let i = rows.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.expense.createMany({ data: rows });

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        inserted: rows.length,
        dateRange: { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) },
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
