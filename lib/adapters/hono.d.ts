import type { HttpAdapter, HttpRouter, HttpHandler } from "../types.js";
export declare class HonoAdapter implements HttpAdapter {
    createRouter(): HttpRouter;
    middleware(handler: HttpHandler): any;
    static(path: string, directory: string): any;
    private adaptRequest;
    private adaptResponse;
}
