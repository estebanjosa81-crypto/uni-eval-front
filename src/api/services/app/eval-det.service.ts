/**
 * Servicio para Evaluación Detalle
 * Acceso a endpoints /eval/det según Swagger especificado
 */

import { BaseService } from '../../core/BaseService';
import type { ApiResponse } from '../../types/api.types';
import { validateEvalDetBulkSave } from '../../validation/eval-det.validation';
import type { EvalDetValidationContext } from '../../validation/eval-det.validation';

export interface EvaluacionDetalle {
  id: number;
  eval_id: number;
  a_e_id: number;
  cmt: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
}

export interface CreateEvaluacionDetalleInput {
  eval_id: number;
  a_e_id: number;
  cmt: string | null;
}

export interface UpdateEvaluacionDetalleInput {
  eval_id?: number;
  a_e_id?: number;
  cmt?: string | null;
}

export interface EvalDetBulkItem {
  a_e_id: number;
  cmt?: string | null;
}

export interface EvalDetBulkSaveRequest {
  eval_id: number;
  items: EvalDetBulkItem[];
  cmt_gen?: string | null;
}

export interface EvalDetBulkSaveResponse {
  message: string;
  data: {
    count: number;
  };
}

class EvaluacionDetalleService extends BaseService<
  EvaluacionDetalle,
  CreateEvaluacionDetalleInput,
  UpdateEvaluacionDetalleInput
> {
  constructor() {
    super('/eval/det', {
      validators: {
        bulk: validateEvalDetBulkSave,
      },
    });
  }

  /**
   * Guarda en bulk respuestas y comentarios
   * POST /eval/det/bulk
   */
  async bulkSave(
    data: EvalDetBulkSaveRequest,
    context?: EvalDetValidationContext
  ): Promise<ApiResponse<EvalDetBulkSaveResponse>> {
    return this.executeAsync(
      () => this.bulkCreate(data, { validationContext: context }),
      { message: 'Error al guardar evaluaciones', data: { count: 0 } }
    );
  }
}

export const evaluacionDetalleService = new EvaluacionDetalleService();
