"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  Wrench,
  Package,
  Receipt,
  Users,
  Car,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-status-badge"
import { getStoredWorkOrders } from "@/features/work-orders/mock-data"
import { getStoredAppointments } from "@/features/appointments/mock-data"
import { getStoredProducts, getLowStockProducts } from "@/features/inventory/mock-data"
import { getStoredInvoices } from "@/features/billing/mock-data"
import { WorkOrder } from "@/features/work-orders/types"
import { Appointment } from "@/features/appointments/types"
import { Product } from "@/features/inventory/types"
import { Invoice } from "@/features/billing/types"

export default function DashboardPage() {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([])
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([])
  const [invoices, setInvoices] = React.useState<Invoice[]>([])

  React.useEffect(() => {
    setWorkOrders(getStoredWorkOrders())
    setAppointments(getStoredAppointments())
    setProducts(getStoredProducts())
    setLowStockProducts(getLowStockProducts())
    setInvoices(getStoredInvoices())
  }, [])

  // Dynamic Live KPIs
  const inProgressWorkOrders = workOrders.filter((wo) => wo.status === "IN_PROGRESS")
  const completedWorkOrders = workOrders.filter((wo) => wo.status === "COMPLETED")
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.remainingAmount, 0)
  const openInvoicesCount = invoices.filter((inv) => inv.status !== "PAID").length

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all duration-300 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-100/80 border-sky-100 shadow-sm dark:from-slate-900 dark:via-[#0d1627] dark:to-slate-900 dark:border-slate-800/80 dark:shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-sky-400/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hoş Geldiniz, Rıdvan Bayar 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Atölyede şu an lifte {inProgressWorkOrders.length} araç işlem görüyor. {lowStockProducts.length} adet kritik stok uyarısı ve {appointments.length} kayıtlı randevu bulunuyor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/work-orders">
              <Button
                variant="outline"
                className="text-xs h-10 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1.5 cursor-pointer"
              >
                <Wrench size={14} />
                <span>Atölye Panosu</span>
              </Button>
            </Link>
            <Link href="/appointments">
              <Button className="text-xs h-10 gap-1.5 shadow-sky-500/25 cursor-pointer">
                <Plus size={16} />
                <span>Randevu Oluştur</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Dynamic KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Appointments Card */}
        <Link href="/appointments" className="group">
          <Card className="hover:border-sky-500/40 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kayıtlı Randevular</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {appointments.length} Randevu
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={12} /> Takvim slotları aktif
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
                <Calendar size={22} />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Workshop In-Progress Card */}
        <Link href="/work-orders" className="group">
          <Card className="hover:border-amber-500/40 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Atölye (Lifte Araçlar)</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {inProgressWorkOrders.length} İş Emri
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <Clock size={12} /> {completedWorkOrders.length} araç teslime hazır
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Wrench size={22} />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Critical Stock Alert Card */}
        <Link href="/inventory" className="group">
          <Card className="hover:border-rose-500/40 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kritik Stok Uyarısı</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {lowStockProducts.length} Parça
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> Sipariş eşiği aşıldı
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-105 transition-transform">
                <Package size={22} />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Receivables & Invoices Card */}
        <Link href="/invoices" className="group">
          <Card className="hover:border-emerald-500/40 transition-all cursor-pointer h-full">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bekleyen Alacak</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {totalReceivables.toLocaleString("tr-TR")} ₺
                </p>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1 font-medium">
                  <TrendingUp size={12} /> {openInvoicesCount} açık fatura
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Receipt size={22} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Launch & Active Work Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Vehicles in Workshop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Lifte Olan ve İşlem Gören Araçlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atölyedeki anlık teknisyen atamaları ve işlemler
              </p>
            </div>
            <Link
              href="/work-orders"
              className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Atölye Panosuna Git</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {workOrders.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">Kayıtlı aktif iş emri bulunamadı.</p>
            ) : (
              workOrders.slice(0, 4).map((wo) => (
                <Link key={wo.id} href={`/work-orders/${wo.id}`} className="block group">
                  <Card className="hover:border-sky-500/40 transition-all p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Car size={20} className="text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <PlateBadge plate={wo.plate} size="xs" />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {wo.brand} {wo.model} ({wo.year})
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {wo.services.map((s) => s.name).join(", ") || "Genel Bakım ve Kontrol"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Müşteri: <strong className="text-slate-700 dark:text-slate-300">{wo.customerName}</strong> • Usta: {wo.assignedMechanicName || "Belirlenmedi"} ({wo.assignedLift || "Lift-"})
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        <WorkOrderStatusBadge status={wo.status} />
                        <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {wo.grandTotal.toLocaleString("tr-TR")} ₺
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Module Navigation */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Hızlı Modül Kısayolları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sık kullanılan operasyonel menüler
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              {
                title: "Müşteri ve Araç Yönetimi",
                desc: "Kayıtlı müşteriler, plakalar ve servis geçmişi",
                href: "/customers",
                icon: Users,
                color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
              },
              {
                title: "Randevu Takvimi",
                desc: "Haftalık ve günlük servis slotları",
                href: "/appointments",
                icon: Calendar,
                color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
              },
              {
                title: "Atölye & İş Emirleri Panosu",
                desc: "Lifte araçlar, usta notları ve fotoğraflar",
                href: "/work-orders",
                icon: Wrench,
                color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "Yedek Parça & Envanter",
                desc: "Stok durumu, kritik stok uyarıları ve hareketler",
                href: "/inventory",
                icon: Package,
                color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
              },
              {
                title: "Fatura ve Günlük Kasa",
                desc: "Kesilen faturalar, nakit/pos kasa ve tahsilatlar",
                href: "/invoices",
                icon: Receipt,
                color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
              },
            ].map((mod) => (
              <Link key={mod.href} href={mod.href} className="group cursor-pointer">
                <Card className="p-3.5 hover:border-sky-500/40 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mod.color}`}>
                      <mod.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                        {mod.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
