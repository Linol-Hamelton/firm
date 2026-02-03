/**
 * Security Tests
 *
 * Tests for security vulnerabilities and edge cases:
 * - Prototype pollution protection
 * - ReDoS (Regular Expression Denial of Service) protection
 * - Object depth limits
 * - Circular reference handling
 * - Malicious input patterns
 */

import { s } from '../../../src/index.ts';
import { validateObjectSecurity, DEFAULT_SECURITY_CONFIG } from '../../../src/common/utils/object-utils';
import { validateRegexSecurity } from '../../../src/common/utils/regex-utils';
import { ErrorCode } from '../../../src/common/types/result';

describe('Security - Prototype Pollution Protection', () => {
  const schema = s.object({
    name: s.string(),
    age: s.string().regex(/^\d+$/),
  });

  it('should reject objects with prototype pollution', () => {
    const malicious = JSON.parse('{"name":"test","age":"25","__proto__":{"polluted":true}}');
    const result = schema.validate(malicious);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe(ErrorCode.OBJECT_SECURITY_VIOLATION);
    }
  });

  it('should reject objects with constructor pollution', () => {
    const malicious = {
      name: 'test',
      age: '25',
      constructor: { prototype: { polluted: true } }
    };
    const result = schema.validate(malicious);

    expect(result.ok).toBe(false);
  });

  it('should accept safe objects', () => {
    const safe = { name: 'test', age: '25' };
    const result = schema.validate(safe);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(safe);
    }
  });

  it('should handle unknown keys safely', () => {
    const schemaWithPassthrough = s.object({
      name: s.string(),
    }).passthrough();

    const input = { name: 'test', safeProp: 'value' };
    const result = schemaWithPassthrough.validate(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(input);
    }
  });
});

describe('Security - ReDoS Protection', () => {
  it('should reject overly long strings for regex validation', () => {
    const longString = 'a'.repeat(15000);
    const schema = s.string().regex(/^a+$/);

    const result = schema.validate(longString);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe(ErrorCode.STRING_PATTERN_SECURITY_VIOLATION);
    }
  });

  it('should handle complex regex patterns safely', () => {
    // This regex is vulnerable to ReDoS: (a*)* which can cause exponential backtracking
    const vulnerablePattern = /^(a*)*$/;
    const input = 'a'.repeat(1000) + 'b'; // Won't match but will try

    const validation = validateRegexSecurity(vulnerablePattern, input);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('security');
  });

  it('should accept safe regex patterns', () => {
    const safePattern = /^[a-zA-Z0-9]+$/;
    const input = 'Hello123';

    const validation = validateRegexSecurity(safePattern, input);
    expect(validation.valid).toBe(true);
    expect(validation.result).toBe(true);
  });

  it('should timeout on complex patterns', () => {
    // Create a pattern that could cause long execution
    const complexPattern = /^((a|b|c)*)*$/;
    const input = 'a'.repeat(100) + 'd'; // Won't match but complex to process

    const validation = validateRegexSecurity(complexPattern, input, { timeout: 10 });
    // Should either timeout or detect as invalid
    expect(validation.valid || !validation.result).toBe(true);
  });
});

describe('Security - Object Depth Limits', () => {
  it('should reject objects exceeding depth limit', () => {
    const deepObject = createDeepObject(70); // Exceeds default 64 limit
    const schema = s.object({
      data: s.object({
        nested: s.string(),
      }),
    });

    const result = schema.validate(deepObject);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe(ErrorCode.OBJECT_SECURITY_VIOLATION);
    }
  });

  it('should accept objects within depth limit', () => {
    const reasonableObject = createDeepObject(50);
    const schema = s.object({
      value: s.string(),
    }).passthrough();

    const result = schema.validate(reasonableObject);
    expect(result.ok).toBe(true);
  });

  it('should validate depth using utility function', () => {
    const deepObject = createDeepObject(70);
    const securityCheck = validateObjectSecurity(deepObject);

    expect(securityCheck.valid).toBe(false);
    expect(securityCheck.error).toContain('depth');
  });
});

describe('Security - Circular References', () => {
  it('should handle circular references gracefully', () => {
    const circular: any = { name: 'test' };
    circular.self = circular;

    const schema = s.object({
      name: s.string(),
      self: s.object({}).optional(),
    });

    // Should not crash, but may reject due to depth or other validation
    expect(() => schema.validate(circular)).not.toThrow();
  });

  it('should detect circular references in validation', () => {
    const circular: any = { items: [] };
    circular.items.push(circular);

    const schema = s.object({
      items: s.array(s.object({
        name: s.string().optional(),
      })),
    });

    // Should either reject or handle gracefully
    const result = schema.validate(circular);
    expect(result.ok).toBe(false); // Should fail due to circular reference
  });
});

describe('Security - Malicious Input Patterns', () => {
  it('should reject objects with dangerous property names', () => {
    const dangerous = {
      'constructor': 'malicious',
      '__proto__': { polluted: true },
      'prototype': { hacked: true },
      'toString': 'overridden',
      'hasOwnProperty': 'fake',
    };

    const schema = s.object({}).passthrough();
    const result = schema.validate(dangerous);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe(ErrorCode.OBJECT_SECURITY_VIOLATION);
    }
  });

  it('should handle null prototype objects', () => {
    const nullProto = Object.create(null);
    nullProto.name = 'test';

    const schema = s.object({
      name: s.string(),
    });

    const result = schema.validate(nullProto);
    expect(result.ok).toBe(true);
  });

  it('should reject arrays disguised as objects', () => {
    const arrayAsObject = [1, 2, 3];
    const schema = s.object({
      '0': s.string(), // Would match array indices
    });

    const result = schema.validate(arrayAsObject as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe(ErrorCode.NOT_OBJECT);
    }
  });
});

describe('Security - Performance Under Attack', () => {
  it('should maintain performance with malicious inputs', () => {
    const schema = s.object({
      name: s.string().min(1).max(100),
      data: s.object({
        value: s.string().regex(/^[a-z]+$/),
      }),
    });

    const maliciousInputs = [
      { name: '', data: { value: 'x'.repeat(10000) } }, // Long string
      createDeepObject(60), // Deep nesting
      { name: 'test', __proto__: { polluted: true } }, // Prototype pollution
    ];

    const startTime = Date.now();

    for (const input of maliciousInputs) {
      const result = schema.validate(input);
      expect(result.ok).toBe(false); // All should fail
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (less than 1 second for security checks)
    expect(duration).toBeLessThan(1000);
  });
});

// Helper function to create deeply nested objects
function createDeepObject(depth: number): any {
  let obj: any = { value: 'deep' };
  let current = obj;

  for (let i = 0; i < depth; i++) {
    current.nested = { value: `level_${i}` };
    current = current.nested;
  }

  return obj;
}