/**
 * I18N Message Bundles
 * 
 * Central export point for all language-specific error messages.
 */

import type { ErrorCode } from '../types/result.js';
import type { MessageTemplate } from './messages.js';

export { DEFAULT_MESSAGES } from './messages.js';
export { EN_MESSAGES } from './messages-en.js';
export { RU_MESSAGES } from './messages-ru.js';

export type LanguageCode = 'en' | 'ru' | 'de' | 'fr' | 'es';

export const MESSAGE_BUNDLES: Record<LanguageCode, Record<ErrorCode, MessageTemplate>> = {
  en: {} as any, // Will be filled below
  ru: {} as any,
  de: {} as any,
  fr: {} as any,
  es: {} as any,
};

// Initialize bundles (actual values will be set at runtime)
import { DEFAULT_MESSAGES } from './messages.js';
import { RU_MESSAGES } from './messages-ru.js';

MESSAGE_BUNDLES.en = DEFAULT_MESSAGES;
MESSAGE_BUNDLES.ru = RU_MESSAGES;

// Placeholder for other languages (can be implemented later)
MESSAGE_BUNDLES.de = DEFAULT_MESSAGES;
MESSAGE_BUNDLES.fr = DEFAULT_MESSAGES;
MESSAGE_BUNDLES.es = DEFAULT_MESSAGES;

/**
 * Get message bundle for specific language.
 */
export function getMessageBundle(lang: LanguageCode = 'en'): Record<ErrorCode, MessageTemplate> {
  return MESSAGE_BUNDLES[lang] || DEFAULT_MESSAGES;
}

/**
 * Set custom message bundle for a language.
 */
export function setMessageBundle(
  lang: LanguageCode,
  messages: Partial<Record<ErrorCode, MessageTemplate>>
): void {
  MESSAGE_BUNDLES[lang] = { ...DEFAULT_MESSAGES, ...messages };
}