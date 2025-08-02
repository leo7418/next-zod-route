import { ZodType } from 'zod';

/**
 * Function that is called when the route handler is executed and all the middleware has been executed
 * @param request - The request object
 * @param context - The context object
 * @returns The response from the route handler
 */
export type HandlerFunction<TParams, TQuery, TBody, TContext, TMetadata = unknown, TReturn = unknown> = (
  request: Request,
  context: { params: TParams; query: TQuery; body: TBody; ctx: TContext; metadata?: TMetadata },
) => TReturn | Response;

/**
 * Represents the merged context type between the existing context and new context added by middleware
 */
export type MiddlewareContext<TContext, TNewContext> = TContext & TNewContext;

/**
 * Function signature for the next() function in middleware
 * @param options - Optional configuration object
 * @returns Promise resolving to the response from the next middleware or handler
 */
export type NextFunction<TContext> = {
  <NC extends object = {}>(opts?: { ctx?: NC }): Promise<MiddlewareResult<NC & TContext>>;
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
export type MiddlewareFunction<
  TParams = unknown,
  TQuery = unknown,
  TBody = unknown,
  TContext = Record<string, unknown>,
  TNextContext = Record<string, unknown>,
  TMetadata = unknown,
> = (opts: {
  request: Request;
  params: TParams;
  query: TQuery;
  body: TBody;
  ctx: TContext;
  metadata?: TMetadata;
  next: NextFunction<TContext>;
}) => Promise<MiddlewareResult<TNextContext>>;

// Middleware should return a Response
// But in order to infer the context, we extends the response with the context
// This context is not really used and not really needed
export type MiddlewareResult<TContext> = Response & { ctx?: TContext };

/**
 * Configuration object for the RouteHandlerBuilder
 * @param paramsSchema - Schema for the route parameters
 * @param querySchema - Schema for the route query parameters
 * @param bodySchema - Schema for the route body
 */
export interface RouteHandlerBuilderConfig {
  paramsSchema: ZodType;
  querySchema: ZodType;
  bodySchema: ZodType;
}

/**
 * Original Next.js route handler type for reference
 * This is the type that Next.js uses internally before our library wraps it
 */
export type OriginalRouteHandler<TReturn> = (
  request: Request,
  context: { params: Promise<Record<string, unknown>> },
) => TReturn;

/**
 * Function that handles server errors in route handlers
 * @param error - The error that was thrown
 * @returns Response object with appropriate error details and status code
 */
export type HandlerServerErrorFn = (error: Error) => Response;

/**
 * Function that handles FormData parsing or transformation.
 * @param formData - The FormData object to process.
 * @returns The result of processing the FormData, typically a plain object or any transformed value.
 */
export type HandlerFormData = (formData: globalThis.FormData) => unknown;

export type OriginalRouteResponse<T> = Response & { json: () => Promise<T> };

/**
 * Utility type to extract the return type of a route handler
 */
export type RouteResponse<T> =
  T extends OriginalRouteHandler<infer R>
    ? Awaited<R> extends OriginalRouteResponse<infer R2>
      ? Awaited<R2>
      : Awaited<R>
    : never;
