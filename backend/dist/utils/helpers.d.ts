export declare class AuthUtils {
    static generateToken(payload: any): string;
    static verifyToken(token: string): any;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateRandomPassword(length?: number): string;
}
export declare class ValidationUtils {
    static isValidEmail(email: string): boolean;
    static isStrongPassword(password: string): boolean;
    static sanitizeInput(input: string): string;
}
export declare class DateUtils {
    static formatDate(date: Date): string;
    static addDays(date: Date, days: number): Date;
    static isDateExpired(date: Date): boolean;
}
export declare class StringUtils {
    static generateId(prefix?: string): string;
    static truncate(str: string, length: number): string;
    static capitalize(str: string): string;
}
export declare class NumberUtils {
    static formatCurrency(amount: number, currency?: string): string;
    static roundToDecimal(num: number, decimals?: number): number;
}
//# sourceMappingURL=helpers.d.ts.map