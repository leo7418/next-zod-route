import * as z from 'zod';
import z__default, { ZodType } from 'zod';
import * as zod_v4_core_schemas_cjs from 'zod/v4/core/schemas.cjs';

/**
 * Function that is called when the route handler is executed and all the middleware has been executed
 * @param request - The request object
 * @param context - The context object
 * @returns The response from the route handler
 */
type HandlerFunction<TParams, TQuery, TBody, TContext, TMetadata = unknown, TReturn = unknown> = (request: Request, context: {
    params: TParams;
    query: TQuery;
    body: TBody;
    ctx: TContext;
    metadata?: TMetadata;
}) => TReturn | Response;
/**
 * Function signature for the next() function in middleware
 * @param options - Optional configuration object
 * @returns Promise resolving to the response from the next middleware or handler
 */
type NextFunction<TContext> = {
    <NC extends object = {}>(opts?: {
        ctx?: NC;
    }): Promise<MiddlewareResult<NC & TContext>>;
};
/**
 * Middleware function that can:
 * 1. Execute code before/after the handler
 * 2. Modify the response
 * 3. Add context data that will be available to subsequent middleware and the handler
 * 4. Short-circuit the middleware chain by returning a Response
 *
 * Type parameters:
 * - TContext: The type of the existing context
 * - TNewContext: The type of additional context this middleware adds
 * - TMetadata: The type of metadata available to the middleware
 *
 * @param opts - Configuration object for the middleware
 *
 * @returns Promise resolving to either additional context or a Response to short-circuit
 */
type MiddlewareFunction<TParams = unknown, TQuery = unknown, TBody = unknown, TContext = Record<string, unknown>, TNextContext = Record<string, unknown>, TMetadata = unknown> = (opts: {
    request: Request;
    params: TParams;
    query: TQuery;
    body: TBody;
    ctx: TContext;
    metadata?: TMetadata;
    next: NextFunction<TContext>;
}) => Promise<MiddlewareResult<TNextContext>>;
type MiddlewareResult<TContext> = Response & {
    ctx?: TContext;
};
/**
 * Configuration object for the RouteHandlerBuilder
 * @param paramsSchema - Schema for the route parameters
 * @param querySchema - Schema for the route query parameters
 * @param bodySchema - Schema for the route body
 */
interface RouteHandlerBuilderConfig {
    paramsSchema: ZodType;
    querySchema: ZodType;
    bodySchema: ZodType;
}
/**
 * Original Next.js route handler type for reference
 * This is the type that Next.js uses internally before our library wraps it
 */
type OriginalRouteHandler<TReturn> = (request: Request, context: {
    params: Promise<Record<string, unknown>>;
}) => TReturn;
/**
 * Function that handles server errors in route handlers
 * @param error - The error that was thrown
 * @returns Response object with appropriate error details and status code
 */
type HandlerServerErrorFn = (error: Error) => Response;
/**
 * Function that handles FormData parsing or transformation.
 * @param formData - The FormData object to process.
 * @returns The result of processing the FormData, typically a plain object or any transformed value.
 */
type HandlerFormData = (formData: globalThis.FormData) => unknown;
type OriginalRouteResponse<T> = Response & {
    json: () => Promise<T>;
};
/**
 * Utility type to extract the return type of a route handler
 */
type RouteResponse<T> = T extends OriginalRouteHandler<infer R> ? Awaited<R> extends OriginalRouteResponse<infer R2> ? Awaited<R2> : Awaited<R> : never;

declare class RouteHandlerBuilder<TParams extends z__default.ZodType = z__default.ZodType, TQuery extends z__default.ZodType = z__default.ZodType, TBody extends z__default.ZodType = z__default.ZodType, TContext = {}, TMetadata extends z__default.ZodType = z__default.ZodType> {
    readonly config: {
        paramsSchema: TParams;
        querySchema: TQuery;
        bodySchema: TBody;
        metadataSchema?: TMetadata;
    };
    readonly middlewares: Array<MiddlewareFunction<z__default.output<TParams>, z__default.output<TQuery>, z__default.output<TBody>, TContext, Record<string, unknown>, z__default.output<TMetadata>>>;
    readonly handleServerError?: HandlerServerErrorFn;
    readonly handleFormData?: HandlerFormData;
    readonly metadataValue?: z__default.output<TMetadata>;
    readonly contextType: TContext;
    constructor({ config, middlewares, handleServerError, handleFormData, contextType, metadataValue, }: {
        config?: {
            paramsSchema: TParams;
            querySchema: TQuery;
            bodySchema: TBody;
            metadataSchema?: TMetadata;
        };
        middlewares?: Array<MiddlewareFunction<z__default.output<TParams>, z__default.output<TQuery>, z__default.output<TBody>, TContext, Record<string, unknown>, z__default.output<TMetadata>>>;
        handleServerError?: HandlerServerErrorFn;
        handleFormData?: HandlerFormData;
        contextType: TContext;
        metadataValue?: z__default.output<TMetadata>;
    });
    /**
     * Define the schema for the params
     * @param schema - The schema for the params
     * @returns A new instance of the RouteHandlerBuilder
     */
    params<T extends z__default.ZodType>(schema: T): RouteHandlerBuilder<T, TQuery, TBody, TContext, TMetadata>;
    /**
     * Define the schema for the query
     * @param schema - The schema for the query
     * @returns A new instance of the RouteHandlerBuilder
     */
    query<T extends z__default.ZodType>(schema: T): RouteHandlerBuilder<TParams, T, TBody, TContext, TMetadata>;
    /**
     * Define the schema for the body
     * @param schema - The schema for the body
     * @returns A new instance of the RouteHandlerBuilder
     */
    body<T extends z__default.ZodType>(schema: T): RouteHandlerBuilder<TParams, TQuery, T, TContext, TMetadata>;
    /**
     * Define the schema for the metadata
     * @param schema - The schema for the metadata
     * @returns A new instance of the RouteHandlerBuilder
     */
    defineMetadata<T extends z__default.ZodType>(schema: T): RouteHandlerBuilder<TParams, TQuery, TBody, TContext, T>;
    /**
     * Set the metadata value for the route handler
     * @param value - The metadata value that will be passed to middlewares
     * @returns A new instance of the RouteHandlerBuilder
     */
    metadata(value: z__default.output<TMetadata>): RouteHandlerBuilder<TParams, TQuery, TBody, TContext, TMetadata>;
    /**
     * Add a middleware to the route handler
     * @param middleware - The middleware function to be executed
     * @returns A new instance of the RouteHandlerBuilder
     */
    use<TNestContext extends Record<string, unknown>>(middleware: MiddlewareFunction<z__default.output<TParams>, z__default.output<TQuery>, z__default.output<TBody>, TContext, TNestContext, z__default.output<TMetadata>>): RouteHandlerBuilder<TParams, TQuery, TBody, TContext & TNestContext, TMetadata>;
    /**
     * Create the handler function that will be used by Next.js
     * @param handler - The handler function that will be called when the route is hit
     * @returns The original route handler that Next.js expects with the validation logic
     */
    handler<TReturn>(handler: HandlerFunction<z__default.output<TParams>, z__default.output<TQuery>, z__default.output<TBody>, TContext, z__default.output<TMetadata>, TReturn>): OriginalRouteHandler<Promise<OriginalRouteResponse<TReturn>>>;
}

declare function createZodRoute(params?: {
    handleServerError?: HandlerServerErrorFn;
    handleFormData?: HandlerFormData;
}): RouteHandlerBuilder<z.ZodType<unknown, unknown, zod_v4_core_schemas_cjs.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, zod_v4_core_schemas_cjs.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, zod_v4_core_schemas_cjs.$ZodTypeInternals<unknown, unknown>>, {}, z.ZodType<unknown, unknown, zod_v4_core_schemas_cjs.$ZodTypeInternals<unknown, unknown>>>;

export { type HandlerFunction, type MiddlewareFunction, RouteHandlerBuilder, type RouteHandlerBuilderConfig, type RouteResponse, createZodRoute };
