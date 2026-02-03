/**
 * TypeORM Integration Tests
 */

import { s } from '../../../src/index';
import {
  ValidatedEntity,
  createValidationSubscriber,
  validateQueryResult,
} from '../../../src/integrations/typeorm/index';
import { ValidationException } from '../../../src/common/errors/validation-error';

describe('TypeORM Integration', () => {
  const userSchema = s.object({
    name: s.string().min(1),
    email: s.string().email(),
    age: s.number().optional(),
  });

  describe('ValidatedEntity', () => {
    class TestEntity extends ValidatedEntity {
      name: string = '';
      email: string = '';
      age?: number;

      static override getValidationSchema() {
        return userSchema;
      }
    }

    it('should validate entity successfully', () => {
      const entity = new TestEntity();
      entity.name = 'John';
      entity.email = 'john@example.com';
      entity.age = 30;

      expect(() => entity.validate()).not.toThrow();
    });

    it('should throw on invalid entity', () => {
      const entity = new TestEntity();
      entity.name = '';
      entity.email = 'invalid-email';

      expect(() => entity.validate()).toThrow(ValidationException);
    });

    it('should return validated data', () => {
      const entity = new TestEntity();
      entity.name = 'John';
      entity.email = 'john@example.com';

      const validated = entity.validateAndGet();

      expect(validated.name).toBe('John');
      expect(validated.email).toBe('john@example.com');
    });
  });

  describe('createValidationSubscriber', () => {
    it('should create subscriber class', () => {
      const Subscriber = createValidationSubscriber();

      expect(Subscriber).toBeDefined();
      expect(typeof Subscriber).toBe('function');
    });

    it('should have validation methods', () => {
      const Subscriber = createValidationSubscriber();
      const subscriber = new Subscriber();

      expect(typeof subscriber.beforeInsert).toBe('function');
      expect(typeof subscriber.beforeUpdate).toBe('function');
    });
  });

  describe('validateQueryResult', () => {
    it('should validate query result', () => {
      const data = [
        { name: 'John', email: 'john@example.com', age: 30 },
        { name: 'Jane', email: 'jane@example.com', age: 25 },
      ];

      const arraySchema = s.array(userSchema);
      const result = validateQueryResult(data, arraySchema);

      expect(result).toEqual(data);
      expect(result).toHaveLength(2);
    });

    it('should throw on invalid query result', () => {
      const data = [
        { name: 'John', email: 'invalid-email' },
      ];

      const arraySchema = s.array(userSchema);

      expect(() => validateQueryResult(data, arraySchema)).toThrow(
        ValidationException
      );
    });

    it('should validate single entity result', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const result = validateQueryResult(data, userSchema);

      expect(result).toEqual(data);
    });
  });
});
