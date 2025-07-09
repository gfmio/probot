import type { State } from "../types.js";
import type { Logger } from "pino";
export declare function getAuthenticatedOctokit(state: State, installationId?: number, log?: Logger): Promise<import("@octokit/core", { with: { "resolution-mode": "import" } }).Octokit & {
    retry: {
        retryRequest: (error: import("@octokit/request-error", { with: { "resolution-mode": "import" } }).RequestError, retries: number, retryAfter: number) => import("@octokit/request-error", { with: { "resolution-mode": "import" } }).RequestError;
    };
} & {
    paginate: import("@octokit/plugin-paginate-rest", { with: { "resolution-mode": "import" } }).PaginateInterface;
} & import("../../node_modules/@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types.js", { with: { "resolution-mode": "import" } }).RestEndpointMethods & import("@octokit/plugin-rest-endpoint-methods", { with: { "resolution-mode": "import" } }).Api & import("@probot/octokit-plugin-config", { with: { "resolution-mode": "import" } }).API>;
