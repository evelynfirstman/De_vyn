"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_1 = require("./logger");
class ApiError extends Error {
    status;
    code;
    details;
    constructor(status, code, message, details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
exports.ApiError = ApiError;
function notFound(_req, res) {
    res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}
function isPgForeignKeyViolation(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === "23503");
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: {
                code: "BAD_REQUEST",
                message: "Invalid request",
                details: err.flatten(),
            },
        });
        return;
    }
    if (err instanceof ApiError) {
        res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details ?? null,
            },
        });
        return;
    }
    if (isPgForeignKeyViolation(err)) {
        res.status(404).json({
            error: { code: "USER_NOT_FOUND", message: "User does not exist" },
        });
        return;
    }
    logger_1.logger.error({ err }, "unhandled error");
    res
        .status(500)
        .json({ error: { code: "INTERNAL", message: "Unexpected error" } });
}
//# sourceMappingURL=errors.js.map