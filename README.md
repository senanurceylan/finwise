# Finwise
# FinWise — Finansal Sağlık Skoru & Harcama Risk Analizi (Web + Mobil)

FinWise, kullanıcıların harcama verilerini analiz ederek **finansal sağlık skorunu** ve **risk seviyesini** (Düşük/Orta/Yüksek) hesaplayan; **anormal harcama artışlarını** tespit edip kullanıcıya anlaşılır uyarılar ve öneriler sunan bir **web + mobil** uygulamadır.

> Not: Bu proje eğitim amaçlıdır. Gerçek banka sistemleriyle entegre değildir.

---

## 🎯 Proje Ne İşe Yarar?

- Kullanıcının gelir–gider dengesini görmesini sağlar  
- Harcamalarda **olağandışı artışları** tespit eder (ör. bu ay alışveriş %180 artmış)  
- “Bu hızla giderse ay sonu açık verebilirsin” gibi **risk uyarıları** üretir  
- Kategori bazlı grafiklerle harcamaları anlaşılır hale getirir  
- İster kullanıcı verisiyle, ister demo verilerle çalışır

---

## 👥 Kimler Faydalanabilir?

- Öğrenciler (bütçe kontrolü ve tasarruf hedefi)
- Çalışanlar (aylık harcama takibi, risk uyarıları)
- Bankacılık/fintek odaklı ekipler (müşteri davranışı analizi demosu)
- Finansal okuryazarlık geliştirmek isteyen herkes

---

## 🧠 Yapay Zekâ / Analiz Kısmı

Bu projede “AI” şu görevlerde kullanılır:

1) **Anomali Tespiti (Anormal Harcama)**
- Kullanıcının geçmişine göre olağandışı artışları bulur
- Basit yöntemler: Z-score / IQR / hareketli ortalama

2) **Risk Skoru**
- Gelir-gider oranı, tasarruf oranı, borç oranı, harcama trendi gibi sinyallerle 0–100 arası skor üretir  
- Skor aralığı:
  - 0–40: Düşük Risk
  - 41–70: Orta Risk
  - 71–100: Yüksek Risk

3) (Opsiyonel) **Kategori Önerisi**
- Harcama açıklamasına göre kategori önerir (NLP ile)

---

## 🧩 Kullanılacak Teknolojiler

### Frontend
- Web: React
- Mobil: React Native

### Backend
- FastAPI (Python) *(model entegrasyonu kolay olduğu için)*

### Database & Cloud
- Supabase (PostgreSQL + Auth)
- (Opsiyonel) Supabase Storage: CSV/PDF rapor yükleme

### AI/ML
- pandas, scikit-learn
- (Opsiyonel) matplotlib / plotly

---

## 🏗️ Mimari (Basit Anlatım)

Web ve Mobil uygulama **aynı backend API** üzerinden çalışır ve **aynı bulut veritabanını** kullanır.

- Web (React)  → API (FastAPI) → DB (Supabase)
- Mobil (React Native) → API (FastAPI) → DB (Supabase)

> Web/Mobil doğrudan DB’ye bağlanmaz, API üzerinden iletişim kurar.

---

## ✅ Temel Özellikler (MVP)

- Kullanıcı kayıt / giriş
- Harcama ekleme (tutar, tarih, kategori, açıklama)
- Harcama listeleme
- Aylık özet ve grafikler
- Anomali uyarıları
- Finansal sağlık skoru + risk seviyesi

---

## 🗺️ Sprint Planı (Öneri)

### Sprint 0 — Kurulum
- Repo yapısı, temel iskelet, Supabase proje oluşturma

### Sprint 1 — CRUD & Akış
- Harcama ekle/listele API
- Web + mobil temel ekranlar

### Sprint 2 — Risk Skoru & Anomali
- Risk skoru hesaplama
- Anomali tespiti ve uyarı üretimi

### Sprint 3 — Ürünleştirme
- Dashboard, filtreler, rapor
- (Opsiyonel) CSV yükleme / bildirim

---

## 📁 Önerilen Klasör Yapısı

- `backend/`  → FastAPI
- `web/`      → React
- `mobile/`   → React Native
- `docs/`     → diyagramlar, raporlar

---

## 🚀 Çalıştırma (sonradan dolduracağız)

> Bu kısım proje kurulumları netleşince güncellenecek.

---

## 📌 Lisans
Eğitim amaçlı proje.
