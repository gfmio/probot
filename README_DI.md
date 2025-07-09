# Probot with Dependency Injection & Multi-Runtime Support

This is a complete refactoring of Probot with dependency injection using Inversify, making it framework-agnostic and capable of running in serverless environments like Cloudflare Workers.

## 🎯 Key Features

- **🔧 Dependency Injection**: Full IoC container with Inversify
- **🌐 Framework Agnostic**: Works with Express, Hono, and custom adapters
- **🚀 Multi-Runtime**: Supports Node.js, Bun, and Cloudflare Workers
- **☁️ Serverless Ready**: Native support for edge computing platforms
- **🧪 Testable**: Complete dependency injection for easy testing
- **📦 Modular**: Clean separation of concerns and pluggable architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                    Probot Core (DI)                            │
├─────────────────────────────────────────────────────────────────┤
│  HTTP Adapters  │  Runtime Services  │  Platform Services      │
│  • Express      │  • Node.js         │  • File System          │
│  • Hono         │  • Bun             │  • Process Manager      │
│  • CF Workers   │  • Cloudflare      │  • Environment          │
├─────────────────────────────────────────────────────────────────┤
│                 Dependency Injection Container                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Express on Node.js (Traditional)

```javascript
import "reflect-metadata";
import { createProbotNode } from "./src/runtime/node.js";

const myApp = (probot, { getRouter }) => {
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "node", framework: "express" });
  });

  probot.on("issues.opened", async (context) => {
    await context.octokit.issues.createComment(
      context.issue({ body: "Hello from Express on Node.js!" })
    );
  });
};

const { probot, server } = createProbotNode({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  secret: process.env.WEBHOOK_SECRET,
  port: 3000,
});

await server.load(myApp);
await server.start();
```

### Hono on Bun (Modern)

```javascript
import "reflect-metadata";
import { createProbotBun } from "./src/runtime/bun.js";

const myApp = (probot, { getRouter }) => {
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "bun", framework: "hono" });
  });

  probot.on("issues.opened", async (context) => {
    await context.octokit.issues.createComment(
      context.issue({ body: "Hello from Hono on Bun!" })
    );
  });
};

const { probot, server } = createProbotBun({
  appId: process.env.APP_ID,
  privateKey: process.env.PRIVATE_KEY,
  secret: process.env.WEBHOOK_SECRET,
  port: 3000,
});

await server.load(myApp);
await server.start();
```

### Cloudflare Workers (Serverless)

```javascript
import "reflect-metadata";
import { createCloudflareWorkersHandler } from "./src/runtime/cloudflare-workers.js";

const myApp = (probot, { getRouter }) => {
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "cloudflare-workers" });
  });

  probot.on("issues.opened", async (context) => {
    await context.octokit.issues.createComment(
      context.issue({ body: "Hello from Cloudflare Workers!" })
    );
  });
};

export default createCloudflareWorkersHandler({
  app: myApp,
  secret: env.WEBHOOK_SECRET,
  appId: env.APP_ID,
  privateKey: env.PRIVATE_KEY,
});
```

## 📦 Installation

```bash
# Using npm
npm install inversify reflect-metadata hono @cloudflare/workers-types

# Using bun
bun add inversify reflect-metadata hono @cloudflare/workers-types
```

## 🎮 Examples

This repository includes complete examples for all runtime combinations:

### Running Examples

```bash
# Express on Node.js
node examples/express-node-di.js

# Hono on Node.js  
node examples/hono-node-di.js

# Hono on Bun
bun examples/hono-bun-di.js

# Cloudflare Workers (deploy)
cd examples/cloudflare-workers
wrangler deploy
```

### Demo Script

Run the comprehensive demo to see all runtimes in action:

```bash
node demo-di.js
```

This will demonstrate:
- ✅ Dependency injection container setup
- ✅ Runtime-specific service registration
- ✅ Framework adapter integration
- ✅ Serverless environment preparation

## 🧪 Testing

Test the dependency injection architecture:

```bash
node test-di.js
```

## 🏗️ Architecture Deep Dive

### Dependency Injection Container

The DI container manages all service dependencies:

```typescript
// Service identifiers
export const TYPES = {
  Logger: Symbol.for('Logger'),
  HttpAdapter: Symbol.for('HttpAdapter'),
  RuntimeEnvironment: Symbol.for('RuntimeEnvironment'),
  // ... more services
};

// Runtime-specific container creation
export function createNodeContainer(): Container {
  const container = new Container();
  container.bind(TYPES.HttpAdapter).to(ExpressAdapter);
  container.bind(TYPES.RuntimeEnvironment).toConstantValue(nodeRuntime);
  return container;
}
```

### Framework Adapters

Each HTTP framework has its own adapter implementing the `HttpAdapter` interface:

```typescript
interface HttpAdapter {
  createRouter(): HttpRouter;
  middleware(handler: HttpHandler): any;
  static(path: string, directory: string): any;
}
```

**Available Adapters:**
- `ExpressAdapter` - Traditional Express.js support
- `HonoAdapter` - Modern, fast web framework
- `CloudflareWorkersAdapter` - Serverless environment support

### Runtime Environments

Each runtime has optimized implementations:

**Node.js Runtime:**
- File system access
- Process management
- Traditional server model
- Express/Hono support

**Bun Runtime:**
- Fast startup times
- Native HTTP server
- Modern JavaScript features
- Optimized Hono integration

**Cloudflare Workers:**
- Global edge deployment
- Zero cold starts
- 128MB memory limit
- Request/Response API

## 🔧 Configuration

### Environment Variables

```bash
# GitHub App Configuration
APP_ID=your-github-app-id
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
WEBHOOK_SECRET=your-webhook-secret

# Server Configuration
PORT=3000
HOST=localhost
LOG_LEVEL=info

# Runtime-specific
NODE_ENV=production
```

### Programmatic Configuration

```javascript
const { probot, server } = createProbotNode({
  appId: 12345,
  privateKey: process.env.PRIVATE_KEY,
  secret: 'webhook-secret',
  port: 3000,
  logLevel: 'debug',
  baseUrl: 'https://api.github.com',
});
```

## 🚢 Deployment

### Node.js + Express

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "examples/express-node-di.js"]
```

### Bun + Hono

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "examples/hono-bun-di.js"]
```

### Cloudflare Workers

```bash
# Install Wrangler
npm install -g wrangler

# Configure
cd examples/cloudflare-workers
wrangler login

# Deploy
wrangler deploy
```

## 🧪 Testing Strategy

### Unit Testing with DI

```typescript
import { Container } from "inversify";
import { TYPES } from "./src/di/types.js";
import { ProbotCore } from "./src/core/probot-di.js";

describe("ProbotCore", () => {
  let container: Container;
  let probot: ProbotCore;

  beforeEach(() => {
    container = new Container();
    // Bind mocks
    container.bind(TYPES.Logger).toConstantValue(mockLogger);
    container.bind(TYPES.Config).toConstantValue(mockConfig);
    
    probot = container.get(ProbotCore);
  });

  test("should handle webhooks", async () => {
    // Test implementation
  });
});
```

### Integration Testing

```typescript
describe("Runtime Integration", () => {
  test("Node.js runtime works", async () => {
    const { probot, server } = createProbotNode({});
    await server.load(testApp);
    // Assert behavior
  });

  test("Cloudflare Workers runtime works", async () => {
    const handler = createCloudflareWorkersHandler({});
    const response = await handler.fetch(mockRequest);
    // Assert response
  });
});
```

## 📊 Performance Comparison

| Runtime | Cold Start | Memory | Throughput | Global Edge | Cost |
|---------|------------|--------|------------|-------------|------|
| Node.js + Express | ~100ms | ~50MB | Good | ❌ | Medium |
| Bun + Hono | ~50ms | ~30MB | Excellent | ❌ | Low |
| Cloudflare Workers | ~0ms | ~5MB | Good | ✅ | Very Low |

## 🎯 Use Cases

### Traditional Web Server (Node.js + Express)
- Development environments
- Small to medium deployments
- File system requirements
- Legacy integrations

### High-Performance Server (Bun + Hono)
- Production workloads
- High-throughput applications
- Modern JavaScript features
- Performance-critical apps

### Global Serverless (Cloudflare Workers)
- Global user base
- Auto-scaling requirements
- Cost optimization
- Edge computing needs

## 🚀 Migration Guide

### From Original Probot

**Before:**
```javascript
import { Probot } from "probot";
const probot = new Probot(options);
```

**After:**
```javascript
import { createProbotNode } from "./src/runtime/node.js";
const { probot, server } = createProbotNode(options);
```

### Benefits of Migration

1. **Better Testing** - All dependencies are injectable
2. **Runtime Flexibility** - Run on any platform
3. **Framework Choice** - Use any HTTP framework
4. **Serverless Ready** - Deploy to edge platforms
5. **Future Proof** - Easy to add new runtimes/frameworks

## 🤝 Contributing

This architecture is designed to be extensible:

1. **New Runtimes** - Add to `src/runtime/`
2. **New Adapters** - Add to `src/adapters/`
3. **New Services** - Add to `src/di/`
4. **New Examples** - Add to `examples/`

## 📄 License

ISC License - same as original Probot

## 🏆 Summary

This refactoring achieves:

- ✅ **Complete decoupling** with dependency injection
- ✅ **Multi-runtime support** (Node.js, Bun, Cloudflare Workers)
- ✅ **Framework independence** (Express, Hono, custom)
- ✅ **Serverless compatibility** for edge deployment
- ✅ **Excellent testability** with injectable dependencies
- ✅ **Maintainable architecture** with clear separation of concerns
- ✅ **Future-proof design** for new runtimes and frameworks

The architecture supports all major deployment scenarios while maintaining a consistent development experience across platforms.