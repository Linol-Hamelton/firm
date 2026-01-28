# Quick Start

Learn **Firm Validator** in 5 minutes. This tutorial covers everything you need to get productive.

---

## Basic Validation

### Step 1: Import Firm

```typescript
import { s } from 'firm-validator';
```

### Step 2: Define a Schema

```typescript
const userSchema = s.object({
  name: s.string(),
  age: s.number()
});
```

### Step 3: Validate Data

```typescript
const result = userSchema.validate({
  name: 'John',
  age: 30
});

if (result.ok) {
  console.log('Valid:', result.data);
  // Valid: { name: 'John', age: 30 }
} else {
  console.log('Errors:', result.error.issues);
}
```

That's it! You're now validating data with Firm.

---

## Common Validators

### String Validation

```typescript
// Basic string
s.string()

// With constraints
s.string()
  .min(5)           // Min length 5
  .max(100)         // Max length 100
  .email()          // Must be valid email
  .url()            // Must be valid URL
  .regex(/^[A-Z]+$/) // Custom regex
```

### Number Validation

```typescript
// Basic number
s.number()

// With constraints
s.number()
  .min(0)           // Min value 0
  .max(100)         // Max value 100
  .int()            // Must be integer
  .positive()       // Must be positive
  .multipleOf(5)    // Must be multiple of 5
```

### Boolean Validation

```typescript
s.boolean()
```

### Enum Validation

```typescript
// String enum
s.enum(['red', 'green', 'blue'])

// Native TypeScript enum
enum Color { Red, Green, Blue }
s.nativeEnum(Color)
```

---

## Composite Types

### Object

```typescript
const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  age: s.number().int().min(0)
});

userSchema.validate({
  name: 'John',
  email: 'john@example.com',
  age: 30
});
```

### Array

```typescript
const tagsSchema = s.array(s.string());

tagsSchema.validate(['typescript', 'validation', 'firm']);
```

### Nested Objects

```typescript
const profileSchema = s.object({
  user: s.object({
    name: s.string(),
    email: s.string().email()
  }),
  settings: s.object({
    theme: s.enum(['light', 'dark']),
    notifications: s.boolean()
  })
});

profileSchema.validate({
  user: {
    name: 'John',
    email: 'john@example.com'
  },
  settings: {
    theme: 'dark',
    notifications: true
  }
});
```

---

## Modifiers

### Optional

```typescript
const schema = s.object({
  name: s.string(),
  nickname: s.string().optional()  // Can be undefined
});

// Both valid:
schema.validate({ name: 'John' });
schema.validate({ name: 'John', nickname: 'Johnny' });
```

### Nullable

```typescript
const schema = s.object({
  name: s.string(),
  middleName: s.string().nullable()  // Can be null
});

// Both valid:
schema.validate({ name: 'John', middleName: null });
schema.validate({ name: 'John', middleName: 'William' });
```

### Default Values

```typescript
const schema = s.object({
  name: s.string(),
  role: s.enum(['admin', 'user']).default('user')
});

const result = schema.validate({ name: 'John' });
console.log(result.data);
// { name: 'John', role: 'user' }  ← default applied!
```

---

## Type Inference

Firm automatically infers TypeScript types:

```typescript
const userSchema = s.object({
  name: s.string(),
  age: s.number(),
  email: s.string().email().optional()
});

// Extract the TypeScript type
type User = typeof userSchema.infer;
// Inferred as:
// {
//   name: string;
//   age: number;
//   email?: string;
// }

// Use it in your code
function createUser(data: User) {
  // TypeScript knows the exact structure
  console.log(data.name);  // ✅ string
  console.log(data.age);   // ✅ number
  console.log(data.email); // ✅ string | undefined
}
```

---

## Error Handling

### Basic Error Handling

```typescript
const schema = s.object({
  age: s.number().min(18)
});

const result = schema.validate({ age: 15 });

if (!result.ok) {
  console.log(result.error.issues);
  // [
  //   {
  //     code: 'too_small',
  //     path: ['age'],
  //     message: 'Must be at least 18',
  //     received: 15,
  //     minimum: 18
  //   }
  // ]
}
```

### Formatted Errors

```typescript
const schema = s.object({
  name: s.string().min(1),
  email: s.string().email()
});

const result = schema.validate({
  name: '',
  email: 'invalid'
});

if (!result.ok) {
  console.log(result.error.format());
  // {
  //   name: ['String must contain at least 1 character(s)'],
  //   email: ['Invalid email format']
  // }
}
```

---

## Real-World Example

Let's build a user registration validator:

```typescript
import { s } from 'firm-validator';

// Define schema
const registrationSchema = s.object({
  username: s.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  email: s.string()
    .email('Invalid email address'),

  password: s.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  age: s.number()
    .int('Age must be a whole number')
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Invalid age'),

  acceptTerms: s.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions')
});

// Use it
function handleRegistration(data: unknown) {
  const result = registrationSchema.validate(data);

  if (!result.ok) {
    // Show errors to user
    const errors = result.error.format();
    return { success: false, errors };
  }

  // TypeScript knows the exact type here!
  const user = result.data;
  console.log('Creating user:', user.username, user.email);

  // Create user in database...
  return { success: true, user };
}

// Test it
handleRegistration({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  age: 25,
  acceptTerms: true
});
```

---

## Integration Example: Express API

Here's how to use Firm with Express:

```typescript
import express from 'express';
import { s } from 'firm-validator';

const app = express();
app.use(express.json());

// Define validation schema
const createUserSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  password: s.string().min(8)
});

// Use in route
app.post('/users', (req, res) => {
  // Validate request body
  const result = createUserSchema.validate(req.body);

  if (!result.ok) {
    // Return validation errors
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.format()
    });
  }

  // TypeScript knows result.data is valid
  const userData = result.data;

  // Create user...
  res.status(201).json({
    message: 'User created',
    user: userData
  });
});

app.listen(3000);
```

---

## Next Steps

Congratulations! You now know the basics of Firm Validator.

### Learn More:

**Core Concepts:**
- [Type Inference](../core-concepts/type-inference.md) - Deep dive into TypeScript types
- [Error Handling](../core-concepts/error-handling.md) - Advanced error handling
- [Validation](../core-concepts/validation.md) - How validation works internally

**API Reference:**
- [Primitives](../api/primitives.md) - All primitive validators
- [Composites](../api/composites.md) - All composite validators
- [Modifiers](../api/modifiers.md) - All modifiers

**Integrations:**
- [Express](../integrations/backend/express.md) - Backend integration
- [React](../integrations/frontend/react-hook-form.md) - Frontend integration
- [tRPC](../integrations/api/trpc.md) - Type-safe APIs

**Examples:**
- [More Examples](../examples/) - Real-world examples

---

## Cheat Sheet

```typescript
// Primitives
s.string()
s.number()
s.boolean()
s.literal('exact')
s.enum(['a', 'b', 'c'])
s.nativeEnum(MyEnum)

// Composites
s.object({ key: s.string() })
s.array(s.string())
s.tuple([s.string(), s.number()])
s.record(s.string(), s.number())
s.union([s.string(), s.number()])

// String methods
.min(n)
.max(n)
.length(n)
.email()
.url()
.uuid()
.regex(pattern)
.trim()
.toLowerCase()
.toUpperCase()

// Number methods
.min(n)
.max(n)
.int()
.positive()
.negative()
.multipleOf(n)

// Array methods
.min(n)
.max(n)
.length(n)
.nonempty()

// Modifiers
.optional()
.nullable()
.default(value)

// Object methods
.partial()
.required()
.pick(['key1', 'key2'])
.omit(['key1', 'key2'])
.extend({ newKey: s.string() })
.merge(anotherSchema)

// Validation
schema.validate(data)  // Returns { ok: true, data } or { ok: false, error }

// Type inference
type T = typeof schema.infer
```

---

**Previous:** [Installation ←](./installation.md)
**Next:** [First Schema →](./first-schema.md)
