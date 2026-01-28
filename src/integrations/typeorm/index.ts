/**
 * TypeORM Integration for FIRM Validator
 *
 * Provides validation subscribers, decorators, and repository helpers for TypeORM.
 *
 * @example
 * ```typescript
 * import { Entity, Column } from 'typeorm';
 * import { s } from 'firm-validator';
 * import { ValidatedEntity, createValidationSubscriber } from 'firm-validator/integrations/typeorm';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1).max(100),
 *   email: s.string().email(),
 *   age: s.number().int().min(0).max(150).optional(),
 * });
 *
 * @Entity()
 * class User extends ValidatedEntity {
 *   @Column()
 *   name: string;
 *
 *   @Column()
 *   email: string;
 *
 *   @Column({ nullable: true })
 *   age?: number;
 *
 *   static getValidationSchema() {
 *     return userSchema;
 *   }
 * }
 *
 * // Register subscriber
 * const subscriber = createValidationSubscriber();
 * dataSource.subscribers.push(subscriber);
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * TypeORM entity subscriber event
 */
export interface EntitySubscriberEvent<T = any> {
  entity: T;
  metadata: any;
  connection: any;
  queryRunner: any;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Throw error on validation failure (default: true) */
  throwOnError?: boolean;
  /** Custom error handler */
  onError?: (errors: readonly any[]) => void;
  /** Skip validation for specific operations */
  skip?: ('insert' | 'update' | 'remove')[];
}

/**
 * Entity with validation schema
 */
export interface ValidatableEntity {
  getValidationSchema?(): Schema<any>;
}

// ============================================================================
// BASE ENTITY CLASS
// ============================================================================

/**
 * Base entity class with validation support.
 *
 * @example
 * ```typescript
 * @Entity()
 * class User extends ValidatedEntity {
 *   @Column()
 *   name: string;
 *
 *   static getValidationSchema() {
 *     return s.object({
 *       name: s.string().min(1),
 *       email: s.string().email(),
 *     });
 *   }
 * }
 * ```
 */
export abstract class ValidatedEntity {
  /**
   * Get validation schema for this entity.
   * Override this method in your entity class.
   */
  static getValidationSchema(): Schema<any> | undefined {
    return undefined;
  }

  /**
   * Validate this entity instance.
   */
  validate(): void {
    const schema = (this.constructor as typeof ValidatedEntity).getValidationSchema();
    if (!schema) {
      return;
    }

    const result = schema.validate(this);
    if (!result.ok) {
      throw new ValidationException(result.errors, 'Entity validation failed');
    }
  }

  /**
   * Validate and return validated data.
   */
  validateAndGet<T>(): T {
    const schema = (this.constructor as typeof ValidatedEntity).getValidationSchema();
    if (!schema) {
      return this as any;
    }

    const result = schema.validate(this);
    if (!result.ok) {
      throw new ValidationException(result.errors, 'Entity validation failed');
    }

    return result.data;
  }
}

// ============================================================================
// ENTITY SUBSCRIBER
// ============================================================================

/**
 * Create TypeORM entity subscriber for automatic validation.
 *
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const subscriber = createValidationSubscriber();
 *
 * const dataSource = new DataSource({
 *   // ... config
 *   subscribers: [subscriber],
 * });
 * ```
 */
export function createValidationSubscriber(options: ValidationOptions = {}) {
  return class FirmValidationSubscriber {
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: EntitySubscriberEvent): void {
      if (options.skip?.includes('insert')) {
        return;
      }

      this.validateEntity(event.entity, options);
    }

    /**
     * Called before entity update.
     */
    beforeUpdate(event: EntitySubscriberEvent): void {
      if (options.skip?.includes('update')) {
        return;
      }

      this.validateEntity(event.entity, options);
    }

    /**
     * Validate entity using its schema.
     */
    private validateEntity(entity: any, opts: ValidationOptions): void {
      // Check if entity has validation method
      if (typeof entity.validate === 'function') {
        try {
          entity.validate();
        } catch (error) {
          if (opts.onError && error instanceof ValidationException) {
            opts.onError(error.errors);
          }
          if (opts.throwOnError !== false) {
            throw error;
          }
        }
        return;
      }

      // Check if entity constructor has static schema method
      const schema = entity.constructor.getValidationSchema?.();
      if (!schema) {
        return;
      }

      const result = schema.validate(entity);
      if (!result.ok) {
        if (opts.onError) {
          opts.onError(result.errors);
        }
        if (opts.throwOnError !== false) {
          throw new ValidationException(result.errors, 'Entity validation failed');
        }
      }

      // Update entity with validated data
      Object.assign(entity, result.data);
    }
  };
}

// ============================================================================
// REPOSITORY HELPERS
// ============================================================================

/**
 * Create validated repository wrapper.
 *
 * @param repository - TypeORM repository
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const userRepo = dataSource.getRepository(User);
 * const validatedRepo = createValidatedRepository(userRepo, userSchema);
 *
 * // All operations will be validated
 * const user = await validatedRepo.save({
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 * ```
 */
export function createValidatedRepository<T>(
  repository: any,
  schema: Schema<T>
) {
  return {
    ...repository,

    async save(entity: T | T[]): Promise<T | T[]> {
      if (Array.isArray(entity)) {
        const validated = entity.map((e) => validateEntity(e, schema));
        return repository.save(validated);
      }

      const validated = validateEntity(entity, schema);
      return repository.save(validated);
    },

    async insert(entity: T | T[]): Promise<any> {
      if (Array.isArray(entity)) {
        const validated = entity.map((e) => validateEntity(e, schema));
        return repository.insert(validated);
      }

      const validated = validateEntity(entity, schema);
      return repository.insert(validated);
    },

    async update(criteria: any, partialEntity: Partial<T>): Promise<any> {
      // For updates, use partial schema if available
      const updateSchema = 'partial' in schema && typeof schema.partial === 'function'
        ? (schema as any).partial()
        : schema;

      const validated = validateEntity(partialEntity, updateSchema);
      return repository.update(criteria, validated);
    },

    async create(entityLike: Partial<T>): Promise<T> {
      const validated = validateEntity(entityLike, schema);
      return repository.create(validated);
    },
  };
}

/**
 * Validate entity data.
 */
function validateEntity<T>(entity: any, schema: Schema<T>): T {
  const result = schema.validate(entity);

  if (!result.ok) {
    throw new ValidationException(result.errors, 'Entity validation failed');
  }

  return result.data;
}

// ============================================================================
// DECORATOR (EXPERIMENTAL)
// ============================================================================

/**
 * Entity validation metadata key
 */
const VALIDATION_SCHEMA_KEY = Symbol('firm:validation:schema');

/**
 * Decorator to attach validation schema to entity class.
 *
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * @Entity()
 * @ValidateWith(userSchema)
 * class User {
 *   @Column()
 *   name: string;
 *
 *   @Column()
 *   email: string;
 * }
 * ```
 */
export function ValidateWith<T>(schema: Schema<T>) {
  return function (target: any) {
    Reflect.defineMetadata(VALIDATION_SCHEMA_KEY, schema, target);

    // Add static method to get schema
    target.getValidationSchema = function () {
      return schema;
    };

    // Add instance method to validate
    target.prototype.validate = function () {
      const result = schema.validate(this);
      if (!result.ok) {
        throw new ValidationException(result.errors, 'Entity validation failed');
      }
    };
  };
}

/**
 * Get validation schema from entity class.
 *
 * @param target - Entity class
 */
export function getValidationSchema(target: any): Schema<any> | undefined {
  return Reflect.getMetadata(VALIDATION_SCHEMA_KEY, target);
}

// ============================================================================
// QUERY BUILDER HELPERS
// ============================================================================

/**
 * Validate query result.
 *
 * @param result - Query result
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const users = await userRepo
 *   .createQueryBuilder('user')
 *   .where('user.age > :age', { age: 18 })
 *   .getMany();
 *
 * const validated = validateQueryResult(users, s.array(userSchema));
 * ```
 */
export function validateQueryResult<T>(
  result: unknown,
  schema: Schema<T>
): T {
  const validation = schema.validate(result);

  if (!validation.ok) {
    throw new ValidationException(
      validation.errors,
      'Query result validation failed'
    );
  }

  return validation.data;
}

/**
 * Create validated query builder wrapper.
 *
 * @param queryBuilder - TypeORM query builder
 * @param schema - Validation schema
 *
 * @example
 * ```typescript
 * const qb = userRepo.createQueryBuilder('user');
 * const validated = createValidatedQueryBuilder(qb, userSchema);
 *
 * // Results will be validated automatically
 * const user = await validated.where('user.id = :id', { id: 1 }).getOne();
 * ```
 */
export function createValidatedQueryBuilder<T>(
  queryBuilder: any,
  schema: Schema<T>
) {
  return {
    ...queryBuilder,

    async getOne(): Promise<T | null> {
      const result = await queryBuilder.getOne();
      if (result === null || result === undefined) {
        return null;
      }
      return validateEntity(result, schema);
    },

    async getMany(): Promise<T[]> {
      const results = await queryBuilder.getMany();
      return results.map((r: any) => validateEntity(r, schema));
    },

    async getOneOrFail(): Promise<T> {
      const result = await queryBuilder.getOneOrFail();
      return validateEntity(result, schema);
    },
  };
}
