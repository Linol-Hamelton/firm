# Number Validator API

The number validator provides comprehensive validation for numeric values with support for integers, floats, ranges, and mathematical constraints.

## Basic Usage

```typescript
import { s } from 'firm-validator';

const schema = s.number();
```

## Type Constraints

```typescript
s.number()
  .int()                      // Integer only (no decimals)
  .positive()                 // > 0
  .negative()                 // < 0
  .nonpositive()              // <= 0
  .nonnegative()              // >= 0
  .finite()                   // Exclude Infinity and -Infinity
  .safe()                     // Within safe integer range
```

## Range Constraints

```typescript
s.number()
  .min(0)                     // Minimum value: 0
  .max(100)                   // Maximum value: 100
  .gt(0)                      // Greater than 0
  .gte(0)                     // Greater than or equal to 0
  .lt(100)                    // Less than 100
  .lte(100)                   // Less than or equal to 100
```

## Mathematical Constraints

```typescript
s.number()
  .multipleOf(5)              // Must be divisible by 5
  .step(0.5)                  // Must be multiple of 0.5
```

## Modifiers

```typescript
s.number()
  .optional()                 // number | undefined
  .nullable()                 // number | null
  .default(0)                 // Provide default value
```

## Type Coercion

```typescript
// Coerce strings to numbers
s.coerce.number()             // "42" → 42, "3.14" → 3.14
s.coerce.number().int()       // "42.9" → 42 (truncated)

// Handle edge cases
s.coerce.number()             // null/undefined → NaN (then fails validation)
```

## Type Inference

```typescript
const intSchema = s.number().int().min(0);
type Inferred = s.Infer<typeof intSchema>; // number

const positiveSchema = s.number().positive();
type Positive = s.Infer<typeof positiveSchema>; // number

const optionalSchema = s.number().optional();
type Optional = s.Infer<typeof optionalSchema>; // number | undefined
```

## Error Messages

```typescript
const ageSchema = s.number().int().min(0).max(150);

ageSchema.validate(-5);       // Error: "Must be at least 0"
ageSchema.validate(200);      // Error: "Must be at most 150"
ageSchema.validate(25.5);     // Error: "Must be an integer"
ageSchema.validate("25");     // Error: "Expected number, received string"
```

## Examples

### Age Validation

```typescript
const ageSchema = s.number()
  .int()
  .min(0)
  .max(150);

const result = ageSchema.validate(25);
```

### Price Validation

```typescript
const priceSchema = s.number()
  .positive()
  .max(999999.99)
  .multipleOf(0.01); // Max 2 decimal places

const result = priceSchema.validate(29.99);
```

### Rating Validation

```typescript
const ratingSchema = s.number()
  .min(1)
  .max(5)
  .multipleOf(0.5); // Allow half-stars

const result = ratingSchema.validate(4.5);
```

### Percentage Validation

```typescript
const percentageSchema = s.number()
  .min(0)
  .max(100)
  .finite();

const result = percentageSchema.validate(85.5);
```

### ID Validation

```typescript
const idSchema = s.number()
  .int()
  .positive()
  .safe(); // Within safe integer range

const result = idSchema.validate(12345);
```

### Coordinate Validation

```typescript
const latitudeSchema = s.number()
  .min(-90)
  .max(90)
  .finite();

const longitudeSchema = s.number()
  .min(-180)
  .max(180)
  .finite();

const result = latitudeSchema.validate(40.7128);
```

## Performance Notes

- Number validation is highly optimized with early type checks
- Integer checks use efficient bitwise operations
- Range checks are performed with simple comparisons
- Multiple constraints are evaluated in optimal order

## Security Considerations

- **Safe integer checks**: Prevent precision loss for large numbers
- **Finite checks**: Prevent Infinity/-Infinity values
- **Type coercion safety**: String-to-number conversion is safe and predictable

## Related Validators

- [`string`](./string.md) - For numeric strings
- [`bigint`](./bigint.md) - For arbitrary precision numbers
- [`union`](./union.md) - For multiple number types