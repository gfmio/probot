import "reflect-metadata";
import { injectable, inject } from "inversify";
import { TYPES } from "../di/types.js";
import type { 
  ILogger, 
  IConfigService, 
  IHttpServer, 
  IRuntimeEnvironment,
  IApplicationLoader
} from "../di/interfaces.js";
import type { HttpAdapter, ApplicationFunction } from "../types.js";
import { ProbotCore } from "./probot-di.js";

@injectable()
export class ServerCore {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfigService,
    @inject(TYPES.HttpAdapter) private httpAdapter: HttpAdapter,
    @inject(TYPES.HttpServer) private httpServer: IHttpServer,
    @inject(TYPES.RuntimeEnvironment) private runtime: IRuntimeEnvironment,
    @inject(TYPES.ApplicationLoader) private applicationLoader: IApplicationLoader,
    @inject(ProbotCore) private probotCore: ProbotCore
  ) {}
  
  async load(appFn: ApplicationFunction): Promise<void> {
    const options = {
      cwd: this.runtime.supportsProcess() ? process.cwd() : '/',
      getRouter: (path?: string) => this.getRouter(path),
    };
    
    await this.probotCore.load(appFn, options);
  }
  
  async start(): Promise<void> {
    if (this.runtime.isServerless()) {
      this.logger.info("Running in serverless mode - no server to start");
      return;
    }
    
    this.logger.info(`Starting server in ${this.runtime.getEnvironment()} environment`);
    await this.httpServer.start();
  }
  
  async stop(): Promise<void> {
    if (!this.runtime.isServerless()) {
      await this.httpServer.stop();
    }
  }
  
  getRouter(path?: string) {
    return this.httpAdapter.createRouter();
  }
  
  getHandler(): any {
    return this.httpServer.getHandler();
  }
  
  // For serverless environments
  createHandler() {
    return this.httpAdapter.middleware(async (req, res) => {
      // Handle webhook requests
      if (req.url.startsWith(this.probotCore.webhookPath)) {
        // Process webhook
        try {
          const event = this.parseWebhookEvent(req);
          await this.probotCore.receive(event);
          res.status(200).text('OK');
        } catch (error) {
          this.logger.error(error);
          res.status(500).text('Internal Server Error');
        }
      } else {
        res.status(404).text('Not Found');
      }
    });
  }
  
  private parseWebhookEvent(req: any): any {
    // Parse GitHub webhook event from request
    // This would need proper implementation based on the GitHub webhook format
    return {
      id: req.headers['x-github-delivery'],
      name: req.headers['x-github-event'],
      payload: req.body,
    };
  }
}