<div align="center">

  <img src="public/brand/worksauto-logo-dark.png#gh-light-mode-only" alt="WorksAuto Logo" width="340" />
  <img src="public/brand/worksauto-logo-white.png#gh-dark-mode-only" alt="WorksAuto Logo" width="340" />

  <p align="center">
    <strong>Yeni Nesil Çok Kiracılı (Multi-Tenant) Araç Servis & Atölye Yönetim Platformu</strong>
  </p>

  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react" alt="React" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
    <img src="https://img.shields.io/badge/Architecture-Clean%20%2F%20Frontend--First-emerald?style=for-the-badge" alt="Architecture" />
  </p>

  <p align="center">
    <a href="#-proje-hakkında">Proje Hakkında</a> •
    <a href="#-temel-özellikler">Özellikler</a> •
    <a href="#-teknoloji-yığını">Teknoloji Yığını</a> •
    <a href="#-proje-yapısı">Proje Yapısı</a> •
    <a href="#-kurulum--çalıştırma">Kurulum</a> •
    <a href="#-yol-haritası">Yol Haritası</a>
  </p>

</div>

---

## 📖 Proje Hakkında

**WorksAuto**, modern oto servisleri, tamirhaneler, yetkili/özel servis ağları ve filo bakım merkezleri için tasarlanmış yüksek performanslı, çok kiracılı (multi-tenant) bir SaaS platformudur. 

Bu depo (`worksauto-web`), platformun son teknoloji web standartlarıyla inşa edilen **Frontend (Kullanıcı Arayüzü)** katmanını barındırmaktadır. Titizlikle tasarlanmış kullanıcı deneyimi, sıfır gecikmeli sayfa geçişleri, otomotiv sektörüne özel kurumsal tasarım sistemi ve uçtan uca tip güvenliği ile donatılmıştır.

---

## ✨ Temel Özellikler (Faz 1: UI Bootstrap & Core Shell)

### 🎨 Akıllı Marka & Dinamik Logo Sistemi
- **Duyarlı Logo Mimarisi (`BrandLogo.tsx`):**
  - **Genişletilmiş Sidebar:** Koyu modda beyaz tam logo (`worksauto-logo-white.png`), açık modda koyu antrasit logo (`worksauto-logo-dark.png`) ve üzerine gelindiğinde zarif **metalik ışık dalgası (Shimmer Sweep)** efekti.
  - **Daraltılmış Sidebar:** Şeffaf zemin üzerinde tam oranlı yüksek çözünürlüklü ikon (`worksauto-icon-white-tight.png`), hover sırasında neon haresi ve dinamik mikro eğilme (`rotate-[-2deg]`).
- **Dinamik Favicon Motoru (`DynamicFavicon.tsx`):** Tarayıcı sekmesindeki favicon, aktif temayı (`resolvedTheme`) çalışma anında dinleyerek açık temada siyah, koyu temada beyaz renk alır.

### 🌗 Gelişmiş Tema Yönetimi
- **3 Seçenekli Tema Deneyimi:** Açık (Light), Koyu (Dark) ve Sistem (System) modları.
- **Circular Reveal Animasyonu:** Modern **View Transitions API** kullanılarak tıklanan butondan dışa doğru genişleyen dairesel bir dalga efektiyle pürüzsüz tema geçişi.

### 🏛️ Sıfır Titremeli (Zero-Flicker) SaaS Layout Shell
- **Next.js Server Cookie Mimarisi:** Sidebar genişlik durumu (`collapsed`) sunucu tarafında HTTP çerezleri (`cookies()`) üzerinden okunur. Sayfa geçişlerinde veya sayfa yenilendiğinde asla genişleyip sonradan kapanma (Hydration Flicker) yaşanmaz.
- **Floating Edge Handle:** Sidebar daraldığında logo ile çakışmayan, sağ sınır çizgisi üzerinde yüzen modern tutamaç toggle butonu.
- **İpeksi Sayfa Açılışları (`template.tsx`):** Next.js App Router şablonu ile rota geçişlerinde donanımsal GPU hızlandırmalı, 10px mikro süzülme ve opaklık geçişi (`translate3d(0, 10px, 0)`).
- **Kurumsal Minimalist 404:** Linear ve Stripe standartlarında zarif ve tipografi odaklı hata sayfası (`not-found.tsx`).

---

## 🛠️ Teknoloji Yığını

| Alan | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.3 (App Router)** | Hibrit SSR & Client mimarisi, Turbopack desteği |
| **Kütüphane** | **React 19.2** | Modern bileşen mimarisi ve Hooks |
| **Stil / CSS** | **Tailwind CSS v4** | CSS-first `@custom-variant dark` ve tam donanım hızlandırması |
| **Tasarım Sistemi** | **UI/UX Pro Max** | Otomotiv sektörüne özel renk ve tipografi token'ları (`MASTER.md`) |
| **Tipografi** | **Plus Jakarta Sans** | Google Fonts ile optimize edilmiş kurumsal yazı tipi |
| **İkon Seti** | **Lucide React** | Tutarlı ve hafif SVG ikon kütüphanesi |
| **Tema Yönetimi** | **next-themes** | Kalıcı yerel tema saklama ve sistem tercihi algılama |
| **Veri Yönetimi** | **@tanstack/react-query** | Tip güvenli asenkron veri yönetimi ve önbellekleme |
| **Tip Denetimi** | **TypeScript 5.x** | Sıkı tip denetimi (Strict Mode) |

---

## 📂 Proje Yapısı

```
worksauto-web/
├── public/
│   └── brand/                   # Optimize edilmiş SVG/PNG logo, ikon ve favicon paketi
├── src/
│   ├── app/
│   │   ├── globals.css          # Tailwind v4, CSS değişkenleri ve keyframe animasyonları
│   │   ├── layout.tsx           # Kök layout, sunucu çerez okuma, font ve tema sağlayıcıları
│   │   ├── template.tsx         # Akıcı sayfa geçiş animasyon şablonu (Page Transition)
│   │   ├── not-found.tsx        # Minimalist kurumsal 404 hata sayfası
│   │   └── page.tsx             # Ana operasyonel gösterge paneli (Dashboard)
│   ├── components/
│   │   ├── dynamic-favicon.tsx  # Temaya duyarlı dinamik sekme ikonu bileşeni
│   │   ├── query-provider.tsx   # TanStack Query istemci sağlayıcısı
│   │   ├── theme-provider.tsx   # next-themes tema sarmalayıcısı
│   │   ├── layout/
│   │   │   ├── app-header.tsx   # Arama, bildirim, tema ve kullanıcı profil üst çubuğu
│   │   │   ├── app-sidebar.tsx  # Floating edge tutamaçlı, daralabilir kurumsal menü
│   │   │   ├── app-shell.tsx    # Responsive yerleşim kabuğu ve durum yöneticisi
│   │   │   └── theme-toggle.tsx # 3 seçenekli ve dairesel animasyonlu tema seçici
│   │   ├── shared/
│   │   │   └── brand-logo.tsx   # Otomatik tema ve boyut duyarlı WorksAuto logosu
│   │   └── ui/                  # Atomik UI bileşenleri (Button, Card, Badge, Input vb.)
│   └── lib/
│       ├── animation.ts         # Güvenli DOM reflow animasyon tetikleyicisi
│       └── utils.ts             # Tailwind class birleştirici (cn helper)
└── design-system/
    └── worksauto/MASTER.md      # Otomotiv SaaS tasarım sistemi kuralları
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** `v20.0.0` veya üzeri (Node `v24+` önerilir)
- **npm:** `v10.0.0` veya üzeri

### Adımlar

1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/ridvan-byr/worksauto-web.git
   cd worksauto-web
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```
   *Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.*

4. **Üretim derlemesi (Build) alın:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🗺️ Geliştirme Yol Haritası (Frontend-First)

| Aşama | Modül | Kapsam | Durum |
| :---: | :--- | :--- | :---: |
| **Faz 1** | **UI Bootstrap & Design System** | Proje kurulumu, tema motoru, marka entegrasyonu, responsive shell | 🟢 **Tamamlandı** |
| **Faz 2** | **Kimlik & Tenant Onboarding Wizard** | Giriş/Kayıt, 6 adımlı servis kurulum sihirbazı, sayfa koruma | 🟡 *Sıradaki* |
| **Faz 3** | **Müşteri & Araç Yönetimi UI** | Müşteri dizini, Türk plaka maskeli araç kaydı, 4'lü servis geçmişi | ⚪ Beklemede |
| **Faz 4** | **Randevu Takvimi & İş Emri Geçişi** | Haftalık servis slotları, "Onayla & İş Emri Aç" otomasyonu | ⚪ Beklemede |
| **Faz 5** | **İş Emri & Atölye Paneli UI** | Mobil usta atölye ekranı, hasar kabul galerisi, işçilik takibi | ⚪ Beklemede |
| **Faz 6** | **Stok ve Envanter Yönetimi UI** | Yedek parça kataloğu, kritik stok uyarıları, stok hareketleri | ⚪ Beklemede |
| **Faz 7** | **Fatura, Tahsilat & Cari Hesap UI** | İş emri tamamlama, servis faturası basımı, cari bakiye ekstresi | ⚪ Beklemede |
| **Faz 8** | **İnteraktif Sunum & Demo Senaryosu**| Zengin servis test verileri, canlı sunum kılavuzu | ⚪ Beklemede |
| **Faz 9** | **Backend API Entegrasyonu** | NestJS Clean Architecture, PostgreSQL, Docker bağlantısı (`worksauto-api`) | ⚪ Beklemede |

---

## 📄 Lisans

Bu proje gizli ve tescilli bir ticari yazılım projesidir. Tüm hakları saklıdır.

<div align="center">
  <sub>WorksAuto Ekibi tarafından ❤️ ile geliştirilmektedir.</sub>
</div>
