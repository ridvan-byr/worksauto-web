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
        {/* Sol: SADECE Firma Logosu & Resmi Bilgiler (Asıl Marka Sahibi) */}
        <div className="space-y-2 max-w-md text-left">
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={companyName}
                style={{
                  maxHeight: `${tenant.logoHeight || 48}px`,
                  maxWidth: `${tenant.logoWidth || 180}px`,
                }}
                className="object-contain"
              />
            ) : (
              /* Logo yüklenmemişse tasarımı otomatik ayarlayan şık kurumsal monogram mühür */
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs print:border print:border-slate-800 shrink-0">
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 leading-tight tracking-tight">
                    {companyName}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Yetkili Servis Merkezi
                  </p>
                </div>
              </div>
            )}
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

        {/* Kurumsal Banka & Havale Bilgisi (Varsa) */}
        {tenant?.iban && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Banka:</strong> {tenant.bankName || "Banka"} • <strong>Hesap Sahibi:</strong> {tenant.accountHolder || officialTitle}
            </span>
            <span className="font-bold text-slate-800 tracking-wider">
              IBAN: {tenant.iban}
            </span>
          </div>
        )}

        {/* Kurumsal Alt Dipnot & WorksAuto Güvenlik Mührü */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/worksauto-logo-dark.png"
              alt="WorksAuto"
              width={90}
              height={18}
              className="h-3.5 w-auto object-contain shrink-0"
            />
            <span className="text-slate-300">|</span>
            <span className="leading-relaxed">{noticeText}</span>
          </div>
          <span className="shrink-0 text-slate-600 font-semibold">
            Belge Takip No: {documentNumber || `REF-${formattedDate.replace(/-/g, "")}`} • Sayfa 1/1
          </span>
        </div>
      </div>
    </div>
  )
}
