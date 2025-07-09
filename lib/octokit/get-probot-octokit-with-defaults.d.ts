import type { LRUCache } from "lru-cache";
import { ProbotOctokit } from "./probot-octokit.js";
import type { RedisOptions } from "ioredis";
import type { Logger } from "pino";
import type { RequestRequestOptions } from "@octokit/types";
type Options = {
    cache: LRUCache<number, string>;
    Octokit: typeof ProbotOctokit;
    log: Logger;
    githubToken?: string;
    appId?: number;
    privateKey?: string;
    redisConfig?: RedisOptions | string;
    webhookPath?: string;
    baseUrl?: string;
    request?: RequestRequestOptions;
};
/**
 * Returns an Octokit instance with default settings for authentication. If
 * a `githubToken` is passed explicitly, the Octokit instance will be
 * pre-authenticated with that token when instantiated. Otherwise Octokit's
 * app authentication strategy is used, and `options.auth` options are merged
 * deeply when instantiated.
 *
 * Besides the authentication, the Octokit's baseUrl is set as well when run
 * against a GitHub Enterprise Server with a custom domain.
 */
export declare function getProbotOctokitWithDefaults(options: Options): typeof import("@octokit/core", { with: { "resolution-mode": "import" } }).Octokit & import("@octokit/core/types", { with: { "resolution-mode": "import" } }).Constructor<{
    retry: {
        retryRequest: (error: import("@octokit/request-error", { with: { "resolution-mode": "import" } }).RequestError, retries: number, retryAfter: number) => import("@octokit/request-error", { with: { "resolution-mode": "import" } }).RequestError;
    };
} & {
    paginate: import("@octokit/plugin-paginate-rest", { with: { "resolution-mode": "import" } }).PaginateInterface;
} & import("../../node_modules/@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types.js", { with: { "resolution-mode": "import" } }).RestEndpointMethods & import("@octokit/plugin-rest-endpoint-methods", { with: { "resolution-mode": "import" } }).Api & import("@probot/octokit-plugin-config", { with: { "resolution-mode": "import" } }).API>;
export {};
