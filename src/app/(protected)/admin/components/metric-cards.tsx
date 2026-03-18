'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, UserCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SummaryMetrics } from '@/src/api/services/metric/metric.service'
import { formatNumber, formatPercentage } from '../utils'
import { createModuleLogger } from '../lib/logger'

const logger = createModuleLogger('MetricCards')

interface MetricCardsProps {
  data: SummaryMetrics['generales'] | null | undefined
}

interface MetricStatus {
  label: 'Crítico' | 'Bajo' | 'Medio' | 'Óptimo'
  badgeClassName: string
}

interface MetricCardProps {
  title: string
  icon: LucideIcon
  completed: number
  total: number
  pending: number
  accentClassName: string
}

/**
 * Obtener estado y color del badge según porcentaje
 */
function getMetricStatus(percentage: number): MetricStatus {
  if (percentage <= 0) {
    return {
      label: 'Crítico',
      badgeClassName: 'bg-red-100 text-red-700 border-red-200'
    }
  }

  if (percentage < 30) {
    return {
      label: 'Bajo',
      badgeClassName: 'bg-orange-100 text-orange-700 border-orange-200'
    }
  }

  if (percentage < 70) {
    return {
      label: 'Medio',
      badgeClassName: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  return {
    label: 'Óptimo',
    badgeClassName: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
}

/**
 * Tarjeta individual de métrica
 */
function MetricCard({
  title,
  icon: Icon,
  completed,
  total,
  pending,
  accentClassName
}: MetricCardProps) {
  const percentage = formatPercentage(completed, total)
  const status = getMetricStatus(percentage)
  const progressWidth = `${Math.min(Math.max(percentage, 0), 100)}%`

  return (
    <Card className='min-h-[280px] rounded-[2.5rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5'>
      <CardContent className='p-7 md:p-8'>
        {/* Header */}
        <div className='mb-6 flex items-start justify-between gap-3'>
          <h3 className='text-base font-semibold text-slate-700 tracking-tight'>
            {title}
          </h3>
          <div className='rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-500'>
            <Icon className='h-5 w-5' />
          </div>
        </div>

        {/* Percentage */}
        <div className='mb-2 text-5xl font-semibold leading-none tracking-tight text-slate-900 md:text-6xl'>
          {percentage.toFixed(2)}%
        </div>

        {/* Completed/Total */}
        <p className='mb-6 text-base text-slate-500'>
          {formatNumber(completed)} de {formatNumber(total)} completadas
        </p>

        {/* Progress Bar */}
        <div className='mb-5 h-3 w-full overflow-hidden rounded-full bg-slate-100'>
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${accentClassName}`}
            style={{ width: progressWidth }}
          />
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-3'>
          <p className='text-base font-medium text-red-600'>
            {formatNumber(pending)} pendientes
          </p>
          <Badge
            variant='outline'
            className={status.badgeClassName}
          >
            {status.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente Metric Cards - Resumen de evaluaciones
 * Muestra métricas de evaluaciones, estudiantes y docentes
 */
export default function MetricCards({ data }: MetricCardsProps) {
  if (!data) {
    logger.debug('No hay datos de métricas para mostrar')
    return null
  }

  // Evaluaciones
  const totalEvaluaciones = data.total_evaluaciones || 0
  const totalRealizadas = data.total_realizadas || 0
  const totalPendientesEvaluaciones =
    data.total_pendientes ??
    Math.max(totalEvaluaciones - totalRealizadas, 0)

  // Estudiantes
  const totalEstudiantes = data.total_estudiantes || 0
  const estudiantesPendientes = data.total_estudiantes_pendientes || 0
  const estudiantesCompletados = Math.max(
    totalEstudiantes - estudiantesPendientes,
    0
  )

  // Docentes
  const totalDocentes = data.total_docentes || 0
  const docentesPendientes = data.total_docentes_pendientes || 0
  const docentesCompletados = Math.max(
    totalDocentes - docentesPendientes,
    0
  )

  const metrics: MetricCardProps[] = [
    {
      title: 'Evaluaciones',
      icon: ClipboardList,
      completed: totalRealizadas,
      total: totalEvaluaciones,
      pending: totalPendientesEvaluaciones,
      accentClassName: 'bg-indigo-500'
    },
    {
      title: 'Población Estudiantil',
      icon: Users,
      completed: estudiantesCompletados,
      total: totalEstudiantes,
      pending: estudiantesPendientes,
      accentClassName: 'bg-blue-500'
    },
    {
      title: 'Cátedra Docente',
      icon: UserCheck,
      completed: docentesCompletados,
      total: totalDocentes,
      pending: docentesPendientes,
      accentClassName: 'bg-emerald-500'
    }
  ]

  return (
    <div className='grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3'>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          {...metric}
        />
      ))}
    </div>
  )
}
