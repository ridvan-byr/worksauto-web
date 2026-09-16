"use client"

import * as React from "react"
import { TrendingUp, Calendar, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface DailyTrendItem {
  date: string
  label: string
  revenue: number
  profit: number
  orderCount: number
}

interface RevenueTrendAreaChartProps {
  data: DailyTrendItem[]
  title?: string
  subtitle?: string
}

export function RevenueTrendAreaChart({
  data,
  title = "Dönemsel Ciro ve Net Kâr Seyri",
  subtitle = "Günlük iş emri hasılatı ve net kârlılık grafiği",
}: RevenueTrendAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  // Chart Dimensions
  const svgWidth = 800
  const svgHeight = 260
  const padding = { top: 25, right: 30, bottom: 40, left: 60 }

  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  // Calculate scales
  const maxVal = React.useMemo(() => {
    if (!data || data.length === 0) return 10000
    const maxRev = Math.max(...data.map((d) => d.revenue), 0)
    const maxProf = Math.max(...data.map((d) => d.profit), 0)
    const peak = Math.max(maxRev, maxProf, 1000)
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(peak)))
    return Math.ceil((peak * 1.15) / magnitude) * magnitude
  }, [data])

  const points = React.useMemo(() => {
    if (!data || data.length === 0) return []
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2

    return data.map((d, i) => {
      const x = padding.left + (data.length > 1 ? i * stepX : chartWidth / 2)
      const yRev = padding.top + chartHeight - (d.revenue / maxVal) * chartHeight
      const yProfit = padding.top + chartHeight - (Math.max(0, d.profit) / maxVal) * chartHeight
      return { ...d, x, yRev, yProfit }
    })
  }, [data, chartWidth, chartHeight, padding.left, padding.top, maxVal])

  // Build SVG Paths
  const { revLinePath, revAreaPath, profitLinePath, profitAreaPath } = React.useMemo(() => {
    if (points.length === 0) {
      return { revLinePath: "", revAreaPath: "", profitLinePath: "", profitAreaPath: "" }
    }
    if (points.length === 1) {
      const p = points[0]
      const ground = padding.top + chartHeight
      return {
        revLinePath: `M ${p.x - 20} ${p.yRev} L ${p.x + 20} ${p.yRev}`,
        revAreaPath: `M ${p.x - 20} ${ground} L ${p.x - 20} ${p.yRev} L ${p.x + 20} ${p.yRev} L ${p.x + 20} ${ground} Z`,
        profitLinePath: `M ${p.x - 20} ${p.yProfit} L ${p.x + 20} ${p.yProfit}`,
        profitAreaPath: `M ${p.x - 20} ${ground} L ${p.x - 20} ${p.yProfit} L ${p.x + 20} ${p.yProfit} L ${p.x + 20} ${ground} Z`,
      }
    }

    // Smooth cubic bezier curves
    const makeSmoothPath = (yKey: "yRev" | "yProfit") => {
      let path = `M ${points[0].x} ${points[0][yKey]}`
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i]
        const next = points[i + 1]
        const cpX1 = curr.x + (next.x - curr.x) / 3
        const cpY1 = curr[yKey]
        const cpX2 = curr.x + ((next.x - curr.x) * 2) / 3
        const cpY2 = next[yKey]
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next[yKey]}`
      }
      return path
    }

    const ground = padding.top + chartHeight
    const revLine = makeSmoothPath("yRev")
    const profitLine = makeSmoothPath("yProfit")

    const revArea = `${revLine} L ${points[points.length - 1].x} ${ground} L ${points[0].x} ${ground} Z`
    const profitArea = `${profitLine} L ${points[points.length - 1].x} ${ground} L ${points[0].x} ${ground} Z`

    return {
      revLinePath: revLine,
      revAreaPath: revArea,
      profitLinePath: profitLine,
      profitAreaPath: profitArea,
    }
  }, [points, chartHeight, padding.top])

  // Y-axis grid lines (4 intervals)
  const yTicks = React.useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const val = maxVal * ratio
      const y = padding.top + chartHeight - ratio * chartHeight
      return { val, y }
    })
  }, [maxVal, padding.top, chartHeight])

  const totalRev = React.useMemo(() => data.reduce((s, d) => s + d.revenue, 0), [data])
  const totalProfit = React.useMemo(() => data.reduce((s, d) => s + d.profit, 0), [data])
  const totalOrders = React.useMemo(() => data.reduce((s, d) => s + d.orderCount, 0), [data])

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null

  return (
    <Card className="rounded-3xl border-slate-200/80 dark:border-slate-800 shadow-sm p-5 sm:p-6 bg-white dark:bg-slate-900 space-y-4 overflow-visible relative">
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-500" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50" />
            <span className="text-slate-700 dark:text-slate-300">Brüt Ciro</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span className="text-slate-700 dark:text-slate-300">Net Kâr</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 hidden lg:inline">
            Toplam: <strong className="text-slate-700 dark:text-slate-200 font-bold">{totalOrders} İş Emri</strong>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      {data.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Calendar size={28} className="text-slate-300 dark:text-slate-600" />
          <p className="text-xs font-medium">Bu dönemde tamamlanan iş emri ve ciro kaydı bulunamadı.</p>
        </div>
      ) : (
        <div className="relative w-full overflow-visible select-none pt-2">
          {/* Tooltip Overlay */}
          {activePoint && (() => {
            const minY = Math.min(activePoint.yRev, activePoint.yProfit)
            const maxY = Math.max(activePoint.yRev, activePoint.yProfit)

            // When points are in the upper portion of the chart (minY < 120),
            // show the tooltip BELOW the points to prevent it from clipping at the top or overlapping the card header.
            // When points are in the lower portion, show the tooltip ABOVE with a safe 14px gap.
            const showBelow = minY < 120
            const targetY = showBelow ? maxY + 14 : minY - 14
            const topPercent = Math.max(2, Math.min(94, (targetY / svgHeight) * 100))

            const isNearRight = activePoint.x > svgWidth - 140
            const isNearLeft = activePoint.x < 140

            return (
              <div
                className={cn(
                  "absolute z-50 pointer-events-none transition-all duration-150 drop-shadow-2xl",
                  showBelow
                    ? isNearRight
                      ? "translate-y-0"
                      : isNearLeft
                      ? "translate-y-0"
                      : "-translate-x-1/2 translate-y-0"
                    : isNearRight
                    ? "-translate-y-full"
                    : isNearLeft
                    ? "-translate-y-full"
                    : "-translate-x-1/2 -translate-y-full"
                )}
                style={{
                  left: isNearRight ? "auto" : isNearLeft ? "16px" : `${(activePoint.x / svgWidth) * 100}%`,
                  right: isNearRight ? "16px" : "auto",
                  top: `${topPercent}%`,
                }}
              >
                <div className="p-3.5 rounded-2xl bg-slate-900/95 text-white dark:bg-slate-800/95 shadow-2xl border border-slate-700/90 text-xs backdrop-blur-md min-w-[180px] space-y-2 ring-1 ring-white/10">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      <span className="font-bold text-slate-100 text-xs">{activePoint.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
                      {activePoint.orderCount} İş Emri
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-sky-300 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Ciro:
                    </span>
                    <span className="font-mono font-bold text-white text-xs">₺ {activePoint.revenue.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Net Kâr:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">+₺ {activePoint.profit.toLocaleString("tr-TR")}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 sm:h-64 overflow-visible cursor-crosshair"
            onPointerMove={(e) => {
              if (points.length === 0) return
              const rect = e.currentTarget.getBoundingClientRect()
              if (rect.width <= 0) return
              const clientX = e.clientX - rect.left
              const svgX = (clientX / rect.width) * svgWidth

              let closestIdx = 0
              let minDiff = Infinity
              for (let i = 0; i < points.length; i++) {
                const diff = Math.abs(points[i].x - svgX)
                if (diff < minDiff) {
                  minDiff = diff
                  closestIdx = i
                }
              }
              setHoveredIndex(closestIdx)
            }}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Revenue Area Gradient */}
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.38" />
                <stop offset="90%" stopColor="#0ea5e9" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>

              {/* Profit Area Gradient */}
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="90%" stopColor="#10b981" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {yTicks.map((tick, idx) => (
              <g key={idx} className="pointer-events-none">
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={svgWidth - padding.right}
                  y2={tick.y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray={idx === 0 ? undefined : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={tick.y + 3}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
                >
                  ₺{tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val}
                </text>
              </g>
            ))}

            {/* Gradient Area Fills */}
            <path d={revAreaPath} fill="url(#revenueGrad)" className="pointer-events-none" />
            <path d={profitAreaPath} fill="url(#profitGrad)" className="pointer-events-none" />

            {/* Smooth Strokes */}
            <path
              d={revLinePath}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
            <path
              d={profitLinePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />

            {/* Vertical Hover Guides & Interactive Points */}
            {points.map((p, idx) => {
              const isHovered = hoveredIndex === idx

              return (
                <g key={idx} className="pointer-events-none">
                  {/* Vertical guide line on hover */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={padding.top}
                      x2={p.x}
                      y2={padding.top + chartHeight}
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Revenue Dot */}
                  <circle
                    cx={p.x}
                    cy={p.yRev}
                    r={isHovered ? "6" : "3.5"}
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="transition-all duration-150"
                  />

                  {/* Profit Dot */}
                  <circle
                    cx={p.x}
                    cy={p.yProfit}
                    r={isHovered ? "6" : "3.5"}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth={isHovered ? "2.5" : "1.5"}
                    className="transition-all duration-150"
                  />

                  {/* X-axis date labels */}
                  {(points.length <= 12 || idx % Math.ceil(points.length / 8) === 0 || idx === points.length - 1) && (
                    <text
                      x={p.x}
                      y={padding.top + chartHeight + 18}
                      textAnchor="middle"
                      className={cn(
                        "text-[10px] font-mono fill-slate-400 dark:fill-slate-500 transition-all",
                        isHovered && "fill-sky-500 font-bold dark:fill-sky-400 text-[11px]"
                      )}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Summary Footer Pill */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400">
            Dönem Toplam Ciro: <strong className="font-mono text-slate-900 dark:text-slate-100 font-bold">₺{totalRev.toLocaleString("tr-TR")}</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight size={13} /> Net Kâr: <strong className="font-mono font-bold">₺{totalProfit.toLocaleString("tr-TR")}</strong>
          </span>
        </div>

        <span className="text-[11px] text-slate-400">
          Grafik üzerindeki noktalara gelerek günlük detayları görebilirsiniz.
        </span>
      </div>
    </Card>
  )
}
