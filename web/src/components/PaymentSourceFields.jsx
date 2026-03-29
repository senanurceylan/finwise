import { PAYMENT_SOURCE_OPTIONS, isCardPaymentSource } from "../constants/paymentSources";

/**
 * Önce ödeme kaynağı; kredi/banka kartı seçilirse isteğe bağlı kart listesi.
 */
export default function PaymentSourceFields({
  paymentSource,
  cardId,
  cards = [],
  onChange,
  idPrefix = "pay",
  showInvestmentPlatformHint = false,
}) {
  const showCardSelect = isCardPaymentSource(paymentSource);

  return (
    <>
      <div className="form-field">
        <label htmlFor={`${idPrefix}-source`}>Ödeme kaynağı</label>
        <select
          id={`${idPrefix}-source`}
          value={paymentSource}
          onChange={(e) => {
            const next = e.target.value;
            onChange({
              paymentSource: next,
              cardId: isCardPaymentSource(next) ? cardId : "",
            });
          }}
        >
          {PAYMENT_SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {showCardSelect ? (
        <div className="form-field">
          <label htmlFor={`${idPrefix}-card`}>Kart (isteğe bağlı)</label>
          <select
            id={`${idPrefix}-card`}
            value={cardId || ""}
            onChange={(e) => onChange({ paymentSource, cardId: e.target.value || "" })}
          >
            <option value="">Kart seçilmedi</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.bankName} — {c.cardName} ••••{c.last4Digits}
              </option>
            ))}
          </select>
          {cards.length === 0 ? (
            <p className="field-hint-text">
              Kayıtlı kart yok. İsterseniz <a href="#/cards">Kartlarım</a> sayfasından ekleyebilirsiniz.
            </p>
          ) : null}
        </div>
      ) : null}

      {showInvestmentPlatformHint && paymentSource === "investment_platform" ? (
        <p className="field-hint-text">Platform adını aşağıdaki alana yazabilirsiniz.</p>
      ) : null}
    </>
  );
}
