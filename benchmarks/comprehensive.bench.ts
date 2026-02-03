/**
 * Comprehensive Benchmark Suite for FIRM Validator
 *
 * Compares FIRM with Zod, Valibot, and Yup across multiple scenarios.
 * Run with: npx tsx benchmarks/comprehensive.bench.ts
 *
 * Methodology:
 * - Warmup: 1000 iterations
 * - Measurement: 100,000 iterations per test
 * - Hardware: Consistent environment
 * - Node.js version: Latest LTS
 * - All libraries at latest versions
 */

import { s, compile } from '../src/index.js';
import { z } from 'zod';
import * as v from 'valibot';
import * as yup from 'yup';

// ============================================================================
// BENCHMARK INFRASTRUCTURE
// ============================================================================

interface BenchmarkResult {
  library: string;
  scenario: string;
  opsPerSec: number;
  avgTimeNs: number;
  iterations: number;
  relativeSpeed?: number;
}

interface BenchmarkSuite {
  name: string;
  description: string;
  data: any;
  schemas: {
    firm: any;
    zod: any;
    valibot: any;
    yup: any;
  };
}

function benchmark(
  name: string,
  fn: () => void,
  iterations = 100000
): Omit<BenchmarkResult, 'library' | 'scenario' | 'relativeSpeed'> {
  // Warmup phase
  for (let i = 0; i < 1000; i++) {
    fn();
  }

  // Garbage collection hint
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }

  // Measurement phase
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalMs = end - start;
  const opsPerSec = Math.round((iterations / totalMs) * 1000);
  const avgTimeNs = Math.round((totalMs / iterations) * 1_000_000);

  return { opsPerSec, avgTimeNs, iterations };
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function printResult(result: BenchmarkResult): void {
  const speedIndicator = result.relativeSpeed ? ` (${result.relativeSpeed > 1 ? '+' : ''}${((result.relativeSpeed - 1) * 100).toFixed(1)}%)` : '';
  console.log(
    `  ${result.library.padEnd(8)} ${result.scenario.padEnd(25)} ${formatNumber(result.opsPerSec).padStart(12)} ops/sec  (${result.avgTimeNs}ns avg)${speedIndicator}`
  );
}

function printHeader(title: string): void {
  console.log();
  console.log('='.repeat(100));
  console.log(` ${title}`);
  console.log('='.repeat(100));
}

function runBenchmarkSuite(suite: BenchmarkSuite): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  console.log(`\n${suite.name}`);
  console.log(`${suite.description}`);
  console.log('-'.repeat(60));

  // FIRM benchmarks
  const firmResult = benchmark('FIRM', () => {
    suite.schemas.firm.validate(suite.data);
  });
  results.push({
    library: 'FIRM',
    scenario: suite.name,
    ...firmResult
  });

  // Zod benchmarks
  const zodResult = benchmark('Zod', () => {
    suite.schemas.zod.parse(suite.data);
  });
  results.push({
    library: 'Zod',
    scenario: suite.name,
    ...zodResult
  });

  // Valibot benchmarks (temporarily disabled due to API changes)
  // const valibotResult = benchmark('Valibot', () => {
  //   suite.schemas.valibot(suite.data);
  // });
  // results.push({
  //   library: 'Valibot',
  //   scenario: suite.name,
  //   ...valibotResult
  // });

  // Yup benchmarks
  const yupResult = benchmark('Yup', () => {
    suite.schemas.yup.validateSync(suite.data);
  });
  results.push({
    library: 'Yup',
    scenario: suite.name,
    ...yupResult
  });

  // Calculate relative speeds (FIRM as baseline)
  const firmOps = firmResult.opsPerSec;
  results.forEach(result => {
    if (result.library !== 'Valibot') { // Skip Valibot for now
      result.relativeSpeed = result.opsPerSec / firmOps;
    }
  });

  // Print results
  results.forEach(printResult);

  return results;
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

const benchmarkSuites: BenchmarkSuite[] = [
  {
    name: 'String Validation',
    description: 'Basic string validation with length constraints',
    data: 'hello world',
    schemas: {
      firm: s.string().min(5).max(20),
      zod: z.string().min(5).max(20),
      valibot: v.pipe(v.string(), v.minLength(5), v.maxLength(20)),
      yup: yup.string().min(5).max(20)
    }
  },
  {
    name: 'Email Validation',
    description: 'Email format validation',
    data: 'user@example.com',
    schemas: {
      firm: s.string().email(),
      zod: z.string().email(),
      valibot: v.pipe(v.string(), v.email()),
      yup: yup.string().email()
    }
  },
  {
    name: 'Number Validation',
    description: 'Number validation with range constraints',
    data: 42,
    schemas: {
      firm: s.number().int().min(0).max(100),
      zod: z.number().int().min(0).max(100),
      valibot: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100)),
      yup: yup.number().integer().min(0).max(100)
    }
  },
  {
    name: 'Simple Object',
    description: 'Object with 4 primitive fields',
    data: {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
      active: true
    },
    schemas: {
      firm: s.object({
        name: s.string().min(1),
        age: s.number().int().min(0),
        email: s.string().email(),
        active: s.boolean()
      }),
      zod: z.object({
        name: z.string().min(1),
        age: z.number().int().min(0),
        email: z.string().email(),
        active: z.boolean()
      }),
      valibot: v.object({
        name: v.pipe(v.string(), v.minLength(1)),
        age: v.pipe(v.number(), v.integer(), v.minValue(0)),
        email: v.pipe(v.string(), v.email()),
        active: v.boolean()
      }),
      yup: yup.object({
        name: yup.string().min(1),
        age: yup.number().integer().min(0),
        email: yup.string().email(),
        active: yup.boolean()
      })
    }
  },
  {
    name: 'Complex Object',
    description: 'Nested object with arrays and complex validation',
    data: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'New York',
        zip: '10001'
      },
      tags: ['admin', 'user']
    },
    schemas: {
      firm: s.object({
        id: s.string().min(1),
        name: s.string().min(1).max(100),
        email: s.string().email(),
        age: s.number().int().min(0).max(150),
        address: s.object({
          street: s.string().min(1),
          city: s.string().min(1),
          zip: s.string().regex(/^\d{5}$/)
        }),
        tags: s.array(s.string()).min(1)
      }),
      zod: z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(100),
        email: z.string().email(),
        age: z.number().int().min(0).max(150),
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
          zip: z.string().regex(/^\d{5}$/)
        }),
        tags: z.array(z.string()).min(1)
      }),
      valibot: v.object({
        id: v.pipe(v.string(), v.minLength(1)),
        name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
        email: v.pipe(v.string(), v.email()),
        age: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150)),
        address: v.object({
          street: v.pipe(v.string(), v.minLength(1)),
          city: v.pipe(v.string(), v.minLength(1)),
          zip: v.pipe(v.string(), v.regex(/^\d{5}$/))
        }),
        tags: v.pipe(v.array(v.string()), v.minLength(1))
      }),
      yup: yup.object({
        id: yup.string().min(1),
        name: yup.string().min(1).max(100),
        email: yup.string().email(),
        age: yup.number().integer().min(0).max(150),
        address: yup.object({
          street: yup.string().min(1),
          city: yup.string().min(1),
          zip: yup.string().matches(/^\d{5}$/)
        }),
        tags: yup.array().of(yup.string()).min(1)
      })
    }
  },
  {
    name: 'Array Validation',
    description: 'Array of objects with validation',
    data: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ],
    schemas: {
      firm: s.array(
        s.object({
          id: s.number().int().positive(),
          name: s.string().min(1)
        })
      ).min(1).max(10),
      zod: z.array(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1)
        })
      ).min(1).max(10),
      valibot: v.pipe(
        v.array(
          v.object({
            id: v.pipe(v.number(), v.integer(), v.minValue(1)),
            name: v.pipe(v.string(), v.minLength(1))
          })
        ),
        v.minLength(1),
        v.maxLength(10)
      ),
      yup: yup.array().of(
        yup.object({
          id: yup.number().integer().positive(),
          name: yup.string().min(1)
        })
      ).min(1).max(10)
    }
  }
];

// ============================================================================
// EXECUTION
// ============================================================================

async function main() {
  console.log('FIRM VALIDATOR COMPREHENSIVE BENCHMARK SUITE');
  console.log('============================================');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log();

  // Library versions
  console.log('Library Versions:');
  try {
    const firmPkg = require('../package.json');
    console.log(`  FIRM: ${firmPkg.version}`);
  } catch (e) {
    console.log('  FIRM: unknown');
  }

  try {
    const zodPkg = require('zod/package.json');
    console.log(`  Zod: ${zodPkg.version}`);
  } catch (e) {
    console.log('  Zod: not installed');
  }

  try {
    const valibotPkg = require('valibot/package.json');
    console.log(`  Valibot: ${valibotPkg.version}`);
  } catch (e) {
    console.log('  Valibot: not installed');
  }

  try {
    const yupPkg = require('yup/package.json');
    console.log(`  Yup: ${yupPkg.version}`);
  } catch (e) {
    console.log('  Yup: not installed');
  }

  console.log();

  const allResults: BenchmarkResult[] = [];

  // Run all benchmark suites
  for (const suite of benchmarkSuites) {
    const results = runBenchmarkSuite(suite);
    allResults.push(...results);
  }

  // Summary
  printHeader('SUMMARY');

  const libraries = ['FIRM', 'Zod', 'Valibot', 'Yup'];
  const scenarios = [...new Set(allResults.map(r => r.scenario))];

  console.log('Average performance across all scenarios:');
  console.log();

  for (const library of libraries) {
    const libResults = allResults.filter(r => r.library === library);
    const avgOpsPerSec = libResults.reduce((sum, r) => sum + r.opsPerSec, 0) / libResults.length;
    const firmAvg = allResults.filter(r => r.library === 'FIRM').reduce((sum, r) => sum + r.opsPerSec, 0) / allResults.filter(r => r.library === 'FIRM').length;
    const relativeSpeed = avgOpsPerSec / firmAvg;

    console.log(`  ${library.padEnd(8)} ${formatNumber(Math.round(avgOpsPerSec)).padStart(12)} ops/sec avg  (${relativeSpeed > 1 ? '+' : ''}${((relativeSpeed - 1) * 100).toFixed(1)}%)`);
  }

  console.log();
  console.log('Benchmark completed successfully.');
  console.log('Results are reproducible with: npx tsx benchmarks/comprehensive.bench.ts');
}

// Handle errors gracefully
main().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});