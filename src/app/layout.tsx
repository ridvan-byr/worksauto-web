import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { AuthProvider } from "@/features/auth/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { DynamicFavicon } from "@/components/dynamic-favicon"
import { Toaster } from "@/components/ui/sonner"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "WorksAuto | Yeni Nesil Araç Servis Paneli",
  description:
    "Araç servisleri ve atölyeler için çok kiracılı (multi-tenant) randevu, iş emri, stok ve cari yönetim platformu.",
  icons: {
    icon: [
      { url: "/brand/favicon.ico" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/brand/site.webmanifest",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Official Next.js Server-Side Cookie reading (Zero hydration mismatch, zero raw script tags)
  const cookieStore = await cookies()
  const defaultCollapsed =
    cookieStore.get("worksauto_sidebar_collapsed")?.value === "true"

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased selection:bg-sky-500 selection:text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <DynamicFavicon />
          <QueryProvider>
            <AuthProvider>
              <AppShell defaultCollapsed={defaultCollapsed}>{children}</AppShell>
            </AuthProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
