"use client"

import * as React from "react"
import { ChevronDown, Search, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { normalizeTurkishSearch } from "@/lib/turkey-locations"

export interface SearchableSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  disabledMessage?: string
  error?: boolean
  className?: string
  id?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  disabled = false,
  disabledMessage,
  error = false,
  className,
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Filter options with Turkish search normalization
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options
    const normalizedQuery = normalizeTurkishSearch(searchQuery)
    return options.filter((opt) =>
      normalizeTurkishSearch(opt).includes(normalizedQuery)
    )
  }, [options, searchQuery])

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when opened
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Handle keyboard events (Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setSearchQuery("")
    }
  }

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setSearchQuery("")
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev)
        }}
        title={disabled && disabledMessage ? disabledMessage : undefined}
        className={cn(
          "w-full h-11 sm:h-10 px-3.5 rounded-xl border text-xs sm:text-sm text-left flex items-center justify-between transition-colors outline-none",
          disabled
            ? "bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
            : "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400",
          error
            ? "border-rose-500 focus:border-rose-500"
            : "border-slate-200 dark:border-slate-800",
          isOpen && "border-slate-500 dark:border-slate-400 ring-2 ring-slate-400/20"
        )}
      >
        <span className={cn("truncate", !value && "text-slate-400")}>
          {value || (disabled && disabledMessage ? disabledMessage : placeholder)}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Temizle"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180 text-slate-700 dark:text-slate-200"
            )}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 bg-slate-50/70 dark:bg-slate-950/40">
            <Search size={14} className="text-slate-400 ml-1 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
            <span className="text-[10px] font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 shrink-0">
              {filteredOptions.length}
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-transparent">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                Eşleşen sonuç bulunamadı.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt === value
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "w-full px-3 py-2 text-xs sm:text-sm rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer",
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check size={14} className="shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
