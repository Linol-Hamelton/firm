# Installation

Get started with **Firm Validator** in less than 2 minutes.

---

## Requirements

- **Node.js** 18.0.0 or higher
- **TypeScript** 5.0.0 or higher (recommended)

---

## Package Manager

Choose your preferred package manager:

### npm

```bash
npm install firm-validator
```

### Yarn

```bash
yarn add firm-validator
```

### pnpm

```bash
pnpm add firm-validator
```

### Bun

```bash
bun add firm-validator
```

---

## TypeScript Configuration

For the best experience, update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true
  }
}
```

**Important:**
- `strict: true` - Enables all strict type checking
- `exactOptionalPropertyTypes: true` - Distinguishes `T | undefined` from optional properties
- `skipLibCheck: true` - Speeds up compilation

---

## Import Syntax

### Full Bundle (Recommended for Most Projects)

```typescript
import { s } from 'firm-validator';

const schema = s.string().email();
```

### Tree-Shakeable Imports (For Optimal Bundle Size)

```typescript
// Import only primitives
import { s } from 'firm-validator/primitives';

const schema = s.string().email();
// ✅ Only includes string validator code
```

```typescript
// Import only composites
import { s } from 'firm-validator/composites';

const schema = s.object({
  name: s.string()  // ❌ Error: s.string is not defined
});
```

```typescript
// Import specific validators
import { StringValidator } from 'firm-validator/primitives';
import { ObjectValidator } from 'firm-validator/composites';

const nameSchema = new StringValidator().min(1);
const userSchema = new ObjectValidator({ name: nameSchema });
```

### Compiler (Advanced)

```typescript
import { compile } from 'firm-validator/compiler';

const schema = s.string().email();
const validator = compile(schema); // 10x faster!

validator('test@example.com'); // Compiled validation
```

---

## Verify Installation

Create a test file `test.ts`:

```typescript
import { s } from 'firm-validator';

const schema = s.object({
  name: s.string(),
  age: s.number()
});

const result = schema.validate({
  name: 'John',
  age: 30
});

console.log(result);
// { ok: true, data: { name: 'John', age: 30 } }
```

Run it:

```bash
npx tsx test.ts
# or
node --loader tsx test.ts
# or
ts-node test.ts
```

You should see:
```
{ ok: true, data: { name: 'John', age: 30 } }
```

✅ **Installation successful!**

---

## Editor Setup

### VS Code

Install recommended extensions:

1. **TypeScript and JavaScript Language Features** (built-in)
2. **ESLint** (optional, for linting)
3. **Prettier** (optional, for formatting)

Firm provides excellent IntelliSense out of the box:

```typescript
s.string().  // ← IntelliSense shows all available methods
//           min, max, email, url, regex, etc.
```

### WebStorm / IntelliJ IDEA

TypeScript support is built-in. No additional setup required.

---

## Bundle Size

After installation, check your bundle size:

```bash
# With webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# With vite-bundle-visualizer
npm install --save-dev vite-bundle-visualizer
```

Firm should add approximately **4.2KB** to your bundle (minified).

---

## Troubleshooting

### Issue: "Cannot find module 'firm-validator'"

**Solution:**
1. Verify installation: `npm list firm-validator`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `rm -rf node_modules && npm install`

### Issue: TypeScript errors with type inference

**Solution:**
Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

### Issue: Import errors in ESM/CommonJS

**Solution:**

For **ESM** (package.json with `"type": "module"`):
```typescript
import { s } from 'firm-validator';
```

For **CommonJS** (default):
```typescript
const { s } = require('firm-validator');
```

Firm supports both automatically.

### Issue: Slow TypeScript compilation

**Solution:**
Add `skipLibCheck: true` to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

## Next Steps

Now that Firm is installed:

1. [Quick Start Tutorial](./quick-start.md) - Learn the basics in 5 minutes
2. [First Schema](./first-schema.md) - Create your first validation schema
3. [API Reference](../api/) - Explore all validators

---

## Upgrading

### From 0.x to 1.0.0-rc.1

This is a major version with breaking changes. See [CHANGELOG.md](../../CHANGELOG.md) for details.

### Keeping Up to Date

Check for updates:
```bash
npm outdated firm-validator
```

Update to latest:
```bash
npm update firm-validator
```

---

**Previous:** [Introduction ←](./introduction.md)
**Next:** [Quick Start →](./quick-start.md)
