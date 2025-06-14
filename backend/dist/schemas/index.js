"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = exports.generateReportSchema = exports.submitFormSchema = exports.createFormSchema = exports.updateProcurementRequestSchema = exports.createProcurementRequestSchema = exports.updateInventoryItemSchema = exports.createInventoryItemSchema = exports.updateITRequestSchema = exports.createITRequestSchema = exports.updateUserSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// User Schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'IT_STAFF', 'USER']).optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'IT_STAFF', 'USER']).optional(),
    isActive: zod_1.z.boolean().optional()
});
// IT Request Schemas
exports.createITRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(1, 'Description is required'),
    requestType: zod_1.z.enum(['HARDWARE_ISSUE', 'SOFTWARE_ISSUE', 'NETWORK_ISSUE', 'ACCESS_REQUEST', 'NEW_EQUIPMENT', 'MAINTENANCE', 'OTHER']),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
});
exports.updateITRequestSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
    assignedTo: zod_1.z.string().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});
// Inventory Schemas
exports.createInventoryItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.enum(['COMPUTER', 'SERVER', 'PRINTER', 'NETWORK_EQUIPMENT', 'PERIPHERAL', 'SOFTWARE', 'CONSUMABLE', 'SPARE_PART', 'MOBILE_DEVICE', 'OTHER']),
    location: zod_1.z.string().min(1, 'Location is required'),
    serialNumber: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    purchaseDate: zod_1.z.string().optional(),
    warrantyExpiry: zod_1.z.string().optional(),
    cost: zod_1.z.number().optional(),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1').default(1),
    minQuantity: zod_1.z.number().optional()
});
exports.updateInventoryItemSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.enum(['COMPUTER', 'SERVER', 'PRINTER', 'NETWORK_EQUIPMENT', 'PERIPHERAL', 'SOFTWARE', 'CONSUMABLE', 'SPARE_PART', 'MOBILE_DEVICE', 'OTHER']).optional(),
    status: zod_1.z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DAMAGED', 'RESERVED']).optional(),
    location: zod_1.z.string().optional(),
    serialNumber: zod_1.z.string().optional(),
    model: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    purchaseDate: zod_1.z.string().optional(),
    warrantyExpiry: zod_1.z.string().optional(),
    cost: zod_1.z.number().optional(),
    quantity: zod_1.z.number().optional(),
    minQuantity: zod_1.z.number().optional()
});
// Procurement Schemas
exports.createProcurementRequestSchema = zod_1.z.object({
    itemName: zod_1.z.string().min(1, 'Item name is required'),
    description: zod_1.z.string().optional(),
    quantity: zod_1.z.number().min(1, 'Quantity must be at least 1'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    itemId: zod_1.z.string().optional()
});
exports.updateProcurementRequestSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});
// Form Schemas
exports.createFormSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Form name is required'),
    description: zod_1.z.string().optional(),
    fields: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.enum(['text', 'number', 'email', 'date', 'select', 'textarea', 'checkbox']),
        label: zod_1.z.string(),
        required: zod_1.z.boolean().default(false),
        options: zod_1.z.array(zod_1.z.string()).optional(),
        validation: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            pattern: zod_1.z.string().optional()
        }).optional()
    }))
});
exports.submitFormSchema = zod_1.z.object({
    formId: zod_1.z.string().min(1, 'Form ID is required'),
    data: zod_1.z.record(zod_1.z.any())
});
// Report Schemas
exports.generateReportSchema = zod_1.z.object({
    type: zod_1.z.enum(['INVENTORY', 'PROCUREMENT', 'REQUESTS', 'AUDIT', 'ANALYTICS']),
    parameters: zod_1.z.object({
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        format: zod_1.z.enum(['CSV', 'PDF']).default('CSV')
    })
});
// Notification Schema
exports.createNotificationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    message: zod_1.z.string().min(1, 'Message is required'),
    type: zod_1.z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']),
    userId: zod_1.z.string().min(1, 'User ID is required')
});
//# sourceMappingURL=index.js.map