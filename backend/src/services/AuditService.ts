import { prisma } from '../utils/database';
import { createError } from '../middleware/errorHandler';

interface AuditLogInput {
  action: string;
  entityType: string;
  entityId?: string;
  userId: string;
  oldValues?: any;
  newValues?: any;
}

export class AuditService {
  async createLog(data: AuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error as audit logging shouldn't break the main operation
    }
  }

  async getAuditLogs(filters: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      entityType,
      entityId,
      userId,
      action,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50
    } = filters;

    const where: any = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where })
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

  async getEntityHistory(entityType: string, entityId: string) {
    const logs = await prisma.auditLog.findMany({
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

  async getActivitySummary(userId?: string, days: number = 30) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const where: any = {
      createdAt: {
        gte: dateFrom
      }
    };

    if (userId) {
      where.userId = userId;
    }

    const activities = await prisma.auditLog.groupBy({
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

  async logAction(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    oldValues?: any;
    newValues?: any;
  }) {
    try {
      return await prisma.auditLog.create({
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
    } catch (error) {
      console.error('Failed to log action:', error);
      // Don't throw error as audit logging shouldn't break the main operation
    }
  }

  async getAuditLogById(id: string) {
    return await prisma.auditLog.findUnique({
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

  async getAuditStats(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
  } = {}) {
    const { dateFrom, dateTo, userId } = filters;
    
    const where: any = {};
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }
    
    if (userId) where.userId = userId;

    const [total, byAction, byResource] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          id: true
        }
      }),
      prisma.auditLog.groupBy({
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

  async getUserActivity(userId: string, filters: {
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  } = {}) {
    const { dateFrom, dateTo, limit = 50 } = filters;
    
    const where: any = { userId };
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    return await prisma.auditLog.findMany({
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
