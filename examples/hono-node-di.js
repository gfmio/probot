import "reflect-metadata";
import { Container } from "inversify";
import { getLog } from "../src/helpers/get-log.js";
import { TYPES } from "../src/di/types.js";
import { HonoAdapter } from "../src/adapters/hono.js";
import { ProbotCore } from "../src/core/probot-di.js";
import { ServerCore } from "../src/core/server-di.js";

// Custom Node.js setup with Hono adapter
function createHonoNodeContainer() {
  const container = new Container();
  
  // Runtime environment
  container.bind(TYPES.RuntimeEnvironment).toConstantValue({
    getEnvironment: () => 'node',
    isServerless: () => false,
    isNode: () => true,
    isBrowser: () => false,
    supportsFileSystem: () => true,
    supportsProcess: () => true,
  });
  
  // Configuration service
  container.bind(TYPES.Config).to(class {
    private config = new Map();
    get(key) { return this.config.get(key); }
    set(key, value) { this.config.set(key, value); }
    getAll() { return Object.fromEntries(this.config); }
    validate() { return true; }
  });
  
  // Logger service
  container.bind(TYPES.Logger).toConstantValue(getLog({ level: 'info' }));
  
  // HTTP adapter - using Hono instead of Express
  container.bind(TYPES.HttpAdapter).to(HonoAdapter);
  
  // HTTP server - Node.js with Hono
  container.bind(TYPES.HttpServer).toDynamicValue((context) => {
    const logger = context.container.get(TYPES.Logger);
    const config = context.container.get(TYPES.Config);
    const adapter = context.container.get(TYPES.HttpAdapter);
    
    return {
      async start() {
        const port = config.get('port') || 3000;
        const app = adapter.createRouter();
        
        // Start with Node.js built-in server
        const server = Bun.serve({
          port,
          fetch: app.fetch,
        });
        
        logger.info(`Hono server on Node.js listening on port ${port}`);
        return server;
      },
      async stop() {
        logger.info("Server stopped");
      },
      getHandler() {
        return adapter.createRouter();
      }
    };
  });
  
  // Core services
  container.bind(ProbotCore).toSelf();
  container.bind(ServerCore).toSelf();
  
  return container;
}

// Example GitHub App function
const myApp = (probot, { getRouter }) => {
  // Add a custom route
  const router = getRouter();
  router.get("/health", (req, res) => {
    res.json({ status: "healthy", runtime: "node", framework: "hono" });
  });

  // Handle GitHub webhook events
  probot.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! (from Hono on Node.js with DI)",
    });
    await context.octokit.issues.createComment(issueComment);
  });

  probot.on("ping", async (context) => {
    console.log("✅ Ping received:", context.payload.zen);
  });
};

async function main() {
  // Create container and configure
  const container = createHonoNodeContainer();
  
  const config = container.get(TYPES.Config);
  config.set('appId', process.env.APP_ID);
  config.set('privateKey', process.env.PRIVATE_KEY);
  config.set('secret', process.env.WEBHOOK_SECRET);
  config.set('port', process.env.PORT || 3001);
  
  const probot = container.get(ProbotCore);
  const server = container.get(ServerCore);

  // Load the app
  await server.load(myApp);

  // Start the server
  await server.start();
  
  console.log("🚀 Probot running on Hono/Node.js with Dependency Injection!");
  console.log("   Runtime: Node.js");
  console.log("   Framework: Hono");
  console.log("   Architecture: Dependency Injection");
  console.log("   Health check: http://localhost:3001/health");
}

main().catch(console.error);