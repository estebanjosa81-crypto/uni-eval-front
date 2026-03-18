import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Evaluación INSITU",
  description: "Plataforma de evaluación docente universitaria",
  generator: "v0.dev",
  icons: {
    icon: [
      {
        url: "/icon/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon/favicon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/icon/apple-touch-icon.png",
  },
  manifest: "/icon/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}