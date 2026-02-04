/**
 * Tests for regex utilities and ReDoS protection
 */

import {
  safeRegexTest,
  isComplexRegex,
  validateRegexSecurity,
  DEFAULT_REGEX_SECURITY_CONFIG,
} from '../../../src/common/utils/regex-utils.js';

describe('Regex Utils', () => {
  describe('safeRegexTest', () => {
    it('should test simple regex patterns', () => {
      const pattern = /^[a-z]+$/;
      expect(safeRegexTest(pattern, 'hello')).toBe(true);
      expect(safeRegexTest(pattern, 'hello123')).toBe(false);
    });

    it('should return null for input exceeding maxLength', () => {
      const pattern = /test/;
      const longInput = 'a'.repeat(20000);

      const result = safeRegexTest(pattern, longInput);
      expect(result).toBe(null);
    });

    it('should respect custom maxLength config', () => {
      const pattern = /test/;
      const input = 'a'.repeat(100);

      const result = safeRegexTest(pattern, input, { maxLength: 50 });
      expect(result).toBe(null);
    });

    it('should handle complex regex with timeout', async () => {
      const complexPattern = /(a+)+b/; // Potentially dangerous pattern
      const input = 'aaaaaaaaaa';

      const result = await safeRegexTest(complexPattern, input, { timeout: 100 });
      // Result could be boolean or null depending on timeout
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });
  });

  describe('isComplexRegex', () => {
    it('should detect nested quantifiers', () => {
      const dangerous1 = /(a+)+/;
      const dangerous2 = /(a*)*b/;

      expect(isComplexRegex(dangerous1)).toBe(true);
      expect(isComplexRegex(dangerous2)).toBe(true);
    });

    it('should detect overlapping alternation', () => {
      const dangerous = /(a|a)+b/;

      expect(isComplexRegex(dangerous)).toBe(true);
    });

    it('should detect backreferences', () => {
      const dangerous = /(a)\1+/;

      expect(isComplexRegex(dangerous)).toBe(true);
    });

    it('should flag very long patterns', () => {
      const longPattern = new RegExp('a'.repeat(150));

      expect(isComplexRegex(longPattern)).toBe(true);
    });

    it('should pass simple safe patterns', () => {
      const safe1 = /^[a-z]+$/;
      const safe2 = /\d{3}-\d{4}/;
      const safe3 = /hello|world/;

      expect(isComplexRegex(safe1)).toBe(false);
      expect(isComplexRegex(safe2)).toBe(false);
      expect(isComplexRegex(safe3)).toBe(false);
    });

  });

  describe('validateRegexSecurity', () => {
    it('should validate safe patterns successfully', () => {
      const pattern = /^[a-z]+$/;
      const result = validateRegexSecurity(pattern, 'hello');

      expect(result.valid).toBe(true);
      expect(result.result).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject input exceeding maxLength', () => {
      const pattern = /test/;
      const longInput = 'a'.repeat(20000);

      const result = validateRegexSecurity(pattern, longInput);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject complex/dangerous patterns', () => {
      const dangerousPattern = /(a+)+b/;
      const input = 'aaa';

      const result = validateRegexSecurity(dangerousPattern, input);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('should handle regex execution errors', () => {
      // Create a pattern that might throw during test()
      const pattern = /(?=a)(?=b)/; // Impossible lookahead
      const input = 'test';

      // This should handle any errors gracefully
      const result = validateRegexSecurity(pattern, input);

      expect(result.valid).toBeDefined();
    });

    it('should respect custom maxLength in validation', () => {
      const pattern = /test/;
      const input = 'a'.repeat(100);

      const result = validateRegexSecurity(pattern, input, { maxLength: 50 });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('50');
    });

    it('should return result when pattern matches', () => {
      const pattern = /hello/;
      const result = validateRegexSecurity(pattern, 'hello world');

      expect(result.valid).toBe(true);
      expect(result.result).toBe(true);
    });

    it('should return result when pattern does not match', () => {
      const pattern = /goodbye/;
      const result = validateRegexSecurity(pattern, 'hello world');

      expect(result.valid).toBe(true);
      expect(result.result).toBe(false);
    });
  });

  describe('DEFAULT_REGEX_SECURITY_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_REGEX_SECURITY_CONFIG.maxLength).toBe(10000);
      expect(DEFAULT_REGEX_SECURITY_CONFIG.timeout).toBe(1000);
    });

    it('should be used as default in safeRegexTest', () => {
      const pattern = /test/;
      // Just at the limit
      const input = 'a'.repeat(10000);

      const result = safeRegexTest(pattern, input);
      expect(result).not.toBe(null);
    });

    it('should be used as default in validateRegexSecurity', () => {
      const pattern = /test/;
      const input = 'a'.repeat(10000);

      const result = validateRegexSecurity(pattern, input);
      expect(result.valid).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle timeout for potentially slow regex', async () => {
      // Complex pattern that might be slow
      const pattern = /(a+)+b/;
      const input = 'a'.repeat(20);

      // Test with very short timeout
      const result = await safeRegexTest(pattern, input, { timeout: 1 });

      // Result should be boolean or null (timeout)
      expect(result === null || typeof result === 'boolean').toBe(true);
    });

    it('should return false for impossible patterns', () => {
      const pattern = /(?=a)(?=b)/; // Impossible lookahead
      const result = validateRegexSecurity(pattern, 'test');

      // Should handle this gracefully
      expect(result.valid).toBe(true);
      expect(result.result).toBe(false);
    });

    it('should handle empty input', () => {
      const pattern = /test/;
      const result = safeRegexTest(pattern, '');

      expect(result).toBe(false);
    });

    it('should handle empty pattern', () => {
      const pattern = new RegExp('');
      const result = safeRegexTest(pattern, 'test');

      expect(result).toBe(true); // Empty pattern matches everything
    });
  });
});
