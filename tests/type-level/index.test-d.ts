import { expectTypeOf } from 'expect-type';
import { s } from '../../src/index.js';
import type { Schema } from '../../src/common/types/schema.js';

// ============================================================================
// BASIC TYPE TESTS
// ============================================================================

// Primitive types
expectTypeOf(s.string()._output).toEqualTypeOf<string>();
expectTypeOf(s.number()._output).toEqualTypeOf<number>();
expectTypeOf(s.boolean()._output).toEqualTypeOf<boolean>();

// ============================================================================
// OBJECT TYPES
// ============================================================================

const simpleObject = s.object({
  name: s.string(),
  age: s.number(),
});

type SimpleObject = typeof simpleObject._output;
expectTypeOf<SimpleObject>().toMatchTypeOf<{
  name: string;
  age: number;
}>();

// ============================================================================
// ARRAY TYPES
// ============================================================================

const stringArray = s.array(s.string());
type StringArray = typeof stringArray._output;
expectTypeOf<StringArray>().toEqualTypeOf<string[]>();

// ============================================================================
// UNION TYPES
// ============================================================================

const stringOrNumber = s.union([s.string(), s.number()]);
type StringOrNumber = typeof stringOrNumber._output;
expectTypeOf<StringOrNumber>().toEqualTypeOf<string | number>();

// ============================================================================
// OPTIONAL FIELDS
// ============================================================================

const optionalObject = s.object({
  required: s.string(),
  optional: s.string().optional(),
});

type OptionalObject = typeof optionalObject._output;
expectTypeOf<OptionalObject>().toMatchTypeOf<{
  required: string;
  optional?: string;
}>();

// ============================================================================
// ENUM TYPES
// ============================================================================

const statusEnum = s.enum(['active', 'inactive', 'pending']);
type StatusEnum = typeof statusEnum._output;
expectTypeOf<StatusEnum>().toEqualTypeOf<'active' | 'inactive' | 'pending'>();

// ============================================================================
// LITERAL TYPES
// ============================================================================

const literalValue = s.literal('exact');
type LiteralValue = typeof literalValue._output;
expectTypeOf<LiteralValue>().toEqualTypeOf<'exact'>();

// ============================================================================
// RECORD TYPES
// ============================================================================

const stringRecord = s.record(s.string());
type StringRecord = typeof stringRecord._output;
expectTypeOf<StringRecord>().toEqualTypeOf<Record<string, string>>();

// ============================================================================
// CONSTRAINT PRESERVATION
// ============================================================================

// Constraints don't change output types
expectTypeOf(s.string().min(5)._output).toEqualTypeOf<string>();
expectTypeOf(s.string().email()._output).toEqualTypeOf<string>();
expectTypeOf(s.number().int()._output).toEqualTypeOf<number>();
expectTypeOf(s.number().positive()._output).toEqualTypeOf<number>();

// ============================================================================
// INFER UTILITY
// ============================================================================

type InferredObject = s.Infer<typeof simpleObject>;
expectTypeOf<InferredObject>().toMatchTypeOf<{
  name: string;
  age: number;
}>();

type InferredArray = s.Infer<typeof stringArray>;
expectTypeOf<InferredArray>().toEqualTypeOf<string[]>();

type InferredUnion = s.Infer<typeof stringOrNumber>;
expectTypeOf<InferredUnion>().toEqualTypeOf<string | number>();

// ============================================================================
// INFER INPUT UTILITY
// ============================================================================

type InputObject = s.InferInput<typeof simpleObject>;
expectTypeOf<InputObject>().toMatchTypeOf<{
  name: string;
  age: number;
}>();

// ============================================================================
// COMPLEX NESTED TYPE
// ============================================================================

const userSchema = s.object({
  id: s.number().int(),
  name: s.string(),
  email: s.string().email(),
  tags: s.array(s.string()),
  profile: s.object({
    bio: s.string().optional(),
    avatar: s.string().url().optional(),
  }).optional(),
});

type User = s.Infer<typeof userSchema>;
expectTypeOf<User>().toMatchTypeOf<{
  id: number;
  name: string;
  email: string;
  tags: string[];
  profile?: {
    bio?: string;
    avatar?: string;
  };
}>();