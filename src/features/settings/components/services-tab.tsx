"use client"

import * as React from "react"
import { Wrench, Plus, Clock, Pencil, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatServiceCategory } from "@/lib/workshop-constants"
import { ServiceRecord, CreateServiceInput, UpdateServiceInput } from "@/features/settings/api/use-settings"
import { ServiceModal } from "./service-modal"
import { ServiceDeleteModal } from "./service-delete-modal"

interface ServicesTabProps {
  services: ServiceRecord[]
  deletedServiceIds: string[]
  onCreateService: (data: CreateServiceInput) => Promise<void>
  onUpdateService: (id: string, data: UpdateServiceInput) => Promise<void>
  onDeleteService: (id: string) => Promise<void>
  onReactivateService: (service: ServiceRecord) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function ServicesTab({
  services,
  deletedServiceIds,
  onCreateService,
  onUpdateService,
  onDeleteService,
  onReactivateService,
  isCreating,
  isUpdating,
  isDeleting,
}: ServicesTabProps) {
  const [serviceView, setServiceView] = React.useState<"active" | "all">("active")
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false)
  const [editingService, setEditingService] = React.useState<ServiceRecord | null>(null)
  const [deletingService, setDeletingService] = React.useState<ServiceRecord | null>(null)

  const activeServices = React.useMemo(() => {
    return (services || []).filter(
      (srv: ServiceRecord) => srv.isActive !== false && !deletedServiceIds.includes(srv.id)
    )
  }, [services, deletedServiceIds])

  const displayedServices = React.useMemo(() => {
    if (serviceView === "active") return activeServices
    return (services || []).filter((s: ServiceRecord) => !deletedServiceIds.includes(s.id))
  }, [services, activeServices, serviceView, deletedServiceIds])

  const handleCreate = async (data: {
    name: string
    category: string
    basePrice: number
    duration: number
    isActive?: boolean
  }) => {
    await onCreateService({
      name: data.name,
      category: data.category,
      basePrice: data.basePrice,
      estimatedMinutes: data.duration,
      isActive: data.isActive,
    })
    setIsNewModalOpen(false)
  }

  const handleUpdate = async (data: {
    name: string
    category: string
    basePrice: number
    duration: number
    isActive?: boolean
  }) => {
    if (!editingService) return
    await onUpdateService(editingService.id, {
      name: data.name,
      category: data.category,
      basePrice: data.basePrice,
      defaultDurationMin: data.duration,
      isActive: data.isActive,
    })
    setEditingService(null)
  }

  const handleDelete = async () => {
    if (!deletingService) return
    const id = deletingService.id
    setDeletingService(null)
    await onDeleteService(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Kayıtlı Standart Hizmetler & İşçilikler
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            İş emirlerinde ve randevu formlarında seçilebilecek hazır işçilik tanımları
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setServiceView("active")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                serviceView === "active"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Aktif ({activeServices.length})
            </button>
            <button
              type="button"
              onClick={() => setServiceView("all")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                serviceView === "all"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Tümü ({(services || []).length - deletedServiceIds.length})
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="gap-1.5 cursor-pointer shadow-sky-500/25"
          >
            <Plus size={15} />
            <span>Yeni Hizmet Ekle</span>
          </Button>
        </div>
      </div>

      {displayedServices.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <Wrench size={32} className="mx-auto text-slate-400 opacity-50" />
          <p className="text-xs font-semibold text-slate-500">
            {serviceView === "active"
              ? "Kayıtlı aktif hizmet bulunamadı. Yeni bir hizmet tanımlayabilirsiniz."
              : "Gösterilebilecek hizmet kaydı bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedServices.map((srv: ServiceRecord) => {
            const isActive = srv.isActive !== false && !deletedServiceIds.includes(srv.id)
            return (
              <Card key={srv.id} className="hover:border-sky-500/30 transition-all group">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {srv.name}
                      </h3>
                      <div className="mt-1 flex items-center">
                        {(() => {
                          const cat = formatServiceCategory(srv.category)
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${cat.badgeClass}`}>
                              {cat.icon && <span>{cat.icon}</span>}
                              <span>{cat.label}</span>
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      }`}
                    >
                      {isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock size={12} />
                      <span>{srv.defaultDurationMin || srv.estimatedMinutes || 60} Dk</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {Number(srv.basePrice || 0).toLocaleString("tr-TR")} ₺
                    </div>
                  </div>

                  {/* Actions: Edit & Delete / Reactivate */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingService(srv)}
                      className="h-7 px-2 text-[11px] text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 gap-1 cursor-pointer"
                    >
                      <Pencil size={12} />
                      <span>Düzenle</span>
                    </Button>
                    {isActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingService(srv)}
                        className="h-7 px-2 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Kaldır</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onReactivateService(srv)}
                        className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Aktifleştir</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      <ServiceModal
        isOpen={!!editingService}
        editingService={editingService}
        onClose={() => setEditingService(null)}
        onSubmit={handleUpdate}
        isPending={isUpdating}
      />

      <ServiceDeleteModal
        service={deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  )
}
