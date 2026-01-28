/**
 * LAYER 2: Input Ports
 *
 * Input ports define how external systems interact with FIRM.
 * These are the "driving" adapters in Hexagonal Architecture.
 *
 * Examples of input adapters:
 * - Express middleware
 * - Fastify plugin
 * - NestJS pipe
 * - CLI tool
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

// ============================================================================
// VALIDATION PORT
// ============================================================================

/**
 * Port for synchronous validation.
 * Implemented by the core validation engine.
 */
export interface ValidationPort<T> {
  /**
   * Validate data against schema.
   */
  validate(data: unknown): ValidationResult<T>;

  /**
   * Check if data is valid (fast path).
   */
  is(data: unknown): data is T;

  /**
   * Parse data or throw.
   */
  parse(data: unknown): T;

  /**
   * Assert data is valid.
   */
  assert(data: unknown): asserts data is T;
}

/**
 * Port for async validation.
 * Used when validation requires I/O (database checks, API calls).
 */
export interface AsyncValidationPort<T> {
  /**
   * Validate data asynchronously.
   */
  validateAsync(data: unknown): Promise<ValidationResult<T>>;

  /**
   * Parse data asynchronously or throw.
   */
  parseAsync(data: unknown): Promise<T>;
}

// ============================================================================
// MIDDLEWARE PORT
// ============================================================================

/**
 * Generic request object interface.
 * Compatible with Express, Fastify, Koa, etc.
 */
export interface GenericRequest {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Generic response object interface.
 */
export interface GenericResponse {
  status(code: number): this;
  json(body: unknown): void;
}

/**
 * Middleware function type.
 */
export type MiddlewareFn<Req = GenericRequest, Res = GenericResponse> = (
  req: Req,
  res: Res,
  next: (err?: unknown) => void
) => void | Promise<void>;

/**
 * Port for creating framework middleware.
 */
export interface MiddlewarePort {
  /**
   * Create body validation middleware.
   */
  body<T>(schema: Schema<T>): MiddlewareFn;

  /**
   * Create query validation middleware.
   */
  query<T>(schema: Schema<T>): MiddlewareFn;

  /**
   * Create params validation middleware.
   */
  params<T>(schema: Schema<T>): MiddlewareFn;

  /**
   * Create headers validation middleware.
   */
  headers<T>(schema: Schema<T>): MiddlewareFn;
}

// ============================================================================
// FORM VALIDATION PORT
// ============================================================================

/**
 * Field error for form validation.
 */
export interface FieldError {
  field: string;
  message: string;
  code: string;
}

/**
 * Form validation result.
 */
export interface FormValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: FieldError[];
}

/**
 * Port for form validation (client-side friendly).
 */
export interface FormValidationPort<T> {
  /**
   * Validate form data.
   */
  validateForm(data: unknown): FormValidationResult<T>;

  /**
   * Validate single field.
   */
  validateField(field: string, value: unknown): FieldError | null;

  /**
   * Get all field names.
   */
  getFields(): string[];
}

// ============================================================================
// SCHEMA INTROSPECTION PORT
// ============================================================================

/**
 * Port for schema introspection.
 * Used by code generators, documentation tools, etc.
 */
export interface SchemaIntrospectionPort {
  /**
   * Get JSON Schema representation.
   */
  toJSONSchema(): object;

  /**
   * Get OpenAPI schema representation.
   */
  toOpenAPI(): object;

  /**
   * Get TypeScript type string.
   */
  toTypeScript(): string;

  /**
   * Get schema metadata.
   */
  getMetadata(): SchemaMetadata;
}

export interface SchemaMetadata {
  type: string;
  description?: string;
  required: boolean;
  nullable: boolean;
  default?: unknown;
  constraints?: Record<string, unknown>;
}
