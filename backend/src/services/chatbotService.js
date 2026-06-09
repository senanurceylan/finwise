const { prisma } = require('../utils/prisma');
const { toLabel } = require('../utils/categoryMap');

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
  return { startOfMonth, startOfNextMonth, now };
}

function formatTry(amount) {
  return `${toNumber(amount).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

function normalizeMessage(text) {
  return text.trim().toLocaleLowerCase('tr-TR');
}

function parseTurkishMoneyToken(raw) {
  let value = raw.trim();
  if (!value) return null;

  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(value)) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+(,\d{1,2})?$/.test(value)) {
    value = value.replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, '');
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePurchaseAmount(text) {
  const labeledMatch = text.match(
    /(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)\s*(?:tl|lira|₺)/i
  );
  if (labeledMatch) {
    return parseTurkishMoneyToken(labeledMatch[1]);
  }

  const spacedThousandsMatch = text.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  if (spacedThousandsMatch) {
    return parseTurkishMoneyToken(spacedThousandsMatch[1]);
  }

  const plainMatch = text.match(/\b(\d{4,})\b/);
  if (plainMatch) {
    return parseTurkishMoneyToken(plainMatch[1]);
  }

  return null;
}

function parseInstallmentCount(text) {
  const patterns = [
    /(\d+)\s*ay(?:lık|lik)?(?:\s*taksit(?:li|siz)?)?/,
    /(\d+)\s*taksit(?:li|siz)?(?:\s*ay)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const count = Number.parseInt(match[1], 10);
      if (Number.isFinite(count) && count > 0) return count;
    }
  }

  return null;
}

function isPurchaseEvaluationIntent(normalizedMessage) {
  const hasInstallmentHint =
    normalizedMessage.includes('taksit') || /\d+\s*ay\b/.test(normalizedMessage);
  const hasPurchaseHint =
    /mantıklı\s*mı/.test(normalizedMessage) ||
    /mantikli\s*mi/.test(normalizedMessage) ||
    /almalı\s*mı/.test(normalizedMessage) ||
    /almali\s*mi/.test(normalizedMessage) ||
    /bütçeme\s*uygun/.test(normalizedMessage) ||
    /butceme\s*uygun/.test(normalizedMessage) ||
    /geçmiş\s*verilerime\s*göre/.test(normalizedMessage) ||
    /gecmis\s*verilerime\s*gore/.test(normalizedMessage);

  const amount = parsePurchaseAmount(normalizedMessage);
  const installments = parseInstallmentCount(normalizedMessage);

  if (!amount || !installments) return false;

  return hasInstallmentHint || hasPurchaseHint;
}

function stripTrailingPunctuation(text) {
  return text.replace(/[!?.…,\s]+$/g, '').trim();
}

function isGreetingIntent(normalizedMessage) {
  const cleaned = stripTrailingPunctuation(normalizedMessage);
  const turkishGreetings = ['merhaba', 'selam'];
  const englishGreetings = ['hello', 'hi', 'hey'];

  if (turkishGreetings.some((g) => cleaned === g || cleaned.startsWith(`${g} `))) {
    return 'greeting_tr';
  }
  if (englishGreetings.some((g) => cleaned === g || cleaned.startsWith(`${g} `))) {
    return 'greeting_en';
  }

  return null;
}

function detectIntent(normalizedMessage) {
  const greetingIntent = isGreetingIntent(normalizedMessage);
  if (greetingIntent) {
    return greetingIntent;
  }

  if (isPurchaseEvaluationIntent(normalizedMessage)) {
    return 'purchase_evaluation';
  }

  if (
    normalizedMessage.includes('en çok hangi kategoriye harcadım') ||
    normalizedMessage.includes('en cok hangi kategoriye harcadim') ||
    (normalizedMessage.includes('kategori') &&
      (normalizedMessage.includes('en çok') || normalizedMessage.includes('en cok')))
  ) {
    return 'top_category';
  }

  if (
    normalizedMessage.includes('bu ay ne kadar harcadım') ||
    normalizedMessage.includes('bu ay ne kadar harcadim') ||
    normalizedMessage.includes('aylık harcamam') ||
    normalizedMessage.includes('aylik harcamam') ||
    normalizedMessage.includes('harcamalarım') ||
    normalizedMessage.includes('harcamalarim') ||
    normalizedMessage.includes('ne kadar harcadım') ||
    normalizedMessage.includes('ne kadar harcadim')
  ) {
    return 'monthly_spending';
  }

  if (
    normalizedMessage.includes('bütçemi aştım mı') ||
    normalizedMessage.includes('butcemi astim mi') ||
    normalizedMessage.includes('bütçe') ||
    normalizedMessage.includes('butce') ||
    normalizedMessage.includes('limit')
  ) {
    return 'budget_status';
  }

  if (
    normalizedMessage.includes('tasarruf önerisi ver') ||
    normalizedMessage.includes('tasarruf onerisi ver') ||
    normalizedMessage.includes('tasarruf')
  ) {
    return 'savings_tip';
  }

  return 'unknown';
}

function isMissingBudgetTableError(error) {
  if (error?.code === 'P2021') return true;
  const message = String(error?.message || '');
  const table = String(error?.meta?.table || '');
  return /does not exist/i.test(message) || /budgets/i.test(table);
}

async function loadUserBudgets(userId) {
  try {
    return await prisma.budget.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });
  } catch (error) {
    if (isMissingBudgetTableError(error)) {
      console.warn('[chatbot] budgets tablosu bulunamadı; budgets = [] kullanılıyor.');
      return [];
    }
    throw error;
  }
}

async function loadFinanceContext(userId) {
  const { startOfMonth, startOfNextMonth, now } = getCurrentMonthRange();
  const expenseWhere = {
    userId,
    date: {
      gte: startOfMonth,
      lt: startOfNextMonth,
    },
  };

  const [totalAgg, grouped, budgets] = await Promise.all([
    prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: expenseWhere,
      _sum: { amount: true },
    }),
    loadUserBudgets(userId),
  ]);

  const spentByCategory = Object.fromEntries(
    grouped.map((row) => [row.category, toNumber(row._sum.amount)])
  );

  let topCategory = null;
  let topCategoryAmount = 0;
  for (const row of grouped) {
    const amount = toNumber(row._sum.amount);
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      topCategory = row.category;
    }
  }

  const budgetStatuses = budgets.map((budget) => {
    const monthlyLimit = toNumber(budget.monthlyLimit);
    const spent = spentByCategory[budget.category] ?? 0;
    const usagePercent = monthlyLimit > 0 ? Math.round((spent / monthlyLimit) * 100) : 0;
    let status = 'safe';
    if (usagePercent >= 100) status = 'exceeded';
    else if (usagePercent >= 80) status = 'warning';

    return {
      category: budget.category,
      categoryLabel: toLabel(budget.category),
      monthlyLimit,
      spent,
      usagePercent,
      status,
    };
  });

  return {
    monthLabel: now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    totalSpent: toNumber(totalAgg._sum.amount),
    expenseCount: totalAgg._count.id ?? 0,
    topCategory,
    topCategoryLabel: topCategory ? toLabel(topCategory) : null,
    topCategoryAmount,
    spentByCategory,
    budgets,
    budgetStatuses,
  };
}

function replyMonthlySpending(context) {
  if (context.expenseCount === 0 || context.totalSpent <= 0) {
    return `${context.monthLabel} döneminde henüz kayıtlı harcamanız bulunmuyor.`;
  }

  return `${context.monthLabel} döneminde toplam ${formatTry(context.totalSpent)} harcama yaptınız (${context.expenseCount} işlem).`;
}

function replyTopCategory(context) {
  if (!context.topCategory || context.topCategoryAmount <= 0) {
    return `${context.monthLabel} döneminde harcama kaydı olmadığı için kategori analizi yapılamıyor.`;
  }

  return `${context.monthLabel} döneminde en çok ${context.topCategoryLabel} kategorisine harcama yaptınız: ${formatTry(context.topCategoryAmount)}.`;
}

function replyBudgetStatus(context) {
  if (context.budgetStatuses.length === 0) {
    return 'Henüz tanımlı bütçe limitiniz yok. Bütçe sayfasından kategori bazlı aylık limit ekleyebilirsiniz.';
  }

  const exceeded = context.budgetStatuses.filter((row) => row.status === 'exceeded');
  const warning = context.budgetStatuses.filter((row) => row.status === 'warning');
  const safe = context.budgetStatuses.filter((row) => row.status === 'safe');

  if (exceeded.length > 0) {
    const details = exceeded
      .map(
        (row) =>
          `${row.categoryLabel} (${formatTry(row.spent)} / ${formatTry(row.monthlyLimit)}, %${row.usagePercent})`
      )
      .join('; ');
    return `Evet, ${context.monthLabel} döneminde limiti aştığınız kategoriler var: ${details}.`;
  }

  if (warning.length > 0) {
    const details = warning
      .map(
        (row) =>
          `${row.categoryLabel} (${formatTry(row.spent)} / ${formatTry(row.monthlyLimit)}, %${row.usagePercent})`
      )
      .join('; ');
    return `${context.monthLabel} döneminde henüz limit aşımı yok; ancak şu kategorilerde limite yaklaştınız: ${details}.`;
  }

  const details = safe
    .map(
      (row) =>
        `${row.categoryLabel} (${formatTry(row.spent)} / ${formatTry(row.monthlyLimit)})`
    )
    .join('; ');

  return `${context.monthLabel} döneminde bütçe limitlerinizi aşmadınız. Durum: ${details}.`;
}

function replySavingsTip(context) {
  const tips = [];

  if (context.expenseCount === 0 && context.budgetStatuses.length === 0) {
    return 'Henüz yeterli harcama veya bütçe veriniz yok. Önce harcamalarınızı kaydedip kategori limitleri tanımlayın; ardından tasarruf önerileri kişiselleştirilebilir.';
  }

  if (context.topCategory && context.topCategoryAmount > 0) {
    tips.push(
      `Bu ay en yüksek harcamanız ${context.topCategoryLabel} kategorisinde (${formatTry(context.topCategoryAmount)}). Bu kategoride haftalık üst limit belirlemeyi düşünebilirsiniz.`
    );
  }

  const exceeded = context.budgetStatuses.filter((row) => row.status === 'exceeded');
  if (exceeded.length > 0) {
    tips.push(
      `Limit aşılan kategoriler: ${exceeded.map((row) => row.categoryLabel).join(', ')}. Bu alanlarda harcamayı azaltmak öncelikli olmalı.`
    );
  }

  const warning = context.budgetStatuses.filter((row) => row.status === 'warning');
  if (warning.length > 0) {
    tips.push(
      `Limite yaklaştığınız kategoriler: ${warning.map((row) => row.categoryLabel).join(', ')}. Ay sonuna kadar bu kategorilerde dikkatli olun.`
    );
  }

  tips.push('Abonelikleri gözden geçirmek ve aylık bütçe limiti belirlemek tasarruf sağlamaya yardımcı olabilir.');

  return tips.join(' ');
}

function replyPurchaseEvaluation(context, message) {
  const normalized = normalizeMessage(message);
  const totalAmount = parsePurchaseAmount(normalized);
  const installmentCount = parseInstallmentCount(normalized);

  if (!totalAmount || !installmentCount) {
    return 'Satın alma değerlendirmesi için mesajınızda hem tutar (örn. 100.000 TL) hem taksit sayısı (örn. 12 ay) belirtmelisiniz.';
  }

  const monthlyInstallment = totalAmount / installmentCount;
  const currentMonthlySpending = context.totalSpent;
  const newMonthlyLoad = currentMonthlySpending + monthlyInstallment;

  let comment = '';
  if (currentMonthlySpending <= 0) {
    comment =
      'Bu ay kayıtlı harcamanız olmadığı için karşılaştırma sınırlı; yine de aylık taksit tutarını planlamanız önemli.';
  } else if (monthlyInstallment > currentMonthlySpending * 0.5) {
    comment = 'Bu alışveriş aylık harcama yükünüzü ciddi artırabilir.';
  } else {
    comment = 'Mevcut harcama düzeninize göre daha yönetilebilir görünüyor.';
  }

  const disclaimer =
    'Gelir bilginiz olmadığı için bu sadece harcama geçmişinize göre yapılan basit bir değerlendirmedir.';

  return [
    'Satın alma değerlendirmesi:',
    `• Toplam ürün tutarı: ${formatTry(totalAmount)}`,
    `• Taksit sayısı: ${installmentCount} ay`,
    `• Aylık taksit tutarı: ${formatTry(monthlyInstallment)}`,
    `• Mevcut ay harcaması (${context.monthLabel}): ${formatTry(currentMonthlySpending)}`,
    `• Yeni toplam aylık yük (harcama + taksit): ${formatTry(newMonthlyLoad)}`,
    '',
    `Yorum: ${comment}`,
    disclaimer,
  ].join('\n');
}

function replyGreetingTr() {
  return 'Merhaba, ben FinWise Finans Asistanıyım. Harcamalarınız, bütçeniz ve tasarruf önerileriniz hakkında yardımcı olabilirim.';
}

function replyGreetingEn() {
  return 'Hello, I am the FinWise Finance Assistant. I can help with your expenses, budget and saving suggestions.';
}

function replyUnknown() {
  return 'Bu soruyu henüz anlayamadım. Şunları deneyebilirsiniz: "Bu ay ne kadar harcadım?", "En çok hangi kategoriye harcadım?", "Bütçemi aştım mı?", "Tasarruf önerisi ver", "100.000 TL ile 12 ay taksitli bir şey alacağım mantıklı mı?".';
}

async function buildReply(userId, message) {
  const normalized = normalizeMessage(message);
  const intent = detectIntent(normalized);
  const context = await loadFinanceContext(userId);

  switch (intent) {
    case 'greeting_tr':
      return replyGreetingTr();
    case 'greeting_en':
      return replyGreetingEn();
    case 'purchase_evaluation':
      return replyPurchaseEvaluation(context, message);
    case 'monthly_spending':
      return replyMonthlySpending(context);
    case 'top_category':
      return replyTopCategory(context);
    case 'budget_status':
      return replyBudgetStatus(context);
    case 'savings_tip':
      return replySavingsTip(context);
    default:
      return replyUnknown();
  }
}

module.exports = {
  buildReply,
  detectIntent,
  normalizeMessage,
  parsePurchaseAmount,
  parseInstallmentCount,
};
