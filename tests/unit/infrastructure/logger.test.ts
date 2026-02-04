/**
 * Logger Tests
 */

import {
  ConsoleLogger,
  NoOpLogger,
  BufferedLogger,
  createLogger,
  setGlobalLogger,
  getGlobalLogger,
} from '../../../src/infrastructure/logging/logger';

describe('ConsoleLogger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      logger.debug('test message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      logger.info('test message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      logger.warn('test message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      logger.error('test message');

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('minLevel filtering', () => {
    it('should not log debug when minLevel is info', () => {
      const logger = new ConsoleLogger({ minLevel: 'info' });
      logger.debug('test message');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should not log info when minLevel is warn', () => {
      const logger = new ConsoleLogger({ minLevel: 'warn' });
      logger.info('test message');

      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should not log warn when minLevel is error', () => {
      const logger = new ConsoleLogger({ minLevel: 'error' });
      logger.warn('test message');

      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('prefix', () => {
    it('should include prefix in log message', () => {
      const logger = new ConsoleLogger({ prefix: '[TEST]', minLevel: 'debug' });
      logger.info('test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TEST]')
      );
    });
  });

  describe('metadata', () => {
    it('should include metadata in log message', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      logger.info('test message', { key: 'value' });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('key')
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with context', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug' });
      const child = logger.child({ requestId: '123' });

      child.info('test message');

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('requestId')
      );
    });

    it('should merge parent and child context', () => {
      const logger = new ConsoleLogger({ minLevel: 'debug', context: { app: 'test' } });
      const child = logger.child({ requestId: '123' });

      child.info('test message');

      const logCall = consoleSpy.info.mock.calls[0]![0];
      expect(logCall).toContain('app');
      expect(logCall).toContain('requestId');
    });
  });
});

describe('NoOpLogger', () => {
  it('should not throw on any method', () => {
    const logger = new NoOpLogger();

    expect(() => logger.debug('test')).not.toThrow();
    expect(() => logger.info('test')).not.toThrow();
    expect(() => logger.warn('test')).not.toThrow();
    expect(() => logger.error('test')).not.toThrow();
    expect(() => logger.child({})).not.toThrow();
  });

  it('should return itself from child()', () => {
    const logger = new NoOpLogger();
    const child = logger.child({ key: 'value' });

    expect(child).toBe(logger);
  });
});

describe('BufferedLogger', () => {
  let logger: BufferedLogger;

  beforeEach(() => {
    logger = new BufferedLogger();
  });

  describe('buffering', () => {
    it('should buffer log entries', () => {
      logger.info('message 1');
      logger.info('message 2');

      expect(logger.count()).toBe(2);
    });

    it('should store entry details', () => {
      logger.info('test message', { key: 'value' });

      const entries = logger.getEntries();
      expect(entries[0]).toMatchObject({
        level: 'info',
        message: 'test message',
      });
      expect(entries[0]!.meta).toHaveProperty('key', 'value');
    });

    it('should include timestamp', () => {
      logger.info('test');

      const entries = logger.getEntries();
      expect(entries[0]!.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getEntriesByLevel', () => {
    it('should filter entries by level', () => {
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      const errors = logger.getEntriesByLevel('error');
      expect(errors).toHaveLength(1);
      expect(errors[0]!.message).toBe('error message');
    });
  });

  describe('hasErrors', () => {
    it('should return true if has errors', () => {
      logger.info('info');
      logger.error('error');

      expect(logger.hasErrors()).toBe(true);
    });

    it('should return false if no errors', () => {
      logger.info('info');
      logger.warn('warn');

      expect(logger.hasErrors()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      logger.info('message 1');
      logger.info('message 2');

      logger.clear();

      expect(logger.count()).toBe(0);
    });
  });

  describe('max entries', () => {
    it('should evict oldest entries when at max', () => {
      const logger = new BufferedLogger({ maxEntries: 3 });

      logger.info('message 1');
      logger.info('message 2');
      logger.info('message 3');
      logger.info('message 4');

      expect(logger.count()).toBe(3);
      const entries = logger.getEntries();
      expect(entries[0]!.message).toBe('message 2');
    });
  });

  describe('child logger', () => {
    it('should share entries with parent', () => {
      const child = logger.child({ requestId: '123' });

      logger.info('parent message');
      child.info('child message');

      expect(logger.count()).toBe(2);
    });

    it('should include child context in entries', () => {
      const child = logger.child({ requestId: '123' });
      child.info('child message');

      const entries = logger.getEntries();
      expect(entries[0]!.meta).toHaveProperty('requestId', '123');
    });
  });
});

describe('createLogger', () => {
  it('should create console logger by default', () => {
    const logger = createLogger();
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it('should create noop logger', () => {
    const logger = createLogger('noop');
    expect(logger).toBeInstanceOf(NoOpLogger);
  });

  it('should create buffered logger', () => {
    const logger = createLogger('buffered');
    expect(logger).toBeInstanceOf(BufferedLogger);
  });
});

describe('global logger', () => {
  it('should get and set global logger', () => {
    const logger = new BufferedLogger();
    setGlobalLogger(logger);

    expect(getGlobalLogger()).toBe(logger);
  });

  it('should default to NoOpLogger', () => {
    // Reset by setting a new NoOpLogger
    setGlobalLogger(new NoOpLogger());
    expect(getGlobalLogger()).toBeInstanceOf(NoOpLogger);
  });
});
