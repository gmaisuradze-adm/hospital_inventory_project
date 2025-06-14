interface ITRequestFilters {
    status?: string;
    priority?: string;
    category?: string;
    department?: string;
    assignedTo?: string;
    requestedBy?: string;
    search?: string;
}
interface SortOptions {
    field: string;
    order: 'asc' | 'desc';
}
interface CreateITRequestData {
    title: string;
    description: string;
    department: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'SECURITY' | 'MAINTENANCE' | 'OTHER';
    requestedBy: string;
    requestedDate?: string;
    estimatedCost?: number;
    justification?: string;
}
interface UpdateITRequestData {
    title?: string;
    description?: string;
    department?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category?: 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'SECURITY' | 'MAINTENANCE' | 'OTHER';
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    requestedDate?: string;
    estimatedCost?: number;
    actualCost?: number;
    justification?: string;
    notes?: string;
    assignedTo?: string;
}
export declare class ITRequestService {
    private prisma;
    constructor();
    getITRequests(page?: number, limit?: number, filters?: ITRequestFilters, sort?: SortOptions): Promise<{
        data: ({
            requestedByUser: {
                id: string;
                email: string;
                firstName: string | null;
                lastName: string | null;
            };
            assignedToUser: {
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
            assignedTo: string | null;
            category: string;
            quantity: number;
            itemId: string | null;
            notes: string | null;
            estimatedCost: number | null;
            actualCost: number | null;
            justification: string | null;
            requestedBy: string;
            requestedDate: Date | null;
            completedAt: Date | null;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    getITRequestById(id: string): Promise<({
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
            department: string | null;
        };
        assignedToUser: {
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    }) | null>;
    createITRequest(data: CreateITRequestData): Promise<{
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    }>;
    updateITRequest(id: string, data: UpdateITRequestData): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        assignedToUser: {
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    }>;
    deleteITRequest(id: string): Promise<boolean>;
    assignITRequest(id: string, assignedTo: string, notes?: string): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        assignedToUser: {
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    }>;
    updateITRequestStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED', notes?: string, actualCost?: number): Promise<{
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        assignedToUser: {
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    }>;
    getITRequestStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        inProgress: number;
        completed: number;
        urgent: number;
    }>;
    getRequestsByCategory(): Promise<{
        category: string;
        count: number;
    }[]>;
    getRequestsByDepartment(): Promise<{
        department: string;
        count: number;
    }[]>;
    getOverdueRequests(): Promise<({
        requestedByUser: {
            id: string;
            email: string;
            firstName: string | null;
            lastName: string | null;
        };
        assignedToUser: {
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
        assignedTo: string | null;
        category: string;
        quantity: number;
        itemId: string | null;
        notes: string | null;
        estimatedCost: number | null;
        actualCost: number | null;
        justification: string | null;
        requestedBy: string;
        requestedDate: Date | null;
        completedAt: Date | null;
    })[]>;
}
export {};
//# sourceMappingURL=ITRequestService.d.ts.map