# Firm Validator Documentation

Welcome to the **Firm Validator** documentation! This guide will help you get started and master schema validation in TypeScript.

---

## 📚 Table of Contents

### Getting Started
- [Introduction](./getting-started/introduction.md) - What is Firm and why use it?
- [Installation](./getting-started/installation.md) - How to install Firm
- [Quick Start](./getting-started/quick-start.md) - 5-minute tutorial
- [First Schema](./getting-started/first-schema.md) - Create your first validation schema

### Core Concepts
- [Schemas](./core-concepts/schemas.md) - Understanding schema definitions
- [Validation](./core-concepts/validation.md) - How validation works
- [Type Inference](./core-concepts/type-inference.md) - TypeScript type inference
- [Error Handling](./core-concepts/error-handling.md) - Working with validation errors
- [Async Validation](./core-concepts/async-validation.md) - ⏳ Coming soon

### API Reference
- [Primitives](./api/primitives.md) - String, Number, Boolean, Literal, Enum
- [Composites](./api/composites.md) - Object, Array, Tuple, Union, Record
- [Modifiers](./api/modifiers.md) - Optional, Nullable, Default
- [Validators](./api/validators.md) - Min, Max, Email, URL, Regex
- [Transformations](./api/transformations.md) - ⏳ Coming soon
- [Compiler](./api/compiler.md) - ⏳ Coming soon

### Revolutionary Features
- [Compiled Validators](./revolutionary-features/compiled-validators.md) - ⏳ 10x faster validation
- [Streaming Validation](./revolutionary-features/streaming-validation.md) - ⏳ Validate large files
- [WASM Acceleration](./revolutionary-features/wasm-acceleration.md) - ⏳ Near-native performance
- [AI Error Messages](./revolutionary-features/ai-error-messages.md) - ⏳ Smart error suggestions
- [Visual Inspector](./revolutionary-features/visual-inspector.md) - ⏳ Debug schemas visually
- [Performance Budgets](./revolutionary-features/performance-budgets.md) - ⏳ Monitor validation speed
- [Smart Caching](./revolutionary-features/smart-caching.md) - ⏳ 1000x faster repeated validations
- [Parallel Validation](./revolutionary-features/parallel-validation.md) - ⏳ Async validators in parallel
- [Auto-Fix Mode](./revolutionary-features/auto-fix.md) - ⏳ Automatically fix common errors
- [Zero-Config Detection](./revolutionary-features/zero-config.md) - ⏳ Auto-detect frameworks

### Framework Integrations

**Backend:**
- [Express](./integrations/backend/express.md) - ⏳ Middleware integration
- [Fastify](./integrations/backend/fastify.md) - ⏳ Plugin integration
- [Hono](./integrations/backend/hono.md) - ⏳ Edge runtime validation
- [Next.js API Routes](./integrations/backend/nextjs.md) - ⏳ API validation
- [NestJS](./integrations/backend/nestjs.md) - ⏳ Decorator-based validation
- [Koa](./integrations/backend/koa.md) - ⏳ Middleware support

**Frontend:**
- [React Hook Form](./integrations/frontend/react-hook-form.md) - ⏳ Form validation
- [Vue](./integrations/frontend/vue.md) - ⏳ Composable integration
- [Svelte](./integrations/frontend/svelte.md) - ⏳ Store integration
- [Solid.js](./integrations/frontend/solid.md) - ⏳ Reactive validation
- [Next.js](./integrations/frontend/nextjs.md) - ⏳ Client/server validation

**API & ORM:**
- [tRPC](./integrations/api/trpc.md) - ⏳ Type-safe RPC
- [GraphQL](./integrations/api/graphql.md) - ⏳ Resolver validation
- [OpenAPI](./integrations/api/openapi.md) - ⏳ Schema generation
- [Prisma](./integrations/orm/prisma.md) - ⏳ Database validation
- [TypeORM](./integrations/orm/typeorm.md) - ⏳ Entity validation
- [Drizzle](./integrations/orm/drizzle.md) - ⏳ SQL validation

[See all 42+ integrations →](./integrations/)

### Guides
- [Migration from Zod](./guides/from-zod.md) - ⏳ Switch from Zod to Firm
- [Migration from Yup](./guides/from-yup.md) - ⏳ Switch from Yup to Firm
- [Migration from Joi](./guides/from-joi.md) - ⏳ Switch from Joi to Firm
- [Custom Validators](./guides/custom-validators.md) - ⏳ Create custom validation logic
- [Error Messages](./guides/error-messages.md) - ⏳ Customize error messages
- [Performance Optimization](./guides/performance-optimization.md) - ⏳ Optimize validation speed
- [TypeScript Tips](./guides/typescript-patterns.md) - ⏳ Advanced TypeScript patterns
- [Comparison](./guides/comparison.md) - ⏳ Firm vs Zod vs Yup vs Joi

### Examples
- [Express REST API](./examples/express-rest-api.md) - ⏳ Full REST API example
- [Next.js App](./examples/nextjs-app.md) - ⏳ Full-stack Next.js app
- [React Form](./examples/react-form.md) - ⏳ Form validation with React
- [tRPC + Prisma](./examples/trpc-prisma.md) - ⏳ Type-safe API with database
- [GraphQL API](./examples/graphql-api.md) - ⏳ GraphQL schema validation

### Benchmarks
- [Methodology](./benchmarks/methodology.md) - ⏳ How we benchmark
- [vs Zod](./benchmarks/vs-zod.md) - ⏳ Performance comparison
- [vs Yup](./benchmarks/vs-yup.md) - ⏳ Performance comparison
- [vs Joi](./benchmarks/vs-joi.md) - ⏳ Performance comparison
- [Bundle Size](./benchmarks/bundle-size.md) - ⏳ Size comparison

### Contributing
- [Contributing Guide](./contributing/README.md) - ⏳ How to contribute
- [Code of Conduct](./contributing/code-of-conduct.md) - ⏳ Community guidelines
- [Development Guide](./contributing/development-guide.md) - ⏳ Local development setup
- [Architecture](./contributing/architecture.md) - ⏳ Project architecture

---

## 🚀 Quick Links

### I want to...

**Get Started:**
- [Install Firm](./getting-started/installation.md)
- [Learn the basics in 5 minutes](./getting-started/quick-start.md)
- [See code examples](./examples/)

**Migrate from another validator:**
- [From Zod](./guides/from-zod.md)
- [From Yup](./guides/from-yup.md)
- [From Joi](./guides/from-joi.md)

**Integrate with my framework:**
- [Express](./integrations/backend/express.md)
- [React](./integrations/frontend/react-hook-form.md)
- [Next.js](./integrations/backend/nextjs.md)
- [tRPC](./integrations/api/trpc.md)
- [Prisma](./integrations/orm/prisma.md)

**Learn advanced features:**
- [Type inference](./core-concepts/type-inference.md)
- [Error handling](./core-concepts/error-handling.md)
- [Custom validators](./guides/custom-validators.md)
- [Performance optimization](./guides/performance-optimization.md)

**Compare Firm with others:**
- [Detailed comparison](./guides/comparison.md)
- [Performance benchmarks](./benchmarks/)

---

## 📖 Reading Guide

### For Beginners

If you're new to schema validation:
1. Read [Introduction](./getting-started/introduction.md) (10 min)
2. Follow [Quick Start](./getting-started/quick-start.md) (5 min)
3. Try [Examples](./examples/) (15 min)
4. Read [Core Concepts](./core-concepts/) (30 min)

**Total: 1 hour to get productive with Firm**

### For Experienced Developers

If you're familiar with Zod/Yup/Joi:
1. Read [Quick Start](./getting-started/quick-start.md) (5 min)
2. Check [API Reference](./api/) (15 min)
3. Review [Migration Guide](./guides/) for your current validator (10 min)
4. Explore [Revolutionary Features](./revolutionary-features/) (20 min)

**Total: 50 minutes to master Firm**

### For Framework Users

If you want to integrate Firm with your framework:
1. Read [Quick Start](./getting-started/quick-start.md) (5 min)
2. Find your framework in [Integrations](./integrations/) (10 min)
3. Follow the integration guide (15 min)
4. Check [Examples](./examples/) for your framework (10 min)

**Total: 40 minutes to integrate Firm**

---

## 🔍 Search Tips

Use your browser's search (Ctrl+F / Cmd+F) to quickly find:
- Specific validators: `s.string()`, `s.number()`, etc.
- Methods: `.min()`, `.max()`, `.email()`, etc.
- Concepts: "type inference", "error handling", etc.
- Frameworks: "Express", "React", "Next.js", etc.

---

## 💡 Getting Help

- **Documentation**: You're here! Browse the sections above
- **GitHub Issues**: [Report bugs or request features](https://github.com/Linol-Hamelton/firm/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/Linol-Hamelton/firm/discussions)
- **Examples**: Check the [examples directory](../examples/) for working code

---

## 📝 Documentation Status

**Legend:**
- ✅ Complete and reviewed
- 📝 Draft (in progress)
- ⏳ Planned (not yet written)

**Current Status (v1.0.0-rc.1):**
- Getting Started: 25% complete
- Core Concepts: 25% complete
- API Reference: 50% complete
- Revolutionary Features: 0% (coming soon)
- Integrations: 0% (coming soon)
- Guides: 0% (coming soon)
- Examples: 0% (coming soon)
- Benchmarks: 0% (coming soon)

We're actively working on completing the documentation. Contributions welcome!

---

## 🤝 Contributing to Docs

Found a typo? Want to improve an explanation? We welcome documentation contributions!

See [Contributing Guide](./contributing/README.md) for details.

---

**Last updated:** January 28, 2026
**Version:** 1.0.0-rc.1
