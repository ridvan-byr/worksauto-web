import React from "react"

/**
 * Audit log entity name translator
 */
export function formatEntityName(entityName: string | undefined): string {
  if (!entityName) return "Kayıt"
  switch (entityName.toLowerCase()) {
    case "workorder":
    case "work_order":
      return "İş Emri"
    case "appointment":
      return "Randevu"
    case "invoice":
      return "Fatura"
    case "payment":
      return "Tahsilat / Ödeme"
    case "service":
      return "Hizmet"
    case "staff":
      return "Personel"
    case "customer":
      return "Müşteri"
    case "vehicle":
      return "Araç"
    case "inventory":
    case "stockitem":
    case "stock_item":
      return "Stok Parça"
    case "tenant":
      return "İşletme"
    default:
      return entityName
  }
}

/**
 * Status translations (Work Order, Appointment, Invoice, Service)
 */
export function formatStatus(status: string | undefined): string {
  if (!status) return ""
  const upper = status.toUpperCase()
  switch (upper) {
    // Work Orders
    case "QUEUE":
      return "Sırada / Kabul Edildi"
    case "IN_PROGRESS":
      return "İşlemde"
    case "COMPLETED":
      return "Tamamlandı"
    case "CANCELLED":
      return "İptal Edildi"

    // Appointments
    case "PENDING":
      return "Onay Bekliyor"
    case "CONFIRMED":
      return "Onaylandı"
    case "NO_SHOW":
      return "Randevuya Gelmedi"

    // Invoices
    case "DRAFT":
      return "Taslak"
    case "ISSUED":
      return "Kesildi"
    case "PAID":
      return "Ödendi"
    case "PARTIALLY_PAID":
      return "Kısmi Ödendi"

    // General States
    case "ACTIVE":
      return "Aktif"
    case "INACTIVE":
      return "Pasif"
    case "SUSPENDED":
      return "Askıya Alındı"
    default:
      return status
  }
}

/**
 * Payment method translations
 */
export function formatPaymentMethod(method: string | undefined): string {
  if (!method) return "Nakit"
  const upper = method.toUpperCase()
  switch (upper) {
    case "CASH":
    case "NAKIT":
    case "NAKİT":
      return "Nakit"
    case "CREDIT_CARD":
    case "KREDI_KARTI":
    case "KREDİ_KARTI":
      return "Kredi Kartı"
    case "BANK_TRANSFER":
    case "HAVALE":
    case "EFT":
    case "HAVALE_EFT":
      return "Havale / EFT"
    default:
      return method
  }
}

/**
 * Staff and User role translations
 */
export function formatRole(role: string | undefined): string {
  if (!role) return "Personel"
  switch (role.toUpperCase()) {
    case "OWNER":
      return "Servis Sahibi"
    case "SERVICE_MANAGER":
      return "Servis Yöneticisi"
    case "TECHNICIAN":
      return "Atölye Ustası"
    case "CASHIER":
      return "Kasa & Muhasebe"
    case "TENANT_ADMIN":
      return "İşletme Yöneticisi"
    case "SUPER_ADMIN":
      return "Platform Yöneticisi"
    default:
      return role
  }
}

/**
 * Reason and explanation translator
 */
export function formatReason(reason: string | undefined): string {
  if (!reason) return ""
  if (reason.startsWith("Appointment cancelled:")) {
    const detail = reason.replace("Appointment cancelled:", "").trim()
    return `Randevu iptali nedeniyle: ${detail || "İş emri sonlandırıldı"}`
  }
  return reason
}

/**
 * Standard client IP formatter
 */
export function formatClientIp(ip: string | undefined | null): string {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    return "127.0.0.1 (Yerel)"
  }
  return ip
}

/**
 * Action badge rendering with corporate, harmonious color coding
 */
export function getActionBadge(action: string): React.ReactNode {
  const key = (action || "").toLowerCase().trim()

  switch (key) {
    // Work Orders
    case "work_order.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Yeni İş Emri</span>
        </span>
      )
    case "work_order.status_changed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Aşama Değişti</span>
        </span>
      )
    case "work_order.completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>İş Emri Tamamlandı</span>
        </span>
      )
    case "work_order.auto_cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>İş Emri İptal Edildi</span>
        </span>
      )
    case "work_order.item_added":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          <span>Kalem / Parça Eklendi</span>
        </span>
      )
    case "work_order.item_removed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Kalem / Parça Silindi</span>
        </span>
      )
    case "work_order.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>İş Emri Silindi</span>
        </span>
      )

    // Invoices & Payments
    case "invoice.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Fatura Kesildi</span>
        </span>
      )
    case "invoice.auto_created_on_wo_complete":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Otomatik Fatura Kesildi</span>
        </span>
      )
    case "invoice.cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Fatura İptal Edildi</span>
        </span>
      )
    case "payment.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          <span>Tahsilat Alındı</span>
        </span>
      )
    case "payment.cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Tahsilat İptal Edildi</span>
        </span>
      )

    // Appointments
    case "appointment.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
          <span>Randevu Oluşturuldu</span>
        </span>
      )
    case "appointment.status_changed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <span>Randevu Güncellendi</span>
        </span>
      )
    case "appointment.cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Randevu İptali</span>
        </span>
      )
    case "appointment.no_show":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Randevuya Gelmedi</span>
        </span>
      )
    case "appointment.converted_to_wo":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>İş Emrine Dönüştü</span>
        </span>
      )

    // Staff
    case "staff.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span>Yeni Personel Kaydı</span>
        </span>
      )
    case "staff.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <span>Personel Güncellendi</span>
        </span>
      )
    case "staff.deactivated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Personel Pasife Alındı</span>
        </span>
      )
    case "staff.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Personel Silindi</span>
        </span>
      )

    // Services
    case "service.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Hizmet Eklendi</span>
        </span>
      )
    case "service.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span>Hizmet Güncellendi</span>
        </span>
      )
    case "service.deactivated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Hizmet Pasife Alındı</span>
        </span>
      )
    case "service.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Hizmet Silindi</span>
        </span>
      )

    // Customers
    case "customer.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Yeni Müşteri Kaydı</span>
        </span>
      )
    case "customer.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <span>Müşteri Güncellendi</span>
        </span>
      )
    case "customer.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Müşteri Silindi</span>
        </span>
      )

    // Vehicles
    case "vehicle.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Yeni Araç Tanımlandı</span>
        </span>
      )
    case "vehicle.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <span>Araç Güncellendi</span>
        </span>
      )
    case "vehicle.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Araç Silindi</span>
        </span>
      )

    // Inventory & Stock
    case "inventory.created":
    case "inventory.item_created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Stok Kartı Oluşturuldu</span>
        </span>
      )
    case "inventory.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span>Stok Kartı Güncellendi</span>
        </span>
      )
    case "inventory.movement":
    case "inventory.stock_in":
    case "stock.movement_added":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          <span>Stok Hareketi / Giriş</span>
        </span>
      )
    case "inventory.stock_out":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Stok Çıkışı / Sarfiyat</span>
        </span>
      )

    // Tenant / Organization
    case "tenant.updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
          <span>İşletme Bilgileri Güncellendi</span>
        </span>
      )

    default: {
      const translated = smartTranslateAction(action)
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <span>{translated}</span>
        </span>
      )
    }
  }
}

/**
 * Smart Turkish Fallback for unknown action strings
 */
function smartTranslateAction(action: string): string {
  if (!action) return "İşlem Gerçekleşti"

  const normalized = action.toLowerCase().replace(/_/g, " ").replace(/\./g, " ")

  if (normalized.includes("create") || normalized.includes("add")) {
    return "Yeni Kayıt Eklendi"
  }
  if (normalized.includes("update") || normalized.includes("change") || normalized.includes("edit")) {
    return "Kayıt Güncellendi"
  }
  if (normalized.includes("delete") || normalized.includes("remove")) {
    return "Kayıt Silindi"
  }
  if (normalized.includes("cancel")) {
    return "İşlem İptal Edildi"
  }
  if (normalized.includes("deactivate") || normalized.includes("disable")) {
    return "Pasife Alındı"
  }
  if (normalized.includes("activate") || normalized.includes("enable")) {
    return "Aktifleştirildi"
  }
  if (normalized.includes("complete") || normalized.includes("finish")) {
    return "Tamamlandı"
  }

  return action.replace(/_/g, " ").replace(/\./g, " › ")
}

/**
 * Descriptive Turkish action title
 */
export function getActionTitle(action: string | undefined): string {
  if (!action) return "İşlem Denetim Kaydı"
  switch (action) {
    case "work_order.created":
      return "Yeni Araç Kabul ve İş Emri Açıldı"
    case "work_order.status_changed":
      return "İş Emri Süreç / Aşama Değişikliği"
    case "work_order.completed":
      return "İş Emri Başarıyla Tamamlandı"
    case "work_order.auto_cancelled":
      return "Randevu İptali Nedeniyle İş Emri İptal Edildi"
    case "work_order.item_added":
      return "İş Emrine Yeni Parça / İşçilik Kalemi Eklendi"
    case "work_order.item_removed":
      return "İş Emrinden Parça / İşçilik Kalemi Silindi"
    case "work_order.deleted":
      return "İş Emri Sistemden Silindi"

    case "invoice.created":
      return "Servis Faturası Düzenlendi"
    case "invoice.auto_created_on_wo_complete":
      return "İş Emri Tamamlanması Sonrası Otomatik Fatura Kesildi"
    case "invoice.cancelled":
      return "Düzenlenen Fatura İptal Edildi"

    case "payment.created":
      return "Tahsilat / Ödeme Kaydı Alındı"
    case "payment.cancelled":
      return "Alınan Tahsilat İptal Edildi"

    case "appointment.created":
      return "Yeni Servis Randevusu Oluşturuldu"
    case "appointment.status_changed":
      return "Randevu Durumu Güncellendi"
    case "appointment.cancelled":
      return "Servis Randevusu İptal Edildi"
    case "appointment.no_show":
      return "Müşteri Randevu Vaktinde Gelmedi (No-Show)"
    case "appointment.converted_to_wo":
      return "Randevu İş Emrine Dönüştürüldü"

    case "staff.created":
      return "Yeni Personel Hesabı Oluşturuldu"
    case "staff.updated":
      return "Personel Bilgileri / Yetkileri Güncellendi"
    case "staff.deactivated":
      return "Personel Hesabı Pasife Alındı"
    case "staff.deleted":
      return "Personel Hesabı Silindi"

    case "service.created":
      return "Yeni Hizmet Tanımlandı"
    case "service.updated":
      return "Hizmet Bilgileri Güncellendi"
    case "service.deactivated":
      return "Hizmet Pasife Alındı"
    case "service.deleted":
      return "Hizmet Kataloğundan Silindi"

    case "customer.created":
      return "Yeni Müşteri Kaydı Açıldı"
    case "customer.updated":
      return "Müşteri Bilgileri Güncellendi"
    case "customer.deleted":
      return "Müşteri Kaydı Silindi"

    case "vehicle.created":
      return "Yeni Araç Kaydı Tanımlandı"
    case "vehicle.updated":
      return "Araç Bilgileri Güncellendi"
    case "vehicle.deleted":
      return "Araç Kaydı Silindi"

    case "inventory.created":
    case "inventory.item_created":
      return "Yeni Stok Kartı Açıldı"
    case "inventory.updated":
      return "Stok Kartı Bilgileri Güncellendi"
    case "inventory.movement":
    case "inventory.stock_in":
    case "stock.movement_added":
      return "Stok Girişi / Hareketi İşlendi"
    case "inventory.stock_out":
      return "Stok Çıkışı / Sarfiyat Yapıldı"

    case "tenant.updated":
      return "İşletme Bilgileri Güncellendi"

    default:
      return smartTranslateAction(action)
  }
}

