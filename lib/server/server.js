"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = exports.defaultWebhooksPath = void 0;
const node_http_1 = require("node:http");
const node_path_1 = require("node:path");
const express_1 = __importDefault(require("express"));
const webhooks_1 = require("@octokit/webhooks");
const logging_middleware_js_1 = require("./logging-middleware.js");
const webhook_proxy_js_1 = require("../helpers/webhook-proxy.js");
const version_js_1 = require("../version.js");
const rebind_log_js_1 = require("../helpers/rebind-log.js");
const express_js_1 = require("../adapters/express.js");
// the default path as defined in @octokit/webhooks
exports.defaultWebhooksPath = "/api/github/webhooks";
class Server {
    static version = version_js_1.VERSION;
    expressApp;
    log;
    version = version_js_1.VERSION;
    probotApp;
    state;
    constructor(options = {}) {
        this.expressApp = (0, express_1.default)();
        this.probotApp = new options.Probot({
            request: options.request,
        });
        this.log = options.log
            ? (0, rebind_log_js_1.rebindLog)(options.log)
            : (0, rebind_log_js_1.rebindLog)(this.probotApp.log.child({ name: "server" }));
        const adapter = options.adapter || new express_js_1.ExpressAdapter();
        this.state = {
            cwd: options.cwd || process.cwd(),
            port: options.port,
            host: options.host,
            webhookPath: options.webhookPath || exports.defaultWebhooksPath,
            webhookProxy: options.webhookProxy,
            adapter,
        };
        this.expressApp.use((0, logging_middleware_js_1.getLoggingMiddleware)(this.log, options.loggingOptions));
        this.expressApp.use("/probot/static/", adapter.static("/probot/static/", (0, node_path_1.join)(__dirname, "..", "..", "static")));
        // Wrap the webhooks middleware in a function that returns void due to changes in the types for express@v5
        // Before, the express types for middleware simply had a return type of void,
        // now they have a return type of `void | Promise<void>`.
        this.expressApp.use(async (req, res, next) => {
            await (0, webhooks_1.createNodeMiddleware)(this.probotApp.webhooks, {
                path: this.state.webhookPath,
            })(req, res, next);
        });
        this.expressApp.get("/ping", (_req, res) => {
            res.end("PONG");
        });
    }
    async load(appFn) {
        await appFn(this.probotApp, {
            cwd: this.state.cwd,
            getRouter: (path) => this.router(path),
        });
    }
    async start() {
        this.log.info(`Running Probot v${this.version} (Node.js: ${process.version})`);
        const port = this.state.port || 3000;
        const { host, webhookPath, webhookProxy } = this.state;
        const printableHost = host ?? "localhost";
        this.state.httpServer = await new Promise((resolve, reject) => {
            const server = (0, node_http_1.createServer)(this.expressApp).listen(port, ...(host ? [host] : []), async () => {
                if (webhookProxy) {
                    this.state.eventSource = await (0, webhook_proxy_js_1.createWebhookProxy)({
                        logger: this.log,
                        path: webhookPath,
                        port: port,
                        url: webhookProxy,
                    });
                }
                this.log.info(`Listening on http://${printableHost}:${port}`);
                resolve(server);
            });
            server.on("error", (error) => {
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
    async stop() {
        if (this.state.eventSource)
            this.state.eventSource.close();
        if (!this.state.httpServer)
            return;
        const server = this.state.httpServer;
        return new Promise((resolve) => server.close(resolve));
    }
    router(path = "/") {
        const newRouter = this.state.adapter.createRouter();
        // For Express compatibility, we still need to register the router with the Express app
        if (this.state.adapter instanceof express_js_1.ExpressAdapter) {
            // This is a bit of a hack, but we need to integrate the adapter router with Express
            const expressRouter = newRouter.router || newRouter;
            this.expressApp.use(path, expressRouter);
        }
        return newRouter;
    }
}
exports.Server = Server;
//# sourceMappingURL=server.js.map