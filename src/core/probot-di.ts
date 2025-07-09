import "reflect-metadata";
import { injectable, inject } from "inversify";
import type { EmitterWebhookEvent as WebhookEvent } from "@octokit/webhooks";
import { TYPES } from "../di/types.js";
import type { 
  ILogger, 
  IConfigService, 
  IWebhookHandler, 
  IOctokitFactory, 
  IApplicationLoader,
  IRuntimeEnvironment
} from "../di/interfaces.js";
import type { ApplicationFunction, ApplicationFunctionOptions } from "../types.js";
import { VERSION } from "../version.js";

@injectable()
export class ProbotCore {
  static version = VERSION;
  
  public readonly version = VERSION;
  public readonly webhookPath: string;
  
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.Config) private config: IConfigService,
    @inject(TYPES.WebhookHandler) private webhookHandler: IWebhookHandler,
    @inject(TYPES.OctokitFactory) private octokitFactory: IOctokitFactory,
    @inject(TYPES.ApplicationLoader) private applicationLoader: IApplicationLoader,
    @inject(TYPES.RuntimeEnvironment) private runtime: IRuntimeEnvironment
  ) {
    this.webhookPath = this.config.get('webhookPath') || '/api/github/webhooks';
  }
  
  // Webhook event handlers
  public on = (event: string, handler: Function) => {
    this.webhookHandler.on(event, handler);
  };
  
  public onAny = (handler: Function) => {
    this.webhookHandler.onAny(handler);
  };
  
  public onError = (handler: Function) => {
    this.webhookHandler.onError(handler);
  };
  
  // Webhook event processing
  public async receive(event: WebhookEvent): Promise<void> {
    this.logger.debug({ event }, "Webhook received");
    return this.webhookHandler.receive(event);
  }
  
  // Application loading
  public async load(appFn: ApplicationFunction | ApplicationFunction[], options: ApplicationFunctionOptions = {}): Promise<void> {
    if (Array.isArray(appFn)) {
      for (const fn of appFn) {
        await this.load(fn, options);
      }
      return;
    }
    
    await this.applicationLoader.load(appFn);
  }
  
  // Authentication
  public async auth(installationId?: number): Promise<any> {
    if (installationId) {
      return this.octokitFactory.createForInstallation(installationId);
    }
    return this.octokitFactory.createForApp();
  }
  
  // Utility methods
  public isServerless(): boolean {
    return this.runtime.isServerless();
  }
  
  public getEnvironment() {
    return this.runtime.getEnvironment();
  }
  
  public static defaults<T extends typeof ProbotCore>(this: T, defaults: any): T {
    return class extends this {
      constructor(...args: any[]) {
        super(...args);
        // Apply defaults through config service
      }
    } as T;
  }
}