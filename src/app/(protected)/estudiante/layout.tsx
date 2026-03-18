"use client"

import type React from "react"
import { Header } from "./components/Header"

export default function EstudianteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="">
      {/* Header fijo */}
      <Header />

      {/* Contenido principal con margen para evitar solapamiento con el header */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
