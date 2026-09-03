import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sky-500 text-white dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-300",
        destructive:
          "border-transparent bg-red-500 text-white dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
        success:
          "border-transparent bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
        warning:
          "border-transparent bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
        outline: "text-slate-950 dark:text-slate-50 border-slate-300 dark:border-slate-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
