"use client"

import * as React from "react"
import {
  Users,
  Search,
  AlertTriangle,
  ShieldCheck,
  HandCoins,
  FileText,
  TrendingDown,
  Building2,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ManualCollectionModal } from "@/features/billing/components/manual-collection-modal"
import { CariHistoryModal } from "@/features/billing/components/cari-history-modal"
import {
  getStoredCurrentAccounts,
  recordManualCariCollection,
} from "@/features/billing/mock-data"
import { CurrentAccount, PaymentMethod } from "@/features/billing/types"
import { cn } from "@/lib/utils"

export default function CurrentAccountsPage() {
  const [accounts, setAccounts] = React.useState<CurrentAccount[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<"all" | "exceeded" | "has_balance">("all")

  // Modals
  const [collectionModalState, setCollectionModalState] = React.useState<{
    isOpen: boolean
    account: CurrentAccount | null
  }>({ isOpen: false, account: null })

  const [historyModalState, setHistoryModalState] = React.useState<{
    isOpen: boolean
    account: CurrentAccount | null
  }>({ isOpen: false, account: null })

  React.useEffect(() => {
    setAccounts(getStoredCurrentAccounts())
  }, [])

  // KPIs
  const totalOpenBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const totalCredits = accounts.reduce((sum, a) => sum + a.totalCredits, 0)
  const exceededCount = accounts.filter((a) => a.balance > a.creditLimit).length
  const totalAccountsCount = accounts.length

  const filteredAccounts = React.useMemo(() => {
    return accounts.filter((a) => {
      if (filterType === "exceeded" && a.balance <= a.creditLimit) return false
      if (filterType === "has_balance" && a.balance <= 0) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchName = a.customerName.toLowerCase().includes(q)
      const matchCompany = a.companyTitle?.toLowerCase().includes(q) || false
      const matchPhone = a.customerPhone.includes(q)
      return matchName || matchCompany || matchPhone
    })
  }, [accounts, filterType, searchQuery])

  const handleApplyCollection = (
    customerId: string,
    amount: number,
    method: PaymentMethod,
    ref?: string,
    note?: string
  ) => {
    recordManualCariCollection(customerId, amount, method, ref, note)
    setAccounts(getStoredCurrentAccounts())
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Cari Hesaplar & Borç Limiti Takibi
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {accounts.length} Müşteri / Filo
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Müşteri borç ve alacak bakiyeleri, tanımlı kredi limitleri ve detaylı ekstre dökümleri.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Açık Cari Alacak</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {totalOpenBalance.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Borç Limiti Aşılanlar</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {exceededCount} Müşteri
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Kümülatif Tahsilat</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalCredits.toLocaleString("tr-TR")} ₺
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Aktif Cari Kart</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
              {totalAccountsCount} Cari
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı, şirket ünvanı veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tüm Cariler" },
            { id: "exceeded", label: "⚠️ Limiti Aşanlar", alert: true },
            { id: "has_balance", label: "Açık Borcu Olanlar" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                filterType === tab.id
                  ? tab.alert
                    ? "bg-rose-500 text-white border-rose-500 shadow-xs font-bold"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                  : tab.alert
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Müşteri / Cari Ünvan</th>
                <th className="py-3.5 px-4">Kredi Limiti</th>
                <th className="py-3.5 px-4">Toplam Borç</th>
                <th className="py-3.5 px-4">Toplam Tahsilat</th>
                <th className="py-3.5 px-4">Güncel Bakiye</th>
                <th className="py-3.5 px-4">Risk Durumu</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aranan kriterlere uygun cari hesap bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isExceeded = acc.balance > acc.creditLimit
                  return (
                    <tr
                      key={acc.customerId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setHistoryModalState({ isOpen: true, account: acc })}
                    >
                      {/* Customer Name / Company */}
                      <td className="py-4 px-4 sm:px-6">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {acc.companyTitle || acc.customerName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          {acc.companyTitle && <span>Yetkili: {acc.customerName} •</span>}
                          <span>{acc.customerPhone}</span>
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-4 px-4 font-mono text-slate-500 text-xs">
                        {acc.creditLimit.toLocaleString("tr-TR")} ₺
                      </td>

                      {/* Total Debits */}
                      <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300 text-xs">
                        {acc.totalDebits.toLocaleString("tr-TR")} ₺
                      </td>

                      {/* Total Credits */}
                      <td className="py-4 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        {acc.totalCredits.toLocaleString("tr-TR")} ₺
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className={acc.balance > 0 ? "font-bold text-rose-600 dark:text-rose-400" : "text-slate-400"}>
                          {acc.balance.toLocaleString("tr-TR")} ₺
                        </span>
                      </td>

                      {/* Risk Badge */}
                      <td className="py-4 px-4">
                        {isExceeded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle size={11} />
                            <span>Limit Aşıldı (+{(acc.balance - acc.creditLimit).toLocaleString("tr-TR")} ₺)</span>
                          </span>
                        ) : acc.balance > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            <ShieldCheck size={11} />
                            <span>Limit Dahilinde</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck size={11} />
                            <span>Borç Yok (Sıfır)</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {acc.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => setCollectionModalState({ isOpen: true, account: acc })}
                              className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title="Manuel Tahsilat Girişi"
                            >
                              <HandCoins size={13} />
                              <span>Tahsilat</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setHistoryModalState({ isOpen: true, account: acc })}
                            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Cari Ekstre Dökümü"
                          >
                            <FileText size={13} />
                            <span>Ekstre</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Collection Modal */}
      <ManualCollectionModal
        isOpen={collectionModalState.isOpen}
        account={collectionModalState.account}
        onClose={() => setCollectionModalState({ isOpen: false, account: null })}
        onSuccess={handleApplyCollection}
      />

      {/* Cari History Modal */}
      <CariHistoryModal
        isOpen={historyModalState.isOpen}
        account={historyModalState.account}
        onClose={() => setHistoryModalState({ isOpen: false, account: null })}
      />
    </div>
  )
}
