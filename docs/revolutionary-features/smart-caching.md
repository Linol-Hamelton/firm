# Smart Caching (Revolutionary Feature #8)

FIRM's Smart Caching system dramatically improves performance for repeated validations.

## Performance Benefits

- **10-100x faster** for repeated validations of the same data
- **Zero memory leaks** with WeakMap for objects
- **Automatic cache invalidation** with TTL and LRU strategies
- **Configurable strategies** (LRU, TTL, Size-based)

## Quick Start

```typescript
import { s } from 'firm-validator';
import { withCache } from 'firm-validator/infrastructure/caching';

const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  age: s.number().int(),
});

const cachedSchema = withCache(userSchema);

// First validation - normal speed
cachedSchema.validate(user); // ~100μs

// Second validation of same data - 10-100x faster!
cachedSchema.validate(user); // ~1-10μs
```

## Cache Strategies

### LRU (Least Recently Used)

Keeps most frequently accessed items in cache:

```typescript
import { withCacheConfig } from 'firm-validator/infrastructure/caching';

const cachedSchema = withCacheConfig(userSchema, {
  type: 'lru',
  maxSize: 1000, // Keep 1000 most recent items
});
```

### TTL (Time To Live)

Automatically expires cached items:

```typescript
const cachedSchema = withCacheConfig(userSchema, {
  type: 'ttl',
  ttl: 60000, // Cache for 1 minute
});
```

### Size-based

Limits cache by size:

```typescript
const cachedSchema = withCacheConfig(userSchema, {
  type: 'size',
  maxSize: 500,
});
```

## Global Cache Configuration

Configure caching for all schemas:

```typescript
import { configureGlobalCache } from 'firm-validator/infrastructure/caching';

configureGlobalCache({
  type: 'lru',
  maxSize: 10000,
});
```

## Cache Statistics

Monitor cache performance:

```typescript
import { globalCache } from 'firm-validator/infrastructure/caching';

const stats = globalCache.getStats();
console.log({
  hits: stats.hits,      // Cache hits
  misses: stats.misses,  // Cache misses
  size: stats.size,      // Current cache size
  hitRate: stats.hitRate // Hit rate (0-1)
});
```

## How It Works

### For Primitives

Primitives (strings, numbers, booleans) are cached by value:

```typescript
cachedSchema.validate('test'); // Cached
cachedSchema.validate('test'); // Hit!
```

### For Objects

Objects are cached using WeakMap (no memory leaks):

```typescript
const user = { name: 'John', email: 'john@example.com' };

cachedSchema.validate(user); // Cached
cachedSchema.validate(user); // Hit!

// Different object with same values = cache miss
cachedSchema.validate({ name: 'John', email: 'john@example.com' }); // Miss
```

## Best Practices

1. **Use for hot paths**: Apply caching to frequently validated schemas
2. **Choose right strategy**:
   - LRU for varied data
   - TTL for time-sensitive data
   - Size for memory-constrained environments
3. **Monitor statistics**: Check hit rates to optimize cache configuration
4. **Clear when needed**: Clear cache after schema changes

## Advanced Usage

### Per-Schema Cache

Each schema can have its own cache:

```typescript
import { createCache } from 'firm-validator/infrastructure/caching';

const cache = createCache({ type: 'lru', maxSize: 100 });
const cachedSchema = new CachedSchema(schema, cache);
```

### Clear Cache

```typescript
import { clearSchemaCache } from 'firm-validator/infrastructure/caching';

clearSchemaCache(cachedSchema);
```

## Performance Benchmarks

Complex schema (10 fields, nested objects):
- **Without cache**: ~100μs per validation
- **With cache**: ~1-10μs per validation
- **Speedup**: 10-100x

Simple schema (3 fields):
- **Without cache**: ~10μs per validation
- **With cache**: ~0.1-1μs per validation
- **Speedup**: 10-100x

## See Also

- [Auto-Fix Mode](./auto-fix.md)
- [Compiler](../core-concepts/compiler.md)
- [Performance](../benchmarks/performance.md)
