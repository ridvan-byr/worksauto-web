"use client"

import Image from "next/image"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Printer, AlertTriangle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CurrentAccount } from "../types"

interface CariHistoryModalProps {
  isOpen: boolean
  account: CurrentAccount | null
  onClose: () => void
}

export function CariHistoryModal({ isOpen, account, onClose }: CariHistoryModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted || !account) return null

  const isLimitExceeded = account.balance > account.creditLimit

  const handlePrint = () => {
    const originalTitle = document.title
    const safeName = (account.companyTitle || account.customerName).replace(/[^a-zA-Z0-9]/g, "_")
    document.title = `WorksAuto_Cari_Ekstre_${safeName}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }

  const modalContent = (
    <div
      id="cari-modal-root"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none print:z-[9999]"
    >
      {/* Printable Card Container */}
      <div
        id="cari-card-container"
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:m-0"
      >
        
        {/* Top Action Bar (Print sırasında gizlenir) */}
        <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              CARİ EKSTRE
            </span>
            {isLimitExceeded ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle size={12} />
                <span>Borç Limiti Aşıldı!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={12} />
                <span>Limit Dahilinde</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Yazdır / PDF</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Fatura ile Birebir Aynı Kurumsal A4 Belge Şablonu */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans print:overflow-visible print:p-6 print:space-y-4">
          
          {/* Header (Fatura ile Birebir Aynı Logo & Başlık) */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <Image
                  src="/brand/worksauto-logo-dark.png"
                  alt="WorksAuto Servis Merkezi"
                  width={160}
                  height={34}
                  className="h-8 w-auto object-contain dark:invert print:invert-0"
                />
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase border-l border-slate-300 dark:border-slate-700 pl-2.5 my-auto">
                  Servis Merkezi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Maslak Oto Sanayi Sitesi 4. Blok No: 18, Sarıyer / İstanbul<br />
                Maslak V.D. • Vergi No: 9871234567 • Tel: 0 (212) 444 0 123
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xl font-black font-mono text-sky-600 dark:text-sky-400">
                CARİ HESAP EKSTRESİ
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Ekstre Tarihi: <strong>{new Date().toISOString().split("T")[0]}</strong><br />
                Kredi Limiti: <strong>{account.creditLimit.toLocaleString("tr-TR")} ₺</strong>
              </p>
            </div>
          </div>

          {/* Müşteri Künye Kartı (Fatura ile Birebir Aynı Taslak) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Cari Hesap Ünvanı</p>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {account.companyTitle || account.customerName}
                </p>
                {account.companyTitle && (
                  <p className="text-slate-500 text-[11px]">Yetkili Kişi: {account.customerName}</p>
                )}
                <p className="text-slate-500 text-[11px]">İletişim Tel: {account.customerPhone}</p>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Finansal Durum Özeti</p>
                <p className="text-slate-500 text-[11px]">
                  Toplam Faturalanan (Borç): <strong className="text-slate-900 dark:text-slate-100 font-mono">{account.totalDebits.toLocaleString("tr-TR")} ₺</strong>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Toplam Tahsil Edilen: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{account.totalCredits.toLocaleString("tr-TR")} ₺</strong>
                </p>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  Açık Bakiye: {account.balance.toLocaleString("tr-TR")} ₺
                </p>
              </div>
            </div>
          </div>

          {/* Hareketler Tablosu (Fatura ile Birebir Aynı Tablo Taslağı) */}
          <div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">İşlem Açıklaması</th>
                  <th className="py-3 px-3 text-center">Belge No</th>
                  <th className="py-3 px-3 text-right">Borç (+)</th>
                  <th className="py-3 px-3 text-right">Alacak (-)</th>
                  <th className="py-3 px-3 text-right">Kalan Bakiye</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {!account.movements || account.movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Bu cari hesaba ait kayıtlı ekstre / hareket bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  account.movements.map((m) => {
                    const debitNum = Number(m.debit || 0)
                    const creditNum = Number(m.credit || 0)
                    const balanceNum = Number(m.balanceAfter || 0)
                    const isDebit = debitNum > 0
                    const displayDate = typeof m.date === 'string' && m.date.includes('T')
                      ? m.date.split('T')[0]
                      : m.date || '-'

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3 px-3 font-mono text-slate-500 text-xs">{displayDate}</td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 text-xs">
                          {m.description}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {m.referenceNo ? (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {m.referenceNo}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {isDebit ? `${debitNum.toLocaleString("tr-TR")} ₺` : "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {!isDebit ? `${creditNum.toLocaleString("tr-TR")} ₺` : "-"}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {balanceNum.toLocaleString("tr-TR")} ₺
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Finansal Mutabakat Özeti (Fatura ile Birebir Aynı Kutu) */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Toplam Borç Kaydı:</span>
                <span>{account.totalDebits.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Yapılan Tahsilatlar:</span>
                <span>-{account.totalCredits.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between text-sm font-black text-rose-600 dark:text-rose-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-sans text-slate-900 dark:text-slate-100">MUTABIK BAKİYE:</span>
                <span>{account.balance.toLocaleString("tr-TR")} ₺</span>
              </div>
            </div>
          </div>

          {/* Kaşe & İmza Alanı (Fatura ile Birebir Aynı Taslak) */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-bold text-slate-600 dark:text-slate-300 mb-8">WorksAuto Servis Yetkilisi (Kaşe / İmza)</p>
              <div className="border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40" />
            </div>
            <div>
              <p className="font-bold text-slate-600 dark:text-slate-300 mb-8">Cari Hesap / Müşteri Yetkilisi (Mutabıkım)</p>
              <div className="border-b border-dashed border-slate-300 dark:border-slate-700 mx-auto w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
