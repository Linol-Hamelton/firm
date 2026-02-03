/**
 * Special Validators Tests
 * - literal
 * - enum
 * - nativeEnum
 * - date
 * - null
 * - undefined
 * - any
 * - unknown
 * - never
 * - void
 */

import { s } from '../../../src/index';

describe('LiteralValidator', () => {
  describe('string literals', () => {
    it('should validate exact string', () => {
      const schema = s.literal('hello');

      expect(schema.validate('hello').ok).toBe(true);
      expect(schema.validate('world').ok).toBe(false);
      expect(schema.validate('').ok).toBe(false);
    });

    it('should return the literal value', () => {
      const schema = s.literal('test');
      const result = schema.validate('test');

      if (result.ok) {
        expect(result.data).toBe('test');
      }
    });
  });

  describe('number literals', () => {
    it('should validate exact number', () => {
      const schema = s.literal(42);

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(43).ok).toBe(false);
      expect(schema.validate('42').ok).toBe(false);
    });

    it('should validate zero', () => {
      const schema = s.literal(0);

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(1).ok).toBe(false);
    });
  });

  describe('boolean literals', () => {
    it('should validate true literal', () => {
      const schema = s.literal(true);

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(false);
    });

    it('should validate false literal', () => {
      const schema = s.literal(false);

      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(true).ok).toBe(false);
    });
  });

  describe('null and undefined literals', () => {
    it('should validate null literal', () => {
      const schema = s.literal(null);

      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(false);
    });

    it('should validate undefined literal', () => {
      const schema = s.literal(undefined);

      expect(schema.validate(undefined).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return INVALID_LITERAL error code', () => {
      const schema = s.literal('expected');
      const result = schema.validate('actual');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('INVALID_LITERAL');
      }
    });
  });
});

describe('EnumValidator', () => {
  describe('basic validation', () => {
    it('should validate enum values', () => {
      const schema = s.enum(['red', 'green', 'blue']);

      expect(schema.validate('red').ok).toBe(true);
      expect(schema.validate('green').ok).toBe(true);
      expect(schema.validate('blue').ok).toBe(true);
      expect(schema.validate('yellow').ok).toBe(false);
    });

    it('should reject non-enum values', () => {
      const schema = s.enum(['a', 'b', 'c']);

      expect(schema.validate('d').ok).toBe(false);
      expect(schema.validate(1).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.enum(['one', 'two', 'three']);

      expect(schema.is('one')).toBe(true);
      expect(schema.is('four')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return INVALID_ENUM_VALUE error code', () => {
      const schema = s.enum(['a', 'b']);
      const result = schema.validate('c');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('INVALID_ENUM_VALUE');
      }
    });
  });
});

describe('NativeEnumValidator', () => {
  enum Color {
    Red = 'RED',
    Green = 'GREEN',
    Blue = 'BLUE',
  }

  enum NumericEnum {
    Zero = 0,
    One = 1,
    Two = 2,
  }

  describe('string enums', () => {
    it('should validate string enum values', () => {
      const schema = s.nativeEnum(Color);

      expect(schema.validate('RED').ok).toBe(true);
      expect(schema.validate('GREEN').ok).toBe(true);
      expect(schema.validate('BLUE').ok).toBe(true);
      expect(schema.validate('YELLOW').ok).toBe(false);
    });
  });

  describe('numeric enums', () => {
    it('should validate numeric enum values', () => {
      const schema = s.nativeEnum(NumericEnum);

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(1).ok).toBe(true);
      expect(schema.validate(2).ok).toBe(true);
      expect(schema.validate(3).ok).toBe(false);
    });
  });
});

describe('DateValidator', () => {
  describe('basic validation', () => {
    it('should validate Date instances', () => {
      const schema = s.date();

      expect(schema.validate(new Date()).ok).toBe(true);
      expect(schema.validate(new Date('2024-01-01')).ok).toBe(true);
    });

    it('should reject non-Date values', () => {
      const schema = s.date();

      expect(schema.validate('2024-01-01').ok).toBe(false);
      expect(schema.validate(1704067200000).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
    });

    it('should reject invalid Date', () => {
      const schema = s.date();

      expect(schema.validate(new Date('invalid')).ok).toBe(false);
    });
  });

  describe('range constraints', () => {
    it('should validate min date', () => {
      const minDate = new Date('2024-01-01');
      const schema = s.date().min(minDate);

      expect(schema.validate(new Date('2024-01-01')).ok).toBe(true);
      expect(schema.validate(new Date('2024-06-01')).ok).toBe(true);
      expect(schema.validate(new Date('2023-12-31')).ok).toBe(false);
    });

    it('should validate max date', () => {
      const maxDate = new Date('2024-12-31');
      const schema = s.date().max(maxDate);

      expect(schema.validate(new Date('2024-12-31')).ok).toBe(true);
      expect(schema.validate(new Date('2024-01-01')).ok).toBe(true);
      expect(schema.validate(new Date('2025-01-01')).ok).toBe(false);
    });
  });
});

describe('NullValidator', () => {
  it('should validate null', () => {
    const schema = s.null();

    expect(schema.validate(null).ok).toBe(true);
  });

  it('should reject non-null values', () => {
    const schema = s.null();

    expect(schema.validate(undefined).ok).toBe(false);
    expect(schema.validate(0).ok).toBe(false);
    expect(schema.validate('').ok).toBe(false);
    expect(schema.validate(false).ok).toBe(false);
  });
});

describe('UndefinedValidator', () => {
  it('should validate undefined', () => {
    const schema = s.undefined();

    expect(schema.validate(undefined).ok).toBe(true);
  });

  it('should reject non-undefined values', () => {
    const schema = s.undefined();

    expect(schema.validate(null).ok).toBe(false);
    expect(schema.validate(0).ok).toBe(false);
    expect(schema.validate('').ok).toBe(false);
    expect(schema.validate(false).ok).toBe(false);
  });
});

describe('AnyValidator', () => {
  it('should validate any value', () => {
    const schema = s.any();

    expect(schema.validate(null).ok).toBe(true);
    expect(schema.validate(undefined).ok).toBe(true);
    expect(schema.validate(42).ok).toBe(true);
    expect(schema.validate('string').ok).toBe(true);
    expect(schema.validate({}).ok).toBe(true);
    expect(schema.validate([]).ok).toBe(true);
  });

  it('should return the original value', () => {
    const schema = s.any();
    const obj = { nested: { value: 42 } };
    const result = schema.validate(obj);

    if (result.ok) {
      expect(result.data).toBe(obj);
    }
  });
});

describe('UnknownValidator', () => {
  it('should validate any value', () => {
    const schema = s.unknown();

    expect(schema.validate(null).ok).toBe(true);
    expect(schema.validate(undefined).ok).toBe(true);
    expect(schema.validate(42).ok).toBe(true);
    expect(schema.validate('string').ok).toBe(true);
    expect(schema.validate({}).ok).toBe(true);
    expect(schema.validate([]).ok).toBe(true);
  });
});

describe('NeverValidator', () => {
  it('should reject all values', () => {
    const schema = s.never();

    expect(schema.validate(null).ok).toBe(false);
    expect(schema.validate(undefined).ok).toBe(false);
    expect(schema.validate(42).ok).toBe(false);
    expect(schema.validate('string').ok).toBe(false);
    expect(schema.validate({}).ok).toBe(false);
  });
});

describe('VoidValidator', () => {
  it('should validate undefined', () => {
    const schema = s.void();

    expect(schema.validate(undefined).ok).toBe(true);
  });

  it('should reject other values', () => {
    const schema = s.void();

    expect(schema.validate(null).ok).toBe(false);
    expect(schema.validate(0).ok).toBe(false);
    expect(schema.validate('').ok).toBe(false);
  });
});
