const HOW_IT_WORKS = {
  tr: [
    "Hesabına giriş yap ve panelini aç.",
    "Harcamalarını kategori, tarih ve açıklama ile kaydet.",
    "Geçmiş kayıtlarını görüntüleyip bütçeni daha iyi yönet.",
  ],
  en: [
    "Sign in and open your personal dashboard.",
    "Save expenses with category, date, and description.",
    "Review history and make smarter budgeting decisions.",
  ],
};

export default function HomeLanding({ language, onGoExpenses }) {
  const t = language === "en" ? "en" : "tr";

  return (
    <div className="landing-page">
      <section className="landing-hero card" id="home">
        <p className="landing-kicker">FinWise</p>
        <h1 className="landing-title">
          {t === "tr"
            ? "Kişisel finansını kolayca yönet, bütçeni kontrol altında tut."
            : "Manage your personal finances easily and keep your budget in control."}
        </h1>
        <p className="landing-text">
          {t === "tr"
            ? "Modern ve sade panelinle harcamalarını kaydet, kategorilere ayır ve verilerini güvenle takip et."
            : "Track spending securely with a modern dashboard, clear categories, and a clean flow."}
        </p>
        <div className="landing-cta-group">
          <button type="button" className="btn-primary btn-primary-inline" onClick={onGoExpenses}>
            {t === "tr" ? "Harcamaları Gör" : "View Expenses"}
          </button>
          <button type="button" className="btn-secondary" onClick={onGoExpenses}>
            {t === "tr" ? "Raporları İncele" : "Explore Reports"}
          </button>
        </div>
      </section>

      <section className="how-section card" id="about">
        <h2 className="section-title">{t === "tr" ? "Nasıl Çalışır?" : "How It Works?"}</h2>
        <ol className="how-list">
          {HOW_IT_WORKS[t].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <footer className="landing-footer" id="contact">
        <p>
          {t === "tr"
            ? "FinWise ile finansal hedeflerine daha yakın ol."
            : "Get closer to your financial goals with FinWise."}
        </p>
      </footer>
    </div>
  );
}
