/**
 * Generate comprehensive benchmark report
 *
 * Reads all benchmark results and generates markdown reports.
 */

import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  name: string;
  library: string;
  opsPerSecond: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  stdDev: number;
}

interface BenchmarkSuite {
  name: string;
  description: string;
  results: BenchmarkResult[];
}

interface BenchmarkData {
  timestamp: string;
  environment: {
    node: string;
    platform: string;
    arch: string;
  };
  suites: BenchmarkSuite[];
}

function loadResults(filename: string): BenchmarkData | null {
  const filepath = path.join(__dirname, 'results', filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function generateMarkdownTable(results: BenchmarkResult[]): string {
  const sorted = [...results].sort((a, b) => b.opsPerSecond - a.opsPerSecond);
  const fastest = sorted[0];

  const headers = ['Library', 'Ops/sec', 'Avg (ms)', 'Relative'];
  const rows = sorted.map((result) => {
    const speedup = result.opsPerSecond / fastest.opsPerSecond;
    const relative =
      result.library === fastest.library
        ? '**fastest**'
        : `${(speedup * 100).toFixed(1)}%`;

    return [
      result.library,
      result.opsPerSecond.toLocaleString('en-US', { maximumFractionDigits: 0 }),
      result.avgTimeMs.toFixed(4),
      relative,
    ];
  });

  const lines = [
    '| ' + headers.join(' | ') + ' |',
    '| ' + headers.map(() => '---').join(' | ') + ' |',
    ...rows.map((row) => '| ' + row.join(' | ') + ' |'),
  ];

  return lines.join('\n');
}

function generateSpeedupSummary(allResults: BenchmarkResult[]): string {
  const firmResults = allResults.filter((r) => r.library === 'FIRM');
  const zodResults = allResults.filter((r) => r.library === 'Zod');

  if (firmResults.length === 0 || zodResults.length === 0) {
    return '';
  }

  const speedups = firmResults.map((firm, i) => {
    const zod = zodResults[i];
    if (!zod) return null;
    return firm.opsPerSecond / zod.opsPerSecond;
  }).filter(Boolean) as number[];

  const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;
  const minSpeedup = Math.min(...speedups);
  const maxSpeedup = Math.max(...speedups);

  return `
**FIRM vs Zod Performance Summary:**
- Average: **${avgSpeedup.toFixed(2)}x faster**
- Range: ${minSpeedup.toFixed(2)}x - ${maxSpeedup.toFixed(2)}x faster
`;
}

function generateReport(): string {
  const files = [
    'simple-objects.json',
    'complex-objects.json',
    'arrays.json',
    'strings.json',
    'coercion.json',
  ];

  let markdown = `# FIRM Validator - Benchmark Results\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;

  const allResults: BenchmarkResult[] = [];

  for (const file of files) {
    const data = loadResults(file);
    if (!data) {
      console.warn(`⚠️  Results file not found: ${file}`);
      continue;
    }

    markdown += `## ${path.basename(file, '.json')}\n\n`;
    markdown += `**Environment:**\n`;
    markdown += `- Node.js: ${data.environment.node}\n`;
    markdown += `- Platform: ${data.environment.platform}\n`;
    markdown += `- Architecture: ${data.environment.arch}\n\n`;

    for (const suite of data.suites) {
      markdown += `### ${suite.name}\n\n`;
      markdown += `${suite.description}\n\n`;
      markdown += generateMarkdownTable(suite.results);
      markdown += `\n\n`;

      allResults.push(...suite.results);
    }
  }

  // Add summary
  markdown += `## Overall Summary\n\n`;
  markdown += generateSpeedupSummary(allResults);

  return markdown;
}

function main() {
  console.log('📊 Generating benchmark report...\n');

  const report = generateReport();
  const reportPath = path.join(__dirname, 'results', 'BENCHMARK_REPORT.md');

  fs.writeFileSync(reportPath, report);

  console.log(`✅ Report generated: ${reportPath}\n`);
  console.log('Preview:\n');
  console.log('='.repeat(70));
  console.log(report.substring(0, 1000) + '...');
  console.log('='.repeat(70));
}

main();
