# FinWise — Teknik Doküman ve Kullanıcı Senaryoları Raporu

## 1. Projenin Amacı

**FinWise**, kişisel harcamaları kaydetmek ve listelemek için geliştirilmiş bir **harcama takip (expense tracking)** uygulamasıdır. Kullanıcılar:

- Harcama ekleyebilir (tutar, kategori, tarih, açıklama)
- Tüm harcamaları tek ekranda liste halinde görebilir
- Harcamaları kategorilere göre (Gıda, Ulaşım, Fatura, Eğlence, Diğer) sınıflandırabilir

Proje şu an **MVP (Minimum Viable Product)** aşamasındadır: temel ekleme ve listeleme işlevleri çalışır durumda, ileride raporlama, filtreleme ve kalıcı veri deposu gibi özellikler eklenebilir.

---

## 2. Kullanılan Teknolojiler

### 2.1 Frontend (Web Arayüzü)

| Teknoloji | Sürüm | Açıklama |
|-----------|--------|----------|
| **React** | 19.x | Arayüz bileşenleri ve state yönetimi |
| **Vite** | 7.x | Derleme, geliştirme sunucusu ve build aracı |
| **JavaScript (JSX)** | ES modules | Uygulama dili |
| **CSS** | Vanilla | Binance tarzı koyu tema, responsive form ve kart stilleri |

- **State:** Sadece React `useState` ve `useEffect` (harici state kütüphanesi yok).
- **HTTP:** Tarayıcı yerel `fetch` API ile backend’e istek atılıyor.
- **Stil:** Tüm stiller `App.css` ve `index.css` ile; ek bir UI framework (Bootstrap, Tailwind vb.) kullanılmıyor.

### 2.2 Backend (API Sunucusu)

| Teknoloji | Sürüm | Açıklama |
|-----------|--------|----------|
| **Node.js** | - | Sunucu ortamı |
| **Express** | 5.x | HTTP API ve route yönetimi |
| **CORS** | 2.x | Tarayıcıdan gelen isteklere izin vermek için |

- **Veri deposu:** Şu an sadece **bellek (in-memory)**; sunucu kapatılınca veriler silinir. Kalıcı depo (veritabanı) henüz yok.
- **Port:** Backend `http://localhost:5000` üzerinde çalışır.

### 2.3 Genel Mimari

```
┌─────────────────────┐         HTTP (JSON)         ┌─────────────────────┐
│   Tarayıcı          │  ◄──────────────────────►   │   Backend (Node)     │
│   React + Vite      │   GET/POST /expenses        │   Express, port 5000 │
│   (örn. :5173)      │                             │   In-memory store    │
└─────────────────────┘                             └─────────────────────┘
```

- **Frontend:** Vite dev server (varsayılan `http://localhost:5173`) üzerinde çalışır; sayfa yüklenirken ve form gönderilirken backend’e istek atar.
- **Backend:** REST API sunar; CORS ile aynı makinedeki farklı portlardan gelen isteklere izin verir.

---

## 3. Teknik Yapı

### 3.1 Proje Klasör Yapısı

```
finwise/
├── backend/
│   ├── server.js      # Express API (GET/POST /expenses)
│   └── package.json
├── web/
│   ├── src/
│   │   ├── App.jsx    # Ana sayfa: form + harcama listesi
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── TEKNIK_RAPOR.md    # Bu döküman
```

### 3.2 Backend API

- **Base URL:** `http://localhost:5000`
- **Uç noktalar:**

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Sunucu durumu; `{ message: "FinWise backend running" }` döner. |
| GET | `/expenses` | Tüm harcamaları JSON array olarak döner. |
| POST | `/expenses` | Yeni harcama ekler; gövde: `{ amount, category, date, description }`. |

- **Harcama nesnesi (örnek):**

```json
{
  "id": 1,
  "amount": 45.99,
  "category": "Gıda",
  "date": "2025-03-01",
  "description": "Market alışverişi"
}
```

### 3.3 Frontend Akışı

1. **Sayfa yükleme:** `useEffect` ile `GET http://localhost:5000/expenses` çağrılır; gelen dizi `expenses` state’ine yazılır.
2. **Form gönderme:** Kullanıcı "Kaydet"e basınca `POST http://localhost:5000/expenses` ile yeni harcama gönderilir; dönen kayıt mevcut listeye eklenir, form alanları temizlenir.
3. **Görüntüleme:** `expenses` listesi "Harcamalar" bölümünde kartlar halinde gösterilir (kategori, tutar TL, tarih, açıklama). Liste boşsa "Henüz harcama bulunmuyor" mesajı gösterilir.

### 3.4 Arayüz (UI) Tasarımı

- **Tema:** Binance benzeri koyu tema (koyu arka plan, sarı vurgu rengi `#f0b90b`).
- **Bileşenler:** Başlık (FinWise), alt başlık (Harcama Ekle), form kartı, "Harcamalar" listesi kartı; her harcama satırı ayrı bir kart/row olarak stillenmiş.

---

## 4. Kullanıcı Senaryoları

### Senaryo 1: İlk kez uygulamayı açma ve harcama listesini görme

1. Kullanıcı backend’i çalıştırır (`cd backend && npm start`).
2. Kullanıcı frontend’i açar (`cd web && npm run dev`) ve tarayıcıda `http://localhost:5173` adresine gider.
3. Sayfa yüklenir; uygulama otomatik olarak `GET /expenses` ile harcamaları çeker.
4. **Sonuç:** Backend’de veri varsa "Harcamalar" bölümünde liste görünür; yoksa "Henüz harcama bulunmuyor" mesajı görünür.

### Senaryo 2: Yeni harcama ekleme

1. Kullanıcı "Harcama Ekle" formunu doldurur:
   - **Harcama Tutarı:** Örn. 150.50
   - **Kategori:** Gıda / Ulaşım / Fatura / Eğlence / Diğer
   - **Tarih:** Takvimden seçer
   - **Açıklama:** İsteğe bağlı kısa not
2. "Kaydet" butonuna tıklar.
3. **Sonuç:** Harcama backend’e POST edilir; sayfada listeye anında eklenir, form sıfırlanır.

### Senaryo 3: Mevcut harcamaları inceleme

1. Kullanıcı sayfayı açar veya yeni harcama ekledikten sonra aynı sayfada kalır.
2. "Harcamalar" bölümünde her satırda **kategori**, **tutar (TL)**, **tarih** ve **açıklama** görür.
3. **Sonuç:** Tüm kayıtlar kartlar halinde okunabilir şekilde listelenir.

### Senaryo 4: Backend kapalıyken uygulamayı kullanma

1. Backend çalışmıyorken kullanıcı `http://localhost:5173` sayfasını açar.
2. **Sonuç:** `GET /expenses` başarısız olur; uygulama hata vermeden listeyi boş gösterir ("Henüz harcama bulunmuyor"). Yeni harcama eklemek için "Kaydet"e basılırsa istek yine başarısız olur; liste değişmez, kullanıcıya ek bilgi gösterilmez (ileride hata mesajı eklenebilir).

### Senaryo 5: Geliştirici olarak API’yi doğrudan test etme

1. Backend çalışırken tarayıcı veya Postman ile `http://localhost:5000/expenses` adresine GET isteği atılır.
2. **Sonuç:** Tüm harcamalar JSON array olarak döner.
3. POST ile `{ "amount": 100, "category": "Ulaşım", "date": "2025-03-06", "description": "Taksi" }` gönderilirse yeni kayıt oluşturulur ve response’ta id’li nesne döner.

---

## 5. Çalıştırma Talimatları

### Backend

```bash
cd finwise/backend
npm install   # İlk seferde
npm start
```

Sunucu `http://localhost:5000` üzerinde çalışır.

### Frontend

```bash
cd finwise/web
npm install   # İlk seferde
npm run dev
```

Tarayıcıda `http://localhost:5173` (veya Vite’ın gösterdiği adres) açılır. Uygulamanın veri alabilmesi için backend’in açık olması gerekir.

---

## 6. Mevcut Sınırlamalar ve İleride Yapılabilecekler

| Konu | Şu anki durum | Olası geliştirme |
|------|----------------|-------------------|
| Veri kalıcılığı | Sadece bellek; sunucu kapanınca veri silinir | SQLite, PostgreSQL veya MongoDB ile kalıcı depo |
| Hata bildirimi | Backend hata verince kullanıcıya mesaj yok | Toast veya inline “Bağlantı hatası” mesajı |
| Silme / düzenleme | Yok | DELETE / PUT endpoint’leri ve UI |
| Filtreleme / arama | Yok | Tarih ve kategori filtreleri, arama alanı |
| Raporlama | Yok | Aylık özet, kategori bazlı grafikler |
| Kimlik doğrulama | Yok | Kullanıcı girişi, kullanıcıya özel harcamalar |
| Para birimi | Sabit TL | Çoklu para birimi veya ayarlanabilir birim |

---

## 7. Özet

**FinWise**, React (Vite) ve Node.js (Express) ile geliştirilmiş, koyu temalı bir harcama takip uygulamasıdır. Kullanıcılar form üzerinden harcama ekler, eklenen ve mevcut harcamalar "Harcamalar" bölümünde listelenir. Veri şu an backend bellekte tutulur; teknik rapor ve kullanıcı senaryoları bu dökümanda özetlenmiştir. İleride kalıcı veritabanı, silme/düzenleme, filtreleme ve raporlama eklenerek ürün genişletilebilir.
