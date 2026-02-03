/**
 * Manual test for cache serialization
 */

import { ValidationCache } from './src/infrastructure/caching/validation-cache.js';
import { CacheSerializer } from './src/infrastructure/caching/cache-manager.js';

// Create a cache and add some entries
const cache = new ValidationCache({ type: 'lru', maxSize: 100 });

// Add some primitive cache entries
cache.set('test1', 'schema1', { ok: true, data: 'value1' } as any);
cache.set('test2', 'schema1', { ok: true, data: 'value2' } as any);
cache.set(123, 'schema2', { ok: false, errors: [{ code: 'error', path: [], message: 'test' }] } as any);

// Get stats
const stats = cache.getStats();
console.log('Before serialization - Stats:', stats);
console.log('Before serialization - Size:', stats.size);

// Serialize
const serializer = new CacheSerializer();
const serialized = serializer.serialize(cache);

console.log('\nSerialized data:');
console.log('Version:', serialized.version);
console.log('Strategy:', serialized.strategy);
console.log('Stats:', serialized.stats);
console.log('Entries count:', serialized.entries.length);
console.log('Entries:', JSON.stringify(serialized.entries, null, 2));

// Deserialize
const restoredCache = serializer.deserialize(serialized);
const restoredStats = restoredCache.getStats();

console.log('\nAfter deserialization - Stats:', restoredStats);
console.log('After deserialization - Size:', restoredStats.size);

// Test that entries were restored
const result1 = restoredCache.get('test1', 'schema1');
const result2 = restoredCache.get('test2', 'schema1');
const result3 = restoredCache.get(123, 'schema2');

console.log('\nRestored entries:');
console.log('Entry 1:', result1);
console.log('Entry 2:', result2);
console.log('Entry 3:', result3);

if (result1 && result2 && result3) {
  console.log('\n✓ Cache serialization works correctly!');
} else {
  console.log('\n✗ Cache serialization failed!');
  process.exit(1);
}
