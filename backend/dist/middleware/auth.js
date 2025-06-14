"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const helpers_1 = require("../utils/helpers");
const database_1 = require("../utils/database");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = helpers_1.AuthUtils.verifyToken(token);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, username: true, role: true, isActive: true }
        });
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Invalid token or user inactive' });
            return;
        }
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = helpers_1.AuthUtils.verifyToken(token);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, username: true, role: true, isActive: true }
            });
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        // If token is invalid, continue without user
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map