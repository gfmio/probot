import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "../di/types.js";
import type { 
  ILogger, 
  IHttpServer, 
  IConfigService,
  IRuntimeEnvironment 
} from "../di/interfaces.js";
import { CloudflareWorkersAdapter } from "../adapters/cloudflare-workers.js";
import { ProbotCore } from "../core/probot-di.js";
import { ServerCore } from "../core/server-di.js";

// Minimal logger for Cloudflare Workers
class CloudflareLogger implements ILogger {
  level: string = 'info';
  
  child(): ILogger {
    return this;
  }
  
  debug(...args: any[]): void {
    console.debug(...args);
  }
  
  info(...args: any[]): void {
    console.info(...args);
  }
  
  warn(...args: any[]): void {
    console.warn(...args);
  }
  
  error(...args: any[]): void {
    console.error(...args);
  }
  
  fatal(...args: any[]): void {
    console.error(...args);
  }
  
  trace(...args: any[]): void {
    console.trace(...args);
  }
  
  silent(): void {
    // No-op
  }
}

export class CloudflareWorkersHttpServer implements IHttpServer {
  private handler?: any;
  
  constructor(
    private logger: ILogger,
    private config: IConfigService,
    private adapter: CloudflareWorkersAdapter
  ) {}
  
  async start(): Promise<void> {
    this.logger.info("Cloudflare Workers runtime - no server to start");
    this.handler = this.adapter.middleware(async (req, res) => {
      // Default handler - applications will override this
      res.status(404).text('Not Found');
    });
  }
  
  async stop(): Promise<void> {
    this.logger.info("Cloudflare Workers runtime - no server to stop");
  }
  
  getHandler(): any {
    return this.handler;
  }
}

export function createCloudflareWorkersContainer(): Container {
  const container = new Container();
  
  // Runtime environment
  container.bind(TYPES.RuntimeEnvironment).toConstantValue({
    getEnvironment: () => 'cloudflare-workers',
    isServerless: () => true,
    isNode: () => false,
    isBrowser: () => false,
    supportsFileSystem: () => false,
    supportsProcess: () => false,
  });
  
  // Configuration service
  container.bind(TYPES.Config).to(class implements IConfigService {
    private config = new Map<string, any>();
    
    get<T>(key: string): T | undefined {
      return this.config.get(key);
    }
    
    set<T>(key: string, value: T): void {
      this.config.set(key, value);
    }
    
    getAll(): any {
      return Object.fromEntries(this.config);
    }
    
    validate(): boolean {
      return true;
    }
  });
  
  // Logger service
  container.bind(TYPES.Logger).to(CloudflareLogger);
  
  // HTTP adapter
  container.bind(TYPES.HttpAdapter).to(CloudflareWorkersAdapter);
  
  // HTTP server
  container.bind(TYPES.HttpServer).toDynamicValue((context) => {
    const logger = context.container.get<ILogger>(TYPES.Logger);
    const config = context.container.get<IConfigService>(TYPES.Config);
    const adapter = context.container.get<CloudflareWorkersAdapter>(TYPES.HttpAdapter);
    return new CloudflareWorkersHttpServer(logger, config, adapter);
  });
  
  // Core services
  container.bind(ProbotCore).toSelf();
  container.bind(ServerCore).toSelf();
  
  return container;
}

// Helper function to create a configured Probot instance
export function createProbotCloudflareWorkers(options: any = {}): { probot: ProbotCore; server: ServerCore } {
  const container = createCloudflareWorkersContainer();
  
  // Configure options
  const config = container.get<IConfigService>(TYPES.Config);
  Object.entries(options).forEach(([key, value]) => {
    config.set(key, value);
  });
  
  const probot = container.get<ProbotCore>(ProbotCore);
  const server = container.get<ServerCore>(ServerCore);
  
  return { probot, server };
}

// Export function for Cloudflare Workers
export function createCloudflareWorkersHandler(options: any = {}) {
  const { probot, server } = createProbotCloudflareWorkers(options);
  
  return {
    async fetch(request: Request, env: any, ctx: ExecutionContext) {
      const adapter = new CloudflareWorkersAdapter();
      const handler = adapter.middleware(async (req, res) => {
        // Handle webhook requests
        if (req.url.startsWith(probot.webhookPath)) {
          try {
            // Parse webhook event
            const event = {
              id: req.headers['x-github-delivery'] as string,
              name: req.headers['x-github-event'] as string,
              payload: req.body,
            };
            
            await probot.receive(event);
            res.status(200).text('OK');
          } catch (error) {
            console.error('Webhook processing error:', error);
            res.status(500).text('Internal Server Error');
          }
        } else {
          res.status(404).text('Not Found');
        }
      });
      
      return handler(request, env, ctx);
    }
  };
}