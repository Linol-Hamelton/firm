/**
 * Benchmark: String Validation
 *
 * Tests various string validation scenarios including email, URL, regex, etc.
 * Strings are the most common validation target in real applications.
 */

import { s } from 'firm-validator';
import { z } from 'zod';
import * as v from 'valibot';
import * as yup from 'yup';
import { runSuite, saveResults } from '../benchmark-utils';

// ============================================================================
// SCHEMAS
// ============================================================================

// Email schemas
const firmEmailSchema = s.string().email().compile();
const zodEmailSchema = z.string().email();
const valibotEmailSchema = v.pipe(v.string(), v.email());
const yupEmailSchema = yup.string().email().required();

// URL schemas
const firmUrlSchema = s.string().url().compile();
const zodUrlSchema = z.string().url();
const valibotUrlSchema = v.pipe(v.string(), v.url());
const yupUrlSchema = yup.string().url().required();

// UUID schemas
const firmUuidSchema = s.string().uuid().compile();
const zodUuidSchema = z.string().uuid();
const valibotUuidSchema = v.pipe(v.string(), v.uuid());
const yupUuidSchema = yup.string().uuid().required();

// Regex schemas (phone number)
const phoneRegex = /^\+?[\d\s-()]+$/;
const firmPhoneSchema = s.string().regex(phoneRegex).compile();
const zodPhoneSchema = z.string().regex(phoneRegex);
const valibotPhoneSchema = v.pipe(v.string(), v.regex(phoneRegex));
const yupPhoneSchema = yup.string().matches(phoneRegex).required();

// Length constraint schemas
const firmLengthSchema = s.string().min(5).max(50).compile();
const zodLengthSchema = z.string().min(5).max(50);
const valibotLengthSchema = v.pipe(v.string(), v.minLength(5), v.maxLength(50));
const yupLengthSchema = yup.string().min(5).max(50).required();

// ============================================================================
// TEST DATA
// ============================================================================

const validEmail = 'user@example.com';
const validUrl = 'https://example.com/path/to/resource';
const validUuid = '550e8400-e29b-41d4-a716-446655440000';
const validPhone = '+1 (555) 123-4567';
const validLength = 'This is a valid string with proper length';

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 String Validation Benchmarks');
  console.log('Testing various string validation patterns\n');

  // Email validation
  const emailSuite = await runSuite({
    name: 'String Validation - Email',
    description: 'Email address validation',
    tests: [
      {
        name: 'email-firm',
        library: 'FIRM',
        fn: () => firmEmailSchema(validEmail),
      },
      {
        name: 'email-zod',
        library: 'Zod',
        fn: () => zodEmailSchema.safeParse(validEmail),
      },
      {
        name: 'email-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotEmailSchema, validEmail),
      },
      {
        name: 'email-yup',
        library: 'Yup',
        fn: () => yupEmailSchema.validateSync(validEmail),
      },
    ],
  });

  // URL validation
  const urlSuite = await runSuite({
    name: 'String Validation - URL',
    description: 'URL validation',
    tests: [
      {
        name: 'url-firm',
        library: 'FIRM',
        fn: () => firmUrlSchema(validUrl),
      },
      {
        name: 'url-zod',
        library: 'Zod',
        fn: () => zodUrlSchema.safeParse(validUrl),
      },
      {
        name: 'url-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotUrlSchema, validUrl),
      },
      {
        name: 'url-yup',
        library: 'Yup',
        fn: () => yupUrlSchema.validateSync(validUrl),
      },
    ],
  });

  // UUID validation
  const uuidSuite = await runSuite({
    name: 'String Validation - UUID',
    description: 'UUID validation',
    tests: [
      {
        name: 'uuid-firm',
        library: 'FIRM',
        fn: () => firmUuidSchema(validUuid),
      },
      {
        name: 'uuid-zod',
        library: 'Zod',
        fn: () => zodUuidSchema.safeParse(validUuid),
      },
      {
        name: 'uuid-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotUuidSchema, validUuid),
      },
      {
        name: 'uuid-yup',
        library: 'Yup',
        fn: () => yupUuidSchema.validateSync(validUuid),
      },
    ],
  });

  // Regex validation
  const regexSuite = await runSuite({
    name: 'String Validation - Regex (Phone)',
    description: 'Regex pattern validation for phone numbers',
    tests: [
      {
        name: 'regex-firm',
        library: 'FIRM',
        fn: () => firmPhoneSchema(validPhone),
      },
      {
        name: 'regex-zod',
        library: 'Zod',
        fn: () => zodPhoneSchema.safeParse(validPhone),
      },
      {
        name: 'regex-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotPhoneSchema, validPhone),
      },
      {
        name: 'regex-yup',
        library: 'Yup',
        fn: () => yupPhoneSchema.validateSync(validPhone),
      },
    ],
  });

  // Length constraint validation
  const lengthSuite = await runSuite({
    name: 'String Validation - Length Constraints',
    description: 'Min/max length validation',
    tests: [
      {
        name: 'length-firm',
        library: 'FIRM',
        fn: () => firmLengthSchema(validLength),
      },
      {
        name: 'length-zod',
        library: 'Zod',
        fn: () => zodLengthSchema.safeParse(validLength),
      },
      {
        name: 'length-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotLengthSchema, validLength),
      },
      {
        name: 'length-yup',
        library: 'Yup',
        fn: () => yupLengthSchema.validateSync(validLength),
      },
    ],
  });

  saveResults('strings.json', [emailSuite, urlSuite, uuidSuite, regexSuite, lengthSuite]);
}

main().catch(console.error);
