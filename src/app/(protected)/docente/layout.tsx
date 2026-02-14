"use client"

import type React from "react"

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Contenido principal */}
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  )
}
