# Auto-Fix Mode (Revolutionary Feature #10)

FIRM's Auto-Fix Mode automatically corrects common validation errors, improving user experience.

## What It Fixes

### Type Coercion
- `string` → `number`: `"42"` → `42`
- `string` → `boolean`: `"true"` → `true`, `"1"` → `true`
- `string` → `Date`: `"2024-01-01"` → `new Date("2024-01-01")`
- `number` → `integer`: `42.7` → `43` (rounds)

### String Fixes
- **Trim**: `"  hello  "` → `"hello"`
- **Normalize whitespace**: `"hello    world"` → `"hello world"`
- **Lowercase**: `"JOHN@EXAMPLE.COM"` → `"john@example.com"`
- **Remove spaces**: `"1 2 3 4"` → `"1234"`

### Format Fixes
- **Email**: `"  JOHN@EXAMPLE.COM  "` → `"john@example.com"`
- **URL**: `"example.com"` → `"https://example.com"`

## Quick Start

```typescript
import { s } from 'firm-validator';
import { withAutoFix, enableAutoFix } from 'firm-validator/infrastructure/auto-fix';

// Enable auto-fix globally
enableAutoFix();

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int(),
});

const autoFixSchema = withAutoFix(userSchema);

// Auto-fixes common issues
const result = autoFixSchema.validate({
  name: '  John  ',          // → 'John' (trimmed)
  email: 'JOHN@EXAMPLE.COM', // → 'john@example.com' (lowercased)
  age: '30',                 // → 30 (parsed)
});

console.log(result.ok); // true
console.log(result.data);
// { name: 'John', email: 'john@example.com', age: 30 }
```

## Configuration

### Enable Specific Strategies

```typescript
import { withAutoFixConfig } from 'firm-validator/infrastructure/auto-fix';

const autoFixSchema = withAutoFixConfig(userSchema, {
  enabled: true,
  strategies: ['trim', 'lowercase', 'coerce'],
});
```

### Available Strategies

- `'trim'` - Trim whitespace from strings
- `'coerce'` - Coerce types (string → number, string → boolean)
- `'lowercase'` - Lowercase email/URL
- `'uppercase'` - Uppercase strings
- `'normalize'` - Normalize whitespace
- `'parseNumber'` - Parse numbers from strings
- `'parseDate'` - Parse dates from strings
- `'fixUrl'` - Fix URL protocol
- `'removeSpaces'` - Remove all spaces
- `'all'` - Enable all strategies (default)

## Custom Fix Functions

Add your own fix logic:

```typescript
import { createAutoFixer } from 'firm-validator/infrastructure/auto-fix';

const fixer = createAutoFixer({
  enabled: true,
  strategies: ['all'],
  customFixes: {
    STRING_TOO_SHORT: (value) => {
      if (typeof value === 'string') {
        // Pad short strings
        return value.padEnd(5, 'X');
      }
      return value;
    },
    NOT_NUMBER: (value) => {
      // Custom number parsing
      if (typeof value === 'string') {
        return parseFloat(value.replace(/,/g, ''));
      }
      return value;
    },
  },
});

const schema = withAutoFixConfig(userSchema, fixer);
```

## Examples

### Example 1: User Registration Form

```typescript
const registrationSchema = s.object({
  username: s.string().min(3).max(20),
  email: s.string().email(),
  password: s.string().min(8),
  age: s.number().int().min(13),
  termsAccepted: s.boolean(),
});

const autoFixSchema = withAutoFix(registrationSchema);

// User submits form with common mistakes
const result = autoFixSchema.validate({
  username: '  john_doe  ',        // → 'john_doe' (trimmed)
  email: 'JOHN.DOE@EXAMPLE.COM',   // → 'john.doe@example.com' (lowercased)
  password: '  MyP@ssw0rd  ',      // → 'MyP@ssw0rd' (trimmed)
  age: '16',                       // → 16 (parsed)
  termsAccepted: 'true',           // → true (parsed)
});

// All fixed automatically!
console.log(result.ok); // true
```

### Example 2: API Input Parsing

```typescript
const apiSchema = s.object({
  query: s.string(),
  page: s.number().int().min(1),
  limit: s.number().int().max(100),
  active: s.boolean(),
});

const autoFixSchema = withAutoFix(apiSchema);

// Query params come as strings from URL
const result = autoFixSchema.validate({
  query: '  search term  ',  // → 'search term' (trimmed)
  page: '2',                  // → 2 (parsed)
  limit: '50',                // → 50 (parsed)
  active: '1',                // → true (parsed)
});

console.log(result.ok); // true
```

### Example 3: CSV Import

```typescript
const csvRowSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  phone: s.string(),
  age: s.number().int(),
});

const autoFixSchema = withAutoFixConfig(csvRowSchema, {
  enabled: true,
  strategies: ['trim', 'normalize', 'lowercase', 'parseNumber'],
});

// CSV data often has extra whitespace and formatting issues
const result = autoFixSchema.validate({
  name: '  John    Doe  ',          // → 'John Doe' (normalized)
  email: '  JOHN@EXAMPLE.COM  ',    // → 'john@example.com' (fixed)
  phone: '  (555) 123-4567  ',      // → '(555) 123-4567' (trimmed)
  age: '  30  ',                    // → 30 (parsed)
});

console.log(result.ok); // true
```

## Combined with Smart Caching

Auto-Fix and Smart Caching work great together:

```typescript
import { withCache } from 'firm-validator/infrastructure/caching';
import { withAutoFix } from 'firm-validator/infrastructure/auto-fix';

// Apply auto-fix first, then cache
const schema = s.object({
  name: s.string(),
  email: s.string().email(),
});

const autoFixSchema = withAutoFix(schema);
const cachedAutoFixSchema = withCache(autoFixSchema);

// First call: auto-fixes and caches
cachedAutoFixSchema.validate({ name: '  John  ', email: 'JOHN@EXAMPLE.COM' });

// Second call: served from cache (ultra fast!)
cachedAutoFixSchema.validate({ name: '  John  ', email: 'JOHN@EXAMPLE.COM' });
```

## When to Use

### ✅ Good Use Cases

- **User input forms**: Fix common typos and formatting
- **API query parameters**: Parse string values to correct types
- **CSV/Excel imports**: Handle messy data formatting
- **Legacy system integration**: Normalize data from old systems
- **Developer convenience**: Make schemas more forgiving

### ⚠️ Use with Caution

- **Financial data**: Don't auto-fix monetary amounts
- **Security-critical**: Don't auto-fix passwords or tokens
- **Exact validation needed**: When precision matters
- **Audit requirements**: When you need to track exact input

## Global Configuration

Enable auto-fix globally for all wrapped schemas:

```typescript
import { enableAutoFix, disableAutoFix } from 'firm-validator/infrastructure/auto-fix';

// Enable with all strategies
enableAutoFix();

// Enable with specific strategies
enableAutoFix(['trim', 'lowercase', 'coerce']);

// Disable when needed
disableAutoFix();
```

## Performance

Auto-Fix has minimal performance impact:
- **Without auto-fix**: ~10μs per validation
- **With auto-fix (success)**: ~10μs per validation (no fixes applied)
- **With auto-fix (fixes applied)**: ~15-20μs per validation

## Best Practices

1. **Enable selectively**: Don't enable for all schemas, only where needed
2. **Use specific strategies**: Only enable fixes you need
3. **Test thoroughly**: Verify auto-fixes work as expected
4. **Document behavior**: Make it clear to users that auto-fix is enabled
5. **Validate results**: Check that auto-fixed data meets requirements

## See Also

- [Smart Caching](./smart-caching.md)
- [Schema Guide](../core-concepts/schemas.md)
- [Type Coercion](../api/coerce.md)
