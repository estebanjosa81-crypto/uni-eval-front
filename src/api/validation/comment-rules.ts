/**
 * Reglas y helpers para validacion de comentarios
 */

export const allowedCommentCharsRegex = /^[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F10-9\s.,;:!?"'()\-/%]+$/;
const alphaNumericSpanishRegex = /^[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F10-9,.;:!?"'()\-\s]+$/;

export function alphaNumericSpanish(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return 'Debe ser texto';

  if (!alphaNumericSpanishRegex.test(value)) {
    return 'Solo se permiten letras, numeros, signos basicos y espacios';
  }

  return null;
}

export function looksGibberish(value: string): boolean {
  const s = (value || '').trim();
  if (!s) return true;
  if (/(.)\1{4,}/.test(s)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(s)) return true;

  const letters = (s.match(/[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/g) || []).length;
  const vowels = (s.match(/[aeiou\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC]/gi) || []).length;
  if (letters >= 8 && vowels / Math.max(letters, 1) < 0.25) return true;

  return false;
}

export function isAllowedChars(value: string): boolean {
  return allowedCommentCharsRegex.test(value);
}

export function normalizeText(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function isDuplicate(currentText: string, existingComments: string[] = []): boolean {
  const normalized = normalizeText(currentText);
  return existingComments.some((comment) => normalizeText(comment) === normalized);
}

export type CommentType = 'item' | 'general';

export function validateCommentContent(
  value: string,
  type: CommentType,
  existingComments: string[] = []
): boolean {
  const s = (value || '').trim();
  if (!s) return false;
  if (!isAllowedChars(s)) return false;
  if (looksGibberish(s)) return false;
  if (isDuplicate(s, existingComments)) return false;

  const vowels = (s.match(/[aeiou\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC]/gi) || []).length;
  const words = s
    .split(/\s+/)
    .filter((w) => /[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/.test(w));

  if (type === 'item') {
    if (s.length < 5 || s.length > 500) return false;
    if (vowels < 1) return false;
    return true;
  }

  if (type === 'general') {
    if (s.length < 15 || s.length > 2000) return false;
    if (words.length < 2) return false;
    if (vowels < 3) return false;
    return true;
  }

  return false;
}

export function getValidationErrors(
  value: string,
  type: CommentType,
  existingComments: string[] = []
): string[] {
  const s = (value || '').trim();
  const errors: string[] = [];

  if (!s) {
    errors.push('El campo no puede estar vacio');
    return errors;
  }

  const vowels = (s.match(/[aeiou\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC]/gi) || []).length;
  const words = s
    .split(/\s+/)
    .filter((w) => /[A-Za-z\u00C1\u00C9\u00CD\u00D3\u00DA\u00DC\u00D1\u00E1\u00E9\u00ED\u00F3\u00FA\u00FC\u00F1]/.test(w));

  if (!isAllowedChars(s)) {
    errors.push(
      'Contiene caracteres no permitidos. Solo se permiten: letras (incluyendo acentos), numeros, espacios y puntuacion basica (. , ; : ! ? " \' ( ) - / %)'
    );
  }

  if (looksGibberish(s)) {
    errors.push('El contenido parece gibberish: tiene caracteres repetidos excesivamente, muchas consonantes seguidas, o muy pocas vocales');
  }

  if (isDuplicate(s, existingComments)) {
    errors.push('Este comentario ya fue utilizado anteriormente. Por favor, escribe un comentario diferente');
  }

  if (type === 'item') {
    if (s.length < 5 || s.length > 500) {
      errors.push(`Largo invalido: debe tener entre 5 y 500 caracteres (actualmente tiene ${s.length})`);
    }
    if (vowels < 1) {
      errors.push('Debe contener al menos 1 vocal');
    }
  }

  if (type === 'general') {
    if (s.length < 15 || s.length > 2000) {
      errors.push(`Largo invalido: debe tener entre 15 y 2000 caracteres (actualmente tiene ${s.length})`);
    }
    if (words.length < 2) {
      errors.push(`Debe contener al menos 2 palabras (actualmente tiene ${words.length})`);
    }
    if (vowels < 3) {
      errors.push(`Debe contener al menos 3 vocales (actualmente tiene ${vowels})`);
    }
  }

  return errors;
}

export function getFieldRules(type: CommentType): Record<string, any> {
  if (type === 'item') {
    return {
      minLength: 5,
      maxLength: 500,
      minVowels: 1,
      noDuplicates: true,
      allowedChars: 'Letras espanolas, numeros, espacios y puntuacion: . , ; : ! ? " \' ( ) - / %',
      noGibberish: true,
    };
  }

  if (type === 'general') {
    return {
      minLength: 15,
      maxLength: 2000,
      minWords: 2,
      minVowels: 3,
      noDuplicates: true,
      allowedChars: 'Letras espanolas, numeros, espacios y puntuacion: . , ; : ! ? " \' ( ) - / %',
      noGibberish: true,
    };
  }

  return {};
}
