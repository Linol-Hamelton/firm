# String Validator API

The string validator provides comprehensive validation for string values with support for common string constraints, patterns, and transformations.

## Basic Usage

```typescript
import { s } from 'firm-validator';

const schema = s.string();
```

## Constraints

### Length Constraints

```typescript
s.string()
  .min(5)        // Minimum length: 5 characters
  .max(100)      // Maximum length: 100 characters
  .length(10)    // Exact length: 10 characters
```

### Content Validation

```typescript
s.string()
  .email()                    // Valid email format
  .url()                      // Valid URL format
  .uuid()                     // Valid UUID v4 format
  .cuid()                     // Valid CUID format
  .cuid2()                    // Valid CUID2 format
  .ip()                       // Valid IPv4 address
  .datetime()                 // Valid ISO datetime string
  .date()                     // Valid ISO date string
  .time()                     // Valid time string
```

### Pattern Matching

```typescript
s.string()
  .regex(/^[A-Z]+$/)          // Custom regex pattern
  .startsWith('prefix')       // Must start with string
  .endsWith('suffix')         // Must end with string
  .includes('substring')      // Must contain substring
```

### Content Rules

```typescript
s.string()
  .notEmpty()                 // Cannot be empty string
  .trim()                     // Trim whitespace (transformation)
  .toLowerCase()              // Convert to lowercase (transformation)
  .toUpperCase()              // Convert to uppercase (transformation)
```

## Transformations

```typescript
s.string()
  .trim()                     // Remove leading/trailing whitespace
  .toLowerCase()              // Convert to lowercase
  .toUpperCase()              // Convert to uppercase
  .transform((val) => val.replace(/\s+/g, ' ')) // Custom transformation
```

## Modifiers

```typescript
s.string()
  .optional()                 // string | undefined
  .nullable()                 // string | null
  .default('default value')   // Provide default value
```

## Type Inference

```typescript
const schema = s.string().min(5).email();
type Inferred = s.Infer<typeof schema>; // string

const optionalSchema = s.string().optional();
type OptionalInferred = s.Infer<typeof optionalSchema>; // string | undefined
```

## Error Messages

The string validator provides detailed error messages:

```typescript
const schema = s.string().min(5).email();

schema.validate('abc'); // Error: "String must be at least 5 characters long"
schema.validate('not-an-email'); // Error: "Invalid email format"
```

## Security Considerations

The string validator includes built-in protection against:

- **ReDoS attacks**: Regex patterns are validated for safety
- **Input size limits**: Maximum string length for regex validation (10,000 chars)
- **Timeout protection**: Complex patterns are executed with timeout

## Examples

### Email Validation

```typescript
const emailSchema = s.string()
  .email()
  .min(5)
  .max(254); // RFC 5321 limit

const result = emailSchema.validate('user@example.com');
```

### Password Validation

```typescript
const passwordSchema = s.string()
  .min(8)
  .max(128)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/); // At least one lowercase, uppercase, and digit

const result = passwordSchema.validate('MySecurePass123');
```

### URL Validation

```typescript
const urlSchema = s.string()
  .url()
  .startsWith('https://'); // Only HTTPS URLs

const result = urlSchema.validate('https://example.com');
```

### UUID Validation

```typescript
const idSchema = s.string()
  .uuid()
  .transform((val) => val.toLowerCase()); // Normalize to lowercase

const result = idSchema.validate('550e8400-e29b-41d4-a716-446655440000');
```

### Custom Pattern

```typescript
const phoneSchema = s.string()
  .regex(/^\+?[\d\s\-\(\)]+$/)
  .min(10)
  .max(20);

const result = phoneSchema.validate('+1 (555) 123-4567');
```

## Performance Notes

- String validation is highly optimized for common patterns
- Regex patterns are pre-compiled for better performance
- Length checks are performed before expensive operations
- Transformations are applied lazily (only when validation passes)

## Related Validators

- [`number`](./number.md) - For numeric string parsing
- [`enum`](./enum.md) - For fixed string values
- [`union`](./union.md) - For multiple string types