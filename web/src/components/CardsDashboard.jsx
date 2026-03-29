import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

const CARD_TYPES = [
  { value: "credit", label: "Kredi kartı" },
  { value: "debit", label: "Banka kartı" },
  { value: "commercial", label: "Ticari kart" },
];

export default function CardsDashboard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    cardName: "",
    bankName: "",
    cardType: "debit",
    last4Digits: "",
  });
  const [editingId, setEditingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/cards");
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Kartlar yüklenemedi.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({ cardName: "", bankName: "", cardType: "debit", last4Digits: "" });
    setEditingId("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        cardName: form.cardName.trim(),
        bankName: form.bankName.trim(),
        cardType: form.cardType,
        last4Digits: form.last4Digits.trim(),
      };
      if (editingId) {
        await api.put(`/cards/${editingId}`, payload);
      } else {
        await api.post("/cards", payload);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || "Kayıt başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (c) => {
    setEditingId(c.id);
    setForm({
      cardName: c.cardName,
      bankName: c.bankName,
      cardType: c.cardType,
      last4Digits: c.last4Digits,
    });
  };

  const onDelete = async (id) => {
    if (!confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/cards/${id}`);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err.message || "Silinemedi.");
    }
  };

  return (
    <section className="cards-dashboard">
      {error ? <p className="app-error">{error}</p> : null}

      <form className="card expense-form" onSubmit={onSubmit}>
        <h2 className="section-title">{editingId ? "Kartı güncelle" : "Kart ekle (isteğe bağlı)"}</h2>
        <p className="field-hint-text">Kartlar yalnızca harcama / ödeme formlarında isteğe bağlı seçim için kullanılır.</p>
        <div className="form-row-two">
          <div className="form-field">
            <label htmlFor="cd-bank">Banka</label>
            <input
              id="cd-bank"
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              maxLength={80}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="cd-name">Kart adı</label>
            <input
              id="cd-name"
              value={form.cardName}
              onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))}
              placeholder="Örn. Ziraat Bonus"
              maxLength={80}
              required
            />
          </div>
        </div>
        <div className="form-row-two">
          <div className="form-field">
            <label htmlFor="cd-type">Kart tipi</label>
            <select
              id="cd-type"
              value={form.cardType}
              onChange={(e) => setForm((f) => ({ ...f, cardType: e.target.value }))}
            >
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="cd-last4">Son 4 hane</label>
            <input
              id="cd-last4"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={form.last4Digits}
              onChange={(e) => setForm((f) => ({ ...f, last4Digits: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
              required
            />
          </div>
        </div>
        <div className="investments-form-actions">
          <button type="submit" className="btn-primary btn-primary-inline" disabled={submitting}>
            {submitting ? "Kaydediliyor..." : editingId ? "Güncelle" : "Kart kaydet"}
          </button>
          {editingId ? (
            <button type="button" className="btn-secondary" onClick={resetForm}>
              İptal
            </button>
          ) : null}
        </div>
      </form>

      <div className="card">
        <h2 className="section-title">Kayıtlı kartlar</h2>
        {loading ? (
          <p className="expenses-empty">Yükleniyor...</p>
        ) : cards.length === 0 ? (
          <p className="expenses-empty">Henüz kart eklenmemiş.</p>
        ) : (
          <ul className="expense-list">
            {cards.map((c) => (
              <li key={c.id} className="expense-item">
                <div className="expense-item-content">
                  <div className="expense-row-main">
                    <span className="expense-category">{c.bankName}</span>
                    <span className="expense-amount">{c.cardName}</span>
                  </div>
                  <div className="expense-row-meta">
                    <span>
                      {CARD_TYPES.find((t) => t.value === c.cardType)?.label || c.cardType} ••••{c.last4Digits}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-secondary table-action-btn" onClick={() => onEdit(c)}>
                  Düzenle
                </button>
                <button type="button" className="btn-delete" onClick={() => onDelete(c.id)}>
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
