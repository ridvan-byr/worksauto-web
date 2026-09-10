<div align="center">

  <img src="public/brand/worksauto-logo-dark.png#gh-light-mode-only" alt="WorksAuto Logo" width="340" />
  <img src="public/brand/worksauto-logo-white.png#gh-dark-mode-only" alt="WorksAuto Logo" width="340" />

  <p align="center">
    <strong>Next-Generation Multi-Tenant Auto Service & Workshop Management SaaS Platform</strong>
  </p>

  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
    <img src="https://img.shields.io/badge/Architecture-Clean%20%2F%20Frontend--First-emerald?style=for-the-badge" alt="Architecture" />
  </p>

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-project-structure">Structure</a> •
    <a href="#-testing--quality-assurance">Testing</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-author">Author</a>
  </p>

</div>

---

## 📖 About the Project

**WorksAuto** is a multi-tenant B2B SaaS platform engineered for automotive workshops, repair centers, authorized dealerships, and fleet maintenance hubs.

This repository (`worksauto-web`) contains the **Frontend (Web UI)** application built on top of modern web standards. It delivers an enterprise-grade user experience with zero-flicker state persistence, silky-smooth hardware-accelerated transitions, an automotive-tailored design system, and end-to-end type safety.

---

## ✨ Key Enterprise Features

### 🚗 Core Automotive ERP Modules
- **İş Emirleri & Atölye Paneli (`/work-orders`):** Araç kabulü, usta ve lift ataması, canlı parça ekleme ve durum yaşam döngüsü.
- **Randevu Takvimi & Açık Müşteri Portalı (`/appointments`, `/book/[slug]`):** Çift çakışma önleyici haftalık takvim gridi ve müşterilere özel online randevu rezervasyonu.
- **Canlı Stok & 2D Raf Matrisi (`/inventory`):** Kat/göz hücre gridi (`K1-G1`), görsel doluluk oranları, parça hücre atama ve atomik stok takibi.
- **Müşteri & Filo Yönetimi (`/customers`, `/vehicles`):** TR standart plaka formatlama, servis geçmişi, cari hesap borç/alacak takibi ve tek tıkla KVKK onay SMS gönderimi.
- **Açık KVKK & İYS Müşteri Portalı (`/c/kvkk?token=...`):** SMS onay bağlantısıyla mobil uyumlu aydınlatma metni onaylama, dijital zaman damgalı imza ve güvenlik kaydı.
- **Finans, Fatura & Cari Ekstre (`/invoices`, `/current-accounts`):** İdempotent ödeme kaydı ve tek tıkla cari hesap hareketleri.
- **Süper Yönetici Konsolu (`/admin`):** Servis lisanslama, platform sağlık metrikleri, yetkili yönetimi ve sayfa altında kalıcı canlı Güvenlik & Denetim İzi (Audit Log) akışı.
- **Canlı WebSocket Bildirimleri (`socket.io`):** Atölye zili, kritik stok uyarıları ve gerçek zamanlı iş emri güncellemeleri.

### 🎨 Marka & Arayüz Mimarisi
- **Çift Katmanlı Rota Güvenliği:** Next.js Edge Middleware (`middleware.ts`) + Client-side in-memory access token mimarisi.
- **3-Kademeli Tema & Görsel Geçişler:** View Transitions API ile dairesel dalga animasyonu ve sıfır-flicker SSR layout.
- **UI/UX Pro Max:** Otomotiv ekosistemine özel koyu/açık renk paleti, mikro animasyonlar ve duyarlı veri tabloları.

---

## 🛠️ Tech Stack

| Domain | Technology | Highlights |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3 (App Router)** | Hybrid SSR & Client components, Turbopack engine |
| **UI Library** | **React 19.2** | Modern component lifecycle & hooks |
| **Styling** | **Tailwind CSS v4** | CSS-first `@custom-variant dark`, hardware-accelerated keyframes |
| **Design System** | **UI/UX Pro Max** | Tailored automotive dark/light token palette (`MASTER.md`) |
| **Typography** | **Plus Jakarta Sans** | Performance-optimized variable font via Google Fonts |
| **Icons** | **Lucide React** | Consistent, lightweight vector icon set |
| **Theme Engine** | **next-themes** | Persistent local storage theme synchronization |
| **Data Fetching** | **@tanstack/react-query** | Type-safe asynchronous state caching and server state |
| **Language** | **TypeScript 5.x** | Strict mode type verification |

---

## 📂 Project Structure

```
worksauto-web/
├── public/
│   └── brand/                   # Optimized SVG/PNG logos, icons, and favicon pack
├── src/
│   ├── app/
│   │   ├── admin/               # Super Admin root console (tenants, admins, audit logs)
│   │   ├── appointments/        # Workshop appointment calendar
│   │   ├── book/                # Public booking portal
│   │   ├── c/kvkk/              # Public customer KVKK consent confirmation page
│   │   ├── current-accounts/    # Customer accounting ledger & statements
│   │   ├── customers/           # CRM & customer records
│   │   ├── inventory/           # Stock catalog & 2D warehouse shelf matrix
│   │   ├── invoices/            # Invoice management & PDF generator
│   │   ├── vehicles/            # Vehicle fleet registry
│   │   ├── work-orders/         # Core workshop job card operations
│   │   ├── globals.css          # Tailwind v4 configuration, theme variables & keyframes
│   │   └── layout.tsx           # Root layout, server cookie reading, font & providers
│   ├── features/                # Domain-specific feature modules & API hooks
│   ├── components/
│   │   ├── layout/              # AppHeader, AppSidebar, AppShell, ThemeToggle
│   │   └── ui/                  # Atomic primitives (Button, Card, Badge, Input, etc.)
│   └── lib/
│       ├── api-client.ts        # Axios/Fetch HTTP client with interceptors & refresh
│       └── utils.ts             # Tailwind class merging utility (cn helper)
└── e2e/                         # Playwright end-to-end integration test suites
```

---

## 🧪 Testing & Quality Assurance

```bash
# Unit Tests (Vitest)
npm run test

# End-to-End Integration Suite (Playwright)
npx playwright test

# Strict Static Type Check
npx tsc --noEmit

# Linter Verification
npm run lint
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.0.0` or higher (`v22+` recommended)
- **npm:** `v10.0.0` or higher

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ridvan-byr/worksauto-web.git
   cd worksauto-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to `http://localhost:4000/api/v1`.

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view the application.

---

## 👤 Author

**Rıdvan Bayar**  
* Founder & Lead Architect, WorksAuto  
* GitHub: [@ridvan-byr](https://github.com/ridvan-byr)

---

## 📄 License

Proprietary — All rights reserved. WorksAuto © 2026.
