# Probot Framework-Agnostic Refactoring

## Overview

This refactoring removes Probot's tight coupling with Express.js and introduces a framework-agnostic architecture that supports multiple HTTP frameworks through adapters.

## Architecture Changes

### 1. Framework-Agnostic Types (`src/types.ts`)

New interfaces that abstract HTTP framework specifics:

```typescript
interface HttpRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[]>;
  body?: any;
  query?: Record<string, string | string[]>;
  params?: Record<string, string>;
}

interface HttpResponse {
  status(code: number): HttpResponse;
  header(name: string, value: string): HttpResponse;
  json(data: any): HttpResponse;
  text(data: string): HttpResponse;
  end(): HttpResponse;
}

interface HttpRouter {
  get(path: string, handler: HttpHandler): void;
  post(path: string, handler: HttpHandler): void;
  // ... other HTTP methods
}

interface HttpAdapter {
  createRouter(): HttpRouter;
  middleware(handler: HttpHandler): any;
  static(path: string, directory: string): any;
}
```

### 2. HTTP Adapters

#### Express Adapter (`src/adapters/express.ts`)

Maintains backward compatibility by wrapping Express.js:

```typescript
export class ExpressAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    const router = Router();
    return new ExpressRouter(router);
  }

  middleware(handler: HttpHandler): any {
    return (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      return handler(adaptedReq, adaptedRes, next);
    };
  }

  // ... request/response adaptation logic
}
```

#### Hono Adapter (`src/adapters/hono.ts`)

Adds support for the modern Hono framework:

```typescript
export class HonoAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    const app = new Hono();
    return new HonoRouter(app);
  }

  // ... Hono-specific adaptation logic
}
```

### 3. Updated Server Class (`src/server/server.ts`)

The Server class now accepts an adapter parameter:

```typescript
export class Server {
  constructor(options: ServerOptions = {} as ServerOptions) {
    const adapter = options.adapter || new ExpressAdapter();

    this.state = {
      // ... other state
      adapter,
    };

    // Uses adapter for framework-agnostic operations
  }

  public router(path: string = "/"): HttpRouter {
    return this.state.adapter.createRouter();
  }
}
```

### 4. Updated Application Function Options

Application functions now receive framework-agnostic routers:

```typescript
export type ApplicationFunctionOptions = {
  getRouter?: (path?: string) => HttpRouter; // Was express.Router
  cwd?: string;
  [key: string]: unknown;
};
```

## Key Benefits

### 1. **Framework Independence**

- Core Probot logic no longer depends on Express
- Can be used with any HTTP framework through adapters
- Easier to test and maintain

### 2. **Backward Compatibility**

- Existing Probot apps work without changes
- Express remains the default adapter
- Gradual migration path available

### 3. **Extensibility**

- New HTTP frameworks can be added via adapters
- Custom adapters for specific use cases
- Future-proof architecture

### 4. **Better Separation of Concerns**

- HTTP framework concerns separated from GitHub App logic
- Domain objects are framework-agnostic
- Cleaner, more maintainable codebase

## Usage Examples

### Express (Default)

```javascript
import { Server } from "probot";
import { ExpressAdapter } from "probot/adapters/express";

const server = new Server({
  Probot: Probot,
  adapter: new ExpressAdapter(), // Optional - this is the default
});
```

### Hono

```javascript
import { Server } from "probot";
import { HonoAdapter } from "probot/adapters/hono";

const server = new Server({
  Probot: Probot,
  adapter: new HonoAdapter(),
});
```

### Custom Adapter

```javascript
class CustomAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    // Implement your framework's router
  }

  middleware(handler: HttpHandler): any {
    // Adapt framework-agnostic handler to your framework
  }

  static(path: string, directory: string): any {
    // Implement static file serving
  }
}
```

## Migration Guide

### For Existing Apps

No changes required - existing Probot apps continue to work with the Express adapter as default.

### For New Apps

Consider using the framework-agnostic APIs:

```javascript
// Framework-agnostic approach
const app = (probot, { getRouter }) => {
  const router = getRouter();

  router.get("/webhook", (req, res) => {
    res.json({ message: "Framework-agnostic!" });
  });
};
```

## Testing

The refactoring includes comprehensive tests that verify:

- Adapter interface compliance
- Request/response adaptation
- Router functionality
- Backward compatibility
- Integration with existing Probot features

## Future Enhancements

1. **Additional Adapters**: Fastify, Koa, etc.
2. **Middleware System**: Framework-agnostic middleware
3. **WebSocket Support**: Via adapter extensions
4. **Performance Optimizations**: Framework-specific optimizations

## Files Modified

- `src/types.ts` - Added framework-agnostic types
- `src/adapters/express.ts` - Express adapter implementation
- `src/adapters/hono.ts` - Hono adapter implementation
- `src/server/server.ts` - Updated to use adapters
- `src/get-router.ts` - Updated for framework-agnostic routing
- `src/create-node-middleware.ts` - Updated for adapter support

## Conclusion

This refactoring successfully decouples Probot from Express while maintaining full backward compatibility. The new architecture is more flexible, testable, and future-proof, supporting multiple HTTP frameworks through a clean adapter pattern.
