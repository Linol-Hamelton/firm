/**
 * GraphQL Apollo Integration for FIRM Validator
 *
 * Provides argument validation for GraphQL resolvers.
 *
 * @example
 * ```typescript
 * import { ApolloServer } from '@apollo/server';
 * import { s } from 'firm-validator';
 * import { firmArgs, createFirmDirective } from 'firm-validator/integrations/graphql';
 *
 * const createUserSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * const resolvers = {
 *   Mutation: {
 *     createUser: firmArgs(createUserSchema, async (parent, args, context) => {
 *       // args is typed and validated
 *       return context.db.users.create(args);
 *     }),
 *   },
 * };
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import { ValidationError } from '../../common/errors/validation-error.js';
import type { GraphQLError } from 'graphql';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmResolverOptions {
  /** Custom error formatter */
  errorFormatter?: (errors: any[]) => GraphQLError;
}

export type Resolver<TArgs = any, TResult = any, TContext = any> = (
  parent: any,
  args: TArgs,
  context: TContext,
  info: any
) => Promise<TResult> | TResult;

// ============================================================================
// RESOLVER WRAPPER
// ============================================================================

/**
 * Wrap GraphQL resolver with FIRM validation.
 *
 * @param schema - FIRM validation schema for arguments
 * @param resolver - GraphQL resolver function
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const resolvers = {
 *   Mutation: {
 *     createUser: firmArgs(
 *       s.object({
 *         input: s.object({
 *           name: s.string().min(1),
 *           email: s.string().email(),
 *         }),
 *       }),
 *       async (parent, args, context) => {
 *         const { input } = args;
 *         return context.db.users.create(input);
 *       }
 *     ),
 *   },
 * };
 * ```
 */
export function firmArgs<TArgs, TResult, TContext = any>(
  schema: Schema<TArgs>,
  resolver: Resolver<TArgs, TResult, TContext>,
  options: FirmResolverOptions = {}
): Resolver<TArgs, TResult, TContext> {
  return async (parent, args, context, info) => {
    // Validate arguments
    const result = schema.validate(args);

    if (!result.ok) {
      if (options.errorFormatter) {
        throw options.errorFormatter(result.errors);
      }

      throw new ValidationError('Arguments validation failed', result.errors);
    }

    // Call resolver with validated args
    return resolver(parent, result.data, context, info);
  };
}

/**
 * Create validation middleware for Apollo Server plugins.
 *
 * @example
 * ```typescript
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   plugins: [createFirmPlugin()],
 * });
 * ```
 */
export function createFirmPlugin() {
  return {
    async requestDidStart() {
      return {
        async didEncounterErrors(requestContext: any) {
          // Format validation errors
          requestContext.errors = requestContext.errors?.map((error: any) => {
            if (error.originalError instanceof ValidationError) {
              return {
                message: error.message,
                extensions: {
                  code: 'BAD_USER_INPUT',
                  validationErrors: error.originalError.errors,
                },
              };
            }
            return error;
          });
        },
      };
    },
  };
}

// ============================================================================
// DIRECTIVE
// ============================================================================

/**
 * Create GraphQL directive for validation.
 *
 * @example
 * ```graphql
 * directive @validate(schema: String!) on FIELD_DEFINITION | ARGUMENT_DEFINITION
 *
 * type Mutation {
 *   createUser(input: CreateUserInput! @validate(schema: "createUser")): User!
 * }
 * ```
 *
 * ```typescript
 * import { makeExecutableSchema } from '@graphql-tools/schema';
 *
 * const schemas = {
 *   createUser: s.object({
 *     name: s.string().min(1),
 *     email: s.string().email(),
 *   }),
 * };
 *
 * const schema = makeExecutableSchema({
 *   typeDefs,
 *   resolvers,
 *   schemaDirectives: {
 *     validate: createFirmDirective(schemas),
 *   },
 * });
 * ```
 */
export function createFirmDirective(schemas: Record<string, Schema<any>>) {
  return class FirmDirective {
    constructor(public config: any) {}

    visitFieldDefinition(field: any) {
      const { resolve = defaultFieldResolver } = field;
      const schemaName = this.config.schema;
      const schema = schemas[schemaName];

      if (!schema) {
        throw new Error(`Schema "${schemaName}" not found`);
      }

      field.resolve = async function (
        source: any,
        args: any,
        context: any,
        info: any
      ) {
        const result = schema.validate(args);

        if (!result.ok) {
          throw new ValidationError(
            'Arguments validation failed',
            result.errors
          );
        }

        return resolve(source, result.data, context, info);
      };

      return field;
    }
  };
}

function defaultFieldResolver(source: any, args: any) {
  return source?.[args];
}

// ============================================================================
// INPUT TYPE GENERATOR
// ============================================================================

/**
 * Generate GraphQL input type from FIRM schema.
 *
 * @example
 * ```typescript
 * const userSchema = s.object({
 *   name: s.string(),
 *   email: s.string().email(),
 *   age: s.number().int().optional(),
 * });
 *
 * const inputType = generateInputType('CreateUserInput', userSchema);
 * // Returns:
 * // input CreateUserInput {
 * //   name: String!
 * //   email: String!
 * //   age: Int
 * // }
 * ```
 */
export function generateInputType(name: string, schema: Schema<any>): string {
  const fields: string[] = [];

  // Get schema config
  const config = 'config' in schema ? (schema as any).config : {};

  if (schema._type === 'object' && config.shape) {
    const shape = config.shape;

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = fieldSchema as any;
      const fieldConfig = 'config' in field ? field.config : {};
      const isOptional = fieldConfig.isOptional || fieldConfig.isNullable;

      let graphqlType = getGraphQLType(field._type);
      if (!isOptional) {
        graphqlType += '!';
      }

      fields.push(`  ${key}: ${graphqlType}`);
    }
  }

  return `input ${name} {\n${fields.join('\n')}\n}`;
}

function getGraphQLType(firmType: string): string {
  const mapping: Record<string, string> = {
    string: 'String',
    number: 'Float',
    boolean: 'Boolean',
    date: 'String', // ISO string
    object: 'JSON', // Custom scalar
    array: '[JSON]',
  };

  return mapping[firmType] || 'JSON';
}

// ============================================================================
// CONTEXT VALIDATOR
// ============================================================================

/**
 * Validate GraphQL context.
 *
 * @example
 * ```typescript
 * const contextSchema = s.object({
 *   user: s.object({
 *     id: s.string(),
 *     role: s.enum(['admin', 'user']),
 *   }).optional(),
 * });
 *
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers,
 *   context: firmContext(contextSchema, async ({ req }) => {
 *     const user = await getUserFromToken(req.headers.authorization);
 *     return { user };
 *   }),
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

    throw new ValidationError('Context validation failed', result.errors);
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  firmArgs,
  createFirmPlugin,
  createFirmDirective,
  generateInputType,
  firmContext,
};
