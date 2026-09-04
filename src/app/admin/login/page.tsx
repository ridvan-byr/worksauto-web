"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BrandLogo } from "@/components/shared/brand-logo"
import { toast } from "@/components/ui/sonner"
import { useAdminLogin, setAdminSession, getAdminToken, getAdminUser } from "@/features/admin/api/use-admin"

export default function AdminLoginPage() {
  const router = useRouter()
  const adminLoginMutation = useAdminLogin()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // If already authenticated as admin, redirect to /admin
  React.useEffect(() => {
    const token = getAdminToken()
    const user = getAdminUser()
    if (token && user && user.role === "SUPER_ADMIN") {
      router.replace("/admin")
    }
  }, [router])

  const handleFillDemo = () => {
    setEmail("admin@worksauto.com")
    setPassword("WorksAuto2026!*")
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email || !password) {
      const msg = "Lütfen kurumsal e-posta ve şifrenizi giriniz."
      setErrorMsg(msg)
      toast.warning(msg)
      return
    }

    try {
      const res = await adminLoginMutation.mutateAsync({ email, password })
      if (res.success && res.accessToken) {
        setAdminSession(res.accessToken, res.user)
        toast.success("Platform konsoluna güvenli bağlantı sağlandı.", {
          description: `Hoş geldiniz, ${res.user?.name || "Yönetici"}.`,
        })
        router.replace("/admin")
      } else {
        const msg = "Giriş yapılamadı. Bilgilerinizi kontrol ediniz."
        setErrorMsg(msg)
        toast.error(msg)
      }
    } catch (err: any) {
      const msg = err.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz."
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-sky-500 selection:text-white transition-colors">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl backdrop-blur-xl">
            <BrandLogo clickable={false} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            WorksAuto Süper Yönetim Konsolu
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Kurumsal SaaS kiracı (Tenant) lisanslama, platform metrikleri ve sistem güvenliği giriş kapısı.
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0e1524]/90 backdrop-blur-2xl shadow-2xl">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-200">
              Yönetici Kimlik Doğrulaması
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Devam etmek için yetkili platform bilgilerinizi giriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs animate-in fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>Kurumsal E-Posta</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@worksauto.com"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  <span>Yönetici Parolası</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={adminLoginMutation.isPending}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs gap-2 shadow-lg shadow-sky-500/25 cursor-pointer transition-all"
              >
                <span>{adminLoginMutation.isPending ? "Kimlik Doğrulanıyor..." : "Yönetim Konsoluna Bağlan"}</span>
                <ArrowRight size={14} />
              </Button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles size={12} className="text-amber-500" />
                <span>Kurucu Super Admin Bilgilerini Doldur (admin@worksauto.com)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Footer */}
        <p className="text-center text-[11px] text-slate-500">
          Bu alan yetkisiz erişim girişimlerine karşı 256-bit TLS ve IP bazlı audit logging ile izlenmektedir.
        </p>
      </div>
    </div>
  )
}
