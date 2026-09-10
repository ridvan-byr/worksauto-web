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
- **Work Orders & Workshop Bay Console (`/work-orders`):** Vehicle reception check-in, technician and lift bay allocation, real-time parts attachment, and operational status lifecycle management.
- **Appointment Scheduling & Public Booking Portal (`/appointments`, `/book/[slug]`):** Dual-collision prevention weekly grid calendar and customer self-service appointment reservations.
- **Real-Time Inventory & 2D Warehouse Shelf Matrix (`/inventory`):** Tier/bin coordinate grid (`K1-G1`), visual capacity & occupancy gauges, part-to-cell assignment, and atomic decrement tracking.
- **Customer CRM & Fleet Management (`/customers`, `/vehicles`):** Turkish license plate normalization, full service history logs, running ledger balance tracking, and one-click regulatory consent SMS dispatch.
- **Public Customer Consent & Compliance Portal (`/c/kvkk?token=...`):** Mobile-optimized verification flow for KVKK/GDPR disclosures, digital timestamped signing, and immutable audit capture.
- **Finance, Invoicing & Current Account Statements (`/invoices`, `/current-accounts`):** Idempotent settlement records, regulatory VUK compliance, and automated ledger statement extracts.
- **Super Admin Management Console (`/admin`):** Multi-tenant licensing, platform health metrics, operator administration, and a persistent live Security & Audit Log stream.
- **Live WebSocket Notifications (`socket.io`):** Workshop bell notifications, low-stock warnings, and real-time job card status broadcasts.

### 🎨 Brand & Interface Architecture
- **Dual-Layer Route Protection:** Next.js Edge Middleware (`middleware.ts`) coupled with secure client-side in-memory access token storage.
- **3-Tier Theme & Motion Transitions:** Native View Transitions API with circular reveal animations and zero-flicker SSR layout persistence.
- **UI/UX Pro Max:** Tailored automotive dark/light token palette, hardware-accelerated micro-animations, and responsive high-density data grids.

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

## 👤 Lead Developer & Architect

**Rıdvan Emre Bayar**  
* Lead Full-Stack Software Engineer & End-to-End System Architect  
* GitHub: [@ridvan-byr](https://github.com/ridvan-byr)

---

## 📄 License

Proprietary — All rights reserved. WorksAuto © 2026.
