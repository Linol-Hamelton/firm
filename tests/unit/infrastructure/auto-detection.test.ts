/**
 * Zero-Config Framework Detection Tests
 *
 * Tests for automatic framework detection and configuration.
 */


// Import the actual functions to test
import {
  detectFramework,
  autoConfigure,
  getConfig,
  resetConfig,
} from '../../../src/infrastructure/auto-detection/index';

describe('Zero-Config Framework Detection', () => {
  beforeEach(() => {
    // Reset config between tests
    resetConfig();
  });

  describe('detectFramework', () => {
    it('should return a detection result with name and confidence', () => {
      const result = detectFramework();
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('confidence');
      expect(typeof result.name).toBe('string');
      expect(typeof result.confidence).toBe('number');
    });

    it('should return confidence between 0 and 1', () => {
      const result = detectFramework();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should detect based on available framework detectors', () => {
      const result = detectFramework();
      // The detection should return one of the known frameworks or 'none'
      const validFrameworks = ['express', 'fastify', 'nestjs', 'koa', 'next', 'hapi', 'react', 'none'];
      expect(validFrameworks).toContain(result.name);
    });
  });

  describe('autoConfigure', () => {
    it('should return configuration with all expected properties', () => {
      const config = autoConfigure();
      expect(config).toHaveProperty('async');
      expect(config).toHaveProperty('parallel');
      expect(config).toHaveProperty('caching');
      expect(typeof config.async).toBe('boolean');
      expect(typeof config.parallel).toBe('boolean');
      expect(typeof config.caching).toBe('boolean');
    });

    it('should merge user overrides with auto configuration', () => {
      const config = autoConfigure({
        async: false,
        debug: true
      });

      expect(config.async).toBe(false); // user override
      expect(config.debug).toBe(true); // user addition
    });

    it('should preserve user overrides even if framework config differs', () => {
      // First configure with some values
      autoConfigure({ parallel: false });

      // Then get the config
      const config = getConfig();
      expect(config.parallel).toBe(false);
    });

    it('should return same config on subsequent calls without overrides', () => {
      const config1 = autoConfigure();
      const config2 = autoConfigure();

      expect(config1.async).toBe(config2.async);
      expect(config1.parallel).toBe(config2.parallel);
      expect(config1.caching).toBe(config2.caching);
    });
  });

  describe('getConfig', () => {
    it('should return the current configuration', () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should reflect changes made via autoConfigure', () => {
      autoConfigure({ debug: true });
      const config = getConfig();
      expect(config.debug).toBe(true);
    });
  });

  describe('resetConfig', () => {
    it('should reset configuration to defaults', () => {
      // Make some changes
      autoConfigure({ debug: true, async: false });

      // Reset
      resetConfig();

      // Get fresh config - should be back to defaults
      const config = getConfig();
      // Debug may be undefined or false after reset depending on implementation
      expect(config.debug).toBeFalsy();
    });
  });

  describe('Framework Detection Integration', () => {
    it('should provide consistent detection across multiple calls', () => {
      const result1 = detectFramework();
      const result2 = detectFramework();

      expect(result1.name).toBe(result2.name);
      expect(result1.confidence).toBe(result2.confidence);
    });

    it('should not throw on detection', () => {
      expect(() => detectFramework()).not.toThrow();
    });

    it('should not throw on auto-configure', () => {
      expect(() => autoConfigure()).not.toThrow();
    });

    it('should handle empty override object', () => {
      const config = autoConfigure({});
      expect(config).toBeDefined();
    });
  });
});
