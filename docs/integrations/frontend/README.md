# Frontend Framework Integrations

FIRM provides first-class support for popular frontend frameworks:

## Available Integrations

### Tier 1 (Production Ready)

1. **[React Hook Form](./react-hook-form.md)** - Most popular React form library
   ```typescript
   import { firmResolver } from 'firm-validator/integrations/react-hook-form';
   const { register, handleSubmit } = useForm({ resolver: firmResolver(schema) });
   ```

2. **[Vue 3](./vue.md)** - Progressive JavaScript framework
   ```typescript
   import { useFirmValidation } from 'firm-validator/integrations/vue';
   const { values, errors, validate } = useFirmValidation(schema, initialValues);
   ```

3. **[Svelte](./svelte.md)** - Compiler-based framework
   ```typescript
   import { createFirmStore } from 'firm-validator/integrations/svelte';
   const form = createFirmStore(schema, initialValues);
   ```

4. **[Solid.js](./solid.md)** - Reactive JavaScript framework
   ```typescript
   import { createFirmForm } from 'firm-validator/integrations/solid';
   const { values, errors, handleSubmit } = createFirmForm(schema, initialValues);
   ```

## Quick Comparison

| Framework | Integration Type | State Management | TypeScript | Bundle Impact |
|-----------|-----------------|------------------|------------|---------------|
| React Hook Form | Resolver | useForm hook | ✅ | Minimal |
| Vue 3 | Composable | Reactive refs | ✅ | Minimal |
| Svelte | Store | Writable stores | ✅ | Minimal |
| Solid.js | Signals | Reactive signals | ✅ | Minimal |

## Common Patterns

### Form Validation

All integrations provide consistent form validation:

```typescript
const userSchema = s.object({
  name: s.string().min(1, 'Name is required'),
  email: s.string().email('Invalid email'),
  age: s.number().int().min(18, 'Must be 18+')
});
```

### Field-Level Validation

Validate individual fields on blur:

```typescript
// React Hook Form
<input {...register('email')} onBlur={() => trigger('email')} />

// Vue
<input v-model="values.email" @blur="validateField('email')" />

// Svelte
<input bind:value={$form.values.email} on:blur={() => form.validateField('email')} />

// Solid
<input value={values().email} onBlur={handleBlur('email')} />
```

### Error Display

All integrations provide consistent error handling:

```typescript
// React Hook Form
{errors.email && <span>{errors.email.message}</span>}

// Vue
{errors.email && <span>{{ errors.email }}</span>}

// Svelte
{#if $form.errors.email}
  <span>{$form.errors.email}</span>
{/if}

// Solid
{errors().email && <span>{errors().email}</span>}
```

## Features

### Type Safety

All integrations provide full TypeScript inference:

```typescript
const schema = s.object({
  name: s.string(),
  age: s.number()
});

// TypeScript knows the exact type
const form = useFirmValidation(schema, { name: '', age: 0 });
// form.values: { name: string; age: number }
```

### Reactive Updates

All integrations are reactive and update in real-time:

- React Hook Form: Uses React state and re-renders
- Vue: Uses reactive refs that auto-update templates
- Svelte: Uses stores with automatic subscriptions
- Solid: Uses signals with fine-grained reactivity

### Async Validation

Support for async validation (e.g., checking username availability):

```typescript
const schema = s.object({
  username: s.string().refineAsync(
    async (value) => {
      const available = await checkUsernameAvailability(value);
      return available;
    },
    { message: 'Username already taken' }
  )
});
```

### Custom Error Messages

All integrations support custom error messages:

```typescript
const schema = s.object({
  email: s.string().email('Please enter a valid email address'),
  password: s.string().min(8, 'Password must be at least 8 characters')
});
```

## Installation

```bash
# Base package
npm install firm-validator

# Framework-specific (peer dependencies)
npm install react-hook-form  # For React
npm install vue              # For Vue
npm install svelte           # For Svelte
npm install solid-js         # For Solid
```

## Performance

All integrations are optimized for performance:

- **Zero overhead**: No wrapper components or extra renders
- **Tree-shakable**: Only import what you use
- **Compiled validators**: Pre-compile schemas for hot paths
- **Minimal bundle**: <5KB added to your bundle

## Migration Guides

### From Zod + React Hook Form

```typescript
// Before (Zod)
import { zodResolver } from '@hookform/resolvers/zod';
const { register } = useForm({ resolver: zodResolver(schema) });

// After (FIRM)
import { firmResolver } from 'firm-validator/integrations/react-hook-form';
const { register } = useForm({ resolver: firmResolver(schema) });
```

### From VeeValidate (Vue)

```typescript
// Before (VeeValidate)
import { useField } from 'vee-validate';
const { value, errorMessage } = useField('email', yupSchema);

// After (FIRM)
import { useFirmField } from 'firm-validator/integrations/vue';
const { value, error } = useFirmField(schema, '');
```

## Examples

See complete working examples in [examples/](../../examples/):

- [React Hook Form Example](../../examples/react-hook-form/)
- [Vue 3 Example](../../examples/vue/)
- [Svelte Example](../../examples/svelte/)
- [Solid.js Example](../../examples/solid/)

## Next Steps

- Choose your framework and read the detailed integration guide
- Check [API Reference](../../api/README.md) for schema options
- Browse [Examples](../../examples/) for complete projects
