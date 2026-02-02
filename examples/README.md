# FIRM Validator Examples

Минимальный набор примеров для первого релиза FIRM Validator. Эти примеры демонстрируют ключевые возможности библиотеки и типичные сценарии использования.

## Быстрый старт

### 1. Базовая валидация

```typescript
import { s } from 'firm-validator';

const userSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150),
  isActive: s.boolean().default(true)
});

const user = userSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

console.log(user);
// { name: 'John Doe', email: 'john@example.com', age: 30, isActive: true }
```

### 2. Обработка ошибок

```typescript
const result = userSchema.safeParse({
  name: '',
  email: 'invalid-email',
  age: 'not-a-number'
});

if (!result.ok) {
  console.log(result.errors);
  // [
  //   { code: 'TOO_SMALL', message: 'String must be at least 1 character', path: ['name'] },
  //   { code: 'INVALID_EMAIL', message: 'Invalid email format', path: ['email'] },
  //   { code: 'INVALID_TYPE', message: 'Expected number, got string', path: ['age'] }
  // ]
}
```

### 3. Трансформации и приведение типов

```typescript
const apiSchema = s.object({
  id: s.coerce.number(), // string → number
  name: s.string().trim().toLowerCase(),
  createdAt: s.coerce.date(), // string → Date
  tags: s.array(s.string().trim()).unique()
});

const data = apiSchema.parse({
  id: '123',
  name: '  JOHN DOE  ',
  createdAt: '2024-01-01T00:00:00Z',
  tags: ['react', 'typescript', 'react'] // дубликат будет удален
});

console.log(data);
// {
//   id: 123,
//   name: 'john doe',
//   createdAt: 2024-01-01T00:00:00.000Z,
//   tags: ['react', 'typescript']
// }
```

## Express.js интеграция

```typescript
import express from 'express';
import { s } from 'firm-validator';

const app = express();
app.use(express.json());

const createUserSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  password: s.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: s.enum(['user', 'admin']).default('user')
});

app.post('/users', (req, res) => {
  try {
    const userData = createUserSchema.parse(req.body);

    // Создать пользователя в базе данных
    const user = await createUser(userData);

    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({
      errors: error.errors,
      message: 'Validation failed'
    });
  }
});

app.listen(3000);
```

## React Hook Form интеграция

```typescript
import { useForm } from 'react-hook-form';
import { s } from 'firm-validator';

const loginSchema = s.object({
  email: s.string().email(),
  password: s.string().min(6),
  rememberMe: s.boolean().default(false)
});

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm();

  const onSubmit = (data) => {
    const result = loginSchema.safeParse(data);

    if (!result.ok) {
      // Установить ошибки в форму
      result.errors.forEach(error => {
        setError(error.path.join('.'), {
          message: error.message
        });
      });
      return;
    }

    // Отправить валидированные данные
    login(result.data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input {...register('password')} type="password" placeholder="Password" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div>
        <label>
          <input {...register('rememberMe')} type="checkbox" />
          Remember me
        </label>
      </div>

      <button type="submit">Login</button>
    </form>
  );
}
```

## Prisma интеграция

```typescript
import { PrismaClient } from '@prisma/client';
import { s } from 'firm-validator';

const prisma = new PrismaClient();

const createPostSchema = s.object({
  title: s.string().min(1).max(200),
  content: s.string().min(10),
  published: s.boolean().default(false),
  tags: s.array(s.string().min(1).max(50)).max(10).optional(),
  authorId: s.number().int().positive()
});

export async function createPost(data: unknown) {
  const validatedData = createPostSchema.parse(data);

  return prisma.post.create({
    data: {
      ...validatedData,
      tags: validatedData.tags ? {
        connectOrCreate: validatedData.tags.map(tag => ({
          where: { name: tag },
          create: { name: tag }
        }))
      } : undefined
    }
  });
}

// Использование
try {
  const post = await createPost({
    title: 'My First Post',
    content: 'This is the content of my first post...',
    published: true,
    tags: ['typescript', 'validation'],
    authorId: 1
  });
} catch (error) {
  console.error('Validation failed:', error.errors);
}
```

## Рекурсивные структуры

```typescript
// Определение дерева комментариев
const commentSchema = s.lazy(() =>
  s.object({
    id: s.number().int().positive(),
    content: s.string().min(1).max(1000),
    author: s.object({
      id: s.number().int().positive(),
      name: s.string().min(1).max(100),
      email: s.string().email()
    }),
    replies: s.array(commentSchema).default([]), // Рекурсивная ссылка
    createdAt: s.date()
  })
);

// Использование
const commentData = {
  id: 1,
  content: 'This is a comment',
  author: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  },
  replies: [
    {
      id: 2,
      content: 'This is a reply',
      author: {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com'
      },
      replies: [], // Может быть пустым
      createdAt: new Date()
    }
  ],
  createdAt: new Date()
};

const comment = commentSchema.parse(commentData);
```

## Параллельная валидация больших массивов

```typescript
const userBatchSchema = s.array(
  s.object({
    id: s.number().int().positive(),
    name: s.string().min(1).max(100),
    email: s.string().email(),
    profile: s.object({
      bio: s.string().max(500).optional(),
      website: s.string().url().optional(),
      skills: s.array(s.string()).unique()
    })
  })
).parallel(); // Включает параллельную валидацию

// Валидация 1000+ пользователей будет выполняться параллельно
const users = userBatchSchema.parse(largeUserArray);
```

## Автоисправление данных

```typescript
import { createAutoFixSchema } from 'firm-validator/infrastructure/auto-fix';

const userInputSchema = createAutoFixSchema(
  s.object({
    name: s.string().trim().toLowerCase(),
    email: s.string().email().toLowerCase(),
    age: s.coerce.number().int(),
    newsletter: s.coerce.boolean().default(false)
  })
);

const rawData = {
  name: '  JOHN DOE  ',
  email: 'JOHN@EXAMPLE.COM',
  age: '25',
  newsletter: 'yes'
};

const cleanedData = userInputSchema.parse(rawData);
console.log(cleanedData);
// {
//   name: 'john doe',
//   email: 'john@example.com',
//   age: 25,
//   newsletter: true
// }
```

## Сравнение производительности

```typescript
import { s } from 'firm-validator';

// Создание схемы
const schema = s.object({
  id: s.number().int(),
  name: s.string().min(1),
  email: s.string().email(),
  scores: s.array(s.number().min(0).max(100))
});

// Компиляция для максимальной производительности
const compiledSchema = s.compile(schema);

// Бенчмарк
const testData = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`,
  scores: [85, 92, 78, 96, 88]
}));

console.time('Regular validation');
for (const data of testData) {
  schema.parse(data);
}
console.timeEnd('Regular validation');
// ~50ms

console.time('Compiled validation');
for (const data of testData) {
  compiledSchema(data);
}
console.timeEnd('Compiled validation');
// ~5ms (10x быстрее!)
```

## Следующие шаги

- Изучите [полную документацию](https://firm-validator.dev)
- Посмотрите [интеграции с фреймворками](../docs/integrations/)
- Ознакомьтесь с [революционными функциями](../docs/revolutionary-features/)
- Присоединяйтесь к [сообществу](https://github.com/Linol-Hamelton/firm/discussions)