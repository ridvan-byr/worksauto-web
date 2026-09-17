"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  X,
  Receipt,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Building2,
  FileCheck2,
  Coins,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Search,
  Package,
  Wrench,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/components/ui/sonner"
import { useCustomers } from "@/features/customers/api/use-customers"
import { useProducts, type ProductRecord } from "@/features/inventory/api/use-inventory"

const STANDARD_LABOR_TEMPLATES = [
  "Periyodik Bakım İşçiliği",
  "Fren & Balata Değişimi",
  "Ön Takım / Rot-Balans",
  "Motor Yağ & Filtre Değişimi",
  "Debriyaj & Baskı Balata",
  "Bilgisayarlı Arıza Teşhis (Diagnostik)",
  "Klima Gazı Dolumu & Bakım",
  "Elektrik & Elektronik Onarım",
  "Akü Kontrol & Değişimi",
  "Genel Mekanik Kontrol",
]

interface CreateDirectInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface InvoiceLineItem {
  id: string
  name: string
  itemType: "PART" | "LABOR"
  quantity: number
  unitPrice: number
  kdvRate: number
  productId?: string
  stockAvailable?: number
  isCustomPart?: boolean
}

type PaymentOption = "CASH" | "POS" | "BANK_TRANSFER" | "SPLIT" | "OPEN_ACCOUNT"

export function CreateDirectInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDirectInvoiceModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Customer State
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false)
  const [availableAdvance, setAvailableAdvance] = React.useState<number>(0)
  const [useAdvanceOffset, setUseAdvanceOffset] = React.useState<boolean>(true)

  // Items State
  const [items, setItems] = React.useState<InvoiceLineItem[]>([
    {
      id: "item_1",
      name: "",
      itemType: "PART",
      quantity: 1,
      unitPrice: 0,
      kdvRate: 20,
    },
  ])

  // Payment & Details State
  const defaultDueDate = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split("T")[0]
  }, [])
  const [dueDate, setDueDate] = React.useState(defaultDueDate)
  const [paymentOption, setPaymentOption] = React.useState<PaymentOption>("POS")
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0)
  const [splitCashAmount, setSplitCashAmount] = React.useState<number>(0)
  const [splitPosAmount, setSplitPosAmount] = React.useState<number>(0)
  const [posSlipNo, setPosSlipNo] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomers(customerSearch)
  const { data: apiProducts = [] } = useProducts()

  // Dropdown & Validation State for Items
  const [activeDropdownItemId, setActiveDropdownItemId] = React.useState<string | null>(null)
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})
  const tableRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = "auto"
      }
    }
  }, [isOpen])

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setActiveDropdownItemId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Selected Customer Details
  const selectedCustomer = React.useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null
  }, [customers, selectedCustomerId])

  // Check advance balance when customer changes
  React.useEffect(() => {
    if (!selectedCustomerId) {
      setAvailableAdvance(0)
      return
    }
    apiClient
      .get<{ balance: number }>(`/current-accounts/customer/${selectedCustomerId}`)
      .then((res) => {
        if (res && Number(res.balance) < 0) {
          setAvailableAdvance(Math.abs(Number(res.balance)))
        } else {
          setAvailableAdvance(0)
        }
      })
      .catch(() => {
        setAvailableAdvance(0)
      })
  }, [selectedCustomerId])

  // Calculate Totals
  const { subtotal, kdvAmount, grandTotal } = React.useMemo(() => {
    let sub = 0
    let kdv = 0

    items.forEach((item) => {
      const lineSub = Math.round(item.quantity * item.unitPrice * 100) / 100
      const lineKdv = Math.round(lineSub * (item.kdvRate / 100) * 100) / 100
      sub += lineSub
      kdv += lineKdv
    })

    sub = Math.round(sub * 100) / 100
    kdv = Math.round(kdv * 100) / 100
    const total = Math.round((sub + kdv) * 100) / 100

    return { subtotal: sub, kdvAmount: kdv, grandTotal: total }
  }, [items])

  const offsetAdvance = React.useMemo(() => {
    if (!useAdvanceOffset || availableAdvance <= 0) return 0
    return Math.min(grandTotal, availableAdvance)
  }, [useAdvanceOffset, availableAdvance, grandTotal])

  const effectiveRemainingToPay = React.useMemo(() => {
    return Math.max(0, Math.round((grandTotal - offsetAdvance) * 100) / 100)
  }, [grandTotal, offsetAdvance])

  // Sync payment amounts when effectiveRemaining changes
  React.useEffect(() => {
    setPaymentAmount(effectiveRemainingToPay)
    const half = Math.round((effectiveRemainingToPay / 2) * 100) / 100
    setSplitCashAmount(half)
    setSplitPosAmount(Math.round((effectiveRemainingToPay - half) * 100) / 100)
  }, [effectiveRemainingToPay])

  // Filter inventory products by search query
  const getFilteredProducts = React.useCallback(
    (query: string) => {
      if (!apiProducts || apiProducts.length === 0) return []
      if (!query || !query.trim()) return apiProducts.slice(0, 8)
      const q = query.toLowerCase().trim()
      return apiProducts
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.code && p.code.toLowerCase().includes(q)) ||
            (p.oemCode && p.oemCode.toLowerCase().includes(q)) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
        )
        .slice(0, 8)
    },
    [apiProducts]
  )

  // Line Items Manipulation
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        name: "",
        itemType: "PART",
        quantity: 1,
        unitPrice: 0,
        kdvRate: 20,
      },
    ])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
    setValidationErrors((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleItemChange = (
    id: string,
    field: keyof InvoiceLineItem,
    value: string | number | boolean | undefined
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === "itemType") {
          if (value === "LABOR") {
            updated.productId = undefined
            updated.stockAvailable = undefined
            updated.isCustomPart = undefined
          }
        }
        return updated
      })
    )

    // Clear validation error when user types at least 3 characters
    if (field === "name" && typeof value === "string" && value.trim().length >= 3) {
      setValidationErrors((prev) => {
        if (!prev[id]) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleSelectProduct = (itemId: string, prod: ProductRecord) => {
    const formattedName = prod.code ? `${prod.name} (${prod.code})` : prod.name
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          name: formattedName,
          unitPrice: prod.salePrice > 0 ? prod.salePrice : item.unitPrice,
          productId: prod.id,
          stockAvailable: prod.stockQuantity,
          isCustomPart: false,
        }
      })
    )
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setActiveDropdownItemId(null)
  }

  const handleSelectLaborTemplate = (itemId: string, template: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          name: template,
        }
      })
    )
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setActiveDropdownItemId(null)
  }

  // Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCustomerId) {
      toast.error("Lütfen fatura kesilecek müşteriyi seçin.")
      return
    }

    // Comprehensive validation checks (Prevent random/empty inputs)
    const errors: Record<string, string> = {}
    let hasValidationError = false

    items.forEach((item) => {
      const trimmed = item.name.trim()
      if (!trimmed || trimmed.length < 3) {
        errors[item.id] = "Lütfen geçerli bir parça veya işçilik tanımı giriniz (en az 3 karakter)"
        hasValidationError = true
      } else if (item.quantity <= 0) {
        errors[item.id] = "Adet en az 1 olmalıdır"
        hasValidationError = true
      } else if (item.unitPrice < 0) {
        errors[item.id] = "Birim fiyat negatif olamaz"
        hasValidationError = true
      }
    })

    if (hasValidationError) {
      setValidationErrors(errors)
      toast.error("Lütfen fatura kalemlerindeki hataları düzeltin.", {
        description: "Rastgele veya 3 karakterden kısa veri girişi yapılamaz. Geçerli bir parça veya işçilik tanımı girilmelidir.",
      })
      return
    }

    if (grandTotal <= 0) {
      toast.error("Fatura toplam tutarı 0'dan büyük olmalıdır.")
      return
    }

    setIsSubmitting(true)
    try {
      const invoicePayload = {
        customerId: selectedCustomerId,
        dueDate,
        subtotal,
        kdvAmount,
        grandTotal,
        offsetAdvanceAmount: offsetAdvance > 0 ? offsetAdvance : undefined,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          kdvRate: Number(item.kdvRate),
          totalPrice:
            Math.round(
              Number(item.quantity) *
                Number(item.unitPrice) *
                (1 + Number(item.kdvRate) / 100) *
                100
            ) / 100,
          productId: item.productId || undefined,
          notes: item.itemType === "LABOR" ? "İşçilik Hizmeti" : "Yedek Parça",
        })),
      }

      const invoiceRes = await apiClient.post<{ id: string; invoiceNumber: string }>(
        "/invoices",
        invoicePayload
      )

      // Handle Immediate Payment Collection if applicable
      if (effectiveRemainingToPay > 0 && paymentOption !== "OPEN_ACCOUNT") {
        if (paymentOption === "SPLIT") {
          if (splitCashAmount > 0) {
            await apiClient.post("/payments", {
              invoiceId: invoiceRes.id,
              customerId: selectedCustomerId,
              amount: Number(splitCashAmount),
              paymentMethod: "CASH",
              notes: notes.trim() || `Fatura #${invoiceRes.invoiceNumber} Nakit Tahsilat`,
            })
          }
          if (splitPosAmount > 0) {
            await apiClient.post("/payments", {
              invoiceId: invoiceRes.id,
              customerId: selectedCustomerId,
              amount: Number(splitPosAmount),
              paymentMethod: "POS",
              posSlipNo: posSlipNo.trim() || undefined,
              notes: notes.trim() || `Fatura #${invoiceRes.invoiceNumber} POS / Kredi Kartı`,
            })
          }
        } else if (paymentAmount > 0) {
          await apiClient.post("/payments", {
            invoiceId: invoiceRes.id,
            customerId: selectedCustomerId,
            amount: Number(paymentAmount),
            paymentMethod: paymentOption,
            posSlipNo: posSlipNo.trim() || undefined,
            notes: notes.trim() || `Fatura #${invoiceRes.invoiceNumber} Tahsilatı`,
          })
        }
      }

      const advanceDesc =
        offsetAdvance > 0
          ? ` (${offsetAdvance.toLocaleString("tr-TR")} ₺ avanstan mahsup edildi)`
          : ""

      const payDesc =
        effectiveRemainingToPay > 0 && paymentOption !== "OPEN_ACCOUNT"
          ? paymentOption === "SPLIT"
            ? ` ve ${splitCashAmount.toLocaleString("tr-TR")} ₺ Nakit + ${splitPosAmount.toLocaleString("tr-TR")} ₺ POS tahsil edildi.`
            : ` ve ${paymentAmount.toLocaleString("tr-TR")} ₺ tahsil edildi.`
          : "."

      toast.success("Fatura başarıyla oluşturuldu!", {
        description: `Fatura #${invoiceRes.invoiceNumber} oluşturuldu${advanceDesc}${payDesc}`,
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Fatura oluşturulurken bir hata oluştu."
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Yeni Fatura Kes (Tezgah / Doğrudan Satış)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                İş emri olmadan parça, sarf malzeme veya harici servis faturası düzenleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* 1. Customer Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Müşteri Seçimi <span className="text-rose-500">*</span>
              </label>

              {selectedCustomer ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {selectedCustomer.name} {selectedCustomer.surname || ""}
                        {selectedCustomer.companyTitle && ` (${selectedCustomer.companyTitle})`}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedCustomer.phone || "Telefon yok"}
                        {selectedCustomer.taxNumber && ` • VK/TC: ${selectedCustomer.taxNumber}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomerId("")
                      setAvailableAdvance(0)
                    }}
                    className="h-8 px-3 text-xs text-slate-500 hover:text-rose-600"
                  >
                    Değiştir
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Müşteri adı, unvanı veya telefon ile ara..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setIsCustomerDropdownOpen(true)
                      }}
                      onFocus={() => setIsCustomerDropdownOpen(true)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {isCustomerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-48 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl z-20">
                      {isLoadingCustomers ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          <Loader2 size={16} className="animate-spin inline mr-2" />
                          Müşteriler aranıyor...
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Müşteri bulunamadı.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {customers.slice(0, 15).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCustomerId(c.id)
                                setIsCustomerDropdownOpen(false)
                                setCustomerSearch("")
                              }}
                              className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {c.name} {c.surname || ""}
                                  {c.companyTitle && (
                                    <span className="text-[11px] text-slate-500 font-normal ml-1">
                                      - {c.companyTitle}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-400">{c.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Advance Balance Notification if available */}
            {availableAdvance > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Coins size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-bold">Müşterinin {availableAdvance.toLocaleString("tr-TR")} ₺ Cari Avansı Var</p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      Bu faturanın tutarı müşterinin önceden yatırdığı avanstan düşülebilir.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={useAdvanceOffset}
                    onChange={(e) => setUseAdvanceOffset(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Avanstan Mahsup Et
                  </span>
                </label>
              </div>
            )}

            {/* 2. Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fatura Kalemleri (Mal & Hizmetler)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 px-2.5 text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Kalem Ekle</span>
                </Button>
              </div>

              <div ref={tableRef} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 relative">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500">
                      <th className="py-2 px-3">Kalem Tanımı & Şablon</th>
                      <th className="py-2 px-2 w-28">Tür</th>
                      <th className="py-2 px-2 w-16 text-center">Adet</th>
                      <th className="py-2 px-2 w-24 text-right">Birim (₺)</th>
                      <th className="py-2 px-2 w-20 text-center">KDV</th>
                      <th className="py-2 px-3 w-24 text-right">Tutar (₺)</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => {
                      const lineTotal =
                        Math.round(
                          item.quantity * item.unitPrice * (1 + item.kdvRate / 100) * 100
                        ) / 100
                      const hasError = Boolean(validationErrors[item.id])
                      const isDropdownOpen = activeDropdownItemId === item.id

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 align-top">
                          <td className="py-2 px-2 relative">
                            <div className="relative">
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder={
                                    item.itemType === "PART"
                                      ? "🔍 Stoktan parça seçin veya yazın..."
                                      : "🛠️ İşçilik tanımı girin veya şablondan seçin..."
                                  }
                                  value={item.name}
                                  onFocus={() => setActiveDropdownItemId(item.id)}
                                  onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                                  className={`w-full h-8 px-2 pr-7 rounded-lg border text-xs text-slate-800 dark:text-slate-200 focus:outline-none transition-colors ${
                                    hasError
                                      ? "border-rose-500 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20"
                                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-500"
                                  }`}
                                />
                                <div className="absolute right-2 text-slate-400 pointer-events-none">
                                  {item.itemType === "PART" ? (
                                    <Package size={14} />
                                  ) : (
                                    <Wrench size={14} />
                                  )}
                                </div>
                              </div>

                              {/* Stock status badge if selected from inventory */}
                              {item.itemType === "PART" && item.stockAvailable !== undefined && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      item.stockAvailable > 0
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50"
                                    }`}
                                  >
                                    <Package size={10} />
                                    <span>Mevcut Stok: {item.stockAvailable} Adet</span>
                                  </span>
                                  {item.stockAvailable === 0 && (
                                    <span className="text-[10px] text-amber-600 font-medium">
                                      (Stokta kalmadı, sipariş gerekebilir)
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Validation error message */}
                              {hasError && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] text-rose-500 font-medium animate-in fade-in slide-in-from-top-1">
                                  <AlertCircle size={11} className="shrink-0" />
                                  <span>{validationErrors[item.id]}</span>
                                </div>
                              )}

                              {/* Dropdown Menu for PART (Stock Selection) */}
                              {isDropdownOpen && item.itemType === "PART" && (
                                <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] sm:min-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden text-left">
                                  <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <Package size={12} className="text-emerald-600" />
                                      Stok Kartından Parça Seçin
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {apiProducts.length} Kart Mevcut
                                    </span>
                                  </div>
                                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {getFilteredProducts(item.name).length > 0 ? (
                                      getFilteredProducts(item.name).map((prod) => (
                                        <button
                                          key={prod.id}
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault()
                                            handleSelectProduct(item.id, prod)
                                          }}
                                          className="w-full text-left px-3 py-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                                        >
                                          <div className="min-w-0">
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                              {prod.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                              {prod.code && <span>Kod: {prod.code}</span>}
                                              {prod.oemCode && <span>OEM: {prod.oemCode}</span>}
                                            </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                                              {Number(prod.salePrice || 0).toLocaleString("tr-TR")} ₺
                                            </div>
                                            <span
                                              className={`inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                                prod.stockQuantity > 0
                                                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                                                  : "text-rose-500 bg-rose-50 dark:bg-rose-950/40"
                                              }`}
                                            >
                                              {prod.stockQuantity > 0 ? `Stok: ${prod.stockQuantity}` : "Tükendi"}
                                            </span>
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-3 text-center text-xs text-slate-400">
                                        Eşleşen stok kartı bulunamadı.
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-2 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400">
                                      Stok dışı ise serbest yazabilirsiniz (en az 3 karakter).
                                    </span>
                                    <button
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        setActiveDropdownItemId(null)
                                      }}
                                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                                    >
                                      Kapat
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Dropdown Menu for LABOR (Standard Service Templates) */}
                              {isDropdownOpen && item.itemType === "LABOR" && (
                                <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] sm:min-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden text-left">
                                  <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <Sparkles size={12} className="text-amber-500" />
                                      Standart Hizmet & İşçilik Şablonları
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">Tek Tıkla Seç</span>
                                  </div>
                                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {STANDARD_LABOR_TEMPLATES.map((tmpl) => (
                                      <button
                                        key={tmpl}
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault()
                                          handleSelectLaborTemplate(item.id, tmpl)
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 flex items-center justify-between gap-2 transition-colors cursor-pointer group text-xs text-slate-700 dark:text-slate-300 font-medium hover:text-amber-600 dark:hover:text-amber-400"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <Wrench size={13} className="text-slate-400 group-hover:text-amber-500 shrink-0" />
                                          <span>{tmpl}</span>
                                        </span>
                                        <Plus size={13} className="text-slate-300 group-hover:text-amber-500 shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={item.itemType}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "itemType",
                                  e.target.value as "PART" | "LABOR"
                                )
                              }
                              className="w-full h-8 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                              <option value="PART">📦 Parça</option>
                              <option value="LABOR">🛠️ İşçilik</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full h-8 px-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full h-8 px-2 text-right rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <select
                              value={item.kdvRate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "kdvRate",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full h-8 px-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                            >
                              <option value={20}>%20</option>
                              <option value={10}>%10</option>
                              <option value={0}>%0</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {lineTotal.toLocaleString("tr-TR")} ₺
                          </td>
                          <td className="py-2 px-1 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Due Date & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Son Ödeme Vadesi
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fatura Açıklaması / Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Tezgah satışı, perakende yedek parça..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* 4. Totals Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Ara Toplam (KDV Hariç):</span>
                <span className="font-mono font-semibold">{subtotal.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Toplam KDV:</span>
                <span className="font-mono font-semibold">{kdvAmount.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Genel Toplam:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {grandTotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              {offsetAdvance > 0 && (
                <div className="flex items-center justify-between font-semibold text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Mahsup Edilen Avans:</span>
                  <span className="font-mono">-{offsetAdvance.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
            </div>

            {/* 5. Payment Selection */}
            {useAdvanceOffset && offsetAdvance >= grandTotal ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    Fatura Tutarı Tamamen Avans ile Karşılanıyor
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Faturanın tamamı ({grandTotal.toLocaleString("tr-TR")} ₺) müşterinizin cari hesabındaki avanstan mahsup edilecektir. İlave tahsilat alınmasına gerek yoktur.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tahsilat Yöntemi
                  </label>
                  {offsetAdvance > 0 && (
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      Kalan: {effectiveRemainingToPay.toLocaleString("tr-TR")} ₺
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentOption("POS")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "POS"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <CreditCard size={18} />
                    <span className="text-[11px]">Kredi Kartı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("CASH")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "CASH"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Banknote size={18} />
                    <span className="text-[11px]">Nakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("SPLIT")
                      const half = Math.round((effectiveRemainingToPay / 2) * 100) / 100
                      setSplitCashAmount(half)
                      setSplitPosAmount(Math.round((effectiveRemainingToPay - half) * 100) / 100)
                    }}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "SPLIT"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Coins size={18} />
                    <span className="text-[11px]">Parçalı (Nakit+Kart)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("BANK_TRANSFER")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "BANK_TRANSFER"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Building2 size={18} />
                    <span className="text-[11px]">Havale / EFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption("OPEN_ACCOUNT")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      paymentOption === "OPEN_ACCOUNT"
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <FileCheck2 size={18} />
                    <span className="text-[11px]">Cari Hesap</span>
                  </button>
                </div>

                {/* Split Payment Dual Inputs */}
                {paymentOption === "SPLIT" ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Parçalı Tahsilat Dağılımı (Nakit + Kart)
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        Toplam: {(splitCashAmount + splitPosAmount).toFixed(2)} / {effectiveRemainingToPay.toFixed(2)} ₺
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Nakit Tutarı (₺)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={effectiveRemainingToPay}
                            step="0.01"
                            value={splitCashAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setSplitCashAmount(val)
                              const cardRemainder = Math.max(
                                0,
                                Math.round((effectiveRemainingToPay - val) * 100) / 100
                              )
                              setSplitPosAmount(cardRemainder)
                            }}
                            className="w-full h-10 px-3 pr-8 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Kredi Kartı / POS Tutarı (₺)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={effectiveRemainingToPay}
                            step="0.01"
                            value={splitPosAmount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setSplitPosAmount(val)
                              const cashRemainder = Math.max(
                                0,
                                Math.round((effectiveRemainingToPay - val) * 100) / 100
                              )
                              setSplitCashAmount(cashRemainder)
                            }}
                            className="w-full h-10 px-3 pr-8 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        POS Slip / Onay No (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: 984512"
                        value={posSlipNo}
                        onChange={(e) => setPosSlipNo(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : paymentOption !== "OPEN_ACCOUNT" ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Tahsil Edilen Tutar
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Anında Kasa Kaydı Alınacak
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        max={effectiveRemainingToPay}
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full h-10 px-3 pr-10 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₺</span>
                    </div>

                    {paymentOption === "POS" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          POS Slip / Onay No (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: 984512"
                          value={posSlipNo}
                          onChange={(e) => setPosSlipNo(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-bold">Açık Hesap (Kalan Borç)</p>
                      <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                        Kalan tutar ({effectiveRemainingToPay.toLocaleString("tr-TR")} ₺) müşterinin cari hesabına borç kaydedilecek. Kasa tahsilatı daha sonra yapılabilecektir.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || grandTotal <= 0 || !selectedCustomerId}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Fatura Kesiliyor...</span>
                </>
              ) : (
                <>
                  <Receipt size={15} />
                  <span>Faturayı Kes ve Kaydet</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
