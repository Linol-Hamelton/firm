# Migrating from Zod to FIRM

## Why Migrate?

FIRM offers several advantages over Zod while maintaining API familiarity:

- **Performance:** Compiled schemas with JIT compilation for faster validation
- **Intelligent Caching:** Built-in LRU/TTL caching for 10x+ speedup on repeated validation
- **Auto-Fix Mode:** Automatically correct common user input errors (trim whitespace, coerce types)
- **Better Security:** Built-in protection against prototype pollution, ReDoS, and depth attacks
- **Streaming Validation:** Validate large files and arrays without memory spikes
- **AI Error Suggestions:** Context-aware error messages with helpful suggestions

## Quick Comparison

| Feature | Zod | FIRM |
|---------|-----|------|
| Bundle Size | ~14 KB gzip | ~4-5 KB gzip |
| Performance | ~10M ops/sec | 3-10x faster (compiled) |
| Caching | Manual | Built-in (LRU, TTL, WeakMap) |
| Auto-fix | No | Yes (opt-in) |
| Streaming | No | Yes (NDJSON, arrays) |
| Security | Basic | Comprehensive (prototype pollution, ReDoS, depth limits) |
| Type Inference | Excellent | Excellent |

## Installation

```bash
npm install firm-validator

# Optional: remove Zod after migration
npm uninstall zod
```

## API Mapping

### Core Types

| Zod | FIRM | Notes |
|-----|------|-------|
| `z.string()` | `s.string()` | ✅ Identical API |
| `z.number()` | `s.number()` | ✅ Identical API |
| `z.boolean()` | `s.boolean()` | ✅ Identical API |
| `z.date()` | `s.date()` | ✅ Identical API |
| `z.bigint()` | `s.bigint()` | ✅ Identical API |
| `z.symbol()` | `s.symbol()` | ✅ Identical API |
| `z.undefined()` | `s.undefined()` | ✅ Identical API |
| `z.null()` | `s.null()` | ✅ Identical API |
| `z.void()` | `s.void()` | ✅ Identical API |
| `z.any()` | `s.any()` | ✅ Identical API |
| `z.unknown()` | `s.unknown()` | ✅ Identical API |
| `z.never()` | `s.never()` | ✅ Identical API |

### Composite Types

| Zod | FIRM | Notes |
|-----|------|-------|
| `z.object({...})` | `s.object({...})` | ✅ Identical API |
| `z.array(...)` | `s.array(...)` | ✅ Identical API |
| `z.tuple([...])` | `s.tuple([...])` | ✅ Identical API |
| `z.record(...)` | `s.record(...)` | ✅ Identical API |
| `z.map(...)` | `s.map(...)` | ✅ Identical API |
| `z.set(...)` | `s.set(...)` | ✅ Identical API |
| `z.union([...])` | `s.union([...])` | ✅ Identical API |
| `z.discriminatedUnion(...)` | `s.discriminatedUnion(...)` | ✅ Identical API |
| `z.intersection(...)` | `s.intersection(...)` | ✅ Identical API |
| `z.lazy(...)` | `s.lazy(...)` | ✅ Identical API |
| `z.recursive(...)` | `s.recursive(...)` | ✅ Identical API |

### Modifiers

| Zod | FIRM | Notes |
|-----|------|-------|
| `schema.optional()` | `schema.optional()` | ✅ Identical API |
| `schema.nullable()` | `schema.nullable()` | ✅ Identical API |
| `schema.nullish()` | `schema.nullish()` | ✅ Identical API |
| `schema.default(value)` | `schema.default(value)` | ✅ Identical API |
| `schema.catch(value)` | `schema.catch(value)` | ✅ Identical API |

### String Methods

| Zod | FIRM | Notes |
|-----|------|-------|
| `.min(n)` | `.min(n)` | ✅ Identical |
| `.max(n)` | `.max(n)` | ✅ Identical |
| `.length(n)` | `.length(n)` | ✅ Identical |
| `.email()` | `.email()` | ✅ Identical |
| `.url()` | `.url()` | ✅ Identical |
| `.uuid()` | `.uuid()` | ✅ Identical |
| `.cuid()` | `.cuid()` | ✅ Identical |
| `.regex(pattern)` | `.regex(pattern)` | ✅ Identical |
| `.startsWith(str)` | `.startsWith(str)` | ✅ Identical |
| `.endsWith(str)` | `.endsWith(str)` | ✅ Identical |
| `.trim()` | `.trim()` | ✅ Identical (transformation) |
| `.toLowerCase()` | `.toLowerCase()` | ✅ Identical (transformation) |
| `.toUpperCase()` | `.toUpperCase()` | ✅ Identical (transformation) |

### Number Methods

| Zod | FIRM | Notes |
|-----|------|-------|
| `.min(n)` | `.min(n)` | ✅ Identical |
| `.max(n)` | `.max(n)` | ✅ Identical |
| `.int()` | `.int()` | ✅ Identical |
| `.positive()` | `.positive()` | ✅ Identical |
| `.negative()` | `.negative()` | ✅ Identical |
| `.nonnegative()` | `.nonnegative()` | ✅ Identical |
| `.nonpositive()` | `.nonpositive()` | ✅ Identical |
| `.finite()` | `.finite()` | ✅ Identical |
| `.safe()` | `.safe()` | ✅ Identical (safe integer) |
| `.multipleOf(n)` | `.multipleOf(n)` | ✅ Identical |

### Array Methods

| Zod | FIRM | Notes |
|-----|------|-------|
| `.min(n)` | `.min(n)` | ✅ Identical |
| `.max(n)` | `.max(n)` | ✅ Identical |
| `.length(n)` | `.length(n)` | ✅ Identical |
| `.nonempty()` | `.nonempty()` | ✅ Identical |

## Breaking Changes

### 1. Validation Method Names

**Zod:**
```typescript
const result = schema.safeParse(data);
if (result.success) {
  console.log(result.data);
}
```

**FIRM:**
```typescript
const result = schema.validate(data);
if (result.ok) {  // 'ok' instead of 'success'
  console.log(result.data);
}
```

### 2. Type Inference Syntax

**Zod:**
```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof userSchema>;
```

**FIRM:**
```typescript
import { s } from 'firm-validator';

const userSchema = s.object({
  name: s.string(),
  age: s.number(),
});

type User = typeof userSchema.infer;  // Different syntax
```

### 3. Custom Error Messages

**Zod:**
```typescript
z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string"
})
```

**FIRM:**
```typescript
s.string().withMessage("Name is required")
```

### 4. Transformations

**Zod:**
```typescript
z.string().transform(val => val.toUpperCase())
```

**FIRM:**
```typescript
s.string().transform(val => val.toUpperCase())
// Same API!
```

### 5. Refinements

**Zod:**
```typescript
z.string().refine(val => val.length > 5, {
  message: "Too short"
})
```

**FIRM:**
```typescript
s.string().refine(val => val.length > 5, {
  message: "Too short"
})
// Same API!
```

## Migration Strategy

### Step 1: Side-by-Side Migration

Start by keeping both Zod and FIRM installed, migrating schemas one at a time:

```typescript
// Old (Zod)
import { z } from 'zod';
const oldSchema = z.string();

// New (FIRM)
import { s } from 'firm-validator';
const newSchema = s.string();

// Test both
console.assert(
  oldSchema.safeParse(data).success ===
  newSchema.validate(data).ok
);
```

### Step 2: Replace Imports

Find and replace imports:

```bash
# Find all Zod imports
grep -r "from 'zod'" ./src

# Replace with FIRM (manual or automated)
# from 'zod' → from 'firm-validator'
# z. → s.
```

### Step 3: Update Validation Calls

```typescript
// Before
const result = schema.safeParse(data);
if (result.success) {
  return result.data;
}

// After
const result = schema.validate(data);
if (result.ok) {
  return result.data;
}
```

### Step 4: Update Type Inference

```typescript
// Before
type User = z.infer<typeof userSchema>;

// After
type User = typeof userSchema.infer;
```

## Common Migration Patterns

### Basic Schema

```typescript
// Zod
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().positive(),
});

// FIRM
import { s } from 'firm-validator';

const userSchema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
  age: s.number().int().positive(),
});
```

### Union Types

```typescript
// Zod
const statusSchema = z.union([
  z.literal('pending'),
  z.literal('approved'),
  z.literal('rejected'),
]);

// FIRM
const statusSchema = s.union([
  s.literal('pending'),
  s.literal('approved'),
  s.literal('rejected'),
]);

// Or use enum (same in both)
const statusSchema = s.enum(['pending', 'approved', 'rejected']);
```

### Discriminated Unions

```typescript
// Zod
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), x: z.number(), y: z.number() }),
  z.object({ type: z.literal('keypress'), key: z.string() }),
]);

// FIRM (identical)
const eventSchema = s.discriminatedUnion('type', [
  s.object({ type: s.literal('click'), x: s.number(), y: s.number() }),
  s.object({ type: s.literal('keypress'), key: s.string() }),
]);
```

### Recursive Types

```typescript
// Zod
type Category = {
  name: string;
  subcategories: Category[];
};

const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(categorySchema),
  })
);

// FIRM
type Category = {
  name: string;
  subcategories: Category[];
};

const categorySchema: Schema<Category> = s.lazy(() =>
  s.object({
    name: s.string(),
    subcategories: s.array(categorySchema),
  })
);
```

### Async Refinements

```typescript
// Zod
const emailSchema = z.string().email().refine(async (email) => {
  return await checkEmailExists(email);
}, { message: "Email already exists" });

// FIRM
const emailSchema = s.string().email().refineAsync(async (email) => {
  return await checkEmailExists(email);
}, { message: "Email already exists" });
```

## FIRM-Specific Enhancements

After migration, you can leverage FIRM's unique features:

### 1. Compiled Schemas (Performance)

```typescript
import { s } from 'firm-validator';

// Compile schema once for better performance
const userSchema = s.object({
  email: s.string().email(),
  age: s.number().int(),
}).compile();

// Validation is now 3-10x faster
const result = userSchema.validate(data);
```

### 2. Caching (10x Speedup on Repeated Validation)

```typescript
const cachedSchema = userSchema.withCache({
  type: 'lru',
  maxSize: 1000,  // Cache up to 1000 validated objects
  ttl: 60000,     // 60 second TTL
});

// First validation: normal speed
cachedSchema.validate(user1);

// Subsequent validations of same object: 10x+ faster
cachedSchema.validate(user1);
```

### 3. Auto-Fix Mode

```typescript
const schema = s.object({
  email: s.string().email(),
  name: s.string(),
}).withAutoFix({
  trim: true,           // Trim whitespace
  coerce: true,         // Coerce types when safe
  fixTypos: false,      // Fix common typos (opt-in)
});

const result = schema.validate({
  email: '  user@example.com  ',  // Will be trimmed
  name: 'John Doe',
});

if (result.ok) {
  console.log(result.data.email);  // 'user@example.com' (trimmed)
  console.log(result.fixes);        // Array of applied fixes
}
```

### 4. Streaming Validation (Large Files)

```typescript
import { createReadStream } from 'fs';
import { validateStream } from 'firm-validator/streaming';

const schema = s.object({
  id: s.number(),
  name: s.string(),
});

// Validate NDJSON file without loading entire file into memory
const stream = createReadStream('large-file.ndjson');
const results = validateStream(stream, schema, { format: 'ndjson' });

for await (const result of results) {
  if (result.ok) {
    processValidItem(result.data);
  } else {
    console.error(result.error);
  }
}
```

### 5. AI Error Suggestions

```typescript
const result = schema.validate({ email: 'invalid-email' });

if (!result.ok) {
  console.log(result.error.message);  // "Invalid email format"
  console.log(result.error.suggestion);  // "Email must contain '@'. Did you forget the domain?"
}
```

## Framework Integration

### Express (Zod → FIRM)

**Before (Zod):**
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post('/users', (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error });
  }
  // Use result.data
});
```

**After (FIRM):**
```typescript
import { s } from 'firm-validator';
import { validateBody } from 'firm-validator/integrations/express';

const createUserSchema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
});

app.post('/users', validateBody(createUserSchema), (req, res) => {
  // req.validatedBody is fully typed!
  const user = createUser(req.validatedBody);
  res.json(user);
});
```

### React Hook Form (Zod → FIRM)

**Before (Zod):**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

**After (FIRM):**
```typescript
import { useForm } from 'react-hook-form';
import { firmResolver } from 'firm-validator/integrations/react-hook-form';
import { s } from 'firm-validator';

const schema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: firmResolver(schema),
});
```

### tRPC (Zod → FIRM)

**Before (Zod):**
```typescript
import { z } from 'zod';
import { publicProcedure } from './trpc';

const createUserInput = z.object({
  email: z.string().email(),
  name: z.string(),
});

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ input }) => {
      // input is fully typed
    }),
});
```

**After (FIRM):**
```typescript
import { s } from 'firm-validator';
import { publicProcedure } from './trpc';

const createUserInput = s.object({
  email: s.string().email(),
  name: s.string(),
});

export const userRouter = router({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ input }) => {
      // input is fully typed (same as Zod!)
    }),
});
```

## Testing Your Migration

Create a test suite to verify migration correctness:

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { s } from 'firm-validator';

describe('Migration Tests', () => {
  it('should validate same data with both schemas', () => {
    const zodSchema = z.string().email();
    const firmSchema = s.string().email();

    const validData = 'user@example.com';
    const invalidData = 'invalid-email';

    // Both should accept valid data
    expect(zodSchema.safeParse(validData).success).toBe(true);
    expect(firmSchema.validate(validData).ok).toBe(true);

    // Both should reject invalid data
    expect(zodSchema.safeParse(invalidData).success).toBe(false);
    expect(firmSchema.validate(invalidData).ok).toBe(false);
  });

  it('should infer same types', () => {
    const zodSchema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const firmSchema = s.object({
      name: s.string(),
      age: s.number(),
    });

    type ZodType = z.infer<typeof zodSchema>;
    type FirmType = typeof firmSchema.infer;

    // Types should be identical
    const testZod: ZodType = { name: 'John', age: 30 };
    const testFirm: FirmType = { name: 'John', age: 30 };

    expect(testZod).toEqual(testFirm);
  });
});
```

## Common Pitfalls

### 1. Forgetting to Update `.success` → `.ok`

```typescript
// ❌ Wrong
const result = schema.validate(data);
if (result.success) {  // Error: 'success' doesn't exist
  // ...
}

// ✅ Correct
const result = schema.validate(data);
if (result.ok) {
  // ...
}
```

### 2. Using Old Type Inference Syntax

```typescript
// ❌ Wrong
type User = s.infer<typeof userSchema>;  // Error: 's.infer' doesn't exist

// ✅ Correct
type User = typeof userSchema.infer;
```

### 3. Not Handling `.parse()` Exceptions

```typescript
// Zod .parse() throws on validation error
try {
  const data = schema.parse(input);
} catch (error) {
  // Handle error
}

// FIRM .parse() also throws (same behavior)
try {
  const data = schema.parse(input);
} catch (error) {
  // Handle error
}

// Prefer .validate() for explicit error handling
const result = schema.validate(input);
if (!result.ok) {
  // Handle result.error
}
```

## Performance Tips

After migrating to FIRM, optimize for production:

```typescript
// 1. Compile schemas once (not in hot path)
const compiledSchema = userSchema.compile();

// 2. Enable caching for frequently validated data
const cachedSchema = compiledSchema.withCache({
  type: 'lru',
  maxSize: 10000,
});

// 3. Use streaming for large datasets
const stream = validateStream(dataStream, schema);

// 4. Profile validation hot paths
const startTime = performance.now();
cachedSchema.validate(data);
console.log('Validation time:', performance.now() - startTime);
```

## Getting Help

- **Documentation:** [https://github.com/Linol-Hamelton/firm/tree/main/docs](https://github.com/Linol-Hamelton/firm/tree/main/docs)
- **GitHub Issues:** [https://github.com/Linol-Hamelton/firm/issues](https://github.com/Linol-Hamelton/firm/issues)
- **Examples:** [https://github.com/Linol-Hamelton/firm/tree/main/examples](https://github.com/Linol-Hamelton/firm/tree/main/examples)

## Automated Migration Tool (Coming Soon)

We're working on a codemod to automate most of the migration:

```bash
# Coming soon
npx @firm/codemod zod-to-firm ./src
```

This will automatically:
- Replace `import { z } from 'zod'` → `import { s } from 'firm-validator'`
- Convert `z.*` → `s.*`
- Update `.safeParse()` → `.validate()`
- Update `.success` → `.ok`
- Update type inference syntax

---

**Happy migrating!** If you encounter any issues, please [open an issue](https://github.com/Linol-Hamelton/firm/issues).
