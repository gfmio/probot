import { createServer, type Server as HttpServer } from "node:http";
import { join } from "node:path";

import express, { type Application } from "express";
import type { Logger } from "pino";
import { createNodeMiddleware as createWebhooksMiddleware } from "@octokit/webhooks";

import { getLoggingMiddleware } from "./logging-middleware.js";
import { createWebhookProxy } from "../helpers/webhook-proxy.js";
import { VERSION } from "../version.js";
import type {
  ApplicationFunction,
  ServerOptions,
  HttpAdapter,
  HttpRouter,
} from "../types.js";
import type { Probot } from "../index.js";
import { rebindLog } from "../helpers/rebind-log.js";
import { ExpressAdapter } from "../adapters/express.js";

// the default path as defined in @octokit/webhooks
export const defaultWebhooksPath = "/api/github/webhooks";

type State = {
  cwd: string;
  httpServer?: HttpServer;
  port?: number;
  host?: string;
  webhookPath: string;
  webhookProxy?: string;
  eventSource?: EventSource;
  adapter: HttpAdapter;
};

export class Server {
  static version = VERSION;

  public expressApp: Application;
  public log: Logger;
  public version = VERSION;
  public probotApp: Probot;

  private state: State;

  constructor(options: ServerOptions = {} as ServerOptions) {
    this.expressApp = express();
    this.probotApp = new options.Probot(
      options.request ? { request: options.request } : {},
    );
    this.log = options.log
      ? rebindLog(options.log)
      : rebindLog(this.probotApp.log.child({ name: "server" }));

    const adapter = options.adapter || new ExpressAdapter();

    this.state = {
      cwd: options.cwd || process.cwd(),
      port: options.port || 3000,
      host: options.host,
      webhookPath: options.webhookPath || defaultWebhooksPath,
      webhookProxy: options.webhookProxy,
      adapter,
    };

    this.expressApp.use(getLoggingMiddleware(this.log, options.loggingOptions));
    this.expressApp.use(
      "/probot/static/",
      adapter.static("/probot/static/", join(__dirname, "..", "..", "static")),
    );
    // Wrap the webhooks middleware in a function that returns void due to changes in the types for express@v5
    // Before, the express types for middleware simply had a return type of void,
    // now they have a return type of `void | Promise<void>`.
    this.expressApp.use(async (req, res, next) => {
      await createWebhooksMiddleware(this.probotApp.webhooks, {
        path: this.state.webhookPath,
      })(req, res, next);
    });

    this.expressApp.get("/ping", (_req, res) => {
      res.end("PONG");
    });
  }

  public async load(appFn: ApplicationFunction) {
    await appFn(this.probotApp, {
      cwd: this.state.cwd,
      getRouter: (path) => this.router(path),
    });
  }

  public async start() {
    this.log.info(
      `Running Probot v${this.version} (Node.js: ${process.version})`,
    );
    const port = this.state.port || 3000;
    const { host, webhookPath, webhookProxy } = this.state;
    const printableHost = host ?? "localhost";

    this.state.httpServer = await new Promise((resolve, reject) => {
      const server = createServer(this.expressApp).listen(
        port,
        ...((host ? [host] : []) as any),
        async () => {
          if (webhookProxy) {
            this.state.eventSource = await createWebhookProxy({
              logger: this.log,
              path: webhookPath,
              port: port,
              url: webhookProxy,
            });
          }
          this.log.info(`Listening on http://${printableHost}:${port}`);
          resolve(server);
        },
      );

      server.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "EADDRINUSE") {
          error = Object.assign(error, {
            message: `Port ${port} is already in use. You can define the PORT environment variable to use a different port.`,
          });
        }

        this.log.error(error);
        reject(error);
      });
    });

    return this.state.httpServer;
  }

  public async stop() {
    if (this.state.eventSource) this.state.eventSource.close();
    if (!this.state.httpServer) return;
    const server = this.state.httpServer;
    return new Promise((resolve) => server.close(resolve));
  }

  public router(path: string = "/"): HttpRouter {
    const newRouter = this.state.adapter.createRouter();
    // For Express compatibility, we still need to register the router with the Express app
    if (this.state.adapter instanceof ExpressAdapter) {
      // This is a bit of a hack, but we need to integrate the adapter router with Express
      const expressRouter = (newRouter as any).router || newRouter;
      this.expressApp.use(path, expressRouter);
    }
    return newRouter;
  }
}
