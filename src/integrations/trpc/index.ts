/**
 * tRPC Integration for FIRM Validator
 *
 * Provides input validation middleware for tRPC procedures.
 *
 * @example
 * ```typescript
 * import { initTRPC } from '@trpc/server';
 * import { s } from 'firm-validator';
 * import { firmInput } from 'firm-validator/integrations/trpc';
 *
 * const t = initTRPC.create();
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * export const appRouter = t.router({
 *   createUser: t.procedure
 *     .input(firmInput(userSchema))
 *     .mutation(({ input }) => {
 *       // input is typed and validated
 *       return { id: 1, ...input };
 *     }),
 * });
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmInputOptions {
  /** Custom error transformer */
  errorTransformer?: (errors: readonly any[]) => Error;
}

// ============================================================================
// INPUT VALIDATOR
// ============================================================================

/**
 * Create tRPC input validator from FIRM schema.
 *
 * @param schema - FIRM validation schema
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const createUserInput = firmInput(
 *   s.object({
 *     name: s.string().min(1),
 *     email: s.string().email(),
 *   })
 * );
 *
 * export const appRouter = t.router({
 *   createUser: t.procedure
 *     .input(createUserInput)
 *     .mutation(({ input }) => {
 *       // input: { name: string; email: string }
 *       return createUser(input);
 *     }),
 * });
 * ```
 */
export function firmInput<T>(
  schema: Schema<T>,
  options: FirmInputOptions = {}
) {
  return (input: unknown): T => {
    const result = schema.validate(input);

    if (result.ok) {
      return result.data;
    }

    // Transform errors
    if (options.errorTransformer) {
      throw options.errorTransformer(result.errors);
    }

    // Default error format for tRPC
    throw new ValidationException(result.errors, 'Input validation failed');
  };
}

/**
 * Create tRPC middleware for validating inputs.
 *
 * @example
 * ```typescript
 * const firmMiddleware = createFirmMiddleware();
 *
 * const protectedProcedure = t.procedure.use(firmMiddleware);
 *
 * export const appRouter = t.router({
 *   createUser: protectedProcedure
 *     .input(firmInput(userSchema))
 *     .mutation(({ input }) => {
 *       return createUser(input);
 *     }),
 * });
 * ```
 */
export function createFirmMiddleware() {
  return async ({ next }: any) => {
    try {
      return await next();
    } catch (error) {
      if (error instanceof ValidationError) {
        // Format validation errors for tRPC
        throw {
          code: 'BAD_REQUEST',
          message: error.message,
          errors: error.errors,
        };
      }
      throw error;
    }
  };
}

// ============================================================================
// OUTPUT VALIDATOR
// ============================================================================

/**
 * Create tRPC output validator from FIRM schema.
 *
 * Validates procedure output (useful for ensuring API contracts).
 *
 * @example
 * ```typescript
 * const userOutputSchema = s.object({
 *   id: s.number(),
 *   name: s.string(),
 *   email: s.string().email(),
 * });
 *
 * export const appRouter = t.router({
 *   getUser: t.procedure
 *     .input(firmInput(s.object({ id: s.number() })))
 *     .output(firmOutput(userOutputSchema))
 *     .query(({ input }) => {
 *       return db.users.findById(input.id);
 *     }),
 * });
 * ```
 */
export function firmOutput<T>(
  schema: Schema<T>,
  options: FirmInputOptions = {}
) {
  return (output: unknown): T => {
    const result = schema.validate(output);

    if (result.ok) {
      return result.data;
    }

    // Transform errors
    if (options.errorTransformer) {
      throw options.errorTransformer(result.errors);
    }

    // Default error format for tRPC
    throw new ValidationException(result.errors, 'Output validation failed');
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create type-safe tRPC router with FIRM validation.
 *
 * @example
 * ```typescript
 * const router = createFirmRouter(t, {
 *   createUser: {
 *     input: s.object({
 *       name: s.string(),
 *       email: s.string().email(),
 *     }),
 *     output: s.object({
 *       id: s.number(),
 *       name: s.string(),
 *       email: s.string(),
 *     }),
 *     mutation: async ({ input }) => {
 *       return createUser(input);
 *     },
 *   },
 * });
 * ```
 */
export function createFirmRouter<T extends Record<string, any>>(
  t: any,
  procedures: T
) {
  const router: Record<string, any> = {};

  for (const [key, config] of Object.entries(procedures)) {
    const { input, output, mutation, query } = config as any;

    let procedure = t.procedure;

    if (input) {
      procedure = procedure.input(firmInput(input));
    }

    if (output) {
      procedure = procedure.output(firmOutput(output));
    }

    if (mutation) {
      router[key] = procedure.mutation(mutation);
    } else if (query) {
      router[key] = procedure.query(query);
    }
  }

  return t.router(router);
}

/**
 * Type-safe wrapper for tRPC context with validation.
 *
 * @example
 * ```typescript
 * const contextSchema = s.object({
 *   user: s.object({
 *     id: s.number(),
 *     role: s.enum(['admin', 'user']),
 *   }).optional(),
 * });
 *
 * export const createContext = firmContext(contextSchema, async ({ req }) => {
 *   const user = await getUserFromToken(req.headers.authorization);
 *   return { user };
 * });
 * ```
 */
export function firmContext<T>(
  schema: Schema<T>,
  contextFn: (opts: any) => Promise<unknown> | unknown
) {
  return async (opts: any): Promise<T> => {
    const context = await contextFn(opts);
    const result = schema.validate(context);

    if (result.ok) {
      return result.data;
    }

    throw new ValidationException(result.errors, 'Context validation failed');
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  firmInput,
  firmOutput,
  createFirmMiddleware,
  createFirmRouter,
  firmContext,
};
