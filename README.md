# FinWise

Kişisel harcama takip uygulaması — kullanıcı bazlı, JWT kimlik doğrulama ve PostgreSQL.

## Yapı

- **backend/** — Node.js + Express + Prisma + PostgreSQL + JWT API
- **web/** — React + Vite arayüzü (giriş, kayıt, harcama CRUD)

## Hızlı başlangıç

### 1. PostgreSQL

PostgreSQL kurulu ve çalışır olmalı. Veritabanı oluşturun:

```sql
CREATE DATABASE finwise;
```

Örnek bağlantı: `postgresql://postgres:SIFRE@localhost:5432/finwise`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# .env içinde DATABASE_URL ve JWT_SECRET değerlerini düzenleyin
npm run db:generate
npm run db:migrate
npm run db:seed
npm start
```

API: http://localhost:5000

### 3. Frontend

```bash
cd web
npm install
npm run dev
```

Tarayıcı: http://localhost:5173

Demo giriş (seed sonrası): **demo@finwise.local** / **demo1234**

## Komutlar

| Konum   | Komut              | Açıklama              |
|---------|--------------------|------------------------|
| backend | `npm start`        | API’yi başlatır       |
| backend | `npm run dev`      | API (watch mode)      |
| backend | `npm run db:migrate` | Migration oluşturur/uygular |
| backend | `npm run db:seed`  | Örnek kullanıcı/harcama |
| backend | `npm run db:studio` | Prisma Studio         |
| web     | `npm run dev`      | Geliştirme sunucusu   |
| web     | `npm run build`    | Production build      |

Detaylı kurulum ve PostgreSQL seçenekleri için **backend/README.md** dosyasına bakın.
