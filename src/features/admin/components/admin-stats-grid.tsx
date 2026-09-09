"use client"

import * as React from "react"
import { Building2, Wrench, CheckCircle2, Server, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminStatsGridProps {
  stats?: {
    totalTenants?: number
    activeTenants?: number
    inactiveTenants?: number
    suspendedTenants?: number
    totalWorkOrders?: number
    totalCustomers?: number
    totalPlatformVolume?: number | string
  }
  health?: {
    database?: {
      latencyMs?: number
    }
  }
}

export function AdminStatsGrid({ stats, health }: AdminStatsGridProps) {
  const inactiveCount = stats?.inactiveTenants ?? stats?.suspendedTenants ?? 0

  return (
    <div className="space-y-6">
      {/* Platform Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Platform Yönetim Konsolu
            </h1>
            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-xs font-semibold">
              Canlı Sistem
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kayıtlı oto servisleri, lisans onayları, platform işlem hacmi ve altyapı metrikleri.
          </p>
        </div>

        {/* Infrastructure Badge (PostgreSQL ve Redis Gecikmesi) */}
        <div
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-xs"
          title="Bu değer doğrudan PostgreSQL veritabanı ile yapılan canlı 'SELECT 1' sorgusunun anlık gidiş-dönüş yanıt süresidir."
        >
          <Server size={14} className="text-sky-600 dark:text-sky-400" />
          <span>
            Veritabanı Gecikmesi: <strong className="text-emerald-500 dark:text-emerald-400 font-mono">{health?.database?.latencyMs ?? 1} ms</strong>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam Kayıtlı Servis</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.totalTenants ?? 0}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> {stats?.activeTenants ?? 0} aktif lisanslı
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Building2 size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Pending / Suspended */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bekleyen / Askıda</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {inactiveCount}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} /> Lisans müdahalesi gerekebilir
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <AlertTriangle size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Total Work Orders */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Toplam İş Emri</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {stats?.totalWorkOrders ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {stats?.totalCustomers ?? 0} kayıtlı müşteri
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Wrench size={22} />
            </div>
          </CardContent>
        </Card>

        {/* Platform Total Volume */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0e1524]/60 backdrop-blur-xl shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Platform İşlem Hacmi</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {Number(stats?.totalPlatformVolume ?? 0).toLocaleString("tr-TR")} ₺
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> Tamamlanan servis işleri
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp size={22} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
