import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Minimalist Large 404 */}
        <div className="space-y-2">
          <p className="text-8xl font-light tracking-tighter text-slate-300 dark:text-slate-800 select-none">
            404
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Sayfa bulunamadı
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            İstediğiniz bağlantı mevcut değil, henüz oluşturulmamış veya taşınmış olabilir.
          </p>
        </div>

        {/* Single Refined Action */}
        <div className="pt-2 flex items-center justify-center">
          <Link href="/">
            <Button
              variant="outline"
              className="h-10 px-5 gap-2 text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={14} className="text-slate-500" />
              <span>Ana Sayfaya Dön</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
