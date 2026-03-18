/**
 * Validacion de payload para /eval/det/bulk
 */

import type { ValidationIssue, ValidationResult } from './validation.types';
import {
  getFieldRules,
  getValidationErrors,
  normalizeText,
  validateCommentContent,
} from './comment-rules';
import type { EvalDetBulkSaveRequest } from '../services/app/eval-det.service';

export interface EvalDetValidationContext {
  es_cmt_gen: boolean;
  es_cmt_gen_oblig: boolean;
  aspectos: Array<{
    id: number;
    es_cmt: boolean;
    es_cmt_oblig: boolean;
    opciones: Array<{ a_e_id: number }>;
  }>;
  existingItemComments?: Record<number, string[]>;
  existingGeneralComments?: string[];
}

interface CommentMeta {
  es_cmt: boolean;
  es_cmt_oblig: boolean;
}

function getCommentMetaByAeId(context: EvalDetValidationContext): Map<number, CommentMeta> {
  const map = new Map<number, CommentMeta>();
  context.aspectos.forEach((aspecto) => {
    aspecto.opciones.forEach((op) => {
      if (typeof op.a_e_id === 'number') {
        map.set(op.a_e_id, {
          es_cmt: Boolean(aspecto.es_cmt),
          es_cmt_oblig: Boolean(aspecto.es_cmt_oblig),
        });
      }
    });
  });
  return map;
}

export function validateEvalDetBulkSave(
  data: EvalDetBulkSaveRequest,
  context?: EvalDetValidationContext
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      issues: [{ field: 'body', message: 'Datos invalidos' }],
      message: 'Datos invalidos',
    };
  }

  if (!data.eval_id) {
    issues.push({ field: 'eval_id', message: 'eval_id es requerido' });
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    issues.push({ field: 'items', message: 'items es requerido y debe tener elementos' });
  }

  if (!context) {
    return {
      valid: issues.length === 0,
      issues,
      message: issues.length ? 'Validacion fallida' : undefined,
    };
  }

  const metaByAeId = getCommentMetaByAeId(context);
  const existingItemComments = context.existingItemComments || {};
  const existingGeneralComments = context.existingGeneralComments || [];

  const requestCommentMap = new Map<string, number[]>();

  data.items.forEach((item) => {
    const aeId = Number(item.a_e_id);
    if (!aeId) {
      issues.push({ field: 'a_e_id', message: 'a_e_id es requerido' });
      return;
    }

    const comment = (item.cmt ?? '').trim();
    if (!comment) return;

    const normalized = normalizeText(comment);
    if (!requestCommentMap.has(normalized)) {
      requestCommentMap.set(normalized, []);
    }
    requestCommentMap.get(normalized)?.push(aeId);
  });

  requestCommentMap.forEach((aeIds) => {
    if (aeIds.length > 1) {
      aeIds.forEach((aeId) => {
        issues.push({
          field: `cmt_${aeId}`,
          message: 'Comentario duplicado dentro de esta solicitud',
          note: 'Este comentario ya aparece en otras respuestas',
          rules: getFieldRules('item'),
        });
      });
    }
  });

  data.items.forEach((item) => {
    const aeId = Number(item.a_e_id);
    const meta = metaByAeId.get(aeId);
    if (!meta) return;

    const comment = (item.cmt ?? '').trim();
    const previousComments = existingItemComments[aeId] || [];

    if (meta.es_cmt_oblig && !comment) {
      issues.push({
        field: `cmt_${aeId}`,
        message: 'Comentario obligatorio',
        rules: getFieldRules('item'),
      });
      return;
    }

    if (!meta.es_cmt) {
      return;
    }

    if (comment) {
      const ok = validateCommentContent(comment, 'item', previousComments);
      if (!ok) {
        const errors = getValidationErrors(comment, 'item', previousComments);
        issues.push({
          field: `cmt_${aeId}`,
          message: 'Comentario invalido',
          errors,
          rules: getFieldRules('item'),
        });
      }
    }
  });

  const generalComment = (data.cmt_gen ?? '').trim();

  if (context.es_cmt_gen_oblig && !generalComment) {
    issues.push({
      field: 'cmt_gen',
      message: 'Comentario general obligatorio',
      rules: getFieldRules('general'),
    });
  }

  if (context.es_cmt_gen && generalComment) {
    const ok = validateCommentContent(generalComment, 'general', existingGeneralComments);
    if (!ok) {
      const errors = getValidationErrors(generalComment, 'general', existingGeneralComments);
      issues.push({
        field: 'cmt_gen',
        message: 'Comentario general invalido',
        errors,
        rules: getFieldRules('general'),
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    message: issues.length ? 'Validacion fallida' : undefined,
  };
}
