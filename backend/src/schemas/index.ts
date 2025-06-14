import { z } from 'zod';

// User Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'IT_STAFF', 'USER']).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'IT_STAFF', 'USER']).optional(),
  isActive: z.boolean().optional()
});

// IT Request Schemas
export const createITRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  requestType: z.enum(['HARDWARE_ISSUE', 'SOFTWARE_ISSUE', 'NETWORK_ISSUE', 'ACCESS_REQUEST', 'NEW_EQUIPMENT', 'MAINTENANCE', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM')
});

export const updateITRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

// Inventory Schemas
export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['COMPUTER', 'SERVER', 'PRINTER', 'NETWORK_EQUIPMENT', 'PERIPHERAL', 'SOFTWARE', 'CONSUMABLE', 'SPARE_PART', 'MOBILE_DEVICE', 'OTHER']),
  location: z.string().min(1, 'Location is required'),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  cost: z.number().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  minQuantity: z.number().optional()
});

export const updateInventoryItemSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['COMPUTER', 'SERVER', 'PRINTER', 'NETWORK_EQUIPMENT', 'PERIPHERAL', 'SOFTWARE', 'CONSUMABLE', 'SPARE_PART', 'MOBILE_DEVICE', 'OTHER']).optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED', 'DAMAGED', 'RESERVED']).optional(),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  cost: z.number().optional(),
  quantity: z.number().optional(),
  minQuantity: z.number().optional()
});

// Procurement Schemas
export const createProcurementRequestSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  itemId: z.string().optional()
});

export const updateProcurementRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
});

// Form Schemas
export const createFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'email', 'date', 'select', 'textarea', 'checkbox']),
    label: z.string(),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional()
    }).optional()
  }))
});

export const submitFormSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  data: z.record(z.any())
});

// Report Schemas
export const generateReportSchema = z.object({
  type: z.enum(['INVENTORY', 'PROCUREMENT', 'REQUESTS', 'AUDIT', 'ANALYTICS']),
  parameters: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    format: z.enum(['CSV', 'PDF']).default('CSV')
  })
});

// Notification Schema
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']),
  userId: z.string().min(1, 'User ID is required')
});

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
