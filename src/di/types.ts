// Service identifiers for dependency injection
export const TYPES = {
  // Core services
  Logger: Symbol.for('Logger'),
  Cache: Symbol.for('Cache'),
  WebhookHandler: Symbol.for('WebhookHandler'),
  
  // HTTP services
  HttpAdapter: Symbol.for('HttpAdapter'),
  HttpServer: Symbol.for('HttpServer'),
  
  // Octokit services
  OctokitFactory: Symbol.for('OctokitFactory'),
  AuthService: Symbol.for('AuthService'),
  
  // Configuration
  Config: Symbol.for('Config'),
  RuntimeEnvironment: Symbol.for('RuntimeEnvironment'),
  
  // Application services
  ApplicationLoader: Symbol.for('ApplicationLoader'),
  WebhookProxy: Symbol.for('WebhookProxy'),
  
  // Platform-specific services
  FileSystem: Symbol.for('FileSystem'),
  ProcessManager: Symbol.for('ProcessManager'),
} as const;

// Runtime environment types
export type RuntimeEnvironment = 'node' | 'bun' | 'cloudflare-workers' | 'deno';

// Platform abstraction interfaces
export interface IPlatformFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  join(...paths: string[]): string;
}

export interface IPlatformProcessManager {
  cwd(): string;
  env(key: string): string | undefined;
  exit(code?: number): void;
}

// Configuration interface
export interface IProbotConfig {
  appId?: number;
  privateKey?: string;
  githubToken?: string;
  secret?: string;
  webhookPath?: string;
  port?: number;
  host?: string;
  baseUrl?: string;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  environment?: RuntimeEnvironment;
}