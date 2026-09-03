"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { restartPageAnimation } from "@/lib/animation"
import { cn } from "@/lib/utils"

interface BrandLogoProps {
  collapsed?: boolean
  className?: string
  href?: string
  priority?: boolean
  onClick?: (e?: React.MouseEvent) => void
}

export function BrandLogo({
  collapsed = false,
  className,
  href = "/",
  priority = true,
}: BrandLogoProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === "dark" : true

  const fullLogoSrc = isDark
    ? "/brand/worksauto-logo-white.png"
    : "/brand/worksauto-logo-dark.png"

  const iconSrc = isDark
    ? "/brand/worksauto-icon-white-tight.png"
    : "/brand/worksauto-icon-black-tight.png"

  const handleClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      restartPageAnimation()
    }
  }

  const content = (
    <div
      className={cn(
        "group relative flex items-center justify-center transition-all duration-300 ease-out",
        collapsed ? "w-12 h-12" : "h-11 w-full justify-start",
        className
      )}
    >
      {collapsed ? (
        <div className="relative w-10 h-8 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:rotate-[-2deg] group-hover:drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)] active:scale-95">
          <Image
            src={iconSrc}
            alt="WorksAuto"
            width={38}
            height={26}
            priority={priority}
            className="h-7 w-auto object-contain drop-shadow-sm transition-all duration-300"
          />
        </div>
      ) : (
        <div className="relative h-9 w-[175px] flex items-center overflow-hidden rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:scale-[1.02] active:scale-[0.99]">
          <Image
            src={fullLogoSrc}
            alt="WorksAuto Servis Paneli"
            width={175}
            height={36}
            priority={priority}
            className="h-9 w-auto object-contain object-left drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-[0_2px_12px_rgba(56,189,248,0.25)]"
          />
          <div className="pointer-events-none absolute -inset-full top-0 block -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:animate-shimmer" />
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl cursor-pointer select-none"
        title="WorksAuto Ana Sayfa"
      >
        {content}
      </Link>
    )
  }

  return content
}
