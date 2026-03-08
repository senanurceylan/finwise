import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { api } from "./api/client";
import Login from "./components/Login";
import Register from "./components/Register";

const CATEGORIES = ["Gıda", "Ulaşım", "Fatura", "Eğlence", "Diğer"];

function ExpenseDashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/expenses");
      setExpenses(Array.isArray(data) ? data : []);
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
      });
      setAmount("");
      setCategory("");
      setDate("");
      setDescription("");
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
    <div className="binance-app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <h1 className="app-title">FinWise</h1>
            <p className="app-subtitle">Harcama Ekle</p>
          </div>
          <div className="app-user">
            <span className="app-user-name">{user?.name || user?.email}</span>
            <button type="button" className="btn-logout" onClick={logout}>
              Çıkış
            </button>
          </div>
        </div>
      </header>

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
        <h2 className="section-title">Harcamalar</h2>
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
    </div>
  );
}

function AuthScreen() {
  const [showRegister, setShowRegister] = useState(false);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="binance-app auth-screen">
        <p className="auth-loading">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="binance-app auth-screen">
      <header className="app-header">
        <h1 className="app-title">FinWise</h1>
        <p className="app-subtitle">Harcamalarınızı yönetin</p>
      </header>
      {showRegister ? (
        <Register onSwitchLogin={() => setShowRegister(false)} />
      ) : (
        <Login onSwitchRegister={() => setShowRegister(true)} />
      )}
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

  return isAuthenticated ? <ExpenseDashboard /> : <AuthScreen />;
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;
