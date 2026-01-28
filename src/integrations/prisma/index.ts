/**
 * Prisma ORM Integration for FIRM Validator
 *
 * Provides validation middleware and helpers for Prisma.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { s } from 'firm-validator';
 * import { createFirmMiddleware, validateModel } from 'firm-validator/integrations/prisma';
 *
 * const prisma = new PrismaClient();
 *
 * // Schema for User model
 * const userSchema = s.object({
 *   name: s.string().min(1).max(100),
 *   email: s.string().email(),
 *   age: s.number().int().min(0).max(150).optional(),
 * });
 *
 * // Use middleware for automatic validation
 * prisma.$use(createFirmMiddleware({
 *   user: {
 *     create: userSchema,
 *     update: userSchema.partial(),
 *   }
 * }));
 *
 * // Or validate manually
 * const result = await validateModel(prisma.user.create, {
 *   data: { name: 'John', email: 'john@example.com' }
 * }, userSchema);
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Prisma middleware parameters
 */
export interface PrismaMiddlewareParams {
  model?: string;
  action: string;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
}

/**
 * Prisma middleware next function
 */
export type PrismaMiddlewareNext = (params: PrismaMiddlewareParams) => Promise<any>;

/**
 * Prisma middleware function
 */
export type PrismaMiddleware = (
  params: PrismaMiddlewareParams,
  next: PrismaMiddlewareNext
) => Promise<any>;

/**
 * Schema configuration for a Prisma model
 */
export interface ModelSchemas {
  create?: Schema<any>;
  createMany?: Schema<any>;
  update?: Schema<any>;
  updateMany?: Schema<any>;
  upsert?: Schema<any>;
}

/**
 * Configuration for all models
 */
export interface FirmMiddlewareConfig {
  [model: string]: ModelSchemas;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Throw error on validation failure (default: true) */
  throwOnError?: boolean;
  /** Custom error handler */
  onError?: (errors: readonly any[]) => void;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Create Prisma middleware for automatic validation.
 *
 * @param config - Schema configuration for each model and action
 *
 * @example
 * ```typescript
 * const middleware = createFirmMiddleware({
 *   user: {
 *     create: userCreateSchema,
 *     update: userUpdateSchema.partial(),
 *   },
 *   post: {
 *     create: postCreateSchema,
 *   }
 * });
 *
 * prisma.$use(middleware);
 * ```
 */
export function createFirmMiddleware(
  config: FirmMiddlewareConfig
): PrismaMiddleware {
  return async (params, next) => {
    const { model, action, args } = params;

    // Skip if no model or no config for this model
    if (!model || !config[model.toLowerCase()]) {
      return next(params);
    }

    const modelConfig = config[model.toLowerCase()];
    const schema = modelConfig[action as keyof ModelSchemas];

    // Skip if no schema for this action
    if (!schema) {
      return next(params);
    }

    // Validate data
    const dataToValidate = args.data || args;
    const result = schema.validate(dataToValidate);

    if (!result.ok) {
      throw new ValidationException(
        result.errors,
        `Validation failed for ${model}.${action}`
      );
    }

    // Update args with validated data
    if (args.data) {
      args.data = result.data;
    } else {
      Object.assign(args, result.data);
    }

    return next(params);
  };
}

/**
 * Create Prisma middleware with custom error handling.
 *
 * @param config - Schema configuration
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const middleware = createFirmMiddlewareWithOptions({
 *   user: { create: userSchema }
 * }, {
 *   onError: (errors) => {
 *     console.error('Validation failed:', errors);
 *   }
 * });
 * ```
 */
export function createFirmMiddlewareWithOptions(
  config: FirmMiddlewareConfig,
  options: ValidationOptions = {}
): PrismaMiddleware {
  return async (params, next) => {
    const { model, action, args } = params;

    if (!model || !config[model.toLowerCase()]) {
      return next(params);
    }

    const modelConfig = config[model.toLowerCase()];
    const schema = modelConfig[action as keyof ModelSchemas];

    if (!schema) {
      return next(params);
    }

    const dataToValidate = args.data || args;
    const result = schema.validate(dataToValidate);

    if (!result.ok) {
      if (options.onError) {
        options.onError(result.errors);
      }

      if (options.throwOnError !== false) {
        throw new ValidationException(
          result.errors,
          `Validation failed for ${model}.${action}`
        );
      }

      return null;
    }

    if (args.data) {
      args.data = result.data;
    } else {
      Object.assign(args, result.data);
    }

    return next(params);
  };
}

// ============================================================================
// MODEL VALIDATORS
// ============================================================================

/**
 * Validate data before Prisma operation.
 *
 * @param operation - Prisma operation function
 * @param args - Operation arguments
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const user = await validateModel(
 *   prisma.user.create,
 *   { data: { name: 'John', email: 'john@example.com' } },
 *   userSchema
 * );
 * ```
 */
export async function validateModel<T>(
  operation: (args: any) => Promise<T>,
  args: any,
  schema: Schema<any>
): Promise<T> {
  const dataToValidate = args.data || args;
  const result = schema.validate(dataToValidate);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Model validation failed');
  }

  if (args.data) {
    args.data = result.data;
  } else {
    args = result.data;
  }

  return operation(args);
}

/**
 * Validate data after Prisma query.
 *
 * @param data - Data from Prisma query
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const user = await prisma.user.findUnique({ where: { id: 1 } });
 * const validatedUser = validateOutput(user, userSchema);
 * ```
 */
export function validateOutput<T>(data: unknown, schema: Schema<T>): T {
  const result = schema.validate(data);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Output validation failed');
  }

  return result.data;
}

/**
 * Create typed Prisma client with validation.
 *
 * @param prisma - Prisma client instance
 * @param schemas - Schema configuration
 *
 * @example
 * ```typescript
 * const validatedPrisma = createValidatedClient(prisma, {
 *   user: {
 *     create: userCreateSchema,
 *     update: userUpdateSchema,
 *   }
 * });
 *
 * // All operations will be validated automatically
 * const user = await validatedPrisma.user.create({
 *   data: { name: 'John', email: 'john@example.com' }
 * });
 * ```
 */
export function createValidatedClient<T extends Record<string, any>>(
  prisma: T,
  schemas: FirmMiddlewareConfig
): T {
  const middleware = createFirmMiddleware(schemas);
  (prisma as any).$use(middleware);
  return prisma;
}

// ============================================================================
// SCHEMA HELPERS
// ============================================================================

/**
 * Create schema for Prisma create operation.
 *
 * @param schema - Base schema
 *
 * @example
 * ```typescript
 * const createSchema = prismaCreate(baseUserSchema);
 * ```
 */
export function prismaCreate<T>(schema: Schema<T>): Schema<T> {
  return schema;
}

/**
 * Create schema for Prisma update operation (all fields optional).
 *
 * @param schema - Base schema
 *
 * @example
 * ```typescript
 * const updateSchema = prismaUpdate(baseUserSchema);
 * // All fields become optional
 * ```
 */
export function prismaUpdate<T>(schema: Schema<T>): Schema<Partial<T>> {
  if ('partial' in schema && typeof schema.partial === 'function') {
    return (schema as any).partial();
  }
  return schema as any;
}

/**
 * Create schema for Prisma upsert operation.
 *
 * @param schema - Base schema
 *
 * @example
 * ```typescript
 * const upsertSchema = prismaUpsert(baseUserSchema);
 * ```
 */
export function prismaUpsert<T>(schema: Schema<T>): Schema<T> {
  return schema;
}

/**
 * Exclude fields from schema (useful for omitting auto-generated fields).
 *
 * @param schema - Base schema
 * @param keys - Keys to exclude
 *
 * @example
 * ```typescript
 * const createSchema = prismaOmit(userSchema, ['id', 'createdAt', 'updatedAt']);
 * ```
 */
export function prismaOmit<T, K extends keyof T>(
  schema: Schema<T>,
  keys: K[]
): Schema<Omit<T, K>> {
  if ('omit' in schema && typeof schema.omit === 'function') {
    const omitObj = keys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    return (schema as any).omit(omitObj);
  }
  return schema as any;
}

/**
 * Pick specific fields from schema.
 *
 * @param schema - Base schema
 * @param keys - Keys to pick
 *
 * @example
 * ```typescript
 * const loginSchema = prismaPick(userSchema, ['email', 'password']);
 * ```
 */
export function prismaPick<T, K extends keyof T>(
  schema: Schema<T>,
  keys: K[]
): Schema<Pick<T, K>> {
  if ('pick' in schema && typeof schema.pick === 'function') {
    const pickObj = keys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    return (schema as any).pick(pickObj);
  }
  return schema as any;
}
