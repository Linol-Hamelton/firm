/**
 * LAYER 3: NestJS Integration
 *
 * Seamless integration with NestJS framework.
 * Provides decorators, pipes, and modules for validation.
 *
 * Target: Zero-config integration with @nestjs/common.
 */

// ============================================================================
// NESTJS INTEGRATION
// ============================================================================

/**
 * NestJS validation pipe using FIRM schemas.
 * Can be used as a global pipe or method-level pipe.
 *
 * Usage:
 * ```ts
 * @UsePipes(new FirmValidationPipe(userSchema))
 * async createUser(@Body() body: unknown) { ... }
 * ```
 */
export class FirmValidationPipe<T> {
  constructor(private readonly schema: any) {}

  /**
   * Transform and validate the value.
   */
  transform(value: unknown): T {
    const result = this.schema.validate(value);
    if (!result.ok) {
      // Convert FIRM errors to NestJS BadRequestException
      const errors = result.errors.map((error: any) => ({
        property: error.path,
        constraints: {
          [error.code]: error.message,
        },
      }));

      throw new (require('@nestjs/common').BadRequestException)({
        message: 'Validation failed',
        errors,
      });
    }
    return result.data;
  }

  /**
   * Async version for async schemas.
   */
  async transformAsync(value: unknown): Promise<T> {
    const result = await this.schema.validateAsync(value);
    if (!result.ok) {
      const errors = result.errors.map((error: any) => ({
        property: error.path,
        constraints: {
          [error.code]: error.message,
        },
      }));

      throw new (require('@nestjs/common').BadRequestException)({
        message: 'Validation failed',
        errors,
      });
    }
    return result.data;
  }
}

/**
 * Decorator for validating method parameters with FIRM schemas.
 *
 * Usage:
 * ```ts
 * @Post()
 * async createUser(@FirmBody(userSchema) body: User) { ... }
 * ```
 */
export function FirmBody<T>(schema: any): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;
    
    const pipes = (Reflect as any).getMetadata('__firm_pipes__', target, propertyKey) || [];
    pipes[parameterIndex] = new FirmValidationPipe(schema);
    (Reflect as any).defineMetadata('__firm_pipes__', pipes, target, propertyKey);
  };
}

/**
 * Decorator for validating query parameters.
 *
 * Usage:
 * ```ts
 * @Get()
 * async getUsers(@FirmQuery(querySchema) query: Query) { ... }
 * ```
 */
export function FirmQuery<T>(schema: any): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;
    
    const pipes = (Reflect as any).getMetadata('__firm_pipes__', target, propertyKey) || [];
    pipes[parameterIndex] = new FirmValidationPipe(schema);
    (Reflect as any).defineMetadata('__firm_pipes__', pipes, target, propertyKey);
  };
}

/**
 * Decorator for validating route parameters.
 *
 * Usage:
 * ```ts
 * @Get(':id')
 * async getUser(@FirmParam(paramSchema) params: Params) { ... }
 * ```
 */
export function FirmParam<T>(schema: any): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;
    
    const pipes = (Reflect as any).getMetadata('__firm_pipes__', target, propertyKey) || [];
    pipes[parameterIndex] = new FirmValidationPipe(schema);
    (Reflect as any).defineMetadata('__firm_pipes__', pipes, target, propertyKey);
  };
}

/**
 * NestJS module for FIRM integration.
 * Provides global validation pipe and utilities.
 *
 * Usage:
 * ```ts
 * @Module({
 *   imports: [FirmModule],
 * })
 * export class AppModule {}
 * ```
 */
export class FirmModule {
  static forRoot(options: { global?: boolean } = {}) {
    const { global = true } = options;

    return {
      module: FirmModule,
      providers: [
        {
          provide: 'FIRM_VALIDATION_OPTIONS',
          useValue: options,
        },
        {
          provide: require('@nestjs/common').APP_PIPE,
          useFactory: () => {
            return new (require('@nestjs/common').ValidationPipe)({
              transform: true,
              whitelist: true,
              forbidNonWhitelisted: true,
              exceptionFactory: (errors: any[]) => {
                return new (require('@nestjs/common').BadRequestException)({
                  message: 'Validation failed',
                  errors: errors.map((error: any) => ({
                    property: error.property,
                    constraints: error.constraints,
                  })),
                });
              },
            });
          },
        },
      ],
      exports: ['FIRM_VALIDATION_OPTIONS'],
      global,
    };
  }
}

/**
 * Create a NestJS guard for validating requests with FIRM schemas.
 *
 * Usage:
 * ```ts
 * @UseGuards(FirmGuard(userSchema))
 * @Post()
 * async createUser(@Body() body: User) { ... }
 * ```
 */
export function FirmGuard<T>(schema: any) {
  return class FirmGuardImpl {
    canActivate(context: any): boolean | Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const result = schema.validate(request.body);
      
      if (!result.ok) {
        throw new (require('@nestjs/common').BadRequestException)({
          message: 'Validation failed',
          errors: result.errors.map((error: any) => ({
            property: error.path,
            constraints: {
              [error.code]: error.message,
            },
          })),
        });
      }
      
      // Attach validated data to request
      request.validatedBody = result.data;
      return true;
    }
  };
}

/**
 * Create a NestJS interceptor for validating responses with FIRM schemas.
 *
 * Usage:
 * ```ts
 * @UseInterceptors(FirmResponseInterceptor(userSchema))
 * @Get()
 * async getUsers(): Promise<User[]> { ... }
 * ```
 */
export function FirmResponseInterceptor<T>(schema: any) {
  return class FirmResponseInterceptorImpl {
    intercept(context: any, next: any) {
      const { map } = require('rxjs/operators');
      return next.handle().pipe(
        map((data: unknown) => {
          const result = schema.validate(data);
          if (!result.ok) {
            throw new (require('@nestjs/common').InternalServerErrorException)({
              message: 'Response validation failed',
              errors: result.errors,
            });
          }
          return result.data;
        })
      );
    }
  };
}

/**
 * Utility to create a NestJS DTO class from a FIRM schema.
 *
 * Usage:
 * ```ts
 * const UserDto = createDto(userSchema, 'UserDto');
 * 
 * @Controller()
 * class UserController {
 *   @Post()
 *   createUser(@Body() body: InstanceType<typeof UserDto>) { ... }
 * }
 * ```
 */
export function createDto<T>(schema: any, className: string): any {
  return class {
    constructor(data: T) {
      Object.assign(this, data);
    }

    static validate(data: unknown): any {
      return schema.validate(data);
    }

    static async validateAsync(data: unknown): Promise<any> {
      return schema.validateAsync(data);
    }

    static from(data: unknown): InstanceType<typeof this> {
      const result = schema.validate(data);
      if (!result.ok) {
        throw new Error('Validation failed');
      }
      return new this(result.data);
    }
  };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  FirmValidationPipe as ValidationPipe,
  FirmBody as Body,
  FirmQuery as Query,
  FirmParam as Param,
  FirmGuard as Guard,
  FirmResponseInterceptor as ResponseInterceptor,
  createDto as createDtoFromSchema,
};

/**
 * Default export for easy importing.
 */
export default {
  ValidationPipe: FirmValidationPipe,
  Body: FirmBody,
  Query: FirmQuery,
  Param: FirmParam,
  Guard: FirmGuard,
  ResponseInterceptor: FirmResponseInterceptor,
  createDto: createDto,
  Module: FirmModule,
};