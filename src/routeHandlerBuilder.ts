import type z from 'zod';

import type {
  HandlerFormData,
  HandlerFunction,
  HandlerServerErrorFn,
  MiddlewareFunction,
  MiddlewareResult,
  NextFunction,
  OriginalRouteHandler,
  OriginalRouteResponse,
} from './types';

/**
 * Minimal schema interface satisfied by both zod/v4 and zod/mini schemas.
 * The builder only needs safeParse() and output type inference.
 */
export type AnyZodSchema<TOutput = unknown> = {
  _zod: { output: TOutput };
  safeParse(
    data: unknown,
  ): { success: true; data: TOutput; error?: never } | { success: false; data?: never; error: { issues: unknown[] } };
};

/** Infer the output type of any schema compatible with AnyZodSchema. */
type SchemaOutput<T extends AnyZodSchema> = T['_zod']['output'];

export const defaultStatusMap = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 204,
} as const;

export type StatusMap = Partial<Record<string, number>>;

/**
 * Type of the middleware function passed to a safe action client.
 */
export type MiddlewareFn<TContext, TReturnType, TMetadata = unknown> = {
  (opts: { context: TContext; request: Request; metadata?: TMetadata }): Promise<TReturnType>;
};

export class InternalRouteHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalRouteHandlerError';
  }
}

export class RouteHandlerBuilder<
  TParams extends AnyZodSchema = AnyZodSchema,
  TQuery extends AnyZodSchema = AnyZodSchema,
  TBody extends AnyZodSchema = AnyZodSchema,
  TContext = {},
  TMetadata extends AnyZodSchema = AnyZodSchema,
> {
  readonly config: {
    paramsSchema: TParams;
    querySchema: TQuery;
    bodySchema: TBody;
    metadataSchema?: TMetadata;
  };

  readonly middlewares: Array<
    MiddlewareFunction<
      SchemaOutput<TParams>,
      SchemaOutput<TQuery>,
      SchemaOutput<TBody>,
      TContext,
      Record<string, unknown>,
      SchemaOutput<TMetadata>
    >
  >;

  readonly handleServerError?: HandlerServerErrorFn;
  readonly handleFormData?: HandlerFormData;
  readonly metadataValue?: SchemaOutput<TMetadata>;
  readonly contextType!: TContext;
  readonly statusMap: StatusMap;

  constructor({
    config = {
      paramsSchema: undefined as unknown as TParams,
      querySchema: undefined as unknown as TQuery,
      bodySchema: undefined as unknown as TBody,
      metadataSchema: undefined as unknown as TMetadata,
    },
    middlewares = [],
    handleServerError,
    handleFormData,
    contextType,
    metadataValue,
    statusMap,
  }: {
    config?: {
      paramsSchema: TParams;
      querySchema: TQuery;
      bodySchema: TBody;
      metadataSchema?: TMetadata;
    };
    middlewares?: Array<
      MiddlewareFunction<
        SchemaOutput<TParams>,
        SchemaOutput<TQuery>,
        SchemaOutput<TBody>,
        TContext,
        Record<string, unknown>,
        SchemaOutput<TMetadata>
      >
    >;
    handleServerError?: HandlerServerErrorFn;
    handleFormData?: HandlerFormData;
    contextType: TContext;
    metadataValue?: SchemaOutput<TMetadata>;
    statusMap?: StatusMap;
  }) {
    this.config = config;
    this.middlewares = middlewares;
    this.handleServerError = handleServerError;
    this.handleFormData = handleFormData;
    this.contextType = contextType;
    this.metadataValue = metadataValue;
    this.statusMap = { ...defaultStatusMap, ...statusMap };
  }

  /**
   * Define the schema for the params
   * @param schema - The schema for the params
   * @returns A new instance of the RouteHandlerBuilder
   */
  params<T extends AnyZodSchema>(schema: T): RouteHandlerBuilder<T, TQuery, TBody, TContext, TMetadata>;

  /**
   * Extend the existing params schema with additional fields
   * @param schema - A Zod object schema to merge with existing params
   * @param extend - Must be true to enable extend mode
   * @returns A new instance of the RouteHandlerBuilder
   * @example
   * ```ts
   * const userRoute = createZodRoute().params(z.object({ userId: z.string() }), true);
   * const orgRoute = userRoute.params(z.object({ organizationId: z.string() }), true);
   * // orgRoute now has both userId and organizationId
   * ```
   */
  params<T extends AnyZodSchema>(
    schema: T,
    extend: true,
  ): RouteHandlerBuilder<
    TParams extends z.ZodObject<infer TParamsRaw>
      ? T extends z.ZodObject<infer TRaw>
        ? z.ZodObject<TParamsRaw & TRaw>
        : T
      : T,
    TQuery,
    TBody,
    TContext,
    TMetadata
  >;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params(schema: AnyZodSchema, extend?: boolean): any {
    const baseSchema = this.config.paramsSchema as unknown as z.ZodObject | undefined;
    const additionalFields = schema as unknown as z.ZodObject;
    const finalSchema = extend && baseSchema ? baseSchema.extend(additionalFields.shape) : additionalFields;

    return new RouteHandlerBuilder({
      config: { ...this.config, paramsSchema: finalSchema },
      middlewares: this.middlewares as unknown as Array<
        MiddlewareFunction<
          SchemaOutput<typeof finalSchema>,
          SchemaOutput<TQuery>,
          SchemaOutput<TBody>,
          TContext,
          Record<string, unknown>,
          SchemaOutput<TMetadata>
        >
      >,
      handleServerError: this.handleServerError,
      handleFormData: this.handleFormData,
      contextType: this.contextType,
      metadataValue: this.metadataValue,
      statusMap: this.statusMap,
    });
  }

  /**
   * Define the schema for the query
   * @param schema - The schema for the query
   * @returns A new instance of the RouteHandlerBuilder
   */
  query<T extends AnyZodSchema>(schema: T) {
    return new RouteHandlerBuilder<TParams, T, TBody, TContext, TMetadata>({
      config: { ...this.config, querySchema: schema },
      middlewares: this.middlewares as unknown as Array<
        MiddlewareFunction<
          SchemaOutput<TParams>,
          SchemaOutput<T>,
          SchemaOutput<TBody>,
          TContext,
          Record<string, unknown>,
          SchemaOutput<TMetadata>
        >
      >,
      handleServerError: this.handleServerError,
      handleFormData: this.handleFormData,
      contextType: this.contextType,
      metadataValue: this.metadataValue,
      statusMap: this.statusMap,
    });
  }

  /**
   * Define the schema for the body
   * @param schema - The schema for the body
   * @returns A new instance of the RouteHandlerBuilder
   */
  body<T extends AnyZodSchema>(schema: T) {
    return new RouteHandlerBuilder<TParams, TQuery, T, TContext, TMetadata>({
      config: { ...this.config, bodySchema: schema },
      middlewares: this.middlewares as unknown as Array<
        MiddlewareFunction<
          SchemaOutput<TParams>,
          SchemaOutput<TQuery>,
          SchemaOutput<T>,
          TContext,
          Record<string, unknown>,
          SchemaOutput<TMetadata>
        >
      >,
      handleServerError: this.handleServerError,
      handleFormData: this.handleFormData,
      contextType: this.contextType,
      metadataValue: this.metadataValue,
      statusMap: this.statusMap,
    });
  }

  /**
   * Define the schema for the metadata
   * @param schema - The schema for the metadata
   * @returns A new instance of the RouteHandlerBuilder
   */
  defineMetadata<T extends AnyZodSchema>(schema: T) {
    return new RouteHandlerBuilder<TParams, TQuery, TBody, TContext, T>({
      config: { ...this.config, metadataSchema: schema },
      middlewares: [],
      handleServerError: this.handleServerError,
      handleFormData: this.handleFormData,
      contextType: this.contextType,
      metadataValue: undefined,
      statusMap: this.statusMap,
    });
  }

  /**
   * Set the metadata value for the route handler
   * @param value - The metadata value that will be passed to middlewares
   * @returns A new instance of the RouteHandlerBuilder
   */
  metadata(value: SchemaOutput<TMetadata>) {
    return new RouteHandlerBuilder<TParams, TQuery, TBody, TContext, TMetadata>({
      ...this,
      metadataValue: value,
    });
  }

  /**
   * Add a middleware to the route handler
   * @param middleware - The middleware function to be executed
   * @returns A new instance of the RouteHandlerBuilder
   */
  use<TNestContext extends Record<string, unknown>>(
    middleware: MiddlewareFunction<
      SchemaOutput<TParams>,
      SchemaOutput<TQuery>,
      SchemaOutput<TBody>,
      TContext,
      TNestContext,
      SchemaOutput<TMetadata>
    >,
  ) {
    return new RouteHandlerBuilder<TParams, TQuery, TBody, TContext & TNestContext, TMetadata>({
      ...this,
      middlewares: [...this.middlewares, middleware],
      contextType: {} as TContext & TNestContext,
    });
  }

  /**
   * Create the handler function that will be used by Next.js
   * @param handler - The handler function that will be called when the route is hit
   * @returns The original route handler that Next.js expects with the validation logic
   */
  handler<TReturn>(
    handler: HandlerFunction<
      SchemaOutput<TParams>,
      SchemaOutput<TQuery>,
      SchemaOutput<TBody>,
      TContext,
      SchemaOutput<TMetadata>,
      TReturn
    >,
  ): OriginalRouteHandler<Promise<OriginalRouteResponse<Awaited<TReturn>>>> {
    return async (request, context): Promise<OriginalRouteResponse<Awaited<TReturn>>> => {
      try {
        const url = new URL(request.url);
        let params: unknown = context?.params ? await context.params : {};
        let query: unknown = Object.fromEntries(
          [...url.searchParams.keys()].map((key) => {
            const values = url.searchParams.getAll(key);
            return values.length === 1 ? [key, values[0]] : [key, values];
          }),
        );
        let metadata = this.metadataValue;

        // Support both JSON and FormData parsing
        let body: unknown = {};
        if (request.method !== 'GET' && request.method !== 'DELETE') {
          try {
            const contentType = request.headers.get('content-type') || '';
            if (
              contentType.includes('multipart/form-data') ||
              contentType.includes('application/x-www-form-urlencoded')
            ) {
              const formData = await request.formData();
              body = this.handleFormData ? this.handleFormData(formData) : Object.fromEntries(formData.entries());
            } else {
              body = await request.json();
            }
          } catch (error) {
            if (this.config.bodySchema) {
              throw new InternalRouteHandlerError(JSON.stringify({ message: 'Invalid body', errors: error }));
            }
          }
        }

        // Validate the params against the provided schema
        if (this.config.paramsSchema) {
          const paramsResult = this.config.paramsSchema.safeParse(params);
          if (!paramsResult.success) {
            throw new InternalRouteHandlerError(
              JSON.stringify({ message: 'Invalid params', errors: paramsResult.error.issues }),
            );
          }
          params = paramsResult.data as Record<string, unknown>;
        }

        // Validate the query against the provided schema
        if (this.config.querySchema) {
          const queryResult = this.config.querySchema.safeParse(query);
          if (!queryResult.success) {
            throw new InternalRouteHandlerError(
              JSON.stringify({ message: 'Invalid query', errors: queryResult.error.issues }),
            );
          }
          query = queryResult.data;
        }

        // Validate the body against the provided schema
        if (this.config.bodySchema) {
          const bodyResult = this.config.bodySchema.safeParse(body);
          if (!bodyResult.success) {
            throw new InternalRouteHandlerError(
              JSON.stringify({ message: 'Invalid body', errors: bodyResult.error.issues }),
            );
          }
          body = bodyResult.data;
        }

        // Validate the metadata against the provided schema
        if (this.config.metadataSchema && metadata !== undefined) {
          const metadataResult = this.config.metadataSchema.safeParse(metadata);
          if (!metadataResult.success) {
            throw new InternalRouteHandlerError(
              JSON.stringify({ message: 'Invalid metadata', errors: metadataResult.error.issues }),
            );
          }
          metadata = metadataResult.data;
        }

        // Execute middleware chain
        let middlewareContext: TContext = {} as TContext;

        const executeMiddlewareChain = async (index: number): Promise<OriginalRouteResponse<Awaited<TReturn>>> => {
          if (index >= this.middlewares.length) {
            try {
              const result = await handler(request, {
                params: params as SchemaOutput<TParams>,
                query: query as SchemaOutput<TQuery>,
                body: body as SchemaOutput<TBody>,
                ctx: middlewareContext,
                metadata: metadata as SchemaOutput<TMetadata>,
              });

              if (result instanceof Response) return result as OriginalRouteResponse<Awaited<TReturn>>;

              const status = this.statusMap[request.method] ?? 200;

              return (
                status === 204
                  ? new Response(null, { status: 204 })
                  : new Response(JSON.stringify(result), {
                      status,
                      headers: { 'Content-Type': 'application/json' },
                    })
              ) as OriginalRouteResponse<Awaited<TReturn>>;
            } catch (error) {
              return handleError(error as Error, this.handleServerError);
            }
          }

          const middleware = this.middlewares[index];
          if (!middleware) return executeMiddlewareChain(index + 1);

          const next: NextFunction<TContext> = async (options = {}) => {
            if (options.ctx) {
              middlewareContext = { ...middlewareContext, ...options.ctx };
            }
            const result = await executeMiddlewareChain(index + 1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return result as MiddlewareResult<any>;
          };

          try {
            const result = await middleware({
              request,
              params: params as SchemaOutput<TParams>,
              query: query as SchemaOutput<TQuery>,
              body: body as SchemaOutput<TBody>,
              ctx: middlewareContext,
              metadata,
              next,
            });

            if (result instanceof Response) return result as OriginalRouteResponse<Awaited<TReturn>>;

            middlewareContext = { ...middlewareContext };
            return result;
          } catch (error) {
            return handleError(error as Error, this.handleServerError);
          }
        };

        return executeMiddlewareChain(0);
      } catch (error) {
        return handleError(error as Error, this.handleServerError);
      }
    };
  }
}

const handleError = <TReturn>(
  error: Error,
  handleServerError?: HandlerServerErrorFn,
): OriginalRouteResponse<Awaited<TReturn>> => {
  if (error instanceof InternalRouteHandlerError) {
    return new Response(error.message, { status: 400 }) as OriginalRouteResponse<Awaited<TReturn>>;
  }

  if (handleServerError) {
    return handleServerError(error as Error) as OriginalRouteResponse<Awaited<TReturn>>;
  }

  return new Response(JSON.stringify({ message: 'Internal server error' }), {
    status: 500,
  }) as OriginalRouteResponse<Awaited<TReturn>>;
};
