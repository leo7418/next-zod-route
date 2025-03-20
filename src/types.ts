/* eslint-disable @typescript-eslint/ban-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from 'zod';

export type HandlerFunction<TParams, TQuery, TBody, TContext, TMetadata = unknown> = (
  request: Request,
  context: { params: TParams; query: TQuery; body: TBody; data: TContext; metadata?: TMetadata },
) => any;

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
  <NC extends object = {}>(opts?: { context?: NC }): Promise<MiddlewareResult<NC & TContext>>;
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
  TContext = Record<string, unknown>,
  TNextContext = Record<string, unknown>,
  TMetadata = unknown,
> = (opts: {
  request: Request;
  context: TContext;
  metadata?: TMetadata;
  next: NextFunction<TContext>;
}) => Promise<MiddlewareResult<TNextContext>>;

// Middleware should return a Response
// But in order to infer the context, we extends the response with the context
// This context is not really used and not really needed
export type MiddlewareResult<TContext> = Response & { context?: TContext };

export interface RouteHandlerBuilderConfig {
  paramsSchema: Schema;
  querySchema: Schema;
  bodySchema: Schema;
}

export type OriginalRouteHandler = (request: Request, context: { params: Promise<Record<string, unknown>> }) => any;

export type HandlerServerErrorFn = (error: Error) => Response;
