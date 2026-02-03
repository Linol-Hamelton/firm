module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Basic rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'benchmarks/',
    'examples/',
    '*.js',
    '*.d.ts',
  ],
};