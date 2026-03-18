"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { X, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full"
export type ModalVariant = "default" | "info" | "success" | "warning" | "error"

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  icon?: LucideIcon
  variant?: ModalVariant
  size?: ModalSize
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
  children: React.ReactNode
  footer?: React.ReactNode
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-2xl",
  full: "max-w-[95vw]",
}

const variantConfig: Record<ModalVariant, {
  iconBg: string
  iconColor: string
  borderColor: string
}> = {
  default: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-slate-200",
  },
  info: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-slate-200",
  },
  success: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-slate-200",
  },
  warning: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-slate-200",
  },
  error: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderColor: "border-slate-200",
  },
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  variant = "default",
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  children,
  footer,
  headerClassName,
  contentClassName,
  footerClassName,
}: BaseModalProps) {
  const config = variantConfig[variant]

  const handleOpenChange = (open: boolean) => {
    if (!open && closeOnOverlayClick) {
      onClose()
    } else if (!open && !closeOnOverlayClick) {
      // No hacer nada si closeOnOverlayClick es false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          sizeClasses[size],
          "flex flex-col gap-0 p-0 overflow-hidden max-h-[90vh] rounded-[2.5rem] border-slate-100 bg-white shadow-2xl",
          className
        )}
        onPointerDownOutside={(e) => {
          if (!closeOnOverlayClick) {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnOverlayClick) {
            e.preventDefault()
          }
        }}
      >
        {/* Header */}
        {(title || Icon) && (
          <DialogHeader className={cn(
            "relative flex-shrink-0 border-b bg-white p-8 overflow-hidden",
            config.borderColor,
            headerClassName
          )}>
            {Icon && (
              <div className="absolute right-0 top-0 p-8 opacity-[0.03] pointer-events-none">
                <Icon className="h-24 w-24 text-indigo-900" />
              </div>
            )}
            <div className="flex items-start gap-4">
              {Icon && (
                <div className={cn(
                  "flex items-center justify-center h-14 w-14 rounded-[1.5rem] border shadow-sm flex-shrink-0",
                  config.iconBg,
                  config.borderColor
                )}>
                  <Icon className={cn("h-7 w-7", config.iconColor)} />
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <DialogTitle className="text-2xl font-black italic tracking-tight leading-none mb-2 text-slate-900 uppercase">
                    {title}
                  </DialogTitle>
                )}
                {description && (
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
        )}

        {/* Content */}
        <div className={cn(
          "flex-1 min-h-0 p-8 bg-slate-50/30 overflow-y-auto custom-scrollbar",
          contentClassName
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <DialogFooter className={cn(
            "flex-shrink-0 p-6 border-t bg-white",
            config.borderColor,
            footerClassName
          )}>
            {footer}
          </DialogFooter>
        )}

        {/* Custom Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-6 top-6 h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all duration-300 group flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-slate-400 group-hover:text-slate-900 group-hover:rotate-90 transition-all" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
