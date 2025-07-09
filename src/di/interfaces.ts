import "reflect-metadata";
import type { Logger } from "pino";
import type { LRUCache } from "lru-cache";
import type { EmitterWebhookEvent as WebhookEvent } from "@octokit/webhooks";
import type { ProbotOctokit } from "../octokit/probot-octokit.js";
import type { HttpAdapter, HttpRequest, HttpResponse, ApplicationFunction } from "../types.js";
import type { IProbotConfig, RuntimeEnvironment } from "./types.js";

// Core service interfaces
export interface ILogger extends Logger {}

export interface ICache extends LRUCache<number, string> {}

export interface IWebhookHandler {
  on(event: string, handler: Function): void;
  onAny(handler: Function): void;
  onError(handler: Function): void;
  receive(event: WebhookEvent): Promise<void>;
}

export interface IAuthService {
  createInstallationAuth(installationId: number): Promise<ProbotOctokit>;
  createAppAuth(): Promise<ProbotOctokit>;
}

export interface IOctokitFactory {
  createForInstallation(installationId: number): Promise<ProbotOctokit>;
  createForApp(): Promise<ProbotOctokit>;
}

export interface IApplicationLoader {
  load(appFn: ApplicationFunction): Promise<void>;
  loadFromPath(path: string): Promise<void>;
}

export interface IWebhookProxy {
  start(): Promise<void>;
  stop(): Promise<void>;
}

// HTTP service interfaces
export interface IHttpServer {
  start(): Promise<void>;
  stop(): Promise<void>;
  getHandler(): any;
}

// Serverless-specific interfaces
export interface IServerlessHandler {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

// Configuration service
export interface IConfigService {
  get<T>(key: keyof IProbotConfig): T | undefined;
  set<T>(key: keyof IProbotConfig, value: T): void;
  getAll(): IProbotConfig;
  validate(): boolean;
}

// Runtime environment service
export interface IRuntimeEnvironment {
  getEnvironment(): RuntimeEnvironment;
  isServerless(): boolean;
  isNode(): boolean;
  isBrowser(): boolean;
  supportsFileSystem(): boolean;
  supportsProcess(): boolean;
}