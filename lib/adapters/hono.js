"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HonoAdapter = void 0;
const hono_1 = require("hono");
const bun_1 = require("hono/bun");
class HonoAdapter {
    createRouter() {
        const app = new hono_1.Hono();
        return new HonoRouter(app);
    }
    middleware(handler) {
        return async (c, next) => {
            const adaptedReq = this.adaptRequest(c.req, c);
            const adaptedRes = this.adaptResponse(c);
            let nextCalled = false;
            const nextFn = () => {
                nextCalled = true;
                return next();
            };
            await handler(adaptedReq, adaptedRes, nextFn);
            if (!nextCalled && !c.finalized) {
                await next();
            }
        };
    }
    static(path, directory) {
        return (0, bun_1.serveStatic)({ root: directory });
    }
    adaptRequest(req, c) {
        const url = new URL(req.url);
        return {
            method: req.method,
            url: url.pathname + url.search,
            headers: Object.fromEntries(req.headers.entries()),
            body: req.body,
            query: Object.fromEntries(url.searchParams.entries()),
            params: c.req.param(),
        };
    }
    adaptResponse(c) {
        let statusCode = 200;
        const headers = {};
        return {
            status: (code) => {
                statusCode = code;
                return this.adaptResponse(c);
            },
            header: (name, value) => {
                headers[name] = value;
                return this.adaptResponse(c);
            },
            json: (data) => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.json(data, statusCode);
            },
            text: (data) => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.text(data, statusCode);
            },
            end: () => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.body(null, statusCode);
            },
        };
    }
}
exports.HonoAdapter = HonoAdapter;
class HonoRouter {
    app;
    constructor(app) {
        this.app = app;
    }
    get(path, handler) {
        this.app.get(path, this.adaptHandler(handler));
    }
    post(path, handler) {
        this.app.post(path, this.adaptHandler(handler));
    }
    put(path, handler) {
        this.app.put(path, this.adaptHandler(handler));
    }
    delete(path, handler) {
        this.app.delete(path, this.adaptHandler(handler));
    }
    patch(path, handler) {
        this.app.patch(path, this.adaptHandler(handler));
    }
    use(pathOrHandler, handler) {
        if (typeof pathOrHandler === "string" && handler) {
            this.app.use(pathOrHandler, this.adaptHandler(handler));
        }
        else if (typeof pathOrHandler === "function") {
            this.app.use(this.adaptHandler(pathOrHandler));
        }
    }
    adaptHandler(handler) {
        return async (c, next) => {
            const adaptedReq = this.adaptRequest(c.req, c);
            const adaptedRes = this.adaptResponse(c);
            let nextCalled = false;
            const nextFn = () => {
                nextCalled = true;
                return next();
            };
            await handler(adaptedReq, adaptedRes, nextFn);
            if (!nextCalled && !c.finalized) {
                await next();
            }
        };
    }
    adaptRequest(req, c) {
        const url = new URL(req.url);
        return {
            method: req.method,
            url: url.pathname + url.search,
            headers: Object.fromEntries(req.headers.entries()),
            body: req.body,
            query: Object.fromEntries(url.searchParams.entries()),
            params: c.req.param(),
        };
    }
    adaptResponse(c) {
        let statusCode = 200;
        const headers = {};
        return {
            status: (code) => {
                statusCode = code;
                return this.adaptResponse(c);
            },
            header: (name, value) => {
                headers[name] = value;
                return this.adaptResponse(c);
            },
            json: (data) => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.json(data, statusCode);
            },
            text: (data) => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.text(data, statusCode);
            },
            end: () => {
                Object.entries(headers).forEach(([key, value]) => {
                    c.header(key, value);
                });
                return c.body(null, statusCode);
            },
        };
    }
}
//# sourceMappingURL=hono.js.map