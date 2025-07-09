import type { HttpAdapter, HttpRequest, HttpResponse, HttpRouter, HttpHandler } from "../types.js";

export class CloudflareWorkersAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    return new CloudflareWorkersRouter();
  }

  middleware(handler: HttpHandler): any {
    return async (request: Request, env: any, ctx: any) => {
      const adaptedReq = await this.adaptRequest(request);
      const adaptedRes = new CloudflareWorkersResponse();
      
      await handler(adaptedReq, adaptedRes, () => {});
      
      return adaptedRes.toResponse();
    };
  }

  static(_path: string, _directory: string): any {
    // Static file serving in Cloudflare Workers would require different approach
    return (req: Request) => new Response("Static files not supported", { status: 404 });
  }

  private async adaptRequest(request: Request): Promise<HttpRequest> {
    const url = new URL(request.url);
    const headers: Record<string, string | string[]> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          body = await request.formData();
        } else {
          body = await request.text();
        }
      } catch {
        body = undefined;
      }
    }
    
    return {
      method: request.method,
      url: url.pathname + url.search,
      headers,
      body,
      query: Object.fromEntries(url.searchParams.entries()),
      params: {}, // Path params would be handled by routing
    };
  }
}

class CloudflareWorkersRouter implements HttpRouter {
  private routes: Map<string, Map<string, HttpHandler>> = new Map();
  
  get(path: string, handler: HttpHandler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: HttpHandler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: HttpHandler): void {
    this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: HttpHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  patch(path: string, handler: HttpHandler): void {
    this.addRoute('PATCH', path, handler);
  }

  use(pathOrHandler: string | HttpHandler, handler?: HttpHandler): void {
    if (typeof pathOrHandler === 'string' && handler) {
      // Middleware for specific path
      this.addRoute('USE', pathOrHandler, handler);
    } else if (typeof pathOrHandler === 'function') {
      // Global middleware
      this.addRoute('USE', '*', pathOrHandler);
    }
  }

  private addRoute(method: string, path: string, handler: HttpHandler): void {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  async handleRequest(request: HttpRequest): Promise<HttpResponse> {
    const methodRoutes = this.routes.get(request.method);
    if (!methodRoutes) {
      return new CloudflareWorkersResponse().status(404).text('Not Found');
    }

    // Simple path matching (in production, you'd want a more sophisticated router)
    for (const [path, handler] of methodRoutes) {
      if (this.matchPath(path, request.url)) {
        const response = new CloudflareWorkersResponse();
        await handler(request, response, () => {});
        return response;
      }
    }

    return new CloudflareWorkersResponse().status(404).text('Not Found');
  }

  private matchPath(routePath: string, requestPath: string): boolean {
    if (routePath === '*') return true;
    
    // Extract pathname from request URL
    const pathname = requestPath.split('?')[0];
    
    // Simple exact match for now
    return routePath === pathname;
  }
}

class CloudflareWorkersResponse implements HttpResponse {
  private _status: number = 200;
  private _headers: Record<string, string> = {};
  private _body: any = null;
  private _type: 'json' | 'text' | 'end' = 'end';

  status(code: number): HttpResponse {
    this._status = code;
    return this;
  }

  header(name: string, value: string): HttpResponse {
    this._headers[name] = value;
    return this;
  }

  json(data: any): HttpResponse {
    this._body = data;
    this._type = 'json';
    this._headers['content-type'] = 'application/json';
    return this;
  }

  text(data: string): HttpResponse {
    this._body = data;
    this._type = 'text';
    this._headers['content-type'] = 'text/plain';
    return this;
  }

  end(): HttpResponse {
    this._type = 'end';
    return this;
  }

  toResponse(): Response {
    let body: string;
    
    switch (this._type) {
      case 'json':
        body = JSON.stringify(this._body);
        break;
      case 'text':
        body = this._body || '';
        break;
      default:
        body = this._body || '';
    }

    return new Response(body, {
      status: this._status,
      headers: this._headers,
    });
  }
}