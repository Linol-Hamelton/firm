/**
 * Zero-Config Framework Detection Tests
 *
 * Tests for automatic framework detection and configuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFramework, autoConfigure, getDetectedFramework } from '../../../src/infrastructure/auto-detection/index.js';

describe('Zero-Config Framework Detection', () => {
  describe('detectFramework', () => {
    beforeEach(() => {
      // Clear any cached detection
      vi.resetModules();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should detect Express environment', () => {
      // Mock Express-specific globals
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { npm_package_dependencies: JSON.stringify({ express: '^4.18.0' }) }
      };

      const result = detectFramework();
      expect(result.name).toBe('express');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Fastify environment', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { npm_package_dependencies: JSON.stringify({ fastify: '^4.0.0' }) }
      };

      const result = detectFramework();
      expect(result.name).toBe('fastify');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect NestJS environment', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { npm_package_dependencies: JSON.stringify({ '@nestjs/common': '^10.0.0' }) }
      };

      const result = detectFramework();
      expect(result.name).toBe('nestjs');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Koa environment', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { npm_package_dependencies: JSON.stringify({ koa: '^2.14.0' }) }
      };

      const result = detectFramework();
      expect(result.name).toBe('koa');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Next.js environment', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { 
          npm_package_dependencies: JSON.stringify({ next: '^14.0.0' }),
          NEXT_PUBLIC_APP_NAME: 'test'
        }
      };

      const result = detectFramework();
      expect(result.name).toBe('next');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return "none" when no framework detected', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { npm_package_dependencies: JSON.stringify({}) }
      };

      const result = detectFramework();
      expect(result.name).toBe('none');
      expect(result.confidence).toBe(1.0);
    });

    it('should prioritize detection based on environment variables', () => {
      (global as any).process = {
        ...global.process,
        versions: { node: '20.0.0' },
        env: { 
          npm_package_dependencies: JSON.stringify({ express: '^4.0.0', fastify: '^4.0.0' }),
          FIRM_FRAMEWORK: 'fastify'
        }
      };

      const result = detectFramework();
      expect(result.name).toBe('fastify');
    });
  });

  describe('autoConfigure', () => {
    it('should return configuration with async enabled for Express', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'express',
          confidence: 0.9,
          config: {
            async: true,
            parallel: true,
            caching: true,
            autoFix: false,
            errorFormat: 'detailed',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure();
      expect(config.async).toBe(true);
      expect(config.parallel).toBe(true);
      expect(config.caching).toBe(true);
    });

    it('should return configuration with async enabled for Fastify', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'fastify',
          confidence: 0.9,
          config: {
            async: true,
            parallel: true,
            caching: true,
            autoFix: false,
            errorFormat: 'minimal',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure();
      expect(config.async).toBe(true);
      expect(config.parallel).toBe(true);
      expect(config.caching).toBe(true);
    });

    it('should return configuration with async enabled for NestJS', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'nestjs',
          confidence: 0.9,
          config: {
            async: true,
            parallel: true,
            caching: true,
            autoFix: false,
            errorFormat: 'detailed',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure();
      expect(config.async).toBe(true);
      expect(config.parallel).toBe(true);
      expect(config.caching).toBe(true);
    });

    it('should return configuration with async enabled for Koa', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'koa',
          confidence: 0.9,
          config: {
            async: true,
            parallel: true,
            caching: true,
            autoFix: false,
            errorFormat: 'minimal',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure();
      expect(config.async).toBe(true);
      expect(config.parallel).toBe(true);
      expect(config.caching).toBe(true);
    });

    it('should return default configuration when unknown', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'none',
          confidence: 1.0,
          config: {
            async: false,
            parallel: false,
            caching: false,
            autoFix: false,
            errorFormat: 'detailed',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure();
      expect(config.async).toBe(false);
      expect(config.parallel).toBe(false);
      expect(config.caching).toBe(false);
    });

    it('should merge user overrides with auto configuration', () => {
      vi.spyOn(require('../../../src/infrastructure/auto-detection/framework-detector.js'), 'detectFramework')
        .mockReturnValue({
          name: 'express',
          confidence: 0.9,
          config: {
            async: true,
            parallel: true,
            caching: true,
            autoFix: false,
            errorFormat: 'detailed',
            validationMode: 'strict'
          }
        });

      const config = autoConfigure({
        async: false,
        debug: true
      });

      expect(config.async).toBe(false); // user override
      expect(config.debug).toBe(true);
      expect(config.parallel).toBe(true); // from framework config
    });
  });
});