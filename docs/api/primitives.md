# Primitives API Reference

Primitive validators are the building blocks of Firm schemas. They validate basic JavaScript/TypeScript types.

---

## String

### `s.string()`

Validates that a value is a string.

```typescript
const schema = s.string();

schema.validate('hello');     // ✅ { ok: true, data: 'hello' }
schema.validate(123);          // ❌ { ok: false, error: ... }
schema.validate(null);         // ❌ { ok: false, error: ... }
```

### String Methods

#### `.min(length: number, message?: string)`

Minimum string length.

```typescript
s.string().min(5);

s.string().min(5).validate('hello');    // ✅ length = 5
s.string().min(5).validate('hi');       // ❌ length = 2
```

#### `.max(length: number, message?: string)`

Maximum string length.

```typescript
s.string().max(10);

s.string().max(10).validate('hello');   // ✅ length = 5
s.string().max(10).validate('very long string');  // ❌ length > 10
```

#### `.length(length: number, message?: string)`

Exact string length.

```typescript
s.string().length(5);

s.string().length(5).validate('hello');  // ✅ length = 5
s.string().length(5).validate('hi');     // ❌ length = 2
```

#### `.email(message?: string)`

Validates email format.

```typescript
s.string().email();

s.string().email().validate('user@example.com');  // ✅
s.string().email().validate('invalid');           // ❌
```

#### `.url(message?: string)`

Validates URL format.

```typescript
s.string().url();

s.string().url().validate('https://example.com');  // ✅
s.string().url().validate('not a url');            // ❌
```

#### `.uuid(message?: string)`

Validates UUID format.

```typescript
s.string().uuid();

s.string().uuid().validate('550e8400-e29b-41d4-a716-446655440000');  // ✅
s.string().uuid().validate('not-a-uuid');                             // ❌
```

#### `.regex(pattern: RegExp, message?: string)`

Validates against a regular expression.

```typescript
s.string().regex(/^[A-Z]+$/);

s.string().regex(/^[A-Z]+$/).validate('HELLO');   // ✅
s.string().regex(/^[A-Z]+$/).validate('hello');   // ❌
```

#### `.startsWith(prefix: string, message?: string)`

String must start with prefix.

```typescript
s.string().startsWith('hello');

s.string().startsWith('hello').validate('hello world');  // ✅
s.string().startsWith('hello').validate('world hello');  // ❌
```

#### `.endsWith(suffix: string, message?: string)`

String must end with suffix.

```typescript
s.string().endsWith('.com');

s.string().endsWith('.com').validate('example.com');  // ✅
s.string().endsWith('.com').validate('example.org');  // ❌
```

#### `.includes(substring: string, message?: string)`

String must include substring.

```typescript
s.string().includes('hello');

s.string().includes('hello').validate('say hello world');  // ✅
s.string().includes('hello').validate('goodbye world');    // ❌
```

### Chaining

All string methods can be chained:

```typescript
const usernameSchema = s.string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/)
  .startsWith('user_');

usernameSchema.validate('user_john123');  // ✅
```

---

## Number

### `s.number()`

Validates that a value is a number.

```typescript
const schema = s.number();

schema.validate(42);           // ✅ { ok: true, data: 42 }
schema.validate('42');         // ❌ { ok: false, error: ... }
schema.validate(NaN);          // ❌ { ok: false, error: ... }
```

### Number Methods

#### `.min(value: number, message?: string)`

Minimum value (inclusive).

```typescript
s.number().min(0);

s.number().min(0).validate(5);     // ✅
s.number().min(0).validate(-1);    // ❌
```

#### `.max(value: number, message?: string)`

Maximum value (inclusive).

```typescript
s.number().max(100);

s.number().max(100).validate(50);   // ✅
s.number().max(100).validate(150);  // ❌
```

#### `.int(message?: string)`

Must be an integer.

```typescript
s.number().int();

s.number().int().validate(42);     // ✅
s.number().int().validate(42.5);   // ❌
```

#### `.positive(message?: string)`

Must be positive (> 0).

```typescript
s.number().positive();

s.number().positive().validate(5);    // ✅
s.number().positive().validate(-5);   // ❌
s.number().positive().validate(0);    // ❌
```

#### `.negative(message?: string)`

Must be negative (< 0).

```typescript
s.number().negative();

s.number().negative().validate(-5);   // ✅
s.number().negative().validate(5);    // ❌
```

#### `.multipleOf(value: number, message?: string)`

Must be a multiple of value.

```typescript
s.number().multipleOf(5);

s.number().multipleOf(5).validate(10);   // ✅
s.number().multipleOf(5).validate(12);   // ❌
```

#### `.finite(message?: string)`

Must be a finite number (not Infinity or -Infinity).

```typescript
s.number().finite();

s.number().finite().validate(42);         // ✅
s.number().finite().validate(Infinity);   // ❌
```

### Chaining

```typescript
const ageSchema = s.number()
  .int()
  .min(0)
  .max(150);

ageSchema.validate(25);   // ✅
```

---

## Boolean

### `s.boolean()`

Validates that a value is a boolean.

```typescript
const schema = s.boolean();

schema.validate(true);         // ✅ { ok: true, data: true }
schema.validate(false);        // ✅ { ok: true, data: false }
schema.validate('true');       // ❌ { ok: false, error: ... }
schema.validate(1);            // ❌ { ok: false, error: ... }
```

---

## Literal

### `s.literal(value)`

Validates that a value exactly matches the literal.

```typescript
// String literal
const schema = s.literal('hello');
schema.validate('hello');   // ✅
schema.validate('world');   // ❌

// Number literal
const fortytwo = s.literal(42);
fortytwo.validate(42);      // ✅
fortytwo.validate(43);      // ❌

// Boolean literal
const trueOnly = s.literal(true);
trueOnly.validate(true);    // ✅
trueOnly.validate(false);   // ❌
```

### Use Cases

Literals are useful for:
- Discriminated unions
- Exact value matching
- Type narrowing

```typescript
const messageSchema = s.object({
  type: s.literal('success'),
  message: s.string()
});

messageSchema.validate({
  type: 'success',
  message: 'Operation completed'
});  // ✅

messageSchema.validate({
  type: 'error',  // ❌ Must be 'success'
  message: 'Something failed'
});
```

---

## Enum

### `s.enum(values: readonly [string, ...string[]])`

Validates that a value is one of the allowed strings.

```typescript
const colorSchema = s.enum(['red', 'green', 'blue']);

colorSchema.validate('red');      // ✅
colorSchema.validate('yellow');   // ❌
```

### Type Inference

```typescript
const schema = s.enum(['admin', 'user', 'guest']);

type Role = typeof schema.infer;
// 'admin' | 'user' | 'guest'
```

### Use Cases

```typescript
// User roles
const roleSchema = s.enum(['admin', 'moderator', 'user']);

// Status codes
const statusSchema = s.enum(['pending', 'approved', 'rejected']);

// Themes
const themeSchema = s.enum(['light', 'dark', 'auto']);
```

---

## Native Enum

### `s.nativeEnum(enum)`

Validates against a native TypeScript enum.

#### String Enum

```typescript
enum Color {
  Red = 'red',
  Green = 'green',
  Blue = 'blue'
}

const schema = s.nativeEnum(Color);

schema.validate('red');          // ✅
schema.validate('yellow');       // ❌
schema.validate(Color.Red);      // ✅
```

#### Numeric Enum

```typescript
enum Status {
  Pending,    // 0
  Approved,   // 1
  Rejected    // 2
}

const schema = s.nativeEnum(Status);

schema.validate(0);              // ✅
schema.validate(1);              // ✅
schema.validate(Status.Pending); // ✅
schema.validate(3);              // ❌
```

#### Mixed Enum (String + Number)

```typescript
enum Mixed {
  First = 'first',
  Second = 2,
  Third = 'third'
}

const schema = s.nativeEnum(Mixed);

schema.validate('first');        // ✅
schema.validate(2);              // ✅
schema.validate('third');        // ✅
```

---

## Modifiers

All primitives support modifiers:

### `.optional()`

Makes the value optional (T | undefined).

```typescript
s.string().optional();

s.string().optional().validate('hello');     // ✅
s.string().optional().validate(undefined);   // ✅
s.string().optional().validate(null);        // ❌
```

### `.nullable()`

Makes the value nullable (T | null).

```typescript
s.string().nullable();

s.string().nullable().validate('hello');     // ✅
s.string().nullable().validate(null);        // ✅
s.string().nullable().validate(undefined);   // ❌
```

### `.default(value)`

Provides a default value when undefined.

```typescript
s.string().default('hello');

const result = s.string().default('hello').validate(undefined);
console.log(result.data);  // 'hello'
```

### `.describe(text)`

Adds a description (for documentation).

```typescript
s.string().describe('User email address');
```

---

## Type Inference Examples

```typescript
// String
const str = s.string();
type Str = typeof str.infer;  // string

// Number with constraints
const age = s.number().int().min(0);
type Age = typeof age.infer;  // number

// Optional string
const opt = s.string().optional();
type Opt = typeof opt.infer;  // string | undefined

// Nullable number
const nullable = s.number().nullable();
type Nullable = typeof nullable.infer;  // number | null

// Enum
const role = s.enum(['admin', 'user']);
type Role = typeof role.infer;  // 'admin' | 'user'

// Literal
const exact = s.literal('hello');
type Exact = typeof exact.infer;  // 'hello'
```

---

## Error Messages

Custom error messages:

```typescript
s.string().min(5, 'Username must be at least 5 characters');
s.number().max(100, 'Age cannot exceed 100');
s.string().email('Please provide a valid email address');
```

---

**Next:** [Composites →](./composites.md)
