"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Building2,
  Search,
  Plus,
  BarChart3,
  Wrench,
  Calendar,
  Clock,
  Users,
  Package,
  Receipt,
  Printer,
  TrendingUp,
  ShieldCheck,
  Settings,
  Layers,
  MessageSquare,
  Banknote,
  Car,
  HandCoins,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export interface TourStep {
  targetSelector: string
  title: string
  description: string
  placement?: "bottom" | "top" | "center"
  badgeText?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

interface SpotlightTourProps {
  isOpen: boolean
  onClose: () => void
}

export function SpotlightTour({ isOpen, onClose }: SpotlightTourProps) {
  const pathname = usePathname()
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Tour steps definition
  const steps: TourStep[] = React.useMemo(() => {
    if (pathname === "/") {
      return [
        {
          targetSelector: '[data-tour="tour-brand"]',
          title: "Kurumsal Servis Kimliği & Logo",
          description:
            "Servisinizin resmi logosu ve bilgileri burada yer alır. Faturalara, iş emirlerine ve müşteriye iletilen canlı araç takip linklerine otomatik basılır.",
          placement: "bottom",
          badgeText: "Kurumsal Profil",
          icon: Building2,
        },
        {
          targetSelector: '[data-tour="tour-search"]',
          title: "Merkezi Hızlı Plaka & Müşteri Arama",
          description:
            "Servisinize gelen herhangi bir aracı veya müşteriyi plaka, isim ya da telefonla saniyeler içinde arayıp geçmiş servis kartına ulaşabilirsiniz.",
          placement: "bottom",
          badgeText: "Akıllı Arama",
          icon: Search,
        },
        {
          targetSelector: '[data-tour="tour-quick-lead"]',
          title: "Hızlı Araç & Müşteri Kabulü",
          description:
            "Yeni gelen araçları tek bir pencereden hızlıca sisteme kaydedin, muayene fotoğraflarını çekin ve atölyeye yönlendirin.",
          placement: "bottom",
          badgeText: "Hızlı Kabul",
          icon: Plus,
        },
        {
          targetSelector: '[data-tour="tour-kpis"]',
          title: "Canlı Operasyon & Günlük Ciro Sayaçları",
          description:
            "Bugünkü randevular, liftteki aktif araçlar, kritik stoklar ve kasaya giren anlık günlük tahsilat tek ekranda canlı güncellenir.",
          placement: "bottom",
          badgeText: "Canlı Sayaçlar",
          icon: BarChart3,
        },
        {
          targetSelector: '[data-tour="tour-work-orders"]',
          title: "Atölye & Liftte Olan Araçlar",
          description:
            "Hangi ustanın hangi lifte çalıştığını canlı izleyin; 'Müşteriye Bildir' butonuyla araç sahibine WhatsApp veya SMS ile son durumu tek tıkla iletin.",
          placement: "top",
          badgeText: "Atölye Takibi",
          icon: Wrench,
        },
      ]
    }

    if (pathname.startsWith("/work-orders")) {
      return [
        {
          targetSelector: '[data-tour="wo-header"]',
          title: "İş Emirleri & Atölye Operasyonu",
          description:
            "Atölyenizde devam eden tamir, bakım ve servis işlemlerinin tüm süreçlerini buradan adım adım yönetebilirsiniz.",
          placement: "bottom",
          badgeText: "Operasyon Merkezi",
          icon: Wrench,
        },
        {
          targetSelector: '[data-tour="wo-stats"]',
          title: "İş Emri Durum Sayaçları",
          description:
            "Kabul bekleyen, parçası sipariş edilen, liftte işlem gören ve faturaya hazır tamamlanmış araçların canlı özetini görün.",
          placement: "bottom",
          badgeText: "Canlı Durum",
          icon: BarChart3,
        },
        {
          targetSelector: '[data-tour="wo-create"]',
          title: "Yeni İş Emri Başlatma",
          description:
            "Servise giren araca anında yeni iş emri açarak müşteri şikayetlerini, muayene fotoğraflarını ve yapılacak işçilikleri kaydedin.",
          placement: "bottom",
          badgeText: "Hızlı İş Emri",
          icon: Plus,
        },
        {
          targetSelector: '[data-tour="wo-table"]',
          title: "Araç Takibi & Müşteri Bildirimi",
          description:
            "Plakaya tıklayarak kullanılan yedek parçaları ekleyin, faturaya dönüştürün ve araç sahibine WhatsApp canlı takip linki gönderin.",
          placement: "top",
          badgeText: "Detay & İletişim",
          icon: MessageSquare,
        },
      ]
    }

    if (pathname.startsWith("/appointments")) {
      return [
        {
          targetSelector: '[data-tour="app-header"]',
          title: "Randevu Takvimi & Lift Planlama",
          description:
            "Müşterilerinizin servis randevularını, lift ve usta yoğunluklarına göre gün ve saat bazında organize edin.",
          placement: "bottom",
          badgeText: "Randevu Yönetimi",
          icon: Calendar,
        },
        {
          targetSelector: '[data-tour="app-nav"]',
          title: "Haftalık & Tarih Gezintisi",
          description:
            "Önceki ve sonraki haftalara tek tıkla geçiş yapabilir veya 'Bugün' butonuna basarak anlık gününüze geri dönebilirsiniz.",
          placement: "bottom",
          badgeText: "Tarih Navigasyonu",
          icon: Clock,
        },
        {
          targetSelector: '[data-tour="app-create"]',
          title: "Yeni Randevu Oluşturma",
          description:
            "Telefonla veya servis kapısında gelen müşterinize uygun saat dilimini seçerek saniyeler içinde yeni randevu kaydedin.",
          placement: "bottom",
          badgeText: "Hızlı Randevu",
          icon: Plus,
        },
        {
          targetSelector: '[data-tour="app-grid"]',
          title: "Sürükle-Bırak Randevu Izgarası",
          description:
            "Randevuları başka bir güne veya saate fareyle sürükleyip kolayca taşıyın; araç geldiğinde tek tıkla iş emrine dönüştürün.",
          placement: "top",
          badgeText: "Akıllı Takvim",
          icon: Layers,
        },
      ]
    }

    if (pathname.startsWith("/customers")) {
      return [
        {
          targetSelector: '[data-tour="cust-header"]',
          title: "Müşteri & Araç Rehberi",
          description:
            "Servisinize gelen tüm müşterilerinizin iletişim bilgileri, kayıtlı araçları ve geçmiş servis hafızası burada saklanır.",
          placement: "bottom",
          badgeText: "Müşteri Portföyü",
          icon: Users,
        },
        {
          targetSelector: '[data-tour="cust-search"]',
          title: "Merkezi Rehber Arama",
          description:
            "İsim, telefon veya araç plakası yazarak müşterinin geçmişte hangi parçaları değiştirdiğini ve ne kadar ödediğini hemen görün.",
          placement: "bottom",
          badgeText: "Hızlı Bul",
          icon: Search,
        },
        {
          targetSelector: '[data-tour="cust-create"]',
          title: "Yeni Müşteri & Araç Ekleme",
          description:
            "Yeni bir araç sahibini ve sahip olduğu araçların şasi, plaka ve marka/model bilgilerini eksiksiz sisteme kaydedin.",
          placement: "bottom",
          badgeText: "Müşteri Kaydı",
          icon: Plus,
        },
        {
          targetSelector: '[data-tour="cust-table"]',
          title: "Müşteri İletişimi & WhatsApp",
          description:
            "Müşterinizi doğrudan arayabilir, WhatsApp mesajı atabilir, araç geçmişini PDF olarak dökebilir veya yeni randevu oluşturabilirsiniz.",
          placement: "top",
          badgeText: "Hızlı İletişim",
          icon: MessageSquare,
        },
      ]
    }

    if (pathname.startsWith("/vehicles")) {
      return [
        {
          targetSelector: '[data-tour="veh-header"]',
          title: "Kayıtlı Araçlar & Servis Geçmişi",
          description:
            "Servisinize gelen tüm araçların plaka, marka-model, şasi no, motor tipi ve güncel kilometre kayıtları burada tutulur.",
          placement: "bottom",
          badgeText: "Araç Dizini",
          icon: Car,
        },
        {
          targetSelector: '[data-tour="veh-search"]',
          title: "Hızlı Plaka & Marka Filtreleme",
          description:
            "Plakayı veya markayı yazarak aradığınız aracı saniyeler içinde bulun; filtre menüsüyle tek bir markaya ait tüm araçları listeleyin.",
          placement: "bottom",
          badgeText: "Akıllı Filtre",
          icon: Search,
        },
        {
          targetSelector: '[data-tour="veh-table"]',
          title: "Müşteri İletişimi & Muayene Takibi",
          description:
            "Araç sahibinin telefonuna tek tıkla WhatsApp mesajı atabilir, son servis tarihini inceleyebilir ve aracı doğrudan yeni iş emrine aktarabilirsiniz.",
          placement: "top",
          badgeText: "Araç İşlemleri",
          icon: Layers,
        },
      ]
    }

    if (pathname.startsWith("/inventory")) {
      return [
        {
          targetSelector: '[data-tour="inv-header"]',
          title: "Yedek Parça & Depo Yönetimi",
          description:
            "Atölyenizde bulunan tüm yedek parçaların, madeni yağların ve sarf malzemelerin anlık stok miktarlarını ve maliyetlerini takip edin.",
          placement: "bottom",
          badgeText: "Stok Takibi",
          icon: Package,
        },
        {
          targetSelector: '[data-tour="inv-alerts"]',
          title: "Kritik Stok & Tükenenler Uyarısı",
          description:
            "Belirlediğiniz kritik eşiğin altına düşen parçalar burada kırmızıyla uyarılır, böylece parçasız kalıp işlerin aksamasını önlersiniz.",
          placement: "bottom",
          badgeText: "Akıllı Uyarı",
          icon: BarChart3,
        },
        {
          targetSelector: '[data-tour="inv-create"]',
          title: "Yeni Parça Tanımlama & Giriş",
          description:
            "Satın aldığınız parçanın OEM kodunu, raf yerini, alış/satış fiyatını ve barkodunu kaydederek stoğunuza ekleyin.",
          placement: "bottom",
          badgeText: "Stok Girişi",
          icon: Plus,
        },
        {
          targetSelector: '[data-tour="inv-table"]',
          title: "Parça Listesi & Hareket Geçmişi",
          description:
            "Hangi parçanın hangi iş emrine ve hangi araca takıldığını tarihçesiyle inceleyin; barkod basarak raf düzeninizi koruyun.",
          placement: "top",
          badgeText: "Depo Hareketleri",
          icon: Layers,
        },
      ]
    }

    if (pathname.startsWith("/invoices")) {
      return [
        {
          targetSelector: '[data-tour="invs-header"]',
          title: "Faturalar, Cari Hesaplar & Kasa",
          description:
            "Kesilen servis faturalarını, toptancı ve müşteri cari hesap bakiyelerini ve günlük nakit/pos kasa girişlerini yönetin.",
          placement: "bottom",
          badgeText: "Finans & Kasa",
          icon: Receipt,
        },
        {
          targetSelector: '[data-tour="invs-stats"]',
          title: "Tahsilat & Alacak Göstergeleri",
          description:
            "Açık hesap alacaklarınızı, vadesi geçen ödemeleri ve toplam kasa cirosunu anlık olarak tek bakışta izleyin.",
          placement: "bottom",
          badgeText: "Ciro & Alacak",
          icon: TrendingUp,
        },
        {
          targetSelector: '[data-tour="invs-ribbon"]',
          title: "Nakit, POS ve Havale Kasa Dağılımı",
          description:
            "Gün içinde kasaya giren nakit, kredi kartı ve banka havalesi tutarlarını ayrı ayrı inceleyerek gün sonu kasa mutabakatınızı yapın.",
          placement: "bottom",
          badgeText: "Kasa İcmali",
          icon: Banknote,
        },
        {
          targetSelector: '[data-tour="invs-table"]',
          title: "PDF Fatura Basımı & Paylaşım",
          description:
            "Faturanızı WorksAuto kurumsal A4 formatında PDF olarak indirin, yazdırın ya da müşterinize e-posta/WhatsApp ile iletin.",
          placement: "top",
          badgeText: "Kurumsal Baskı",
          icon: Printer,
        },
      ]
    }

    if (pathname.startsWith("/current-accounts")) {
      return [
        {
          targetSelector: '[data-tour="ca-header"]',
          title: "Cari Hesaplar & Borç Limiti Yönetimi",
          description:
            "Toptancılar, filo kiralama şirketleri ve veresiye çalışan müşterilerinizin açık alacak ve borç bakiyelerini kurumsal olarak yönetin.",
          placement: "bottom",
          badgeText: "Cari Yönetim",
          icon: HandCoins,
        },
        {
          targetSelector: '[data-tour="ca-stats"]',
          title: "Açık Alacak & Limit Aşım Sayaçları",
          description:
            "Toplam açık cari alacağınızı, avansları ve belirlediğiniz kredi limitini aşan riskli hesapları anlık renkli sayaçlarla izleyin.",
          placement: "bottom",
          badgeText: "Risk Sayaçları",
          icon: TrendingUp,
        },
        {
          targetSelector: '[data-tour="ca-table"]',
          title: "Detaylı Ekstre Dökümü & Tahsilat",
          description:
            "Müşterinin satırına tıklayarak resmi cari ekstresini PDF formatında görüntüleyin ve 'Tahsilat Al' ile nakit/havale/pos mahsubu gerçekleştirin.",
          placement: "top",
          badgeText: "Ekstre & Tahsilat",
          icon: Receipt,
        },
      ]
    }

    if (pathname.startsWith("/staff")) {
      return [
        {
          targetSelector: '[data-tour="staff-header"]',
          title: "Personel Kadrosu & Vardiya Yönetimi",
          description:
            "Servisinizde çalışan ustalar, çıraklar, danışmanlar ve yöneticilerin tüm özlük, çalışma ve yetki alanıdır.",
          placement: "bottom",
          badgeText: "Ekip & Atölye",
          icon: Users,
        },
        {
          targetSelector: '[data-tour="staff-tabs"]',
          title: "Kadro, Vardiya & İzin Sekmeleri",
          description:
            "Ustalarınızı listeleyebilir, haftalık çalışma çizelgelerini düzenleyebilir ve yıllık/mazeret izinlerini takip edebilirsiniz.",
          placement: "bottom",
          badgeText: "Modül Sekmeleri",
          icon: Layers,
        },
        {
          targetSelector: '[data-tour="staff-positions"]',
          title: "Özel Pozisyon & Rol Yetkileri",
          description:
            "Servisinize özel pozisyonlar (Usta Başı, Mekanik Şefi, Kaporta Ustası) ekleyebilir ve hangi ekranlara erişebileceklerini belirleyebilirsiniz.",
          placement: "bottom",
          badgeText: "Yetkilendirme",
          icon: ShieldCheck,
        },
        {
          targetSelector: '[data-tour="staff-shifts"]',
          title: "Vardiya Çizelgesi & PDF Çıktısı",
          description:
            "Haftalık kimin hangi saatte çalışacağını randevu tarzı takvimde planlayın ve panoya asmak için resmi A4 PDF çizelgesi bastırın.",
          placement: "top",
          badgeText: "Vardiya & Çıktı",
          icon: Clock,
        },
      ]
    }

    if (pathname.startsWith("/reports")) {
      return [
        {
          targetSelector: '[data-tour="rep-header"]',
          title: "Finansal & Operasyonel Raporlar",
          description:
            "Servisinizin ciro büyümesini, parça kâr marjlarını ve usta başına düşen işçilik verimini gösteren akıllı analiz ekranı.",
          placement: "bottom",
          badgeText: "Raporlama",
          icon: BarChart3,
        },
        {
          targetSelector: '[data-tour="rep-filters"]',
          title: "Dönem & Tarih Filtreleme",
          description:
            "Bu hafta, bu ay veya dilediğiniz özel tarih aralığına göre maliyet, kâr ve işçilik analizlerini filtreleyin.",
          placement: "bottom",
          badgeText: "Dönem Seçimi",
          icon: Calendar,
        },
        {
          targetSelector: '[data-tour="rep-cards"]',
          title: "Net Karlılık & Ciro Grafikleri",
          description:
            "Hangi branşın ve hangi işçilik kaleminin servisinize ne kadar kâr bıraktığını net grafiklerle izleyin.",
          placement: "top",
          badgeText: "Karlılık Analizi",
          icon: TrendingUp,
        },
      ]
    }

    if (pathname.startsWith("/settings")) {
      return [
        {
          targetSelector: '[data-tour="set-header"]',
          title: "Servis & İşletme Yapılandırma Merkezi",
          description:
            "Servisinizin kurumsal kimliği, hizmet kataloğu, atölye lift kapasitesi, bildirim kanalları, e-fatura ve online ödeme altyapısını buradan tek merkezden yönetebilirsiniz.",
          placement: "bottom",
          badgeText: "Servis Ayarları",
          icon: Settings,
        },
        {
          targetSelector: '[data-tour="set-profile"]',
          title: "Firma & Servis Profili",
          description:
            "Kurumsal logonuzu yükleyin, resmi ünvan ve iletişim bilgilerinizi girin, harita konumunuzu ve müşterilerin doğrudan yorum bırakması için Google dükkan linkinizi kaydedin.",
          placement: "bottom",
          badgeText: "Kurumsal Bilgiler",
          icon: Building2,
        },
        {
          targetSelector: '[data-tour="set-services"]',
          title: "Hizmet & İşçilik Kataloğu",
          description:
            "Atölyenizde uygulanan periyodik bakım, mekanik, elektrik gibi tüm işçilik kalemlerini, varsayılan işlem sürelerini ve birim fiyatlarını listeleyin ve düzenleyin.",
          placement: "bottom",
          badgeText: "İşçilik Tarifesi",
          icon: Wrench,
        },
        {
          targetSelector: '[data-tour="set-bays"]',
          title: "İstasyonlar & Lift Kapasitesi",
          description:
            "Atölyenizdeki aktif iki sütunlu lift, dört sütunlu lift, rot-balans ve kabul istasyonlarını isimlendirerek randevularda lift çakışmalarını sıfıra indirin.",
          placement: "bottom",
          badgeText: "Lift Kapasitesi",
          icon: Layers,
        },
        {
          targetSelector: '[data-tour="set-notifications"]',
          title: "Bildirim & WhatsApp Entegrasyonu",
          description:
            "Müşterilerinize gidecek araç kabul fişi, ek parça onayı, canlı takip linki ve fatura bildirimleri için WhatsApp Web QR kodunuzu eşleyin ve SMS/e-posta tercihlerini belirleyin.",
          placement: "bottom",
          badgeText: "İletişim & WhatsApp",
          icon: MessageSquare,
        },
        {
          targetSelector: '[data-tour="set-einvoice"]',
          title: "E-Fatura & Mali Entegratör",
          description:
            "GİB mevzuatına tam uyumlu e-Fatura ve e-Arşiv fatura kesebilmek için Nilvera, EDM, Trendyol vb. entegratör API hesap bilgilerinizi ve fatura seri-sıra numaralarınızı tanımlayın.",
          placement: "bottom",
          badgeText: "E-Fatura Ayarları",
          icon: Receipt,
        },
        {
          targetSelector: '[data-tour="set-payments"]',
          title: "Ödeme Alma & PayTR Sanal POS",
          description:
            "Müşterilerinizin cep telefonlarına gönderilen canlı takip linki üzerinden kredi kartıyla anında tahsilat alabilmek için PayTR sanal POS anahtarlarınızı ve havale/EFT için banka IBAN bilgilerinizi girin.",
          placement: "bottom",
          badgeText: "Online Tahsilat",
          icon: CreditCard,
        },
      ]
    }

    // Varsayılan genel rehber adımı
    return [
      {
        targetSelector: "header",
        title: "WorksAuto Servis Yönetim Paneli",
        description:
          "Tüm servis operasyonlarınızı kolaylıkla yönetebilir, üst arama çubuğu ve kısayollarla işlemlerinizi saniyeler içinde gerçekleştirebilirsiniz.",
        placement: "bottom",
        badgeText: "Hızlı Kılavuz",
        icon: Sparkles,
      },
    ]
  }, [pathname])

  const [windowWidth, setWindowWidth] = React.useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  )

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Filter available steps dynamically so hidden responsive elements (e.g. hidden md:flex) are skipped on mobile
  const availableSteps = React.useMemo(() => {
    if (!mounted || typeof document === "undefined") return steps
    // Reference windowWidth to re-filter when viewport breakpoint changes
    if (windowWidth <= 0) return steps

    const filtered = steps.filter((step) => {
      const el = document.querySelector(step.targetSelector)
      if (!el) return false
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        (rect.width === 0 && rect.height === 0)
      ) {
        return false
      }
      return true
    })
    return filtered.length > 0 ? filtered : steps
  }, [steps, mounted, windowWidth])

  const safeStepIndex = Math.min(currentStepIndex, availableSteps.length - 1)
  const currentStep = availableSteps[safeStepIndex] || availableSteps[0]

  // Update target rect on step change or resize/scroll
  const updatePosition = React.useCallback(() => {
    if (!isOpen || !currentStep) return

    const el = document.querySelector(currentStep.targetSelector)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect((prev) => {
          if (
            prev &&
            Math.abs(prev.top - rect.top) < 0.5 &&
            Math.abs(prev.left - rect.left) < 0.5 &&
            Math.abs(prev.width - rect.width) < 0.5 &&
            Math.abs(prev.height - rect.height) < 0.5
          ) {
            return prev
          }
          return rect
        })
        return
      }
    }
    setTargetRect(null)
  }, [isOpen, currentStep])

  // Center target into view smoothly on step change with multi-phase position verification
  React.useEffect(() => {
    if (!isOpen || !currentStep) return
    const el = document.querySelector(currentStep.targetSelector)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
      const timers = [
        setTimeout(updatePosition, 50),
        setTimeout(updatePosition, 180),
        setTimeout(updatePosition, 350),
        setTimeout(updatePosition, 550),
      ]
      return () => timers.forEach(clearTimeout)
    }
  }, [isOpen, safeStepIndex, currentStep, updatePosition])

  // Real-time tracking loop with RAF and capture scroll listeners (guarantees zero drift during touch scrolls)
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0)
      setTargetRect(null)
      return
    }

    let rafId: number
    let isTracking = true

    const loop = () => {
      if (!isTracking) return
      updatePosition()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    // Capture scrolls on window AND scrollable sub-elements (like settings tab overflow-x-auto)
    window.addEventListener("scroll", updatePosition, { capture: true, passive: true })
    window.addEventListener("resize", updatePosition, { passive: true })

    return () => {
      isTracking = false
      cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [isOpen, updatePosition])

  // Keyboard navigation: ArrowRight / ArrowLeft / Escape
  React.useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowRight") {
        if (safeStepIndex < availableSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1)
        } else {
          onClose()
        }
      } else if (e.key === "ArrowLeft") {
        if (safeStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, safeStepIndex, availableSteps.length, onClose])

  if (!mounted || !isOpen) return null

  const isFirstStep = safeStepIndex === 0
  const isLastStep = safeStepIndex === availableSteps.length - 1
  const Icon = currentStep.icon || Sparkles

  const isMobile = windowWidth < 768

  // Calculate Tooltip Box Coordinates
  let tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  }

  if (isMobile) {
    if (targetRect) {
      const vh = typeof window !== "undefined" ? window.innerHeight : 600
      const targetCenterY = targetRect.top + targetRect.height / 2
      // If target is in the upper half of the screen, dock at bottom
      const isUpper = targetCenterY < vh * 0.48

      if (isUpper) {
        tooltipStyle = {
          bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          left: "14px",
          right: "14px",
          width: "auto",
          maxWidth: "calc(100vw - 28px)",
          transform: "none",
        }
      } else {
        tooltipStyle = {
          top: "max(16px, env(safe-area-inset-top, 16px))",
          left: "14px",
          right: "14px",
          width: "auto",
          maxWidth: "calc(100vw - 28px)",
          transform: "none",
        }
      }
    } else {
      tooltipStyle = {
        bottom: "max(16px, env(safe-area-inset-bottom, 16px))",
        left: "14px",
        right: "14px",
        width: "auto",
        maxWidth: "calc(100vw - 28px)",
        transform: "none",
      }
    }
  } else if (targetRect) {
    const margin = 16
    const tooltipWidth = 370
    const estimatedHeight = 220

    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))

    const hasRoomOnTop = targetRect.top >= estimatedHeight + margin
    const preferTop =
      currentStep.placement === "top" ||
      targetRect.bottom + estimatedHeight + margin > window.innerHeight

    if (preferTop && hasRoomOnTop) {
      const top = Math.max(16, targetRect.top - margin - estimatedHeight)
      tooltipStyle = { top: `${top}px`, left: `${left}px` }
    } else {
      const top = Math.min(window.innerHeight - estimatedHeight - 16, targetRect.bottom + margin)
      tooltipStyle = { top: `${Math.max(16, top)}px`, left: `${left}px` }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[150] pointer-events-auto">
      {/* Dynamic SVG Spotlight Cutout Mask */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-10 transition-opacity duration-300">
        <defs>
          <mask id="spotlight-mask">
            {/* White: overlay is active */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black: transparent hole where target is */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 6)}
                y={Math.max(0, targetRect.top - 6)}
                width={Math.max(0, targetRect.width + 12)}
                height={Math.max(0, targetRect.height + 12)}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dimmed Screen with Cutout Mask */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(7, 11, 18, 0.78)"
          mask="url(#spotlight-mask)"
          className="pointer-events-auto cursor-pointer"
          onClick={onClose}
        />
      </svg>

      {/* Target Focus Highlight Box (Glowing Neon Border Around Bright Cutout) */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-75 ease-out ring-4 ring-sky-400 shadow-[0_0_35px_rgba(56,189,248,0.6)] z-[25]"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${Math.max(0, targetRect.width + 12)}px`,
            height: `${Math.max(0, targetRect.height + 12)}px`,
          }}
        />
      )}

      {/* Floating Animated Step Tooltip Card */}
      <div
        style={tooltipStyle}
        className="fixed z-[30] w-[calc(100vw-28px)] sm:w-[370px] max-w-none sm:max-w-[370px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4 transition-all duration-200 ease-out animate-in zoom-in-95"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Icon size={16} />
            </div>
            <Badge variant="outline" className="text-[10px] font-bold border-sky-500/30 text-sky-600 dark:text-sky-400">
              {currentStep.badgeText || "Kılavuz"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {safeStepIndex + 1} / {availableSteps.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
              title="Turu Kapat"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentStep.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer with Step Dots and Navigation */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {availableSteps.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === safeStepIndex
                    ? "w-5 bg-sky-500"
                    : "w-1.5 bg-slate-200 dark:bg-slate-700"
                )}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} className="mr-0.5" />
                Geri
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (isLastStep) {
                  onClose()
                  toast.success("Tur tamamlandı! İyi çalışmalar dileriz.")
                } else {
                  setCurrentStepIndex((prev) => Math.min(availableSteps.length - 1, prev + 1))
                }
              }}
              className="h-8 px-3.5 text-xs font-semibold gap-1 cursor-pointer bg-sky-600 hover:bg-sky-500 text-white shadow-xs"
            >
              <span>{isLastStep ? "Turu Tamamla" : "Sonraki"}</span>
              {isLastStep ? <Check size={13} /> : <ChevronRight size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
