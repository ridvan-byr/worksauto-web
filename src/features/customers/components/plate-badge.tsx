import * as React from "react"
import { cn } from "@/lib/utils"

interface PlateBadgeProps {
  plate: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function PlateBadge({ plate, size = "md", className }: PlateBadgeProps) {
  const formatted = plate.toUpperCase().trim()

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md sm:rounded-lg border-2 border-slate-900 dark:border-slate-300 bg-white text-slate-950 font-mono font-black tracking-wider shadow-xs overflow-hidden select-none whitespace-nowrap shrink-0",
        size === "xs" && "h-5 text-[10px] px-0.5",
        size === "sm" && "h-6 text-[11px] px-0.5",
        size === "md" && "h-7 text-xs px-1",
        size === "lg" && "h-9 text-sm px-1.5",
        className
      )}
    >
      {/* Blue TR Band */}
      <div
        className={cn(
          "bg-[#003399] text-white flex flex-col items-center justify-center font-sans font-bold -ml-1 mr-1.5 h-full shrink-0",
          size === "xs" && "w-3.5 px-0.5 text-[7px]",
          size === "sm" && "w-4 px-0.5 text-[8px]",
          size === "md" && "w-5 px-0.5 text-[9px]",
          size === "lg" && "w-6 px-1 text-[10px]"
        )}
      >
        <span className="leading-none scale-75 opacity-90">★</span>
        <span className="leading-none mt-0.5">TR</span>
      </div>

      {/* Plate Letters - strictly whitespace-nowrap */}
      <span className="pr-1.5 tracking-wider text-slate-900 font-extrabold whitespace-nowrap leading-none">
        {formatted}
      </span>
    </div>
  )
}
