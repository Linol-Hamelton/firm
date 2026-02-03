/**
 * Property-based tests using fast-check
 *
 * These tests verify that FIRM schemas behave correctly for a wide range of inputs
 * using property-based testing principles.
 */

import fc from 'fast-check';
import { s } from '../../../src/index.ts';

// ============================================================================
// STRING SCHEMA PROPERTIES
// ============================================================================

describe('String Schema - Property-based Tests', () => {
  const stringSchema = s.string();

  it('should accept any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = stringSchema.validate(input);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toBe(input);
        }
      })
    );
  });

  it('should reject non-string inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.float(),
          fc.boolean(),
          fc.object(),
          fc.array(fc.anything()),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = stringSchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });

  it('should handle min length constraint', () => {
    fc.assert(
      fc.property(fc.nat(100), fc.string(), (minLen, input) => {
        const schema = s.string().min(minLen);
        const result = schema.validate(input);

        if (input.length >= minLen) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      })
    );
  });

  it('should handle max length constraint', () => {
    fc.assert(
      fc.property(fc.nat(100), fc.string(), (maxLen, input) => {
        const schema = s.string().max(maxLen);
        const result = schema.validate(input);

        if (input.length <= maxLen) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      })
    );
  });

  it('should handle regex patterns', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]+$/), (input) => {
        const schema = s.string().regex(/^[a-z]+$/);
        const result = schema.validate(input);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toBe(input);
        }
      })
    );
  });
});

// ============================================================================
// NUMBER SCHEMA PROPERTIES
// ============================================================================

describe('Number Schema - Property-based Tests', () => {
  const numberSchema = s.number();

  it('should accept any number input', () => {
    fc.assert(
      fc.property(fc.float(), (input) => {
        const result = numberSchema.validate(input);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toBe(input);
        }
      })
    );
  });

  it('should reject non-number inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.boolean(),
          fc.object(),
          fc.array(fc.anything()),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = numberSchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });

  it('should handle integer constraint', () => {
    fc.assert(
      fc.property(fc.float(), (input) => {
        const schema = s.number().int();
        const result = schema.validate(input);

        if (Number.isInteger(input)) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      })
    );
  });

  it('should handle positive constraint', () => {
    fc.assert(
      fc.property(fc.float(), (input) => {
        const schema = s.number().positive();
        const result = schema.validate(input);

        if (input > 0) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      })
    );
  });

  it('should handle range constraints', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (min, max, input) => {
          // Ensure min <= max
          const actualMin = Math.min(min, max);
          const actualMax = Math.max(min, max);

          const schema = s.number().min(actualMin).max(actualMax);
          const result = schema.validate(input);

          if (input >= actualMin && input <= actualMax) {
            expect(result.ok).toBe(true);
          } else {
            expect(result.ok).toBe(false);
          }
        }
      )
    );
  });
});

// ============================================================================
// BOOLEAN SCHEMA PROPERTIES
// ============================================================================

describe('Boolean Schema - Property-based Tests', () => {
  const booleanSchema = s.boolean();

  it('should accept boolean inputs', () => {
    fc.assert(
      fc.property(fc.boolean(), (input) => {
        const result = booleanSchema.validate(input);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toBe(input);
        }
      })
    );
  });

  it('should reject non-boolean inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.object(),
          fc.array(fc.anything()),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = booleanSchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });
});

// ============================================================================
// OBJECT SCHEMA PROPERTIES
// ============================================================================

describe('Object Schema - Property-based Tests', () => {
  const objectSchema = s.object({
    name: s.string().min(1),
    age: s.number().int().min(0),
    active: s.boolean(),
  });

  it('should validate object structure', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.nat(120),
        fc.boolean(),
        (name, age, active) => {
          const input = { name, age, active };
          const result = objectSchema.validate(input);

          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data).toEqual(input);
          }
        }
      )
    );
  });

  it('should reject invalid object structures', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.array(fc.anything()),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = objectSchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });

  it('should handle optional fields', () => {
    const schemaWithOptional = s.object({
      required: s.string(),
      optional: s.string().optional(),
    });

    fc.assert(
      fc.property(fc.string(), fc.option(fc.string()), (required, optional) => {
        const input: any = { required };
        if (optional !== null) {
          input.optional = optional;
        }

        const result = schemaWithOptional.validate(input);
        expect(result.ok).toBe(true);
      })
    );
  });
});

// ============================================================================
// ARRAY SCHEMA PROPERTIES
// ============================================================================

describe('Array Schema - Property-based Tests', () => {
  const arraySchema = s.array(s.string());

  it('should validate arrays of strings', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (input) => {
        const result = arraySchema.validate(input);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual(input);
        }
      })
    );
  });

  it('should reject non-arrays', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.boolean(),
          fc.object(),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = arraySchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });

  it('should handle length constraints', () => {
    fc.assert(
      fc.property(fc.nat(50), fc.nat(50), fc.array(fc.string()), (minLen, maxLen, input) => {
        const actualMin = Math.min(minLen, maxLen);
        const actualMax = Math.max(minLen, maxLen);

        const schema = s.array(s.string()).min(actualMin).max(actualMax);
        const result = schema.validate(input);

        if (input.length >= actualMin && input.length <= actualMax) {
          expect(result.ok).toBe(true);
        } else {
          expect(result.ok).toBe(false);
        }
      })
    );
  });
});

// ============================================================================
// UNION SCHEMA PROPERTIES
// ============================================================================

describe('Union Schema - Property-based Tests', () => {
  const unionSchema = s.union([s.string(), s.number(), s.boolean()]);

  it('should accept valid union types', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        (input) => {
          const result = unionSchema.validate(input);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data).toBe(input);
          }
        }
      )
    );
  });

  it('should reject invalid union types', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.object(),
          fc.array(fc.anything()),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (input) => {
          const result = unionSchema.validate(input);
          expect(result.ok).toBe(false);
        }
      )
    );
  });
});

// ============================================================================
// ROUND-TRIP PROPERTIES
// ============================================================================

describe('Round-trip Properties', () => {
  it('should maintain data integrity through validation', () => {
    const schema = s.object({
      name: s.string(),
      age: s.number().int(),
      tags: s.array(s.string()),
      config: s.object({
        enabled: s.boolean(),
        count: s.number(),
      }),
    });

    fc.assert(
      fc.property(
        fc.string(),
        fc.nat(120),
        fc.array(fc.string()),
        fc.boolean(),
        // Use float that excludes NaN and Infinity for valid number comparison
        fc.float({ noNaN: true, noDefaultInfinity: true }),
        (name, age, tags, enabled, count) => {
          const input = {
            name,
            age,
            tags,
            config: { enabled, count }
          };

          const result = schema.validate(input);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.data).toEqual(input);
          }
        }
      )
    );
  });

  it('should handle coerce transformations correctly', () => {
    const coerceSchema = s.object({
      name: s.coerce.string(),
      age: s.coerce.number(),
      active: s.coerce.boolean(),
    });

    fc.assert(
      fc.property(
        // Any value can be coerced to string
        fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        // For number coercion, use values that can be converted to valid numbers
        // (non-empty strings that represent numbers, or actual numbers, or booleans)
        fc.oneof(
          fc.integer(),
          fc.boolean(),
          fc.integer().map(n => String(n)) // numeric strings
        ),
        // For boolean coercion, use values that have clear boolean meaning
        fc.oneof(fc.boolean(), fc.integer(), fc.constant('true'), fc.constant('false')),
        (nameInput, ageInput, activeInput) => {
          const input = { name: nameInput, age: ageInput, active: activeInput };
          const result = coerceSchema.validate(input);

          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(typeof result.data.name).toBe('string');
            expect(typeof result.data.age).toBe('number');
            expect(typeof result.data.active).toBe('boolean');
          }
        }
      )
    );
  });
});