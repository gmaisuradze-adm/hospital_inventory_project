interface ProcurementFilters {
    status?: string;
    priority?: string;
    category?: string;
    department?: string;
    budget?: string;
    requestedBy?: string;
    search?: string;
}
interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}
interface CreateProcurementData {
    title: string;
    description: string;
    department: string;
    category: 'HARDWARE' | 'SOFTWARE' | 'SERVICES' | 'MAINTENANCE' | 'OTHER';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    estimatedCost: number;
    budget: string;
    vendor?: string;
    deliveryDate?: string;
    justification: string;
    specifications?: string;
    requestedBy: string;
}
interface UpdateProcurementData {
    title?: string;
    description?: string;
    department?: string;
    category?: 'HARDWARE' | 'SOFTWARE' | 'SERVICES' | 'MAINTENANCE' | 'OTHER';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';
    estimatedCost?: number;
    actualCost?: number;
    budget?: string;
    vendor?: string;
    deliveryDate?: string;
    justification?: string;
    specifications?: string;
    notes?: string;
    approvedBy?: string;
}
interface StatusUpdateData {
    notes?: string;
    actualCost?: number;
    vendor?: string;
    orderNumber?: string;
    deliveryDate?: Date;
}
export declare class ProcurementService {
    private prisma;
    constructor();
    getProcurementRequests(page?: number, limit?: number, filters?: ProcurementFilters, sort?: SortOptions): Promise<{
        data: ({
            requestedByUser: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
                department: string | null;
            };
            approvedByUser: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
        } & {
            id: string;
            department: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            title: string;
            description: string;
            priority: string;
            category: string;
            notes: string | null;
            estimatedCost: number;
            actualCost: number | null;
            budget: string;
            vendor: string | null;
            orderNumber: string | null;
            deliveryDate: Date | null;
            justification: string;
            specifications: string | null;
            requestedBy: string;
            approvedBy: string | null;
            approvedAt: Date | null;
            orderedAt: Date | null;
            deliveredAt: Date | null;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    getProcurementById(id: string): Promise<({
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            department: string | null;
        };
        approvedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }) | null>;
    createProcurement(data: CreateProcurementData): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    updateProcurement(id: string, data: UpdateProcurementData): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        approvedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    deleteProcurement(id: string): Promise<boolean>;
    approveProcurement(id: string, approved: boolean, approvedBy: string, notes?: string): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        approvedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    updateProcurementStatus(id: string, status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'DELIVERED' | 'CANCELLED', additionalData?: StatusUpdateData): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        approvedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        } | null;
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    getProcurementStats(): Promise<{
        total: number;
        draft: number;
        pending: number;
        approved: number;
        rejected: number;
        ordered: number;
        delivered: number;
        totalEstimatedCost: number;
        totalActualCost: number;
    }>;
    getBudgetSummary(year?: number, quarter?: number): Promise<{
        period: string;
        allocated: number;
        spent: number;
        pending: number;
        remaining: number;
    }>;
    getProcurementsByCategory(): Promise<{
        category: string;
        count: number;
        estimatedCost: number;
        actualCost: number;
    }[]>;
    getProcurementsByDepartment(): Promise<{
        department: string;
        count: number;
        estimatedCost: number;
        actualCost: number;
    }[]>;
    getOverdueProcurements(): Promise<({
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    })[]>;
    submitForApproval(id: string): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
    } & {
        id: string;
        department: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        notes: string | null;
        estimatedCost: number;
        actualCost: number | null;
        budget: string;
        vendor: string | null;
        orderNumber: string | null;
        deliveryDate: Date | null;
        justification: string;
        specifications: string | null;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        orderedAt: Date | null;
        deliveredAt: Date | null;
    }>;
}
export {};
//# sourceMappingURL=ProcurementService.d.ts.map