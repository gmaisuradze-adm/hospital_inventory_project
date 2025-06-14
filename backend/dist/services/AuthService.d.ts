import { RegisterInput, LoginInput } from '../schemas';
export declare class AuthService {
    private auditService;
    private notificationService;
    register(data: RegisterInput): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            createdAt: Date;
        };
        token: string;
        message: string;
    }>;
    login(data: LoginInput): Promise<{
        user: {
            id: string;
            email: string;
            username: string;
            firstName: string | null;
            lastName: string | null;
            role: string;
            department: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            lastLogin: Date | null;
        };
        token: string;
        message: string;
    }>;
    requestPasswordReset(email: string): Promise<{
        message: string;
    } | undefined>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    verifyToken(token: string): Promise<boolean>;
}
//# sourceMappingURL=AuthService.d.ts.map