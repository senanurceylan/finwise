import { useCallback, useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { api } from "../api/client";
import { getDemoInvestments, isDemoInvestment } from "../utils/demoInvestments";
import PaymentSourceFields from "./PaymentSourceFields";
import { paymentSourceLabel } from "../constants/paymentSources";

const PRICE_CARDS = [
  { symbol: "USDTRY", label: "USD/TRY" },
  { symbol: "EURTRY", label: "EUR/TRY" },
  { symbol: "XAUTRY", label: "Altın (XAU/TRY)" },
  { symbol: "XAGTRY", label: "Gümüş (XAG/TRY)" },
  { symbol: "BTCTRY", label: "Bitcoin (TRY)" },
  { symbol: "ETHTRY", label: "Ethereum (TRY)" },
  { symbol: "SOLTRY", label: "Solana (TRY)" },
  { symbol: "XRPTRY", label: "Ripple / XRP (TRY)" },
  { symbol: "ADATRY", label: "Cardano / ADA (TRY)" },
];

const SYMBOL_LABELS = Object.fromEntries(PRICE_CARDS.map((c) => [c.symbol, c.label]));

const ASSET_TYPE_OPTIONS = [
  { value: "FOREX", label: "Döviz" },
  { value: "CRYPTO", label: "Kripto" },
  { value: "METAL", label: "Metal" },
];

const CHART_COLORS = ["#f0b90b", "#f5d066", "#d97706", "#0ecb81", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#a855f7"];

function formatTry(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatNumber(value, maxDigits = 8) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: maxDigits }).format(Number(value || 0));
}

function hasFinitePrice(v) {
  return v != null && Number.isFinite(Number(v)) && Number(v) > 0;
}

function buildDefaultForm() {
  return {
    symbol: "USDTRY",
    assetType: "FOREX",
    quantity: "",
    buyPriceTry: "",
    note: "",
    paymentSource: "investment_platform",
    cardId: "",
    sourceLabel: "",
  };
}

export default function InvestmentsDashboard() {
  const [marketData, setMarketData] = useState({});
  const [marketMeta, setMarketMeta] = useState({ source: "", warnings: [] });
  const [investments, setInvestments] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [form, setForm] = useState(buildDefaultForm());
  const [editingId, setEditingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [pricesRes, investmentsRes, cardsRes] = await Promise.all([
        api.get("/market/prices"),
        api.get("/investments"),
        api.get("/cards").catch(() => []),
      ]);
      setMarketData(pricesRes?.prices || {});
      setCards(Array.isArray(cardsRes) ? cardsRes : []);
      setMarketMeta({
        source: pricesRes?.source || "",
        warnings: Array.isArray(pricesRes?.warnings) ? pricesRes.warnings : [],
      });
      setInvestments(Array.isArray(investmentsRes) ? investmentsRes : []);
    } catch (err) {
      setFetchError(err.message || "Yatırım verileri yüklenemedi.");
      setMarketData({});
      setMarketMeta({ source: "", warnings: [] });
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayInvestments = useMemo(() => {
    if (investments.length > 0) return investments;
    if (loading) return [];
    if (fetchError) return [];
    return getDemoInvestments();
  }, [investments, loading, fetchError]);

  const showDemoBanner = !loading && investments.length === 0 && !fetchError;

  const rows = useMemo(() => {
    return displayInvestments.map((item) => {
      const raw = marketData[item.symbol];
      const livePrice = hasFinitePrice(raw) ? Number(raw) : null;
      const quantity = Number(item.quantity || 0);
      const buyPrice = Number(item.buyPriceTry || 0);
      const cost = quantity * buyPrice;
      const currentValue = livePrice != null ? quantity * livePrice : null;
      const pnl = livePrice != null ? currentValue - cost : null;
      return { ...item, livePrice, cost, currentValue, pnl };
    });
  }, [displayInvestments, marketData]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.cost += row.cost;
        if (row.currentValue != null) {
          acc.current += row.currentValue;
          acc.pnl += row.pnl;
          acc.hasAnyLive = true;
        } else {
          acc.missingLive = true;
        }
        return acc;
      },
      { cost: 0, current: 0, pnl: 0, missingLive: false, hasAnyLive: false }
    );
  }, [rows]);

  const allocationData = useMemo(() => {
    const grouped = new Map();
    rows.forEach((row) => {
      if (row.currentValue == null || row.currentValue <= 0) return;
      const label = SYMBOL_LABELS[row.symbol] || row.symbol;
      const prev = grouped.get(label) || 0;
      grouped.set(label, prev + row.currentValue);
    });
    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const onFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(buildDefaultForm());
    setEditingId("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (editingId && isDemoInvestment({ id: editingId })) {
      setError("Demo kayıtlar düzenlenemez. Yeni bir yatırım ekleyin.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        symbol: form.symbol,
        assetType: form.assetType,
        quantity: Number(form.quantity),
        buyPriceTry: Number(form.buyPriceTry),
        note: form.note.trim(),
        paymentSource: form.paymentSource,
        ...(form.cardId ? { cardId: form.cardId } : {}),
        ...(form.sourceLabel.trim() ? { sourceLabel: form.sourceLabel.trim() } : {}),
      };
      if (editingId) {
        await api.put(`/investments/${editingId}`, payload);
      } else {
        await api.post("/investments", payload);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Yatırım kaydı kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = (item) => {
    if (isDemoInvestment(item)) return;
    setEditingId(item.id);
    setForm({
      symbol: item.symbol,
      assetType: item.assetType,
      quantity: String(item.quantity),
      buyPriceTry: String(item.buyPriceTry),
      note: item.note || "",
      paymentSource: item.paymentSource || "investment_platform",
      cardId: item.cardId || "",
      sourceLabel: item.sourceLabel || "",
    });
  };

  const onDelete = async (id) => {
    if (isDemoInvestment({ id })) return;
    if (!confirm("Bu yatırım kaydını silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/investments/${id}`);
      await loadData();
    } catch (err) {
      setError(err.message || "Yatırım kaydı silinemedi.");
    }
  };

  const formatCardPrice = (symbol) => {
    if (loading) return "…";
    const v = marketData[symbol];
    return hasFinitePrice(v) ? formatTry(v) : "-";
  };

  return (
    <section className="investments-dashboard">
      {fetchError ? <p className="app-error">{fetchError}</p> : null}
      {error ? <p className="app-error">{error}</p> : null}
      {showDemoBanner ? (
        <p className="demo-portfolio-banner">Demo portföy verisi gösteriliyor. Kendi yatırımınızı eklediğinizde bu örnekler gizlenir.</p>
      ) : null}
      {marketMeta.warnings?.length ? (
        <p className="app-error" style={{ opacity: 0.9 }}>
          {marketMeta.warnings.join(" ")}
        </p>
      ) : null}

      <div className="dashboard-stats investments-stats">
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Toplam Portföy Değeri</p>
          <p className="dashboard-stat-value dashboard-stat-value-accent">
            {totals.hasAnyLive ? formatTry(totals.current) : rows.length ? "—" : formatTry(0)}
          </p>
          {totals.missingLive ? (
            <p className="dashboard-stat-label" style={{ marginTop: 6, fontSize: "0.85rem" }}>
              Bazı varlıklar için anlık fiyat yok; toplam kısmi olabilir.
            </p>
          ) : null}
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Toplam Maliyet</p>
          <p className="dashboard-stat-value">{formatTry(totals.cost)}</p>
        </article>
        <article className="card dashboard-stat-card">
          <p className="dashboard-stat-label">Toplam Kâr / Zarar</p>
          <p
            className={`dashboard-stat-value ${
              !totals.hasAnyLive ? "" : totals.pnl >= 0 ? "value-positive" : "value-negative"
            }`}
          >
            {totals.hasAnyLive ? formatTry(totals.pnl) : rows.length ? "—" : formatTry(0)}
          </p>
        </article>
      </div>

      <div className="investments-price-cards">
        {PRICE_CARDS.map((card) => (
          <article key={card.symbol} className="card dashboard-stat-card">
            <p className="dashboard-stat-label">{card.label}</p>
            <p className="dashboard-stat-value">{formatCardPrice(card.symbol)}</p>
          </article>
        ))}
      </div>

      <form className="card expense-form" onSubmit={onSubmit}>
        <h2 className="section-title">Yatırım Ekle / Güncelle</h2>
        <div className="form-row-two">
          <div className="form-field">
            <label htmlFor="investment-symbol">Varlık</label>
            <select
              id="investment-symbol"
              value={form.symbol}
              onChange={(e) => onFormChange("symbol", e.target.value)}
            >
              {PRICE_CARDS.map((item) => (
                <option key={item.symbol} value={item.symbol}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="investment-type">Varlık Tipi</label>
            <select
              id="investment-type"
              value={form.assetType}
              onChange={(e) => onFormChange("assetType", e.target.value)}
            >
              {ASSET_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <PaymentSourceFields
          idPrefix="inv"
          paymentSource={form.paymentSource}
          cardId={form.cardId}
          cards={cards}
          showInvestmentPlatformHint
          onChange={({ paymentSource: ps, cardId: cid }) => {
            onFormChange("paymentSource", ps);
            onFormChange("cardId", cid || "");
          }}
        />
        <div className="form-field">
          <label htmlFor="investment-source-label">Kaynak / platform (isteğe bağlı)</label>
          <input
            id="investment-source-label"
            type="text"
            maxLength={120}
            value={form.sourceLabel}
            onChange={(e) => onFormChange("sourceLabel", e.target.value)}
            placeholder="Örn. Binance, Paribu, banka hesabı"
          />
        </div>
        <div className="form-row-two">
          <div className="form-field">
            <label htmlFor="investment-quantity">Miktar</label>
            <input
              id="investment-quantity"
              type="number"
              min="0"
              step="0.00000001"
              value={form.quantity}
              onChange={(e) => onFormChange("quantity", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="investment-buy-price">Alış Fiyatı (TRY)</label>
            <input
              id="investment-buy-price"
              type="number"
              min="0"
              step="0.0001"
              value={form.buyPriceTry}
              onChange={(e) => onFormChange("buyPriceTry", e.target.value)}
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="investment-note">Not</label>
          <input
            id="investment-note"
            type="text"
            maxLength={300}
            value={form.note}
            onChange={(e) => onFormChange("note", e.target.value)}
            placeholder="Opsiyonel not"
          />
        </div>
        <div className="investments-form-actions">
          <button className="btn-primary btn-primary-inline" type="submit" disabled={submitting}>
            {submitting ? "Kaydediliyor..." : editingId ? "Güncelle" : "Yatırım Ekle"}
          </button>
          {editingId ? (
            <button className="btn-secondary" type="button" onClick={resetForm}>
              Düzenlemeyi İptal Et
            </button>
          ) : null}
        </div>
      </form>

      <div className="dashboard-charts investments-charts">
        <article className="card dashboard-chart-card">
          <h3 className="dashboard-chart-title">Portföy Dağılımı{showDemoBanner ? <span className="demo-inline-badge">demo</span> : null}</h3>
          <div className="dashboard-chart-inner">
            {allocationData.length === 0 ? (
              <p className="expenses-empty">Grafik için yatırım verisi yok.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                    {allocationData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTry(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </div>

      <section className="card">
        <h2 className="section-title">
          Portföy Tablosu
          {showDemoBanner ? <span className="demo-inline-badge">demo</span> : null}
        </h2>
        {loading ? (
          <p className="expenses-empty">Yükleniyor...</p>
        ) : rows.length === 0 ? (
          <p className="expenses-empty">Henüz yatırım kaydı bulunmuyor.</p>
        ) : (
          <div className="table-scroll">
            <table className="regular-payments-table">
              <thead>
                <tr>
                  <th>Varlık</th>
                  <th>Tip</th>
                  <th>Kaynak</th>
                  <th>Miktar</th>
                  <th>Alış Fiyatı</th>
                  <th>Anlık Fiyat</th>
                  <th>Maliyet</th>
                  <th>Güncel Değer</th>
                  <th>Kâr / Zarar</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{SYMBOL_LABELS[row.symbol] || row.symbol}</td>
                    <td>{row.assetType}</td>
                    <td>
                      <span>{paymentSourceLabel(row.paymentSource)}</span>
                      {row.sourceLabel ? (
                        <span className="table-subline">
                          <br />
                          {row.sourceLabel}
                        </span>
                      ) : null}
                      {row.card ? (
                        <span className="table-subline">
                          <br />
                          {row.card.bankName} ••••{row.card.last4Digits}
                        </span>
                      ) : null}
                    </td>
                    <td>{formatNumber(row.quantity)}</td>
                    <td>{formatTry(row.buyPriceTry)}</td>
                    <td>{row.livePrice != null ? formatTry(row.livePrice) : "-"}</td>
                    <td>{formatTry(row.cost)}</td>
                    <td>{row.currentValue != null ? formatTry(row.currentValue) : "-"}</td>
                    <td className={row.pnl == null ? "" : row.pnl >= 0 ? "value-positive" : "value-negative"}>
                      {row.pnl != null ? formatTry(row.pnl) : "-"}
                    </td>
                    <td>
                      {isDemoInvestment(row) ? (
                        <span className="demo-table-actions-hint">Örnek kayıt</span>
                      ) : (
                        <>
                          <button type="button" className="btn-secondary table-action-btn" onClick={() => onEdit(row)}>
                            Düzenle
                          </button>
                          <button type="button" className="btn-delete table-action-btn" onClick={() => onDelete(row.id)}>
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
