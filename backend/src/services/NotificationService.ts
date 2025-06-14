import { prisma } from '../utils/database';
import { CreateNotificationInput } from '../schemas';
import { io } from '../index';

export class NotificationService {
  async createNotification(data: CreateNotificationInput) {
    const notification = await prisma.notification.create({
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
    io.to(`user_${data.userId}`).emit('notification', notification);

    return notification;
  }

  async getUserNotifications(
    userId: string, 
    page: number = 1, 
    limit: number = 20,
    unreadOnly: boolean = false,
    type?: string
  ) {
    const where: any = { userId };
    
    if (unreadOnly) {
      where.isRead = false;
    }
    
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
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

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
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

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
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

  async deleteNotification(notificationId: string, userId: string) {
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });

    return result;
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  }

  // Utility methods for common notifications
  async notifyITRequestCreated(requestId: string, requestTitle: string, assigneeId?: string) {
    if (assigneeId) {
      await this.createNotification({
        title: 'New IT Request Assigned',
        message: `You have been assigned a new IT request: "${requestTitle}"`,
        type: 'INFO',
        userId: assigneeId
      });
    }

    // Notify all IT staff about new request
    const itStaff = await prisma.user.findMany({
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

  async notifyITRequestUpdated(requestId: string, requestTitle: string, requesterId: string, status: string) {
    await this.createNotification({
      title: 'IT Request Updated',
      message: `Your IT request "${requestTitle}" status has been updated to: ${status}`,
      type: 'INFO',
      userId: requesterId
    });
  }

  async notifyProcurementRequestCreated(requestId: string, itemName: string) {
    // Notify managers about new procurement request
    const managers = await prisma.user.findMany({
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

  async notifyProcurementRequestUpdated(requestId: string, itemName: string, requesterId: string, status: string) {
    await this.createNotification({
      title: 'Procurement Request Updated',
      message: `Your procurement request for "${itemName}" status has been updated to: ${status}`,
      type: 'INFO',
      userId: requesterId
    });
  }

  async notifyInventoryLowStock(itemId: string, itemName: string, currentQuantity: number, minQuantity: number) {
    // Notify managers about low stock
    const managers = await prisma.user.findMany({
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
