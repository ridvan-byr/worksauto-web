# WorksAuto Design System Master Document (Tasarım Sistemi Ana Kılavuzu)

> **Proje:** WorksAuto (Yeni Nesil Bulut Tabanlı B2B Oto Servis Yönetim Platformu)  
> **Son Güncelleme:** 2026-09-03 (Faz 1, 2, 3 ve 4 ile Senkronize Edildi)  
> **Temel Felsefe:** Modern SaaS, Cam Morfizasyonu (Glassmorphism), Yüksek Kontrast, Dokunmatik & Mobil Usta Dostu (Tablet/Phone Ready).

---

## 1. Renk Paleti ve Temalandırma (Color Palette)

WorksAuto, modern otomotiv mühendisliği hissi veren **Electric Sky Blue** ve derin **Obsidian Dark / Crisp Light** kontrastı üzerine kuruludur.

### 🎨 Ana Renkler

| Rol | Hex Kodu | Tailwind Sınıfı | Kullanım Alanı |
|:---|:---|:---|:---|
| **Primary (Ana Renk)** | `#0284C7` / `#0EA5E9` | `bg-sky-600` / `bg-sky-500` | Birincil butonlar, aktif menüler, odak çerçeveleri |
| **Primary Glow** | `rgba(14,165,233,0.25)` | `shadow-sky-500/25` | Vurgulu buton gölgeleri |
| **Dark Background (Ana)** | `#070B12` | `dark:bg-[#070b12]` | Koyu mod zemin rengi |
| **Dark Card / Surface** | `#0F172A` / `#1E293B` | `dark:bg-slate-900` | Koyu mod kartlar, açılır kutular |
| **Light Background (Ana)**| `#F8FAFC` | `bg-slate-50` | Açık mod zemin rengi |
| **Light Card / Surface**| `#FFFFFF` | `bg-white` | Açık mod kartlar |

### 🚦 Durum ve Operasyonel Renkler

| Durum / Anlam | Renk | Tailwind | Kullanım |
|:---|:---|:---|:---|
| **Success (Başarılı / Lifte Alındı / Bitti)** | Zümrüt Yeşili (`#10B981`) | `bg-emerald-500/10 text-emerald-600` | `COMPLETED` iş emirleri, onaylanan randevular |
| **Warning (Beklemede / Dikkat)** | Kehribar Sarısı (`#F59E0B`) | `bg-amber-500/10 text-amber-600` | `PENDING` onay bekleyen randevular, kritik stok |
| **Info / Scheduled (Onaylandı)** | Gökyüzü Mavisi (`#0EA5E9`) | `bg-sky-500/10 text-sky-600` | `APPROVED` randevular, planlı işler |
| **Purple (Erteleme İstendi)** | Mor (`#A855F7`) | `bg-purple-500/10 text-purple-600` | `RESCHEDULE_REQUESTED` |
| **Destructive / No-Show** | Gül Kırmızısı (`#F43F5E`) | `bg-rose-500/10 text-rose-600` | `NO_SHOW`, silme, hata uyarıları |
| **Cancelled / Inactive** | Nötr Gri (`#64748B`) | `bg-slate-200 text-slate-500` | `CANCELLED` iptal kayıtları (çizili) |

---

## 2. Tipografi ve Yazı Tipleri

* **Ana Yazı Tipi (UI & Metinler):** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
  * Net, okunaklı, modern ve yormayan kurumsal arayüz fontu.
* **Monospace Yazı Tipi (Veri & Teknik Alanlar):** `ui-monospace`, `JetBrains Mono`, `Consolas`, `monospace`
  * **Kullanım Alanları:** Türk Plakaları (`34 RB 1905`), Saat slotları (`09:30`), Şasi Numaraları (VIN), Para tutarları (`2.100 ₺`), İş emri kodları (`#WO-2026-088`).

---

## 3. Otomotiv Özel Bileşen Standartları

### 🚗 A. Resmi Türk Plaka Rozeti (`PlateBadge`)
* **Ölçüler:** `xs` (takvim içi), `sm` (tablo içi), `md` (kart başlığı), `lg` (detay ekranı).
* **Standart:**
  * Mavi sol şerit (`#003399`) üzerinde beyaz "TR" yazısı ve yıldız sembolü.
  * Beyaz zemin üzerinde kalın siyah kabartma font (`font-mono font-extrabold`).
  * **Kritik Kural:** `whitespace-nowrap shrink-0` zorunludur; plaka numarası dar alanlarda asla alt satıra bölünemez!

### 🪟 B. Modal Pencereleri (SaaS Gold Standard)
1. **DOM Konumu:** Her modal doğrudan `React.createPortal` ile `document.body` üzerine mount edilir (`z-[100]`).
2. **Backdrop:** Tüm ekranı (Sidebar ve Header dahil) pürüzsüz karartan sinematik koyu cam efekti (`backdrop-blur-md bg-slate-950/75`).
3. **Kaydırma Disiplini (Zero-Scroll):** Uzun formlar dikeyde hantalca kaydırılmak yerine **2 Adımlı Akıcı Mini-Sihirbaz** (Step 1 ➡️ Step 2) mimarisiyle sıfır scrollbar ile sunulur.

### 📋 C. Çift Görünüm Standardı (Dual View)
* Karmaşık operasyon ekranlarında (Randevular, İş Emirleri) kullanıcının alışkanlığına göre üst barda mutlaka **Görünüm Değiştirici (Toggle)** sunulur:
  * `[ 📅 Görsel Takvim / Kanban Panosu ]` & `[ 📋 Arama & Filtreli Tablo Listesi ]`.

---

## 4. Mobil ve Atölye Ergonomisi (Tablet & Phone Ready)

1. **Usta Butonları (Touch Target Size):**
   * Sanayi ortamında elleri eldivenli veya yağlı olan ustaların rahat basabilmesi için aksiyon butonları en az `44px - 48px` yükseklikte olmalıdır (`min-h-[44px]`).
2. **Akıcı Sayfa Animasyonları:**
   * Sayfa geçişlerinde `animate-in fade-in duration-200` akıcılığı kullanılır.
3. **Asla Emoji Kullanma:**
   * Bütün simgeler `lucide-react` SVG vektör ikon setinden homojen olarak kullanılır.

---

## 5. Doğrulama ve Teslimat Kontrol Listesi

- [x] Tüm plaka alanlarında `PlateBadge` kullanıldı ve `whitespace-nowrap` korundu.
- [x] Modallar `createPortal` ile `z-[100]` seviyesinde tüm ekranı karartıyor.
- [x] Renk kontrastı WCAG AAA / AA standartlarına tam uyumlu.
- [x] Koyu mod ve açık mod geçişlerinde tüm kartlar ve metinler pürüzsüz uyum sağlıyor.
- [x] `npm run build` ile 0 TypeScript hatası ve 0 derleme uyarısı.
