# Migration Guide: Upgrading to Zod v4

## Overview

Zod v4 brings significant performance improvements and API improvements to the validation library that `next-zod-route` depends on. This migration guide will help you upgrade your existing applications using `next-zod-route` to take advantage of Zod v4's benefits.

## Why Upgrade?

### Performance Improvements
- **3x faster parsing** overall
- **57% smaller bundle size**
- **20x reduction** in TypeScript compiler instantiations (from ~25,000 to ~175)
- **14.71x faster** string parsing

### Quality of Life Improvements
- Unified error customization APIs
- Better handling of object defaults
- Improved type safety and developer experience
- Enhanced validation performance

## Prerequisites

Before upgrading, ensure you have:
- `next-zod-route` version that supports Zod v4 (check latest releases)
- Node.js 18+ (recommended)
- A working test suite to verify migration success

## Installation Steps

### Step 1: Update Dependencies

```bash
# Install Zod v4
npm install zod@^4.0.0

# Or with yarn
yarn add zod@^4.0.0

# Or with pnpm  
pnpm add zod@^4.0.0
```

### Step 2: Update next-zod-route

Ensure you're using a version of `next-zod-route` that supports Zod v4:

```bash
npm install next-zod-route@latest
```

## Migration Approach

Zod v4 uses a **subpath versioning strategy** that allows incremental migration. You can use both versions simultaneously during migration:

```typescript
// You can import both versions if needed during migration
import * as z3 from "zod/v3"  // Zod v3 (legacy)
import * as z4 from "zod/v4"  // Zod v4 (new)
```

However, for new projects or clean migrations, use:

```typescript
import { z } from "zod"  // Zod v4 (recommended)
```

## Breaking Changes & Migration

### 1. Import Statements

#### Before (Zod v3)
```typescript
import { z } from 'zod';
```

#### After (Zod v4)
```typescript
// Recommended for new code
import { z } from 'zod';

// Or explicit v4 import during migration
import { z } from 'zod/v4';
```

### 2. Error Customization

#### Before (Zod v3)
```typescript
const schema = z.string({
  message: "Invalid string",
  invalid_type_error: "Must be a string",
  required_error: "This field is required"
});
```

#### After (Zod v4)
```typescript
const schema = z.string({
  error: "Invalid string"  // Unified error parameter
});

// Or more specific error handling
const schema = z.string().describe("Must be a valid string");
```

### 3. String Validation Changes

#### Before (Zod v3)
```typescript
const schema = z.object({
  id: z.string().uuid(),
  email: z.string().email()
});
```

#### After (Zod v4)
```typescript
const schema = z.object({
  id: z.uuid(),  // Direct UUID validator (more efficient)
  email: z.string().email()  // Email validation still works
});
```

### 4. Object Schema Defaults

#### Before (Zod v3)
```typescript
const schema = z.object({
  name: z.string(),
  age: z.number().optional().default(0)  // Default not applied in optional
});
```

#### After (Zod v4)
```typescript
const schema = z.object({
  name: z.string(), 
  age: z.number().optional().default(0)  // Default now properly applied!
});
```

## next-zod-route Specific Migration

### Route Handler Updates

Your existing `next-zod-route` code should work without changes, but you can optimize it:

#### Before (with Zod v3)
```typescript
import { createZodRoute } from 'next-zod-route';
import { z } from 'zod';

const route = createZodRoute()
  .input({
    body: z.object({
      id: z.string().uuid(),
      name: z.string().min(1, { message: "Name is required" })
    })
  })
  .handler(async (request, { input }) => {
    return Response.json({ success: true, data: input.body });
  });

export { route as POST };
```

#### After (with Zod v4)
```typescript
import { createZodRoute } from 'next-zod-route';
import { z } from 'zod';

const route = createZodRoute()
  .input({
    body: z.object({
      id: z.uuid(),  // More efficient UUID validation
      name: z.string().min(1, { error: "Name is required" })  // Unified error param
    })
  })
  .handler(async (request, { input }) => {
    return Response.json({ success: true, data: input.body });
  });

export { route as POST };
```

### Middleware Updates

Middleware code generally doesn't need changes, but error handling can be improved:

```typescript
import { type MiddlewareFunction } from 'next-zod-route';
import { z } from 'zod';

const validationMiddleware: MiddlewareFunction = async ({ request, next }) => {
  try {
    const userSchema = z.object({
      userId: z.uuid(),  // Updated for v4 efficiency
      role: z.enum(['admin', 'user'], { error: "Invalid role" })
    });
    
    // Your validation logic
    const userData = userSchema.parse(await request.json());
    
    return next({ ctx: { user: userData } });
  } catch (error) {
    return Response.json({ error: 'Validation failed' }, { status: 400 });
  }
};
```

## Automated Migration Tools

### 1. Official Codemod (Recommended)

```bash
# Install the community codemod
npx zod-v3-to-v4@latest src/

# Or install globally
npm install -g zod-v3-to-v4
zod-v3-to-v4 src/
```

### 2. Codemod.com Tool

Visit [https://docs.codemod.com/guides/migrations/zod-3-4](https://docs.codemod.com/guides/migrations/zod-3-4) for an automated migration experience.

### 3. Manual Migration Checklist

- [ ] Update import statements
- [ ] Replace `message` with `error` in schema definitions
- [ ] Remove `invalid_type_error` and `required_error` parameters
- [ ] Update string validation methods (`.uuid()` → `z.uuid()`)
- [ ] Review object default behaviors
- [ ] Update error handling code
- [ ] Test all validation logic

## Testing Your Migration

### 1. Run Your Test Suite

```bash
npm test
# or
yarn test
# or  
pnpm test
```

### 2. Check for Common Issues

Run these commands to identify potential issues:

```bash
# Check for deprecated imports
grep -r "zod/v3" src/

# Look for old error parameters
grep -r "invalid_type_error\|required_error" src/

# Find old message parameters
grep -r "message:" src/ | grep -v "console\|log"
```

### 3. Verify Performance

You should notice:
- Faster TypeScript compilation
- Smaller bundle sizes
- Improved runtime validation performance

## Compatibility Matrix

| next-zod-route Version | Zod v3 Support | Zod v4 Support | Recommended |
|------------------------|---------------|----------------|-------------|
| < 0.2.0               | ✅             | ❌              | Upgrade     |
| 0.2.0 - 0.2.6         | ✅             | ⚠️ Partial      | Test carefully |
| 0.3.0+                | ✅             | ✅              | ✅ Use this  |

## Troubleshooting

### Common Issues

1. **TypeScript Errors After Upgrade**
   ```bash
   # Clear TypeScript cache
   rm -rf node_modules/.cache
   npx tsc --build --clean
   ```

2. **Bundle Size Issues**
   - Ensure you're not importing both Zod versions
   - Check your bundler configuration
   - Use tree-shaking optimizations

3. **Runtime Validation Errors**
   - Review schema definitions for breaking changes
   - Check error handling logic
   - Verify default value behaviors

### Getting Help

- Check the [official Zod v4 changelog](https://zod.dev/v4/changelog)
- Review [next-zod-route issues](https://github.com/Melvynx/next-zod-route/issues)
- Join the discussion in our [GitHub Discussions](https://github.com/Melvynx/next-zod-route/discussions)

## Rollback Plan

If you encounter issues, you can temporarily rollback:

```bash
# Install Zod v3
npm install zod@^3.23.8

# Update imports back to v3 if needed
# Find and replace "zod/v4" with "zod"
```

## Best Practices for v4

1. **Use Direct Validators**: Prefer `z.uuid()` over `z.string().uuid()`
2. **Unified Error Handling**: Use the `error` parameter consistently
3. **Leverage Performance**: Take advantage of improved parsing speeds
4. **Test Thoroughly**: Ensure all validation logic works as expected
5. **Monitor Bundle Size**: Verify the improved bundle size in your builds

## Next Steps

Once migrated successfully:

1. Update your documentation to reflect Zod v4 usage
2. Consider leveraging new v4-specific features
3. Monitor performance improvements in production
4. Share your experience with the community

## Resources

- [Zod v4 Official Documentation](https://zod.dev/v4)
- [Zod v4 Changelog](https://zod.dev/v4/changelog)
- [Migration Codemod](https://github.com/nicoespeon/zod-v3-to-v4)
- [next-zod-route Repository](https://github.com/Melvynx/next-zod-route)

---

**Need help?** Open an issue on [GitHub](https://github.com/Melvynx/next-zod-route/issues) with your migration questions.