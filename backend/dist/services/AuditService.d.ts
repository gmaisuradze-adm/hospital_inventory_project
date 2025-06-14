interface AuditLogInput {
    action: string;
    entityType: string;
    entityId?: string;
    userId: string;
    oldValues?: any;
    newValues?: any;
}
export declare class AuditService {
    createLog(data: AuditLogInput): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        resource: string;
        resourceId: string | null;
        entityType: string | null;
        details: string | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    } | undefined>;
    getAuditLogs(filters: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: string;
        dateFrom?: Date;
        dateTo?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: ({
            user: {
                id: string;
                email: string;
                username: string;
                firstName: string | null;
                lastName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            resource: string;
            resourceId: string | null;
            entityType: string | null;
            details: string | null;
            oldValues: string | null;
            newValues: string | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getEntityHistory(entityType: string, entityId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        resource: string;
        resourceId: string | null;
        entityType: string | null;
        details: string | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    getActivitySummary(userId?: string, days?: number): Promise<{
        action: string;
        entityType: string | null;
        count: number;
    }[]>;
    logAction(data: {
        userId: string;
        action: string;
        resource: string;
        resourceId?: string;
        details?: any;
        oldValues?: any;
        newValues?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        resource: string;
        resourceId: string | null;
        entityType: string | null;
        details: string | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    } | undefined>;
    getAuditLogById(id: string): Promise<({
        user: {
            id: string;
            email: string;
            username: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        resource: string;
        resourceId: string | null;
        entityType: string | null;
        details: string | null;
        oldValues: string | null;
        newValues: string | null;
        ipAddress: string | null;
        userAgent: string | null;
    }) | null>;
    getAuditStats(filters?: {
        dateFrom?: Date;
        dateTo?: Date;
        userId?: string;
    }): Promise<{
        total: number;
        byAction: {
            action: string;
            count: number;
        }[];
        byResource: {
            resource: string;
            count: number;
        }[];
    }>;
    getUserActivity(userId: string, filters?: {
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        resource: string;
        resourceId: string | null;
        details: string | null;
    }[]>;
}
export {};
//# sourceMappingURL=AuditService.d.ts.map