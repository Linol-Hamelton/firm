/**
 * Firm Validator Performance Benchmarks
 *
 * Run with: npx tsx benchmarks/performance.bench.ts
 */

import { s, compile } from '../src/index.js';

// ============================================================================
// BENCHMARK UTILITIES
// ============================================================================

interface BenchmarkResult {
  name: string;
  opsPerSec: number;
  avgTimeNs: number;
  iterations: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations = 100000
): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalMs = end - start;
  const opsPerSec = Math.round((iterations / totalMs) * 1000);
  const avgTimeNs = Math.round((totalMs / iterations) * 1_000_000);

  return { name, opsPerSec, avgTimeNs, iterations };
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function printResult(result: BenchmarkResult): void {
  console.log(
    `  ${result.name.padEnd(40)} ${formatNumber(result.opsPerSec).padStart(15)} ops/sec  (${result.avgTimeNs}ns avg)`
  );
}

function printHeader(title: string): void {
  console.log();
  console.log('='.repeat(80));
  console.log(` ${title}`);
  console.log('='.repeat(80));
}

// ============================================================================
// TEST DATA
// ============================================================================

const validString = 'hello@example.com';
const invalidString = 'not-an-email';

const validNumber = 42;
const invalidNumber = 'not-a-number';

const validObject = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
  tags: ['admin', 'user'],
};

const invalidObject = {
  name: '',
  age: -5,
  email: 'invalid-email',
  tags: 123,
};

const largeObject = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA',
  },
  tags: ['admin', 'user', 'developer'],
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  },
};

// ============================================================================
// SCHEMAS
// ============================================================================

const stringSchema = s.string();
const emailSchema = s.string().email();
const numberSchema = s.number().int().positive();

const simpleObjectSchema = s.object({
  name: s.string().min(1),
  age: s.number().int().min(0),
  email: s.string().email(),
  tags: s.array(s.string()),
});

const complexObjectSchema = s.object({
  id: s.string().min(1),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150),
  address: s.object({
    street: s.string().min(1),
    city: s.string().min(1),
    state: s.string().min(2).max(2),
    zip: s.string().regex(/^\d{5}$/),
    country: s.string().min(1),
  }),
  tags: s.array(s.string()).min(1),
  settings: s.object({
    theme: s.enum(['light', 'dark']),
    notifications: s.boolean(),
    language: s.string().min(2).max(5),
  }),
  metadata: s.object({
    createdAt: s.string(),
    updatedAt: s.string(),
    version: s.number().int().min(1),
  }),
});

// Compiled validators
const compiledStringSchema = compile(stringSchema);
const compiledEmailSchema = compile(emailSchema);
const compiledNumberSchema = compile(numberSchema);
const compiledSimpleObjectSchema = compile(simpleObjectSchema);
const compiledComplexObjectSchema = compile(complexObjectSchema);

// ============================================================================
// BENCHMARKS
// ============================================================================

console.log();
console.log('FIRM VALIDATOR PERFORMANCE BENCHMARKS');
console.log('=====================================');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Node: ${process.version}`);
console.log();

// String benchmarks
printHeader('STRING VALIDATION');

printResult(benchmark('string.validate() - valid', () => {
  stringSchema.validate(validString);
}));

printResult(benchmark('string.validate() - invalid', () => {
  stringSchema.validate(invalidNumber);
}));

printResult(benchmark('compiled string - valid', () => {
  compiledStringSchema(validString);
}));

printResult(benchmark('compiled string - invalid', () => {
  compiledStringSchema(invalidNumber);
}));

printResult(benchmark('string.is() - valid', () => {
  stringSchema.is(validString);
}));

printResult(benchmark('string.is() - invalid', () => {
  stringSchema.is(invalidNumber);
}));

// Email benchmarks
printHeader('EMAIL VALIDATION');

printResult(benchmark('email.validate() - valid', () => {
  emailSchema.validate(validString);
}));

printResult(benchmark('email.validate() - invalid', () => {
  emailSchema.validate(invalidString);
}));

printResult(benchmark('compiled email - valid', () => {
  compiledEmailSchema(validString);
}));

printResult(benchmark('compiled email - invalid', () => {
  compiledEmailSchema(invalidString);
}));

// Number benchmarks
printHeader('NUMBER VALIDATION');

printResult(benchmark('number.validate() - valid', () => {
  numberSchema.validate(validNumber);
}));

printResult(benchmark('number.validate() - invalid', () => {
  numberSchema.validate(invalidNumber);
}));

printResult(benchmark('compiled number - valid', () => {
  compiledNumberSchema(validNumber);
}));

printResult(benchmark('compiled number - invalid', () => {
  compiledNumberSchema(invalidNumber);
}));

// Simple object benchmarks
printHeader('SIMPLE OBJECT VALIDATION (4 fields)');

printResult(benchmark('object.validate() - valid', () => {
  simpleObjectSchema.validate(validObject);
}));

printResult(benchmark('object.validate() - invalid', () => {
  simpleObjectSchema.validate(invalidObject);
}));

printResult(benchmark('compiled object - valid', () => {
  compiledSimpleObjectSchema(validObject);
}));

printResult(benchmark('compiled object - invalid', () => {
  compiledSimpleObjectSchema(invalidObject);
}));

// Complex object benchmarks
printHeader('COMPLEX OBJECT VALIDATION (nested, 15+ fields)');

printResult(benchmark('complex.validate() - valid', () => {
  complexObjectSchema.validate(largeObject);
}, 50000));

printResult(benchmark('compiled complex - valid', () => {
  compiledComplexObjectSchema(largeObject);
}, 50000));

// Array benchmarks
printHeader('ARRAY VALIDATION');

const arraySchema = s.array(s.number());
const compiledArraySchema = compile(arraySchema);
const smallArray = [1, 2, 3, 4, 5];
const largeArray = Array.from({ length: 100 }, (_, i) => i);

printResult(benchmark('array.validate() - 5 items', () => {
  arraySchema.validate(smallArray);
}));

printResult(benchmark('compiled array - 5 items', () => {
  compiledArraySchema(smallArray);
}));

printResult(benchmark('array.validate() - 100 items', () => {
  arraySchema.validate(largeArray);
}, 10000));

printResult(benchmark('compiled array - 100 items', () => {
  compiledArraySchema(largeArray);
}, 10000));

// Union benchmarks
printHeader('UNION VALIDATION');

const unionSchema = s.union([s.string(), s.number(), s.boolean()]);
const compiledUnionSchema = compile(unionSchema);

printResult(benchmark('union.validate() - first match', () => {
  unionSchema.validate('hello');
}));

printResult(benchmark('union.validate() - last match', () => {
  unionSchema.validate(true);
}));

printResult(benchmark('compiled union - first match', () => {
  compiledUnionSchema('hello');
}));

printResult(benchmark('compiled union - last match', () => {
  compiledUnionSchema(true);
}));

// Coerce benchmarks
printHeader('COERCE VALIDATION');

const coerceNumberSchema = s.coerce.number();
const coerceBooleanSchema = s.coerce.boolean();

printResult(benchmark('coerce.number() - string to number', () => {
  coerceNumberSchema.validate('42');
}));

printResult(benchmark('coerce.boolean() - string to boolean', () => {
  coerceBooleanSchema.validate('true');
}));

// Summary
printHeader('SUMMARY');

const stringNonCompiled = benchmark('string non-compiled', () => stringSchema.validate(validString));
const stringCompiled = benchmark('string compiled', () => compiledStringSchema(validString));
const objectNonCompiled = benchmark('object non-compiled', () => simpleObjectSchema.validate(validObject));
const objectCompiled = benchmark('object compiled', () => compiledSimpleObjectSchema(validObject));

console.log(`  String validation speedup (compiled):  ${(stringCompiled.opsPerSec / stringNonCompiled.opsPerSec).toFixed(2)}x`);
console.log(`  Object validation speedup (compiled):  ${(objectCompiled.opsPerSec / objectNonCompiled.opsPerSec).toFixed(2)}x`);

console.log();
console.log('Benchmark complete!');
console.log();
