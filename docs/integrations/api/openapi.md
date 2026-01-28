# OpenAPI 3.0 Integration

FIRM can automatically generate OpenAPI 3.0 specifications from your validation schemas.

## Installation

```bash
npm install firm-validator
```

No additional dependencies required!

## Quick Start

```typescript
import { s } from 'firm-validator';
import { generateOpenAPI, schemaToOpenAPI } from 'firm-validator/integrations/openapi';

// Define your schemas
const userSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional()
});

// Generate OpenAPI spec
const spec = generateOpenAPI({
  info: {
    title: 'User API',
    version: '1.0.0',
    description: 'API for managing users'
  },
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: schemaToOpenAPI(s.number().int().min(1))
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(s.array(userSchema))
              }
            }
          }
        }
      },
      post: {
        summary: 'Create user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schemaToOpenAPI(userSchema)
            }
          }
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(userSchema)
              }
            }
          }
        }
      }
    }
  }
});

// spec is a valid OpenAPI 3.0 specification
console.log(JSON.stringify(spec, null, 2));
```

## API Reference

### `schemaToOpenAPI(schema, name?)`

Convert FIRM schema to OpenAPI 3.0 schema.

**Parameters:**
- `schema: Schema<any>` - FIRM validation schema
- `name?: string` - Optional schema name for $ref generation

**Returns:** `OpenAPISchema` - OpenAPI 3.0 schema object

**Example:**

```typescript
// String with constraints
const nameSchema = s.string().min(1).max(100);
const openapi = schemaToOpenAPI(nameSchema);
// { type: 'string', minLength: 1, maxLength: 100 }

// Number with constraints
const ageSchema = s.number().int().min(0).max(150);
const openapi = schemaToOpenAPI(ageSchema);
// { type: 'integer', minimum: 0, maximum: 150 }

// Email
const emailSchema = s.string().email();
const openapi = schemaToOpenAPI(emailSchema);
// { type: 'string', format: 'email' }

// Object
const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  age: s.number().optional()
});
const openapi = schemaToOpenAPI(userSchema);
// {
//   type: 'object',
//   properties: {
//     name: { type: 'string' },
//     email: { type: 'string', format: 'email' },
//     age: { type: 'number' }
//   },
//   required: ['name', 'email']
// }

// Array
const tagsSchema = s.array(s.string()).min(1).max(10);
const openapi = schemaToOpenAPI(tagsSchema);
// {
//   type: 'array',
//   items: { type: 'string' },
//   minItems: 1,
//   maxItems: 10
// }

// Enum
const roleSchema = s.enum(['admin', 'user', 'guest']);
const openapi = schemaToOpenAPI(roleSchema);
// { type: 'string', enum: ['admin', 'user', 'guest'] }

// Union (oneOf)
const idSchema = s.union([s.string(), s.number()]);
const openapi = schemaToOpenAPI(idSchema);
// { oneOf: [{ type: 'string' }, { type: 'number' }] }

// Record (additionalProperties)
const metadataSchema = s.record(s.string());
const openapi = schemaToOpenAPI(metadataSchema);
// {
//   type: 'object',
//   additionalProperties: { type: 'string' }
// }
```

### `generateOpenAPI(config)`

Generate complete OpenAPI 3.0 specification.

**Parameters:**
- `config: Partial<OpenAPISpec>` - OpenAPI configuration
  - `openapi?: string` - OpenAPI version (default: '3.0.0')
  - `info: InfoObject` - API metadata
    - `title: string` - API title
    - `version: string` - API version
    - `description?: string` - API description
  - `servers?: ServerObject[]` - API servers
  - `paths: PathsObject` - API paths
  - `components?: ComponentsObject` - Reusable schemas
  - `security?: SecurityRequirementObject[]` - Security requirements

**Returns:** `OpenAPISpec` - Complete OpenAPI 3.0 specification

**Example:**

```typescript
const spec = generateOpenAPI({
  info: {
    title: 'User API',
    version: '1.0.0',
    description: 'User management API'
  },
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'https://staging-api.example.com', description: 'Staging' }
  ],
  paths: {
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: schemaToOpenAPI(s.string())
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(userSchema)
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: schemaToOpenAPI(userSchema, 'User'),
      Error: schemaToOpenAPI(errorSchema, 'Error')
    }
  }
});
```

### `generateSwaggerUI(spec, title?)`

Generate HTML page with Swagger UI for interactive API documentation.

**Parameters:**
- `spec: OpenAPISpec` - OpenAPI specification
- `title?: string` - Page title (default: 'API Documentation')

**Returns:** `string` - HTML page with Swagger UI

**Example:**

```typescript
const spec = generateOpenAPI({ /* ... */ });
const html = generateSwaggerUI(spec, 'My API Docs');

// Serve with Express
app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Or write to file
import { writeFileSync } from 'fs';
writeFileSync('api-docs.html', html);
```

### `schemaToParameter(schema, name, location)`

Convert FIRM schema to OpenAPI parameter.

**Parameters:**
- `schema: Schema<any>` - FIRM schema
- `name: string` - Parameter name
- `location: 'query' | 'header' | 'path' | 'cookie'` - Parameter location

**Returns:** `ParameterObject` - OpenAPI parameter object

**Example:**

```typescript
const pageParam = schemaToParameter(
  s.number().int().min(1).default(1),
  'page',
  'query'
);
// {
//   name: 'page',
//   in: 'query',
//   schema: { type: 'integer', minimum: 1, default: 1 }
// }
```

## Type Mapping

FIRM schemas map to OpenAPI types as follows:

| FIRM Schema | OpenAPI Type | Notes |
|-------------|--------------|-------|
| `s.string()` | `{ type: 'string' }` | |
| `s.string().email()` | `{ type: 'string', format: 'email' }` | |
| `s.string().url()` | `{ type: 'string', format: 'uri' }` | |
| `s.string().uuid()` | `{ type: 'string', format: 'uuid' }` | |
| `s.number()` | `{ type: 'number' }` | |
| `s.number().int()` | `{ type: 'integer' }` | |
| `s.boolean()` | `{ type: 'boolean' }` | |
| `s.date()` | `{ type: 'string', format: 'date-time' }` | |
| `s.object({...})` | `{ type: 'object', properties: {...} }` | |
| `s.array(T)` | `{ type: 'array', items: T }` | |
| `s.enum([...])` | `{ type: 'string', enum: [...] }` | |
| `s.union([...])` | `{ oneOf: [...] }` | |
| `s.literal(T)` | `{ const: T }` | |
| `s.record(T)` | `{ type: 'object', additionalProperties: T }` | |

## Constraint Mapping

FIRM constraints map to OpenAPI constraints:

| FIRM Constraint | OpenAPI Constraint |
|-----------------|-------------------|
| `.min(n)` (string) | `minLength: n` |
| `.max(n)` (string) | `maxLength: n` |
| `.min(n)` (number) | `minimum: n` |
| `.max(n)` (number) | `maximum: n` |
| `.min(n)` (array) | `minItems: n` |
| `.max(n)` (array) | `maxItems: n` |
| `.optional()` | Removed from `required` array |
| `.default(v)` | `default: v` |

## Advanced Examples

### Complete REST API

```typescript
const userSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  role: s.enum(['admin', 'user']),
  createdAt: s.date()
});

const createUserSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  role: s.enum(['admin', 'user']).default('user')
});

const updateUserSchema = s.object({
  name: s.string().min(1).max(100).optional(),
  email: s.string().email().optional(),
  role: s.enum(['admin', 'user']).optional()
});

const errorSchema = s.object({
  error: s.string(),
  message: s.string(),
  details: s.array(s.object({
    path: s.array(s.string()),
    message: s.string()
  })).optional()
});

const spec = generateOpenAPI({
  info: {
    title: 'User Management API',
    version: '2.0.0',
    description: 'REST API for user management with FIRM validation'
  },
  servers: [
    { url: 'https://api.example.com/v2' }
  ],
  paths: {
    '/users': {
      get: {
        summary: 'List users',
        tags: ['Users'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: schemaToOpenAPI(s.number().int().min(1).default(1))
          },
          {
            name: 'limit',
            in: 'query',
            schema: schemaToOpenAPI(s.number().int().min(1).max(100).default(10))
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(s.array(userSchema))
              }
            }
          }
        }
      },
      post: {
        summary: 'Create user',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schemaToOpenAPI(createUserSchema)
            }
          }
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(userSchema)
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(errorSchema)
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: schemaToOpenAPI(s.number())
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(userSchema)
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      put: {
        summary: 'Update user',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: schemaToOpenAPI(s.number())
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schemaToOpenAPI(updateUserSchema)
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: schemaToOpenAPI(userSchema)
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      delete: {
        summary: 'Delete user',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: schemaToOpenAPI(s.number())
          }
        ],
        responses: {
          '204': {
            description: 'User deleted'
          },
          '404': {
            description: 'User not found'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: schemaToOpenAPI(userSchema, 'User'),
      CreateUserInput: schemaToOpenAPI(createUserSchema, 'CreateUserInput'),
      UpdateUserInput: schemaToOpenAPI(updateUserSchema, 'UpdateUserInput'),
      Error: schemaToOpenAPI(errorSchema, 'Error')
    }
  }
});
```

### Reusable Components

```typescript
// Define reusable schemas
const schemas = {
  User: userSchema,
  Post: postSchema,
  Comment: commentSchema,
  Error: errorSchema,
  PaginationParams: s.object({
    page: s.number().int().min(1).default(1),
    limit: s.number().int().min(1).max(100).default(10)
  })
};

// Convert to OpenAPI components
const components = {
  schemas: Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [
      name,
      schemaToOpenAPI(schema, name)
    ])
  )
};

const spec = generateOpenAPI({
  info: { title: 'My API', version: '1.0.0' },
  components,
  paths: {
    '/users': {
      get: {
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      }
    }
  }
});
```

### With Authentication

```typescript
const spec = generateOpenAPI({
  info: {
    title: 'Secure API',
    version: '1.0.0'
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  paths: {
    '/users': {
      get: {
        security: [{ bearerAuth: [] }],
        // ...
      }
    },
    '/public': {
      get: {
        security: [], // Public endpoint
        // ...
      }
    }
  }
});
```

## Integration with Frameworks

### Express + Swagger UI

```typescript
import express from 'express';
import { generateOpenAPI, generateSwaggerUI } from 'firm-validator/integrations/openapi';

const app = express();

// Generate spec
const spec = generateOpenAPI({ /* ... */ });

// Serve JSON spec
app.get('/api-spec.json', (req, res) => {
  res.json(spec);
});

// Serve Swagger UI
app.get('/api-docs', (req, res) => {
  const html = generateSwaggerUI(spec, 'My API Documentation');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(3000);
```

### Save to File

```typescript
import { writeFileSync } from 'fs';
import { generateOpenAPI } from 'firm-validator/integrations/openapi';

const spec = generateOpenAPI({ /* ... */ });

// Save JSON
writeFileSync('openapi.json', JSON.stringify(spec, null, 2));

// Save YAML (requires js-yaml)
import YAML from 'js-yaml';
writeFileSync('openapi.yaml', YAML.dump(spec));
```

## Best Practices

1. **Define schemas once**: Reuse FIRM schemas for both validation and documentation
2. **Use components**: Extract common schemas to `components.schemas` for reusability
3. **Add descriptions**: Use JSDoc comments on schema properties for better docs
4. **Version your API**: Include version in `info.version` and URL path
5. **Document errors**: Define error schemas and reference them in responses

## Limitations

- Custom refinements (`.refine()`, `.transform()`) are not converted to OpenAPI
- Complex union types may not represent all constraints accurately
- Async validations cannot be represented in OpenAPI

## See Also

- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
- [REST Integration](./rest.md)
- [OpenAPI Specification](https://swagger.io/specification/)
