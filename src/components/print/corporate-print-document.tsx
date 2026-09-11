"use client"

import * as React from "react"
import Image from "next/image"
import { useTenantSettings } from "@/features/settings/api/use-settings"
import { cn } from "@/lib/utils"

export interface CorporatePrintDocumentProps {
  /** Belge Ana Başlığı (örn. "CARİ HESAP EKSTRESİ", "FATURA", "İŞ EMRİ TESLİM FORMU") */
  title: string
  /** Belge Numarası veya Referans Kodu (örn. "#INV-2026-00001", "#WO-2026-088") */
  documentNumber?: string
  /** Belge Düzenleme Tarihi (varsayılan: bugün) */
  date?: string
  /** Sağ üst köşedeki ilave meta bilgiler (örn. Vade Tarihi, Kredi Limiti vb.) */
  metaBadges?: React.ReactNode
  /** Müşteri, Araç veya Muhatap Kartı slotu */
  recipientCard?: React.ReactNode
  /** Belge gövdesi (hizmet/parça tablosu, cari hareketler tablosu vb.) */
  children: React.ReactNode
  /** Alt sağdaki toplamlar, KDV veya mutabakat özeti */
  summarySection?: React.ReactNode
  /** Kaşe ve İmza alanları */
  footerSignatures?: {
    leftTitle?: string
    rightTitle?: string
    leftSub?: string
    rightSub?: string
  }
  /** En alttaki resmi bilgilendirme / dipnot metni */
  legalNotice?: string
  /** Özel CSS sınıfları */
  className?: string
}

export function CorporatePrintDocument({
  title,
  documentNumber,
  date,
  metaBadges,
  recipientCard,
  children,
  summarySection,
  footerSignatures = {
    leftTitle: "WorksAuto Servis Yetkilisi (Kaşe / İmza)",
    rightTitle: "Müşteri / Cari Hesap Yetkilisi (Mutabıkım)",
  },
  legalNotice,
  className,
}: CorporatePrintDocumentProps) {
  const { data: tenant } = useTenantSettings()

  const formattedDate = date || new Date().toISOString().split("T")[0]

  const companyName = tenant?.name || tenant?.title || "WorksAuto Servis Merkezi"
  const noticeText =
    legalNotice ||
    "Bu döküm, WorksAuto servis yönetim altyapısı üzerinden dijital olarak üretilmiştir."
  const officialTitle = tenant?.legalName || tenant?.name || tenant?.title || "WorksAuto Otomotiv Servis Hizmetleri A.Ş."
  const address = tenant?.address
    ? `${tenant.address} ${tenant.district || ""} / ${tenant.city || ""}`.trim()
    : "Maslak Oto Sanayi Sitesi 4. Blok No: 18, Sarıyer / İstanbul"
  const taxInfo = `${tenant?.taxOffice || "Maslak"} V.D. • Vergi No: ${tenant?.taxNumber || "9871234567"}`
  const contactInfo = `Tel: ${tenant?.phone || "0 (212) 444 0 123"}${
    tenant?.email ? ` • E-posta: ${tenant.email}` : ""
  }`

  return (
    <div
      className={cn(
        // Enforce pure white background, dark high-contrast text, strictly isolated from dark mode
        "corporate-print-document bg-white text-slate-900 font-sans p-8 sm:p-10 space-y-6 max-w-4xl mx-auto w-full",
        "print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-4 print:bg-white print:text-slate-900",
        className
      )}
    >
      {/* 1. SABİT KURUMSAL FİRMA BAŞLIĞI (HEADER) */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900/80 print:pb-4">
        {/* Sol: Firma Logosu & Resmi Bilgiler */}
        <div className="space-y-1.5 max-w-md text-left">
          <div className="flex items-center gap-2.5">
            <Image
              src="/brand/worksauto-logo-dark.png"
              alt={companyName}
              width={160}
              height={34}
              priority
              className="h-8 w-auto object-contain"
            />
            <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase border-l-2 border-slate-300 pl-2.5 my-auto">
              {companyName}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 leading-relaxed font-medium">
            <p className="font-bold text-slate-800">{officialTitle}</p>
            <p>{address}</p>
            <p className="font-mono text-slate-700">{taxInfo} • {contactInfo}</p>
          </div>
        </div>

        {/* Sağ: Belge Başlığı & Referans Bilgileri */}
        <div className="text-left sm:text-right space-y-1 self-stretch sm:self-auto flex flex-col justify-between sm:justify-start">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-mono">
            {title}
          </p>

          {documentNumber && (
            <p className="text-sm font-black font-mono text-sky-700 tracking-wide">
              {documentNumber}
            </p>
          )}

          <div className="text-[11px] text-slate-600 font-mono space-y-0.5 mt-1">
            <p>
              Düzenleme Tarihi: <strong className="text-slate-900 font-bold">{formattedDate}</strong>
            </p>
            {metaBadges}
          </div>
        </div>
      </div>

      {/* 2. MÜŞTERİ / MUHATAP / ARAÇ KÜNYESİ (VARSAYILAN KART) */}
      {recipientCard && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
          {recipientCard}
        </div>
      )}

      {/* 3. DİNAMİK İÇERİK (TABLOLAR / KALEMLER / DETAYLAR) */}
      <div className="space-y-4">{children}</div>

      {/* 4. FİNANSAL ÖZET & MUTABAKAT KUTUSU (VARSAYSA) */}
      {summarySection && (
        <div className="flex justify-end pt-4 border-t border-slate-200 print:pt-2">
          {summarySection}
        </div>
      )}

      {/* 5. SABİT KURUMSAL İMZA & KAŞE ALANI (FOOTER) */}
      <div className="pt-8 border-t border-slate-200 print:pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="font-bold text-slate-800 mb-10">
              {footerSignatures.leftTitle}
            </p>
            <div className="border-b-2 border-dashed border-slate-300 mx-auto w-44 mb-1.5" />
            <p className="text-[10px] text-slate-400">Yetkili İmza & Kaşe</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 mb-10">
              {footerSignatures.rightTitle}
            </p>
            <div className="border-b-2 border-dashed border-slate-300 mx-auto w-44 mb-1.5" />
            <p className="text-[10px] text-slate-400">Teslim Eden / Teslim Alan İmza</p>
          </div>
        </div>

        {/* Kurumsal Alt Dipnot */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-2 text-center sm:text-left">
          <span className="leading-relaxed">{noticeText}</span>
          <span className="shrink-0 text-slate-500 font-semibold">
            Belge Takip No: {documentNumber || `REF-${formattedDate.replace(/-/g, "")}`} • Sayfa 1/1
          </span>
        </div>
      </div>
    </div>
  )
}
