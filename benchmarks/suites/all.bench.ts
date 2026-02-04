/**
 * Run all benchmark suites
 *
 * This script runs all benchmarks and generates a comprehensive report.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const suites = [
  { name: 'Simple Objects', file: 'simple-objects.bench.ts' },
  { name: 'Complex Objects', file: 'complex-objects.bench.ts' },
  { name: 'Arrays', file: 'arrays.bench.ts' },
  { name: 'Strings', file: 'strings.bench.ts' },
  { name: 'Coercion', file: 'coercion.bench.ts' },
];

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 FIRM VALIDATOR - COMPREHENSIVE BENCHMARK SUITE');
  console.log('='.repeat(70));
  console.log('\nRunning all benchmarks...\n');

  const startTime = Date.now();

  for (const suite of suites) {
    console.log(`\n${'▶'.repeat(3)} Running: ${suite.name}`);
    try {
      const { stdout, stderr } = await execAsync(
        `tsx suites/${suite.file}`,
        { cwd: __dirname + '/..' }
      );
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error(`❌ Error running ${suite.name}:`, error.message);
    }
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(70));
  console.log(`✅ All benchmarks completed in ${totalTime}s`);
  console.log('='.repeat(70));
  console.log('\n📊 Results saved to ./results/');
  console.log('🔄 Run "npm run report" to generate a comprehensive report\n');
}

main().catch(console.error);
