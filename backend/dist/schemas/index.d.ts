import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANAGER", "IT_STAFF", "USER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "ADMIN" | "MANAGER" | "IT_STAFF" | "USER" | undefined;
}, {
    email: string;
    username: string;
    password: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "ADMIN" | "MANAGER" | "IT_STAFF" | "USER" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANAGER", "IT_STAFF", "USER"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "ADMIN" | "MANAGER" | "IT_STAFF" | "USER" | undefined;
    isActive?: boolean | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    role?: "ADMIN" | "MANAGER" | "IT_STAFF" | "USER" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const createITRequestSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    requestType: z.ZodEnum<["HARDWARE_ISSUE", "SOFTWARE_ISSUE", "NETWORK_ISSUE", "ACCESS_REQUEST", "NEW_EQUIPMENT", "MAINTENANCE", "OTHER"]>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    requestType: "HARDWARE_ISSUE" | "SOFTWARE_ISSUE" | "NETWORK_ISSUE" | "ACCESS_REQUEST" | "NEW_EQUIPMENT" | "MAINTENANCE" | "OTHER";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}, {
    title: string;
    description: string;
    requestType: "HARDWARE_ISSUE" | "SOFTWARE_ISSUE" | "NETWORK_ISSUE" | "ACCESS_REQUEST" | "NEW_EQUIPMENT" | "MAINTENANCE" | "OTHER";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}>;
export declare const updateITRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"]>>;
    assignedTo: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ON_HOLD" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    assignedTo?: string | undefined;
}, {
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "ON_HOLD" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    assignedTo?: string | undefined;
}>;
export declare const createInventoryItemSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["COMPUTER", "SERVER", "PRINTER", "NETWORK_EQUIPMENT", "PERIPHERAL", "SOFTWARE", "CONSUMABLE", "SPARE_PART", "MOBILE_DEVICE", "OTHER"]>;
    location: z.ZodString;
    serialNumber: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    manufacturer: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    warrantyExpiry: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodDefault<z.ZodNumber>;
    minQuantity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: "OTHER" | "COMPUTER" | "SERVER" | "PRINTER" | "NETWORK_EQUIPMENT" | "PERIPHERAL" | "SOFTWARE" | "CONSUMABLE" | "SPARE_PART" | "MOBILE_DEVICE";
    location: string;
    quantity: number;
    model?: string | undefined;
    description?: string | undefined;
    serialNumber?: string | undefined;
    manufacturer?: string | undefined;
    purchaseDate?: string | undefined;
    warrantyExpiry?: string | undefined;
    cost?: number | undefined;
    minQuantity?: number | undefined;
}, {
    name: string;
    category: "OTHER" | "COMPUTER" | "SERVER" | "PRINTER" | "NETWORK_EQUIPMENT" | "PERIPHERAL" | "SOFTWARE" | "CONSUMABLE" | "SPARE_PART" | "MOBILE_DEVICE";
    location: string;
    model?: string | undefined;
    description?: string | undefined;
    serialNumber?: string | undefined;
    manufacturer?: string | undefined;
    purchaseDate?: string | undefined;
    warrantyExpiry?: string | undefined;
    cost?: number | undefined;
    quantity?: number | undefined;
    minQuantity?: number | undefined;
}>;
export declare const updateInventoryItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["COMPUTER", "SERVER", "PRINTER", "NETWORK_EQUIPMENT", "PERIPHERAL", "SOFTWARE", "CONSUMABLE", "SPARE_PART", "MOBILE_DEVICE", "OTHER"]>>;
    status: z.ZodOptional<z.ZodEnum<["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED", "DAMAGED", "RESERVED"]>>;
    location: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    manufacturer: z.ZodOptional<z.ZodString>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    warrantyExpiry: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodOptional<z.ZodNumber>;
    minQuantity: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model?: string | undefined;
    name?: string | undefined;
    status?: "MAINTENANCE" | "AVAILABLE" | "IN_USE" | "RETIRED" | "DAMAGED" | "RESERVED" | undefined;
    description?: string | undefined;
    category?: "OTHER" | "COMPUTER" | "SERVER" | "PRINTER" | "NETWORK_EQUIPMENT" | "PERIPHERAL" | "SOFTWARE" | "CONSUMABLE" | "SPARE_PART" | "MOBILE_DEVICE" | undefined;
    location?: string | undefined;
    serialNumber?: string | undefined;
    manufacturer?: string | undefined;
    purchaseDate?: string | undefined;
    warrantyExpiry?: string | undefined;
    cost?: number | undefined;
    quantity?: number | undefined;
    minQuantity?: number | undefined;
}, {
    model?: string | undefined;
    name?: string | undefined;
    status?: "MAINTENANCE" | "AVAILABLE" | "IN_USE" | "RETIRED" | "DAMAGED" | "RESERVED" | undefined;
    description?: string | undefined;
    category?: "OTHER" | "COMPUTER" | "SERVER" | "PRINTER" | "NETWORK_EQUIPMENT" | "PERIPHERAL" | "SOFTWARE" | "CONSUMABLE" | "SPARE_PART" | "MOBILE_DEVICE" | undefined;
    location?: string | undefined;
    serialNumber?: string | undefined;
    manufacturer?: string | undefined;
    purchaseDate?: string | undefined;
    warrantyExpiry?: string | undefined;
    cost?: number | undefined;
    quantity?: number | undefined;
    minQuantity?: number | undefined;
}>;
export declare const createProcurementRequestSchema: z.ZodObject<{
    itemName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    itemId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    quantity: number;
    itemName: string;
    description?: string | undefined;
    itemId?: string | undefined;
}, {
    quantity: number;
    itemName: string;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
    itemId?: string | undefined;
}>;
export declare const updateProcurementRequestSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["PENDING", "APPROVED", "ORDERED", "RECEIVED", "CANCELLED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "CANCELLED" | "APPROVED" | "ORDERED" | "RECEIVED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}, {
    status?: "PENDING" | "CANCELLED" | "APPROVED" | "ORDERED" | "RECEIVED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}>;
export declare const createFormSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fields: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<["text", "number", "email", "date", "select", "textarea", "checkbox"]>;
        label: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        validation: z.ZodOptional<z.ZodObject<{
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
            pattern: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        }, {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "number" | "select" | "email" | "date" | "text" | "textarea" | "checkbox";
        label: string;
        required: boolean;
        options?: string[] | undefined;
        validation?: {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        } | undefined;
    }, {
        name: string;
        type: "number" | "select" | "email" | "date" | "text" | "textarea" | "checkbox";
        label: string;
        options?: string[] | undefined;
        validation?: {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        } | undefined;
        required?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    fields: {
        name: string;
        type: "number" | "select" | "email" | "date" | "text" | "textarea" | "checkbox";
        label: string;
        required: boolean;
        options?: string[] | undefined;
        validation?: {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        } | undefined;
    }[];
    name: string;
    description?: string | undefined;
}, {
    fields: {
        name: string;
        type: "number" | "select" | "email" | "date" | "text" | "textarea" | "checkbox";
        label: string;
        options?: string[] | undefined;
        validation?: {
            min?: number | undefined;
            max?: number | undefined;
            pattern?: string | undefined;
        } | undefined;
        required?: boolean | undefined;
    }[];
    name: string;
    description?: string | undefined;
}>;
export declare const submitFormSchema: z.ZodObject<{
    formId: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, any>;
    formId: string;
}, {
    data: Record<string, any>;
    formId: string;
}>;
export declare const generateReportSchema: z.ZodObject<{
    type: z.ZodEnum<["INVENTORY", "PROCUREMENT", "REQUESTS", "AUDIT", "ANALYTICS"]>;
    parameters: z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        format: z.ZodDefault<z.ZodEnum<["CSV", "PDF"]>>;
    }, "strip", z.ZodTypeAny, {
        format: "CSV" | "PDF";
        status?: string | undefined;
        category?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        status?: string | undefined;
        category?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        format?: "CSV" | "PDF" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "INVENTORY" | "PROCUREMENT" | "REQUESTS" | "AUDIT" | "ANALYTICS";
    parameters: {
        format: "CSV" | "PDF";
        status?: string | undefined;
        category?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}, {
    type: "INVENTORY" | "PROCUREMENT" | "REQUESTS" | "AUDIT" | "ANALYTICS";
    parameters: {
        status?: string | undefined;
        category?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        format?: "CSV" | "PDF" | undefined;
    };
}>;
export declare const createNotificationSchema: z.ZodObject<{
    title: z.ZodString;
    message: z.ZodString;
    type: z.ZodEnum<["INFO", "WARNING", "ERROR", "SUCCESS"]>;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
    title: string;
    userId: string;
}, {
    message: string;
    type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
    title: string;
    userId: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateITRequestInput = z.infer<typeof createITRequestSchema>;
export type UpdateITRequestInput = z.infer<typeof updateITRequestSchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type CreateProcurementRequestInput = z.infer<typeof createProcurementRequestSchema>;
export type UpdateProcurementRequestInput = z.infer<typeof updateProcurementRequestSchema>;
export type CreateFormInput = z.infer<typeof createFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
//# sourceMappingURL=index.d.ts.map