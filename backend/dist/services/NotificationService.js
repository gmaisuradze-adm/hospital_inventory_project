"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = require("../utils/database");
const index_1 = require("../index");
class NotificationService {
    async createNotification(data) {
        const notification = await database_1.prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type,
                userId: data.userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true
                    }
                }
            }
        });
        // Send real-time notification via Socket.IO
        index_1.io.to(`user_${data.userId}`).emit('notification', notification);
        return notification;
    }
    async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false, type) {
        const where = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }
        if (type) {
            where.type = type;
        }
        const [notifications, total] = await Promise.all([
            database_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            database_1.prisma.notification.count({ where })
        ]);
        return {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async markAsRead(notificationId, userId) {
        const notification = await database_1.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId
            },
            data: {
                isRead: true
            }
        });
        return notification;
    }
    async markAllAsRead(userId) {
        const result = await database_1.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
        return result;
    }
    async deleteNotification(notificationId, userId) {
        const result = await database_1.prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId
            }
        });
        return result;
    }
    async getUnreadCount(userId) {
        const count = await database_1.prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });
        return count;
    }
    // Utility methods for common notifications
    async notifyITRequestCreated(requestId, requestTitle, assigneeId) {
        if (assigneeId) {
            await this.createNotification({
                title: 'New IT Request Assigned',
                message: `You have been assigned a new IT request: "${requestTitle}"`,
                type: 'INFO',
                userId: assigneeId
            });
        }
        // Notify all IT staff about new request
        const itStaff = await database_1.prisma.user.findMany({
            where: {
                role: { in: ['IT_STAFF', 'ADMIN'] },
                isActive: true
            },
            select: { id: true }
        });
        for (const staff of itStaff) {
            if (staff.id !== assigneeId) {
                await this.createNotification({
                    title: 'New IT Request',
                    message: `A new IT request has been created: "${requestTitle}"`,
                    type: 'INFO',
                    userId: staff.id
                });
            }
        }
    }
    async notifyITRequestUpdated(requestId, requestTitle, requesterId, status) {
        await this.createNotification({
            title: 'IT Request Updated',
            message: `Your IT request "${requestTitle}" status has been updated to: ${status}`,
            type: 'INFO',
            userId: requesterId
        });
    }
    async notifyProcurementRequestCreated(requestId, itemName) {
        // Notify managers about new procurement request
        const managers = await database_1.prisma.user.findMany({
            where: {
                role: { in: ['MANAGER', 'ADMIN'] },
                isActive: true
            },
            select: { id: true }
        });
        for (const manager of managers) {
            await this.createNotification({
                title: 'New Procurement Request',
                message: `A new procurement request has been created for: "${itemName}"`,
                type: 'INFO',
                userId: manager.id
            });
        }
    }
    async notifyProcurementRequestUpdated(requestId, itemName, requesterId, status) {
        await this.createNotification({
            title: 'Procurement Request Updated',
            message: `Your procurement request for "${itemName}" status has been updated to: ${status}`,
            type: 'INFO',
            userId: requesterId
        });
    }
    async notifyInventoryLowStock(itemId, itemName, currentQuantity, minQuantity) {
        // Notify managers about low stock
        const managers = await database_1.prisma.user.findMany({
            where: {
                role: { in: ['MANAGER', 'ADMIN'] },
                isActive: true
            },
            select: { id: true }
        });
        for (const manager of managers) {
            await this.createNotification({
                title: 'Low Stock Alert',
                message: `"${itemName}" is running low. Current: ${currentQuantity}, Minimum: ${minQuantity}`,
                type: 'WARNING',
                userId: manager.id
            });
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=NotificationService.js.map