import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    include: ['tests/**/*.test.ts'],
    benchmark: {
      include: ['tests/benchmarks/**/*.bench.ts'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/ports/**/*.ts',
        'src/common/contracts/**/*.ts',
        'src/common/types/schema.ts',
        'src/compiler.ts',
        'src/composites.ts',
        'src/primitives.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 70,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      // Support .js imports in TypeScript files
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensions: ['.ts', '.js', '.json'],
  },
});
