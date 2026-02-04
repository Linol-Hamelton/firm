/**
 * Tests for schema modifiers (refinement, transformation, preprocessing)
 */

import { s } from '../../../src/index.js';
import {
  RefinedSchema,
  SuperRefinedSchema,
  AsyncRefinedSchema,
  TransformSchema,
  AsyncTransformSchema,
  PreprocessSchema,
  AsyncPreprocessSchema,
  PipeSchema,
} from '../../../src/core/schema/schema-modifiers.js';
import { ErrorCode } from '../../../src/common/types/result.js';

// ============================================================================
// REFINED SCHEMA TESTS
// ============================================================================

describe('RefinedSchema', () => {
  it('should pass when refinement check succeeds', () => {
    const schema = s.string().refine((val) => val.length >= 3, 'Must be at least 3 characters');
    const result = schema.validate('hello');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should fail when refinement check fails', () => {
    const schema = s.string().refine((val) => val.length >= 3, 'Must be at least 3 characters');
    const result = schema.validate('ab');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.REFINEMENT_FAILED);
      expect(result.errors[0]?.message).toBe('Must be at least 3 characters');
    }
  });

  it('should fail when inner schema validation fails', () => {
    const schema = s.number().refine((val) => val > 0, 'Must be positive');
    const result = schema.validate('not a number');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_NUMBER);
    }
  });

  it('should clone correctly', () => {
    const schema = s.string().refine((val) => val.length >= 3, 'Min 3 chars');
    const cloned = (schema as any)._clone();

    // Clone should preserve validation behavior
    expect(cloned.validate('hello').ok).toBe(true);
    expect(cloned.validate('ab').ok).toBe(false);
  });

  it('should work with complex refinement logic', () => {
    const schema = s.string().refine(
      (val) => val.toLowerCase() === val,
      'Must be lowercase'
    );

    expect(schema.validate('hello').ok).toBe(true);
    expect(schema.validate('HELLO').ok).toBe(false);
  });
});

// ============================================================================
// SUPER REFINED SCHEMA TESTS
// ============================================================================

describe('SuperRefinedSchema', () => {
  it('should pass when refinement succeeds', () => {
    const schema = s.string().superRefine((val, ctx): val is string => {
      if (val.length < 3) {
        ctx.addError({
          code: ErrorCode.STRING_TOO_SHORT,
          message: 'String too short',
          path: ctx.path,
          received: val,
        });
        return false;
      }
      return true;
    });

    const result = schema.validate('hello');
    expect(result.ok).toBe(true);
  });

  it('should fail with custom errors from context', () => {
    const schema = s.string().superRefine((val, ctx): val is string => {
      if (val.length < 3) {
        ctx.addError({
          code: ErrorCode.STRING_TOO_SHORT,
          message: 'Too short!',
          path: ctx.path,
          received: val,
        });
        return false;
      }
      return true;
    });

    const result = schema.validate('ab');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.STRING_TOO_SHORT);
      expect(result.errors[0]?.message).toBe('Too short!');
    }
  });

  it('should add multiple errors via context', () => {
    const schema = s.object({ name: s.string(), age: s.number() }).superRefine((val, ctx): val is any => {
      let valid = true;
      if (val.name.length < 2) {
        ctx.addError({
          code: ErrorCode.STRING_TOO_SHORT,
          message: 'Name too short',
          path: `${ctx.path}.name`,
          received: val.name,
        });
        valid = false;
      }
      if (val.age < 0) {
        ctx.addError({
          code: ErrorCode.NUMBER_TOO_SMALL,
          message: 'Age cannot be negative',
          path: `${ctx.path}.age`,
          received: val.age,
        });
        valid = false;
      }
      return valid;
    });

    const result = schema.validate({ name: 'A', age: -5 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.code).toBe(ErrorCode.STRING_TOO_SHORT);
      expect(result.errors[1]?.code).toBe(ErrorCode.NUMBER_TOO_SMALL);
    }
  });

  it('should fail with default error when refiner returns false without adding errors', () => {
    const schema = s.string().superRefine((_val, _ctx): _val is string => {
      // Returns false but doesn't add any custom errors
      return false;
    });

    const result = schema.validate('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.REFINEMENT_FAILED);
      expect(result.errors[0]?.message).toBe('Refinement failed');
    }
  });

  it('should fail when inner schema validation fails', () => {
    const schema = s.number().superRefine((val, ctx): val is number => {
      if (val < 0) {
        ctx.addError({
          code: ErrorCode.NUMBER_TOO_SMALL,
          message: 'Must be positive',
          path: ctx.path,
          received: val,
        });
        return false;
      }
      return true;
    });

    const result = schema.validate('not a number');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_NUMBER);
    }
  });

  it('should clone correctly', () => {
    const refiner = (val: string, ctx: any): val is string => {
      if (val.length < 3) {
        ctx.addError({
          code: ErrorCode.STRING_TOO_SHORT,
          message: 'Too short',
          path: ctx.path,
          received: val,
        });
        return false;
      }
      return true;
    };
    const schema = s.string().superRefine(refiner);
    const cloned = (schema as any)._clone();

    // Clone should preserve validation behavior
    expect(cloned.validate('hello').ok).toBe(true);
    expect(cloned.validate('ab').ok).toBe(false);
  });
});

// ============================================================================
// ASYNC REFINED SCHEMA TESTS
// ============================================================================

describe('AsyncRefinedSchema', () => {
  it('should pass sync validation (defers async check)', () => {
    const schema = s.string().refineAsync(
      async (val) => val.length >= 3,
      'Must be at least 3 characters'
    );

    const result = schema.validate('hello');
    expect(result.ok).toBe(true);
  });

  it('should pass async validation when check succeeds', async () => {
    const schema = s.string().refineAsync(
      async (val) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return val.length >= 3;
      },
      'Must be at least 3 characters'
    );

    const result = await schema.validateAsync('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should fail async validation when check fails', async () => {
    const schema = s.string().refineAsync(
      async (val) => val.length >= 3,
      'Must be at least 3 characters'
    );

    const result = await schema.validateAsync('ab');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.REFINEMENT_FAILED);
      expect(result.errors[0]?.message).toBe('Must be at least 3 characters');
    }
  });

  it('should handle async check that throws error', async () => {
    const schema = s.string().refineAsync(
      async () => {
        throw new Error('Network error');
      },
      'Default message'
    );

    const result = await schema.validateAsync('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.REFINEMENT_FAILED);
      expect(result.errors[0]?.message).toBe('Network error');
    }
  });

  it('should handle async check that throws non-Error', async () => {
    const schema = s.string().refineAsync(
      async () => {
        throw 'string error';
      },
      'Default message'
    );

    const result = await schema.validateAsync('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.REFINEMENT_FAILED);
      expect(result.errors[0]?.message).toBe('Default message');
    }
  });

  it('should fail async validation when inner schema fails', async () => {
    const schema = s.number().refineAsync(async (val) => val > 0, 'Must be positive');
    const result = await schema.validateAsync('not a number');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_NUMBER);
    }
  });

  it('should clone correctly', () => {
    const schema = s.string().refineAsync(
      async (val) => val.length >= 3,
      'Min 3 chars'
    );
    const cloned = (schema as any)._clone();

    // Clone should preserve validation behavior
    expect(cloned.validate('hello').ok).toBe(true);
  });
});

// ============================================================================
// TRANSFORM SCHEMA TESTS
// ============================================================================

describe('TransformSchema', () => {
  it('should transform value successfully', () => {
    const schema = s.string().transform((val) => val.toUpperCase());
    const result = schema.validate('hello');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('HELLO');
    }
  });

  it('should transform value with complex logic', () => {
    const schema = s.string().transform((val) => {
      const parts = val.split(' ');
      return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    });

    const result = schema.validate('hello world');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('Hello World');
    }
  });

  it('should fail when transformer throws error', () => {
    const schema = s.string().transform(() => {
      throw new Error('Transform error');
    });

    const result = schema.validate('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.TRANSFORM_FAILED);
      expect(result.errors[0]?.message).toBe('Transform error');
    }
  });

  it('should fail when transformer throws non-Error', () => {
    const schema = s.string().transform(() => {
      throw 'string error';
    });

    const result = schema.validate('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.TRANSFORM_FAILED);
      expect(result.errors[0]?.message).toBe('Transform failed');
    }
  });

  it('should fail when inner schema validation fails', () => {
    const schema = s.number().transform((val) => val * 2);
    const result = schema.validate('not a number');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_NUMBER);
    }
  });

  it('should clone correctly', () => {
    const schema = s.string().transform((val) => val.toUpperCase());
    const cloned = (schema as any)._clone();

    // Clone should preserve transformation behavior
    const result = cloned.validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('HELLO');
    }
  });

  it('should chain multiple transforms', () => {
    const schema = s.string()
      .transform((val) => val.trim())
      .transform((val) => val.toUpperCase());

    const result = schema.validate('  hello  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('HELLO');
    }
  });
});

// ============================================================================
// ASYNC TRANSFORM SCHEMA TESTS
// ============================================================================

describe('AsyncTransformSchema', () => {
  it('should pass sync validation without transform', () => {
    const schema = s.string().transformAsync(async (val) => val.toUpperCase());
    const result = schema.validate('hello');

    expect(result.ok).toBe(true);
    // Note: sync validation doesn't run transform, returns original type
  });

  it('should transform value asynchronously', async () => {
    const schema = s.string().transformAsync(async (val) => {
      await new Promise(resolve => setTimeout(resolve, 1));
      return val.toUpperCase();
    });

    const result = await schema.validateAsync('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('HELLO');
    }
  });

  it('should handle async transformer that throws Error', async () => {
    const schema = s.string().transformAsync(async () => {
      throw new Error('Async transform error');
    });

    const result = await schema.validateAsync('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.TRANSFORM_FAILED);
      expect(result.errors[0]?.message).toBe('Async transform error');
    }
  });

  it('should handle async transformer that throws non-Error', async () => {
    const schema = s.string().transformAsync(async () => {
      throw 'string error';
    });

    const result = await schema.validateAsync('test');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.TRANSFORM_FAILED);
      expect(result.errors[0]?.message).toBe('Transform failed');
    }
  });

  it('should fail async validation when inner schema fails', async () => {
    const schema = s.number().transformAsync(async (val) => val * 2);
    const result = await schema.validateAsync('not a number');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_NUMBER);
    }
  });

  it('should clone correctly', () => {
    const schema = s.string().transformAsync(async (val) => val.toUpperCase());
    const cloned = (schema as any)._clone();

    // Clone should preserve validation behavior
    expect(cloned.validate('hello').ok).toBe(true);
  });

  it('should work with complex async operations', async () => {
    const schema = s.string().transformAsync(async (val) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1));
      return { original: val, processed: val.toUpperCase(), timestamp: Date.now() };
    });

    const result = await schema.validateAsync('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.original).toBe('hello');
      expect(result.data.processed).toBe('HELLO');
      expect(typeof result.data.timestamp).toBe('number');
    }
  });
});

// ============================================================================
// PREPROCESS SCHEMA TESTS
// ============================================================================

describe('PreprocessSchema', () => {
  it('should preprocess value before validation', () => {
    const schema = s.string().min(3).preprocess((val) => String(val).trim());
    const result = schema.validate('  hello  ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should work with type conversion', () => {
    const schema = s.number().min(10).preprocess((val) => Number(val));
    const result = schema.validate('15');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(15);
    }
  });

  it('should fail when preprocessed value fails inner schema', () => {
    const schema = s.string().min(5).preprocess((val) => String(val).trim());
    const result = schema.validate('  ab  ');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.STRING_TOO_SHORT);
    }
  });

  it('should support async validation', async () => {
    const schema = s.string().min(3).preprocess((val) => String(val).trim());
    const result = await schema.validateAsync('  hello  ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should clone correctly with config', () => {
    const schema = s.string().preprocess((val) => String(val).trim());
    const cloned = (schema as any)._clone({ optional: true });

    // Clone should preserve preprocessing behavior
    expect(cloned.validate('  hello  ').ok).toBe(true);
  });

  it('should handle complex preprocessing', () => {
    const schema = s.array(s.string()).preprocess((val) => {
      if (typeof val === 'string') {
        return val.split(',').map(v => v.trim());
      }
      return val;
    });

    const result = schema.validate('apple, banana, cherry');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(['apple', 'banana', 'cherry']);
    }
  });
});

// ============================================================================
// ASYNC PREPROCESS SCHEMA TESTS
// ============================================================================

describe('AsyncPreprocessSchema', () => {
  it('should pass sync validation without preprocessing', () => {
    const schema = new AsyncPreprocessSchema(
      s.string(),
      async (val) => String(val).trim()
    );
    const result = schema.validate('  hello  ');

    expect(result.ok).toBe(true);
    // Note: sync validation doesn't run async preprocessor
  });

  it('should preprocess value asynchronously', async () => {
    const schema = new AsyncPreprocessSchema(
      s.string().min(3),
      async (val) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return String(val).trim();
      }
    );

    const result = await schema.validateAsync('  hello  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should work with async type conversion', async () => {
    const schema = new AsyncPreprocessSchema(
      s.number().min(10),
      async (val) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return Number(val);
      }
    );

    const result = await schema.validateAsync('15');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(15);
    }
  });

  it('should fail when preprocessed value fails inner schema', async () => {
    const schema = new AsyncPreprocessSchema(
      s.string().min(5),
      async (val) => String(val).trim()
    );

    const result = await schema.validateAsync('  ab  ');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.STRING_TOO_SHORT);
    }
  });

  it('should clone correctly with config', () => {
    const schema = new AsyncPreprocessSchema(
      s.string(),
      async (val) => String(val).trim()
    );
    const cloned = (schema as any)._clone({ optional: true });

    // Clone should preserve validation behavior
    expect(cloned.validate('  hello  ').ok).toBe(true);
  });

  it('should handle complex async preprocessing', async () => {
    const schema = new AsyncPreprocessSchema(
      s.array(s.string()),
      async (val) => {
        await new Promise(resolve => setTimeout(resolve, 1));
        if (typeof val === 'string') {
          return val.split(',').map(v => v.trim());
        }
        return val;
      }
    );

    const result = await schema.validateAsync('apple, banana, cherry');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(['apple', 'banana', 'cherry']);
    }
  });
});

// ============================================================================
// PIPE SCHEMA TESTS
// ============================================================================

describe('PipeSchema', () => {
  it('should pipe value through both schemas', () => {
    const schema = s.string().pipe(s.string().min(3));

    const result = schema.validate('hello');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should fail when first schema fails', () => {
    const schema = s.string().pipe(s.string().min(3));

    const result = schema.validate(123);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.NOT_STRING);
    }
  });

  it('should fail when second schema fails', () => {
    const schema = s.string().pipe(s.string().min(5));

    const result = schema.validate('abc');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.code).toBe(ErrorCode.STRING_TOO_SHORT);
    }
  });

  it('should work with transform in pipe', () => {
    const schema = s.string().transform((val) => val.trim()).pipe(s.string().min(3));

    const result = schema.validate('  hello  ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('hello');
    }
  });

  it('should clone correctly', () => {
    const schema = s.string().pipe(s.string().min(3));
    const cloned = (schema as any)._clone();

    // Clone should preserve piping behavior
    expect(cloned.validate('hello').ok).toBe(true);
    expect(cloned.validate('ab').ok).toBe(false);
  });

  it('should work with multiple pipes', () => {
    const schema = s.string()
      .transform((val) => val.trim())
      .pipe(s.string().min(3));

    const result = schema.validate('  hello  ');
    expect(result.ok).toBe(true);
  });
});
