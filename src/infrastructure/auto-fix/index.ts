/**
 * LAYER 3: Auto-Fix Module
 *
 * Automatic error fixing system.
 * Revolutionary Feature #10: Auto-Fix Mode
 */

export {
  AutoFixer,
  globalAutoFixer,
  createAutoFixer,
  enableAutoFix,
  disableAutoFix,
  type AutoFixConfig,
  type AutoFixStrategy,
  type FixFunction,
  type FixContext,
  type FixResult,
} from './auto-fixer.js';

export {
  withAutoFix,
  withAutoFixConfig,
} from './schema-autofix-wrapper.js';
