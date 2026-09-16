"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import {
  HelpCircle,
  X,
  Sparkles,
  Lightbulb,
  Keyboard,
  Wrench,
  Calendar,
  Users,
  Package,
  Receipt,
  Settings,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function PageTipsModal() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Determine current page contextual help
  const pageHelp = React.useMemo(() => {
    if (pathname === "/") {
      return {
        title: "Ana Kontrol Paneli Rehberi",
        icon: Sparkles,
        badge: "Genel Bakış",
        tips: [
          "Canlı sayaçlar atölyedeki anlık araçları, randevuları ve günlük kasa tahsilatını otomatik yansıtır.",
          "Hızlı Başlangıç Rehberi ile servis logonuzu, PayTR anahtarlarınızı ve faaliyet şablonlarınızı kolayca yapılandırabilirsiniz.",
          "Üst kısımdaki hızlı plaka arama çubuğu ile herhangi bir müşteriyi veya aracı anında bulup detayına gidebilirsiniz.",
        ],
        shortcuts: [
          { key: "Hızlı Kabul", desc: "Yeni müşteri ve aracı tek ekranda sisteme kaydetme" },
          { key: "Atölye Panosu", desc: "Liftte işlem gören araçların durumunu değiştirme" },
        ],
      }
    }
    if (pathname.startsWith("/work-orders")) {
      return {
        title: "Atölye ve İş Emirleri Panosu",
        icon: Wrench,
        badge: "Atölye Yönetimi",
        tips: [
          "İş emri kartlarındaki 'Müşteriye Bildir' butonuyla WhatsApp veya SMS üzerinden son durumu tek tıkla iletebilirsiniz.",
          "Bildirim gönderildiğinde kart üzerinde yeşil '✓ Bildirildi (Saat)' rozeti görünür.",
          "Müşteri takip linkinde (worksauto/track/...) araç sahibine canlı durum ve 5 yıldızlı Google Yorum akıllı hunisi sunulur.",
          "4-5 yıldız veren müşteriler doğrudan Google Haritalar işletme profilinize yönlendirilir.",
        ],
        shortcuts: [
          { key: "Tıkla & Kapat", desc: "Açılan pencereleri dışarıya tıklayarak kapatabilirsiniz" },
          { key: "Fotoğraf & Teşhis", desc: "Kabul anında araç hasar fotoğraflarını kaydedin" },
        ],
      }
    }
    if (pathname.startsWith("/appointments")) {
      return {
        title: "Randevu Takvimi & Planlama",
        icon: Calendar,
        badge: "Randevular",
        tips: [
          "Bir randevuyu ertelemek istediğinizde, sistem müşteriye otomatik SMS/WhatsApp bilgilendirme uyarısı ve mesaj önizlemesi sunar.",
          "Aynı usta veya lifte çakışan saatlerde randevu verilmesi PostgreSQL btree_gist kuralı ile engellenir.",
          "Randevu günü gelen araç tek tıkla 'İş Emrine Dönüştür' butonu ile atölyeye kabul edilir.",
        ],
        shortcuts: [
          { key: "Hızlı Nedenler", desc: "Randevu ertelemede hazır şablon nedenleri kullanabilirsiniz" },
          { key: "Lift Dağılımı", desc: "Günün saatlik yoğunluğunu takvimde inceleyin" },
        ],
      }
    }
    if (pathname.startsWith("/customers")) {
      return {
        title: "Müşteri & Araç Portföyü",
        icon: Users,
        badge: "Müşteriler",
        tips: [
          "Müşteri kartlarında kayıtlı tüm plakalar, geçmiş servis işlemleri ve açık cari bakiye tek ekranda listelenir.",
          "Plaka arama filtresi boşluksuz veya kısmi girişleri akıllıca eşleştirir.",
          "Müşteri detay sayfasından geçmiş faturaları ve tahsilat makbuzlarını yazdırabilirsiniz.",
        ],
        shortcuts: [
          { key: "Plaka Geçmişi", desc: "Aracın tüm servis geçmişi km ve tarih sıralı tutulur" },
        ],
      }
    }
    if (pathname.startsWith("/inventory")) {
      return {
        title: "Yedek Parça & Stok Takibi",
        icon: Package,
        badge: "Envanter",
        tips: [
          "Stok adedi kritik eşiğin altına düşen parçalar turuncu uyarı rozetiyle ana sayfada ve listede vurgulanır.",
          "Alış ve satış fiyatları üzerinden otomatik kâr marjı hesaplanır.",
          "İş emrine parça eklendiğinde stoktan anında rezerve edilir ve düşülür.",
        ],
        shortcuts: [
          { key: "Barkod Arama", desc: "OEM kodu veya parça adı ile hızlı filtreleme yapın" },
        ],
      }
    }
    if (pathname.startsWith("/invoices")) {
      return {
        title: "Fatura, Kasa & Tahsilat",
        icon: Receipt,
        badge: "Finans",
        tips: [
          "Nakit, Kredi Kartı (POS), Havale ve PayTR online ödeme yöntemlerini tek merkezden yönetebilirsiniz.",
          "Fatura çıktılarında kurumsal logonuz, servis iletişim bilgileriniz ve banka IBAN hesabınız otomatik basılır.",
          "Ödenmemiş faturalar cari hesap takibine düşer ve gecikme takibi yapılır.",
        ],
        shortcuts: [
          { key: "Yazdır / PDF", desc: "A4 formatında kurumsal antetli fatura ve fiş çıktısı alın" },
        ],
      }
    }
    if (pathname.startsWith("/settings")) {
      return {
        title: "Servis Ayarları ve Kurumsal Kimlik",
        icon: Settings,
        badge: "Yapılandırma",
        tips: [
          "İşletme Profili sekmesinden servis logonuzu ve Google dükkan yorum linkinizi kaydedin.",
          "Hizmet & İşçilik Kataloğu sekmesinden standart işçilik kalemlerinizi, sürelerini ve birim fiyatlarını belirleyin.",
          "Banka & IBAN ve PayTR bilgilerini tanımlayarak online kartla ödeme kabul etmeye başlayabilirsiniz.",
        ],
        shortcuts: [
          { key: "Katalog Yönetimi", desc: "Hizmet ve işçiliklerinizi tek ekrandan güncelleyin" },
        ],
      }
    }
    if (pathname.startsWith("/reports")) {
      return {
        title: "Finansal & Operasyonel Raporlar",
        icon: BarChart3,
        badge: "Raporlar",
        tips: [
          "Dönem filtrelerini kullanarak bugün, bu hafta veya bu ayki net kâr ve brüt ciro analizini görüntüleyin.",
          "İşçilik vs. Yedek Parça ciro dağılımını ve kasa ödeme kanallarını görsel grafiklerle inceleyebilirsiniz.",
          "Excel İndir butonu ile muhasebeniz için tam detaylı kârlılık dökümünü tek tıkla dışa aktarabilirsiniz.",
        ],
        shortcuts: [
          { key: "Excel Önizle", desc: "İndirmeden önce rapor tablolarını modal içinde inceleyin" },
          { key: "Yazdır", desc: "A4 formatında tek sayfalık yönetici icmali çıktısı alın" },
        ],
      }
    }
    return {
      title: "WorksAuto Servis Rehberi",
      icon: Lightbulb,
      badge: "Yardım",
      tips: [
        "WorksAuto ile müşteri kabulünden atölye lift takibine, faturadan Google yorum toplamaya kadar tüm süreçleri yönetebilirsiniz.",
        "Açılan tüm pencereleri ESC tuşuyla veya karartılmış alana tıklayarak kapatabilirsiniz.",
        "Üst paneldeki hızlı arama kutusunu kullanarak müşteri veya plakalara saniyeler içinde erişin.",
      ],
      shortcuts: [],
    }
  }, [pathname])

  const Icon = pageHelp.icon

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-sky-600 hover:border-sky-500/40 hover:bg-sky-50/60 dark:text-slate-400 dark:hover:text-sky-400 dark:hover:bg-sky-950/40 transition-all cursor-pointer"
        title="Sayfa İpuçları & Hızlı Kılavuz"
        aria-label="Sayfa İpuçları"
      >
        <HelpCircle size={17} />
      </button>

      {mounted && isOpen && createPortal(
        <div
          onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            className="w-full max-w-md sm:max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="p-6 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {pageHelp.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold border-sky-500/30 text-sky-600 dark:text-sky-400">
                        {pageHelp.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Bu sayfadaki önemli özellikler ve pratik kullanım ipuçları
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Tips Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span>Önemli Özellikler & Kolaylıklar</span>
                </h4>
                <div className="space-y-2">
                  {pageHelp.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortcuts Section */}
              {pageHelp.shortcuts.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Keyboard size={14} className="text-sky-500" />
                    <span>Kısayol ve Pratik Eylemler</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pageHelp.shortcuts.map((sc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                      >
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {sc.key}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {sc.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Best Practice Note */}
              <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                💡 <strong>İpucu:</strong> Sistemdeki tüm pencereleri arka plana tıklayarak kapatabilir; müşteri bildirimlerini SMS veya doğrudan WhatsApp Web üzerinden gönderebilirsiniz.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">WorksAuto v2.4 • Akıllı Servis Desteği</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 px-4 text-xs font-semibold cursor-pointer"
              >
                Anladım, Kapat
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
