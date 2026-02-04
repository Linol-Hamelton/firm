# FIRM Validator - Performance Benchmarks

Comprehensive benchmarks comparing FIRM against Zod, Valibot, and Yup.

## Quick Start

### Installation

```bash
npm install
```

### Run All Benchmarks

```bash
npm run bench
```

### Run Individual Benchmarks

```bash
npm run bench:simple      # Simple object validation
npm run bench:complex     # Complex nested objects
npm run bench:arrays      # Array validation
npm run bench:strings     # String validation patterns
npm run bench:coercion    # Type coercion
```

### Generate Report

```bash
npm run report
```

Results are saved to `./results/BENCHMARK_REPORT.md`

## Benchmark Suites

### 1. Simple Objects

**File:** [suites/simple-objects.bench.ts](suites/simple-objects.bench.ts)

Tests basic object validation with 5 fields (id, email, name, age, isActive). This represents the most common use case for validators.

**Test Cases:**
- Valid data (success path)
- Invalid data (error path)

**Schema:**
```typescript
{
  id: number (int, positive)
  email: string (email)
  name: string (1-100 chars)
  age: number (int, 18-120)
  isActive: boolean
}
```

### 2. Complex Objects

**File:** [suites/complex-objects.bench.ts](suites/complex-objects.bench.ts)

Tests deeply nested object validation with arrays and optional fields. Represents real-world API payloads.

**Schema:**
```typescript
{
  id: string (uuid)
  user: {
    name: string
    email: string (email)
    age?: number (int, min 0)
    roles: string[] (1-10 items)
  }
  address: {
    street: string
    city: string
    state: string (2 chars)
    zipCode: string (regex)
  }
  metadata: {
    createdAt: string (datetime)
    updatedAt: string (datetime)
    tags?: string[]
  }
  settings?: {
    notifications: boolean (default: true)
    theme: 'light' | 'dark' | 'auto' (default: 'auto')
  }
}
```

### 3. Arrays

**File:** [suites/arrays.bench.ts](suites/arrays.bench.ts)

Tests array validation with different sizes. Important for bulk operations and list processing.

**Test Cases:**
- Small array (10 items)
- Medium array (50 items)
- Large array (100 items)

**Element Schema:**
```typescript
{
  id: number (int, positive)
  name: string (1-100 chars)
  price: number (positive)
  inStock: boolean
}
```

### 4. Strings

**File:** [suites/strings.bench.ts](suites/strings.bench.ts)

Tests various string validation patterns. Strings are the most common validation target.

**Test Cases:**
- Email validation
- URL validation
- UUID validation
- Regex pattern (phone number)
- Length constraints (min/max)

### 5. Type Coercion

**File:** [suites/coercion.bench.ts](suites/coercion.bench.ts)

Tests automatic type conversion for query parameters and form data where everything comes as strings.

**Conversions:**
- string → number (with validation)
- string → boolean
- string → Date
- With validation constraints (min, max, etc.)

## Methodology

### Benchmark Process

1. **Warmup Phase:** 1,000 iterations to warm up the JIT compiler
2. **Measurement Phase:** 10,000+ iterations over at least 1 second
3. **Statistics:** Calculate ops/sec, average time, min, max, standard deviation

### Metrics

- **Ops/sec:** Operations per second (higher is better)
- **Avg (ms):** Average execution time in milliseconds (lower is better)
- **Relative:** Performance relative to the fastest library

### Fairness

- All libraries use their recommended patterns
- Pre-compilation is used where available (FIRM)
- Schemas are equivalent across libraries
- Same test data for all libraries
- Multiple runs to account for variance

## Expected Results

Based on preliminary testing, FIRM should show:

- **3-10x faster** than Zod on most benchmarks
- **2-5x faster** than Valibot
- **5-15x faster** than Yup

Performance gains are largest for:
- Complex nested objects
- Large arrays
- Compiled schemas with `.compile()`

## Understanding Results

### Why FIRM is Faster

1. **Pre-compiled Schemas**
   - Validation logic is compiled ahead of time
   - No runtime schema interpretation
   - Direct function calls instead of traversal

2. **Optimized Code Paths**
   - Specialized validators for each type
   - Minimal overhead per validation
   - Efficient error collection

3. **Zero Parsing Overhead**
   - No need to parse schema definitions
   - Compiled schemas are pure functions
   - Memory efficient (no AST in memory)

### Performance Tips

To get maximum performance from FIRM:

1. **Always use `.compile()`**
   ```typescript
   // ✅ Fast
   const schema = s.object({ ... }).compile();

   // ❌ Slower
   const schema = s.object({ ... });
   ```

2. **Reuse compiled schemas**
   ```typescript
   // ✅ Good - compile once, use many times
   export const userSchema = s.object({ ... }).compile();

   // ❌ Bad - compiling in hot path
   function validate(data) {
     const schema = s.object({ ... }).compile();
     return schema.validate(data);
   }
   ```

3. **Use appropriate validation modes**
   ```typescript
   // For trusted internal data
   const result = schema.validate(data);

   // For user input
   const result = schema.validate(data, { abortEarly: false });
   ```

## Reproducing Results

### Requirements

- Node.js 18+
- 16GB+ RAM (for large benchmarks)
- Stable environment (no other processes)

### Steps

1. Clone the FIRM repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Navigate to benchmarks: `cd benchmarks`
5. Install benchmark dependencies: `npm install`
6. Run benchmarks: `npm run bench`
7. Generate report: `npm run report`

### Environment Considerations

Benchmark results can vary based on:
- CPU model and clock speed
- Available memory
- Node.js version
- Operating system
- Background processes
- JIT warmup state

For most accurate results:
- Close other applications
- Run benchmarks multiple times
- Use consistent Node.js version
- Avoid running on battery power (laptops)

## Results Directory

After running benchmarks, the `./results/` directory will contain:

- `simple-objects.json` - Simple object benchmark data
- `complex-objects.json` - Complex object benchmark data
- `arrays.json` - Array benchmark data
- `strings.json` - String validation benchmark data
- `coercion.json` - Type coercion benchmark data
- `BENCHMARK_REPORT.md` - Comprehensive markdown report

## Contributing

To add new benchmarks:

1. Create a new file in `suites/` following the naming pattern
2. Import the benchmark utilities
3. Define equivalent schemas for all libraries
4. Create test data
5. Use `runSuite()` to run benchmarks
6. Save results with `saveResults()`
7. Add to `all.bench.ts` and package.json scripts

Example structure:
```typescript
import { runSuite, saveResults } from '../benchmark-utils';

const suite = await runSuite({
  name: 'Your Benchmark Name',
  description: 'What this tests',
  tests: [
    {
      name: 'test-firm',
      library: 'FIRM',
      fn: () => firmSchema.validate(data),
    },
    // ... other libraries
  ],
});

saveResults('your-benchmark.json', [suite]);
```

## Comparing with Other Libraries

### Zod

Zod is the most popular TypeScript validator. It offers excellent DX and type inference but has runtime overhead due to schema interpretation.

**When to use Zod:**
- You prioritize developer experience over raw performance
- Validation is not a bottleneck in your application
- You need the extensive ecosystem and community support

**When to use FIRM:**
- You need maximum validation performance
- You're validating large amounts of data
- You're building high-throughput APIs
- Validation is a measured bottleneck

### Valibot

Valibot is designed for bundle size optimization. It's very lightweight but with some performance trade-offs.

**When to use Valibot:**
- Bundle size is your primary concern
- You're building client-side applications
- You need tree-shaking

**When to use FIRM:**
- Performance is more important than bundle size
- You're on the server-side (Node.js)
- You need the fastest possible validation

### Yup

Yup is the oldest and most mature validator, with a jQuery-style API. It's generally the slowest option.

**When to use Yup:**
- You're already using Yup and don't want to migrate
- You need the specific features only Yup provides
- Validation performance is not important

**When to use FIRM:**
- You want better performance
- You prefer a modern TypeScript-first API
- You want compile-time optimization

## License

MIT
