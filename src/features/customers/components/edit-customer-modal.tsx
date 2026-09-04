"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  UserCheck,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Customer } from "../types"
import { useUpdateCustomer } from "../api/use-customers"
import { cn } from "@/lib/utils"

interface EditCustomerModalProps {
  isOpen: boolean
  customer: Customer
  onClose: () => void
  onUpdated: (updatedCustomer: Partial<Customer>) => void
}

export function EditCustomerModal({
  isOpen,
  customer,
  onClose,
  onUpdated,
}: EditCustomerModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [customerType, setCustomerType] = React.useState<"individual" | "corporate">(
    customer.type || "individual"
  )
  const [firstName, setFirstName] = React.useState(customer.name || "")
  const [lastName, setLastName] = React.useState(customer.surname || "")
  const [companyTitle, setCompanyTitle] = React.useState(customer.companyTitle || "")
  const [taxOffice, setTaxOffice] = React.useState(customer.taxOffice || "")
  const [taxNumber, setTaxNumber] = React.useState(customer.taxNumber || "")
  const [phone, setPhone] = React.useState(customer.phone || "")
  const [email, setEmail] = React.useState(customer.email || "")
  const [city, setCity] = React.useState(customer.city || "İstanbul")
  const [district, setDistrict] = React.useState(customer.district || "")
  const [address, setAddress] = React.useState(customer.address || "")
  const [notes, setNotes] = React.useState(customer.notes || "")

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const updateCustomerMutation = useUpdateCustomer()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Sync state when customer changes
  React.useEffect(() => {
    if (customer) {
      setCustomerType(customer.type || "individual")
      setFirstName(customer.name || "")
      setLastName(customer.surname || "")
      setCompanyTitle(customer.companyTitle || "")
      setTaxOffice(customer.taxOffice || "")
      setTaxNumber(customer.taxNumber || "")
      setPhone(customer.phone || "")
      setEmail(customer.email || "")
      setCity(customer.city || "İstanbul")
      setDistrict(customer.district || "")
      setAddress(customer.address || "")
      setNotes(customer.notes || "")
    }
  }, [customer])

  // Lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  // Phone Formatter
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (raw.length === 0) {
      setPhone("")
      return
    }
    let formatted = raw.startsWith("0") ? raw.slice(0, 11) : "0" + raw.slice(0, 10)
    let res = "0"
    if (formatted.length > 1) res += " (" + formatted.slice(1, 4)
    if (formatted.length >= 4) res += ") " + formatted.slice(4, 7)
    if (formatted.length >= 7) res += " " + formatted.slice(7, 9)
    if (formatted.length >= 9) res += " " + formatted.slice(9, 11)
    setPhone(res)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}

    if (customerType === "individual") {
      if (!firstName.trim()) errs.firstName = "Ad zorunludur."
      if (!lastName.trim()) errs.lastName = "Soyad zorunludur."
    } else {
      if (!companyTitle.trim()) errs.companyTitle = "Şirket ünvanı zorunludur."
      if (!firstName.trim()) errs.firstName = "Yetkili adı zorunludur."
      if (!taxNumber.trim() || taxNumber.trim().length < 10) {
        errs.taxNumber = "Kurumsal müşteriler için 10 haneli Vergi Numarası zorunludur."
      }
    }

    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      errs.phone = "Geçerli bir telefon numarası giriniz."
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: {
          type: customerType === "corporate" ? "CORPORATE" : "INDIVIDUAL",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyTitle: customerType === "corporate" ? companyTitle.trim() : undefined,
          taxOffice: customerType === "corporate" ? taxOffice.trim() : undefined,
          taxNumber: customerType === "corporate" ? taxNumber.trim() : undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      })

      onUpdated({
        type: customerType,
        name: firstName.trim(),
        surname: lastName.trim(),
        companyTitle: customerType === "corporate" ? companyTitle.trim() : undefined,
        taxOffice: customerType === "corporate" ? taxOffice.trim() : undefined,
        taxNumber: customerType === "corporate" ? taxNumber.trim() : undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        city,
        district: district.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      onClose()
    } catch {
      // Toast handled by mutation
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Müşteri Bilgilerini Düzenle
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                İletişim, fatura ve unvan bilgilerini güncelleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setCustomerType("individual")}
              className={cn(
                "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                customerType === "individual"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <User size={15} />
              <span>Bireysel Müşteri</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerType("corporate")}
              className={cn(
                "py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer",
                customerType === "corporate"
                  ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <Building2 size={15} />
              <span>Kurumsal & Filo</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Corporate Specific Fields */}
            {customerType === "corporate" && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Şirket Resmi Ünvanı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: ABC Lojistik Otomotiv San. Tic. Ltd. Şti."
                    value={companyTitle}
                    onChange={(e) => setCompanyTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {errors.companyTitle && (
                    <p className="text-[10px] text-rose-500">{errors.companyTitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Vergi Dairesi
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: İkitelli"
                      value={taxOffice}
                      onChange={(e) => setTaxOffice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Vergi No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="10 Haneli VKN"
                      maxLength={10}
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {errors.taxNumber && (
                      <p className="text-[10px] text-rose-500">{errors.taxNumber}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Name / Surname / Authorized Person */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {customerType === "corporate" ? "Yetkili Adı *" : "Ad *"}
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.firstName && (
                  <p className="text-[10px] text-rose-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {customerType === "corporate" ? "Yetkili Soyadı" : "Soyad *"}
                </label>
                <input
                  type="text"
                  placeholder="Örn: Yılmaz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {errors.lastName && (
                  <p className="text-[10px] text-rose-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Telefon Numarası <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="tel"
                    placeholder="0 (5XX) XXX XX XX"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-rose-500">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="email"
                    placeholder="ornek@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Müşteri Notu / Özel Talimatlar
              </label>
              <textarea
                rows={2}
                placeholder="Örn: Servis öncesi aranmak istiyor, VIP Müşteri vb."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateCustomerMutation.isPending}
              className="h-10 px-4 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={updateCustomerMutation.isPending}
              className="h-10 px-5 text-xs font-semibold gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {updateCustomerMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
