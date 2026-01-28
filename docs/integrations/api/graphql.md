# GraphQL Apollo Integration

FIRM provides seamless integration with Apollo Server for GraphQL argument validation.

## Installation

```bash
npm install firm-validator @apollo/server graphql
```

## Quick Start

```typescript
import { ApolloServer } from '@apollo/server';
import { s } from 'firm-validator';
import { firmArgs } from 'firm-validator/integrations/graphql';

const createUserSchema = s.object({
  input: s.object({
    name: s.string().min(1),
    email: s.string().email(),
  })
});

const resolvers = {
  Mutation: {
    createUser: firmArgs(createUserSchema, async (parent, args, context) => {
      // args.input is typed and validated
      const { input } = args;
      return context.db.users.create(input);
    }),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
```

## API Reference

### `firmArgs(schema, resolver, options?)`

Wrap GraphQL resolver with FIRM validation.

**Parameters:**
- `schema: Schema<TArgs>` - FIRM validation schema for arguments
- `resolver: Resolver<TArgs, TResult, TContext>` - GraphQL resolver function
- `options?: FirmResolverOptions` - Validation options
  - `errorFormatter?: (errors: any[]) => GraphQLError` - Custom error formatter

**Returns:** `Resolver<TArgs, TResult, TContext>`

**Example:**

```typescript
const resolvers = {
  Mutation: {
    createUser: firmArgs(
      s.object({
        input: s.object({
          name: s.string().min(1),
          email: s.string().email(),
        }),
      }),
      async (parent, args, context) => {
        const { input } = args;
        return context.db.users.create(input);
      }
    ),
  },
};
```

### `createFirmPlugin()`

Create validation middleware for Apollo Server plugins.

**Returns:** Apollo Server plugin

**Example:**

```typescript
import { createFirmPlugin } from 'firm-validator/integrations/graphql';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [createFirmPlugin()],
});
```

### `createFirmDirective(schemas)`

Create GraphQL directive for validation.

**Parameters:**
- `schemas: Record<string, Schema<any>>` - Named schemas for directive

**Returns:** Directive class

**Example:**

**GraphQL Schema:**
```graphql
directive @validate(schema: String!) on FIELD_DEFINITION | ARGUMENT_DEFINITION

type Mutation {
  createUser(input: CreateUserInput! @validate(schema: "createUser")): User!
}
```

**TypeScript:**
```typescript
import { makeExecutableSchema } from '@graphql-tools/schema';
import { createFirmDirective } from 'firm-validator/integrations/graphql';

const schemas = {
  createUser: s.object({
    name: s.string().min(1),
    email: s.string().email(),
  }),
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    validate: createFirmDirective(schemas),
  },
});
```

### `generateInputType(name, schema)`

Generate GraphQL input type from FIRM schema.

**Parameters:**
- `name: string` - Input type name
- `schema: Schema<any>` - FIRM schema

**Returns:** `string` - GraphQL input type definition

**Example:**

```typescript
const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  age: s.number().optional(),
});

const inputType = generateInputType('CreateUserInput', userSchema);
console.log(inputType);
// Output:
// input CreateUserInput {
//   name: String!
//   email: String!
//   age: Int
// }
```

### `firmContext(schema, contextFn)`

Validate GraphQL context.

**Parameters:**
- `schema: Schema<T>` - Context schema
- `contextFn: (opts: any) => Promise<unknown> | unknown` - Context function

**Returns:** `Promise<T>`

**Example:**

```typescript
const contextSchema = s.object({
  user: s.object({
    id: s.string(),
    role: s.enum(['admin', 'user']),
  }).optional(),
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: firmContext(contextSchema, async ({ req }) => {
    const user = await getUserFromToken(req.headers.authorization);
    return { user };
  }),
});
```

## Error Handling

### Default Error Response

By default, validation errors throw `ValidationError`:

```json
{
  "errors": [
    {
      "message": "Arguments validation failed",
      "extensions": {
        "code": "BAD_USER_INPUT",
        "validationErrors": [
          {
            "path": ["input", "email"],
            "code": "INVALID_EMAIL",
            "message": "Invalid email format"
          }
        ]
      }
    }
  ]
}
```

### Custom Error Formatter

You can customize error responses:

```typescript
import { GraphQLError } from 'graphql';

const createUser = firmArgs(
  userSchema,
  resolver,
  {
    errorFormatter: (errors) => {
      return new GraphQLError('Validation failed', {
        extensions: {
          code: 'VALIDATION_ERROR',
          errors,
        },
      });
    },
  }
);
```

## TypeScript Support

FIRM provides full TypeScript support with type inference:

```typescript
const userSchema = s.object({
  input: s.object({
    name: s.string(),
    age: s.number(),
    role: s.enum(['admin', 'user'])
  })
});

const createUser = firmArgs(userSchema, async (parent, args, context) => {
  // TypeScript knows:
  // args.input.name is string
  // args.input.age is number
  // args.input.role is 'admin' | 'user'
  const { name, age, role } = args.input;
});
```

## Advanced Examples

### Multiple Resolvers

```typescript
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  input CreateUserInput {
    name: String!
    email: String!
  }

  input UpdateUserInput {
    id: ID!
    name: String
    email: String
  }

  type Query {
    user(id: ID!): User
    users(page: Int, limit: Int): [User!]!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    user: firmArgs(
      s.object({ id: s.string() }),
      async (parent, args, context) => {
        return context.db.users.findById(args.id);
      }
    ),

    users: firmArgs(
      s.object({
        page: s.number().int().min(1).default(1),
        limit: s.number().int().max(100).default(10)
      }),
      async (parent, args, context) => {
        return context.db.users.list(args.page, args.limit);
      }
    ),
  },

  Mutation: {
    createUser: firmArgs(
      s.object({
        input: s.object({
          name: s.string().min(1),
          email: s.string().email()
        })
      }),
      async (parent, args, context) => {
        return context.db.users.create(args.input);
      }
    ),

    updateUser: firmArgs(
      s.object({
        input: s.object({
          id: s.string(),
          name: s.string().min(1).optional(),
          email: s.string().email().optional()
        })
      }),
      async (parent, args, context) => {
        return context.db.users.update(args.input);
      }
    ),

    deleteUser: firmArgs(
      s.object({ id: s.string() }),
      async (parent, args, context) => {
        await context.db.users.delete(args.id);
        return true;
      }
    ),
  },
};
```

### Complex Nested Schemas

```typescript
const addressSchema = s.object({
  street: s.string(),
  city: s.string(),
  country: s.string(),
  zip: s.string()
});

const createUserSchema = s.object({
  input: s.object({
    name: s.string().min(1),
    email: s.string().email(),
    age: s.number().int().min(0).max(150),
    address: addressSchema,
    tags: s.array(s.string()).optional(),
    metadata: s.record(s.string()).optional()
  })
});

const resolvers = {
  Mutation: {
    createUser: firmArgs(createUserSchema, async (parent, args, context) => {
      // Full type safety for nested objects
      return context.db.users.create(args.input);
    }),
  },
};
```

### Union Types

```typescript
const eventSchema = s.union([
  s.object({
    type: s.literal('user_created'),
    userId: s.string(),
    userName: s.string()
  }),
  s.object({
    type: s.literal('user_deleted'),
    userId: s.string()
  }),
  s.object({
    type: s.literal('user_updated'),
    userId: s.string(),
    changes: s.record(s.unknown())
  })
]);

const resolvers = {
  Mutation: {
    createEvent: firmArgs(
      s.object({ event: eventSchema }),
      async (parent, args, context) => {
        const { event } = args;
        // TypeScript narrows type based on discriminant
        if (event.type === 'user_created') {
          console.log(event.userName); // ✅ Available
        }
        return context.db.events.create(event);
      }
    ),
  },
};
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
  input: s.object({
    username: usernameSchema,
    email: s.string().email(),
    password: s.string().min(8)
  })
});

const resolvers = {
  Mutation: {
    signup: firmArgs(signupSchema, async (parent, args, context) => {
      const user = await createUser(args.input);
      return { success: true, userId: user.id };
    }),
  },
};
```

### Field Resolvers

```typescript
const resolvers = {
  User: {
    posts: firmArgs(
      s.object({
        limit: s.number().int().max(100).default(10)
      }),
      async (user, args, context) => {
        return context.db.posts.findByUserId(user.id, args.limit);
      }
    ),
  },
};
```

## Schema Generation

FIRM can help generate GraphQL input types:

```typescript
import { generateInputType } from 'firm-validator/integrations/graphql';

const schemas = {
  createUser: s.object({
    name: s.string(),
    email: s.string().email(),
    age: s.number().optional(),
  }),
  updateUser: s.object({
    id: s.string(),
    name: s.string().optional(),
    email: s.string().email().optional(),
  }),
};

// Generate input types
for (const [name, schema] of Object.entries(schemas)) {
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  console.log(generateInputType(`${capitalized}Input`, schema));
}

// Output:
// input CreateUserInput {
//   name: String!
//   email: String!
//   age: Int
// }
//
// input UpdateUserInput {
//   id: String!
//   name: String
//   email: String
// }
```

## Performance Tips

1. **Reuse schemas**: Define schemas once, reuse across resolvers
2. **Pre-compile schemas**: Use schema compiler for hot paths
3. **Enable Apollo Server caching**: Use Apollo's built-in caching

```typescript
import { compile } from 'firm-validator';

const userSchema = s.object({
  input: s.object({
    name: s.string(),
    email: s.string().email()
  })
});

// Compile once at module level
const validateUser = compile(userSchema);

// Use in multiple resolvers
const resolvers = {
  Mutation: {
    createUser: firmArgs(userSchema, resolver),
    updateUser: firmArgs(userSchema, resolver),
  },
};
```

## See Also

- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
- [Validation Guide](../../core-concepts/validation.md)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
