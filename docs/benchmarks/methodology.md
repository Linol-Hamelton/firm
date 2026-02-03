# Benchmark Methodology

## Overview

This document describes the methodology used for benchmarking FIRM Validator against competitors (Zod, Valibot, Yup). All benchmarks are designed to be reproducible, fair, and statistically significant.

## Environment

### Hardware
- **CPU**: Intel Core i7-9750H (6 cores, 12 threads, 2.6 GHz base)
- **RAM**: 16GB DDR4 2666MHz
- **Storage**: NVMe SSD
- **OS**: Windows 11 Pro 64-bit

### Software
- **Node.js**: 20.10.0 LTS
- **TypeScript**: 5.3.0
- **Vitest**: 1.6.1

### Library Versions
- **FIRM**: 1.0.0-rc.1
- **Zod**: 4.3.6
- **Valibot**: 1.2.0
- **Yup**: 1.7.1

## Benchmark Design

### Test Scenarios

1. **String Validation**: Basic string with length constraints
2. **Email Validation**: Email format validation
3. **Number Validation**: Integer with range constraints
4. **Simple Object**: 4-field object with primitives
5. **Complex Object**: Nested object with arrays and regex
6. **Array Validation**: Array of objects

### Test Data

Each scenario uses realistic test data that exercises the validation logic:

```typescript
// String validation
"hello world"

// Email validation
"user@example.com"

// Number validation
42

// Simple object
{
  name: "John Doe",
  age: 30,
  email: "john@example.com",
  active: true
}

// Complex object
{
  id: "user-123",
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  address: {
    street: "123 Main St",
    city: "New York",
    zip: "10001"
  },
  tags: ["admin", "user"]
}
```

## Execution Protocol

### Warmup Phase
- **Iterations**: 1,000
- **Purpose**: JIT compilation and cache warming
- **Data**: Same as measurement phase

### Measurement Phase
- **Iterations**: 100,000 per test
- **Runs**: 3 runs per scenario per library
- **Garbage Collection**: Forced GC between runs (if available)

### Timing
- **Method**: `performance.now()` (high-resolution timer)
- **Units**: Operations per second (ops/sec), nanoseconds per operation
- **Precision**: Microsecond-level timing

## Statistical Analysis

### Metrics Calculated
- **Mean ops/sec**: Average across 3 runs
- **Standard deviation**: Variability measurement
- **Relative performance**: Performance relative to FIRM (baseline = 1.0)

### Outlier Handling
- Remove runs with >2σ deviation from mean
- Minimum 2 valid runs required per test
- Report both mean and range

## Fairness Measures

### Schema Equivalence
All libraries implement equivalent validation logic:

```typescript
// FIRM
s.string().min(5).max(20)

// Zod
z.string().min(5).max(20)

// Valibot
string([minLength(5), maxLength(20)])

// Yup
yup.string().min(5).max(20)
```

### API Consistency
- FIRM: `schema.validate(data)`
- Zod: `schema.parse(data)`
- Valibot: `schema(data)`
- Yup: `schema.validateSync(data)`

### Error Handling
- All libraries use synchronous validation for fair comparison
- Errors are caught and handled consistently
- Invalid data tests use equivalent invalid inputs

## Reproducibility

### Running Benchmarks
```bash
# Install dependencies
npm install

# Run comprehensive benchmarks
npx tsx benchmarks/comprehensive.bench.ts

# Run performance-only benchmarks
npx tsx benchmarks/performance.bench.ts
```

### Environment Consistency
- Same Node.js version across all runs
- Clean npm cache before installation
- No other processes running during benchmarks
- Consistent system load

## Limitations

### Known Limitations
1. **Memory allocation differences**: Libraries may have different GC patterns
2. **Bundle size not measured**: Runtime benchmarks don't include bundle analysis
3. **Browser performance**: Node.js benchmarks may not reflect browser performance
4. **TypeScript compilation**: Type checking overhead not included

### Mitigation Strategies
1. **Multiple runs**: Statistical significance through repetition
2. **Warmup phase**: Consistent JIT compilation
3. **GC hints**: Memory cleanup between runs
4. **Cross-validation**: Manual verification of results

## Results Interpretation

### Performance Categories
- **>50M ops/sec**: Exceptional performance
- **20-50M ops/sec**: Excellent performance
- **10-20M ops/sec**: Good performance
- **5-10M ops/sec**: Acceptable performance
- **<5M ops/sec**: Needs optimization

### Relative Performance
- **>1.5x**: Significantly faster
- **1.2-1.5x**: Moderately faster
- **0.8-1.2x**: Comparable performance
- **<0.8x**: Slower

## Continuous Benchmarking

### CI Integration
```yaml
# .github/workflows/benchmark.yml
- name: Run Benchmarks
  run: npx tsx benchmarks/comprehensive.bench.ts

- name: Performance Regression Check
  run: |
    # Compare against baseline
    # Fail if performance drops >5%
```

### Baseline Updates
- Update baselines quarterly
- Document hardware/environment changes
- Version-specific performance tracking

## Contributing

### Adding New Benchmarks
1. Define realistic test scenario
2. Implement equivalent schemas for all libraries
3. Add test data that exercises validation logic
4. Update this methodology document
5. Run multiple times to establish statistical significance

### Reporting Issues
- Include full environment details
- Provide benchmark output
- Specify exact commands used
- Report Node.js version and library versions

## Changelog

### v1.0 (Current)
- Initial comprehensive benchmark suite
- Comparison with Zod, Valibot, Yup
- Statistical analysis and reproducibility focus
- CI integration guidelines

### Future Improvements
- Browser benchmark suite
- Memory usage tracking
- Bundle size analysis integration
- Automated performance regression detection
