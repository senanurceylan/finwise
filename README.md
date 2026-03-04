# 💰 SmartSpend – Personal Finance Analyzer

A web and mobile personal finance management application that helps users track expenses, analyze spending behavior, detect unusual spending patterns, and manage recurring payments.

The system allows users to manually add transactions or upload bank statements (PDF) to extract and analyze financial activity.

---

# 🚀 Project Overview

SmartSpend is a full-stack fintech-style application designed to help users understand and manage their financial behavior.

Users can:

- Track daily expenses
- Categorize transactions
- Visualize spending patterns
- Detect unusual spending (anomalies)
- Manage recurring payments
- Receive reminders for upcoming payments
- Analyze bank statements uploaded as PDF files

The system provides data-driven insights using statistical analysis and rule-based anomaly detection.

---

# 🎯 Key Features

## 📊 Expense Tracking

Users can manually add their financial transactions.

Each transaction includes:

- Amount
- Category
- Date
- Description

Transactions are stored in the database and used for analytics.

---

## 📈 Spending Analytics

The system generates financial insights such as:

- Monthly spending totals
- Category distribution
- Spending trends over time

Example insights:

- “Your online shopping expenses increased by 40% this month.”
- “Transportation spending is above your average.”

---

## ⚠️ Anomaly Detection

The application detects unusual spending patterns using statistical rules.

Examples:

- Category spending increased significantly compared to the last 3 months
- A single unusually large transaction was detected

Example message:

Your online shopping expenses increased by 42% compared to the last 3 months.

---

## 🔁 Recurring Payments

Users can create recurring payments such as:

- Rent
- Subscriptions (Netflix, Spotify)
- Loans

The system allows:

- Monthly payment scheduling
- Reminder notifications before due dates

Example reminder:

Your Spotify payment is due in 2 days.

---

## 📄 Bank Statement Analysis (PDF)

Users can upload bank statement PDFs.

The system will:

1. Extract text from the PDF
2. Identify transaction rows
3. Parse transaction data
4. Convert them into structured transaction records

Extracted data fields include:

- Date
- Description
- Amount

Users can review and confirm extracted transactions before saving them.

---

# 🧠 How Anomaly Detection Works

Anomalies are detected using statistical comparisons.

Example method:

Last 3 months average spending = 1000 TL  
Current month spending = 1600 TL  

Increase rate:

(1600 - 1000) / 1000 = 60%

If the increase exceeds a predefined threshold (e.g., 30%), it is flagged as an anomaly.

---

# 🏗️ System Architecture

Web Application (React)
        │
        │
Mobile Application (React Native)
        │
        ▼
Backend API (FastAPI)
        │
        ▼
PostgreSQL Database
        │
        ▼
Analytics & Detection Engine

Both the web and mobile applications communicate with the same backend API.

---

# 🗄️ Database Design

Main database tables:

### Users
Stores user account information.

### Transactions
Stores financial records.

Fields include:

- amount
- category
- description
- date
- user_id

### Categories
Defines expense categories such as:

- Food
- Transportation
- Entertainment
- Shopping

### Recurring Payments
Stores scheduled payments.

Fields include:

- payment name
- due day
- reminder days

### Notifications
Stores system alerts such as:

- upcoming payments
- anomaly warnings

---

# 🧩 Technology Stack

## Backend
- FastAPI
- Python
- PostgreSQL

FastAPI was chosen because it provides high performance, automatic API documentation, and easy integration with data processing tools.

---

## Frontend (Web)
- React
- Chart libraries for data visualization

---

## Mobile Application
- React Native (Expo)

The mobile and web applications share the same backend API.

---

## PDF Processing
- pdfplumber / PyMuPDF

These libraries extract text from bank statement PDFs for analysis.

---

# 📊 Example User Flow

User adds transactions  
        ↓  
Transactions stored in database  
        ↓  
Analytics engine processes data  
        ↓  
Dashboard shows insights  
        ↓  
Anomaly detection identifies unusual spending  
        ↓  
User receives notifications

---

# 🔮 Future Improvements

Potential future features include:

- AI-based category classification
- Support for multiple bank formats
- Budget planning tools
- Financial forecasting
- Push notifications

---

# 👩‍💻 Developer

Sena Nur Ceylan  
Software Engineering Student  
Fırat University

---

# ⭐ Project Status

Currently under development.



# 💰 SmartSpend – Kişisel Finans Analiz Uygulaması

Kullanıcıların harcamalarını takip etmelerini, harcama davranışlarını analiz etmelerini, anormal harcama durumlarını tespit etmelerini ve düzenli ödemelerini yönetmelerini sağlayan web ve mobil tabanlı bir finans uygulamasıdır.

Sistem kullanıcıların işlemleri manuel olarak eklemesine veya banka ekstrelerini (PDF) yükleyerek finansal verilerini analiz etmesine olanak sağlar.

---

# 🚀 Proje Genel Bakış

SmartSpend kullanıcıların finansal davranışlarını anlamalarına yardımcı olmak için geliştirilmiş full-stack bir fintech uygulamasıdır.

Kullanıcılar şunları yapabilir:

- Günlük harcamalarını takip edebilir
- İşlemlerini kategorilere ayırabilir
- Harcama grafiklerini görebilir
- Anormal harcamaları tespit edebilir
- Düzenli ödemelerini yönetebilir
- Yaklaşan ödemeler için hatırlatma alabilir
- PDF formatında banka ekstrelerini analiz edebilir

Sistem, makine öğrenmesi kullanmadan istatistiksel analiz ve kural tabanlı yöntemlerle finansal içgörüler sunar.

---

# 🎯 Temel Özellikler

## 📊 Harcama Takibi

Kullanıcılar finansal işlemlerini manuel olarak ekleyebilir.

Her işlem şu bilgileri içerir:

- Tutar
- Kategori
- Tarih
- Açıklama

Bu veriler veritabanında saklanır ve analizlerde kullanılır.

---

## 📈 Harcama Analizi

Sistem aşağıdaki finansal analizleri üretir:

- Aylık toplam harcama
- Kategori bazlı harcama dağılımı
- Zaman içindeki harcama trendleri

Örnek analizler:

- “Online alışveriş harcamalarınız bu ay %40 arttı.”
- “Ulaşım harcamalarınız ortalamanın üzerinde.”

---

## ⚠️ Anomali Tespiti

Uygulama istatistiksel kurallar kullanarak olağan dışı harcamaları tespit eder.

Örnek durumlar:

- Bir kategorideki harcama son 3 ay ortalamasına göre çok arttıysa
- Tek seferde yapılan olağan dışı yüksek harcamalar

Örnek mesaj:

Online alışveriş harcamalarınız son 3 aya göre %42 arttı.

---

## 🔁 Düzenli Ödemeler

Kullanıcılar aşağıdaki gibi düzenli ödemeler ekleyebilir:

- Kira
- Abonelikler (Netflix, Spotify)
- Kredi ödemeleri

Sistem şu özellikleri sunar:

- Aylık ödeme planı oluşturma
- Ödeme tarihinden önce hatırlatma

Örnek hatırlatma:

Spotify ödemeniz 2 gün sonra yapılacaktır.

---

## 📄 Banka Ekstresi Analizi (PDF)

Kullanıcılar banka ekstrelerini PDF formatında yükleyebilir.

Sistem şu adımları gerçekleştirir:

1. PDF dosyasından metni çıkarır
2. İşlem satırlarını tespit eder
3. İşlem bilgilerini ayrıştırır
4. Yapılandırılmış işlem verileri oluşturur

Çıkarılan veri alanları:

- Tarih
- Açıklama
- Tutar

Kullanıcı işlemleri onayladıktan sonra sistem veritabanına kaydeder.

---

# 🧠 Anomali Tespiti Nasıl Çalışır?

Anomali tespiti istatistiksel karşılaştırmalar kullanılarak yapılır.

Örnek:

Son 3 ay ortalama harcama = 1000 TL  
Bu ay harcama = 1600 TL  

Artış oranı:

(1600 - 1000) / 1000 = 60%

Eğer artış belirlenen eşik değerini (örneğin %30) aşarsa sistem bunu anomali olarak işaretler.

---

# 🏗️ Sistem Mimarisi

Web Uygulaması (React)
        │
        │
Mobil Uygulama (React Native)
        │
        ▼
Backend API (FastAPI)
        │
        ▼
PostgreSQL Veritabanı
        │
        ▼
Analiz ve Anomali Motoru

Web ve mobil uygulamalar aynı backend API ile iletişim kurar.

---

# 🗄️ Veritabanı Tasarımı

Temel tablolar:

### Users
Kullanıcı hesap bilgilerini saklar.

### Transactions
Finansal işlemleri saklar.

Alanlar:

- amount
- category
- description
- date
- user_id

### Categories
Harcama kategorilerini tanımlar.

Örnek:

- Gıda
- Ulaşım
- Eğlence
- Alışveriş

### Recurring Payments
Düzenli ödemeleri saklar.

Alanlar:

- ödeme adı
- ödeme günü
- hatırlatma günü

### Notifications
Sistem bildirimlerini saklar.

Örnek:

- yaklaşan ödeme
- anormal harcama uyarısı

---

# 🧩 Kullanılan Teknolojiler

## Backend
- FastAPI
- Python
- PostgreSQL

FastAPI yüksek performans, otomatik API dokümantasyonu ve veri işleme kolaylığı sağladığı için tercih edilmiştir.

---

## Web Frontend
- React
- Veri görselleştirme için grafik kütüphaneleri

---

## Mobil Uygulama
- React Native (Expo)

Mobil ve web uygulamaları aynı backend API’yi kullanır.

---

## PDF İşleme
- pdfplumber
- PyMuPDF

Bu kütüphaneler PDF ekstrelerinden metin çıkarılmasını sağlar.

---

# 📊 Örnek Kullanıcı Akışı

Kullanıcı işlem ekler  
        ↓  
İşlemler veritabanına kaydedilir  
        ↓  
Analiz motoru verileri işler  
        ↓  
Dashboard finansal analizleri gösterir  
        ↓  
Anomali tespiti olağan dışı harcamaları belirler  
        ↓  
Kullanıcı bildirim alır

---

# 🔮 Gelecek Geliştirmeler

Planlanan özellikler:

- Yapay zeka ile kategori tahmini
- Birden fazla banka formatı desteği
- Bütçe planlama araçları
- Finansal tahminleme
- Push bildirimleri

---

# 👩‍💻 Geliştirici

Sena Nur Ceylan  
Yazılım Mühendisliği Öğrencisi  
Fırat Üniversitesi

---

# ⭐ Proje Durumu

Geliştirme aşamasında.



