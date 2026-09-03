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
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Banner - Fully Adaptive to Light & Dark Theme */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border transition-all duration-300 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-100/80 border-sky-100 shadow-sm dark:from-slate-900 dark:via-[#0d1627] dark:to-slate-900 dark:border-slate-800/80 dark:shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-sky-400/15 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:bg-sky-500/15 dark:border-sky-500/30 dark:text-sky-400 text-xs font-semibold">
              <Sparkles size={13} className="animate-spin text-sky-500 dark:text-sky-400" />
              <span>WorksAuto v1.0.0 (MVP) Aktif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hoş Geldiniz, Yıldız Oto Servis 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Atölye doluluk oranı %75. Bugün bekleyen 5 randevu ve işlemde olan 8 araç bulunuyor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/onboarding">
              <Button
                variant="outline"
                className="text-xs h-10 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Onboarding Sihirbazı</span>
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

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bugünkü Randevular</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">8 Randevu</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 size={12} /> 3 tanesi onay bekliyor
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Calendar size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Atölye (Lifte Araçlar)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">8 İş Emri</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <Clock size={12} /> 2 araç teslimata hazır
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Wrench size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kritik Stok Uyarısı</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">4 Parça</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> Sipariş verilmeli
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Package size={22} />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bekleyen Tahsilat</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">24.500 ₺</p>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1 font-medium">
                <TrendingUp size={12} /> 5 açık fatura
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Receipt size={22} />
            </div>
          </CardContent>
        </Card>
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
                Anlık usta atamaları ve işlem durumu
              </p>
            </div>
            <Link href="/work-orders" className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer">
              <span>Tümünü Gör</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                plate: "34 VUR 58",
                car: "2021 Renault Megane 1.5 dCi",
                customer: "Ahmet Yılmaz",
                service: "Periyodik Bakım + Yağ & Filtre Değişimi",
                mechanic: "Mustafa Usta",
                status: "İşlemde",
                statusVariant: "warning",
                time: "14:30 Tahmini Teslim",
              },
              {
                plate: "06 ABC 99",
                car: "2019 Volkswagen Golf 1.6 TDI",
                customer: "Mehmet Demir",
                service: "Ön Fren Disk & Balata Değişimi",
                mechanic: "Ali Usta",
                status: "Parça Bekliyor",
                statusVariant: "destructive",
                time: "16:00 Tahmini Teslim",
              },
              {
                plate: "35 EGE 35",
                car: "2022 Toyota Corolla 1.8 Hybrid",
                customer: "Ayşe Kaya",
                service: "Klima Gazı Dolumu & Genel Kontrol",
                mechanic: "Hakan Usta",
                status: "Tamamlandı",
                statusVariant: "success",
                time: "Teslimata Hazır",
              },
            ].map((wo) => (
              <Card key={wo.plate} className="hover:border-slate-300 dark:hover:border-slate-700 transition-all p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Car size={20} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                          {wo.plate}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {wo.car}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-1">
                        {wo.service}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Müşteri: {wo.customer} • Usta: {wo.mechanic}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <Badge variant={wo.statusVariant as any}>
                      {wo.status}
                    </Badge>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {wo.time}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
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
                title: "Fatura ve Cari Tahsilat",
                desc: "Kesilen faturalar, kasa ve müşteri bakiyeleri",
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
