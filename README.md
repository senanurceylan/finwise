# FinWise AI 💳📊
## Banka Ekstresi Analiz ve Finansal Risk Uygulaması (Web + Mobil)

FinWise AI, kullanıcıların yüklediği banka hesap ekstresi PDF’lerini analiz ederek harcamaları otomatik olarak kategorize eden, grafiksel raporlar sunan ve finansal risk uyarıları üreten yapay zekâ destekli web ve mobil uygulamadır.

Bu proje, bireysel finans yönetimini kolaylaştırmayı ve harcama farkındalığı oluşturmayı amaçlamaktadır.

---

# 🚀 Proje Amacı

- Ekstre PDF’lerini otomatik analiz etmek
- İşlemleri kategorilere ayırmak
- Harcama dağılımını grafiklerle göstermek
- Anormal harcama artışlarını tespit etmek
- Kullanıcıya finansal sağlık skoru sunmak

---

# 🧠 Yapay Zekâ Kullanımı

Proje içerisinde:

- Metin sınıflandırma modeli (Transaction Description → Category)
- Anomali tespiti (harcama artış analizi)
- Finansal risk skoru hesaplama

kullanılmaktadır.

Model, kategori etiketli finansal işlem dataset’i ile eğitilmektedir.

---

# 🏗️ Sistem Mimarisi

Web (React)
↓  
Mobil (React Native)
↓  
Backend API (FastAPI)
↓  
Supabase (PostgreSQL + Auth + Storage)

---

# 🖥️ Backend Özellikleri (FastAPI)

Backend aşağıdaki görevleri yerine getirir:

- PDF yükleme endpointi
- PDF içinden işlem satırlarını çıkarma
- İşlem verilerini veritabanına kaydetme
- Kategori tahmini (eğitilmiş model kullanarak)
- Harcama analiz hesaplamaları
- Finansal risk skoru hesaplama
- Anomali tespiti
- Kullanıcı bazlı veri filtreleme
- JWT tabanlı kimlik doğrulama

---

# 📂 Backend Klasör Yapısı

backend/
│
├── main.py
├── routes/
│   ├── auth.py
│   ├── transactions.py
│   ├── upload.py
│
├── services/
│   ├── pdf_parser.py
│   ├── classifier.py
│   ├── risk_engine.py
│
├── models/
│   ├── trained_model.pkl
│
├── database/
│   ├── db.py
│
└── requirements.txt

---

# 📊 Veri Akışı

1. Kullanıcı PDF yükler.
2. PDF backend tarafından parse edilir.
3. İşlem açıklamaları modele gönderilir.
4. Model kategori tahmini yapar.
5. İşlemler veritabanına kaydedilir.
6. Harcama analizleri hesaplanır.
7. Grafik ve risk sonuçları frontend'e döndürülür.

---

# 📌 MVP Özellikleri

- Kullanıcı kayıt / giriş
- PDF ekstre yükleme
- İşlem listeleme
- Otomatik kategori tahmini
- Grafiksel harcama analizi
- Aylık artış uyarıları
- Finansal sağlık skoru

---

# 🔮 Gelecek Geliştirmeler

- Ticari kart desteği
- Gelişmiş ML modeli
- Abonelik tespiti
- Otomatik bütçe önerileri
- Çoklu banka format desteği

---

# 🛠️ Kullanılan Teknolojiler

Backend:
- FastAPI
- Python
- pandas
- scikit-learn
- Supabase

Frontend:
- React

Mobil:
- React Native

Bulut:
- Supabase Storage
- PostgreSQL

---

# 🔒 Güvenlik

- JWT authentication
- Kullanıcı bazlı veri izolasyonu
- PDF verileri güvenli bulut depolama
- Hassas bilgilerin maskeleme planı

---

# 📈 Proje Durumu

MVP geliştirme aşamasında.
Ticari kart modülü geliştirme planındadır.

---

# 👩‍💻 Geliştirici

Sena Nur Ceylan  
Software Engineering Student
