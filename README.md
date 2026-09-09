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
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-roadmap">Roadmap</a>
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
- **Canlı Stok & Yedek Parça Kataloğu (`/inventory`):** Atomik stok düşümü, kritik eşik uyarıları ve raf/koridor lokasyon takibi.
- **Müşteri & Filo Yönetimi (`/customers`, `/vehicles`):** TR standart plaka formatlama, servis geçmişi ve cari hesap borç/alacak takibi.
- **Finans, Fatura & Cari Ekstre (`/invoices`, `/current-accounts`):** İdempotent ödeme kaydı ve tek tıkla cari hesap hareketleri.
- **Süper Yönetici Konsolu (`/admin`):** Çoklu servis lisanslama, platform sağlık ve işlem hacmi KPI paneli.
- **Canlı WebSocket Bildirimleri (`socket.io`):** Atölye zili, kritik stok uyarıları ve gerçek zamanlı iş emri güncellemeleri.

### 🧪 Test & CI/CD Kalitesi
- **Birim Testleri (Vitest):** Token saklama, formatlayıcılar ve middleware guard testleri (`npm test`).
- **E2E Test Paketi (Playwright Chromium):** 4 kapsamlı E2E test paketi (auth-guard, work-order-lifecycle, appointment-booking, admin-tenant-management) ile %100 yeşil test güvencesi.
- **GitHub Actions Pipeline:** Lint, Typecheck, Unit Test, Build ve E2E test aşamalarıyla korunan dağıtım zinciri.

### 🎨 Marka & Arayüz Mimarisi
- **Çift Katmanlı Rota Güvenliği:** Next.js Edge Middleware (`middleware.ts`) + Client-side in-memory access token mimarisi.
- **3-Kademeli Tema & Görsel Geçişler:** View Transitions API ile dairesel dalga animasyonu ve sıfır-flicker SSR layout.

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
│   │   ├── globals.css          # Tailwind v4 configuration, theme variables & keyframes
│   │   ├── layout.tsx           # Root layout, server cookie reading, font & providers
│   │   ├── template.tsx         # Unified hardware-accelerated page transition template
│   │   ├── not-found.tsx        # Minimalist corporate 404 error page
│   │   └── page.tsx             # Primary operational dashboard
│   ├── components/
│   │   ├── dynamic-favicon.tsx  # Dynamic browser tab favicon switcher
│   │   ├── query-provider.tsx   # TanStack Query client wrapper
│   │   ├── theme-provider.tsx   # next-themes provider wrapper
│   │   ├── layout/
│   │   │   ├── app-header.tsx   # Search bar, notifications, theme toggle & user profile
│   │   │   ├── app-sidebar.tsx  # Collapsible navigation with floating edge handle
│   │   │   ├── app-shell.tsx    # Responsive application shell & state coordinator
│   │   │   └── theme-toggle.tsx # 3-way circular reveal theme dropdown
│   │   ├── shared/
│   │   │   └── brand-logo.tsx   # Auto-theme & collapsed-aware WorksAuto brand mark
│   │   └── ui/                  # Atomic primitives (Button, Card, Badge, Input, etc.)
│   └── lib/
│       ├── animation.ts         # Safe DOM reflow animation restart utility
│       └── utils.ts             # Tailwind class merging utility (cn helper)
└── design-system/
    └── worksauto/MASTER.md      # Automotive SaaS design tokens and style guide
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.0.0` or higher (`v24+` recommended)
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

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   *The application will be accessible at [http://localhost:3000](http://localhost:3000).*

4. **Create an optimized production build:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🗺️ Implementation Roadmap (Frontend-First)

| Phase | Module | Scope | Status |
| :---: | :--- | :--- | :---: |
| **Phase 1** | **UI Bootstrap & Design System** | Setup, theme engine, brand integration, responsive shell | 🟢 **Completed** |
| **Phase 2** | **Auth & Tenant Onboarding Wizard** | Auth layouts, 6-step workshop setup wizard, route guards | 🟡 *Next Up* |
| **Phase 3** | **Customer & Vehicle Management UI** | Customer directory, Turkish license-plate format masks, service log | ⚪ Queued |
| **Phase 4** | **Appointment Calendar & Transition** | Weekly workshop scheduling grid, "Approve & Open Work Order" | ⚪ Queued |
| **Phase 5** | **Work Order & Workshop Board UI** | Mobile mechanic dashboard, vehicle intake damage gallery, labor tracking | ⚪ Queued |
| **Phase 6** | **Inventory & Spare Parts UI** | Parts catalog, minimum stock alerts, stock transaction history | ⚪ Queued |
| **Phase 7** | **Invoicing, Cashflow & Current Accounts**| Work order closure, PDF-ready service invoices, client balances | ⚪ Queued |
| **Phase 8** | **Interactive Presentation & Demo Seed** | Seed data, realistic automotive demo workflows | ⚪ Queued |
| **Phase 9** | **Backend API Integration** | NestJS Clean Architecture, PostgreSQL, Docker (`worksauto-api`) | ⚪ Queued |

---

## 📄 License

This repository contains proprietary software. All rights reserved.

<div align="center">
  <sub>Engineered with precision for the WorksAuto Platform.</sub>
</div>
