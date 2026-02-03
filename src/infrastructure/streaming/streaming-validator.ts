/**
 * LAYER 3: Streaming Validation
 *
 * Validate large data streams without loading everything into memory.
 * Supports async iterators, Node.js streams, and chunk-based validation.
 *
 * Target: Handle 1GB+ JSON streams with constant memory usage.
 */

import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingValidationOptions {
  /** Maximum chunk size (in bytes) for parsing */
  chunkSize?: number;
  /** Maximum total size (in bytes) before aborting (optional) */
  maxSize?: number;
  /** Encoding for text streams (default: 'utf-8') */
  encoding?: BufferEncoding;
  /** Whether to abort on first error (default: false) */
  abortEarly?: boolean;
  /** Custom error handler for streaming errors */
  onError?: (error: StreamingError) => void;
}

export interface StreamingError {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Position in stream (bytes) */
  position?: number;
  /** Chunk index where error occurred */
  chunkIndex?: number;
}

export interface StreamingValidationResult<T> {
  /** Validated data items */
  items: T[];
  /** Total items processed */
  total: number;
  /** Validation errors (if any) */
  errors: StreamingError[];
  /** Whether validation succeeded (no errors) */
  ok: boolean;
}

// ============================================================================
// STREAMING VALIDATOR
// ============================================================================

/**
 * Validate an async iterable of data chunks against a schema.
 * Each chunk is expected to be a complete JSON object (newline-delimited JSON).
 *
 * @example
 * ```ts
 * const schema = s.object({ id: s.number(), name: s.string() });
 * const stream = fs.createReadStream('data.ndjson');
 * const result = await validateStream(schema, stream, { chunkSize: 1024 });
 * ```
 */
export async function validateStream<T>(
  schema: Schema<T>,
  iterable: AsyncIterable<Buffer | string> | Iterable<Buffer | string>,
  options: StreamingValidationOptions = {}
): Promise<StreamingValidationResult<T>> {
  const {
    maxSize,
    encoding = 'utf-8',
    abortEarly = false,
    onError,
  } = options;

  const items: T[] = [];
  const errors: StreamingError[] = [];
  let totalBytes = 0;
  let chunkIndex = 0;
  let itemIndex = 0;
  let shouldAbort = false;

  try {
    for await (const chunk of iterable) {
      if (shouldAbort) break;

      // Check size limits
      const chunkBytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, encoding);
      totalBytes += chunkBytes;

      if (maxSize && totalBytes > maxSize) {
        const error: StreamingError = {
          code: 'STREAM_SIZE_EXCEEDED',
          message: `Stream exceeded maximum size of ${maxSize} bytes`,
          position: totalBytes,
          chunkIndex,
        };
        errors.push(error);
        onError?.(error);
        if (abortEarly) break;
        continue;
      }

      // Parse chunk (assuming newline-delimited JSON)
      const text = Buffer.isBuffer(chunk) ? chunk.toString(encoding) : chunk;
      const lines = text.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (shouldAbort) break;

        try {
          const data = JSON.parse(line);
          const result = schema.validate(data);

          if (result.ok) {
            items.push(result.data);
          } else {
            const error: StreamingError = {
              code: 'VALIDATION_FAILED',
              message: `Validation failed at item ${itemIndex}`,
              position: totalBytes,
              chunkIndex,
            };
            errors.push(error);
            onError?.(error);
            if (abortEarly) {
              shouldAbort = true;
              break;
            }
          }
        } catch (parseError) {
          const error: StreamingError = {
            code: 'PARSE_ERROR',
            message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON',
            position: totalBytes,
            chunkIndex,
          };
          errors.push(error);
          onError?.(error);
          if (abortEarly) {
            shouldAbort = true;
            break;
          }
        }
        itemIndex++;
      }

      chunkIndex++;
    }
  } catch (streamError) {
    // Handle stream errors (e.g., network failure)
    const error: StreamingError = {
      code: 'STREAM_ERROR',
      message: streamError instanceof Error ? streamError.message : 'Stream error occurred',
      position: totalBytes,
      chunkIndex,
    };
    errors.push(error);
    onError?.(error);
  }

  return {
    items,
    total: itemIndex,
    errors,
    ok: errors.length === 0,
  };
}

/**
 * Validate a stream of homogeneous array items.
 * Each chunk can contain partial JSON arrays (streaming JSON).
 *
 * @example
 * ```ts
 * const schema = s.object({ id: s.number() });
 * const stream = fs.createReadStream('data.json');
 * const result = await validateArrayStream(schema, stream);
 * ```
 */
export async function validateArrayStream<T>(
  schema: Schema<T>,
  iterable: AsyncIterable<Buffer | string> | Iterable<Buffer | string>,
  options: StreamingValidationOptions = {}
): Promise<StreamingValidationResult<T>> {
  // Simplified implementation: accumulate chunks and parse as JSON array
  let buffer = '';
  const items: T[] = [];
  const errors: StreamingError[] = [];
  let totalBytes = 0;
  let chunkIndex = 0;

  try {
    for await (const chunk of iterable) {
      const chunkBytes = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, 'utf-8');
      totalBytes += chunkBytes;

      if (options.maxSize && totalBytes > options.maxSize) {
        const error: StreamingError = {
          code: 'STREAM_SIZE_EXCEEDED',
          message: `Stream exceeded maximum size of ${options.maxSize} bytes`,
          position: totalBytes,
          chunkIndex,
        };
        errors.push(error);
        options.onError?.(error);
        if (options.abortEarly) break;
        continue;
      }

      buffer += Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      chunkIndex++;
    }

    // Parse the complete JSON array
    try {
      const data = JSON.parse(buffer);
      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array');
      }

      for (let i = 0; i < data.length; i++) {
        const result = schema.validate(data[i]);
        if (result.ok) {
          items.push(result.data);
        } else {
          const error: StreamingError = {
            code: 'VALIDATION_FAILED',
            message: `Validation failed at array index ${i}`,
            position: totalBytes,
            chunkIndex,
          };
          errors.push(error);
          options.onError?.(error);
          if (options.abortEarly) break;
        }
      }
    } catch (parseError) {
      const error: StreamingError = {
        code: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON',
        position: totalBytes,
        chunkIndex,
      };
      errors.push(error);
      options.onError?.(error);
    }
  } catch (streamError) {
    const error: StreamingError = {
      code: 'STREAM_ERROR',
      message: streamError instanceof Error ? streamError.message : 'Stream error occurred',
      position: totalBytes,
      chunkIndex,
    };
    errors.push(error);
    options.onError?.(error);
  }

  return {
    items,
    total: items.length,
    errors,
    ok: errors.length === 0,
  };
}

/**
 * Create a transform stream that validates each chunk.
 * Useful for Node.js pipelines.
 *
 * @example
 * ```ts
 * const transform = createValidationTransform(schema);
 * readableStream.pipe(transform).pipe(writableStream);
 * ```
 */
export function createValidationTransform<T>(
  _schema: Schema<T>,
  _options: StreamingValidationOptions = {}
): TransformStream<Buffer | string, T> {
  // Node.js streams not available in browser; this is a placeholder
  // In a real implementation, we would return a Node.js Transform stream
  throw new Error('Node.js streams not supported in this environment');
}

/**
 * Check if a value is a stream (async iterable).
 */
export function isStream(value: unknown): value is AsyncIterable<unknown> | Iterable<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Symbol.asyncIterator in value || Symbol.iterator in value)
  );
}