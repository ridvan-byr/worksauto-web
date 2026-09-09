"use client"

import * as React from "react"
import { Search, User, Building2, Check, CheckCircle2, Car, Plus } from "lucide-react"
import { PlateBadge } from "@/features/customers/components/plate-badge"
import { cn } from "@/lib/utils"

export interface CustomerVehicleOption {
  id: string
  plate: string
  brand: string
  model: string
  year?: number
  kilometer?: number
}

export interface CustomerOption {
  id: string
  name: string
  surname?: string
  phone: string
  isLead?: boolean
  type: "individual" | "corporate"
  companyTitle?: string
  vehicles: CustomerVehicleOption[]
}

interface CustomerSearchSelectProps {
  customers: CustomerOption[]
  selectedCustomerId: string
  selectedVehicleId: string
  onSelectCustomer: (customerId: string) => void
  onSelectVehicle: (vehicleId: string) => void
  onSwitchToQuickLead: () => void
  customerError?: string
  vehicleError?: string
}

export function CustomerSearchSelect({
  customers,
  selectedCustomerId,
  selectedVehicleId,
  onSelectCustomer,
  onSelectVehicle,
  onSwitchToQuickLead,
  customerError,
  vehicleError,
}: CustomerSearchSelectProps) {
  const [customerSearch, setCustomerSearch] = React.useState("")
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [vehicleSearch, setVehicleSearch] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  )

  const customerVehicles = React.useMemo(
    () => selectedCustomer?.vehicles || [],
    [selectedCustomer]
  )

  // Filtered customer list
  const searchResults = React.useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase().trim()
    const cleanDigits = q.replace(/\D/g, "")
    return customers.filter((c) => {
      const matchName = `${c.name} ${c.surname || ""}`.toLowerCase().includes(q)
      const matchCompany = c.companyTitle?.toLowerCase().includes(q) || false
      const matchPhone = cleanDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(cleanDigits)
      const matchPlates = c.vehicles.some((v) =>
        v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      )
      return matchName || matchCompany || matchPhone || matchPlates
    })
  }, [customers, customerSearch])

  // Filtered fleet vehicles (for 4+ vehicles)
  const filteredVehicles = React.useMemo(() => {
    if (!vehicleSearch.trim()) return customerVehicles
    const q = vehicleSearch.toLowerCase().trim()
    return customerVehicles.filter((v) => {
      const matchPlate = v.plate.toLowerCase().replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      const matchModel = `${v.brand} ${v.model}`.toLowerCase().includes(q)
      return matchPlate || matchModel
    })
  }, [customerVehicles, vehicleSearch])

  return (
    <div className="space-y-4">
      {/* Customer Search Section */}
      <div className="space-y-3">
        <div ref={dropdownRef} className="relative">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri adı, şirket ünvanı, telefon veya plaka ile ara..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                setIsDropdownOpen(true)
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in zoom-in-95 duration-150">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Eşleşen müşteri bulunamadı.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      onSwitchToQuickLead()
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    <Plus size={14} />
                    Hızlı Potansiyel Müşteri Kaydı Aç
                  </button>
                </div>
              ) : (
                searchResults.map((c) => {
                  const isSel = c.id === selectedCustomerId
                  const displayName =
                    c.type === "corporate" && c.companyTitle
                      ? c.companyTitle
                      : `${c.name} ${c.surname || ""}`.trim()
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c.id)
                        setIsDropdownOpen(false)
                        setCustomerSearch("")
                      }}
                      className={cn(
                        "w-full p-3 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs",
                        isSel && "bg-sky-500/10 dark:bg-sky-950/30"
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                            c.type === "corporate"
                              ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                              : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          )}
                        >
                          {c.type === "corporate" ? <Building2 size={15} /> : <User size={15} />}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                              {displayName}
                            </span>
                            {c.isLead && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                Potansiyel
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {c.phone} {c.vehicles.length > 0 && `• ${c.vehicles.length} Araç`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.vehicles.slice(0, 2).map((v) => (
                          <span
                            key={v.id}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700"
                          >
                            {v.plate}
                          </span>
                        ))}
                        {isSel && <Check size={16} className="text-sky-500 ml-1" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Customer Card Preview */}
        {selectedCustomer && (
          <div className="p-3.5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs",
                  selectedCustomer.type === "corporate"
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                    : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                )}
              >
                {selectedCustomer.type === "corporate" ? <Building2 size={18} /> : <User size={18} />}
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedCustomer.type === "corporate" && selectedCustomer.companyTitle
                      ? selectedCustomer.companyTitle
                      : `${selectedCustomer.name} ${selectedCustomer.surname || ""}`.trim()}
                  </p>
                  {selectedCustomer.isLead ? (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      Potansiyel Müşteri
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Kayıtlı Müşteri
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {selectedCustomer.phone} • {customerVehicles.length} Kayıtlı Araç
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(true)
                setCustomerSearch("")
              }}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer shrink-0"
            >
              Değiştir
            </button>
          </div>
        )}

        {customerError && (
          <p className="text-[11px] text-rose-500 font-medium">{customerError}</p>
        )}
      </div>

      {/* Adaptive Vehicle Selection Section */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Car size={15} className="text-sky-500" />
            <span>Randevu Alınacak Araç {selectedCustomer ? `(${customerVehicles.length})` : ""}</span>
            <span className="text-rose-500">*</span>
          </label>

          {customerVehicles.length > 3 && (
            <span className="text-[11px] text-slate-400">Kurumsal Filo Modu (Arama Aktif)</span>
          )}
        </div>

        {/* Not Selected Yet */}
        {!selectedCustomer ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-center space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Araç seçimi yapabilmek için lütfen yukarıdan müşteri arayın veya hızlı kayıt yapın.
            </p>
          </div>
        ) : customerVehicles.length === 0 ? (
          /* Customer selected but has no vehicle */
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-center space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Bu müşteriye ait kayıtlı araç bulunamadı.
            </p>
            <button
              type="button"
              onClick={onSwitchToQuickLead}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              + Hızlı Kayıt ile Araç Ekle
            </button>
          </div>
        ) : customerVehicles.length === 1 ? (
          /* CASE 1: 1 vehicle -> Card */
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PlateBadge plate={customerVehicles[0].plate} size="md" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {customerVehicles[0].brand} {customerVehicles[0].model}
                </p>
                <p className="text-[10px] text-slate-500">
                  {customerVehicles[0].year ? `${customerVehicles[0].year} Model • ` : ""}
                  {(Number(customerVehicles[0].kilometer ?? 0)).toLocaleString("tr-TR")} KM
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              <CheckCircle2 size={14} />
              <span>Seçili Araç</span>
            </div>
          </div>
        ) : customerVehicles.length <= 3 ? (
          /* CASE 2: 2-3 vehicles -> Segmented buttons */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {customerVehicles.map((v) => {
              const isSel = v.id === selectedVehicleId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVehicle(v.id)}
                  className={cn(
                    "p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer",
                    isSel
                      ? "bg-sky-500/15 border-sky-500 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "bg-slate-50/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  )}
                >
                  <div className="space-y-1 overflow-hidden">
                    <PlateBadge plate={v.plate} size="sm" />
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {v.brand} {v.model}
                    </p>
                  </div>
                  {isSel && <CheckCircle2 size={16} className="text-sky-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        ) : (
          /* CASE 3: 4+ Vehicles -> Filter search + list */
          <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filo içinde plaka veya model ara (örn: 34...)"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50 pr-1">
              {filteredVehicles.length === 0 ? (
                <p className="text-center py-3 text-[11px] text-slate-400">
                  Aramanıza uygun araç bulunamadı.
                </p>
              ) : (
                filteredVehicles.map((v) => {
                  const isSel = v.id === selectedVehicleId
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelectVehicle(v.id)}
                      className={cn(
                        "w-full pt-1.5 pb-1.5 px-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer",
                        isSel ? "bg-sky-500/15 font-bold" : "hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <PlateBadge plate={v.plate} size="sm" />
                        <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                          {v.brand} {v.model} ({v.year || "Yıl yok"})
                        </span>
                      </div>
                      {isSel ? (
                        <CheckCircle2 size={15} className="text-sky-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {v.kilometer ? `${v.kilometer} km` : ""}
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {vehicleError && (
          <p className="text-[11px] text-rose-500 font-medium">{vehicleError}</p>
        )}
      </div>
    </div>
  )
}
