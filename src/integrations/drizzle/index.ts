/**
 * Drizzle ORM Integration for FIRM Validator
 *
 * Provides validation helpers for Drizzle ORM.
 *
 * @example
 * ```typescript
 * import { drizzle } from 'drizzle-orm/node-postgres';
 * import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
 * import { s } from 'firm-validator';
 * import { createValidatedDb, validateInsert } from 'firm-validator/integrations/drizzle';
 *
 * const users = pgTable('users', {
 *   id: serial('id').primaryKey(),
 *   name: text('name').notNull(),
 *   email: text('email').notNull(),
 *   age: integer('age'),
 * });
 *
 * const userSchema = s.object({
 *   name: s.string().min(1).max(100),
 *   email: s.string().email(),
 *   age: s.number().int().min(0).max(150).optional(),
 * });
 *
 * const db = drizzle(connection);
 * const validatedDb = createValidatedDb(db, {
 *   users: userSchema
 * });
 *
 * // Automatic validation on insert
 * await validatedDb.insert(users).values({
 *   name: 'John',
 *   email: 'john@example.com',
 *   age: 30
 * });
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Throw error on validation failure (default: true) */
  throwOnError?: boolean;
  /** Custom error handler */
  onError?: (errors: readonly any[]) => void;
}

/**
 * Table schemas configuration
 */
export interface TableSchemas {
  [tableName: string]: Schema<any>;
}

/**
 * Drizzle database instance
 */
export interface DrizzleDb {
  insert: (table: any) => any;
  update: (table: any) => any;
  select: () => any;
  delete: (table: any) => any;
  [key: string]: any;
}

// ============================================================================
// VALIDATED DATABASE
// ============================================================================

/**
 * Create validated Drizzle database wrapper.
 *
 * @param db - Drizzle database instance
 * @param schemas - Table schemas configuration
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const validatedDb = createValidatedDb(db, {
 *   users: userSchema,
 *   posts: postSchema,
 * });
 *
 * // All operations will be validated
 * await validatedDb.insert(users).values({
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 * ```
 */
export function createValidatedDb<T extends DrizzleDb>(
  db: T,
  schemas: TableSchemas,
  options: ValidationOptions = {}
): T {
  return new Proxy(db, {
    get(target, prop) {
      const value = target[prop as keyof T];

      // Intercept insert method
      if (prop === 'insert') {
        return (table: any) => {
          const tableName = getTableName(table);
          const schema = schemas[tableName];

          const insertBuilder = value.call(target, table);

          return new Proxy(insertBuilder, {
            get(insertTarget, insertProp) {
              const insertValue = insertTarget[insertProp];

              // Intercept values method
              if (insertProp === 'values') {
                return (data: any) => {
                  if (schema) {
                    const validated = validateData(data, schema, options);
                    if (validated === null) {
                      return insertTarget;
                    }
                    return insertValue.call(insertTarget, validated);
                  }
                  return insertValue.call(insertTarget, data);
                };
              }

              return typeof insertValue === 'function'
                ? insertValue.bind(insertTarget)
                : insertValue;
            },
          });
        };
      }

      // Intercept update method
      if (prop === 'update') {
        return (table: any) => {
          const tableName = getTableName(table);
          const schema = schemas[tableName];

          const updateBuilder = value.call(target, table);

          return new Proxy(updateBuilder, {
            get(updateTarget, updateProp) {
              const updateValue = updateTarget[updateProp];

              // Intercept set method
              if (updateProp === 'set') {
                return (data: any) => {
                  if (schema) {
                    // For updates, use partial schema if available
                    const updateSchema = 'partial' in schema && typeof schema.partial === 'function'
                      ? (schema as any).partial()
                      : schema;

                    const validated = validateData(data, updateSchema, options);
                    if (validated === null) {
                      return updateTarget;
                    }
                    return updateValue.call(updateTarget, validated);
                  }
                  return updateValue.call(updateTarget, data);
                };
              }

              return typeof updateValue === 'function'
                ? updateValue.bind(updateTarget)
                : updateValue;
            },
          });
        };
      }

      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

/**
 * Validate data and handle errors.
 */
function validateData(
  data: any,
  schema: Schema<any>,
  options: ValidationOptions
): any | null {
  const result = schema.validate(data);

  if (!result.ok) {
    if (options.onError) {
      options.onError(result.errors);
    }

    if (options.throwOnError !== false) {
      throw new ValidationException(result.errors, 'Data validation failed');
    }

    return null;
  }

  return result.data;
}

/**
 * Get table name from Drizzle table object.
 */
function getTableName(table: any): string {
  // Drizzle tables have a symbol key for table name
  const symbolKey = Object.getOwnPropertySymbols(table).find(
    (s) => s.toString() === 'Symbol(drizzle:Name)'
  );

  if (symbolKey) {
    return table[symbolKey];
  }

  // Fallback: try to get from table config
  if (table && typeof table === 'object') {
    const config = table[Object.getOwnPropertySymbols(table)[0]];
    if (config?.name) {
      return config.name;
    }
  }

  return 'unknown';
}

// ============================================================================
// MANUAL VALIDATION HELPERS
// ============================================================================

/**
 * Validate data before insert operation.
 *
 * @param data - Data to validate
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const validated = validateInsert({
 *   name: 'John',
 *   email: 'john@example.com'
 * }, userSchema);
 *
 * await db.insert(users).values(validated);
 * ```
 */
export function validateInsert<T>(data: unknown, _schema: Schema<T>): T {
  const result = schema.validate(data);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Insert validation failed');
  }

  return result.data;
}

/**
 * Validate data before update operation.
 *
 * @param data - Data to validate
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const validated = validateUpdate({
 *   name: 'John Doe'
 * }, userSchema);
 *
 * await db.update(users)
 *   .set(validated)
 *   .where(eq(users.id, 1));
 * ```
 */
export function validateUpdate<T>(
  data: unknown,
  schema: Schema<T>
): Partial<T> {
  // For updates, use partial schema if available
  const updateSchema = 'partial' in schema && typeof schema.partial === 'function'
    ? (schema as any).partial()
    : schema;

  const result = updateSchema.validate(data);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Update validation failed');
  }

  return result.data;
}

/**
 * Validate query result.
 *
 * @param data - Query result
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const users = await db.select().from(users).where(eq(users.id, 1));
 * const validated = validateQueryResult(users, s.array(userSchema));
 * ```
 */
export function validateQueryResult<T>(data: unknown, _schema: Schema<T>): T {
  const result = schema.validate(data);

  if (!result.ok) {
    throw new ValidationException(
      result.errors,
      'Query result validation failed'
    );
  }

  return result.data;
}

// ============================================================================
// SCHEMA CONVERSION HELPERS
// ============================================================================

/**
 * Create insert schema (omitting auto-generated fields).
 *
 * @param schema - Base schema
 * @param omitKeys - Keys to omit (e.g., 'id', 'createdAt')
 *
 * @example
 * ```typescript
 * const insertSchema = drizzleInsert(userSchema, ['id', 'createdAt', 'updatedAt']);
 * ```
 */
export function drizzleInsert<T, K extends keyof T>(
  schema: Schema<T>,
  omitKeys: K[]
): Schema<Omit<T, K>> {
  if ('omit' in schema && typeof schema.omit === 'function') {
    return (schema as any).omit(omitKeys);
  }
  return schema as any;
}

/**
 * Create update schema (all fields optional, omitting certain keys).
 *
 * @param schema - Base schema
 * @param omitKeys - Keys to omit (e.g., 'id', 'createdAt')
 *
 * @example
 * ```typescript
 * const updateSchema = drizzleUpdate(userSchema, ['id', 'createdAt', 'updatedAt']);
 * ```
 */
export function drizzleUpdate<T, K extends keyof T>(
  schema: Schema<T>,
  omitKeys: K[]
): Schema<Partial<Omit<T, K>>> {
  let result: any = schema;

  // First omit keys
  if ('omit' in schema && typeof schema.omit === 'function') {
    result = (schema as any).omit(omitKeys);
  }

  // Then make partial
  if ('partial' in result && typeof result.partial === 'function') {
    result = result.partial();
  }

  return result;
}

/**
 * Create select schema (for query results).
 *
 * @param schema - Base schema
 *
 * @example
 * ```typescript
 * const selectSchema = drizzleSelect(userSchema);
 * ```
 */
export function drizzleSelect<T>(schema: Schema<T>): Schema<T> {
  return schema;
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Validate batch insert data.
 *
 * @param data - Array of data to validate
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const validated = validateBatchInsert([
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' },
 * ], userSchema);
 *
 * await db.insert(users).values(validated);
 * ```
 */
export function validateBatchInsert<T>(
  data: unknown[],
  schema: Schema<T>
): T[] {
  const validated: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.validate(data[i]);

    if (!result.ok) {
      throw new ValidationException(
        result.errors,
        `Batch insert validation failed at index ${i}`
      );
    }

    validated.push(result.data);
  }

  return validated;
}
