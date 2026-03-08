# FinWise Backend (API)

Node.js + Express + PostgreSQL + Prisma + JWT.

## Gereksinimler

- Node.js 18+
- PostgreSQL 14+ (yerel kurulum veya Docker)

## PostgreSQL Kurulumu

### Windows (yerel)

1. [PostgreSQL indir](https://www.postgresql.org/download/windows/) ve kur.
2. Kurulum sırasında bir **süper kullanıcı şifresi** belirle (örn. `postgres`).
3. Varsayılan port: `5432`.
4. İstersen pgAdmin ile yeni bir veritabanı oluştur: `finwise`.

Komut satırından veritabanı oluşturmak için (psql veya SQL Shell):

```sql
CREATE DATABASE finwise;
```

### macOS (Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb finwise
```

### Docker ile PostgreSQL

```bash
docker run -d --name finwise-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=finwise -p 5432:5432 postgres:16-alpine
```

## Proje Kurulumu

```bash
cd backend
npm install
```

## Ortam Değişkenleri

`.env.example` dosyasını kopyalayıp `.env` yapın ve değerleri düzenleyin:

```bash
cp .env.example .env
```

Örnek `.env`:

```env
DATABASE_URL="postgresql://postgres:SIFRENIZ@localhost:5432/finwise?schema=public"
JWT_SECRET="güçlü-rastgele-bir-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
```

- `postgres`: PostgreSQL kullanıcı adı  
- `SIFRENIZ`: PostgreSQL şifresi  
- `finwise`: veritabanı adı  

## Prisma Komutları

| Komut | Açıklama |
|-------|----------|
| `npm run db:generate` | Prisma Client üretir (schema değişince) |
| `npm run db:migrate` | Geliştirme migration’ı oluşturur ve uygular |
| `npm run db:migrate:deploy` | Production’da mevcut migration’ları uygular |
| `npm run db:push` | Şemayı DB’ye doğrudan senkronize eder (prototip için) |
| `npm run db:seed` | Örnek kullanıcı ve harcama ekler |
| `npm run db:studio` | Prisma Studio açar (tarayıcıda veri görüntüleme) |

### İlk kurulumda (migration + seed)

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Migration sırasında bir **migration adı** istenir (örn. `init`).

### Veritabanı bağlantısını test etmek

```bash
npx prisma db pull
```

Hata yoksa bağlantı çalışıyordur. İsterseniz:

```bash
npm run db:studio
```

ile tarayıcıda tabloları ve veriyi kontrol edebilirsiniz.

## Sunucuyu çalıştırma

```bash
npm start
```

Geliştirme (dosya değişince yeniden başlatma):

```bash
npm run dev
```

API: `http://localhost:5000`

## API Özeti

- **POST /auth/register** — Kayıt (name, email, password)
- **POST /auth/login** — Giriş (email, password) → `token` döner
- **GET /auth/me** — Giriş yapmış kullanıcı bilgisi (Header: `Authorization: Bearer <token>`)
- **GET /expenses** — Kendi harcamalarım (auth gerekli)
- **GET /expenses/:id** — Tek harcama (auth + sahiplik)
- **POST /expenses** — Yeni harcama (auth gerekli)
- **PUT /expenses/:id** — Güncelle (auth + sahiplik)
- **DELETE /expenses/:id** — Sil (auth + sahiplik)

Harcama istek gövdesi: `{ amount, category, date?, description? }`  
Kategori: `Gıda`, `Ulaşım`, `Fatura`, `Eğlence`, `Diğer`
