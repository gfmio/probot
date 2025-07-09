import express, {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type {
  HttpAdapter,
  HttpRequest,
  HttpResponse,
  HttpRouter,
  HttpHandler,
} from "../types.js";

export class ExpressAdapter implements HttpAdapter {
  createRouter(): HttpRouter {
    const router = Router();
    return new ExpressRouter(router);
  }

  middleware(handler: HttpHandler): any {
    return (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      return handler(adaptedReq, adaptedRes, next);
    };
  }

  static(_path: string, directory: string): any {
    return express.static(directory);
  }

  private adaptRequest(req: Request): HttpRequest {
    return {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string | string[]>,
      body: req.body,
      query: req.query as Record<string, string | string[]>,
      params: req.params,
    };
  }

  private adaptResponse(res: Response): HttpResponse {
    return {
      status: (code: number) => {
        res.status(code);
        return this.adaptResponse(res);
      },
      header: (name: string, value: string) => {
        res.header(name, value);
        return this.adaptResponse(res);
      },
      json: (data: any) => {
        res.json(data);
        return this.adaptResponse(res);
      },
      text: (data: string) => {
        res.send(data);
        return this.adaptResponse(res);
      },
      end: () => {
        res.end();
        return this.adaptResponse(res);
      },
    };
  }
}

class ExpressRouter implements HttpRouter {
  public router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  get(path: string, handler: HttpHandler): void {
    this.router.get(path, this.adaptHandler(handler));
  }

  post(path: string, handler: HttpHandler): void {
    this.router.post(path, this.adaptHandler(handler));
  }

  put(path: string, handler: HttpHandler): void {
    this.router.put(path, this.adaptHandler(handler));
  }

  delete(path: string, handler: HttpHandler): void {
    this.router.delete(path, this.adaptHandler(handler));
  }

  patch(path: string, handler: HttpHandler): void {
    this.router.patch(path, this.adaptHandler(handler));
  }

  use(pathOrHandler: string | HttpHandler, handler?: HttpHandler): void {
    if (typeof pathOrHandler === "string" && handler) {
      this.router.use(pathOrHandler, this.adaptHandler(handler));
    } else if (typeof pathOrHandler === "function") {
      this.router.use(this.adaptHandler(pathOrHandler));
    }
  }

  private adaptHandler(handler: HttpHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
      const adaptedReq = this.adaptRequest(req);
      const adaptedRes = this.adaptResponse(res);
      return handler(adaptedReq, adaptedRes, next);
    };
  }

  private adaptRequest(req: Request): HttpRequest {
    return {
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string | string[]>,
      body: req.body,
      query: req.query as Record<string, string | string[]>,
      params: req.params,
    };
  }

  private adaptResponse(res: Response): HttpResponse {
    return {
      status: (code: number) => {
        res.status(code);
        return this.adaptResponse(res);
      },
      header: (name: string, value: string) => {
        res.header(name, value);
        return this.adaptResponse(res);
      },
      json: (data: any) => {
        res.json(data);
        return this.adaptResponse(res);
      },
      text: (data: string) => {
        res.send(data);
        return this.adaptResponse(res);
      },
      end: () => {
        res.end();
        return this.adaptResponse(res);
      },
    };
  }
}
