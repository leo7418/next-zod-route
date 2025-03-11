<h1 align="center">next-zod-route</h1>

A fork from [next-safe-route](https://github.com/richardsolomou/next-safe-route) that uses [zod](https://github.com/colinhacks/zod) for schema validation.

<p align="center">
  <a href="https://www.npmjs.com/package/next-zod-route"><img src="https://img.shields.io/npm/v/next-zod-route?style=for-the-badge&logo=npm" /></a>
  <a href="https://github.com/melvynxdev/next-zod-route/actions/workflows/test.yaml"><img src="https://img.shields.io/github/actions/workflow/status/melvynxdev/next-zod-route/test.yaml?style=for-the-badge&logo=vitest" /></a>
  <a href="https://github.com/melvynxdev/next-zod-route/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/next-zod-route?style=for-the-badge" /></a>
</p>

`next-zod-route` is a utility library for Next.js that provides type-safety and schema validation for [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)/API Routes.

## Features

- **✅ Schema Validation:** Automatically validates request parameters, query strings, and body content with built-in error handling.
- **🧷 Type-Safe:** Works with full TypeScript type safety for parameters, query strings, and body content.
- **😌 Easy to Use:** Simple and intuitive API that makes defining route handlers a breeze.
- **🔄 Flexible Response Handling:** Return Response objects directly or return plain objects that are automatically converted to JSON responses.
- **🧪 Fully Tested:** Extensive test suite to ensure everything works reliably.
- **🔐 Enhanced Middleware System:** Powerful middleware system with pre/post handler execution, response modification, and context chaining.
- **🎯 Metadata Support:** Add and validate metadata for your routes with full type safety.
- **🛡️ Custom Error Handling:** Flexible error handling with custom error handlers for both middleware and route handlers.

## Installation

```sh
npm install next-zod-route zod
```

Or using your preferred package manager:

```sh
pnpm add next-zod-route zod
```

```sh
yarn add next-zod-route zod
```

## Usage

```ts
// app/api/hello/route.ts
import { createZodRoute } from 'next-zod-route';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string(),
});

const querySchema = z.object({
  search: z.string().optional(),
});

const bodySchema = z.object({
  field: z.string(),
});

const metadataSchema = z.object({
  permission: z.string(),
  role: z.enum(['admin', 'user']),
});

export const GET = createZodRoute()
  .params(paramsSchema)
  .query(querySchema)
  .defineMetadata(metadataSchema)
  .handler((request, context) => {
    const { id } = context.params;
    const { search } = context.query;
    const { permission, role } = context.metadata!;

    return Response.json({ id, search, permission, role }), { status: 200 };
  });

export const POST = createZodRoute()
  .params(paramsSchema)
  .query(querySchema)
  .body(bodySchema)
  .handler((request, context) => {
    // Next.js 15 use promise, but with .params we already unwrap the promise for you
    const { id } = context.params;
    const { search } = context.query;
    const { field } = context.body;

    return Response.json({ id, search, field }), { status: 200 };
  });
```

To define a route handler in Next.js:

1. Import `createZodRoute` and `zod`.
2. Define validation schemas for params, query, body, and metadata as needed.
3. Use `createZodRoute()` to create a route handler, chaining `params`, `query`, `body`, and `defineMetadata` methods.
4. Implement your handler function, accessing validated and type-safe params, query, body, and metadata through `context`.

## Supported Body Formats

`next-zod-route` supports multiple request body formats out of the box:

- **JSON:** Automatically parses and validates JSON bodies.
- **URL Encoded:** Supports `application/x-www-form-urlencoded` data.
- **Multipart Form Data:** Supports `multipart/form-data`, enabling file uploads and complex form data parsing.

The library automatically detects the content type and parses the body accordingly. For GET and DELETE requests, body parsing is skipped.

## Response Handling

You can return responses in two ways:

1. **Return a Response object directly:**

```ts
return Response.json({ data: 'value' }, { status: 200 });
```

2. **Return a plain object** that will be automatically converted to a JSON response with status 200:

```ts
return { data: 'value' };
```

## Advanced Usage

### Metadata

You can add metadata to your route handler with the `defineMetadata` method. Metadata is optional and can be used to add additional information to your route handler.

```ts
const metadataSchema = z.object({
  permission: z.string(),
  role: z.enum(['admin', 'user']),
});

export const GET = createZodRoute()
  .defineMetadata(metadataSchema)
  .handler((request, context) => {
    // Access metadata from context.metadata
    const { permission, role } = context.metadata!;

    return Response.json({ permission, role });
  });
```

When calling the route, you can pass metadata as part of the context:

```ts
// In your Next.js page/component
const response = await GET(request, {
  params: Promise.resolve({}),
  metadata: { permission: 'read', role: 'admin' },
});
```

Metadata is optional by default. If you define a metadata schema but don't provide metadata in the context, the handler will still work. If you provide metadata, it will be validated against the schema.

### Middleware

You can add middleware to your route handler with the `use` method. Middleware functions can add data to the context that will be available in your handler.

```ts
const loggingMiddleware = async ({ next }) => {
  console.log('Before handler');
  const startTime = performance.now();

  const response = await next();

  const endTime = performance.now();
  console.log(`After handler - took ${Math.round(endTime - startTime)}ms`);

  return response;
};

const authMiddleware = async ({ request, metadata, next }) => {
  try {
    // Get the token from the request headers
    const token = request.headers.get('authorization')?.split(' ')[1];

    // You can access metadata in middleware
    if (metadata?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    // Validate the token and get the user
    const user = await validateToken(token);

    // Add context & continue chain
    const response = await next({
      context: { user },
    });

    // You can modify the response after the handler
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-User-Id': user.id,
      },
    });
  } catch (error) {
    // Errors in middleware are caught and handled by the error handler
    throw error;
  }
};

const permissionsMiddleware = async ({ metadata, next }) => {
  // Metadata are optional and type-safe
  const response = await next({
    context: { permissions: metadata?.permissions ?? ['read'] },
  });
  return response;
};

export const GET = createZodRoute()
  .defineMetadata(
    z.object({
      role: z.enum(['admin', 'user']),
      permissions: z.array(z.string()).optional(),
    }),
  )
  .use(loggingMiddleware)
  .use(authMiddleware)
  .use(permissionsMiddleware)
  .handler((request, context) => {
    // Access middleware data from context.data
    const { user, permissions } = context.data;
    // Access metadata from context.metadata
    const { role } = context.metadata!;

    return Response.json({ user, permissions, role });
  });
```

Middleware functions receive:

- `request`: The request object
- `context`: The context object with data from previous middlewares
- `metadata`: The validated metadata object (optional)
- `next`: Function to continue the chain and add context

The middleware can:

1. Execute code before/after the handler
2. Modify the response
3. Add context data through the chain
4. Short-circuit the chain by returning a Response
5. Throw errors that will be caught by the error handler

### Middleware Features

#### Pre/Post Handler Execution

```ts
const timingMiddleware = async ({ next }) => {
  console.log('Starting request...');
  const start = performance.now();

  const response = await next();

  const duration = performance.now() - start;
  console.log(`Request took ${duration}ms`);

  return response;
};
```

#### Response Modification

```ts
const headerMiddleware = async ({ next }) => {
  const response = await next();

  return new Response(response.body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Custom': 'value',
    },
  });
};
```

#### Context Chaining

```ts
const middleware1 = async ({ next }) => {
  const response = await next({
    context: { value1: 'first' },
  });
  return response;
};

const middleware2 = async ({ context, next }) => {
  // Access previous context
  console.log(context.value1); // 'first'

  const response = await next({
    context: { value2: 'second' },
  });
  return response;
};
```

#### Early Returns

```ts
const authMiddleware = async ({ next }) => {
  const isAuthed = false;

  if (!isAuthed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
};
```

### Migration Guide (v0.2.0)

If you're upgrading from v0.1.x to v0.2.0, there are some changes to the middleware system:

#### Before (v0.1.x)

```typescript
const authMiddleware = async () => {
  return { user: { id: 'user-123' } };
};

const route = createZodRoute()
  .use(authMiddleware)
  .handler((req, ctx) => {
    const { user } = ctx.data;
    return { data: user.id };
  });
```

#### After (v0.2.0)

```typescript
const authMiddleware = async ({ next }) => {
  // Execute code before handler
  console.log('Checking auth...');

  // Add context & continue chain
  const response = await next({
    context: { user: { id: 'user-123' } },
  });

  // Modify response or execute code after
  return new Response(response.body, {
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-User-Id': 'user-123',
    },
  });
};

const route = createZodRoute()
  .use(authMiddleware)
  .handler((req, ctx) => {
    const { user } = ctx.data;
    return { data: user.id };
  });
```

Key changes in v0.2.0:

1. Middleware must now accept an object with `request`, `context`, `metadata`, and `next`
2. Context is passed explicitly via `next({ context: {...} })`
3. Middleware can execute code before and after the handler
4. Middleware can modify the response
5. Middleware can short-circuit by returning a Response
6. Error handling in middleware is now consistent with handler error handling

### Custom Error Handler

You can specify a custom error handler function to handle errors thrown in your route handler or middleware:

```ts
import { createZodRoute } from 'next-zod-route';

// Create a custom error class
class CustomError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

// Create a route with a custom error handler
const safeRoute = createZodRoute({
  handleServerError: (error: Error) => {
    if (error instanceof CustomError) {
      return new Response(JSON.stringify({ message: error.message }), { status: error.status });
    }

    // Default error response
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  },
});

export const GET = safeRoute
  .use(async () => {
    // This error will be caught by the custom error handler
    throw new CustomError('Middleware error', 400);
  })
  .handler((request, context) => {
    // This error will also be caught by the custom error handler
    throw new CustomError('Handler error', 400);
  });
```

By default, if no custom error handler is provided, the library will return a generic "Internal server error" message with a 500 status code to avoid information leakage.

## Validation Errors

When validation fails, the library returns appropriate error responses:

- Invalid params: `{ message: 'Invalid params' }` with status 400
- Invalid query: `{ message: 'Invalid query' }` with status 400
- Invalid body: `{ message: 'Invalid body' }` with status 400

## Tests

Tests are written using [Vitest](https://vitest.dev). To run the tests, use the following command:

```sh
pnpm test
```

## Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
