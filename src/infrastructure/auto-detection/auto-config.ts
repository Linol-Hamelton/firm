/**
 * LAYER 2: Auto Configuration
 *
 * Zero-Config Framework Detection - automatic configuration.
 * Applies framework-specific optimizations based on detection.
 *
 * Target: 0ms overhead for configuration detection.
 */

import { detectFramework } from './framework-detector.js';
import type { DetectedFramework, FrameworkConfig } from './framework-detector.js';

// ============================================================================
// AUTO CONFIGURATION
// ============================================================================

/**
 * Global configuration for FIRM.
 * Can be overridden by user configuration.
 */
export interface FirmConfig {
  /** Enable async validation */
  async: boolean;
  /** Enable parallel validation for arrays */
  parallel: boolean;
  /** Enable smart caching */
  caching: boolean;
  /** Enable auto-fix */
  autoFix: boolean;
  /** Error formatting style */
  errorFormat: 'detailed' | 'minimal' | 'json';
  /** Validation mode */
  validationMode: 'strict' | 'coerce' | 'lax';
  /** Maximum cache size (entries) */
  maxCacheSize: number;
  /** Enable debug logging */
  debug: boolean;
  /** Custom validation timeout (ms) */
  timeout: number;
}

/**
 * Default configuration (most conservative).
 */
const DEFAULT_CONFIG: FirmConfig = {
  async: false,
  parallel: false,
  caching: false,
  autoFix: false,
  errorFormat: 'detailed',
  validationMode: 'strict',
  maxCacheSize: 1000,
  debug: false,
  timeout: 5000,
};

/**
 * Merge framework configuration with user configuration.
 * Framework config takes precedence over defaults,
 * user config takes precedence over framework config.
 */
function mergeConfigs(
  frameworkConfig: FrameworkConfig,
  userConfig: Partial<FirmConfig> = {}
): FirmConfig {
  return {
    ...DEFAULT_CONFIG,
    // Apply framework-specific optimizations
    async: frameworkConfig.async,
    parallel: frameworkConfig.parallel,
    caching: frameworkConfig.caching,
    autoFix: frameworkConfig.autoFix,
    errorFormat: frameworkConfig.errorFormat,
    validationMode: frameworkConfig.validationMode,
    // Apply user overrides
    ...userConfig,
  };
}

/**
 * Configuration manager with lazy detection.
 */
class ConfigManager {
  private detectedFramework: DetectedFramework | null = null;
  private config: FirmConfig | null = null;
  private userConfig: Partial<FirmConfig> = {};

  /**
   * Set user configuration (overrides auto-detected config).
   */
  setUserConfig(config: Partial<FirmConfig>): void {
    this.userConfig = config;
    this.config = null; // Invalidate cached config
  }

  /**
   * Get the detected framework (with caching).
   */
  getDetectedFramework(): DetectedFramework {
    if (!this.detectedFramework) {
      this.detectedFramework = detectFramework();
    }
    return this.detectedFramework;
  }

  /**
   * Get the merged configuration (with caching).
   */
  getConfig(): FirmConfig {
    if (!this.config) {
      const framework = this.getDetectedFramework();
      this.config = mergeConfigs(framework.config, this.userConfig);
    }
    return this.config;
  }

  /**
   * Check if a specific feature is enabled.
   */
  isEnabled(feature: keyof Pick<FirmConfig, 'async' | 'parallel' | 'caching' | 'autoFix'>): boolean {
    const config = this.getConfig();
    return config[feature];
  }

  /**
   * Get the current validation mode.
   */
  getValidationMode(): 'strict' | 'coerce' | 'lax' {
    return this.getConfig().validationMode;
  }

  /**
   * Get the current error format.
   */
  getErrorFormat(): 'detailed' | 'minimal' | 'json' {
    return this.getConfig().errorFormat;
  }

  /**
   * Reset to defaults (for testing).
   */
  reset(): void {
    this.detectedFramework = null;
    this.config = null;
    this.userConfig = {};
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

/**
 * Global configuration manager instance.
 */
export const configManager = new ConfigManager();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get the current configuration.
 * Automatically detects framework and applies optimizations.
 */
export function getConfig(): FirmConfig {
  return configManager.getConfig();
}

/**
 * Configure FIRM with user preferences.
 * Overrides auto-detected framework configuration.
 */
export function configure(config: Partial<FirmConfig>): void {
  configManager.setUserConfig(config);
}

/**
 * Check if async validation is enabled.
 */
export function isAsyncEnabled(): boolean {
  return configManager.isEnabled('async');
}

/**
 * Check if parallel validation is enabled.
 */
export function isParallelEnabled(): boolean {
  return configManager.isEnabled('parallel');
}

/**
 * Check if smart caching is enabled.
 */
export function isCachingEnabled(): boolean {
  return configManager.isEnabled('caching');
}

/**
 * Check if auto-fix is enabled.
 */
export function isAutoFixEnabled(): boolean {
  return configManager.isEnabled('autoFix');
}

/**
 * Get the current validation mode.
 */
export function getValidationMode(): 'strict' | 'coerce' | 'lax' {
  return configManager.getValidationMode();
}

/**
 * Get the current error format.
 */
export function getErrorFormat(): 'detailed' | 'minimal' | 'json' {
  return configManager.getErrorFormat();
}

/**
 * Get the detected framework information.
 */
export function getDetectedFramework(): DetectedFramework {
  return configManager.getDetectedFramework();
}

/**
 * Reset configuration to defaults (mainly for testing).
 */
export function resetConfig(): void {
  configManager.reset();
}

// ============================================================================
// CONFIGURATION APPLICATORS
// ============================================================================

/**
 * Apply configuration to a schema instance.
 * This is used internally by schema constructors.
 */
export function applyConfigToSchema<T>(schema: any): void {
  const config = getConfig();
  
  // Apply async configuration
  if (config.async && typeof schema.enableAsync === 'function') {
    schema.enableAsync();
  }

  // Apply caching configuration
  if (config.caching && typeof schema.enableCaching === 'function') {
    schema.enableCaching();
  }

  // Apply auto-fix configuration
  if (config.autoFix && typeof schema.enableAutoFix === 'function') {
    schema.enableAutoFix();
  }

  // Apply validation mode
  if (config.validationMode === 'coerce' && typeof schema.coerce === 'function') {
    schema.coerce();
  } else if (config.validationMode === 'lax' && typeof schema.lax === 'function') {
    schema.lax();
  }
}

/**
 * Create a pre-configured schema factory.
 * Applies framework-specific optimizations automatically.
 */
export function createConfiguredSchemaFactory() {
  const config = getConfig();
  
  return {
    string: () => {
      const schema = require('../../core/validators/primitives/string.js').string();
      applyConfigToSchema(schema);
      return schema;
    },
    number: () => {
      const schema = require('../../core/validators/primitives/number.js').number();
      applyConfigToSchema(schema);
      return schema;
    },
    boolean: () => {
      const schema = require('../../core/validators/primitives/boolean.js').boolean();
      applyConfigToSchema(schema);
      return schema;
    },
    array: <T>(element: any) => {
      const schema = require('../../core/validators/composites/array.js').array(element);
      applyConfigToSchema(schema);
      // Apply parallel configuration for arrays
      if (config.parallel && typeof schema.parallel === 'function') {
        schema.parallel();
      }
      return schema;
    },
    object: <T extends Record<string, any>>(shape: T) => {
      const schema = require('../../core/validators/composites/object.js').object(shape);
      applyConfigToSchema(schema);
      return schema;
    },
  };
}