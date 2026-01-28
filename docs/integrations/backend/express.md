# Express.js Integration

The FIRM validator provides seamless integration with Express.js through middleware functions.

## Installation

```bash
npm install firm-validator express
```

## Quick Start

```typescript
import express from 'express';
import { s } from 'firm-validator';
import { validate } from 'firm-validator/integrations/express';

const app = express();
app.use(express.json());

// Define schema
const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int().min(18)
});

// Use middleware
app.post('/users', validate({ body: userSchema }), (req, res) => {
  // req.body is now typed and validated
  res.json({ success: true, user: req.body });
});

app.listen(3000);
```

## API Reference

### `validate(options)`

Main middleware function for validating requests.

**Options:**
- `body?: Schema<T>` - Validate request body
- `params?: Schema<T>` - Validate route params
- `query?: Schema<T>` - Validate query string
- `headers?: Schema<T>` - Validate headers
- `abortEarly?: boolean` - Stop on first error (default: true)
- `onError?: (errors, req, res) => void` - Custom error handler

**Example:**

```typescript
app.post('/users/:id',
  validate({
    body: s.object({
      name: s.string(),
      email: s.string().email()
    }),
    params: s.object({
      id: s.string().min(1)
    }),
    query: s.object({
      notify: s.coerce.boolean().optional()
    })
  }),
  (req, res) => {
    // All validated
    const { id } = req.params;
    const { name, email } = req.body;
    const { notify } = req.query;

    res.json({ success: true });
  }
);
```

### Shorthand Functions

#### `validateBody(schema)`

Validate only the request body.

```typescript
app.post('/users',
  validateBody(userSchema),
  (req, res) => {
    res.json({ user: req.body });
  }
);
```

#### `validateParams(schema)`

Validate only route parameters.

```typescript
app.get('/users/:id',
  validateParams(s.object({ id: s.string() })),
  (req, res) => {
    res.json({ id: req.params.id });
  }
);
```

#### `validateQuery(schema)`

Validate only query parameters.

```typescript
app.get('/users',
  validateQuery(s.object({
    page: s.coerce.number().int().min(1),
    limit: s.coerce.number().int().max(100)
  })),
  (req, res) => {
    const { page, limit } = req.query;
    res.json({ page, limit });
  }
);
```

#### `validateHeaders(schema)`

Validate request headers.

```typescript
app.get('/api/data',
  validateHeaders(s.object({
    authorization: s.string()
  })),
  (req, res) => {
    res.json({ authorized: true });
  }
);
```

## Error Handling

### Default Error Response

By default, validation errors return a 400 status with this structure:

```json
{
  "success": false,
  "errors": [
    {
      "location": "body",
      "path": "email",
      "code": "INVALID_EMAIL",
      "message": "Invalid email format"
    }
  ]
}
```

### Custom Error Handler

You can customize error responses:

```typescript
app.post('/users',
  validate({
    body: userSchema,
    onError: (errors, req, res) => {
      // Custom error response
      res.status(422).json({
        message: 'Validation failed',
        details: errors.errors
      });
    }
  }),
  (req, res) => {
    res.json({ success: true });
  }
);
```

## TypeScript Support

FIRM provides full TypeScript support with type inference:

```typescript
const userSchema = s.object({
  name: s.string(),
  age: s.number()
});

app.post('/users',
  validateBody(userSchema),
  (req, res) => {
    // TypeScript knows req.body has { name: string, age: number }
    const name: string = req.body.name;
    const age: number = req.body.age;
  }
);
```

## Advanced Examples

### Multiple Validation Sources

```typescript
app.put('/users/:id',
  validate({
    params: s.object({
      id: s.string()
    }),
    body: s.object({
      name: s.string(),
      email: s.string().email()
    }),
    query: s.object({
      notify: s.coerce.boolean().default(false)
    })
  }),
  (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const { notify } = req.query;

    res.json({ id, name, email, notify });
  }
);
```

### Async Validation

```typescript
const usernameSchema = s.string().refineAsync(
  async (username) => {
    const exists = await db.users.exists({ username });
    return !exists;
  },
  { message: 'Username already taken' }
);

app.post('/register',
  validateBody(s.object({
    username: usernameSchema,
    password: s.string().min(8)
  })),
  (req, res) => {
    res.json({ success: true });
  }
);
```

### Coercion

Express query parameters are always strings. Use coercion to convert them:

```typescript
app.get('/products',
  validateQuery(s.object({
    page: s.coerce.number().int().min(1),
    category: s.coerce.string(),
    inStock: s.coerce.boolean().optional()
  })),
  (req, res) => {
    // page is now a number
    // inStock is now a boolean
    const { page, category, inStock } = req.query;

    res.json({ page, category, inStock });
  }
);
```

## Performance Tips

1. **Reuse schemas**: Define schemas once, reuse across routes
2. **Use compiled validators**: Pre-compile schemas for hot paths
3. **Enable abort early**: Stop on first error (enabled by default)

```typescript
import { compile } from 'firm-validator';

const userSchema = s.object({
  name: s.string(),
  email: s.string().email()
});

// Compile once
const validateUser = compile(userSchema);

// Use in multiple routes
app.post('/users', validateBody(userSchema), handler);
app.put('/users/:id', validateBody(userSchema), handler);
```

## See Also

- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
- [Validation Guide](../../core-concepts/validation.md)
