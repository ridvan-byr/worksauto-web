# WorksAuto Web (Frontend)

WorksAuto çok kiracılı (multi-tenant) yeni nesil araç servis ve atölye yönetim platformunun modern Next.js 16 kullanıcı arayüzüdür.

## 🚀 Özellikler (Faz 1 Tamamlandı)
- **Next.js 16 (App Router) & React 19:** Son teknoloji web uygulama altyapısı.
- **Tailwind CSS v4 & Tasarım Sistemi:** `.agents/skills/ui-ux-pro-max` ile otomotiv sektörüne özel üretilen modern renk paleti (`MASTER.md`).
- **Dinamik Marka & Logo Mimarisi (`BrandLogo`):**
  - Geniş modda tam logo (`worksauto-logo-white.png` / `worksauto-logo-dark.png`) + metalik ışık süzülmesi efekti.
  - Daraltılmış modda yüksek çözünürlüklü kare ikon logo (`worksauto-icon-white-tight.png` / `worksauto-icon-black-tight.png`) + neon parlama ve mikro eğilme.
- **Akıllı Tema Yönetimi:**
  - Açık (Light), Koyu (Dark) ve Sistem (System) tercihleri.
  - View Transitions API tabanlı dairesel dalga geçiş animasyonu (Circular Reveal).
  - Temaya göre çalışma anında değişen dinamik Favicon (`DynamicFavicon`).
- **SaaS Layout Shell:**
  - Genişletilebilir/Daraltılabilir Floating Edge Handle tutamaçlı Sidebar.
  - Next.js Server Cookie mimarisi ile sıfır gecikmeli, kalıcı (persistent) sidebar durumu.
  - Üst Header: Hızlı plaka/müşteri arama çubuğu, tema değiştirici, hızlı aksiyon butonları.
  - Ultra-Smooth sayfa geçişleri (`template.tsx`).
  - Özel minimalist kurumsal 404 sayfası (`not-found.tsx`).

## 🛠️ Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Üretim derlemesi alın
npm run build
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak platformu deneyimleyebilirsiniz.
