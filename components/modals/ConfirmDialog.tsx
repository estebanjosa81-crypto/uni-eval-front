"use client"

import * as React from "react"
import { BaseModal, ModalVariant } from "./BaseModal"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, AlertCircle, Info, CheckCircle2, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ConfirmDialogAction = "delete" | "warning" | "info" | "success" | "custom"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  action?: ConfirmDialogAction
  variant?: ModalVariant
  icon?: LucideIcon
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  loadingText?: string
  showWarningBanner?: boolean
  warningBannerText?: string
  confirmButtonVariant?: "default" | "destructive" | "outline" | "secondary"
  customFooter?: React.ReactNode
}

const actionConfig: Record<ConfirmDialogAction, {
  icon: LucideIcon
  variant: ModalVariant
  confirmText: string
  confirmVariant: "default" | "destructive" | "outline" | "secondary"
  warningBanner: boolean
}> = {
  delete: {
    icon: AlertTriangle,
    variant: "error",
    confirmText: "Eliminar",
    confirmVariant: "destructive",
    warningBanner: true,
  },
  warning: {
    icon: AlertCircle,
    variant: "warning",
    confirmText: "Continuar",
    confirmVariant: "default",
    warningBanner: true,
  },
  info: {
    icon: Info,
    variant: "info",
    confirmText: "Entendido",
    confirmVariant: "default",
    warningBanner: false,
  },
  success: {
    icon: CheckCircle2,
    variant: "success",
    confirmText: "Aceptar",
    confirmVariant: "default",
    warningBanner: false,
  },
  custom: {
    icon: Info,
    variant: "default",
    confirmText: "Confirmar",
    confirmVariant: "default",
    warningBanner: false,
  },
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  action = "warning",
  variant,
  icon,
  confirmText,
  cancelText = "Cancelar",
  isLoading = false,
  loadingText = "Procesando...",
  showWarningBanner,
  warningBannerText = "⚠️ Esta acción no se puede deshacer.",
  confirmButtonVariant,
  customFooter,
}: ConfirmDialogProps) {
  const config = actionConfig[action]
  const [isProcessing, setIsProcessing] = React.useState(false)

  const finalVariant = variant || config.variant
  const finalIcon = icon || config.icon
  const finalConfirmText = confirmText || config.confirmText
  const finalConfirmVariant = confirmButtonVariant || config.confirmVariant
  const finalShowWarning = showWarningBanner ?? config.warningBanner

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  const loading = isLoading || isProcessing

  const variantWarningStyles: Record<ModalVariant, string> = {
    default: "border-slate-200 bg-slate-50",
    info: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    warning: "border-amber-200 bg-amber-50",
    error: "border-rose-200 bg-rose-50",
  }

  const variantWarningTextStyles: Record<ModalVariant, string> = {
    default: "text-slate-700",
    info: "text-blue-700",
    success: "text-green-700",
    warning: "text-amber-700",
    error: "text-rose-700",
  }

  const footer = customFooter || (
    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={loading}
        className="flex-1 sm:flex-none"
      >
        {cancelText}
      </Button>
      <Button
        type="button"
        variant={finalConfirmVariant}
        onClick={handleConfirm}
        disabled={loading}
        className="flex-1 sm:flex-none"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            {loadingText}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {action === "delete" && <Trash2 className="h-4 w-4" />}
            {finalConfirmText}
          </div>
        )}
      </Button>
    </div>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={finalIcon}
      variant={finalVariant}
      size="md"
      footer={footer}
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
    >
      <div className="space-y-4">
        {finalShowWarning && (
          <div className={cn(
            "rounded-lg border-2 p-4",
            variantWarningStyles[finalVariant]
          )}>
            <p className={cn(
              "text-sm font-semibold",
              variantWarningTextStyles[finalVariant]
            )}>
              {warningBannerText}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  )
}
