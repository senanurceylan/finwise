# 💰 FinWise – Personal Finance Management Platform

FinWise is a full-stack personal finance management platform developed for both **web** and **mobile** environments.

The application allows users to:

* Track daily expenses
* Analyze monthly spending behavior
* Upload and analyze PDF bank statements
* Manage recurring payments
* Monitor category-based budgets
* Visualize financial data with charts and summaries

The project was developed as a modern fintech-style university project using React, React Native, Express.js, Prisma, and PostgreSQL.

---

# 🚀 Features

## 🔐 Authentication System

* JWT-based authentication
* User registration and login
* Protected API routes
* Persistent session management

---

## 📊 Expense Management

Users can:

* Add expenses manually
* Categorize transactions
* Edit and delete expenses
* View expense history

Supported categories include:

* Food
* Transportation
* Bills
* Entertainment
* Technology
* Other

---

## 📄 PDF Bank Statement Analysis

Users can upload PDF bank statements.

The system:

* Extracts text from PDF files
* Parses transaction information
* Detects spending categories
* Generates financial summaries
* Displays categorized expense analysis

### Backend Endpoint

POST `/statement/analyze`

### Technologies

* pdfjs-dist
* Express.js
* Multer

---

## 📈 Monthly Expense Summary

The backend provides monthly financial analytics.

### Features

* Monthly total spending
* Category-based totals
* Highest spending category
* Spending statistics

### Endpoint

GET `/expenses/summary/monthly`

Example response:

```json
{
  "totalExpense": 12500,
  "categoryTotals": {
    "GIDA": 4200,
    "ULASIM": 1500,
    "FATURA": 3000
  },
  "highestCategory": "GIDA"
}
```

---

## 💸 Budget Tracking & Warning System

Users can define monthly spending limits by category.

The system calculates:

* Current spending
* Usage percentage
* Budget status

### Budget Status Types

* 🟢 Safe
* 🟡 Warning
* 🔴 Exceeded

### Backend Endpoints

POST `/budgets`

GET `/budgets/status`

### Example

* Monthly food budget: 3000 TL
* Current spending: 2700 TL
* Usage: 90%
* Status: Warning

Both web and mobile applications include visual budget dashboards with progress bars.

---

## 🔁 Recurring Payments

Users can manage recurring payments such as:

* Rent
* Subscriptions
* Bills
* Loans

Features:

* Due date tracking
* Reminder system
* Payment organization

---

# 📱 Platforms

## Web Application

Built with:

* React
* Vite
* Chart-based visualizations

## Mobile Application

Built with:

* React Native
* Expo

Both applications communicate with the same backend API.

---

# 🏗️ System Architecture

```text
Web Application (React)
        │
        │
Mobile Application (React Native)
        │
        ▼
Backend API (Node.js + Express)
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL Database
```

---

# 🧩 Technology Stack

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Multer
* pdfjs-dist

## Frontend (Web)

* React
* Vite
* CSS

## Mobile

* React Native
* Expo

---

# ⚡ Installation

## 1. Clone Repository

```bash
git clone https://github.com/senanurceylan/finwise.git
cd finwise
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/finwise
JWT_SECRET=your_secret_key
```

Run database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Start backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

## 3. Web Setup

```bash
cd web
npm install
npm run dev
```

Web runs on:

```text
http://localhost:5173
```

---

## 4. Mobile Setup

```bash
cd mobile
npm install
npx expo start --web
```

---

# 👩‍💻 Developer

**Sena Nur Ceylan**
Software Engineering Student
Fırat University

---

# 📌 Project Status

✅ Active Development
✅ Web Application
✅ Mobile Application
✅ Backend API
✅ PostgreSQL Integration
✅ PDF Statement Analysis
✅ Budget Tracking System

---------------------------------------------------------------------------------------------
# 💰 FinWise – Kişisel Finans Yönetim Platformu

FinWise, hem **web** hem de **mobil** platformlar için geliştirilmiş full-stack bir kişisel finans yönetim uygulamasıdır.

Uygulama kullanıcıların:

* Günlük harcamalarını takip etmesini
* Aylık harcama davranışlarını analiz etmesini
* PDF banka ekstrelerini analiz etmesini
* Düzenli ödemelerini yönetmesini
* Kategori bazlı bütçe limitleri oluşturmasını
* Finansal verilerini grafiklerle görüntülemesini

sağlar.

Proje; React, React Native, Express.js, Prisma ve PostgreSQL kullanılarak modern fintech tarzında geliştirilmiştir.

---

# 🚀 Özellikler

## 🔐 Kimlik Doğrulama Sistemi

* JWT tabanlı authentication sistemi
* Kullanıcı kayıt ve giriş işlemleri
* Korumalı API endpointleri
* Oturum yönetimi

---

## 📊 Harcama Yönetimi

Kullanıcılar:

* Manuel harcama ekleyebilir
* İşlemleri kategorilere ayırabilir
* Harcamaları düzenleyebilir ve silebilir
* Geçmiş harcamaları görüntüleyebilir

Desteklenen kategoriler:

* Gıda
* Ulaşım
* Fatura
* Eğlence
* Teknoloji
* Diğer

---

## 📄 PDF Banka Ekstresi Analizi

Kullanıcılar PDF formatındaki banka ekstrelerini yükleyebilir.

Sistem:

* PDF dosyasından metin çıkarır
* İşlem satırlarını ayrıştırır
* Harcama kategorilerini analiz eder
* Finansal özet oluşturur
* Kategori bazlı harcama analizi sunar

### Backend Endpoint

POST `/statement/analyze`

### Kullanılan Teknolojiler

* pdfjs-dist
* Express.js
* Multer

---

## 📈 Aylık Harcama Özeti

Backend tarafında aylık finansal analiz endpoint’i bulunmaktadır.

### Özellikler

* Aylık toplam harcama
* Kategori bazlı toplamlar
* En yüksek harcama kategorisi
* Harcama istatistikleri

### Endpoint

GET `/expenses/summary/monthly`

Örnek response:

```json id="u8f9wl"
{
  "totalExpense": 12500,
  "categoryTotals": {
    "GIDA": 4200,
    "ULASIM": 1500,
    "FATURA": 3000
  },
  "highestCategory": "GIDA"
}
```

---

## 💸 Bütçe Takip ve Uyarı Sistemi

Kullanıcılar kategori bazlı aylık bütçe limitleri oluşturabilir.

Sistem:

* Güncel harcamayı hesaplar
* Kullanım yüzdesini gösterir
* Limit durumunu analiz eder

### Bütçe Durumları

* 🟢 Güvenli
* 🟡 Uyarı
* 🔴 Limit Aşıldı

### Backend Endpointleri

POST `/budgets`

GET `/budgets/status`

### Örnek

* Aylık gıda bütçesi: 3000 TL
* Güncel harcama: 2700 TL
* Kullanım oranı: %90
* Durum: Uyarı

Hem web hem mobil uygulamada progress bar destekli bütçe ekranı bulunmaktadır.

---

## 🔁 Düzenli Ödemeler

Kullanıcılar aşağıdaki gibi düzenli ödemeleri yönetebilir:

* Kira
* Abonelikler
* Faturalar
* Kredi ödemeleri

Özellikler:

* Son ödeme tarihi takibi
* Hatırlatma sistemi
* Düzenli ödeme organizasyonu

---

# 📱 Platformlar

## Web Uygulaması

Kullanılan teknolojiler:

* React
* Vite
* Grafik ve veri görselleştirme bileşenleri

## Mobil Uygulama

Kullanılan teknolojiler:

* React Native
* Expo

Her iki platform da aynı backend API ile iletişim kurmaktadır.

---

# 🏗️ Sistem Mimarisi

```text id="efp1po"
Web Uygulaması (React)
        │
        │
Mobil Uygulama (React Native)
        │
        ▼
Backend API (Node.js + Express)
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL Veritabanı
```

---

# 🧩 Kullanılan Teknolojiler

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Multer
* pdfjs-dist

## Frontend (Web)

* React
* Vite
* CSS

## Mobil

* React Native
* Expo

---

# ⚡ Kurulum

## 1. Projeyi Klonlama

```bash id="1u4glw"
git clone https://github.com/senanurceylan/finwise.git
cd finwise
```

---

## 2. Backend Kurulumu

```bash id="sr9xjlwm"
cd backend
npm install
```

`.env` dosyası oluşturun:

```env id="h7vhlr"
DATABASE_URL=postgresql://postgres:SIFRE@localhost:5432/finwise
JWT_SECRET=your_secret_key
```

Veritabanını hazırlayın:

```bash id="ysjlwm"
npm run db:generate
npm run db:migrate
npm run db:seed
```

Backend’i başlatın:

```bash id="lwpfzt"
npm run dev
```

Backend adresi:

```text id="6b5q84"
http://localhost:5000
```

---

## 3. Web Kurulumu

```bash id="0n2hlu"
cd web
npm install
npm run dev
```

Web adresi:

```text id="xmbx2x"
http://localhost:5173
```

---

## 4. Mobil Kurulum

```bash id="z79zv1"
cd mobile
npm install
npx expo start --web
```

---

# 👩‍💻 Geliştirici

**Sena Nur Ceylan**
Yazılım Mühendisliği Öğrencisi
Fırat Üniversitesi

---

# 📌 Proje Durumu

✅ Aktif Geliştirme
✅ Web Uygulaması
✅ Mobil Uygulama
✅ Backend API
✅ PostgreSQL Entegrasyonu
✅ PDF Ekstre Analizi
✅ Bütçe Takip Sistemi
