const DEMO_BUDGET_SEED = [
  { category: 'GIDA', monthlyLimit: 8000, spent: 3200 },
  { category: 'ULASIM', monthlyLimit: 4000, spent: 1250 },
  { category: 'FATURA', monthlyLimit: 5000, spent: 2100 },
  { category: 'EGLENCE', monthlyLimit: 3000, spent: 2700 },
  { category: 'TEKNOLOJIK_ALET', monthlyLimit: 10000, spent: 0 },
  { category: 'DIGER', monthlyLimit: 5000, spent: 1300 },
];

let demoStore = null;

function cloneSeed() {
  return DEMO_BUDGET_SEED.map((row) => ({ ...row }));
}

function getDemoStore() {
  if (!demoStore) {
    demoStore = cloneSeed();
  }
  return demoStore;
}

function isMissingBudgetTableError(error) {
  if (error?.code === 'P2021' || error?.code === 'P2010') return true;
  const message = String(error?.message || '').toLowerCase();
  const table = String(error?.meta?.table || '').toLowerCase();
  return (
    /does not exist/i.test(message) ||
    /budgets/i.test(table) ||
    (message.includes('prisma') && message.includes('budget'))
  );
}

function resolveUsageStatus(usagePercent) {
  if (usagePercent >= 100) {
    return { status: 'exceeded', message: 'Limit aşıldı' };
  }
  if (usagePercent >= 80) {
    return { status: 'warning', message: 'Dikkat' };
  }
  return { status: 'safe', message: 'Güvenli' };
}

function buildStatusRow(row, index = 0) {
  const monthlyLimit = Number(row.monthlyLimit) || 0;
  const spent = Number(row.spent) || 0;
  const usagePercent =
    monthlyLimit > 0 ? Math.round((spent / monthlyLimit) * 100) : 0;
  const { status, message } = resolveUsageStatus(usagePercent);

  return {
    id: `demo-${row.category}`,
    category: row.category,
    monthlyLimit,
    spent,
    usagePercent,
    status,
    message,
  };
}

function getDemoStatusRows() {
  return getDemoStore()
    .map((row, index) => buildStatusRow(row, index))
    .sort((a, b) => b.usagePercent - a.usagePercent);
}

function getDemoBudgetList() {
  const now = new Date().toISOString();
  return getDemoStore().map((row) => ({
    id: `demo-${row.category}`,
    category: row.category,
    monthlyLimit: row.monthlyLimit,
    createdAt: now,
    updatedAt: now,
  }));
}

function upsertDemoBudget(category, monthlyLimit) {
  const store = getDemoStore();
  const existing = store.find((row) => row.category === category);
  if (existing) {
    existing.monthlyLimit = monthlyLimit;
  } else {
    store.push({ category, monthlyLimit, spent: 0 });
  }
  return buildStatusRow(store.find((row) => row.category === category));
}

function removeDemoBudget(category) {
  const store = getDemoStore();
  const index = store.findIndex((row) => row.category === category);
  if (index >= 0) {
    store.splice(index, 1);
  }
}

module.exports = {
  DEMO_BUDGET_SEED,
  isMissingBudgetTableError,
  getDemoStatusRows,
  getDemoBudgetList,
  upsertDemoBudget,
  removeDemoBudget,
  buildStatusRow,
  resolveUsageStatus,
};
