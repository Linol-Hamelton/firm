/**
 * LAYER 0: Error Messages
 *
 * Default error messages for all validation errors.
 * Designed for i18n - can be replaced with custom message providers.
 *
 * Message format supports placeholders:
 * - {expected} - expected value/type
 * - {received} - actual value/type
 * - {min}, {max} - constraints
 * - {path} - field path
 */

import type { ErrorCode } from '../types/result.js';

// ============================================================================
// MESSAGE TEMPLATE TYPE
// ============================================================================

export type MessageTemplate = string | ((params: MessageParams) => string);

export interface MessageParams {
  expected?: unknown;
  received?: unknown;
  min?: number;
  max?: number;
  path?: string;
  pattern?: string;
  [key: string]: unknown;
}

// ============================================================================
// DEFAULT MESSAGES
// ============================================================================

export const DEFAULT_MESSAGES: Record<ErrorCode, MessageTemplate> = {
  // Type errors
  INVALID_TYPE: ({ expected, received }) =>
    `Expected ${expected}, received ${formatType(received)}`,
  NOT_STRING: 'Expected string',
  NOT_NUMBER: 'Expected number',
  NOT_BOOLEAN: 'Expected boolean',
  NOT_OBJECT: 'Expected object',
  NOT_ARRAY: 'Expected array',
  NOT_DATE: 'Expected date',
  NOT_UNDEFINED: 'Expected undefined',
  NOT_NULL: 'Expected null',
  NOT_BIGINT: 'Expected bigint',
  NOT_SYMBOL: 'Expected symbol',
  NOT_FUNCTION: 'Expected function',

  // String constraints
  STRING_TOO_SHORT: ({ min }) => `String must be at least ${min} characters`,
  STRING_TOO_LONG: ({ max }) => `String must be at most ${max} characters`,
  STRING_PATTERN_MISMATCH: ({ pattern }) => `String must match pattern: ${pattern}`,
  STRING_INVALID_EMAIL: 'Invalid email address',
  STRING_INVALID_URL: 'Invalid URL',
  STRING_INVALID_UUID: 'Invalid UUID',
  STRING_INVALID_CUID: 'Invalid CUID',
  STRING_INVALID_EMOJI: 'Invalid emoji',
  STRING_INVALID_IP: 'Invalid IP address',
  STRING_INVALID_DATETIME: 'Invalid datetime',
  STRING_NOT_EMPTY: 'String cannot be empty',
  STRING_STARTS_WITH: ({ expected }) => `String must start with "${expected}"`,
  STRING_ENDS_WITH: ({ expected }) => `String must end with "${expected}"`,
  STRING_INCLUDES: ({ expected }) => `String must include "${expected}"`,

  // Number constraints
  NUMBER_TOO_SMALL: ({ min }) => `Number must be at least ${min}`,
  NUMBER_TOO_BIG: ({ max }) => `Number must be at most ${max}`,
  NUMBER_NOT_INTEGER: 'Number must be an integer',
  NUMBER_NOT_POSITIVE: 'Number must be positive',
  NUMBER_NOT_NEGATIVE: 'Number must be negative',
  NUMBER_NOT_FINITE: 'Number must be finite',
  NUMBER_NOT_SAFE: 'Number must be a safe integer',
  NUMBER_NOT_MULTIPLE: ({ expected }) => `Number must be a multiple of ${expected}`,

  // Date constraints
  DATE_TOO_EARLY: ({ min }) => `Date must be after ${min}`,
  DATE_TOO_LATE: ({ max }) => `Date must be before ${max}`,

  // Array constraints
  ARRAY_TOO_SHORT: ({ min }) => `Array must have at least ${min} items`,
  ARRAY_TOO_LONG: ({ max }) => `Array must have at most ${max} items`,
  ARRAY_NOT_EMPTY: 'Array cannot be empty',
  ARRAY_NOT_UNIQUE: 'Array must have unique items',

  // Object constraints
  OBJECT_UNKNOWN_KEY: ({ received }) => `Unrecognized key: ${received}`,
  OBJECT_MISSING_KEY: ({ expected }) => `Missing required key: ${expected}`,

  // Union/Intersection
  UNION_NO_MATCH: 'Value does not match any union member',
  INTERSECTION_CONFLICT: 'Value does not satisfy all intersection members',

  // Enum/Literal
  INVALID_ENUM_VALUE: ({ expected }) => `Expected one of: ${formatOptions(expected)}`,
  INVALID_LITERAL: ({ expected }) => `Expected literal: ${formatLiteral(expected)}`,

  // Custom
  CUSTOM_VALIDATION: 'Custom validation failed',

  // Refinement
  REFINEMENT_FAILED: 'Refinement validation failed',

  // Transform
  TRANSFORM_FAILED: 'Transform failed',

  // System/Unknown
  UNKNOWN_ERROR: 'Unknown error occurred',
};

// ============================================================================
// MESSAGE RESOLUTION
// ============================================================================

/**
 * Resolve a message template with parameters.
 */
export function resolveMessage(
  code: ErrorCode,
  params: MessageParams = {},
  customMessages?: Partial<Record<ErrorCode, MessageTemplate>>
): string {
  const template = customMessages?.[code] ?? DEFAULT_MESSAGES[code];

  if (typeof template === 'function') {
    return template(params);
  }

  return template;
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function formatLiteral(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'bigint') return `${value}n`;
  return String(value);
}

function formatOptions(options: unknown): string {
  if (Array.isArray(options)) {
    return options.map(formatLiteral).join(', ');
  }
  return String(options);
}
