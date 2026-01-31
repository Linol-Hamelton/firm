/**
 * LAYER 2: Zero-Config Framework Detection
 *
 * Automatic framework detection and configuration.
 * Enables optimal performance without manual setup.
 *
 * Target: 0ms overhead for 99.9% of users.
 */

export * from './framework-detector.js';
export * from './auto-config.js';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

/**
 * Main entry point for zero-config detection.
 * Usage:
 * ```ts
 * import { autoConfigure } from 'firm/infrastructure/auto-detection';
 * 
 * // Auto-configure based on detected framework
 * const config = autoConfigure();
 * 
 * // Or with custom overrides
 * const config = autoConfigure({
 *   async: true,
 *   parallel: false,
 * });
 * ```
 */

import { getConfig, configure, getDetectedFramework } from './auto-config.js';
import type { FirmConfig } from './auto-config.js';

/**
 * Auto-configure FIRM based on detected framework.
 * @param userConfig Optional user configuration overrides
 * @returns The applied configuration
 */
export function autoConfigure(userConfig?: Partial<FirmConfig>): FirmConfig {
  if (userConfig) {
    configure(userConfig);
  }
  return getConfig();
}

/**
 * Get the detected framework without applying configuration.
 * Useful for debugging and logging.
 */
export { getDetectedFramework };

/**
 * Check if running in a specific framework.
 * @param name Framework name to check
 * @param minConfidence Minimum confidence threshold (default: 0.5)
 */
export { isFrameworkDetected } from './framework-detector.js';

/**
 * Configuration utilities.
 */
export {
  getConfig,
  configure,
  isAsyncEnabled,
  isParallelEnabled,
  isCachingEnabled,
  isAutoFixEnabled,
  getValidationMode,
  getErrorFormat,
  resetConfig,
} from './auto-config.js';

// ============================================================================
// AUTOMATIC CONFIGURATION ON IMPORT
// ============================================================================

/**
 * Auto-configure on module load (optional).
 * This can be disabled by setting FIRM_NO_AUTO_CONFIG environment variable.
 */
if (typeof process !== 'undefined' && process.env['FIRM_NO_AUTO_CONFIG'] !== 'true') {
  try {
    // Apply auto-configuration silently
    autoConfigure();
  } catch {
    // Ignore errors in auto-configuration
  }
}