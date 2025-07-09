import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { Context, HonoRequest } from "hono";
import type {
  HttpAdapter,
  HttpRequest,
  HttpResponse,
  HttpRouter,
  HttpHandler,
} from "../types.js";

export class HonoAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    const app = new Hono();
    return new HonoRouter(app);
  }

  middleware(handler: HttpHandler): any {
    return async (c: Context, next: () => Promise<void>) => {
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

  static(_path: string, directory: string): any {
    return serveStatic({ root: directory });
  }

  private adaptRequest(req: HonoRequest, c: Context): HttpRequest {
    const url = new URL(req.url);
    const headers: Record<string, string | string[]> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      method: req.method,
      url: url.pathname + url.search,
      headers,
      body: undefined, // Body handling would need to be implemented based on content type
      query: Object.fromEntries(url.searchParams.entries()),
      params: c.req.param(),
    };
  }

  private adaptResponse(c: Context): HttpResponse {
    let statusCode = 200;
    const headers: Record<string, string> = {};

    return {
      status: (code: number) => {
        statusCode = code;
        return this.adaptResponse(c);
      },
      header: (name: string, value: string) => {
        headers[name] = value;
        return this.adaptResponse(c);
      },
      json: (data: any) => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.json(data, { status: statusCode as any }) as any;
      },
      text: (data: string) => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.text(data, { status: statusCode as any }) as any;
      },
      end: () => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.body("", { status: statusCode as any }) as any;
      },
    };
  }
}

class HonoRouter implements HttpRouter {
  constructor(private app: Hono) {}

  get(path: string, handler: HttpHandler): void {
    this.app.get(path, this.adaptHandler(handler));
  }

  post(path: string, handler: HttpHandler): void {
    this.app.post(path, this.adaptHandler(handler));
  }

  put(path: string, handler: HttpHandler): void {
    this.app.put(path, this.adaptHandler(handler));
  }

  delete(path: string, handler: HttpHandler): void {
    this.app.delete(path, this.adaptHandler(handler));
  }

  patch(path: string, handler: HttpHandler): void {
    this.app.patch(path, this.adaptHandler(handler));
  }

  use(pathOrHandler: string | HttpHandler, handler?: HttpHandler): void {
    if (typeof pathOrHandler === "string" && handler) {
      this.app.use(pathOrHandler, this.adaptHandler(handler));
    } else if (typeof pathOrHandler === "function") {
      this.app.use(this.adaptHandler(pathOrHandler));
    }
  }

  private adaptHandler(handler: HttpHandler) {
    return async (c: Context, next: () => Promise<void>) => {
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

  private adaptRequest(req: HonoRequest, c: Context): HttpRequest {
    const url = new URL(req.url);
    const headers: Record<string, string | string[]> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      method: req.method,
      url: url.pathname + url.search,
      headers,
      body: undefined, // Body handling would need to be implemented based on content type
      query: Object.fromEntries(url.searchParams.entries()),
      params: c.req.param(),
    };
  }

  private adaptResponse(c: Context): HttpResponse {
    let statusCode = 200;
    const headers: Record<string, string> = {};

    return {
      status: (code: number) => {
        statusCode = code;
        return this.adaptResponse(c);
      },
      header: (name: string, value: string) => {
        headers[name] = value;
        return this.adaptResponse(c);
      },
      json: (data: any) => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.json(data, { status: statusCode as any }) as any;
      },
      text: (data: string) => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.text(data, { status: statusCode as any }) as any;
      },
      end: () => {
        Object.entries(headers).forEach(([key, value]) => {
          c.header(key, value);
        });
        return c.body("", { status: statusCode as any }) as any;
      },
    };
  }
}
