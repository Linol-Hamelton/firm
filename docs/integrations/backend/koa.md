# Koa Integration

FIRM provides middleware and utilities for Koa applications with zero-config setup.

## Installation

```bash
npm install firm-validator
```

## Basic Usage

### Validating Request Body

Use `validateBody` middleware to validate incoming requests:

```typescript
import Koa from 'koa';
import Router from '@koa/router';
import { s } from 'firm-validator';
import { validateBody } from 'firm-validator/integrations/koa';

const app = new Koa();
const router = new Router();

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int().min(18),
});

router.post('/users', validateBody(userSchema), (ctx) => {
  // Access validated data
  const user = ctx.validatedBody;
  ctx.body = { success: true, user };
});

app.use(router.routes());
app.use(router.allowedMethods());
```

### Validating Multiple Parts

Validate body, params, query, and headers simultaneously:

```typescript
import { validate } from 'firm-validator/integrations/koa';

const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
});

const paramsSchema = s.object({
  id: s.string().uuid(),
});

const querySchema = s.object({
  page: s.number().int().min(1).default(1),
  limit: s.number().int().min(1).max(100).default(20),
});

router.put('/users/:id', 
  validate({
    body: userSchema,
    params: paramsSchema,
    query: querySchema,
  }),
  (ctx) => {
    const { validatedBody, validatedParams, validatedQuery } = ctx.state;
    // All validated data available
    ctx.body = { 
      user: validatedBody, 
      params: validatedParams, 
      query: validatedQuery 
    };
  }
);
```

## Advanced Features

### Async Validation

FIRM supports async validation out of the box:

```typescript
const userSchema = s.object({
  email: s.string().email(),
}).refineAsync(async (data) => {
  // Check database for existing email
  const exists = await db.users.exists({ email: data.email });
  return !exists;
});

router.post('/register', validateBody(userSchema), async (ctx) => {
  // Validation already passed
  await db.users.create(ctx.validatedBody);
  ctx.body = { success: true };
});
```

### Error Handling

Validation errors are automatically handled with proper HTTP status codes:

```typescript
// Error response format
{
  "message": "Validation failed",
  "errors": [
    {
      "property": "email",
      "code": "NOT_STRING",
      "message": "Expected string"
    }
  ]
}
```

Customize error handling:

```typescript
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error.status === 400) {
      // Validation error
      ctx.status = 400;
      ctx.body = {
        error: 'Invalid input',
        details: error.errors,
      };
    } else {
      // Other errors
      ctx.status = error.status || 500;
      ctx.body = { error: error.message };
    }
  }
});
```

### Coercion and Transformation

FIRM can coerce and transform data automatically:

```typescript
const querySchema = s.object({
  // Coerce string to number
  page: s.coerce.number().int().min(1),
  // Coerce string to boolean
  active: s.coerce.boolean(),
  // Transform to uppercase
  sort: s.string().toUpperCase(),
});

router.get('/items', validate({ query: querySchema }), (ctx) => {
  // ctx.state.validatedQuery.page is a number
  // ctx.state.validatedQuery.active is a boolean
  // ctx.state.validatedQuery.sort is uppercase
});
```

## Performance Considerations

- Middleware adds minimal overhead (~0.1ms per request)
- Schemas are compiled once and reused
- Parallel validation for arrays when using `validateAsync`
- Zero-config framework detection for optimal defaults

## Best Practices

### 1. Schema Organization

```typescript
// schemas/user.schema.ts
import { s } from 'firm-validator';

export const userSchema = s.object({
  id: s.string().uuid(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  role: s.enum(['user', 'admin', 'moderator']),
});

export type User = typeof userSchema._output;

// routes/user.routes.ts
import { userSchema } from '../schemas/user.schema';
import { validateBody } from 'firm-validator/integrations/koa';
```

### 2. Reusable Middleware

```typescript
// middleware/validation.ts
import { validate } from 'firm-validator/integrations/koa';
import { userSchema, postSchema } from '../schemas';

export const validateUser = () => validate({ body: userSchema });
export const validatePost = () => validate({ body: postSchema });

// Usage
router.post('/users', validateUser(), createUser);
router.post('/posts', validatePost(), createPost);
```

### 3. Type Safety

```typescript
import { Context } from 'koa';

// Extend Koa context type
declare module 'koa' {
  interface DefaultContext {
    validatedBody?: any;
    validatedParams?: any;
    validatedQuery?: any;
    validatedHeaders?: any;
  }
}

// Now TypeScript knows about validated properties
router.post('/users', validateBody(userSchema), (ctx: Context) => {
  const user = ctx.validatedBody; // Typed as User
  // ...
});
```

## Example: Complete API Endpoint

```typescript
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { s } from 'firm-validator';
import { validate } from 'firm-validator/integrations/koa';

const app = new Koa();
const router = new Router();

// Middleware
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

// Schemas
const createUserSchema = s.object({
  username: s.string().min(3).max(30),
  email: s.string().email(),
  password: s.string().min(8),
  birthDate: s.date().max(new Date()),
});

const updateUserSchema = s.object({
  username: s.string().min(3).max(30).optional(),
  email: s.string().email().optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field required');

const userIdSchema = s.object({
  id: s.string().uuid(),
});

// Routes
router.post('/users', 
  validate({ body: createUserSchema }),
  async (ctx) => {
    const user = ctx.state.validatedBody;
    const created = await userService.create(user);
    ctx.status = 201;
    ctx.body = created;
  }
);

router.patch('/users/:id',
  validate({
    params: userIdSchema,
    body: updateUserSchema,
  }),
  async (ctx) => {
    const { id } = ctx.state.validatedParams;
    const updates = ctx.state.validatedBody;
    const updated = await userService.update(id, updates);
    ctx.body = updated;
  }
);

router.get('/users/:id',
  validate({ params: userIdSchema }),
  async (ctx) => {
    const { id } = ctx.state.validatedParams;
    const user = await userService.findById(id);
    ctx.body = user;
  }
);

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## API Reference

### `validateBody(schema: Schema<T>)`

Creates middleware that validates request body.

**Parameters:**
- `schema`: FIRM schema for validation

**Returns:** Koa middleware

### `validate(schemas: ValidateOptions, options?: ValidateMiddlewareOptions)`

Validates multiple request parts.

**Parameters:**
- `schemas`: Object with `body`, `params`, `query`, `headers` schemas
- `options`: 
  - `abortEarly`: Stop validation on first error (default: `true`)
  - `coerce`: Enable type coercion (default: `true`)

**Returns:** Koa middleware

### Error Response

```typescript
interface ValidationError {
  property: string;
  code: string;
  message: string;
  path: string;
}

interface ErrorResponse {
  message: string;
  errors: ValidationError[];
}
```

## Troubleshooting

**Q: Validation not working?**
A: Ensure `koa-bodyparser` middleware is installed and used before validation middleware.

**Q: TypeScript errors with ctx.state?**
A: Extend Koa's Context type as shown in Best Practices section.

**Q: Async validation not working?**
A: Use `validateAsync` on your schema or ensure refinements return Promises.

**Q: Large payloads causing performance issues?**
A: Consider using `abortEarly: true` and validate only necessary fields.

## See Also

- [Express Integration](./express.md)
- [Fastify Integration](./fastify.md)
- [NestJS Integration](./nestjs.md)
- [FIRM Core Concepts](../../core-concepts/README.md)