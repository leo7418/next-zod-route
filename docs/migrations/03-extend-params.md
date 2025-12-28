# params() extend parameter - Nested Route Support

## Overview

The `params()` method with `extend: true` allows you to build a hierarchy of route handlers for nested routes without having to redeclare all parameters at each level.

## Problem

Previously, when creating nested routes, you had to redeclare all parent parameters at each level:

```typescript
// ❌ Old approach - repetitive
const userRoute = createZodRoute().params(
  z.object({
    userId: z.string().uuid(),
  }),
);

const userOrgRoute = userRoute.params(
  z.object({
    userId: z.string().uuid(), // Redeclared
    organizationId: z.string().uuid(),
  }),
);

const userOrgProjectRoute = userOrgRoute.params(
  z.object({
    userId: z.string().uuid(), // Redeclared again
    organizationId: z.string().uuid(), // Redeclared again
    projectId: z.string().uuid(),
  }),
);
```

## Solution

Use `params(z.object({...}), true)` to extend the existing parameter schema:

```typescript
// ✅ New approach - composable
const userRoute = createZodRoute().params(
  z.object({
    userId: z.string().uuid(),
  }),
  true,
);

const userOrgRoute = userRoute.params(
  z.object({
    organizationId: z.string().uuid(),
  }),
  true,
);
// Now has both userId and organizationId

const userOrgProjectRoute = userOrgRoute.params(
  z.object({
    projectId: z.string().uuid(),
  }),
  true,
);
// Now has userId, organizationId, and projectId
```

## Usage

### Basic Example

```typescript
import { createZodRoute } from 'next-zod-route';
import { z } from 'zod/v4';

// Parent route: /users/{userId}
const userRouteHandler = createZodRoute().params(
  z.object({
    userId: z.string().uuid(),
  }),
  true,
);

export const GET = userRouteHandler.handler(async (request, { params }) => {
  const { userId } = params;
  return Response.json({ userId });
});
```

### Nested Routes

```typescript
// Child route: /users/{userId}/organizations/{organizationId}
const orgRouteHandler = userRouteHandler.params(
  z.object({
    organizationId: z.string().uuid(),
  }),
  true,
);

export const GET = orgRouteHandler.handler(async (request, { params }) => {
  const { userId, organizationId } = params;
  // Both params are available and validated
  return Response.json({ userId, organizationId });
});
```

### Combining with Other Validations

You can still add query, body, and middleware to extended routes:

```typescript
const projectRouteHandler = orgRouteHandler
  .params(
    z.object({
      projectId: z.string().uuid(),
    }),
    true,
  )
  .query(
    z.object({
      includeArchived: z.boolean().optional(),
    }),
  )
  .body(
    z.object({
      name: z.string(),
      description: z.string().optional(),
    }),
  );

export const POST = projectRouteHandler.handler(async (request, { params, query, body }) => {
  const { userId, organizationId, projectId } = params;
  const { includeArchived } = query;
  const { name, description } = body;

  // All validated and type-safe
  return Response.json({ success: true });
});
```

## Benefits

1. **DRY Principle**: Don't repeat parameter definitions across nested routes
2. **Type Safety**: TypeScript automatically infers all parameters from the chain
3. **Validation**: All parameters (both inherited and new) are validated
4. **Composability**: Build route handlers incrementally for your route hierarchy
5. **Maintainability**: Change parent route params in one place, children inherit automatically

## API

### `params<T extends z.ZodType>(schema: T, extend: true)`

Extends the existing params schema with additional fields.

**Parameters:**

- `schema`: A Zod object schema (e.g., `z.object({ ... })`)
- `extend`: Must be `true` to enable extend mode

**Returns:**

- A new `RouteHandlerBuilder` instance with the merged params schema

**Behavior:**

- If there's no existing params schema, creates a new one with the provided fields
- If there's an existing params schema, merges the new fields with the existing ones
- All parameters are validated when the route handler is invoked

## Examples

See the full example in `examples/nested-routes.ts`

## Migration Guide

If you're currently using the `.params()` method for nested routes:

1. Identify your route hierarchy
2. Create a base route handler for the topmost route
3. Use `.params(..., true)` for each nested level
4. Remove duplicate parameter definitions

Before:

```typescript
const userRoute = createZodRoute().params(z.object({ userId: z.string() }));
const orgRoute = createZodRoute().params(z.object({ userId: z.string(), orgId: z.string() }));
```

After:

```typescript
const userRoute = createZodRoute().params(z.object({ userId: z.string() }), true);
const orgRoute = userRoute.params(z.object({ orgId: z.string() }), true);
```
