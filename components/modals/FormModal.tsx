"use client"

import * as React from "react"
import { BaseModal, ModalSize } from "./BaseModal"
import { Button } from "@/components/ui/button"
import { Save, Plus, Edit3, LucideIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type FormModalMode = "create" | "edit" | "view"

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  mode?: FormModalMode
  title?: string
  icon?: LucideIcon
  size?: ModalSize
  submitText?: string
  cancelText?: string
  isLoading?: boolean
  loadingText?: string
  showCancelButton?: boolean
  children: React.ReactNode
  customFooter?: React.ReactNode
  formId?: string
  className?: string
  contentClassName?: string
  footerClassName?: string
  disableSubmit?: boolean
  additionalButtons?: React.ReactNode
}

const modeConfig: Record<FormModalMode, {
  icon: LucideIcon
  defaultTitle: string
  submitText: string
}> = {
  create: {
    icon: Plus,
    defaultTitle: "Crear",
    submitText: "Crear",
  },
  edit: {
    icon: Edit3,
    defaultTitle: "Editar",
    submitText: "Guardar Cambios",
  },
  view: {
    icon: Edit3,
    defaultTitle: "Ver Detalles",
    submitText: "Cerrar",
  },
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "create",
  title,
  icon,
  size = "lg",
  submitText,
  cancelText = "Cancelar",
  isLoading = false,
  loadingText = "Guardando...",
  showCancelButton = true,
  children,
  customFooter,
  formId = "modal-form",
  className,
  contentClassName,
  footerClassName,
  disableSubmit = false,
  additionalButtons,
}: FormModalProps) {
  const config = modeConfig[mode]
  const [isProcessing, setIsProcessing] = React.useState(false)

  const finalTitle = title || config.defaultTitle
  const finalIcon = icon || config.icon
  const finalSubmitText = submitText || config.submitText

  const loading = isLoading || isProcessing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      await onSubmit(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const footer = customFooter || (
    <div className="flex w-full gap-4">
      <div className="flex flex-1 gap-4">
        {showCancelButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 rounded-2xl border-2 border-slate-200 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            {cancelText}
          </Button>
        )}
        {additionalButtons}
      </div>
      {mode !== "view" && (
        <Button
          type="submit"
          form={formId}
          disabled={loading || disableSubmit}
          className="flex-1 h-12 rounded-2xl bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {loadingText}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {finalSubmitText}
            </div>
          )}
        </Button>
      )}
    </div>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={finalTitle}
      icon={finalIcon}
      variant="default"
      size={size}
      footer={footer}
      closeOnOverlayClick={!loading}
      showCloseButton={!loading}
      className={className}
      contentClassName={cn("max-h-[calc(100vh-320px)]", contentClassName)}
      footerClassName={footerClassName}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {children}
      </form>
    </BaseModal>
  )
}
