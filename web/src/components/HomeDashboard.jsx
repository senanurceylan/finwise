import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatDateDisplay,
  isOverdueForNotification,
  isUpcomingForNotification,
  parseLocalDateOnly,
} from "../utils/regularPaymentRules";

const CHART_COLORS = [
  "#f0b90b",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#64748b",
  "#eab308",
];

const MONTH_NAMES_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function formatTry(n) {
  if (n == null || Number.isNaN(n)) return "0,00 ₺";
  return `${Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

export default function HomeDashboard({ language = "tr", onGoExpenses }) {
  const [expenses, setExpenses] = useState([]);
  const [regularPayments, setRegularPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [exp, rp] = await Promise.all([api.get("/expenses"), api.get("/regular-payments")]);
      setExpenses(Array.isArray(exp) ? exp : []);
      setRegularPayments(Array.isArray(rp) ? rp : []);
    } catch (err) {
      setError(err.message || err.data?.error || "Veriler yüklenemedi.");
      setExpenses([]);
      setRegularPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalExpense = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const thisMonth = expenses
      .filter((e) => {
        const d = parseLocalDateOnly(e.date);
        return d && d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const monthlyRegularTotal = regularPayments
      .filter((p) => p.is_active)
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const upcomingCount = regularPayments.filter(isUpcomingForNotification).length;

    return { totalExpense, thisMonth, monthlyRegularTotal, upcomingCount };
  }, [expenses, regularPayments]);

  const categoryPieData = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const cat = e.category || "Diğer";
      map.set(cat, (map.get(cat) || 0) + Number(e.amount || 0));
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const monthlyBarData = useMemo(() => {
    const buckets = new Map();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${MONTH_NAMES_TR[d.getMonth()]} ${d.getFullYear()}`;
      buckets.set(key, { ay: label, tutar: 0, sortKey: key });
    }
    for (const e of expenses) {
      const parsed = parseLocalDateOnly(e.date);
      if (!parsed) continue;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) {
        const row = buckets.get(key);
        row.tutar += Number(e.amount || 0);
      }
    }
    return [...buckets.values()]
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ ay, tutar }) => ({ ay, tutar }));
  }, [expenses]);

  const paidPendingData = useMemo(() => {
    let paid = 0;
    let pending = 0;
    for (const p of regularPayments) {
      if (!p.is_active) continue;
      if (p.status === "paid") paid += 1;
      else pending += 1;
    }
    return [
      { name: paidLabel(language), value: paid },
      { name: pendingLabel(language), value: pending },
    ];
  }, [regularPayments, language]);

  const overdueList = useMemo(
    () => regularPayments.filter(isOverdueForNotification),
    [regularPayments]
  );
  const upcomingList = useMemo(
    () => regularPayments.filter(isUpcomingForNotification),
    [regularPayments]
  );

  if (loading) {
    return (
      <div className="home-dashboard">
        <p className="expenses-empty">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="home-dashboard">
      {error ? <p className="app-error">{error}</p> : null}

      <section className="dashboard-hero card">
        <div className="dashboard-hero-text">
          <p className="landing-kicker">FinWise</p>
          <h1 className="landing-title dashboard-hero-title">
            {language === "en" ? "Your overview" : "Özetiniz"}
          </h1>
          <p className="landing-text">
            {language === "en"
              ? "Track spending and upcoming payments at a glance."
              : "Harcama ve yaklaşan ödemelerinizi tek bakışta görün."}
          </p>
          <div className="landing-cta-group">
            <button type="button" className="btn-primary btn-primary-inline" onClick={onGoExpenses}>
              {language === "en" ? "Add expense" : "Harcama Ekle"}
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card card">
          <p className="dashboard-stat-label">{language === "en" ? "Total spending" : "Toplam harcama"}</p>
          <p className="dashboard-stat-value">{formatTry(stats.totalExpense)}</p>
        </article>
        <article className="dashboard-stat-card card">
          <p className="dashboard-stat-label">{language === "en" ? "This month" : "Bu ayki harcama"}</p>
          <p className="dashboard-stat-value">{formatTry(stats.thisMonth)}</p>
        </article>
        <article className="dashboard-stat-card card">
          <p className="dashboard-stat-label">
            {language === "en" ? "Monthly recurring (sum)" : "Aylık düzenli ödeme toplamı"}
          </p>
          <p className="dashboard-stat-value">{formatTry(stats.monthlyRegularTotal)}</p>
        </article>
        <article className="dashboard-stat-card card">
          <p className="dashboard-stat-label">
            {language === "en" ? "Upcoming payments" : "Yaklaşan ödeme sayısı"}
          </p>
          <p className="dashboard-stat-value dashboard-stat-value-accent">{stats.upcomingCount}</p>
        </article>
      </section>

      <section className="dashboard-charts">
        <div className="dashboard-chart-card card">
          <h3 className="dashboard-chart-title">
            {language === "en" ? "Spending by category" : "Kategoriye göre harcama"}
          </h3>
          {categoryPieData.length === 0 ? (
            <p className="expenses-empty">Veri yok.</p>
          ) : (
            <div className="dashboard-chart-inner">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {categoryPieData.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatTry(v)}
                    contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="dashboard-chart-card card">
          <h3 className="dashboard-chart-title">
            {language === "en" ? "Spending by month (last 6)" : "Aylara göre harcama (son 6 ay)"}
          </h3>
          <div className="dashboard-chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyBarData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                <XAxis dataKey="ay" tick={{ fill: "#848e9c", fontSize: 11 }} />
                <YAxis tick={{ fill: "#848e9c", fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => formatTry(v)}
                  contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8 }}
                />
                <Bar dataKey="tutar" fill="#f0b90b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-chart-card card">
          <h3 className="dashboard-chart-title">
            {language === "en" ? "Regular payments: paid vs pending" : "Düzenli ödemeler: ödendi / bekliyor"}
          </h3>
          <div className="dashboard-chart-inner">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paidPendingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  <Cell fill="#0ecb81" />
                  <Cell fill="#f0b90b" />
                </Pie>
                <Tooltip contentStyle={{ background: "#1e2329", border: "1px solid #2b3139", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card regular-notifications-card">
        <h2 className="section-title">{language === "en" ? "Notifications" : "Bildirim paneli"}</h2>
        <div className="notification-group">
          <p className="notification-title">
            {language === "en" ? "Upcoming" : "Yaklaşan ödemeler"} ({upcomingList.length})
          </p>
          {upcomingList.length === 0 ? (
            <p className="expenses-empty">{language === "en" ? "None." : "Yaklaşan ödeme yok."}</p>
          ) : (
            <ul className="notification-list">
              {upcomingList.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> — {language === "en" ? "due" : "son tarih"}{" "}
                  {formatDateDisplay(item.next_due_date)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="notification-group">
          <p className="notification-title">
            {language === "en" ? "Overdue" : "Geciken ödemeler"} ({overdueList.length})
          </p>
          {overdueList.length === 0 ? (
            <p className="expenses-empty">{language === "en" ? "None." : "Geciken ödeme yok."}</p>
          ) : (
            <ul className="notification-list">
              {overdueList.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> — {language === "en" ? "due" : "son tarih"}{" "}
                  {formatDateDisplay(item.next_due_date)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="about" className="dashboard-anchor card">
        <h2 className="section-title">{language === "en" ? "About" : "Hakkında"}</h2>
        <p className="landing-text">
          {language === "en"
            ? "FinWise helps you track expenses and recurring payments in one place."
            : "FinWise ile harcamalarınızı ve düzenli ödemelerinizi tek yerden yönetin."}
        </p>
      </section>
      <section id="contact" className="dashboard-anchor card">
        <h2 className="section-title">{language === "en" ? "Contact" : "İletişim"}</h2>
        <p className="landing-text">
          {language === "en"
            ? "We are here for your questions about the application."
            : "Uygulama ile ilgili sorularınız için buradayız."}
        </p>
      </section>
    </div>
  );
}

function paidLabel(lang) {
  return lang === "en" ? "Paid" : "Ödendi";
}

function pendingLabel(lang) {
  return lang === "en" ? "Pending" : "Bekliyor";
}
