import { UpdateUserInput } from '../schemas';
export declare class UserService {
    private auditService;
    private notificationService;
    getUsers(filters: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
        isActive?: boolean;
    }): Promise<{
        users: {
            id: string;
            email: string;
            username: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            isActive: boolean;
            createdAt: Date;
            lastLogin: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        isActive: boolean;
        createdAt: Date;
        lastLogin: Date | null;
    }>;
    updateUser(id: string, data: UpdateUserInput, updatedBy: string): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    deactivateUser(id: string, deactivatedBy: string): Promise<{
        message: string;
    }>;
    activateUser(id: string, activatedBy: string): Promise<{
        message: string;
    }>;
    getUsersByRole(): Promise<{
        role: string;
        count: number;
    }[]>;
    resetUserPassword(id: string, resetBy: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    searchUsers(query: string, limit?: number): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
    }[]>;
    getUserStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        usersByRole: {
            role: string;
            count: number;
        }[];
    }>;
}
//# sourceMappingURL=UserService.d.ts.map