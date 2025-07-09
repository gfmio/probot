import { type RedisOptions } from "ioredis";
import type { Logger } from "pino";
type Options = {
    log: Logger;
    redisConfig?: RedisOptions | string;
};
export declare function getOctokitThrottleOptions(options: Options): import("../../node_modules/@octokit/plugin-throttling/dist-types/types.js", { with: { "resolution-mode": "import" } }).ThrottlingOptionsBase & import("../../node_modules/@octokit/plugin-throttling/dist-types/types.js", { with: { "resolution-mode": "import" } }).SecondaryLimitHandler;
export {};
