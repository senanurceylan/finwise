import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PaymentSourceFields from "./PaymentSourceFields";
import { paymentSourceLabel } from "../constants/paymentSources";
import {
  formatDateDisplay,
  getDueState,
  isOverdueForNotification,
  isReminderTime,
  isUpcomingForNotification,
} from "../utils/regularPaymentRules";

const CATEGORY_OPTIONS = ["Abonelik", "Kira", "Fatura", "Ulaşım", "Teknolojik Alet", "Diğer"];
const VALIDATION_TEXT = {
  tr: {
    titleRequired: "Ödeme adı zorunludur.",
    amountPositive: "Tutar 0'dan büyük olmalı.",
    paymentDayRange: "Ödeme günü 1 ile 31 arasında olmalı.",
    reminderRange: "Hatırlatma günü 0 ile 31 arasında olmalı.",
  },
  en: {
    titleRequired: "Payment title is required.",
    amountPositive: "Amount must be greater than 0.",
    paymentDayRange: "Payment day must be between 1 and 31.",
    reminderRange: "Reminder day must be between 0 and 31.",
  },
};

export default function RegularPaymentsDashboard({ language = "tr" }) {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState("1");
  const [paymentSource, setPaymentSource] = useState("automatic_payment");
  const [cardId, setCardId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const v = language === "en" ? VALIDATION_TEXT.en : VALIDATION_TEXT.tr;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [data, cardData] = await Promise.all([
        api.get("/regular-payments"),
        api.get("/cards").catch(() => []),
      ]);
      setPayments(Array.isArray(data) ? data : []);
      setCards(Array.isArray(cardData) ? cardData : []);
    } catch (err) {
      setError(err.message || err.data?.error || "Düzenli ödemeler yüklenemedi.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const notifications = useMemo(() => {
    const dueSoon = payments.filter(isUpcomingForNotification);
    const overdue = payments.filter(isOverdueForNotification);
    const reminderDue = payments.filter(isReminderTime);
    return { dueSoon, overdue, reminderDue };
  }, [payments]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const parsedAmount = Number(amount);
    const parsedPaymentDay = Number(paymentDay);
    const parsedReminder = Number(reminderDaysBefore);
    const nextErrors = {};

    if (!title.trim()) {
      nextErrors.title = v.titleRequired;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = v.amountPositive;
    }
    if (!Number.isInteger(parsedPaymentDay) || parsedPaymentDay < 1 || parsedPaymentDay > 31) {
      nextErrors.paymentDay = v.paymentDayRange;
    }
    if (!Number.isInteger(parsedReminder) || parsedReminder < 0 || parsedReminder > 31) {
      nextErrors.reminderDaysBefore = v.reminderRange;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!user?.id) {
      setError("Kullanıcı bilgisi bulunamadı. Lütfen yeniden giriş yapın.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/regular-payments", {
        user_id: user.id,
        title: title.trim(),
        category,
        amount: Number(parsedAmount.toFixed(2)),
        payment_day: parsedPaymentDay,
        reminder_days_before: parsedReminder,
        paymentSource,
        ...(cardId ? { cardId } : {}),
      });
      setTitle("");
      setCategory(CATEGORY_OPTIONS[0]);
      setAmount("");
      setPaymentDay("");
      setReminderDaysBefore("1");
      setPaymentSource("automatic_payment");
      setCardId("");
      await fetchPayments();
    } catch (err) {
      setError(err.message || err.data?.error || "Düzenli ödeme eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (id) => {
    try {
      setError("");
      await api.patch(`/regular-payments/${id}/mark-paid`, {});
      await fetchPayments();
    } catch (err) {
      setError(err.message || err.data?.error || "Ödeme durumu güncellenemedi.");
    }
  };

  const deletePayment = async (id) => {
    if (!confirm("Bu düzenli ödemeyi silmek istediğinize emin misiniz?")) return;
    try {
      setError("");
      await api.delete(`/regular-payments/${id}`);
      await fetchPayments();
    } catch (err) {
      setError(err.message || err.data?.error || "Düzenli ödeme silinemedi.");
    }
  };

  return (
    <section className="regular-payments-layout">
      <div className="card regular-payment-form-card">
        <h2 className="section-title">Düzenli Ödeme Ekle</h2>
        {error ? <p className="app-error">{error}</p> : null}
        <form className="expense-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="rp-title">Ödeme Adı</label>
            <input
              id="rp-title"
              type="text"
              placeholder="Spotify, Kira..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
            {fieldErrors.title ? <p className="field-error-text">{fieldErrors.title}</p> : null}
          </div>

          <div className="form-field">
            <label htmlFor="rp-category">Kategori</label>
            <select id="rp-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <PaymentSourceFields
            idPrefix="rp"
            paymentSource={paymentSource}
            cardId={cardId}
            cards={cards}
            onChange={({ paymentSource: ps, cardId: cid }) => {
              setPaymentSource(ps);
              setCardId(cid || "");
            }}
          />

          <div className="form-field">
            <label htmlFor="rp-amount">Tutar</label>
            <input
              id="rp-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {fieldErrors.amount ? <p className="field-error-text">{fieldErrors.amount}</p> : null}
          </div>

          <div className="form-row-two">
            <div className="form-field">
              <label htmlFor="rp-payment-day">Ödeme Günü</label>
              <input
                id="rp-payment-day"
                type="number"
                min="1"
                max="31"
                placeholder="1-31"
                value={paymentDay}
                onChange={(e) => setPaymentDay(e.target.value)}
              />
              {fieldErrors.paymentDay ? (
                <p className="field-error-text">{fieldErrors.paymentDay}</p>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="rp-reminder">Hatırlatma (Gün)</label>
              <input
                id="rp-reminder"
                type="number"
                min="0"
                max="31"
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(e.target.value)}
              />
              {fieldErrors.reminderDaysBefore ? (
                <p className="field-error-text">{fieldErrors.reminderDaysBefore}</p>
              ) : null}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Kaydediliyor..." : "Düzenli Ödeme Kaydet"}
          </button>
        </form>
      </div>

      <div className="card regular-notifications-card">
        <h2 className="section-title">Bildirim Paneli</h2>
        <div className="notification-group">
          <p className="notification-title">Yaklaşan Ödemeler ({notifications.dueSoon.length})</p>
          {notifications.dueSoon.length === 0 ? (
            <p className="expenses-empty">Yaklaşan ödeme yok.</p>
          ) : (
            <ul className="notification-list">
              {notifications.dueSoon.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> - son tarih {formatDateDisplay(item.next_due_date)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="notification-group">
          <p className="notification-title">Geciken Ödemeler ({notifications.overdue.length})</p>
          {notifications.overdue.length === 0 ? (
            <p className="expenses-empty">Geciken ödeme yok.</p>
          ) : (
            <ul className="notification-list">
              {notifications.overdue.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> - son tarih {formatDateDisplay(item.next_due_date)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="notification-group">
          <p className="notification-title">Hatırlatma zamanı ({notifications.reminderDue.length})</p>
          {notifications.reminderDue.length === 0 ? (
            <p className="expenses-empty">Hatırlatma bekleyen yok.</p>
          ) : (
            <ul className="notification-list">
              {notifications.reminderDue.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> - hatırlatma {formatDateDisplay(item.next_reminder_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card regular-payments-table-card">
        <h2 className="section-title">Düzenli Ödemeler</h2>
        {loading ? (
          <p className="expenses-empty">Yükleniyor...</p>
        ) : payments.length === 0 ? (
          <p className="expenses-empty">Henüz düzenli ödeme yok.</p>
        ) : (
          <div className="table-scroll">
            <table className="regular-payments-table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Kategori</th>
                  <th>Ödeme kaynağı</th>
                  <th>Tutar</th>
                  <th>Ödeme Günü</th>
                  <th>Hatırlatma</th>
                  <th>Durum</th>
                  <th>Son Ödeme</th>
                  <th>Sonraki Vade</th>
                  <th>Yaklaşan/Geciken</th>
                  <th>İşlem</th>
                  <th>Sil</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const dueState = getDueState(payment);
                  return (
                    <tr key={payment.id}>
                      <td>{payment.title}</td>
                      <td>{payment.category}</td>
                      <td>
                        <span>{paymentSourceLabel(payment.payment_source)}</span>
                        {payment.card ? (
                          <span className="table-subline">
                            {" "}
                            • {payment.card.bankName} ••••{payment.card.last4Digits}
                          </span>
                        ) : null}
                      </td>
                      <td>{payment.amount.toFixed(2)} TL</td>
                      <td>{payment.payment_day}</td>
                      <td>{payment.reminder_days_before} gün</td>
                      <td>
                        <span className={`status-pill ${payment.status === "paid" ? "status-paid" : "status-pending"}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{formatDateDisplay(payment.last_paid_at)}</td>
                      <td>{formatDateDisplay(payment.next_due_date)}</td>
                      <td>
                        <span className={`status-pill ${dueState.className}`}>{dueState.label}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary table-action-btn"
                          onClick={() => markPaid(payment.id)}
                          disabled={payment.status === "paid"}
                        >
                          {payment.status === "paid" ? "Ödendi" : "Ödendi İşaretle"}
                        </button>
                      </td>
                      <td>
                        <button type="button" className="btn-delete" onClick={() => deletePayment(payment.id)}>
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
