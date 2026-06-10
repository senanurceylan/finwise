const DEMO_BUDGET_SEED = [
  { category: "GIDA", monthlyLimit: 8000, spent: 3200 },
  { category: "ULASIM", monthlyLimit: 4000, spent: 1250 },
  { category: "FATURA", monthlyLimit: 5000, spent: 2100 },
  { category: "EGLENCE", monthlyLimit: 3000, spent: 2700 },
  { category: "TEKNOLOJIK_ALET", monthlyLimit: 10000, spent: 0 },
  { category: "DIGER", monthlyLimit: 5000, spent: 1300 },
];

let localDemoStore = null;

function cloneSeed() {
  return DEMO_BUDGET_SEED.map((row) => ({ ...row }));
}

function getLocalStore() {
  if (!localDemoStore) {
    localDemoStore = cloneSeed();
  }
  return localDemoStore;
}

function resolveUsageStatus(usagePercent) {
  if (usagePercent >= 100) {
    return { status: "exceeded", message: "Limit aşıldı" };
  }
  if (usagePercent >= 80) {
    return { status: "warning", message: "Dikkat" };
  }
  return { status: "safe", message: "Güvenli" };
}

export function buildDemoStatusRows(store = getLocalStore()) {
  return store
    .map((row) => {
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
    })
    .sort((a, b) => b.usagePercent - a.usagePercent);
}

export function upsertLocalDemoBudget(category, monthlyLimit) {
  const store = getLocalStore();
  const existing = store.find((row) => row.category === category);
  if (existing) {
    existing.monthlyLimit = monthlyLimit;
  } else {
    store.push({ category, monthlyLimit, spent: 0 });
  }
  return buildDemoStatusRows(store);
}

export function removeLocalDemoBudget(category) {
  const store = getLocalStore();
  const index = store.findIndex((row) => row.category === category);
  if (index >= 0) {
    store.splice(index, 1);
  }
  return buildDemoStatusRows(store);
}

export function isBudgetDbError(err) {
  const message = String(err?.message || err?.data?.error || "").toLowerCase();
  return (
    message.includes("prisma") ||
    message.includes("budgets") ||
    message.includes("does not exist") ||
    message.includes("veritaban")
  );
}
