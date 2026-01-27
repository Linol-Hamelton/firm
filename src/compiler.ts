/**
 * FIRM - Compiler Entry Point
 *
 * Tree-shakeable import for schema compiler only.
 *
 * @example
 * ```ts
 * import { compile } from 'firm-validator/compiler';
 *
 * const validate = compile(schema);
 * ```
 */

export { compile, compileSchema, type CompilerOptions } from './core/compiler/index.js';
