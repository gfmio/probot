"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressAdapter = void 0;
const express_1 = __importStar(require("express"));
class ExpressAdapter {
    createRouter() {
        const router = (0, express_1.Router)();
        return new ExpressRouter(router);
    }
    middleware(handler) {
        return (req, res, next) => {
            const adaptedReq = this.adaptRequest(req);
            const adaptedRes = this.adaptResponse(res);
            return handler(adaptedReq, adaptedRes, next);
        };
    }
    static(path, directory) {
        return express_1.default.static(directory);
    }
    adaptRequest(req) {
        return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
        };
    }
    adaptResponse(res) {
        return {
            status: (code) => {
                res.status(code);
                return this.adaptResponse(res);
            },
            header: (name, value) => {
                res.header(name, value);
                return this.adaptResponse(res);
            },
            json: (data) => {
                res.json(data);
                return this.adaptResponse(res);
            },
            text: (data) => {
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
exports.ExpressAdapter = ExpressAdapter;
class ExpressRouter {
    router;
    constructor(router) {
        this.router = router;
    }
    get(path, handler) {
        this.router.get(path, this.adaptHandler(handler));
    }
    post(path, handler) {
        this.router.post(path, this.adaptHandler(handler));
    }
    put(path, handler) {
        this.router.put(path, this.adaptHandler(handler));
    }
    delete(path, handler) {
        this.router.delete(path, this.adaptHandler(handler));
    }
    patch(path, handler) {
        this.router.patch(path, this.adaptHandler(handler));
    }
    use(pathOrHandler, handler) {
        if (typeof pathOrHandler === "string" && handler) {
            this.router.use(pathOrHandler, this.adaptHandler(handler));
        }
        else if (typeof pathOrHandler === "function") {
            this.router.use(this.adaptHandler(pathOrHandler));
        }
    }
    adaptHandler(handler) {
        return (req, res, next) => {
            const adaptedReq = this.adaptRequest(req);
            const adaptedRes = this.adaptResponse(res);
            return handler(adaptedReq, adaptedRes, next);
        };
    }
    adaptRequest(req) {
        return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            query: req.query,
            params: req.params,
        };
    }
    adaptResponse(res) {
        return {
            status: (code) => {
                res.status(code);
                return this.adaptResponse(res);
            },
            header: (name, value) => {
                res.header(name, value);
                return this.adaptResponse(res);
            },
            json: (data) => {
                res.json(data);
                return this.adaptResponse(res);
            },
            text: (data) => {
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
//# sourceMappingURL=express.js.map