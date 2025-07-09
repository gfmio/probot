import "reflect-metadata";
import { Container } from "inversify";
import { createServer } from "node:http";
import express from "express";
import { getLog } from "../helpers/get-log.js";
import { TYPES } from "../di/types.js";
import type { 
  ILogger, 
  IHttpServer, 
  IConfigService,
  IRuntimeEnvironment 
} from "../di/interfaces.js";
import { ExpressAdapter } from "../adapters/express.js";
import { ProbotCore } from "../core/probot-di.js";
import { ServerCore } from "../core/server-di.js";

export class NodeHttpServer implements IHttpServer {
  private server?: any;
  private app: express.Application;
  
  constructor(
    private logger: ILogger,
    private config: IConfigService,
    private adapter: ExpressAdapter
  ) {
    this.app = express();
  }
  
  async start(): Promise<void> {
    const port = this.config.get('port') || 3000;
    const host = this.config.get('host');
    
    this.server = createServer(this.app);
    
    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        this.logger.info(`Server listening on ${host || 'localhost'}:${port}`);
        resolve();
      });
      
      this.server.on('error', reject);
    });
  }
  
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }
  
  getHandler(): express.Application {
    return this.app;
  }
}

export function createNodeContainer(): Container {
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
  container.bind(TYPES.HttpAdapter).to(ExpressAdapter);
  
  // HTTP server
  container.bind(TYPES.HttpServer).toDynamicValue((context) => {
    const logger = context.container.get<ILogger>(TYPES.Logger);
    const config = context.container.get<IConfigService>(TYPES.Config);
    const adapter = context.container.get<ExpressAdapter>(TYPES.HttpAdapter);
    return new NodeHttpServer(logger, config, adapter);
  });
  
  // Core services
  container.bind(ProbotCore).toSelf();
  container.bind(ServerCore).toSelf();
  
  return container;
}

// Helper function to create a configured Probot instance
export function createProbotNode(options: any = {}): { probot: ProbotCore; server: ServerCore } {
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