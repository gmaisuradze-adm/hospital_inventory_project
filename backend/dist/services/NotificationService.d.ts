import { CreateNotificationInput } from '../schemas';
export declare class NotificationService {
    createNotification(data: CreateNotificationInput): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
        };
    } & {
        message: string;
        id: string;
        createdAt: Date;
        type: string;
        title: string;
        userId: string;
        isRead: boolean;
    }>;
    getUserNotifications(userId: string, page?: number, limit?: number, unreadOnly?: boolean, type?: string): Promise<{
        notifications: {
            message: string;
            id: string;
            createdAt: Date;
            type: string;
            title: string;
            userId: string;
            isRead: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    markAsRead(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    deleteNotification(notificationId: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
    notifyITRequestCreated(requestId: string, requestTitle: string, assigneeId?: string): Promise<void>;
    notifyITRequestUpdated(requestId: string, requestTitle: string, requesterId: string, status: string): Promise<void>;
    notifyProcurementRequestCreated(requestId: string, itemName: string): Promise<void>;
    notifyProcurementRequestUpdated(requestId: string, itemName: string, requesterId: string, status: string): Promise<void>;
    notifyInventoryLowStock(itemId: string, itemName: string, currentQuantity: number, minQuantity: number): Promise<void>;
}
//# sourceMappingURL=NotificationService.d.ts.map