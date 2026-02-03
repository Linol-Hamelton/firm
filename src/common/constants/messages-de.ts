/**
 * German (de) error messages.
 */

import type { ErrorCode } from '../types/result.js';
import type { MessageTemplate } from './messages.js';

function formatType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  return typeof value;
}

export const DE_MESSAGES: Record<ErrorCode, MessageTemplate> = {
  // Type errors
  INVALID_TYPE: ({ expected, received }) =>
    `Erwartet ${expected}, erhalten ${formatType(received)}`,
  NOT_STRING: 'String erwartet',
  NOT_NUMBER: 'Zahl erwartet',
  NOT_BOOLEAN: 'Boolescher Wert erwartet',
  NOT_OBJECT: 'Objekt erwartet',
  NOT_ARRAY: 'Array erwartet',
  NOT_DATE: 'Datum erwartet',
  NOT_UNDEFINED: 'undefined erwartet',
  NOT_NULL: 'null erwartet',
  NOT_BIGINT: 'BigInt erwartet',
  NOT_SYMBOL: 'Symbol erwartet',
  NOT_FUNCTION: 'Funktion erwartet',

  // String constraints
  STRING_TOO_SHORT: ({ min }) => `Muss mindestens ${min} Zeichen lang sein`,
  STRING_TOO_LONG: ({ max }) => `Darf höchstens ${max} Zeichen lang sein`,
  STRING_PATTERN_MISMATCH: ({ pattern }) => `Muss dem Muster entsprechen: ${pattern}`,
  STRING_INVALID_EMAIL: 'Ungültige E-Mail-Adresse',
  STRING_INVALID_URL: 'Ungültige URL',
  STRING_INVALID_UUID: 'Ungültige UUID',
  STRING_INVALID_CUID: 'Ungültige CUID',
  STRING_INVALID_EMOJI: 'Ungültiges Emoji',
  STRING_INVALID_IP: 'Ungültige IP-Adresse',
  STRING_INVALID_DATETIME: 'Ungültiges Datum und Uhrzeit',
  STRING_NOT_EMPTY: 'Darf nicht leer sein',
  STRING_STARTS_WITH: ({ expected }) => `Muss mit "${expected}" beginnen`,
  STRING_ENDS_WITH: ({ expected }) => `Muss mit "${expected}" enden`,
  STRING_INCLUDES: ({ expected }) => `Muss "${expected}" enthalten`,
  STRING_PATTERN_SECURITY_VIOLATION: 'Sicherheitsverletzung bei Mustervalidierung',

  // Number constraints
  NUMBER_TOO_SMALL: ({ min }) => `Muss mindestens ${min} sein`,
  NUMBER_TOO_BIG: ({ max }) => `Darf höchstens ${max} sein`,
  NUMBER_NOT_INTEGER: 'Muss eine ganze Zahl sein',
  NUMBER_NOT_POSITIVE: 'Muss positiv sein',
  NUMBER_NOT_NEGATIVE: 'Muss negativ sein',
  NUMBER_NOT_FINITE: 'Muss endlich sein',
  NUMBER_NOT_SAFE: 'Muss eine sichere ganze Zahl sein',
  NUMBER_NOT_MULTIPLE: ({ expected }) => `Muss ein Vielfaches von ${expected} sein`,

  // Array constraints
  ARRAY_TOO_SHORT: ({ min }) => `Muss mindestens ${min} Elemente haben`,
  ARRAY_TOO_LONG: ({ max }) => `Darf höchstens ${max} Elemente haben`,
  ARRAY_NOT_EMPTY: 'Darf nicht leer sein',
  ARRAY_NOT_UNIQUE: 'Muss eindeutige Elemente haben',

  // Object constraints
  OBJECT_UNKNOWN_KEY: ({ key }) => `Unbekannter Schlüssel: ${key}`,
  OBJECT_MISSING_KEY: 'Erforderlicher Schlüssel fehlt',
  OBJECT_SECURITY_VIOLATION: 'Sicherheitsverletzung bei Objektvalidierung',

  // Union/Intersection
  UNION_NO_MATCH: 'Entspricht keinem der erlaubten Typen',
  INTERSECTION_CONFLICT: 'Konflikt bei Schnittmengenvalidierung',

  // Enum/Literal
  INVALID_ENUM_VALUE: ({ expected }) =>
    `Muss einer der folgenden Werte sein: ${Array.isArray(expected) ? expected.join(', ') : String(expected)}`,
  INVALID_LITERAL: ({ expected }) => `Muss genau ${expected} sein`,

  // Date constraints
  DATE_TOO_EARLY: ({ min }) => `Muss nach ${min} sein`,
  DATE_TOO_LATE: ({ max }) => `Muss vor ${max} sein`,

  // Custom
  CUSTOM_VALIDATION: 'Benutzerdefinierte Validierung fehlgeschlagen',

  // Refinement
  REFINEMENT_FAILED: 'Verfeinerung fehlgeschlagen',

  // Transform
  TRANSFORM_FAILED: 'Transformation fehlgeschlagen',

  // System/Unknown
  UNKNOWN_ERROR: 'Unbekannter Fehler',
} as const;