# Probot Dependency Injection Architecture

## Overview

This document describes the complete dependency injection (DI) architecture refactoring of Probot, making it truly framework-agnostic and runtime-independent while supporting serverless environments like Cloudflare Workers.

## Architecture Principles

### 1. **Dependency Injection First**
- All components are injectable and testable
- No hard dependencies between modules
- Runtime-specific implementations
- Configuration-driven behavior

### 2. **Runtime Independence**
- Supports Node.js, Bun, Cloudflare Workers, and more
- Automatic runtime detection
- Platform-specific optimizations
- Serverless-friendly design

### 3. **Framework Agnostic**
- HTTP framework adapters (Express, Hono, Cloudflare Workers)
- Unified HTTP abstraction layer
- Pluggable adapter system
- Consistent API across frameworks

## Core Components

### Dependency Injection Container (`src/di/`)

#### Service Types (`src/di/types.ts`)
```typescript
export const TYPES = {
  Logger: Symbol.for('Logger'),
  Cache: Symbol.for('Cache'),
  WebhookHandler: Symbol.for('WebhookHandler'),
  HttpAdapter: Symbol.for('HttpAdapter'),
  HttpServer: Symbol.for('HttpServer'),
  OctokitFactory: Symbol.for('OctokitFactory'),
  AuthService: Symbol.for('AuthService'),
  Config: Symbol.for('Config'),
  RuntimeEnvironment: Symbol.for('RuntimeEnvironment'),
  // ... more services
};
```

#### Service Interfaces (`src/di/interfaces.ts`)
```typescript
export interface ILogger extends Logger {}
export interface ICache extends LRUCache<number, string> {}
export interface IWebhookHandler {
  on(event: string, handler: Function): void;
  receive(event: WebhookEvent): Promise<void>;
}
// ... more interfaces
```

#### Container Factory (`src/di/container.ts`)
```typescript
export function createContainer(): Container {
  const container = new Container();
  // Register services...
  return container;
}
```

### Core Services (`src/core/`)

#### ProbotCore (`src/core/probot-di.ts`)
```typescript
@injectable()
export class ProbotCore {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfigService,
    @inject(TYPES.WebhookHandler) private webhookHandler: IWebhookHandler,
    // ... other dependencies
  ) {}
  
  public on = (event: string, handler: Function) => {
    this.webhookHandler.on(event, handler);
  };
  
  public async receive(event: WebhookEvent): Promise<void> {
    return this.webhookHandler.receive(event);
  }
}
```

#### ServerCore (`src/core/server-di.ts`)
```typescript
@injectable()
export class ServerCore {
  constructor(
    @inject(TYPES.HttpAdapter) private httpAdapter: HttpAdapter,
    @inject(TYPES.HttpServer) private httpServer: IHttpServer,
    @inject(TYPES.RuntimeEnvironment) private runtime: IRuntimeEnvironment,
    // ... other dependencies
  ) {}
  
  async start(): Promise<void> {
    if (!this.runtime.isServerless()) {
      await this.httpServer.start();
    }
  }
}
```

### HTTP Adapters (`src/adapters/`)

#### Express Adapter (`src/adapters/express.ts`)
```typescript
export class ExpressAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    return new ExpressRouter(Router());
  }
  
  middleware(handler: HttpHandler): any {
    return (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      return handler(adaptedReq, adaptedRes, next);
    };
  }
}
```

#### Hono Adapter (`src/adapters/hono.ts`)
```typescript
export class HonoAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    return new HonoRouter(new Hono());
  }
  
  middleware(handler: HttpHandler): any {
    return async (c: Context, next: () => Promise<void>) => {
      const adaptedReq = await this.adaptRequest(c.req, c);
      const adaptedRes = this.adaptResponse(c);
      await handler(adaptedReq, adaptedRes, next);
    };
  }
}
```

#### Cloudflare Workers Adapter (`src/adapters/cloudflare-workers.ts`)
```typescript
export class CloudflareWorkersAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    return new CloudflareWorkersRouter();
  }
  
  middleware(handler: HttpHandler): any {
    return async (request: Request, env: any, ctx: any) => {
      const adaptedReq = await this.adaptRequest(request);
      const adaptedRes = new CloudflareWorkersResponse();
      await handler(adaptedReq, adaptedRes, () => {});
      return adaptedRes.toResponse();
    };
  }
}
```

### Runtime Implementations (`src/runtime/`)

#### Node.js Runtime (`src/runtime/node.ts`)
```typescript
export function createProbotNode(options = {}) {
  const container = createNodeContainer();
  
  // Configure options
  const config = container.get<IConfigService>(TYPES.Config);
  Object.entries(options).forEach(([key, value]) => {
    config.set(key, value);
  });
  
  const probot = container.get<ProbotCore>(ProbotCore);
  const server = container.get<ServerCore>(ServerCore);
  
  return { probot, server };
}
```

#### Bun Runtime (`src/runtime/bun.ts`)
```typescript
export function createProbotBun(options = {}) {
  const container = createBunContainer();
  // Similar setup with Bun-specific services
  return { probot, server };
}
```

#### Cloudflare Workers Runtime (`src/runtime/cloudflare-workers.ts`)
```typescript
export function createProbotCloudflareWorkers(options = {}) {
  const container = createCloudflareWorkersContainer();
  // Serverless-specific setup
  return { probot, server };
}

export function createCloudflareWorkersHandler(options = {}) {
  const { probot, server } = createProbotCloudflareWorkers(options);
  
  return {
    async fetch(request: Request, env: any, ctx: ExecutionContext) {
      // Handle incoming requests
    }
  };
}
```

## Usage Examples

### Express on Node.js
```javascript
import { createProbotNode } from "probot/runtime/node";

const { probot, server } = createProbotNode({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  port: 3000,
});

await server.load(myApp);
await server.start();
```

### Hono on Bun
```javascript
import { createProbotBun } from "probot/runtime/bun";

const { probot, server } = createProbotBun({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  port: 3000,
});

await server.load(myApp);
await server.start();
```

### Cloudflare Workers
```javascript
import { createCloudflareWorkersHandler } from "probot/runtime/cloudflare-workers";

export default createCloudflareWorkersHandler({
  app: myApp,
  secret: env.WEBHOOK_SECRET,
  appId: env.APP_ID,
  privateKey: env.PRIVATE_KEY,
});
```

## Benefits

### 1. **Complete Decoupling**
- No hard dependencies between components
- Easy to test with mocks
- Flexible component replacement
- Clear separation of concerns

### 2. **Runtime Flexibility**
- Same code runs on Node.js, Bun, Cloudflare Workers
- Platform-specific optimizations
- Automatic runtime detection
- Serverless-first design

### 3. **Framework Independence**
- Support for any HTTP framework
- Consistent API across frameworks
- Easy migration between frameworks
- Framework-specific optimizations

### 4. **Testability**
- All dependencies are injectable
- Easy to mock services
- Isolated unit testing
- Integration testing support

### 5. **Maintainability**
- Clear service boundaries
- Explicit dependencies
- Configuration-driven behavior
- Modular architecture

## Testing Strategy

### Unit Testing
```typescript
describe('ProbotCore', () => {
  let container: Container;
  let probot: ProbotCore;
  let mockLogger: ILogger;
  
  beforeEach(() => {
    container = new Container();
    mockLogger = mock<ILogger>();
    
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    // ... bind other mocks
    
    probot = container.get<ProbotCore>(ProbotCore);
  });
  
  test('should handle webhook events', async () => {
    // Test implementation
  });
});
```

### Integration Testing
```typescript
describe('Runtime Integration', () => {
  test('Node.js runtime should work', async () => {
    const { probot, server } = createProbotNode({});
    await server.load(testApp);
    // Test integration
  });
  
  test('Cloudflare Workers runtime should work', async () => {
    const { probot, server } = createProbotCloudflareWorkers({});
    const handler = server.createHandler();
    // Test serverless handler
  });
});
```

## Migration Path

### From Original Probot
1. **Immediate**: Use Express adapter (no changes needed)
2. **Gradual**: Replace Express with Hono adapter
3. **Advanced**: Move to serverless with Cloudflare Workers

### Code Changes
```javascript
// Before
import { Probot } from "probot";
const probot = new Probot(options);

// After
import { createProbotNode } from "probot/runtime/node";
const { probot, server } = createProbotNode(options);
```

## Performance Considerations

### Node.js + Express
- Traditional server model
- Good for development and small deployments
- File system access
- Process management

### Bun + Hono
- Faster startup times
- Better performance
- Modern JavaScript runtime
- File system access

### Cloudflare Workers
- Global edge deployment
- Zero cold starts
- Automatic scaling
- Limited to 128MB memory
- No file system access

## Future Enhancements

1. **Additional Runtimes**: Deno, AWS Lambda, Azure Functions
2. **More Adapters**: Fastify, Koa, native HTTP
3. **Enhanced Caching**: Redis, Memcached, platform-specific
4. **Monitoring**: OpenTelemetry, platform-specific metrics
5. **Security**: Platform-specific security features

## Conclusion

This dependency injection architecture provides:
- Complete framework independence
- Runtime flexibility
- Serverless support
- Excellent testability
- Clear separation of concerns
- Future-proof design

The architecture supports all major deployment scenarios while maintaining a consistent development experience across platforms.