"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouter = getRouter;
/**
 * Get a framework-agnostic router that can be used to expose HTTP endpoints
 *
 * @param router - the parent router
 * @param path - the prefix for the routes
 * @returns a framework-agnostic router
 */
function getRouter(router, path) {
    if (path) {
        // For now, return the same router as we'll handle path prefixing in the adapter
        // In a full implementation, we might want to create a sub-router
        return router;
    }
    return router;
}
//# sourceMappingURL=get-router.js.map