import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const CATEGORY_OPTIONS = [
  { value: "GIDA", labelTr: "Gıda", labelEn: "Groceries" },
  { value: "ULASIM", labelTr: "Ulaşım", labelEn: "Transport" },
  { value: "FATURA", labelTr: "Fatura", labelEn: "Bills" },
  { value: "EGLENCE", labelTr: "Eğlence", labelEn: "Entertainment" },
  { value: "TEKNOLOJIK_ALET", labelTr: "Teknolojik Alet", labelEn: "Tech" },
  { value: "DIGER", labelTr: "Diğer", labelEn: "Other" },
];

const COPY = {
  tr: {
    formTitle: "Bütçe limiti ekle",
    category: "Kategori",
    monthlyLimit: "Aylık limit (TL)",
    save: "Bütçe Kaydet",
    saving: "Kaydediliyor...",
    listTitle: "Bütçe durumu",
    refresh: "Yenile",
    loading: "Bütçe durumu yükleniyor...",
    empty: "Henüz tanımlı bütçe limiti yok.",
    limit: "Limit",
    spent: "Bu ay harcanan",
    usage: "kullanıldı",
    selectCategory: "Kategori seçin",
    limitPlaceholder: "Örn. 3000",
    limitRequired: "Aylık limit 0'dan büyük olmalıdır.",
    loadError: "Bütçe durumu alınamadı.",
    saveError: "Bütçe kaydedilemedi.",
    edit: "Düzenle",
    delete: "Sil",
    deleteConfirm: "Bu kategori bütçesini silmek istediğinize emin misiniz?",
    deleting: "Siliniyor...",
    deleteError: "Bütçe silinemedi.",
    formHint: "Aynı kategori için kayıt limiti günceller.",
  },
  en: {
    formTitle: "Add budget limit",
    category: "Category",
    monthlyLimit: "Monthly limit (TRY)",
    save: "Save Budget",
    saving: "Saving...",
    listTitle: "Budget status",
    refresh: "Refresh",
    loading: "Loading budget status...",
    empty: "No budget limits defined yet.",
    limit: "Limit",
    spent: "Spent this month",
    usage: "used",
    selectCategory: "Select category",
    limitPlaceholder: "e.g. 3000",
    limitRequired: "Monthly limit must be greater than 0.",
    loadError: "Could not load budget status.",
    saveError: "Could not save budget.",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete this category budget?",
    deleting: "Deleting...",
    deleteError: "Could not delete budget.",
    formHint: "Saving updates the limit when the category already exists.",
  },
};

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.value, { tr: item.labelTr, en: item.labelEn }])
);

function normalizeStatusItem(raw) {
  return {
    id: raw?.id ?? null,
    category: raw?.category ?? "",
    monthlyLimit: Number(raw?.monthlyLimit) || 0,
    spent: Number(raw?.spent) || 0,
    usagePercent: Number(raw?.usagePercent) || 0,
    status: raw?.status ?? "safe",
    message: raw?.message ?? "",
  };
}

function formatTry(value, language) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const locale = language === "en" ? "en-US" : "tr-TR";
  return `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function statusClass(status) {
  if (status === "exceeded") return "budget-progress-fill budget-progress-fill--exceeded";
  if (status === "warning") return "budget-progress-fill budget-progress-fill--warning";
  return "budget-progress-fill budget-progress-fill--safe";
}

export default function BudgetDashboard({ language = "tr" }) {
  const t = COPY[language] || COPY.tr;
  const formRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const categoryLabel = (code) => {
    const labels = CATEGORY_LABELS[code];
    if (!labels) return code;
    return language === "en" ? labels.en : labels.tr;
  };

  const loadStatus = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const response = await api.get("/budgets/status");
        const rows = Array.isArray(response?.data) ? response.data : [];
        setItems(
          rows.map(normalizeStatusItem).sort((a, b) => (b.usagePercent ?? 0) - (a.usagePercent ?? 0))
        );
      } catch (err) {
        setItems([]);
        setError(err.message || err.data?.error || t.loadError);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t.loadError]
  );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const limitValue = Number(String(monthlyLimit).replace(",", "."));
    if (!category) {
      setFormError(t.selectCategory);
      return;
    }
    if (!Number.isFinite(limitValue) || limitValue <= 0) {
      setFormError(t.limitRequired);
      return;
    }

    setSaving(true);
    try {
      await api.post("/budgets", { category, monthlyLimit: limitValue });
      setMonthlyLimit("");
      setCategory(CATEGORY_OPTIONS[0].value);
      await loadStatus(true);
    } catch (err) {
      setFormError(err.message || err.data?.error || t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setCategory(item.category);
    setMonthlyLimit(String(item.monthlyLimit));
    setFormError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (item) => {
    if (!window.confirm(t.deleteConfirm)) return;

    setDeletingCategory(item.category);
    setError("");
    try {
      await api.delete(`/budgets/${encodeURIComponent(item.category)}`);
      await loadStatus(true);
    } catch (err) {
      setError(err.message || err.data?.error || t.deleteError);
    } finally {
      setDeletingCategory("");
    }
  };

  return (
    <>
      <section className="card budget-form-card" ref={formRef}>
        <h2 className="section-title">{t.formTitle}</h2>
        <p className="budget-form-hint">{t.formHint}</p>
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="budget-category">{t.category}</label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {language === "en" ? opt.labelEn : opt.labelTr}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="budget-limit">{t.monthlyLimit}</label>
            <input
              id="budget-limit"
              type="number"
              step="0.01"
              min="0"
              placeholder={t.limitPlaceholder}
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t.saving : t.save}
          </button>
        </form>
        {formError ? <p className="app-error">{formError}</p> : null}
      </section>

      <section className="card budget-list-card">
        <div className="budget-list-header">
          <h2 className="section-title">{t.listTitle}</h2>
          <button
            type="button"
            className="btn-secondary budget-refresh-btn"
            onClick={() => loadStatus()}
            disabled={loading || saving}
          >
            {t.refresh}
          </button>
        </div>

        {loading ? <p className="expenses-empty">{t.loading}</p> : null}
        {error ? <p className="app-error">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="expenses-empty">{t.empty}</p>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div className="budget-card-grid">
            {items.map((item) => {
              const percent = Math.max(0, Math.min(100, item.usagePercent ?? 0));
              const isDeleting = deletingCategory === item.category;
              return (
                <article key={item.category} className="budget-status-card">
                  <div className="budget-status-card-header">
                    <h3 className="budget-category-name">{categoryLabel(item.category)}</h3>
                    <span className={`budget-status-badge budget-status-badge--${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="budget-meta">
                    {t.limit}: {formatTry(item.monthlyLimit, language)} • {t.spent}:{" "}
                    {formatTry(item.spent, language)}
                  </p>
                  <p className="budget-meta">
                    %{percent} {t.usage}
                  </p>
                  <div className="budget-progress-track" aria-hidden="true">
                    <div className={statusClass(item.status)} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="budget-message">{item.message}</p>
                  <div className="budget-card-actions">
                    <button
                      type="button"
                      className="btn-secondary table-action-btn"
                      onClick={() => startEdit(item)}
                      disabled={saving || isDeleting}
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary table-action-btn budget-delete-btn"
                      onClick={() => handleDelete(item)}
                      disabled={saving || isDeleting}
                    >
                      {isDeleting ? t.deleting : t.delete}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
}
