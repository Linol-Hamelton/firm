# Data Transformations Guide

This guide covers data transformation and coercion in Firm Validator, including type conversion, preprocessing, and advanced transformation patterns.

## Type Coercion

Firm provides automatic type conversion with the `coerce` API:

```typescript
import { s } from 'firm-validator';

// String coercion
s.coerce.string()    // any → string
s.coerce.number()    // string/number → number
s.coerce.boolean()   // various → boolean
s.coerce.date()      // string/number → Date
s.coerce.bigint()    // string/number → bigint
```

### String Coercion

```typescript
const stringSchema = s.coerce.string();

stringSchema.parse(123);        // "123"
stringSchema.parse(null);       // "null"
stringSchema.parse(undefined);  // "undefined"
stringSchema.parse({});         // "[object Object]"
```

### Number Coercion

```typescript
const numberSchema = s.coerce.number();

numberSchema.parse("42");       // 42
numberSchema.parse("3.14");     // 3.14
numberSchema.parse(true);       // 1
numberSchema.parse(false);      // 0
numberSchema.parse("invalid");  // NaN (fails validation)
```

### Boolean Coercion

```typescript
const booleanSchema = s.coerce.boolean();

booleanSchema.parse("true");    // true
booleanSchema.parse("1");       // true
booleanSchema.parse(1);         // true
booleanSchema.parse("false");   // false
booleanSchema.parse("0");       // false
booleanSchema.parse(0);         // false
booleanSchema.parse("yes");     // true
booleanSchema.parse("no");      // false
```

### Date Coercion

```typescript
const dateSchema = s.coerce.date();

dateSchema.parse("2024-01-01");           // Date object
dateSchema.parse(1640995200000);          // Date from timestamp
dateSchema.parse("2024-01-01T00:00:00Z"); // ISO string
```

## Preprocessing

Use `.preprocess()` for custom input transformation before validation:

```typescript
const schema = s.number().preprocess((val) => {
  // Convert strings to numbers
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? val : parsed; // Keep original if invalid
  }
  return val;
});

schema.parse("42.5");  // 42.5
schema.parse(42);      // 42
```

### Advanced Preprocessing

```typescript
// Handle multiple input formats
const flexibleNumber = s.number().preprocess((val) => {
  if (typeof val === 'string') {
    // Remove currency symbols and commas
    const cleaned = val.replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
});

flexibleNumber.parse("$1,234.56");  // 1234.56
flexibleNumber.parse("42");          // 42
```

## Transform Methods

### String Transformations

```typescript
s.string()
  .trim()                    // Remove whitespace
  .toLowerCase()            // Convert to lowercase
  .toUpperCase()            // Convert to uppercase
  .transform((val) => val.replace(/\s+/g, ' ')) // Custom transform
```

### Chaining Transforms

```typescript
const normalizedEmail = s.string()
  .email()
  .trim()
  .toLowerCase()
  .transform((email) => email.normalize('NFC')); // Unicode normalization

normalizedEmail.parse("  JOHN@EXAMPLE.COM  "); // "john@example.com"
```

## Advanced Transformations

### Conditional Transforms

```typescript
const userInput = s.string().transform((val) => {
  // Normalize different truthy/falsy representations
  const normalized = val.toLowerCase().trim();

  if (['yes', 'true', '1', 'on'].includes(normalized)) {
    return true;
  }
  if (['no', 'false', '0', 'off'].includes(normalized)) {
    return false;
  }

  return val; // Keep original if no match
});

userInput.parse("YES");   // true
userInput.parse("no");    // false
userInput.parse("maybe"); // "maybe"
```

### Type Guards with Transforms

```typescript
const safeJsonParse = s.string().transform((val) => {
  try {
    const parsed = JSON.parse(val);
    // Additional validation could go here
    return parsed;
  } catch {
    return val; // Return original on parse failure
  }
});

safeJsonParse.parse('{"name": "John"}'); // { name: "John" }
safeJsonParse.parse("not json");          // "not json"
```

## Pipeline Transformations

Use `.pipe()` for complex transformation pipelines:

```typescript
const userDataPipeline = s.object({
  name: s.string().trim().transform((name) => name.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')), // Title case

  email: s.string().trim().toLowerCase(),

  age: s.coerce.number().int().transform((age) =>
    Math.max(0, Math.min(150, age)) // Clamp age
  ),

  tags: s.array(s.string()).transform((tags) =>
    [...new Set(tags.map(tag => tag.toLowerCase().trim()))] // Unique, normalized
  ),
});

const result = userDataPipeline.parse({
  name: "john DOE",
  email: "JOHN@EXAMPLE.COM",
  age: "25",
  tags: ["JavaScript", "javascript", "  react  "]
});

// Result:
// {
//   name: "John Doe",
//   email: "john@example.com",
//   age: 25,
//   tags: ["javascript", "react"]
// }
```

## Schema Composition

### Merging Transforms

```typescript
const baseUser = s.object({
  name: s.string().trim(),
  email: s.string().email().toLowerCase(),
});

const premiumUser = baseUser.extend({
  subscription: s.object({
    plan: s.enum(['basic', 'premium']),
    expires: s.coerce.date(),
  }),
}).transform((user) => ({
  ...user,
  isPremium: user.subscription?.plan === 'premium',
  daysUntilExpiry: user.subscription ?
    Math.ceil((user.subscription.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
    null,
}));
```

### Union Transforms

```typescript
const userOrGuest = s.union([
  s.object({
    type: s.literal('user'),
    id: s.number(),
    name: s.string(),
  }).transform((user) => ({ ...user, role: 'authenticated' })),

  s.object({
    type: s.literal('guest'),
    sessionId: s.string(),
  }).transform((guest) => ({ ...guest, role: 'anonymous' })),
]);

userOrGuest.parse({ type: 'user', id: 123, name: 'John' });
// { type: 'user', id: 123, name: 'John', role: 'authenticated' }

userOrGuest.parse({ type: 'guest', sessionId: 'abc123' });
// { type: 'guest', sessionId: 'abc123', role: 'anonymous' }
```

## Async Transformations

Use `.transformAsync()` for asynchronous transformations:

```typescript
const userWithAvatar = s.object({
  name: s.string(),
  email: s.string().email(),
}).transformAsync(async (user) => {
  // Fetch avatar from external service
  const avatarUrl = await fetchUserAvatar(user.email);
  return {
    ...user,
    avatar: avatarUrl,
  };
});

const result = await userWithAvatar.parseAsync({
  name: 'John',
  email: 'john@example.com'
});
// { name: 'John', email: 'john@example.com', avatar: 'https://...' }
```

### Database Lookups

```typescript
const orderSchema = s.object({
  userId: s.number().int(),
  productId: s.number().int(),
  quantity: s.number().int().positive(),
}).transformAsync(async (order) => {
  // Validate user exists
  const user = await db.users.findById(order.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Validate product exists and get price
  const product = await db.products.findById(order.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Calculate total
  const total = product.price * order.quantity;

  return {
    ...order,
    user,
    product,
    total,
  };
});
```

## Error Handling in Transforms

### Transform Validation

```typescript
const validatedTransform = s.string().transform((val) => {
  if (val.length < 3) {
    throw new Error('String too short for transformation');
  }
  return val.toUpperCase();
});

validatedTransform.parse("hi"); // Throws: "String too short for transformation"
```

### Safe Transforms

```typescript
const safeTransform = s.unknown().transform((val) => {
  try {
    // Attempt transformation
    return someComplexTransformation(val);
  } catch (error) {
    // Return original value on failure
    return val;
  }
});
```

## Performance Considerations

### Transform Ordering

```typescript
// ✅ Good: Validate first, then transform
const efficientSchema = s.string()
  .min(1)                    // Validate length
  .email()                   // Validate format
  .toLowerCase()            // Then transform
  .trim();

// ❌ Bad: Transform then validate (less efficient)
const inefficientSchema = s.string()
  .toLowerCase()            // Transform first
  .trim()
  .min(1)                   // Validate after
  .email();
```

### Caching Transforms

For expensive transformations, consider caching:

```typescript
const expensiveTransform = s.string().transform((val) => {
  // Simulate expensive operation
  return heavyComputation(val);
});

// For repeated transforms, consider external caching
const cachedTransform = s.string().transform((val) => {
  const cacheKey = `transform_${val}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = heavyComputation(val);
  cache.set(cacheKey, result);
  return result;
});
```

## Best Practices

### 1. Keep Transforms Pure

```typescript
// ✅ Good: Pure functions
const pureTransform = s.number().transform((n) => n * 2);

// ❌ Bad: Side effects
let counter = 0;
const impureTransform = s.number().transform((n) => {
  counter++; // Side effect
  return n * 2;
});
```

### 2. Handle Edge Cases

```typescript
// ✅ Good: Handle null/undefined
const safeTransform = s.unknown().transform((val) => {
  if (val == null) return null;
  return transformValue(val);
});

// ❌ Bad: May throw on unexpected input
const unsafeTransform = s.unknown().transform((val) => {
  return transformValue(val); // May fail
});
```

### 3. Use Appropriate Coercion

```typescript
// ✅ Good: Explicit coercion for user input
const userInputSchema = s.object({
  age: s.coerce.number().int().min(0),
  newsletter: s.coerce.boolean(),
});

// ❌ Bad: Over-coercion
const overCoercionSchema = s.coerce.string(); // Converts everything to string
```

### 4. Document Transform Behavior

```typescript
const userSchema = s.object({
  // This field will be normalized to title case
  displayName: s.string()
    .trim()
    .transform((name) => name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
    ),

  // Email will be lowercased for consistency
  email: s.string().email().toLowerCase(),
});
```

### 5. Test Transforms Thoroughly

```typescript
describe('User Schema Transforms', () => {
  it('normalizes display names', () => {
    const result = userSchema.parse({
      displayName: 'john DOE',
      email: 'JOHN@EXAMPLE.COM'
    });

    expect(result.displayName).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
  });

  it('handles edge cases', () => {
    expect(() => userSchema.parse({
      displayName: '',
      email: 'invalid'
    })).toThrow();
  });
});
```

## Migration Examples

### From Zod

```typescript
// Zod
const schema = z.string()
  .transform((val) => val.toUpperCase())
  .pipe(z.string().min(1));

// Firm
const schema = s.string()
  .transform((val) => val.toUpperCase())
  .min(1);
```

### From Yup

```typescript
// Yup
const schema = yup.string()
  .transform((value, originalValue) => {
    if (typeof originalValue === 'number') {
      return String(originalValue);
    }
    return value;
  });

// Firm
const schema = s.string().preprocess((val) => {
  if (typeof val === 'number') {
    return String(val);
  }
  return val;
});
```

## Advanced Patterns

### Recursive Transforms

```typescript
type TreeNode = {
  value: number;
  children: TreeNode[];
};

const treeSchema: s.Schema<TreeNode> = s.lazy(() =>
  s.object({
    value: s.number(),
    children: s.array(treeSchema),
  }).transform((node) => ({
    ...node,
    // Add computed properties
    depth: calculateDepth(node),
    leafCount: countLeaves(node),
  }))
);
```

### Conditional Transforms

```typescript
const conditionalSchema = s.object({
  type: s.enum(['user', 'admin']),
  data: s.unknown(),
}).transform((obj) => {
  if (obj.type === 'admin') {
    return {
      ...obj,
      data: adminDataSchema.parse(obj.data),
      permissions: ['read', 'write', 'delete'],
    };
  } else {
    return {
      ...obj,
      data: userDataSchema.parse(obj.data),
      permissions: ['read'],
    };
  }
});
```

This comprehensive transformation system makes Firm Validator powerful for data processing, API normalization, and type-safe data manipulation.