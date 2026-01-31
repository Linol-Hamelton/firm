/**
 * Russian (ru) error messages.
 */

import type { ErrorCode } from '../types/result.js';
import type { MessageTemplate } from './messages.js';

export const RU_MESSAGES: Record<ErrorCode, MessageTemplate> = {
  // Type errors
  INVALID_TYPE: ({ expected, received }) =>
    `Ожидался ${expected}, получен ${formatType(received)}`,
  NOT_STRING: 'Ожидалась строка',
  NOT_NUMBER: 'Ожидалось число',
  NOT_BOOLEAN: 'Ожидалось логическое значение',
  NOT_OBJECT: 'Ожидался объект',
  NOT_ARRAY: 'Ожидался массив',
  NOT_DATE: 'Ожидалась дата',
  NOT_UNDEFINED: 'Ожидалось undefined',
  NOT_NULL: 'Ожидалось null',
  NOT_BIGINT: 'Ожидалось большое целое число',
  NOT_SYMBOL: 'Ожидался символ',
  NOT_FUNCTION: 'Ожидалась функция',

  // String constraints
  STRING_TOO_SHORT: ({ min }) => `Строка должна содержать не менее ${min} символов`,
  STRING_TOO_LONG: ({ max }) => `Строка должна содержать не более ${max} символов`,
  STRING_PATTERN_MISMATCH: ({ pattern }) => `Строка должна соответствовать шаблону: ${pattern}`,
  STRING_INVALID_EMAIL: 'Неверный адрес электронной почты',
  STRING_INVALID_URL: 'Неверный URL',
  STRING_INVALID_UUID: 'Неверный UUID',
  STRING_INVALID_CUID: 'Неверный CUID',
  STRING_INVALID_EMOJI: 'Неверный эмодзи',
  STRING_INVALID_IP: 'Неверный IP-адрес',
  STRING_INVALID_DATETIME: 'Неверная дата и время',
  STRING_NOT_EMPTY: 'Строка не может быть пустой',
  STRING_STARTS_WITH: ({ expected }) => `Строка должна начинаться с "${expected}"`,
  STRING_ENDS_WITH: ({ expected }) => `Строка должна заканчиваться на "${expected}"`,
  STRING_INCLUDES: ({ expected }) => `Строка должна содержать "${expected}"`,

  // Number constraints
  NUMBER_TOO_SMALL: ({ min }) => `Число должно быть не менее ${min}`,
  NUMBER_TOO_BIG: ({ max }) => `Число должно быть не более ${max}`,
  NUMBER_NOT_INTEGER: 'Число должно быть целым',
  NUMBER_NOT_POSITIVE: 'Число должно быть положительным',
  NUMBER_NOT_NEGATIVE: 'Число должно быть отрицательным',
  NUMBER_NOT_FINITE: 'Число должно быть конечным',
  NUMBER_NOT_SAFE: 'Число должно быть безопасным целым',
  NUMBER_NOT_MULTIPLE: ({ expected }) => `Число должно быть кратно ${expected}`,

  // Date constraints
  DATE_TOO_EARLY: ({ min }) => `Дата должна быть после ${min}`,
  DATE_TOO_LATE: ({ max }) => `Дата должна быть до ${max}`,

  // Array constraints
  ARRAY_TOO_SHORT: ({ min }) => `Массив должен содержать не менее ${min} элементов`,
  ARRAY_TOO_LONG: ({ max }) => `Массив должен содержать не более ${max} элементов`,
  ARRAY_NOT_EMPTY: 'Массив не может быть пустым',
  ARRAY_NOT_UNIQUE: 'Массив должен содержать уникальные элементы',

  // Object constraints
  OBJECT_UNKNOWN_KEY: ({ received }) => `Неизвестный ключ: ${received}`,
  OBJECT_MISSING_KEY: ({ expected }) => `Отсутствует обязательный ключ: ${expected}`,

  // Union/Intersection
  UNION_NO_MATCH: 'Значение не соответствует ни одному из вариантов объединения',
  INTERSECTION_CONFLICT: 'Значение не удовлетворяет всем условиям пересечения',

  // Enum/Literal
  INVALID_ENUM_VALUE: ({ expected }) => `Ожидалось одно из: ${formatOptions(expected)}`,
  INVALID_LITERAL: ({ expected }) => `Ожидалось точное значение: ${formatLiteral(expected)}`,

  // Custom
  CUSTOM_VALIDATION: 'Пользовательская проверка не пройдена',

  // Refinement
  REFINEMENT_FAILED: 'Уточняющая проверка не пройдена',

  // Transform
  TRANSFORM_FAILED: 'Преобразование не удалось',

  // System/Unknown
  UNKNOWN_ERROR: 'Произошла неизвестная ошибка',
};

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function formatType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'массив';
  if (typeof value === 'string') return 'строка';
  if (typeof value === 'number') return 'число';
  if (typeof value === 'boolean') return 'логическое значение';
  if (typeof value === 'bigint') return 'большое целое число';
  if (typeof value === 'symbol') return 'символ';
  if (typeof value === 'function') return 'функция';
  if (typeof value === 'object') return 'объект';
  return 'неизвестный тип';
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