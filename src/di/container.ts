import "reflect-metadata";
import { Container, injectable, inject } from "inversify";
import { TYPES } from "./types.js";
import type { 
  ILogger, 
  ICache, 
  IConfigService, 
  IRuntimeEnvironment,
  IAuthService,
  IOctokitFactory,
  IWebhookHandler,
  IApplicationLoader,
  IHttpServer
} from "./interfaces.js";

// Create and configure the DI container
export function createContainer(): Container {
  const container = new Container();
  
  // Register core services (these will be bound by the runtime-specific setup)
  container.bind(TYPES.Logger).to(LoggerService);
  container.bind(TYPES.Config).to(ConfigService);
  container.bind(TYPES.RuntimeEnvironment).to(RuntimeEnvironmentService);
  container.bind(TYPES.AuthService).to(AuthService);
  container.bind(TYPES.OctokitFactory).to(OctokitFactory);
  container.bind(TYPES.WebhookHandler).to(WebhookHandlerService);
  container.bind(TYPES.ApplicationLoader).to(ApplicationLoaderService);
  
  return container;
}

// Base service implementations
@injectable()
export class LoggerService implements ILogger {
  // This will be implemented by runtime-specific logger
  child(): ILogger { throw new Error("Not implemented"); }
  debug(): void { throw new Error("Not implemented"); }
  info(): void { throw new Error("Not implemented"); }
  warn(): void { throw new Error("Not implemented"); }
  error(): void { throw new Error("Not implemented"); }
  fatal(): void { throw new Error("Not implemented"); }
  trace(): void { throw new Error("Not implemented"); }
  silent(): void { throw new Error("Not implemented"); }
  level: string = 'info';
}

@injectable()
export class ConfigService implements IConfigService {
  private config: Map<string, any> = new Map();
  
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
    // Basic validation - can be extended
    return true;
  }
}

@injectable()
export class RuntimeEnvironmentService implements IRuntimeEnvironment {
  getEnvironment() {
    if (typeof process !== 'undefined' && process.versions?.node) {
      return 'node' as const;
    }
    if (typeof process !== 'undefined' && process.versions?.bun) {
      return 'bun' as const;
    }
    if (typeof globalThis !== 'undefined' && 'cloudflare' in globalThis) {
      return 'cloudflare-workers' as const;
    }
    return 'node' as const; // fallback
  }
  
  isServerless(): boolean {
    return this.getEnvironment() === 'cloudflare-workers';
  }
  
  isNode(): boolean {
    const env = this.getEnvironment();
    return env === 'node' || env === 'bun';
  }
  
  isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
  
  supportsFileSystem(): boolean {
    return this.isNode();
  }
  
  supportsProcess(): boolean {
    return this.isNode();
  }
}

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.Config) private config: IConfigService,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}
  
  async createInstallationAuth(installationId: number): Promise<any> {
    // Implementation will be injected based on runtime
    throw new Error("Not implemented");
  }
  
  async createAppAuth(): Promise<any> {
    // Implementation will be injected based on runtime
    throw new Error("Not implemented");
  }
}

@injectable()
export class OctokitFactory implements IOctokitFactory {
  constructor(
    @inject(TYPES.AuthService) private authService: IAuthService,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}
  
  async createForInstallation(installationId: number): Promise<any> {
    return this.authService.createInstallationAuth(installationId);
  }
  
  async createForApp(): Promise<any> {
    return this.authService.createAppAuth();
  }
}

@injectable()
export class WebhookHandlerService implements IWebhookHandler {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger
  ) {}
  
  on(event: string, handler: Function): void {
    throw new Error("Not implemented");
  }
  
  onAny(handler: Function): void {
    throw new Error("Not implemented");
  }
  
  onError(handler: Function): void {
    throw new Error("Not implemented");
  }
  
  async receive(event: any): Promise<void> {
    throw new Error("Not implemented");
  }
}

@injectable()
export class ApplicationLoaderService implements IApplicationLoader {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.RuntimeEnvironment) private runtime: IRuntimeEnvironment
  ) {}
  
  async load(appFn: any): Promise<void> {
    throw new Error("Not implemented");
  }
  
  async loadFromPath(path: string): Promise<void> {
    if (!this.runtime.supportsFileSystem()) {
      throw new Error("File system not supported in this runtime");
    }
    throw new Error("Not implemented");
  }
}

// Export container instance
export const container = createContainer();