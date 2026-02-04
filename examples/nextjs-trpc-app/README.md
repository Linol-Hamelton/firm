# Next.js + tRPC + FIRM Validation

Production-ready Next.js 14+ App Router example with tRPC and FIRM validation.

## Features

- ✅ **Next.js 14+ App Router** - Latest Next.js with Server Components
- ✅ **tRPC** - End-to-end typesafe APIs
- ✅ **FIRM Validation** - Pre-compiled schemas for maximum performance
- ✅ **React Query** - Powerful data fetching and caching
- ✅ **SuperJSON** - Automatic serialization of dates, maps, sets
- ✅ **Full TypeScript** - Complete type safety from database to UI
- ✅ **CRUD Operations** - Complete user management example
- ✅ **Cursor Pagination** - Efficient pagination for large datasets
- ✅ **Search & Filtering** - Real-time search functionality

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
nextjs-trpc-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   ├── providers.tsx         # tRPC & React Query providers
│   │   ├── users/
│   │   │   └── page.tsx          # User management page
│   │   └── api/trpc/[trpc]/
│   │       └── route.ts          # tRPC API route handler
│   ├── server/
│   │   ├── trpc.ts               # tRPC initialization
│   │   └── routers/
│   │       ├── _app.ts           # Root router
│   │       └── user.ts           # User router with FIRM
│   ├── schemas/
│   │   └── user.schema.ts        # FIRM validation schemas
│   └── lib/
│       └── trpc.ts               # tRPC React client
├── package.json
├── tsconfig.json
└── next.config.js
```

## How It Works

### 1. Define Schemas with FIRM

```typescript
// src/schemas/user.schema.ts
import { s } from 'firm-validator';

export const createUserInput = s.object({
  email: s.string().email(),
  name: s.string().min(1).max(100),
  age: s.number().int().min(18).max(120).optional(),
  bio: s.string().max(500).optional(),
}).compile(); // Pre-compile for performance!

export type CreateUserInput = typeof createUserInput.infer;
```

### 2. Create tRPC Router with FIRM Validation

```typescript
// src/server/routers/user.ts
import { router, publicProcedure } from '../trpc';
import { createUserInput } from '@/schemas/user.schema';

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)  // FIRM validation!
    .mutation(({ input }) => {
      // input is fully typed!
      // CreateUserInput type is automatically inferred

      return {
        message: 'User created',
        user: createdUser,
      };
    }),
});
```

### 3. Use in React Components

```typescript
// src/app/users/page.tsx
'use client';

import { trpc } from '@/lib/trpc';

export default function UsersPage() {
  // Fully typed query
  const { data } = trpc.user.list.useQuery({
    limit: 10,
  });

  // Fully typed mutation
  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      alert('User created!');
    },
    onError: (error) => {
      // FIRM validation errors are automatically handled
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  return <div>...</div>;
}
```

## API Endpoints

All endpoints are typesafe through tRPC:

### User Router (`/api/trpc/user.*`)

#### `user.list`
```typescript
// Input
{
  limit: number;      // 1-100, default: 10
  cursor?: number;    // For pagination
  search?: string;    // Search name, email, bio
}

// Output
{
  items: User[];
  nextCursor?: number;
  total: number;
}
```

#### `user.getById`
```typescript
// Input
{ id: number }

// Output
User
```

#### `user.create`
```typescript
// Input
{
  email: string;      // Must be valid email
  name: string;       // 1-100 chars
  age?: number;       // 18-120
  bio?: string;       // Max 500 chars
}

// Output
{
  message: string;
  user: User;
}
```

#### `user.update`
```typescript
// Input
{
  id: number;
  email?: string;
  name?: string;
  age?: number;
  bio?: string;
}
// At least one field must be provided

// Output
{
  message: string;
  user: User;
}
```

#### `user.delete`
```typescript
// Input
{ id: number }

// Output
{ message: string }
```

#### `user.count`
```typescript
// Output
{ total: number }
```

## FIRM Validation Features

### Pre-Compiled Schemas

All schemas are pre-compiled for maximum performance:

```typescript
export const createUserInput = s.object({
  email: s.string().email(),
  name: s.string().min(1),
}).compile(); // 3-10x faster!
```

### Full Type Inference

TypeScript automatically infers types:

```typescript
type CreateUserInput = typeof createUserInput.infer;
// {
//   email: string;
//   name: string;
// }
```

### Automatic Validation

tRPC automatically validates inputs before calling your procedure:

```typescript
publicProcedure
  .input(createUserInput)
  .mutation(({ input }) => {
    // input is GUARANTEED to be valid here
    // No manual validation needed!
  })
```

### Error Handling

FIRM validation errors are automatically converted to tRPC errors:

```typescript
const createMutation = trpc.user.create.useMutation({
  onError: (error) => {
    // error.message contains user-friendly validation error
    console.log(error.message);
    // "Invalid email address"
    // "Name must be at least 1 character"
  },
});
```

### Cross-Field Validation

Complex validation rules:

```typescript
export const updateUserInput = s.object({
  id: s.number().int().positive(),
  name: s.string().optional(),
  email: s.string().email().optional(),
}).refine(
  (data) => {
    const { id, ...rest } = data;
    return Object.keys(rest).length > 0;
  },
  { message: 'At least one field must be provided' }
).compile();
```

## Type Safety

Complete type safety from end to end:

### Backend (tRPC Router)
```typescript
export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(({ input }) => {
      // input: CreateUserInput (fully typed)
      console.log(input.email);  // TypeScript knows this exists
      console.log(input.age);    // TypeScript knows this is optional
    }),
});
```

### Frontend (React Component)
```typescript
const createMutation = trpc.user.create.useMutation();

createMutation.mutate({
  email: 'user@example.com',
  name: 'John Doe',
  age: 25,  // TypeScript knows this is optional
});

// TypeScript error if you forget required fields:
createMutation.mutate({
  email: 'user@example.com',
  // Missing 'name' - TypeScript error!
});
```

## Performance

FIRM validation provides significant performance benefits:

- **Pre-compiled schemas:** 3-10x faster than runtime validation
- **Zero parsing:** Compiled schemas have no interpretation overhead
- **Type coercion:** Automatic with `.coerce` methods
- **Memory efficient:** No schema AST in memory

## Testing

Create a test file:

```typescript
// src/server/routers/user.test.ts
import { createUserInput } from '@/schemas/user.schema';

describe('User validation', () => {
  it('should validate correct user data', () => {
    const result = createUserInput.validate({
      email: 'user@example.com',
      name: 'John Doe',
      age: 25,
    });

    expect(result.ok).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = createUserInput.validate({
      email: 'invalid-email',
      name: 'John Doe',
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0].code).toBe('invalid_email');
  });
});
```

## Extending the Example

### Add Authentication

```typescript
// src/server/trpc.ts
import { TRPCError } from '@trpc/server';

export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Use in routers
export const userRouter = router({
  create: protectedProcedure  // Now requires auth
    .input(createUserInput)
    .mutation(({ input, ctx }) => {
      console.log(ctx.user);  // User is guaranteed to exist
    }),
});
```

### Add Database

Replace in-memory store with real database:

```typescript
// src/server/routers/user.ts
import { prisma } from '@/lib/prisma';

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ input }) => {
      const user = await prisma.user.create({
        data: input,
      });
      return { message: 'User created', user };
    }),
});
```

### Add Real-time Updates

Use tRPC subscriptions:

```typescript
export const userRouter = router({
  onUserCreated: publicProcedure.subscription(() => {
    return observable<User>((emit) => {
      // Emit events when users are created
    });
  }),
});
```

## Common Patterns

### Cursor-based Pagination

```typescript
const { data, fetchNextPage, hasNextPage } = trpc.user.list.useInfiniteQuery(
  { limit: 10 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);
```

### Optimistic Updates

```typescript
const utils = trpc.useContext();

const createMutation = trpc.user.create.useMutation({
  onMutate: async (newUser) => {
    // Cancel outgoing queries
    await utils.user.list.cancel();

    // Snapshot previous value
    const previousUsers = utils.user.list.getData();

    // Optimistically update
    utils.user.list.setData({}, (old) => ({
      ...old!,
      items: [...old!.items, { ...newUser, id: -1 }],
    }));

    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    utils.user.list.setData({}, context?.previousUsers);
  },
});
```

## Learn More

- [FIRM Validator Documentation](https://github.com/Linol-Hamelton/firm/tree/main/docs)
- [tRPC Documentation](https://trpc.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

## License

MIT
