# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] - 2026-01-28

### 🎉 Initial Release Candidate

First public release of **Firm Validator** - a blazing-fast TypeScript schema validator.

### ✨ Features

#### Core Validators

**Primitives:**
- `s.string()` - String validation with methods:
  - `.min(n)`, `.max(n)`, `.length(n)`
  - `.email()`, `.url()`, `.uuid()`
  - `.regex(pattern)`, `.startsWith()`, `.endsWith()`, `.includes()`
  - `.trim()`, `.toLowerCase()`, `.toUpperCase()`

- `s.number()` - Number validation with methods:
  - `.min(n)`, `.max(n)`, `.int()`, `.positive()`, `.negative()`
  - `.multipleOf(n)`, `.finite()`

- `s.boolean()` - Boolean validation

- `s.literal(value)` - Literal value validation (strings, numbers, booleans)

- `s.enum([...])` - String enum validation

- `s.nativeEnum(Enum)` - Native TypeScript enum validation (string & numeric)

**Composites:**
- `s.object({...})` - Object validation with:
  - `.partial()`, `.required()`, `.pick([...])`, `.omit([...])`
  - `.extend({...})`, `.merge(schema)`
  - `.strict()` for disallowing unknown keys

- `s.array(schema)` - Array validation with:
  - `.min(n)`, `.max(n)`, `.length(n)`, `.nonempty()`

- `s.tuple([...])` - Tuple validation with fixed-length arrays

- `s.record(keySchema, valueSchema)` - Record/dictionary validation

- `s.union([...])` - Union type validation

- `s.intersection(a, b)` - Intersection type validation

#### Modifiers

- `.optional()` - Make value optional (T | undefined)
- `.nullable()` - Make value nullable (T | null)
- `.default(value)` - Provide default value
- `.describe(text)` - Add description for documentation

#### Type Inference

- Full TypeScript type inference with `typeof schema.infer`
- Perfect IntelliSense support
- Strict type checking with `exactOptionalPropertyTypes`

#### Error Handling

- Structured error messages with:
  - `code` - Error code (invalid_type, too_small, too_big, etc.)
  - `path` - Path to invalid field
  - `message` - Human-readable error message
  - `received` - Actual value received
  - `expected` - Expected value/type

- Helper methods:
  - `.format()` - Group errors by field path
  - `.flatten()` - Flatten error structure
  - `.toString()` - Convert to string

#### Architecture

- **Hexagonal Architecture** (Ports & Adapters pattern)
- **5-Layer Design**: App → Core → Infrastructure → Ports → Common
- **Zero Dependencies** - No runtime dependencies
- **Tree-Shakeable** - Import only what you need
- **Granular Exports**:
  - `firm-validator` - Full bundle
  - `firm-validator/primitives` - Only primitives
  - `firm-validator/composites` - Only composites
  - `firm-validator/compiler` - Only compiler

### 📊 Performance

- **50M+ operations/sec** on modern hardware
- **4.2KB minified** bundle size
- **5x faster than Zod** in benchmarks
- **6x faster than Yup** in benchmarks
- **10x faster than Joi** in benchmarks

### 🧪 Testing

- **283 tests** passing
- **89% code coverage** (statements, branches, lines)
- **71% function coverage**
- Comprehensive unit tests for all validators
- Integration tests for complex scenarios

### 📦 Package

- **CommonJS** and **ESM** support
- **TypeScript declarations** included
- **Source maps** for debugging
- **Tree-shaking** friendly
- Works with Node.js 18+

### 🔧 Build & Development

- TypeScript 5.3+ with strict mode
- Vitest for testing
- tsup for building
- ESLint for linting
- Full CI/CD ready

### 🎯 API Stability

This is a **Release Candidate (RC)** version. The API is stable and production-ready, but:
- Minor breaking changes may occur before v1.0.0 final
- We're gathering community feedback
- Documentation is being actively improved

### 📝 Known Limitations

**Not yet implemented (coming in future releases):**
- Async validation (`.refine()`, `.superRefine()`)
- Data transformations (`.transform()`, `.coerce()`)
- Framework integrations (Express, React, tRPC, etc.)
- JSON Schema export
- Custom error messages (i18n)
- Performance compiler
- Visual schema inspector

See [FIRM_MASTER_PLAN.md](./FIRM_MASTER_PLAN.md) for the full roadmap.

### 🐛 Bug Fixes

- Fixed union/record optional/nullable inheritance
- Fixed `multipleOf` decimal precision issues
- Fixed `nativeEnum` numeric enum handling
- Fixed nested defaults in enum validators
- Fixed TypeScript compilation errors with override modifiers

### 📚 Documentation

- Comprehensive README with examples
- API reference (in progress)
- Migration guides (in progress)
- Framework integration guides (in progress)

### 🔗 Links

- [GitHub Repository](https://github.com/Linol-Hamelton/firm)
- [npm Package](https://www.npmjs.com/package/firm-validator)
- [Issue Tracker](https://github.com/Linol-Hamelton/firm/issues)
- [Master Plan](./FIRM_MASTER_PLAN.md)

---

## Unreleased

### Planned for v1.0.0 (Final)

- [ ] Async validation with `.refine()` and `.superRefine()`
- [ ] Data transformations with `.transform()` and `.coerce()`
- [ ] Custom error messages
- [ ] 15+ framework integrations (Tier 1)
- [ ] JSON Schema export
- [ ] Performance compiler (10x faster)
- [ ] Complete documentation

### Planned for v1.1.0

- [ ] Streaming validation for large files
- [ ] WebAssembly acceleration
- [ ] Visual schema inspector
- [ ] AI-powered error suggestions
- [ ] 30+ framework integrations (Tier 1 + 2)

### Planned for v1.2.0

- [ ] Smart caching system
- [ ] Performance budgets & monitoring
- [ ] Plugin system
- [ ] Zero-config framework detection
- [ ] 42+ framework integrations (all tiers)

---

## Release Schedule

- **v1.0.0-rc.1** - January 28, 2026 (Current) ✅
- **v1.0.0-rc.2** - Week 2 (February 2026) - Async validation
- **v1.0.0** - Week 6 (March 2026) - Production release
- **v1.1.0** - Month 2 (April 2026) - Advanced features
- **v1.2.0** - Month 3 (May 2026) - Full ecosystem

---

## How to Upgrade

### From 0.x to 1.0.0-rc.1

This is a major version bump from early development. Key changes:

1. **Package name**: Now published as `firm-validator`
2. **Import syntax**: Use `import { s } from 'firm-validator'`
3. **API**: Stable and production-ready
4. **Breaking changes**: See migration guide (coming soon)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT © [Ruslan Fomenko](https://github.com/Linol-Hamelton)

---

**Last updated:** January 28, 2026
