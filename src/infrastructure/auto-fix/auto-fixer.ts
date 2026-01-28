/**
 * LAYER 3: Auto-Fix System
 *
 * Automatic error fixing for common validation issues.
 * Revolutionary Feature #10: Auto-Fix Mode
 *
 * Automatically fixes common issues:
 * - Type coercion (string → number, string → boolean)
 * - String trimming and normalization
 * - Email lowercase normalization
 * - URL protocol correction
 * - Number parsing and rounding
 * - Date parsing from various formats
 */

import type { ErrorCode } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Auto-fix configuration
 */
export interface AutoFixConfig {
  /** Enable auto-fix globally (default: false) */
  enabled?: boolean;
  /** Fix strategies to enable */
  strategies?: AutoFixStrategy[];
  /** Custom fix functions */
  customFixes?: Partial<Record<ErrorCode, FixFunction>>;
}

/**
 * Auto-fix strategy types
 */
export type AutoFixStrategy =
  | 'trim' // Trim whitespace from strings
  | 'coerce' // Coerce types (string → number, string → boolean)
  | 'lowercase' // Lowercase email/url
  | 'uppercase' // Uppercase strings
  | 'normalize' // Normalize whitespace
  | 'parseNumber' // Parse numbers from strings
  | 'parseDate' // Parse dates from strings
  | 'fixUrl' // Fix URL protocol
  | 'removeSpaces' // Remove all spaces
  | 'all'; // Enable all strategies

/**
 * Fix function type
 */
export type FixFunction = (value: unknown, context: FixContext) => unknown;

/**
 * Fix context
 */
export interface FixContext {
  errorCode: ErrorCode;
  path: string;
  expected?: string;
  originalValue: unknown;
}

/**
 * Fix result
 */
export interface FixResult {
  fixed: boolean;
  value: unknown;
  appliedFixes: string[];
}

// ============================================================================
// AUTO FIXER
// ============================================================================

/**
 * Auto-fixer for common validation errors.
 */
export class AutoFixer {
  private config: Required<AutoFixConfig>;
  private fixers: Map<ErrorCode, FixFunction[]>;

  constructor(config: AutoFixConfig = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      strategies: config.strategies ?? ['all'],
      customFixes: config.customFixes ?? {},
    };

    this.fixers = new Map();
    this.initializeFixers();
  }

  /**
   * Try to fix a value based on error code.
   */
  fix(value: unknown, context: FixContext): FixResult {
    if (!this.config.enabled) {
      return { fixed: false, value, appliedFixes: [] };
    }

    const fixFunctions = this.fixers.get(context.errorCode);
    if (!fixFunctions || fixFunctions.length === 0) {
      return { fixed: false, value, appliedFixes: [] };
    }

    let currentValue = value;
    const appliedFixes: string[] = [];

    for (const fixFn of fixFunctions) {
      try {
        const newValue = fixFn(currentValue, context);
        if (newValue !== currentValue) {
          currentValue = newValue;
          appliedFixes.push(fixFn.name || 'unknown');
        }
      } catch {
        // If fix fails, continue with next fixer
      }
    }

    return {
      fixed: appliedFixes.length > 0,
      value: currentValue,
      appliedFixes,
    };
  }

  /**
   * Enable auto-fix.
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable auto-fix.
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Check if auto-fix is enabled.
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Add custom fix function.
   */
  addFix(errorCode: ErrorCode, fixFn: FixFunction): void {
    if (!this.fixers.has(errorCode)) {
      this.fixers.set(errorCode, []);
    }
    this.fixers.get(errorCode)!.push(fixFn);
  }

  /**
   * Initialize built-in fixers.
   */
  private initializeFixers(): void {
    const strategies = new Set(this.config.strategies);
    const enableAll = strategies.has('all');

    // String fixes
    if (enableAll || strategies.has('trim')) {
      this.addFix('STRING_TOO_SHORT', trimString);
      this.addFix('STRING_TOO_LONG', trimString);
    }

    if (enableAll || strategies.has('normalize')) {
      this.addFix('STRING_TOO_SHORT', normalizeWhitespace);
      this.addFix('STRING_TOO_LONG', normalizeWhitespace);
    }

    if (enableAll || strategies.has('lowercase')) {
      this.addFix('STRING_INVALID_EMAIL', lowercaseString);
    }

    if (enableAll || strategies.has('uppercase')) {
      // Can be used for specific cases
    }

    // Number fixes
    if (enableAll || strategies.has('coerce') || strategies.has('parseNumber')) {
      this.addFix('NOT_NUMBER', parseNumber);
      this.addFix('NUMBER_NOT_INTEGER', roundNumber);
    }

    // Boolean fixes
    if (enableAll || strategies.has('coerce')) {
      this.addFix('NOT_BOOLEAN', parseBoolean);
    }

    // Date fixes
    if (enableAll || strategies.has('parseDate')) {
      this.addFix('NOT_DATE', parseDate);
    }

    // URL fixes
    if (enableAll || strategies.has('fixUrl')) {
      this.addFix('STRING_INVALID_URL', fixUrl);
    }

    // Email fixes
    if (enableAll || strategies.has('lowercase')) {
      this.addFix('STRING_INVALID_EMAIL', fixEmail);
    }

    // Remove spaces
    if (strategies.has('removeSpaces')) {
      this.addFix('STRING_PATTERN_MISMATCH', removeSpaces);
    }

    // Add custom fixes
    for (const [errorCode, fixFn] of Object.entries(this.config.customFixes)) {
      this.addFix(errorCode as ErrorCode, fixFn);
    }
  }
}

// ============================================================================
// BUILT-IN FIX FUNCTIONS
// ============================================================================

/**
 * Trim whitespace from string.
 */
function trimString(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
}

/**
 * Normalize whitespace in string.
 */
function normalizeWhitespace(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim();
  }
  return value;
}

/**
 * Convert string to lowercase.
 */
function lowercaseString(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  return value;
}

/**
 * Remove all spaces from string.
 */
function removeSpaces(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/\s/g, '');
  }
  return value;
}

/**
 * Parse number from string.
 */
function parseNumber(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const num = Number(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }
  return value;
}

/**
 * Round number to integer.
 */
function roundNumber(value: unknown): unknown {
  if (typeof value === 'number') {
    return Math.round(value);
  }
  return value;
}

/**
 * Parse boolean from string.
 */
function parseBoolean(value: unknown): unknown {
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'no') {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return value;
}

/**
 * Parse date from string.
 */
function parseDate(value: unknown): unknown {
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  return value;
}

/**
 * Fix URL by adding protocol.
 */
function fixUrl(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && !trimmed.match(/^[a-z]+:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }
  return value;
}

/**
 * Fix email format.
 */
function fixEmail(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  return value;
}

// ============================================================================
// GLOBAL AUTO-FIXER
// ============================================================================

/**
 * Global auto-fixer instance.
 */
export const globalAutoFixer = new AutoFixer({
  enabled: false, // Disabled by default
  strategies: ['all'],
});

/**
 * Create a new auto-fixer with custom config.
 */
export function createAutoFixer(config: AutoFixConfig): AutoFixer {
  return new AutoFixer(config);
}

/**
 * Enable global auto-fix.
 */
export function enableAutoFix(strategies?: AutoFixStrategy[]): void {
  if (strategies) {
    Object.assign(globalAutoFixer, new AutoFixer({ enabled: true, strategies }));
  } else {
    globalAutoFixer.enable();
  }
}

/**
 * Disable global auto-fix.
 */
export function disableAutoFix(): void {
  globalAutoFixer.disable();
}
