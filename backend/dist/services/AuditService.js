"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../utils/database");
class AuditService {
    async createLog(data) {
        try {
            return await database_1.prisma.auditLog.create({
                data: {
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    userId: data.userId,
                    oldValues: data.oldValues || null,
                    newValues: data.newValues || null
                }
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw error as audit logging shouldn't break the main operation
        }
    }
    async getAuditLogs(filters) {
        const { entityType, entityId, userId, action, dateFrom, dateTo, page = 1, limit = 50 } = filters;
        const where = {};
        if (entityType)
            where.entityType = entityType;
        if (entityId)
            where.entityId = entityId;
        if (userId)
            where.userId = userId;
        if (action)
            where.action = action;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        const [logs, total] = await Promise.all([
            database_1.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            database_1.prisma.auditLog.count({ where })
        ]);
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    async getEntityHistory(entityType, entityId) {
        const logs = await database_1.prisma.auditLog.findMany({
            where: {
                entityType,
                entityId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return logs;
    }
    async getActivitySummary(userId, days = 30) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        const where = {
            createdAt: {
                gte: dateFrom
            }
        };
        if (userId) {
            where.userId = userId;
        }
        const activities = await database_1.prisma.auditLog.groupBy({
            by: ['action', 'entityType'],
            where,
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            }
        });
        return activities.map(activity => ({
            action: activity.action,
            entityType: activity.entityType,
            count: activity._count.id
        }));
    }
    async logAction(data) {
        try {
            return await database_1.prisma.auditLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    resource: data.resource,
                    resourceId: data.resourceId,
                    entityType: data.resource,
                    details: data.details ? JSON.stringify(data.details) : null,
                    oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
                    newValues: data.newValues ? JSON.stringify(data.newValues) : null,
                }
            });
        }
        catch (error) {
            console.error('Failed to log action:', error);
            // Don't throw error as audit logging shouldn't break the main operation
        }
    }
    async getAuditLogById(id) {
        return await database_1.prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }
    async getAuditStats(filters = {}) {
        const { dateFrom, dateTo, userId } = filters;
        const where = {};
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        if (userId)
            where.userId = userId;
        const [total, byAction, byResource] = await Promise.all([
            database_1.prisma.auditLog.count({ where }),
            database_1.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: {
                    id: true
                }
            }),
            database_1.prisma.auditLog.groupBy({
                by: ['resource'],
                where,
                _count: {
                    id: true
                }
            })
        ]);
        return {
            total,
            byAction: byAction.map(item => ({
                action: item.action,
                count: item._count.id
            })),
            byResource: byResource.map(item => ({
                resource: item.resource,
                count: item._count.id
            }))
        };
    }
    async getUserActivity(userId, filters = {}) {
        const { dateFrom, dateTo, limit = 50 } = filters;
        const where = { userId };
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = dateFrom;
            if (dateTo)
                where.createdAt.lte = dateTo;
        }
        return await database_1.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                action: true,
                resource: true,
                resourceId: true,
                details: true,
                createdAt: true
            }
        });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=AuditService.js.map