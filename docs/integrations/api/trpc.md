# tRPC Integration

FIRM provides seamless integration with tRPC for end-to-end typesafe APIs.

## Installation

```bash
npm install firm-validator @trpc/server
```

## Quick Start

```typescript
import { initTRPC } from '@trpc/server';
import { s } from 'firm-validator';
import { firmInput } from 'firm-validator/integrations/trpc';

const t = initTRPC.create();

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().min(18)
});

export const appRouter = t.router({
  createUser: t.procedure
    .input(firmInput(userSchema))
    .mutation(({ input }) => {
      // input is typed as { name: string; email: string; age: number }
      return { id: 1, ...input };
    }),
});
```

## API Reference

### `firmInput(schema, options?)`

Create tRPC input validator from FIRM schema.

**Parameters:**
- `schema: Schema<T>` - FIRM validation schema
- `options?: FirmInputOptions` - Validation options
  - `errorTransformer?: (errors: any[]) => Error` - Custom error transformer

**Returns:** `(input: unknown) => T`

**Example:**

```typescript
const createUserInput = firmInput(
  s.object({
    name: s.string().min(1),
    email: s.string().email(),
  })
);

export const appRouter = t.router({
  createUser: t.procedure
    .input(createUserInput)
    .mutation(({ input }) => {
      // input: { name: string; email: string }
      return createUser(input);
    }),
});
```

### `firmOutput(schema, options?)`

Create tRPC output validator from FIRM schema.

Validates procedure output (useful for ensuring API contracts).

**Parameters:**
- `schema: Schema<T>` - FIRM validation schema
- `options?: FirmInputOptions` - Validation options

**Returns:** `(output: unknown) => T`

**Example:**

```typescript
const userOutputSchema = s.object({
  id: s.number(),
  name: s.string(),
  email: s.string().email(),
});

export const appRouter = t.router({
  getUser: t.procedure
    .input(firmInput(s.object({ id: s.number() })))
    .output(firmOutput(userOutputSchema))
    .query(({ input }) => {
      return db.users.findById(input.id);
    }),
});
```

### `createFirmMiddleware()`

Create tRPC middleware for validating inputs.

**Example:**

```typescript
const firmMiddleware = createFirmMiddleware();

const protectedProcedure = t.procedure.use(firmMiddleware);

export const appRouter = t.router({
  createUser: protectedProcedure
    .input(firmInput(userSchema))
    .mutation(({ input }) => {
      return createUser(input);
    }),
});
```

### `createFirmRouter(t, procedures)`

Create type-safe tRPC router with FIRM validation.

**Parameters:**
- `t: TRPC` - tRPC instance
- `procedures: Record<string, ProcedureConfig>` - Procedure configurations
  - `input?: Schema<T>` - Input schema
  - `output?: Schema<T>` - Output schema
  - `mutation?: Function` - Mutation handler
  - `query?: Function` - Query handler

**Example:**

```typescript
const router = createFirmRouter(t, {
  createUser: {
    input: s.object({
      name: s.string(),
      email: s.string().email(),
    }),
    output: s.object({
      id: s.number(),
      name: s.string(),
      email: s.string(),
    }),
    mutation: async ({ input }) => {
      return createUser(input);
    },
  },
  getUser: {
    input: s.object({
      id: s.number(),
    }),
    output: s.object({
      id: s.number(),
      name: s.string(),
      email: s.string(),
    }),
    query: async ({ input }) => {
      return db.users.findById(input.id);
    },
  },
});
```

### `firmContext(schema, contextFn)`

Type-safe wrapper for tRPC context with validation.

**Parameters:**
- `schema: Schema<T>` - Context schema
- `contextFn: (opts: any) => Promise<unknown> | unknown` - Context function

**Returns:** `Promise<T>`

**Example:**

```typescript
const contextSchema = s.object({
  user: s.object({
    id: s.number(),
    role: s.enum(['admin', 'user']),
  }).optional(),
});

export const createContext = firmContext(contextSchema, async ({ req }) => {
  const user = await getUserFromToken(req.headers.authorization);
  return { user };
});

const t = initTRPC.context<typeof createContext>().create();
```

## Error Handling

### Default Error Response

By default, validation errors throw `ValidationError`:

```typescript
{
  message: 'Input validation failed',
  errors: [
    {
      path: ['email'],
      code: 'INVALID_EMAIL',
      message: 'Invalid email format'
    }
  ]
}
```

### Custom Error Transformer

You can customize error responses:

```typescript
const input = firmInput(userSchema, {
  errorTransformer: (errors) => {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation failed',
      cause: errors
    });
  }
});
```

## TypeScript Support

FIRM provides full TypeScript support with type inference:

```typescript
const userSchema = s.object({
  name: s.string(),
  age: s.number(),
  role: s.enum(['admin', 'user'])
});

export const appRouter = t.router({
  createUser: t.procedure
    .input(firmInput(userSchema))
    .mutation(({ input }) => {
      // TypeScript knows:
      // input.name is string
      // input.age is number
      // input.role is 'admin' | 'user'
      const name: string = input.name;
      const age: number = input.age;
      const role: 'admin' | 'user' = input.role;
    }),
});
```

## Advanced Examples

### Multiple Procedures

```typescript
export const appRouter = t.router({
  users: t.router({
    create: t.procedure
      .input(firmInput(s.object({
        name: s.string(),
        email: s.string().email()
      })))
      .mutation(({ input }) => {
        return db.users.create(input);
      }),

    update: t.procedure
      .input(firmInput(s.object({
        id: s.number(),
        name: s.string().optional(),
        email: s.string().email().optional()
      })))
      .mutation(({ input }) => {
        return db.users.update(input.id, input);
      }),

    delete: t.procedure
      .input(firmInput(s.object({
        id: s.number()
      })))
      .mutation(({ input }) => {
        return db.users.delete(input.id);
      }),

    list: t.procedure
      .input(firmInput(s.object({
        page: s.number().int().min(1).default(1),
        limit: s.number().int().max(100).default(10)
      })))
      .query(({ input }) => {
        return db.users.list(input.page, input.limit);
      }),
  }),
});
```

### Complex Nested Schemas

```typescript
const addressSchema = s.object({
  street: s.string(),
  city: s.string(),
  country: s.string(),
  zip: s.string()
});

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int().min(0).max(150),
  address: addressSchema,
  tags: s.array(s.string()).optional(),
  metadata: s.record(s.string()).optional()
});

export const appRouter = t.router({
  createUser: t.procedure
    .input(firmInput(userSchema))
    .mutation(({ input }) => {
      // Full type safety for nested objects
      return db.users.create(input);
    }),
});
```

### Union Types

```typescript
const createEventSchema = s.union([
  s.object({
    type: s.literal('user_created'),
    userId: s.number(),
    userName: s.string()
  }),
  s.object({
    type: s.literal('user_deleted'),
    userId: s.number()
  }),
  s.object({
    type: s.literal('user_updated'),
    userId: s.number(),
    changes: s.record(s.unknown())
  })
]);

export const appRouter = t.router({
  createEvent: t.procedure
    .input(firmInput(createEventSchema))
    .mutation(({ input }) => {
      // TypeScript narrows type based on discriminant
      if (input.type === 'user_created') {
        console.log(input.userName); // ✅ Available
      }
      return db.events.create(input);
    }),
});
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

const signupSchema = s.object({
  username: usernameSchema,
  email: s.string().email(),
  password: s.string().min(8)
});

export const appRouter = t.router({
  signup: t.procedure
    .input(firmInput(signupSchema))
    .mutation(async ({ input }) => {
      const user = await createUser(input);
      return { success: true, userId: user.id };
    }),
});
```

## Performance Tips

1. **Reuse schemas**: Define schemas once, reuse across procedures
2. **Pre-compile schemas**: Use schema compiler for hot paths
3. **Use output validation selectively**: Only validate critical outputs

```typescript
import { compile } from 'firm-validator';

const userSchema = s.object({
  name: s.string(),
  email: s.string().email()
});

// Compile once at module level
const validateUser = compile(userSchema);

// Use in multiple procedures
export const appRouter = t.router({
  createUser: t.procedure.input(firmInput(userSchema)).mutation(...),
  updateUser: t.procedure.input(firmInput(userSchema)).mutation(...),
});
```

## Client-Side Type Safety

FIRM schemas work seamlessly with tRPC client:

```typescript
// server.ts
export const appRouter = t.router({
  createUser: t.procedure
    .input(firmInput(userSchema))
    .mutation(({ input }) => {
      return createUser(input);
    }),
});

export type AppRouter = typeof appRouter;

// client.ts
import { createTRPCProxyClient } from '@trpc/client';
import type { AppRouter } from './server';

const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
});

// Full type safety on client
await client.createUser.mutate({
  name: 'John',
  email: 'john@example.com',  // ✅ Typed
  age: 25
});
```

## See Also

- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
- [Validation Guide](../../core-concepts/validation.md)
- [tRPC Documentation](https://trpc.io)
