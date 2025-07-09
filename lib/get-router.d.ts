import type { HttpRouter } from "./types.js";
/**
 * Get a framework-agnostic router that can be used to expose HTTP endpoints
 *
 * @param router - the parent router
 * @param path - the prefix for the routes
 * @returns a framework-agnostic router
 */
export declare function getRouter(router: HttpRouter, path?: string): HttpRouter;
