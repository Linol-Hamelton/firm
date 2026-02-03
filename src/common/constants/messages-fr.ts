/**
 * French (fr) error messages.
 */

import type { ErrorCode } from '../types/result.js';
import type { MessageTemplate } from './messages.js';

function formatType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return typeof value;
}

export const FR_MESSAGES: Record<ErrorCode, MessageTemplate> = {
  // Type errors
  INVALID_TYPE: ({ expected, received }) =>
    `Attendu ${expected}, reçu ${formatType(received)}`,
  NOT_STRING: 'Chaîne attendue',
  NOT_NUMBER: 'Nombre attendu',
  NOT_BOOLEAN: 'Booléen attendu',
  NOT_OBJECT: 'Objet attendu',
  NOT_ARRAY: 'Tableau attendu',
  NOT_DATE: 'Date attendue',
  NOT_UNDEFINED: 'undefined attendu',
  NOT_NULL: 'null attendu',
  NOT_BIGINT: 'BigInt attendu',
  NOT_SYMBOL: 'Symbole attendu',
  NOT_FUNCTION: 'Fonction attendue',

  // String constraints
  STRING_TOO_SHORT: ({ min }) => `Doit contenir au moins ${min} caractères`,
  STRING_TOO_LONG: ({ max }) => `Doit contenir au plus ${max} caractères`,
  STRING_PATTERN_MISMATCH: ({ pattern }) => `Doit correspondre au motif: ${pattern}`,
  STRING_INVALID_EMAIL: 'Adresse e-mail invalide',
  STRING_INVALID_URL: 'URL invalide',
  STRING_INVALID_UUID: 'UUID invalide',
  STRING_INVALID_CUID: 'CUID invalide',
  STRING_INVALID_EMOJI: 'Emoji invalide',
  STRING_INVALID_IP: 'Adresse IP invalide',
  STRING_INVALID_DATETIME: 'Date et heure invalides',
  STRING_NOT_EMPTY: 'Ne peut pas être vide',
  STRING_STARTS_WITH: ({ expected }) => `Doit commencer par "${expected}"`,
  STRING_ENDS_WITH: ({ expected }) => `Doit se terminer par "${expected}"`,
  STRING_INCLUDES: ({ expected }) => `Doit contenir "${expected}"`,
  STRING_PATTERN_SECURITY_VIOLATION: 'Violation de sécurité lors de la validation du motif',

  // Number constraints
  NUMBER_TOO_SMALL: ({ min }) => `Doit être au moins ${min}`,
  NUMBER_TOO_BIG: ({ max }) => `Doit être au plus ${max}`,
  NUMBER_NOT_INTEGER: 'Doit être un entier',
  NUMBER_NOT_POSITIVE: 'Doit être positif',
  NUMBER_NOT_NEGATIVE: 'Doit être négatif',
  NUMBER_NOT_FINITE: 'Doit être fini',
  NUMBER_NOT_SAFE: 'Doit être un entier sûr',
  NUMBER_NOT_MULTIPLE: ({ expected }) => `Doit être un multiple de ${expected}`,

  // Array constraints
  ARRAY_TOO_SHORT: ({ min }) => `Doit contenir au moins ${min} éléments`,
  ARRAY_TOO_LONG: ({ max }) => `Doit contenir au plus ${max} éléments`,
  ARRAY_NOT_EMPTY: 'Ne peut pas être vide',
  ARRAY_NOT_UNIQUE: 'Doit avoir des éléments uniques',

  // Object constraints
  OBJECT_UNKNOWN_KEY: ({ key }) => `Clé inconnue: ${key}`,
  OBJECT_MISSING_KEY: 'Clé requise manquante',
  OBJECT_SECURITY_VIOLATION: 'Violation de sécurité lors de la validation d\'objet',

  // Union/Intersection
  UNION_NO_MATCH: 'Ne correspond à aucun des types autorisés',
  INTERSECTION_CONFLICT: 'Conflit lors de la validation d\'intersection',

  // Enum/Literal
  INVALID_ENUM_VALUE: ({ expected }) =>
    `Doit être l'une des valeurs suivantes: ${Array.isArray(expected) ? expected.join(', ') : String(expected)}`,
  INVALID_LITERAL: ({ expected }) => `Doit être exactement ${expected}`,

  // Date constraints
  DATE_TOO_EARLY: ({ min }) => `Doit être après ${min}`,
  DATE_TOO_LATE: ({ max }) => `Doit être avant ${max}`,

  // Custom
  CUSTOM_VALIDATION: 'Validation personnalisée échouée',

  // Refinement
  REFINEMENT_FAILED: 'Affinement échoué',

  // Transform
  TRANSFORM_FAILED: 'Transformation échouée',

  // System/Unknown
  UNKNOWN_ERROR: 'Erreur inconnue',
} as const;