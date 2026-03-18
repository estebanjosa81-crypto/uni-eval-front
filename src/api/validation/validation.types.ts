/**
 * Tipos de validacion genericos para el front
 */

export interface ValidationIssue {
  field: string;
  message: string;
  errors?: string[];
  rules?: Record<string, any>;
  note?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  message?: string;
}

export type Validator<T, C = any> = (data: T, context?: C) => ValidationResult | null;
