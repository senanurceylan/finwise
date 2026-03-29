import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import Login from "./components/Login";
import Register from "./components/Register";
import HomeLanding from "./components/HomeLanding";
import HomeDashboard from "./components/HomeDashboard";
import RegularPaymentsDashboard from "./components/RegularPaymentsDashboard";
import InvestmentsDashboard from "./components/InvestmentsDashboard";
import CardsDashboard from "./components/CardsDashboard";
import PaymentSourceFields from "./components/PaymentSourceFields";
import { paymentSourceLabel } from "./constants/paymentSources";

const CATEGORIES = ["Gıda", "Ulaşım", "Fatura", "Eğlence", "Teknolojik Alet", "Diğer"];
const DEFAULT_AUTH_ROUTE = "home";

const NAV_TEXT = {
  tr: {
    subtitle: "Harcama Ekle",
    home: "Ana Sayfa",
    expenses: "Harcamalar",
    regularPayments: "Düzenli Ödemeler",
    investments: "Yatırımlar",
    cards: "Kartlarım",
    about: "Hakkında",
    contact: "İletişim",
    light: "Gündüz",
    dark: "Gece",
    logout: "Çıkış",
  },
  en: {
    subtitle: "Add Expense",
    home: "Home",
    expenses: "Expenses",
    regularPayments: "Regular Payments",
    investments: "Investments",
    cards: "Cards",
    about: "About",
    contact: "Contact",
    light: "Light",
    dark: "Dark",
    logout: "Logout",
  },
};

function parseRouteFromHash() {
  const rawHash = window.location.hash.replace(/^#\/?/, "").trim();
  return rawHash || "";
}

function setHashRoute(route) {
  const nextHash = `#/${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function ExpenseDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [paymentSource, setPaymentSource] = useState("cash");
  const [cardId, setCardId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expenseData, cardData] = await Promise.all([
        api.get("/expenses"),
        api.get("/cards").catch(() => []),
      ]);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setCards(Array.isArray(cardData) ? cardData : []);
    } catch (err) {
      setError(err.message || err.data?.error || "Harcamalar yüklenemedi.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/expenses", {
        amount: Number(amount) || 0,
        category: category || undefined,
        date: date || undefined,
        description: description ? description.trim().slice(0, 500) : "",
        paymentSource,
        ...(cardId ? { cardId } : {}),
      });
      setAmount("");
      setCategory("");
      setDate("");
      setDescription("");
      setPaymentSource("cash");
      setCardId("");
      await fetchExpenses();
    } catch (err) {
      setError(err.message || err.data?.error || "Harcama eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu harcamayı silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses();
    } catch (err) {
      setError(err.message || err.data?.error || "Silinemedi.");
    }
  };

  return (
    <>
      {error && <p className="app-error">{error}</p>}

      <form className="expense-form card" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="amount">Harcama Tutarı</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="category">Kategori</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Seçiniz</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <PaymentSourceFields
          idPrefix="exp"
          paymentSource={paymentSource}
          cardId={cardId}
          cards={cards}
          onChange={({ paymentSource: ps, cardId: cid }) => {
            setPaymentSource(ps);
            setCardId(cid || "");
          }}
        />
        <div className="form-field">
          <label htmlFor="date">Tarih</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="description">Açıklama</label>
          <input
            id="description"
            type="text"
            placeholder="İsteğe bağlı açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <section className="expenses-section card">
        <h2 className="section-title">
          Harcamalar
          {!loading && expenses.length > 0 ? (
            <span className="section-title-count"> ({expenses.length})</span>
          ) : null}
        </h2>
        {loading ? (
          <p className="expenses-empty">Yükleniyor...</p>
        ) : expenses.length === 0 ? (
          <p className="expenses-empty">Henüz harcama bulunmuyor</p>
        ) : (
          <ul className="expense-list">
            {expenses.map((e) => (
              <li key={e.id} className="expense-item">
                <div className="expense-item-content">
                  <div className="expense-row-main">
                    <span className="expense-category">{e.category}</span>
                    <span className="expense-amount">{e.amount} TL</span>
                  </div>
                  <div className="expense-row-meta">
                    <span className="expense-date">{e.date}</span>
                    <span className="expense-payment-source">{paymentSourceLabel(e.paymentSource)}</span>
                    {e.card?.label ? (
                      <span className="expense-card-hint">{e.card.label}</span>
                    ) : null}
                    {e.description ? (
                      <span className="expense-description">{e.description}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleDelete(e.id)}
                  title="Sil"
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AuthScreen() {
  const [showRegister, setShowRegister] = useState(false);
  const [language, setLanguage] = useState("tr");
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="binance-app auth-screen">
        <p className="auth-loading">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="binance-app app-shell auth-screen-wide">
      <HomeLanding
        language={language}
        onGoExpenses={() => document.getElementById("auth-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
      <div id="auth-panel" className="auth-panel">
        <div className="auth-panel-header">
          <header className="app-header">
            <h1 className="app-title">FinWise</h1>
            <p className="app-subtitle">Harcamalarınızı yönetin</p>
          </header>
          <button
            type="button"
            className="nav-pill auth-lang-pill"
            onClick={() => setLanguage((prev) => (prev === "tr" ? "en" : "tr"))}
          >
            {language === "tr" ? "TR" : "EN"}
          </button>
        </div>
        {showRegister ? (
          <Register onSwitchLogin={() => setShowRegister(false)} />
        ) : (
          <Login onSwitchRegister={() => setShowRegister(true)} />
        )}
      </div>
    </div>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState("tr");
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [route, setRoute] = useState(() => {
    const current = parseRouteFromHash();
    return current === "expenses" ||
      current === "regular-payments" ||
      current === "investments" ||
      current === "cards"
      ? current
      : DEFAULT_AUTH_ROUTE;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const current = parseRouteFromHash();
      if (
        current === "expenses" ||
        current === "home" ||
        current === "regular-payments" ||
        current === "investments" ||
        current === "cards"
      ) {
        setRoute(current);
      } else {
        setRoute(DEFAULT_AUTH_ROUTE);
        setHashRoute(DEFAULT_AUTH_ROUTE);
      }
    };

    if (!parseRouteFromHash()) {
      setHashRoute(DEFAULT_AUTH_ROUTE);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-light", isLightTheme);
    return () => document.body.classList.remove("theme-light");
  }, [isLightTheme]);

  const t = NAV_TEXT[language];
  const userName = user?.name || user?.email || "User";

  const navigate = (nextRoute) => {
    setRoute(nextRoute);
    setHashRoute(nextRoute);
    setMobileMenuOpen(false);
  };

  const openSection = (sectionId) => {
    if (route !== "home") {
      navigate("home");
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="binance-app app-shell">
      <header className="top-navbar">
        <div className="top-navbar-inner">
          <button type="button" className="brand-button" onClick={() => navigate("home")}>
            FinWise
          </button>

          <nav className={`top-nav-links ${mobileMenuOpen ? "open" : ""}`} aria-label="Main">
            <button type="button" className="nav-link" onClick={() => navigate("home")}>
              {t.home}
            </button>
            <button type="button" className="nav-link" onClick={() => navigate("expenses")}>
              {t.expenses}
            </button>
            <button type="button" className="nav-link" onClick={() => navigate("regular-payments")}>
              {t.regularPayments}
            </button>
            <button type="button" className="nav-link" onClick={() => navigate("investments")}>
              {t.investments}
            </button>
            <button type="button" className="nav-link" onClick={() => navigate("cards")}>
              {t.cards}
            </button>
            <button type="button" className="nav-link" onClick={() => openSection("about")}>
              {t.about}
            </button>
            <button type="button" className="nav-link" onClick={() => openSection("contact")}>
              {t.contact}
            </button>

            <button
              type="button"
              className="nav-pill"
              onClick={() => setIsLightTheme((prev) => !prev)}
              title={isLightTheme ? t.dark : t.light}
            >
              {isLightTheme ? t.dark : t.light}
            </button>

            <button
              type="button"
              className="nav-pill"
              onClick={() => setLanguage((prev) => (prev === "tr" ? "en" : "tr"))}
            >
              {language === "tr" ? "TR" : "EN"}
            </button>

            <span className="app-user-name">{userName}</span>
            <button type="button" className="btn-logout" onClick={logout}>
              {t.logout}
            </button>
          </nav>

          <button
            type="button"
            className="hamburger-btn"
            aria-label="Menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="app-content">
        {route === "expenses" ? (
          <>
            <section className="page-heading">
              <h1 className="app-title">FinWise</h1>
              <p className="app-subtitle">{t.subtitle}</p>
            </section>
            <ExpenseDashboard />
          </>
        ) : route === "regular-payments" ? (
          <>
            <section className="page-heading">
              <h1 className="app-title">FinWise</h1>
              <p className="app-subtitle">{t.regularPayments}</p>
            </section>
            <RegularPaymentsDashboard language={language} />
          </>
        ) : route === "investments" ? (
          <>
            <section className="page-heading">
              <h1 className="app-title">FinWise</h1>
              <p className="app-subtitle">{t.investments}</p>
            </section>
            <InvestmentsDashboard />
          </>
        ) : route === "cards" ? (
          <>
            <section className="page-heading">
              <h1 className="app-title">FinWise</h1>
              <p className="app-subtitle">{t.cards}</p>
            </section>
            <CardsDashboard />
          </>
        ) : (
          <HomeDashboard language={language} onGoExpenses={() => navigate("expenses")} />
        )}
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="binance-app">
        <p className="expenses-empty">Yükleniyor...</p>
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <AuthScreen />;
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;
