/**
 * Sequelize ORM Integration for FIRM Validator
 *
 * Provides validation hooks, decorators, and helpers for Sequelize.
 *
 * @example
 * ```typescript
 * import { Sequelize, Model, DataTypes } from 'sequelize';
 * import { s } from 'firm-validator';
 * import { createValidatedModel, addValidationHooks } from 'firm-validator/integrations/sequelize';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1).max(100),
 *   email: s.string().email(),
 *   age: s.number().int().min(0).max(150).optional(),
 * });
 *
 * class User extends Model {
 *   declare name: string;
 *   declare email: string;
 *   declare age?: number;
 * }
 *
 * User.init({
 *   name: DataTypes.STRING,
 *   email: DataTypes.STRING,
 *   age: DataTypes.INTEGER,
 * }, { sequelize });
 *
 * // Add validation hooks
 * addValidationHooks(User, userSchema);
 *
 * // Now all create/update operations will be validated
 * const user = await User.create({
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
 * Sequelize model instance
 */
export interface ModelInstance {
  get(key?: string): any;
  set(key: string | object, value?: any): this;
  save(options?: any): Promise<this>;
  [key: string]: any;
}

/**
 * Sequelize model class
 */
export interface ModelStatic {
  new (): ModelInstance;
  create(values: any, options?: any): Promise<ModelInstance>;
  update(values: any, options: any): Promise<[number, ModelInstance[]]>;
  bulkCreate(records: any[], options?: any): Promise<ModelInstance[]>;
  addHook(hookType: string, name: string | Function, fn?: Function): void;
  [key: string]: any;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Throw error on validation failure (default: true) */
  throwOnError?: boolean;
  /** Custom error handler */
  onError?: (errors: readonly any[]) => void;
  /** Skip validation for specific hooks */
  skip?: ('beforeCreate' | 'beforeUpdate' | 'beforeSave' | 'beforeBulkCreate')[];
}

/**
 * Hook options
 */
export interface HookOptions {
  /** Validation schema */
  schema: Schema<any>;
  /** Validation options */
  options?: ValidationOptions;
}

// ============================================================================
// VALIDATION HOOKS
// ============================================================================

/**
 * Add validation hooks to Sequelize model.
 *
 * @param model - Sequelize model class
 * @param schema - Validation schema
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * addValidationHooks(User, userSchema);
 *
 * // All operations will be validated automatically
 * await User.create({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function addValidationHooks(
  model: ModelStatic,
  schema: Schema<any>,
  options: ValidationOptions = {}
): void {
  const hookOpts = { schema, options };

  // Before create hook
  if (!options.skip?.includes('beforeCreate')) {
    model.addHook('beforeCreate', 'firmValidation', (instance: ModelInstance) => {
      validateInstance(instance, hookOpts);
    });
  }

  // Before update hook
  if (!options.skip?.includes('beforeUpdate')) {
    model.addHook('beforeUpdate', 'firmValidation', (instance: ModelInstance) => {
      // For updates, use partial schema if available
      const updateSchema = 'partial' in schema && typeof schema.partial === 'function'
        ? (schema as any).partial()
        : schema;

      validateInstance(instance, { ...hookOpts, schema: updateSchema });
    });
  }

  // Before save hook (covers both create and update)
  if (!options.skip?.includes('beforeSave')) {
    model.addHook('beforeSave', 'firmValidation', (instance: ModelInstance) => {
      const isNewRecord = instance.isNewRecord;
      const validationSchema = isNewRecord ? schema : (
        'partial' in schema && typeof schema.partial === 'function'
          ? (schema as any).partial()
          : schema
      );

      validateInstance(instance, { ...hookOpts, schema: validationSchema });
    });
  }

  // Before bulk create hook
  if (!options.skip?.includes('beforeBulkCreate')) {
    model.addHook('beforeBulkCreate', 'firmValidation', (instances: ModelInstance[]) => {
      instances.forEach((instance) => {
        validateInstance(instance, hookOpts);
      });
    });
  }
}

/**
 * Validate model instance.
 */
function validateInstance(
  instance: ModelInstance,
  hookOpts: HookOptions
): void {
  const { schema, options = {} } = hookOpts;
  const data = instance.get({ plain: true });

  const result = schema.validate(data);

  if (!result.ok) {
    if (options.onError) {
      options.onError(result.errors);
    }

    if (options.throwOnError !== false) {
      throw new ValidationException(result.errors, 'Model validation failed');
    }
    return;
  }

  // Update instance with validated data
  instance.set(result.data);
}

// ============================================================================
// MODEL WRAPPER
// ============================================================================

/**
 * Create validated model wrapper.
 *
 * @param model - Sequelize model class
 * @param schema - Validation schema
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const ValidatedUser = createValidatedModel(User, userSchema);
 *
 * // All operations through this wrapper will be validated
 * await ValidatedUser.create({
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 * ```
 */
export function createValidatedModel<T extends ModelStatic>(
  model: T,
  schema: Schema<any>,
  options: ValidationOptions = {}
): T {
  return new Proxy(model, {
    get(target, prop) {
      const value = target[prop as keyof T];

      // Intercept create method
      if (prop === 'create') {
        return async (values: any, createOptions?: any) => {
          const validated = validateData(values, schema, options);
          if (validated === null) {
            return null;
          }
          return value.call(target, validated, createOptions);
        };
      }

      // Intercept update method
      if (prop === 'update') {
        return async (values: any, updateOptions: any) => {
          // For updates, use partial schema
          const updateSchema = 'partial' in schema && typeof schema.partial === 'function'
            ? (schema as any).partial()
            : schema;

          const validated = validateData(values, updateSchema, options);
          if (validated === null) {
            return [0, []];
          }
          return value.call(target, validated, updateOptions);
        };
      }

      // Intercept bulkCreate method
      if (prop === 'bulkCreate') {
        return async (records: any[], bulkOptions?: any) => {
          const validated = records.map((record) => {
            const result = validateData(record, schema, options);
            return result !== null ? result : record;
          }).filter(Boolean);

          return value.call(target, validated, bulkOptions);
        };
      }

      // Intercept build method
      if (prop === 'build') {
        return (values: any, buildOptions?: any) => {
          const validated = validateData(values, schema, options);
          if (validated === null) {
            return null;
          }
          return value.call(target, validated, buildOptions);
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

// ============================================================================
// MANUAL VALIDATION
// ============================================================================

/**
 * Validate data before create operation.
 *
 * @param data - Data to validate
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const validated = validateCreate({
 *   name: 'John',
 *   email: 'john@example.com'
 * }, userSchema);
 *
 * await User.create(validated);
 * ```
 */
export function validateCreate<T>(data: unknown, schema: Schema<T>): T {
  const result = schema.validate(data);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Create validation failed');
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
 * await User.update(validated, { where: { id: 1 } });
 * ```
 */
export function validateUpdateData<T>(
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
 * Validate model instance.
 *
 * @param instance - Model instance
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const user = await User.findByPk(1);
 * validateModelInstance(user, userSchema);
 * ```
 */
export function validateModelInstance<T>(
  instance: ModelInstance,
  schema: Schema<T>
): T {
  const data = instance.get({ plain: true });
  const result = schema.validate(data);

  if (!result.ok) {
    throw new ValidationException(
      result.errors,
      'Model instance validation failed'
    );
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
 * const users = await User.findAll({ where: { age: { [Op.gt]: 18 } } });
 * const validated = validateQueryResult(
 *   users.map(u => u.get({ plain: true })),
 *   s.array(userSchema)
 * );
 * ```
 */
export function validateQueryResult<T>(data: unknown, schema: Schema<T>): T {
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
// SCHEMA HELPERS
// ============================================================================

/**
 * Create schema for Sequelize create operation.
 *
 * @param schema - Base schema
 * @param omitKeys - Keys to omit (e.g., 'id', 'createdAt', 'updatedAt')
 *
 * @example
 * ```typescript
 * const createSchema = sequelizeCreate(userSchema, ['id', 'createdAt', 'updatedAt']);
 * ```
 */
export function sequelizeCreate<T, K extends keyof T>(
  schema: Schema<T>,
  omitKeys?: K[]
): Schema<Omit<T, K>> {
  if (!omitKeys || omitKeys.length === 0) {
    return schema as any;
  }

  if ('omit' in schema && typeof schema.omit === 'function') {
    const omitObj = omitKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    return (schema as any).omit(omitObj);
  }

  return schema as any;
}

/**
 * Create schema for Sequelize update operation (all fields optional).
 *
 * @param schema - Base schema
 * @param omitKeys - Keys to omit
 *
 * @example
 * ```typescript
 * const updateSchema = sequelizeUpdate(userSchema, ['id', 'createdAt']);
 * ```
 */
export function sequelizeUpdate<T, K extends keyof T>(
  schema: Schema<T>,
  omitKeys?: K[]
): Schema<Partial<Omit<T, K>>> {
  let result: any = schema;

  // First omit keys
  if (omitKeys && omitKeys.length > 0 && 'omit' in schema && typeof schema.omit === 'function') {
    const omitObj = omitKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    result = (schema as any).omit(omitObj);
  }

  // Then make partial
  if ('partial' in result && typeof result.partial === 'function') {
    result = result.partial();
  }

  return result;
}
