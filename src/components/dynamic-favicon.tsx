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

    // Find or create our dedicated managed favicon link
    let managedLink = document.getElementById("worksauto-dynamic-favicon") as HTMLLinkElement | null

    if (!managedLink) {
      managedLink = document.createElement("link")
      managedLink.id = "worksauto-dynamic-favicon"
      managedLink.rel = "icon"
      managedLink.type = "image/png"
      managedLink.sizes = "32x32"
      document.head.appendChild(managedLink)
    }

    managedLink.href = `${targetIcon}?v=${isDark ? 'dark' : 'light'}`

    // Also update any existing icon links in-place WITHOUT removing them from DOM
    const existingLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']")
    existingLinks.forEach((link) => {
      if (link.id !== "worksauto-dynamic-favicon") {
        link.href = `${targetIcon}?v=${isDark ? 'dark' : 'light'}`
      }
    })
  }, [resolvedTheme])

  return null
}
