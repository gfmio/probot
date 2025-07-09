import "reflect-metadata";
import { Container } from "inversify";
import { getLog } from "../helpers/get-log.js";
import { TYPES } from "../di/types.js";
import type { 
  ILogger, 
  IHttpServer, 
  IConfigService,
  IRuntimeEnvironment 
} from "../di/interfaces.js";
import { HonoAdapter } from "../adapters/hono.js";
import { ProbotCore } from "../core/probot-di.js";
import { ServerCore } from "../core/server-di.js";

export class BunHttpServer implements IHttpServer {
  private server?: any;
  private handler?: any;
  
  constructor(
    private logger: ILogger,
    private config: IConfigService,
    private adapter: HonoAdapter
  ) {}
  
  async start(): Promise<void> {
    const port = this.config.get('port') || 3000;
    const host = this.config.get('host') || 'localhost';
    
    this.handler = this.adapter.createRouter();
    
    this.server = Bun.serve({
      port,
      hostname: host,
      fetch: this.handler,
    });
    
    this.logger.info(`Bun server listening on ${host}:${port}`);
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
    }
  }
  
  getHandler(): any {
    return this.handler;
  }
}

export function createBunContainer(): Container {
  const container = new Container();
  
  // Runtime environment
  container.bind(TYPES.RuntimeEnvironment).toConstantValue({
    getEnvironment: () => 'bun',
    isServerless: () => false,
    isNode: () => true, // Bun is Node.js compatible
    isBrowser: () => false,
    supportsFileSystem: () => true,
    supportsProcess: () => true,
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
  container.bind(TYPES.Logger).toConstantValue(getLog({ level: 'info' }));
  
  // HTTP adapter
  container.bind(TYPES.HttpAdapter).to(HonoAdapter);
  
  // HTTP server
  container.bind(TYPES.HttpServer).toDynamicValue((context) => {
    const logger = context.container.get<ILogger>(TYPES.Logger);
    const config = context.container.get<IConfigService>(TYPES.Config);
    const adapter = context.container.get<HonoAdapter>(TYPES.HttpAdapter);
    return new BunHttpServer(logger, config, adapter);
  });
  
  // Core services
  container.bind(ProbotCore).toSelf();
  container.bind(ServerCore).toSelf();
  
  return container;
}

// Helper function to create a configured Probot instance
export function createProbotBun(options: any = {}): { probot: ProbotCore; server: ServerCore } {
  const container = createBunContainer();
  
  // Configure options
  const config = container.get<IConfigService>(TYPES.Config);
  Object.entries(options).forEach(([key, value]) => {
    config.set(key, value);
  });
  
  const probot = container.get<ProbotCore>(ProbotCore);
  const server = container.get<ServerCore>(ServerCore);
  
  return { probot, server };
}