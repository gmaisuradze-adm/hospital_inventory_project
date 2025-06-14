"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.asyncHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        user: req.user?.id
    });
    // Zod validation errors
    if (error instanceof zod_1.ZodError) {
        const validationErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        res.status(400).json({
            message: 'Validation failed',
            errors: validationErrors
        });
        return;
    }
    // Prisma errors
    if (error.code === 'P2002') {
        res.status(409).json({
            message: 'A record with this information already exists'
        });
        return;
    }
    if (error.code === 'P2025') {
        res.status(404).json({
            message: 'Record not found'
        });
        return;
    }
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            message: 'Invalid token'
        });
        return;
    }
    if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            message: 'Token expired'
        });
        return;
    }
    // Custom errors
    if (error.statusCode) {
        res.status(error.statusCode).json({
            message: error.message
        });
        return;
    }
    // Default server error
    res.status(500).json({
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map