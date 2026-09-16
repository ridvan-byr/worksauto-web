"use client"

import * as React from "react"
import { PieChart, CreditCard, Wrench } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface PaymentBreakdownItem {
  method: string
  label: string
  amount: number
  percentage: number
}

interface PaymentDonutChartProps {
  paymentBreakdown: PaymentBreakdownItem[]
  totalRevenue?: number
  labourRevenue?: number
  partsRevenue?: number
}

// Color palette for methods
const METHOD_COLORS: Record<string, string> = {
  CASH: "#10b981", // Emerald
  POS: "#0ea5e9", // Sky
  BANK_TRANSFER: "#6366f1", // Indigo
  CREDIT_CARD: "#3b82f6", // Blue
  ONLINE: "#f59e0b", // Amber
  OTHER: "#8b5cf6", // Purple
}

const RADIUS = 64
const STROKE_WIDTH = 22
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PaymentDonutChart({
  paymentBreakdown,
  totalRevenue = 0,
  labourRevenue = 0,
  partsRevenue = 0,
}: PaymentDonutChartProps) {
  const [activeTab, setActiveTab] = React.useState<"payments" | "composition">("payments")
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)

  // Generate segments based on active tab
  const segments = React.useMemo(() => {
    if (activeTab === "payments") {
      const total = paymentBreakdown.reduce((s, p) => s + p.amount, 0)
      if (total === 0) return []

      return paymentBreakdown.map((item, idx) => ({
        id: item.method,
        label: item.label,
        amount: item.amount,
        percentage: item.percentage,
        color: METHOD_COLORS[item.method] || Object.values(METHOD_COLORS)[idx % 6],
      }))
    } else {
      // Composition: Labour vs Parts
      const total = totalRevenue
      if (total === 0) return []

      const labourPct = Math.round((labourRevenue / total) * 100)
      const partsPct = 100 - labourPct

      return [
        {
          id: "labour",
          label: "İşçilik Geliri",
          amount: labourRevenue,
          percentage: labourPct,
          color: "#6366f1", // Indigo
        },
        {
          id: "parts",
          label: "Yedek Parça",
          amount: partsRevenue,
          percentage: partsPct,
          color: "#10b981", // Emerald
        },
      ]
    }
  }, [activeTab, paymentBreakdown, totalRevenue, labourRevenue, partsRevenue])

  const totalAmount = React.useMemo(() => {
    if (activeTab === "payments") {
      return paymentBreakdown.reduce((s, p) => s + p.amount, 0)
    }
    return totalRevenue
  }, [activeTab, paymentBreakdown, totalRevenue])

  // Calculate SVG strokeDashoffset offsets
  const renderedArcs = React.useMemo(() => {
    return segments.map((seg, idx) => {
      const priorSum = segments.slice(0, idx).reduce((sum, s) => sum + s.percentage, 0)
      const strokeDasharray = `${(seg.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`
      const strokeDashoffset = -((priorSum / 100) * CIRCUMFERENCE)
      return { ...seg, strokeDasharray, strokeDashoffset, idx }
    })
  }, [segments])

  return (
    <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 bg-white dark:bg-slate-900 space-y-4">
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart size={18} className="text-emerald-500" />
            <span>Kasa & Gelir Dağılımı</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === "payments" ? "Tahsilat kanallarının oransal dağılımı" : "Saf işçilik vs. yedek parça geliri"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("payments")
              setHoveredIdx(null)
            }}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "payments"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <CreditCard size={13} />
            <span>Tahsilat Türü</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("composition")
              setHoveredIdx(null)
            }}
            className={cn(
              "px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "composition"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Wrench size={13} />
            <span>İşçilik / Parça</span>
          </button>
        </div>
      </div>

      {/* Donut & Legend Container */}
      {segments.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <CreditCard size={28} className="text-slate-300 dark:text-slate-600" />
          <p className="text-xs font-medium">Bu dönemde tahsilat kaydı bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
          {/* SVG Donut Chart */}
          <div className="sm:col-span-6 flex items-center justify-center relative">
            <svg
              viewBox="0 0 180 180"
              className="w-44 h-44 sm:w-48 sm:h-48 transform -rotate-90 overflow-visible"
            >
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={RADIUS}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={STROKE_WIDTH}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Arcs */}
              {renderedArcs.map((arc) => {
                const isHovered = hoveredIdx === arc.idx
                return (
                  <circle
                    key={arc.id}
                    cx="90"
                    cy="90"
                    r={RADIUS}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth={isHovered ? STROKE_WIDTH + 4 : STROKE_WIDTH}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(arc.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
            </svg>

            {/* Center Label (rotated back to normal) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {hoveredIdx !== null && segments[hoveredIdx]
                  ? segments[hoveredIdx].label
                  : activeTab === "payments"
                  ? "Toplam Kasa"
                  : "Toplam Ciro"}
              </span>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                ₺{" "}
                {(hoveredIdx !== null && segments[hoveredIdx]
                  ? segments[hoveredIdx].amount
                  : totalAmount
                ).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {hoveredIdx !== null && segments[hoveredIdx]
                  ? `%${segments[hoveredIdx].percentage}`
                  : "%100"}
              </span>
            </div>
          </div>

          {/* Legend Items List */}
          <div className="sm:col-span-6 space-y-2">
            {segments.map((item, idx) => {
              const isHovered = hoveredIdx === idx
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={cn(
                    "p-2.5 rounded-2xl border transition-all flex items-center justify-between text-xs cursor-pointer",
                    isHovered
                      ? "bg-slate-100/90 dark:bg-slate-800 border-sky-500/50 shadow-xs scale-[1.02]"
                      : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₺ {item.amount.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1.5 font-mono">
                      (%{item.percentage})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
