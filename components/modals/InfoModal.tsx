"use client"

import * as React from "react"
import { BaseModal, ModalSize, ModalVariant } from "./BaseModal"
import { Button } from "@/components/ui/button"
import { X, LucideIcon } from "lucide-react"

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: LucideIcon
  variant?: ModalVariant
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
  showCloseButton?: boolean
  closeButtonText?: string
  className?: string
  contentClassName?: string
  footerClassName?: string
}

export function InfoModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  variant = "info",
  size = "lg",
  children,
  footer,
  showCloseButton = true,
  closeButtonText = "Cerrar",
  className,
  contentClassName,
  footerClassName,
}: InfoModalProps) {
  const defaultFooter = (
    <div className="flex justify-end w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="min-w-[100px]"
      >
        {closeButtonText}
      </Button>
    </div>
  )

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      variant={variant}
      size={size}
      footer={footer || defaultFooter}
      showCloseButton={showCloseButton}
      className={className}
      contentClassName={contentClassName}
      footerClassName={footerClassName}
    >
      {children}
    </BaseModal>
  )
}
