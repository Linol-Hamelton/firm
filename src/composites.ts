/**
 * FIRM - Composite Validators Entry Point
 *
 * Tree-shakeable import for composite validators only.
 *
 * @example
 * ```ts
 * import { object, array, union } from 'firm-validator/composites';
 * ```
 */

export {
  ObjectValidator,
  object,
  ArrayValidator,
  array,
  TupleValidator,
  tuple,
  UnionValidator,
  union,
  DiscriminatedUnionValidator,
  discriminatedUnion,
  IntersectionValidator,
  intersection,
  RecordValidator,
  record,
  MapValidator,
  map,
  SetValidator,
  set,
} from './core/validators/composites/index.js';
