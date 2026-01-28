/**
 * OpenAPI/Swagger Integration for FIRM Validator
 *
 * Generate OpenAPI 3.0 specifications from FIRM schemas.
 *
 * @example
 * ```typescript
 * import { s } from 'firm-validator';
 * import { generateOpenAPI, schemaToOpenAPI } from 'firm-validator/integrations/openapi';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18),
 * });
 *
 * const spec = generateOpenAPI({
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 *   paths: {
 *     '/users': {
 *       post: {
 *         requestBody: userSchema,
 *         responses: {
 *           200: userWithIdSchema,
 *         },
 *       },
 *     },
 *   },
 * });
 * ```
 */

import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, SecurityScheme>;
  };
  security?: SecurityRequirement[];
}

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description?: string;
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
}

export interface Operation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody | Schema<any>;
  responses: Record<string, Response | Schema<any>>;
  security?: SecurityRequirement[];
}

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: OpenAPISchema | Schema<any>;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: OpenAPISchema | Schema<any> }>;
}

export interface Response {
  description: string;
  content?: Record<string, { schema: OpenAPISchema | Schema<any> }>;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  items?: OpenAPISchema;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
  nullable?: boolean;
  default?: any;
  $ref?: string;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

// ============================================================================
// SCHEMA CONVERTER
// ============================================================================

/**
 * Convert FIRM schema to OpenAPI schema.
 *
 * @param schema - FIRM validation schema
 * @param name - Schema name for $ref
 *
 * @example
 * ```typescript
 * const userSchema = s.object({
 *   name: s.string().min(1).max(100),
 *   email: s.string().email(),
 *   age: s.number().int().min(0).max(150),
 * });
 *
 * const openApiSchema = schemaToOpenAPI(userSchema);
 * // Returns OpenAPI 3.0 schema object
 * ```
 */
export function schemaToOpenAPI(
  schema: Schema<any>,
  name?: string
): OpenAPISchema {
  const config = 'config' in schema ? (schema as any).config : {};
  const type = schema._type;

  // Handle references
  if (name) {
    return { $ref: `#/components/schemas/${name}` };
  }

  // String schema
  if (type === 'string') {
    const result: OpenAPISchema = { type: 'string' };

    if (config.min !== undefined) result.minLength = config.min;
    if (config.max !== undefined) result.maxLength = config.max;
    if (config.pattern) result.pattern = config.pattern.source;
    if (config.format === 'email') result.format = 'email';
    if (config.format === 'url') result.format = 'uri';
    if (config.format === 'uuid') result.format = 'uuid';

    return result;
  }

  // Number schema
  if (type === 'number') {
    const result: OpenAPISchema = {
      type: config.isInt ? 'integer' : 'number',
    };

    if (config.min !== undefined) result.minimum = config.min;
    if (config.max !== undefined) result.maximum = config.max;

    return result;
  }

  // Boolean schema
  if (type === 'boolean') {
    return { type: 'boolean' };
  }

  // Date schema
  if (type === 'date') {
    return { type: 'string', format: 'date-time' };
  }

  // Literal schema
  if (type === 'literal') {
    return { type: typeof config.value, enum: [config.value] };
  }

  // Enum schema
  if (type === 'enum') {
    const values = config.values || [];
    return {
      type: typeof values[0],
      enum: values,
    };
  }

  // Object schema
  if (type === 'object' && config.shape) {
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    for (const [key, fieldSchema] of Object.entries(config.shape)) {
      const field = fieldSchema as any;
      const fieldConfig = 'config' in field ? field.config : {};

      properties[key] = schemaToOpenAPI(field);

      if (!fieldConfig.isOptional && !fieldConfig.isNullable) {
        required.push(key);
      }
    }

    const result: OpenAPISchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    return result;
  }

  // Array schema
  if (type === 'array' && config.element) {
    return {
      type: 'array',
      items: schemaToOpenAPI(config.element),
      minItems: config.min,
      maxItems: config.max,
    };
  }

  // Union schema
  if (type === 'union' && config.options) {
    return {
      oneOf: config.options.map((opt: Schema<any>) => schemaToOpenAPI(opt)),
    };
  }

  // Record schema
  if (type === 'record') {
    return {
      type: 'object',
      additionalProperties: config.valueSchema
        ? schemaToOpenAPI(config.valueSchema)
        : true,
    };
  }

  // Fallback
  return { type: 'object' };
}

// ============================================================================
// OPENAPI GENERATOR
// ============================================================================

/**
 * Generate OpenAPI 3.0 specification.
 *
 * @param config - OpenAPI configuration with FIRM schemas
 *
 * @example
 * ```typescript
 * const spec = generateOpenAPI({
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *     description: 'API documentation',
 *   },
 *   servers: [
 *     { url: 'https://api.example.com', description: 'Production' },
 *   ],
 *   paths: {
 *     '/users': {
 *       get: {
 *         summary: 'List users',
 *         parameters: [
 *           {
 *             name: 'page',
 *             in: 'query',
 *             schema: s.coerce.number().int().min(1),
 *           },
 *         ],
 *         responses: {
 *           200: {
 *             description: 'Success',
 *             content: {
 *               'application/json': {
 *                 schema: s.array(userSchema),
 *               },
 *             },
 *           },
 *         },
 *       },
 *       post: {
 *         summary: 'Create user',
 *         requestBody: createUserSchema,
 *         responses: {
 *           201: userSchema,
 *         },
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function generateOpenAPI(config: Partial<OpenAPISpec>): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: '3.0.3',
    info: config.info || { title: 'API', version: '1.0.0' },
    paths: {},
  };

  if (config.servers) {
    spec.servers = config.servers;
  }

  if (config.security) {
    spec.security = config.security;
  }

  if (config.components) {
    spec.components = config.components;
  }

  // Process paths
  if (config.paths) {
    for (const [path, pathItem] of Object.entries(config.paths)) {
      spec.paths[path] = processPathItem(pathItem);
    }
  }

  return spec;
}

function processPathItem(pathItem: PathItem): PathItem {
  const result: PathItem = {};

  for (const [method, operation] of Object.entries(pathItem)) {
    if (operation) {
      result[method as keyof PathItem] = processOperation(operation as Operation);
    }
  }

  return result;
}

function processOperation(operation: Operation): Operation {
  const result: Operation = {
    ...operation,
    responses: {},
  };

  // Process parameters
  if (operation.parameters) {
    result.parameters = operation.parameters.map((param) => ({
      ...param,
      schema: isSchema(param.schema)
        ? schemaToOpenAPI(param.schema as Schema<any>)
        : param.schema,
    }));
  }

  // Process request body
  if (operation.requestBody) {
    if (isSchema(operation.requestBody)) {
      result.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: schemaToOpenAPI(operation.requestBody as Schema<any>),
          },
        },
      };
    } else {
      result.requestBody = operation.requestBody;
    }
  }

  // Process responses
  for (const [status, response] of Object.entries(operation.responses)) {
    if (isSchema(response)) {
      result.responses[status] = {
        description: getResponseDescription(status),
        content: {
          'application/json': {
            schema: schemaToOpenAPI(response as Schema<any>),
          },
        },
      };
    } else {
      result.responses[status] = response as Response;
    }
  }

  return result;
}

function isSchema(obj: any): boolean {
  return obj && typeof obj === 'object' && '_type' in obj;
}

function getResponseDescription(status: string): string {
  const descriptions: Record<string, string> = {
    '200': 'Success',
    '201': 'Created',
    '204': 'No Content',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '500': 'Internal Server Error',
  };
  return descriptions[status] || 'Response';
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate OpenAPI YAML string.
 *
 * @example
 * ```typescript
 * const yaml = generateOpenAPIYAML(spec);
 * fs.writeFileSync('openapi.yaml', yaml);
 * ```
 */
export function generateOpenAPIYAML(spec: OpenAPISpec): string {
  return JSON.stringify(spec, null, 2); // Simplified, would use yaml library
}

/**
 * Generate Swagger UI HTML.
 *
 * @example
 * ```typescript
 * const html = generateSwaggerUI(spec);
 * res.send(html);
 * ```
 */
export function generateSwaggerUI(spec: OpenAPISpec, title?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title || spec.info.title} - API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(spec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
    });
  </script>
</body>
</html>
  `.trim();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  schemaToOpenAPI,
  generateOpenAPI,
  generateOpenAPIYAML,
  generateSwaggerUI,
};
