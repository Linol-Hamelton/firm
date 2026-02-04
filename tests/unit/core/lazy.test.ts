/**
 * Tests for lazy validator (recursive schemas)
 */

import { s } from '../../../src/index.js';
import { lazy, recursive } from '../../../src/core/validators/composites/lazy.js';

// ============================================================================
// BASIC LAZY SCHEMA TESTS
// ============================================================================

describe('LazyValidator', () => {
  it('should validate recursive tree structure', () => {
    interface TreeNode {
      value: number;
      children?: TreeNode[];
    }

    const treeSchema: any = s.lazy(() =>
      s.object({
        value: s.number(),
        children: s.array(treeSchema).optional(),
      })
    );

    const tree = {
      value: 1,
      children: [
        { value: 2, children: [] },
        { value: 3, children: [{ value: 4 }] },
      ],
    };

    const result = treeSchema.validate(tree);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.value).toBe(1);
      expect(result.data.children).toHaveLength(2);
    }
  });

  it('should fail validation on invalid recursive structure', () => {
    interface TreeNode {
      value: number;
      children?: TreeNode[];
    }

    const treeSchema: any = s.lazy(() =>
      s.object({
        value: s.number(),
        children: s.array(treeSchema).optional(),
      })
    );

    const invalidTree = {
      value: 1,
      children: [
        { value: 'not a number' }, // Invalid
      ],
    };

    const result = treeSchema.validate(invalidTree);
    expect(result.ok).toBe(false);
  });

  it('should cache the inner schema after first access', () => {
    let callCount = 0;
    const schema = s.lazy(() => {
      callCount++;
      return s.string();
    });

    schema.validate('test1');
    schema.validate('test2');
    schema.validate('test3');

    // Getter should only be called once due to caching
    expect(callCount).toBe(1);
  });

  it('should work with linked list structure', () => {
    interface ListNode {
      value: number;
      next?: ListNode;
    }

    const listSchema: any = s.lazy(() =>
      s.object({
        value: s.number(),
        next: listSchema.optional(),
      })
    );

    const list = {
      value: 1,
      next: {
        value: 2,
        next: {
          value: 3,
        },
      },
    };

    const result = listSchema.validate(list);
    expect(result.ok).toBe(true);
  });

  it('should work with deeply nested structures', () => {
    const schema: any = s.lazy(() =>
      s.object({
        name: s.string(),
        nested: schema.optional(),
      })
    );

    const deeply = {
      name: 'level1',
      nested: {
        name: 'level2',
        nested: {
          name: 'level3',
          nested: {
            name: 'level4',
          },
        },
      },
    };

    const result = schema.validate(deeply);
    expect(result.ok).toBe(true);
  });
});

// ============================================================================
// LAZY SCHEMA METHODS TESTS
// ============================================================================

describe('LazyValidator methods', () => {
  it('should support is() type guard through _check', () => {
    const schema = s.lazy(() => s.string().min(3));

    expect(schema.is('hello')).toBe(true);
    expect(schema.is('ab')).toBe(false);
    expect(schema.is(123)).toBe(false);
  });

  it('should support getSchema() to access inner schema', () => {
    const innerSchema = s.object({ name: s.string(), age: s.number() });
    const schema = s.lazy(() => innerSchema);

    const retrievedSchema = schema.getSchema();
    expect(retrievedSchema).toBe(innerSchema);
  });

  it('should clone correctly with config', () => {
    const getter = () => s.string();
    const schema = s.lazy(getter);

    const cloned = (schema as any)._clone({});

    // Clone should preserve validation behavior
    expect(cloned.validate('hello').ok).toBe(true);
    expect(cloned.validate(123).ok).toBe(false);
  });

  it('should preserve getter in clone', () => {
    let callCount = 0;
    const getter = () => {
      callCount++;
      return s.string();
    };
    const schema = s.lazy(getter);

    const cloned = (schema as any)._clone({});

    // Original schema should use cached value
    schema.validate('test1');
    expect(callCount).toBe(1);

    // Clone should create new cache
    cloned.validate('test2');
    expect(callCount).toBe(2);
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('lazy factory function', () => {
  it('should create lazy validator', () => {
    const schema = lazy(() => s.string());

    expect(schema.validate('hello').ok).toBe(true);
    expect(schema.validate(123).ok).toBe(false);
  });

  it('should work with recursive definitions', () => {
    const schema: any = lazy(() =>
      s.object({
        id: s.number(),
        parent: schema.optional(),
      })
    );

    const data = {
      id: 1,
      parent: {
        id: 2,
        parent: {
          id: 3,
        },
      },
    };

    expect(schema.validate(data).ok).toBe(true);
  });
});

// ============================================================================
// RECURSIVE ALIAS TESTS
// ============================================================================

describe('recursive alias function', () => {
  it('should be an alias for lazy', () => {
    const lazySchema = lazy(() => s.string());
    const recursiveSchema = recursive(() => s.string());

    expect(lazySchema.validate('test').ok).toBe(true);
    expect(recursiveSchema.validate('test').ok).toBe(true);

    expect(lazySchema.validate(123).ok).toBe(false);
    expect(recursiveSchema.validate(123).ok).toBe(false);
  });

  it('should work with recursive structures', () => {
    interface Node {
      value: string;
      child?: Node;
    }

    const schema: any = recursive(() =>
      s.object({
        value: s.string(),
        child: schema.optional(),
      })
    );

    const data = {
      value: 'root',
      child: {
        value: 'child',
        child: {
          value: 'grandchild',
        },
      },
    };

    expect(schema.validate(data).ok).toBe(true);
  });

  it('should support all lazy features', () => {
    const schema = recursive(() => s.number().min(0));

    expect(schema.is(5)).toBe(true);
    expect(schema.is(-1)).toBe(false);
    expect(schema.getSchema()).toBeDefined();
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('LazyValidator edge cases', () => {
  it('should handle validation errors in nested structures', () => {
    const schema: any = s.lazy(() =>
      s.object({
        value: s.string().email(),
        next: schema.optional(),
      })
    );

    const data = {
      value: 'valid@email.com',
      next: {
        value: 'invalid-email', // Invalid email
      },
    };

    const result = schema.validate(data);
    expect(result.ok).toBe(false);
  });

  it('should work with optional lazy schemas', () => {
    const schema: any = s.lazy(() => s.string()).optional();

    expect(schema.validate('hello').ok).toBe(true);
    expect(schema.validate(undefined).ok).toBe(true);
    expect(schema.validate(null).ok).toBe(false);
  });

  it('should work with nullable lazy schemas', () => {
    const schema: any = s.lazy(() => s.string()).nullable();

    expect(schema.validate('hello').ok).toBe(true);
    expect(schema.validate(null).ok).toBe(true);
    expect(schema.validate(undefined).ok).toBe(false);
  });

  it('should handle complex recursive unions', () => {
    const schema: any = s.lazy(() =>
      s.union([
        s.string(),
        s.object({
          nested: schema,
        }),
      ])
    );

    expect(schema.validate('leaf').ok).toBe(true);
    expect(schema.validate({ nested: 'leaf' }).ok).toBe(true);
    expect(schema.validate({ nested: { nested: 'leaf' } }).ok).toBe(true);
    expect(schema.validate({ nested: 123 }).ok).toBe(false);
  });
});
