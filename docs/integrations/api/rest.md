# REST API Helpers

FIRM provides framework-agnostic helpers for REST API validation.

## Installation

```bash
npm install firm-validator
```

No additional dependencies required - works with any HTTP framework!

## Quick Start

```typescript
import { s } from 'firm-validator';
import { createRestValidator, validateRequest } from 'firm-validator/integrations/rest';

// Define schemas for each HTTP method
const userEndpoints = createRestValidator({
  GET: {
    query: s.object({
      page: s.coerce.number().int().min(1).default(1),
      limit: s.coerce.number().int().max(100).default(10)
    })
  },
  POST: {
    body: s.object({
      name: s.string().min(1),
      email: s.string().email()
    })
  },
  PUT: {
    params: s.object({
      id: s.string()
    }),
    body: s.object({
      name: s.string().optional(),
      email: s.string().email().optional()
    })
  },
  DELETE: {
    params: s.object({
      id: s.string()
    })
  }
});

// Use in any framework
app.get('/users', (req, res) => {
  const result = validateRequest(req, userEndpoints.GET);

  if (!result.ok) {
    return res.status(400).json({ errors: result.errors });
  }

  const { page, limit } = result.data.query;
  // Handle request...
});
```

## API Reference

### `createRestValidator(schemas)`

Create REST validator with schemas for each HTTP method.

**Parameters:**
- `schemas: RestValidator` - Object mapping HTTP methods to schemas
  - Each method can have: `body`, `query`, `params`, `headers` schemas

**Returns:** `RestValidator` - Same structure, normalized

**Example:**

```typescript
const validator = createRestValidator({
  GET: {
    query: s.object({
      search: s.string().optional(),
      page: s.coerce.number().int().min(1)
    })
  },
  POST: {
    body: s.object({
      name: s.string(),
      email: s.string().email()
    }),
    headers: s.object({
      'content-type': s.literal('application/json')
    })
  }
});
```

### `validateRequest(request, schemas, options?)`

Validate REST request against schemas.

**Parameters:**
- `request: { body?, query?, params?, headers? }` - Request object
- `schemas: RestEndpointSchema<T>` - Schemas for validation
  - `body?: Schema<T>` - Body schema
  - `query?: Schema<any>` - Query schema
  - `params?: Schema<any>` - Params schema
  - `headers?: Schema<any>` - Headers schema
- `options?: ValidationOptions` - Validation options
  - `abortEarly?: boolean` - Stop on first error (default: false)

**Returns:** `ValidationResult<{ body?, query?, params?, headers? }>`

**Example:**

```typescript
const result = validateRequest(
  {
    body: { name: 'John', email: 'john@example.com' },
    query: { page: '1' },
    params: { id: '123' }
  },
  {
    body: userSchema,
    query: paginationSchema,
    params: idSchema
  }
);

if (result.ok) {
  const { body, query, params } = result.data;
  // All validated and typed
}
```

### `validateResponse(response, schema, options?)`

Validate REST response against schema.

**Parameters:**
- `response: { status: number; body: unknown }` - Response object
- `schema: Schema<T>` - Response schema
- `options?: ValidationOptions` - Validation options

**Returns:** `ValidationResult<T>`

**Example:**

```typescript
const result = validateResponse(
  {
    status: 200,
    body: { id: 1, name: 'John', email: 'john@example.com' }
  },
  s.object({
    id: s.number(),
    name: s.string(),
    email: s.string().email()
  })
);

if (result.ok) {
  const user = result.data; // Typed as { id: number; name: string; email: string }
}
```

### `createRestClient(config)`

Create typed HTTP client with automatic validation.

**Parameters:**
- `config: RestClientConfig` - Client configuration
  - `baseURL: string` - Base URL for requests
  - `endpoints: Record<string, EndpointConfig>` - Endpoint configurations
  - `headers?: Record<string, string>` - Default headers

**EndpointConfig:**
- `method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'` - HTTP method
- `path: string` - Endpoint path (can include `:param` placeholders)
- `request?: Schema<any>` - Request schema
- `response: Schema<T>` - Response schema

**Returns:** Type-safe client with methods for each endpoint

**Example:**

```typescript
const client = createRestClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token'
  },
  endpoints: {
    getUser: {
      method: 'GET',
      path: '/users/:id',
      response: s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email()
      })
    },
    createUser: {
      method: 'POST',
      path: '/users',
      request: s.object({
        name: s.string(),
        email: s.string().email()
      }),
      response: s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email()
      })
    }
  }
});

// Type-safe usage
const user = await client.getUser({ params: { id: '1' } });
// user is typed as { id: number; name: string; email: string }

const newUser = await client.createUser({
  body: { name: 'John', email: 'john@example.com' }
});
```

### `formatRestError(errors)`

Format validation errors for REST responses.

**Parameters:**
- `errors: any[]` - Validation errors

**Returns:** `{ error: string; message: string; details: any[] }`

**Example:**

```typescript
const result = validateRequest(req, schemas);

if (!result.ok) {
  const errorResponse = formatRestError(result.errors);
  return res.status(400).json(errorResponse);
}

// Response:
// {
//   "error": "Validation Error",
//   "message": "Request validation failed",
//   "details": [
//     {
//       "location": "body",
//       "path": ["email"],
//       "code": "INVALID_EMAIL",
//       "message": "Invalid email format"
//     }
//   ]
// }
```

### `createRestEndpoint(config)`

Create single REST endpoint with validation.

**Parameters:**
- `config: EndpointConfig` - Endpoint configuration
  - `method: string` - HTTP method
  - `request?: RestEndpointSchema` - Request schemas
  - `response: Schema<T>` - Response schema
  - `handler: (data) => Promise<T> | T` - Request handler

**Returns:** Request handler with validation

**Example:**

```typescript
const getUserEndpoint = createRestEndpoint({
  method: 'GET',
  request: {
    params: s.object({ id: s.string() }),
    query: s.object({ include: s.string().optional() })
  },
  response: s.object({
    id: s.number(),
    name: s.string(),
    email: s.string().email()
  }),
  handler: async ({ params, query }) => {
    return db.users.findById(params.id, { include: query.include });
  }
});

app.get('/users/:id', async (req, res) => {
  const result = await getUserEndpoint(req);

  if (!result.ok) {
    return res.status(400).json({ errors: result.errors });
  }

  res.json(result.data);
});
```

## Error Handling

### Default Error Format

Validation errors follow a consistent structure:

```json
{
  "error": "Validation Error",
  "message": "Request validation failed",
  "details": [
    {
      "location": "body",
      "path": ["email"],
      "code": "INVALID_EMAIL",
      "message": "Invalid email format"
    },
    {
      "location": "query",
      "path": ["page"],
      "code": "TOO_SMALL",
      "message": "Must be at least 1"
    }
  ]
}
```

### Custom Error Handling

```typescript
const result = validateRequest(req, schemas);

if (!result.ok) {
  // Custom error response
  return res.status(422).json({
    success: false,
    errors: result.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  });
}
```

## TypeScript Support

FIRM provides full TypeScript support with type inference:

```typescript
const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  age: s.number()
});

const result = validateRequest(req, { body: userSchema });

if (result.ok) {
  // TypeScript knows result.data.body has type:
  // { name: string; email: string; age: number }
  const name: string = result.data.body.name;
  const email: string = result.data.body.email;
  const age: number = result.data.body.age;
}
```

## Framework Examples

### Express

```typescript
import express from 'express';
import { validateRequest, formatRestError } from 'firm-validator/integrations/rest';

const app = express();
app.use(express.json());

app.post('/users', (req, res) => {
  const result = validateRequest(req, {
    body: s.object({
      name: s.string(),
      email: s.string().email()
    })
  });

  if (!result.ok) {
    return res.status(400).json(formatRestError(result.errors));
  }

  const user = result.data.body;
  res.json({ success: true, user });
});
```

### Fastify

```typescript
import Fastify from 'fastify';
import { validateRequest } from 'firm-validator/integrations/rest';

const fastify = Fastify();

fastify.post('/users', async (request, reply) => {
  const result = validateRequest(request, {
    body: userSchema
  });

  if (!result.ok) {
    return reply.code(400).send({ errors: result.errors });
  }

  const user = result.data.body;
  return { success: true, user };
});
```

### Hono

```typescript
import { Hono } from 'hono';
import { validateRequest } from 'firm-validator/integrations/rest';

const app = new Hono();

app.post('/users', async (c) => {
  const result = validateRequest(
    { body: await c.req.json() },
    { body: userSchema }
  );

  if (!result.ok) {
    return c.json({ errors: result.errors }, 400);
  }

  return c.json({ success: true, user: result.data.body });
});
```

## Advanced Examples

### CRUD API

```typescript
const userEndpoints = createRestValidator({
  // List users
  GET: {
    query: s.object({
      page: s.coerce.number().int().min(1).default(1),
      limit: s.coerce.number().int().max(100).default(10),
      search: s.string().optional()
    })
  },

  // Create user
  POST: {
    body: s.object({
      name: s.string().min(1),
      email: s.string().email(),
      role: s.enum(['admin', 'user']).default('user')
    })
  },

  // Update user
  PUT: {
    params: s.object({
      id: s.string()
    }),
    body: s.object({
      name: s.string().min(1).optional(),
      email: s.string().email().optional(),
      role: s.enum(['admin', 'user']).optional()
    })
  },

  // Delete user
  DELETE: {
    params: s.object({
      id: s.string()
    })
  }
});

// Use in routes
app.get('/users', (req, res) => {
  const result = validateRequest(req, userEndpoints.GET);
  if (!result.ok) return res.status(400).json(formatRestError(result.errors));

  const { page, limit, search } = result.data.query;
  // Handle request...
});

app.post('/users', (req, res) => {
  const result = validateRequest(req, userEndpoints.POST);
  if (!result.ok) return res.status(400).json(formatRestError(result.errors));

  const user = result.data.body;
  // Handle request...
});
```

### Typed HTTP Client

```typescript
const api = createRestClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  },
  endpoints: {
    listUsers: {
      method: 'GET',
      path: '/users',
      response: s.array(s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email()
      }))
    },

    getUser: {
      method: 'GET',
      path: '/users/:id',
      response: s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email()
      })
    },

    createUser: {
      method: 'POST',
      path: '/users',
      request: s.object({
        name: s.string(),
        email: s.string().email()
      }),
      response: s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email()
      })
    }
  }
});

// Type-safe usage
const users = await api.listUsers();
const user = await api.getUser({ params: { id: '1' } });
const newUser = await api.createUser({
  body: { name: 'John', email: 'john@example.com' }
});
```

## Performance Tips

1. **Reuse validators**: Create validators once, reuse across routes
2. **Pre-compile schemas**: Use schema compiler for hot paths
3. **Enable abort early**: Stop on first error for faster validation

```typescript
import { compile } from 'firm-validator';

const validators = {
  user: compile(userSchema),
  pagination: compile(paginationSchema)
};

// Reuse across routes
app.get('/users', (req, res) => {
  const result = validateRequest(req, { query: validators.pagination });
  // ...
});

app.post('/users', (req, res) => {
  const result = validateRequest(req, { body: validators.user });
  // ...
});
```

## See Also

- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
- [Validation Guide](../../core-concepts/validation.md)
- [Backend Integrations](../backend/README.md)
