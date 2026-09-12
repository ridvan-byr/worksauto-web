"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function DynamicFavicon() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!resolvedTheme) return
    const isDark = resolvedTheme === "dark"
    const targetIcon = isDark
      ? "/brand/favicon-white-32x32.png"
      : "/brand/favicon-32x32.png"

    // 1. Remove conflicting static icon links so the browser clears its internal icon cache
    const existingIcons = document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon']:not(#worksauto-dynamic-favicon)"
    )
    existingIcons.forEach((el) => el.remove())

    // 2. Re-create or update our dedicated managed favicon link
    let managedLink = document.getElementById("worksauto-dynamic-favicon") as HTMLLinkElement | null

    if (!managedLink) {
      managedLink = document.createElement("link")
      managedLink.id = "worksauto-dynamic-favicon"
      managedLink.rel = "icon"
      managedLink.type = "image/png"
      managedLink.sizes = "32x32"
      document.head.appendChild(managedLink)
    }

    // Changing the href with cache-busting timestamp forces browser tab to re-render the icon immediately
    managedLink.href = `${targetIcon}?v=${isDark ? "dark" : "light"}-${Date.now()}`
  }, [resolvedTheme])

  return null
}
