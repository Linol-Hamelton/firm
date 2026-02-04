/**
 * Benchmark utilities for consistent testing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BenchmarkResult {
  name: string;
  library: string;
  opsPerSecond: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  stdDev: number;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  results: BenchmarkResult[];
}

/**
 * Run a benchmark for a given function
 */
export async function benchmark(
  name: string,
  library: string,
  fn: () => void,
  options: {
    warmupIterations?: number;
    iterations?: number;
    minTime?: number; // Minimum time to run in milliseconds
  } = {}
): Promise<BenchmarkResult> {
  const {
    warmupIterations = 1000,
    iterations = 10000,
    minTime = 1000,
  } = options;

  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  // Benchmark phase
  const times: number[] = [];
  const startTime = performance.now();
  let iterationCount = 0;

  while (iterationCount < iterations && performance.now() - startTime < minTime) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
    iterationCount++;
  }

  const totalTime = performance.now() - startTime;

  // Calculate statistics
  const avgTimeMs = times.reduce((a, b) => a + b, 0) / times.length;
  let minTimeMs = Infinity;
  let maxTimeMs = -Infinity;
  for (const time of times) {
    if (time < minTimeMs) minTimeMs = time;
    if (time > maxTimeMs) maxTimeMs = time;
  }

  // Calculate standard deviation
  const squaredDiffs = times.map((t) => Math.pow(t - avgTimeMs, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
  const stdDev = Math.sqrt(variance);

  const opsPerSecond = (iterationCount / totalTime) * 1000;

  return {
    name,
    library,
    opsPerSecond,
    avgTimeMs,
    minTimeMs,
    maxTimeMs,
    stdDev,
  };
}

/**
 * Format benchmark results as a table
 */
export function formatResults(results: BenchmarkResult[]): string {
  if (results.length === 0) return 'No results';

  // Sort by ops/sec descending
  const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);

  const fastest = sorted[0];
  const headers = ['Library', 'Ops/sec', 'Avg (ms)', 'vs Fastest'];
  const rows = sorted.map((result) => {
    const speedup = result.opsPerSecond / fastest.opsPerSecond;
    const vsText =
      result.library === fastest.library
        ? 'fastest'
        : `${(speedup * 100).toFixed(1)}%`;

    return [
      result.library,
      result.opsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      result.avgTimeMs.toFixed(4),
      vsText,
    ];
  });

  // Calculate column widths
  const widths = headers.map((header, i) => {
    const maxContentWidth = Math.max(
      header.length,
      ...rows.map((row) => row[i].length)
    );
    return maxContentWidth + 2;
  });

  // Format table
  const formatRow = (cells: string[]) =>
    '│ ' +
    cells.map((cell, i) => cell.padEnd(widths[i])).join('│ ') +
    '│';

  const separator =
    '├' + widths.map((w) => '─'.repeat(w + 1)).join('┼') + '┤';
  const topBorder =
    '┌' + widths.map((w) => '─'.repeat(w + 1)).join('┬') + '┐';
  const bottomBorder =
    '└' + widths.map((w) => '─'.repeat(w + 1)).join('┴') + '┘';

  const lines = [
    topBorder,
    formatRow(headers),
    separator,
    ...rows.map(formatRow),
    bottomBorder,
  ];

  return lines.join('\n');
}

/**
 * Compare benchmark results and show speedup
 */
export function compareResults(
  baselineLibrary: string,
  results: BenchmarkResult[]
): string {
  const baseline = results.find((r) => r.library === baselineLibrary);
  if (!baseline) {
    throw new Error(`Baseline library "${baselineLibrary}" not found`);
  }

  const lines: string[] = [];
  lines.push(`\nComparison (baseline: ${baselineLibrary}):`);
  lines.push('─'.repeat(50));

  for (const result of results) {
    if (result.library === baselineLibrary) continue;

    const speedup = result.opsPerSecond / baseline.opsPerSecond;
    const emoji = speedup > 1 ? '🚀' : '🐌';
    const sign = speedup > 1 ? '+' : '';

    lines.push(
      `${emoji} ${result.library.padEnd(12)} ${sign}${((speedup - 1) * 100).toFixed(1)}% (${speedup.toFixed(2)}x)`
    );
  }

  return lines.join('\n');
}

/**
 * Run a complete benchmark suite
 */
export async function runSuite(
  suite: {
    name: string;
    description: string;
    tests: Array<{
      name: string;
      library: string;
      fn: () => void;
    }>;
  },
  options?: {
    warmupIterations?: number;
    iterations?: number;
    minTime?: number;
  }
): Promise<BenchmarkSuite> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log('='.repeat(60));

  const results: BenchmarkResult[] = [];

  for (const test of suite.tests) {
    process.stdout.write(`\n⏱️  Running ${test.library}... `);
    const result = await benchmark(test.name, test.library, test.fn, options);
    results.push(result);
    console.log(`${result.opsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 })} ops/sec`);
  }

  console.log('\n' + formatResults(results));

  // Find FIRM result and compare with Zod if both exist
  const firmResult = results.find((r) => r.library === 'FIRM');
  const zodResult = results.find((r) => r.library === 'Zod');

  if (firmResult && zodResult) {
    console.log(compareResults('Zod', results));
  }

  return {
    name: suite.name,
    description: suite.description,
    results,
  };
}

/**
 * Save results to JSON file
 */
export function saveResults(
  filename: string,
  suites: BenchmarkSuite[]
): void {
  const data = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    suites,
  };

  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  const filepath = path.join(resultsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`\n✅ Results saved to: ${filepath}`);
}
