"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminTenantDetail } from "@/features/admin/api/use-admin"

interface TenantDetailModalProps {
  tenantId: string | null
  tenantDetail: AdminTenantDetail | null | undefined
  isLoading: boolean
  onClose: () => void
  onDelete: (tenant: { id: string; title: string }) => void
}

export function TenantDetailModal({
  tenantId,
  tenantDetail,
  isLoading,
  onClose,
  onDelete,
}: TenantDetailModalProps) {
  if (!tenantId || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tenantDetail?.title || "Servis Detayı"}
              </h3>
              {tenantDetail && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    tenantDetail.isActive
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {tenantDetail.isActive ? "Aktif Lisans" : "Onay Bekliyor / Askıda"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tenantDetail?.legalName || "Ticari ünvan girilmemiş"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors shrink-0"
            title="Pencereyi Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-mono">
            Servis detayları yükleniyor...
          </div>
        ) : tenantDetail ? (
          <div className="space-y-6">
            {/* 4 Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Kayıtlı Usta</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {tenantDetail.users?.length ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">İş Emri</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {tenantDetail._count?.workOrders ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Müşteri</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {tenantDetail._count?.customers ?? 0}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Araç</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {tenantDetail._count?.vehicles ?? 0}
                </p>
              </div>
            </div>

            {/* Contact & Tax Info */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-300">İletişim & Vergi Bilgileri</h4>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                <p><strong>Telefon:</strong> {tenantDetail.phone || "-"}</p>
                <p><strong>E-Posta:</strong> {tenantDetail.email || "-"}</p>
                <p><strong>Adres:</strong> {tenantDetail.address || "-"} ({tenantDetail.city} / {tenantDetail.district})</p>
                <p><strong>Vergi Dairesi & No:</strong> {tenantDetail.taxOffice || "-"} / {tenantDetail.taxNumber || "-"}</p>
              </div>
            </div>

            {/* Staff List */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-300">Kayıtlı Servis Personelleri</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(tenantDetail.users || []).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {u.name} {u.surname}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.phone}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Delete Button on Left, Close on Right */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  onDelete({ id: tenantDetail.id, title: tenantDetail.title })
                }}
                className="border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Servisi Sil</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={onClose}
                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Kapat
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
