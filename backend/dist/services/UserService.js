"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../utils/database");
const errorHandler_1 = require("../middleware/errorHandler");
const AuditService_1 = require("./AuditService");
const NotificationService_1 = require("./NotificationService");
const helpers_1 = require("../utils/helpers");
class UserService {
    constructor() {
        this.auditService = new AuditService_1.AuditService();
        this.notificationService = new NotificationService_1.NotificationService();
    }
    async getUsers(filters) {
        const { page = 1, limit = 50, role, search, isActive } = filters;
        const where = {};
        if (role)
            where.role = role;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    lastLogin: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            database_1.prisma.user.count({ where })
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async getUserById(id) {
        const user = await database_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLogin: true
            }
        });
        if (!user) {
            throw (0, errorHandler_1.createError)('User not found', 404);
        }
        return user;
    }
    async updateUser(id, data, updatedBy) {
        const existingUser = await this.getUserById(id);
        const updatedUser = await database_1.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                updatedAt: true
            }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'USER_UPDATED',
            entityType: 'USER',
            entityId: id,
            userId: updatedBy,
            oldValues: existingUser,
            newValues: updatedUser
        });
        // Send notification if role changed
        if (data.role && data.role !== existingUser.role) {
            await this.notificationService.createNotification({
                title: 'Role Updated',
                message: `Your role has been updated to: ${data.role}`,
                type: 'INFO',
                userId: id
            });
        }
        return updatedUser;
    }
    async deactivateUser(id, deactivatedBy) {
        const existingUser = await this.getUserById(id);
        if (!existingUser.isActive) {
            throw (0, errorHandler_1.createError)('User is already inactive', 400);
        }
        await database_1.prisma.user.update({
            where: { id },
            data: { isActive: false }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'USER_DEACTIVATED',
            entityType: 'USER',
            entityId: id,
            userId: deactivatedBy,
            oldValues: { isActive: true },
            newValues: { isActive: false }
        });
        // Send notification
        await this.notificationService.createNotification({
            title: 'Account Deactivated',
            message: 'Your account has been deactivated. Please contact your administrator.',
            type: 'WARNING',
            userId: id
        });
        return { message: 'User deactivated successfully' };
    }
    async activateUser(id, activatedBy) {
        const existingUser = await this.getUserById(id);
        if (existingUser.isActive) {
            throw (0, errorHandler_1.createError)('User is already active', 400);
        }
        await database_1.prisma.user.update({
            where: { id },
            data: { isActive: true }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'USER_ACTIVATED',
            entityType: 'USER',
            entityId: id,
            userId: activatedBy,
            oldValues: { isActive: false },
            newValues: { isActive: true }
        });
        // Send notification
        await this.notificationService.createNotification({
            title: 'Account Activated',
            message: 'Your account has been activated. You can now access the system.',
            type: 'SUCCESS',
            userId: id
        });
        return { message: 'User activated successfully' };
    }
    async getUsersByRole() {
        const roles = await database_1.prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            },
            where: {
                isActive: true
            }
        });
        return roles.map(role => ({
            role: role.role,
            count: role._count.id
        }));
    }
    async resetUserPassword(id, resetBy) {
        const user = await this.getUserById(id);
        // Generate a new temporary password
        const temporaryPassword = helpers_1.AuthUtils.generateRandomPassword(12);
        const hashedPassword = await helpers_1.AuthUtils.hashPassword(temporaryPassword);
        await database_1.prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });
        // Create audit log
        await this.auditService.createLog({
            action: 'PASSWORD_RESET_BY_ADMIN',
            entityType: 'USER',
            entityId: id,
            userId: resetBy,
            newValues: { passwordResetBy: resetBy, resetAt: new Date() }
        });
        // Send notification with temporary password
        await this.notificationService.createNotification({
            title: 'Password Reset',
            message: `Your password has been reset. Temporary password: ${temporaryPassword}. Please change it immediately after login.`,
            type: 'WARNING',
            userId: id
        });
        return {
            message: 'Password reset successfully',
            temporaryPassword // In production, this should be sent via secure channel
        };
    }
    async searchUsers(query, limit = 10) {
        const users = await database_1.prisma.user.findMany({
            where: {
                isActive: true,
                OR: [
                    { email: { contains: query } },
                    { username: { contains: query } },
                    { firstName: { contains: query } },
                    { lastName: { contains: query } }
                ]
            },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true
            },
            take: limit,
            orderBy: { username: 'asc' }
        });
        return users;
    }
    async getUserStats() {
        const [totalUsers, activeUsers, usersByRole] = await Promise.all([
            database_1.prisma.user.count(),
            database_1.prisma.user.count({ where: { isActive: true } }),
            database_1.prisma.user.groupBy({
                by: ['role'],
                _count: {
                    id: true
                }
            })
        ]);
        return {
            totalUsers,
            activeUsers,
            usersByRole: usersByRole.map(item => ({
                role: item.role,
                count: item._count.id
            }))
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map