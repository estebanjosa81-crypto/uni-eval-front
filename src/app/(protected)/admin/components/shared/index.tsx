/**
 * Componentes Compartidos Reutilizables
 * Componentes comunes usados en múltiples secciones
 */

'use client'

import React from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/modals'

// ============================================================
// LoadingSpinner
// ============================================================

interface LoadingSpinnerProps {
  message?: string
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({
  message = 'Cargando...',
  fullScreen = false,
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const content = (
    <div className='flex flex-col items-center justify-center gap-3'>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {message && <p className='text-sm text-slate-600 font-medium'>{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50'>
        {content}
      </div>
    )
  }

  return content
}

// ============================================================
// EmptyState
// ============================================================

interface EmptyStateProps {
  icon?: React.ElementType | null
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = null,
  title,
  description,
  action = null
}: EmptyStateProps) {
  return (
    <Card className='border-dashed border-2 border-slate-200'>
      <CardContent className='p-8 text-center'>
        {Icon && <Icon className='h-12 w-12 mx-auto mb-4 text-slate-400' />}
        <h3 className='font-semibold text-lg mb-2 text-slate-900'>{title}</h3>
        {description && <p className='text-sm text-slate-600 mb-4'>{description}</p>}
        {action && <div className='flex justify-center'>{action}</div>}
      </CardContent>
    </Card>
  )
}

// ============================================================
// ErrorState
// ============================================================

interface ErrorStateProps {
  title?: string
  message: string
  retry?: (() => void) | null
}

export function ErrorState({
  title = 'Error',
  message,
  retry = null
}: ErrorStateProps) {
  return (
    <Card className='border-red-200 bg-red-50'>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4'>
          <AlertCircle className='h-6 w-6 text-red-600 mt-1 flex-shrink-0' />
          <div className='flex-1'>
            <h3 className='font-semibold text-red-900 mb-1'>{title}</h3>
            <p className='text-sm text-red-700 mb-3'>{message}</p>
            {retry && (
              <button
                onClick={retry}
                className='text-sm font-medium text-red-600 hover:text-red-700 underline'
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// StatusBadge
// ============================================================

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success'
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusColors = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200'
  }

  const dotColors = {
    active: 'bg-emerald-600',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-600',
    error: 'bg-red-600',
    success: 'bg-green-600'
  }

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${dotColors[status]}`} />
      {label}
    </span>
  )
}

// ============================================================
// ProgressBar
// ============================================================

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  color?: 'blue' | 'green' | 'red' | 'amber'
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  color = 'blue'
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    amber: 'bg-amber-600'
  }

  return (
    <div className='space-y-1'>
      <div className='w-full h-2 bg-slate-200 rounded-full overflow-hidden'>
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className='text-xs text-slate-600 font-medium'>{percentage}%</p>
      )}
    </div>
  )
}

// ============================================================
// SectionDivider
// ============================================================

interface SectionDividerProps {
  label?: string
}

export function SectionDivider({ label }: SectionDividerProps) {
  if (!label) {
    return <div className='my-6 h-px bg-slate-200' />
  }

  return (
    <div className='relative my-6'>
      <div className='absolute inset-0 flex items-center'>
        <div className='w-full border-t border-slate-200' />
      </div>
      <div className='relative flex justify-center text-sm'>
        <span className='px-2 bg-white text-slate-600 font-medium'>{label}</span>
      </div>
    </div>
  )
}

// ============================================================
// InfoBox
// ============================================================

interface InfoBoxProps {
  title?: string
  message: string
  type?: 'info' | 'warning' | 'success'
}

export function InfoBox({
  title,
  message,
  type = 'info'
}: InfoBoxProps) {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    success: 'bg-green-50 border-green-200 text-green-700'
  }

  return (
    <div className={`rounded-lg border p-4 ${typeClasses[type]}`}>
      {title && <p className='font-semibold mb-1'>{title}</p>}
      <p className='text-sm'>{message}</p>
    </div>
  )
}

// ============================================================
// ConfirmDeleteDialog
// ============================================================

interface ConfirmDeleteDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isDangerous?: boolean
}

export function ConfirmDeleteDialog({
  isOpen,
  title,
  description,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
  isDangerous = true
}: ConfirmDeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error en confirmación de eliminación:', error)
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      action={isDangerous ? 'delete' : 'warning'}
      variant={isDangerous ? 'error' : 'warning'}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
      loadingText={`${confirmText}...`}
    />
  )
}
