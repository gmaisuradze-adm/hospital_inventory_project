"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const database_1 = require("../utils/database");
const helpers_1 = require("../utils/helpers");
const errorHandler_1 = require("../middleware/errorHandler");
const AuditService_1 = require("./AuditService");
const NotificationService_1 = require("./NotificationService");
class AuthService {
    constructor() {
        this.auditService = new AuditService_1.AuditService();
        this.notificationService = new NotificationService_1.NotificationService();
    }
    async register(data) {
        const { email, username, password, firstName, lastName, role = 'USER' } = data;
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase() },
                    { username }
                ]
            }
        });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                throw (0, errorHandler_1.createError)('Email already registered', 409);
            }
            if (existingUser.username === username) {
                throw (0, errorHandler_1.createError)('Username already taken', 409);
            }
        }
        // Validate password strength
        if (!helpers_1.ValidationUtils.isStrongPassword(password)) {
            throw (0, errorHandler_1.createError)('Password must contain at least 8 characters, including uppercase, lowercase, number and special character', 400);
        }
        // Hash password
        const hashedPassword = await helpers_1.AuthUtils.hashPassword(password);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email: email.toLowerCase(),
                username,
                password: hashedPassword,
                firstName,
                lastName,
                role: role
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'USER_REGISTERED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            newValues: { email: user.email, username: user.username, role: user.role }
        });
        // Send welcome notification
        await this.notificationService.createNotification({
            title: 'Welcome to Hospital Inventory System',
            message: 'Your account has been created successfully. You can now access the system.',
            type: 'SUCCESS',
            userId: user.id
        });
        // Generate token
        const token = helpers_1.AuthUtils.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });
        return {
            user,
            token,
            message: 'User registered successfully'
        };
    }
    async login(data) {
        const { email, password } = data;
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (!user || !user.isActive) {
            throw (0, errorHandler_1.createError)('Invalid credentials', 401);
        }
        // Verify password
        const isValidPassword = await helpers_1.AuthUtils.comparePassword(password, user.password);
        if (!isValidPassword) {
            throw (0, errorHandler_1.createError)('Invalid credentials', 401);
        }
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'USER_LOGIN',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            newValues: { lastLogin: new Date() }
        });
        // Generate token
        const token = helpers_1.AuthUtils.generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            token,
            message: 'Login successful'
        };
    }
    async requestPasswordReset(email) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (!user) {
            // Don't reveal if email exists for security
            return;
        }
        // Generate reset token (in production, store this in database with expiry)
        const resetToken = helpers_1.AuthUtils.generateToken({
            id: user.id,
            type: 'password_reset'
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'PASSWORD_RESET_REQUESTED',
            entityType: 'USER',
            entityId: user.id,
            userId: user.id,
            newValues: { requestedAt: new Date() }
        });
        // In production, send email with reset link
        console.log(`Password reset token for ${email}: ${resetToken}`);
        return { message: 'Password reset email sent' };
    }
    async resetPassword(token, newPassword) {
        try {
            const decoded = helpers_1.AuthUtils.verifyToken(token);
            if (decoded.type !== 'password_reset') {
                throw (0, errorHandler_1.createError)('Invalid reset token', 400);
            }
            // Validate new password
            if (!helpers_1.ValidationUtils.isStrongPassword(newPassword)) {
                throw (0, errorHandler_1.createError)('Password must contain at least 8 characters, including uppercase, lowercase, number and special character', 400);
            }
            // Hash new password
            const hashedPassword = await helpers_1.AuthUtils.hashPassword(newPassword);
            // Update user password
            await database_1.prisma.user.update({
                where: { id: decoded.id },
                data: { password: hashedPassword }
            });
            // Create audit log
            await this.auditService.createLog({
                action: 'PASSWORD_RESET',
                entityType: 'USER',
                entityId: decoded.id,
                userId: decoded.id,
                newValues: { passwordResetAt: new Date() }
            });
            return { message: 'Password reset successfully' };
        }
        catch (error) {
            throw (0, errorHandler_1.createError)('Invalid or expired reset token', 400);
        }
    }
    async verifyToken(token) {
        try {
            const decoded = helpers_1.AuthUtils.verifyToken(token);
            const user = await database_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, isActive: true }
            });
            return !!(user && user.isActive);
        }
        catch (error) {
            return false;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map