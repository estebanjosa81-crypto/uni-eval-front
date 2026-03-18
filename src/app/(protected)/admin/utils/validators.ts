/**
 * Validaciones Comunes
 * Reglas de validación reutilizables en formularios
 */

import { type ValidationRule } from '../hooks/useFormValidation'
import { INPUT_LIMITS, VALIDATION_MESSAGES } from '../constants'

/**
 * Validador de email
 */
export const emailValidator: ValidationRule = {
  validate: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  },
  message: VALIDATION_MESSAGES.EMAIL_INVALID
}

/**
 * Validador de campo requerido
 */
export const requiredValidator: ValidationRule = {
  validate: (value: any) => {
    if (typeof value === 'string') return value.trim().length > 0
    if (typeof value === 'number') return value !== 0
    return Boolean(value)
  },
  message: VALIDATION_MESSAGES.REQUIRED
}

/**
 * Crear validador de longitud mínima
 */
export function createMinLengthValidator(min: number): ValidationRule {
  return {
    validate: (value: string) => value?.length >= min,
    message: VALIDATION_MESSAGES.MIN_LENGTH(min)
  }
}

/**
 * Crear validador de longitud máxima
 */
export function createMaxLengthValidator(max: number): ValidationRule {
  return {
    validate: (value: string) => value?.length <= max,
    message: VALIDATION_MESSAGES.MAX_LENGTH(max)
  }
}

/**
 * Crear validador de rango
 */
export function createRangeValidator(min: number, max: number): ValidationRule {
  return {
    validate: (value: number) => value >= min && value <= max,
    message: `Debe estar entre ${min} y ${max}`
  }
}

/**
 * Validador para nombres español-friendly
 */
export const spanishNameValidator: ValidationRule = {
  validate: (value: string) => {
    const regex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-']+$/
    return regex.test(value.trim())
  },
  message: 'Solo se permiten letras, acentos, guiones y espacios'
}

/**
 * Validador de usuario (alfanumérico + guiones)
 */
export const usernameValidator: ValidationRule = {
  validate: (value: string) => {
    const regex = /^[a-zA-Z0-9_\-]+$/
    return regex.test(value.trim())
  },
  message: 'Solo se permiten letras, números, guiones y guiones bajos'
}

/**
 * Validador numérico
 */
export const numberValidator: ValidationRule = {
  validate: (value: any) => {
    const num = Number(value)
    return !isNaN(num) && isFinite(num)
  },
  message: VALIDATION_MESSAGES.NUMBER_INVALID
}

/**
 * Regla preconfigurada de nombre según límites
 */
export const createNameValidator = () => [
  requiredValidator,
  createMinLengthValidator(INPUT_LIMITS.NAME.min),
  createMaxLengthValidator(INPUT_LIMITS.NAME.max),
  spanishNameValidator
]

/**
 * Regla preconfigurada de descripción según límites
 */
export const createDescriptionValidator = () => [
  requiredValidator,
  createMinLengthValidator(INPUT_LIMITS.DESCRIPTION.min),
  createMaxLengthValidator(INPUT_LIMITS.DESCRIPTION.max)
]

/**
 * Regla preconfigurada de email
 */
export const createEmailValidator = () => [
  requiredValidator,
  emailValidator,
  createMaxLengthValidator(INPUT_LIMITS.EMAIL.max)
]

/**
 * Regla preconfigurada de username
 */
export const createUsernameValidator = () => [
  requiredValidator,
  createMinLengthValidator(INPUT_LIMITS.USERNAME.min),
  createMaxLengthValidator(INPUT_LIMITS.USERNAME.max),
  usernameValidator
]

/**
 * Validador condicional
 */
export function createConditionalValidator(
  condition: boolean,
  rule: ValidationRule
): ValidationRule {
  return {
    validate: (value) => !condition || rule.validate(value),
    message: rule.message
  }
}

/**
 * Validador de coincidencia de campos (para confirmación de contraseña, etc)
 */
export function createMatchValidator(
  fieldName: string,
  otherValue: string
): ValidationRule {
  return {
    validate: (value: string) => value === otherValue,
    message: `${fieldName} no coincide`
  }
}

/**
 * Validador personalizado
 */
export function createCustomValidator(
  validateFn: (value: any) => boolean,
  message: string
): ValidationRule {
  return {
    validate: validateFn,
    message
  }
}

/**
 * Colección de validaciones comúnmente usadas
 */
export const VALIDATION_SETS = {
  nombre: createNameValidator(),
  descripcion: createDescriptionValidator(),
  email: createEmailValidator(),
  username: createUsernameValidator(),
  required: [requiredValidator]
}
