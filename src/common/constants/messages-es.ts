/**
 * Spanish (es) error messages.
 */

import type { ErrorCode } from '../types/result.js';
import type { MessageTemplate } from './messages.js';

function formatType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return typeof value;
}

export const ES_MESSAGES: Record<ErrorCode, MessageTemplate> = {
  // Type errors
  INVALID_TYPE: ({ expected, received }) =>
    `Se esperaba ${expected}, se recibió ${formatType(received)}`,
  NOT_STRING: 'Se esperaba una cadena',
  NOT_NUMBER: 'Se esperaba un número',
  NOT_BOOLEAN: 'Se esperaba un booleano',
  NOT_OBJECT: 'Se esperaba un objeto',
  NOT_ARRAY: 'Se esperaba un arreglo',
  NOT_DATE: 'Se esperaba una fecha',
  NOT_UNDEFINED: 'Se esperaba undefined',
  NOT_NULL: 'Se esperaba null',
  NOT_BIGINT: 'Se esperaba un BigInt',
  NOT_SYMBOL: 'Se esperaba un símbolo',
  NOT_FUNCTION: 'Se esperaba una función',

  // String constraints
  STRING_TOO_SHORT: ({ min }) => `Debe tener al menos ${min} caracteres`,
  STRING_TOO_LONG: ({ max }) => `Debe tener como máximo ${max} caracteres`,
  STRING_PATTERN_MISMATCH: ({ pattern }) => `Debe coincidir con el patrón: ${pattern}`,
  STRING_INVALID_EMAIL: 'Dirección de correo electrónico inválida',
  STRING_INVALID_URL: 'URL inválida',
  STRING_INVALID_UUID: 'UUID inválido',
  STRING_INVALID_CUID: 'CUID inválido',
  STRING_INVALID_EMOJI: 'Emoji inválido',
  STRING_INVALID_IP: 'Dirección IP inválida',
  STRING_INVALID_DATETIME: 'Fecha y hora inválidas',
  STRING_NOT_EMPTY: 'No puede estar vacío',
  STRING_STARTS_WITH: ({ expected }) => `Debe comenzar con "${expected}"`,
  STRING_ENDS_WITH: ({ expected }) => `Debe terminar con "${expected}"`,
  STRING_INCLUDES: ({ expected }) => `Debe contener "${expected}"`,
  STRING_PATTERN_SECURITY_VIOLATION: 'Violación de seguridad en validación de patrón',

  // Number constraints
  NUMBER_TOO_SMALL: ({ min }) => `Debe ser al menos ${min}`,
  NUMBER_TOO_BIG: ({ max }) => `Debe ser como máximo ${max}`,
  NUMBER_NOT_INTEGER: 'Debe ser un número entero',
  NUMBER_NOT_POSITIVE: 'Debe ser positivo',
  NUMBER_NOT_NEGATIVE: 'Debe ser negativo',
  NUMBER_NOT_FINITE: 'Debe ser finito',
  NUMBER_NOT_SAFE: 'Debe ser un entero seguro',
  NUMBER_NOT_MULTIPLE: ({ expected }) => `Debe ser múltiplo de ${expected}`,

  // Array constraints
  ARRAY_TOO_SHORT: ({ min }) => `Debe tener al menos ${min} elementos`,
  ARRAY_TOO_LONG: ({ max }) => `Debe tener como máximo ${max} elementos`,
  ARRAY_NOT_EMPTY: 'No puede estar vacío',
  ARRAY_NOT_UNIQUE: 'Debe tener elementos únicos',

  // Object constraints
  OBJECT_UNKNOWN_KEY: ({ key }) => `Clave desconocida: ${key}`,
  OBJECT_MISSING_KEY: 'Falta una clave requerida',
  OBJECT_SECURITY_VIOLATION: 'Violación de seguridad en validación de objeto',

  // Union/Intersection
  UNION_NO_MATCH: 'No coincide con ninguno de los tipos permitidos',
  INTERSECTION_CONFLICT: 'Conflicto en validación de intersección',

  // Enum/Literal
  INVALID_ENUM_VALUE: ({ expected }) =>
    `Debe ser uno de los siguientes valores: ${Array.isArray(expected) ? expected.join(', ') : String(expected)}`,
  INVALID_LITERAL: ({ expected }) => `Debe ser exactamente ${expected}`,

  // Date constraints
  DATE_TOO_EARLY: ({ min }) => `Debe ser después de ${min}`,
  DATE_TOO_LATE: ({ max }) => `Debe ser antes de ${max}`,

  // Custom
  CUSTOM_VALIDATION: 'Validación personalizada fallida',

  // Refinement
  REFINEMENT_FAILED: 'Refinamiento fallido',

  // Transform
  TRANSFORM_FAILED: 'Transformación fallida',

  // System/Unknown
  UNKNOWN_ERROR: 'Error desconocido',
} as const;