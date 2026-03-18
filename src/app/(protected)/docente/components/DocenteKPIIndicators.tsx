'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface DocenteKPIIndicatorsProps {
  totalEvaluaciones: number;
  totalRealizadas: number;
  totalPendientes: number;
  porcentajeCumplimiento: number;
}

export function DocenteKPIIndicators({
  totalEvaluaciones,
  totalRealizadas,
  totalPendientes,
  porcentajeCumplimiento,
}: DocenteKPIIndicatorsProps) {
  const kpis = [
    {
      title: 'Total Evaluaciones',
      value: totalEvaluaciones,
      icon: <BookOpen className="h-5 w-5" />,
      variant: 'default' as const,
    },
    {
      title: 'Realizadas',
      value: totalRealizadas,
      icon: <CheckCircle className="h-5 w-5" />,
      variant: 'success' as const,
    },
    {
      title: 'Pendientes',
      value: totalPendientes,
      icon: <Clock className="h-5 w-5" />,
      variant: 'warning' as const,
    },
    {
      title: '% Cumplimiento',
      value: `${porcentajeCumplimiento}%`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'info' as const,
      hasProgress: true,
      progress: porcentajeCumplimiento,
    },
  ];

  const variantStyles = {
    default: 'border-gray-200 bg-gray-50/50',
    success: 'border-green-200 bg-green-50/50',
    warning: 'border-orange-200 bg-orange-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  };

  const textColorVariants = {
    default: 'text-gray-700',
    success: 'text-green-700',
    warning: 'text-orange-700',
    info: 'text-blue-700',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className={variantStyles[kpi.variant]}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <div className={textColorVariants[kpi.variant]}>
              {kpi.icon}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.hasProgress && kpi.progress !== undefined && (
              <Progress value={kpi.progress} className="h-2" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
