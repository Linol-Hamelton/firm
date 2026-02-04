import { s } from 'firm-validator';

/**
 * User Registration Schema
 * Demonstrates basic validation with FIRM
 */
export const registerSchema = s
  .object({
    username: s.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores',
    }),
    email: s.string().email(),
    password: s.string().min(8).max(100),
    confirmPassword: s.string(),
    age: s.coerce.number().int().min(18).max(120),
    acceptTerms: s.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .compile();

export type RegisterInput = typeof registerSchema.infer;

/**
 * Profile Update Schema
 * Demonstrates optional fields and selective validation
 */
export const profileSchema = s
  .object({
    displayName: s.string().min(1).max(50).optional(),
    bio: s.string().max(500).optional(),
    website: s.string().url().optional(),
    avatar: s.string().url().optional(),
    location: s.string().max(100).optional(),
    birthdate: s.coerce.date().optional(),
    notifications: s
      .object({
        email: s.boolean().default(true),
        push: s.boolean().default(false),
        sms: s.boolean().default(false),
      })
      .optional(),
  })
  .compile();

export type ProfileInput = typeof profileSchema.infer;

/**
 * Address Schema
 * Used in multi-step form example
 */
export const addressSchema = s
  .object({
    street: s.string().min(1).max(200),
    city: s.string().min(1).max(100),
    state: s.string().min(2).max(2).regex(/^[A-Z]{2}$/, {
      message: 'State must be a 2-letter code (e.g., NY, CA)',
    }),
    zipCode: s.string().regex(/^\d{5}(-\d{4})?$/, {
      message: 'Invalid ZIP code format',
    }),
    country: s.string().default('US'),
  })
  .compile();

export type AddressInput = typeof addressSchema.infer;

/**
 * Payment Schema
 * Demonstrates credit card validation
 */
export const paymentSchema = s
  .object({
    cardNumber: s.string().regex(/^\d{16}$/, {
      message: 'Card number must be 16 digits',
    }),
    cardHolder: s.string().min(1).max(100),
    expiryMonth: s.coerce
      .number()
      .int()
      .min(1)
      .max(12),
    expiryYear: s.coerce
      .number()
      .int()
      .min(new Date().getFullYear()),
    cvv: s.string().regex(/^\d{3,4}$/, {
      message: 'CVV must be 3 or 4 digits',
    }),
  })
  .compile();

export type PaymentInput = typeof paymentSchema.infer;

/**
 * Dynamic Form Schema
 * Demonstrates conditional validation
 */
export const contactSchema = s
  .object({
    contactMethod: s.enum(['email', 'phone', 'mail']),
    email: s.string().email().optional(),
    phone: s
      .string()
      .regex(/^\+?[\d\s-()]+$/, {
        message: 'Invalid phone number format',
      })
      .optional(),
    mailingAddress: addressSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.contactMethod === 'email') return !!data.email;
      if (data.contactMethod === 'phone') return !!data.phone;
      if (data.contactMethod === 'mail') return !!data.mailingAddress;
      return false;
    },
    {
      message: 'Please provide the required contact information',
      path: ['contactMethod'],
    }
  )
  .compile();

export type ContactInput = typeof contactSchema.infer;
