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

const CANCELLATION_REASON_MAP: Record<string, string> = {
  CUSTOMER_REQUEST: "Müşteri randevuyu iptal etti / vazgeçti",
  PARTS_UNAVAILABLE: "Gerekli yedek parça temin edilemedi",
  CAPACITY_FULL: "Servis atölye lift kapasitesi dolu",
  PRICE_DISAGREEMENT: "Fiyat konusunda anlaşılamadı",
  NO_SHOW: "Randevuya gelinmedi (No-Show)",
  OTHER: "Diğer gerekçe",
}

/**
 * Reason and explanation translator
 */
export function formatReason(reason: string | undefined): string {
  if (!reason) return ""
  if (reason.startsWith("Appointment cancelled:")) {
    const rawDetail = reason.replace("Appointment cancelled:", "").trim()
    const detail = CANCELLATION_REASON_MAP[rawDetail] || rawDetail
    return `Randevu iptali nedeniyle: ${detail || "İş emri sonlandırıldı"}`
  }
  return CANCELLATION_REASON_MAP[reason] || reason
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
    case "work_order.item_quantity_updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span>Parça Adedi Güncellendi</span>
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
    case "appointment.approved":
    case "appointment.confirmed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Randevu Onaylandı</span>
        </span>
      )
    case "appointment.rescheduled":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
          <span>Randevu Ertelendi</span>
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
    case "staff.lift_changed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Lift Ataması Değiştirildi</span>
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
    case "tenant_created":
    case "tenant.created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Yeni Servis Eklendi</span>
        </span>
      )
    case "tenant_deleted":
    case "tenant.deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Servis Silindi</span>
        </span>
      )
    case "tenant_activated":
    case "tenant.activated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Lisans Onaylandı</span>
        </span>
      )
    case "tenant_suspended":
    case "tenant.suspended":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Servis Askıya Alındı</span>
        </span>
      )

    // Platform Superadmin & Security
    case "security_superadmin_activated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Yönetici Aktifleştirildi</span>
        </span>
      )
    case "security_superadmin_suspended":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span>Yönetici Askıya Alındı</span>
        </span>
      )
    case "security_superadmin_created":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Yeni Yönetici Açıldı</span>
        </span>
      )
    case "security_superadmin_deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Yönetici Silindi</span>
        </span>
      )
    case "security_login_success":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>Giriş Başarılı</span>
        </span>
      )
    case "security_login_failed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Hatalı Giriş</span>
        </span>
      )

    // Work Order Notes
    case "add_work_order_note":
    case "work_order.note_added":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          <span>Not Eklendi</span>
        </span>
      )
    case "update_work_order_note":
    case "work_order.note_updated":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
          <span>Not Güncellendi</span>
        </span>
      )
    case "delete_work_order_note":
    case "work_order.note_deleted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span>Not Silindi</span>
        </span>
      )

    // Customer KVKK & Consent
    case "customer.kvkk_consent_granted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span>KVKK Onayı Verildi</span>
        </span>
      )
    case "customer.consent_sms_sent":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <span>Onay SMS Gönderildi</span>
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

  if (normalized.includes("superadmin") || normalized.includes("super admin")) {
    if (normalized.includes("activat")) return "Yönetici Aktifleştirildi"
    if (normalized.includes("suspend")) return "Yönetici Askıya Alındı"
    if (normalized.includes("delet") || normalized.includes("remov")) return "Yönetici Silindi"
    if (normalized.includes("creat") || normalized.includes("add")) return "Yeni Yönetici Eklendi"
    return "Yönetici Güvenlik İşlemi"
  }

  if (normalized.includes("login")) {
    if (normalized.includes("fail")) return "Hatalı Giriş Denemesi"
    if (normalized.includes("success")) return "Başarılı Giriş"
    return "Oturum İşlemi"
  }

  if (normalized.includes("lift")) {
    return "Lift Ataması Değiştirildi"
  }
  if (normalized.includes("item quantity") || normalized.includes("quantity")) {
    return "Parça Adedi Güncellendi"
  }
  if (normalized.includes("note")) {
    if (normalized.includes("add") || normalized.includes("create")) return "Not Eklendi"
    if (normalized.includes("updat") || normalized.includes("edit")) return "Not Güncellendi"
    if (normalized.includes("delet") || normalized.includes("remov")) return "Not Silindi"
    return "Not İşlemi"
  }
  if (normalized.includes("reschedul")) {
    return "Randevu Ertelendi"
  }
  if (normalized.includes("approv") || normalized.includes("confirm")) {
    return "Randevu Onaylandı"
  }
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

  const turkishTerms: Record<string, string> = {
    appointment: "Randevu",
    work_order: "İş Emri",
    invoice: "Fatura",
    payment: "Tahsilat",
    customer: "Müşteri",
    vehicle: "Araç",
    service: "Hizmet",
    staff: "Personel",
    inventory: "Stok",
    tenant: "İşletme",
    security: "Güvenlik",
    approved: "Onaylandı",
    created: "Oluşturuldu",
    updated: "Güncellendi",
    deleted: "Silindi",
    cancelled: "İptal Edildi",
    suspended: "Askıya Alındı",
    activated: "Aktifleştirildi",
  }

  const parts = action.toLowerCase().split(/[._\s]+/)
  const translatedParts = parts.map((p) => turkishTerms[p] || p)
  return translatedParts.join(" ")
}

/**
 * Descriptive Turkish action title
 */
export function getActionTitle(action: string | undefined): string {
  if (!action) return "İşlem Denetim Kaydı"
  const normalizedKey = action.toLowerCase().trim()

  switch (normalizedKey) {
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
    case "work_order.item_quantity_updated":
      return "İş Emrinde Parça / Kalem Adedi Güncellendi"
    case "work_order.deleted":
      return "İş Emri Sistemden Silindi"

    case "add_work_order_note":
    case "work_order.note_added":
      return "İş Emrine Teknisyen Notu Eklendi"
    case "update_work_order_note":
    case "work_order.note_updated":
      return "İş Emrindeki Teknisyen Notu Güncellendi"
    case "delete_work_order_note":
    case "work_order.note_deleted":
      return "İş Emrindeki Teknisyen Notu Silindi"

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
    case "appointment.approved":
    case "appointment.confirmed":
      return "Servis Randevusu Onaylandı"
    case "appointment.rescheduled":
      return "Servis Randevusu Tarih/Saati Güncellendi"
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
    case "staff.lift_changed":
      return "Personele Atanan Lift Değiştirildi"
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
    case "customer.kvkk_consent_granted":
      return "Müşteri KVKK ve İletişim İzni Onaylandı"
    case "customer.consent_sms_sent":
      return "Müşteriye KVKK Onay SMS'i Gönderildi"

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
    case "tenant_created":
    case "tenant.created":
      return "Yeni Servis (İşletme) Kaydı Açıldı"
    case "tenant_deleted":
    case "tenant.deleted":
      return "Servis Kaydı ve Verileri Silindi"
    case "tenant_activated":
    case "tenant.activated":
      return "Servis Lisansı Onaylandı ve Aktifleştirildi"
    case "tenant_suspended":
    case "tenant.suspended":
      return "Servis Hesabı Donduruldu / Askıya Alındı"

    case "security_superadmin_activated":
      return "Platform Yöneticisi Hesabı Aktifleştirildi"
    case "security_superadmin_suspended":
      return "Platform Yöneticisi Hesabı Askıya Alındı"
    case "security_superadmin_created":
      return "Yeni Platform Yöneticisi (Super Admin) Oluşturuldu"
    case "security_superadmin_deleted":
      return "Platform Yöneticisi Hesabı Silindi"
    case "security_login_success":
      return "Platform Girişi Başarılı"
    case "security_login_failed":
      return "Yetkisiz veya Hatalı Giriş Denemesi"

    default:
      return smartTranslateAction(action)
  }
}

