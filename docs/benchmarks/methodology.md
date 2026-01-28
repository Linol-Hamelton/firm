# Benchmark Methodology

This document describes how Firm's performance is measured and compared.

## Running Benchmarks

```bash
# Run performance benchmarks
npm run bench
```

## Benchmark Environment

- **Node.js**: v22.x (latest LTS recommended)
- **Iterations**: 100,000 per test (minimum)
- **Warmup**: 1,000 iterations before measurement
- **Metrics**: Operations per second, average time in nanoseconds

## Test Categories

### 1. Primitive Validation

Tests single-field validation:
- String validation
- Email validation (with regex pattern)
- Number validation (with constraints)
- Boolean validation

### 2. Object Validation

Tests multi-field object validation:
- Simple objects (4 fields)
- Complex nested objects (15+ fields)

### 3. Array Validation

Tests array validation:
- Small arrays (5 items)
- Large arrays (100 items)

### 4. Union Validation

Tests union type matching:
- First match (best case)
- Last match (worst case)

### 5. Coercion

Tests type coercion:
- String to number
- String to boolean

## Compiled vs Non-Compiled

Firm supports two validation modes:

1. **Non-compiled**: Direct validation via `schema.validate()`
2. **Compiled**: Pre-compiled validators via `compile(schema)`

Compiled validators are faster because they:
- Pre-compute validation logic
- Inline type checks
- Avoid function call overhead
- Minimize object allocations

## Latest Results (Node.js v22.x)

| Operation | Non-Compiled | Compiled | Speedup |
|-----------|--------------|----------|---------|
| String validation | 28M ops/sec | 95M ops/sec | 3.4x |
| Number validation | 31M ops/sec | 27M ops/sec | 0.9x |
| Email validation | 16M ops/sec | 17M ops/sec | 1.1x |
| Simple object (4 fields) | 2.8M ops/sec | 4.2M ops/sec | 1.5x |
| Complex object (15+ fields) | 507K ops/sec | 1.1M ops/sec | 2.2x |
| Array (5 items) | 4.4M ops/sec | 10M ops/sec | 2.3x |
| Array (100 items) | 272K ops/sec | 744K ops/sec | 2.7x |
| Union (first match) | 13M ops/sec | 31M ops/sec | 2.4x |

## Comparison with Other Libraries

These numbers are measured using the same methodology. Third-party library benchmarks may vary based on configuration.

| Library | Simple Object | Complex Object | String |
|---------|--------------|----------------|--------|
| **Firm (compiled)** | 4.2M ops/sec | 1.1M ops/sec | 95M ops/sec |
| Firm (non-compiled) | 2.8M ops/sec | 507K ops/sec | 28M ops/sec |
| Zod* | ~800K ops/sec | ~150K ops/sec | ~5M ops/sec |
| Yup* | ~500K ops/sec | ~100K ops/sec | ~3M ops/sec |
| Joi* | ~200K ops/sec | ~50K ops/sec | ~2M ops/sec |

*Approximate values from public benchmarks. Run your own tests for accurate comparisons.

## Tips for Best Performance

1. **Use compiled validators** for hot paths
2. **Use `abortEarly: true`** (default) for faster failure
3. **Prefer `.is()` method** for type guards (no error objects)
4. **Reuse schema instances** instead of creating new ones
5. **Use discriminated unions** for better union performance

## Running Your Own Benchmarks

Create a custom benchmark:

```typescript
import { s, compile } from 'firm-validator';

const schema = s.object({
  name: s.string(),
  age: s.number(),
});

const compiled = compile(schema);

// Warmup
for (let i = 0; i < 1000; i++) {
  compiled({ name: 'test', age: 25 });
}

// Measure
const start = performance.now();
const iterations = 100000;

for (let i = 0; i < iterations; i++) {
  compiled({ name: 'test', age: 25 });
}

const elapsed = performance.now() - start;
const opsPerSec = Math.round((iterations / elapsed) * 1000);

console.log(`${opsPerSec.toLocaleString()} ops/sec`);
```
