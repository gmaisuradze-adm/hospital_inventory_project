"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.itRequestRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const ITRequestService_1 = require("../services/ITRequestService");
const AuditService_1 = require("../services/AuditService");
const router = express_1.default.Router();
exports.itRequestRoutes = router;
const itRequestService = new ITRequestService_1.ITRequestService();
const auditService = new AuditService_1.AuditService();
// Validation schemas
const createITRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    department: zod_1.z.string().min(1, 'Department is required'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    category: zod_1.z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'SECURITY', 'MAINTENANCE', 'OTHER']),
    requestedDate: zod_1.z.string().optional(),
    estimatedCost: zod_1.z.number().optional(),
    justification: zod_1.z.string().optional(),
});
const updateITRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(10).optional(),
    department: zod_1.z.string().min(1).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    category: zod_1.z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'SECURITY', 'MAINTENANCE', 'OTHER']).optional(),
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    requestedDate: zod_1.z.string().optional(),
    estimatedCost: zod_1.z.number().optional(),
    actualCost: zod_1.z.number().optional(),
    justification: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    assignedTo: zod_1.z.string().optional(),
});
const assignRequestSchema = zod_1.z.object({
    assignedTo: zod_1.z.string().min(1, 'Assigned user ID is required'),
    notes: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    notes: zod_1.z.string().optional(),
    actualCost: zod_1.z.number().optional(),
});
// Get all IT requests with filtering and pagination
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, category, department, assignedTo, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            status: status,
            priority: priority,
            category: category,
            department: department,
            assignedTo: assignedTo,
            search: search,
        };
        const result = await itRequestService.getITRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch IT requests' });
    }
});
// Get IT request by ID
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const itRequest = await itRequestService.getITRequestById(id);
        if (!itRequest) {
            return res.status(404).json({ error: 'IT request not found' });
        }
        res.json(itRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch IT request' });
    }
});
// Create new IT request
router.post('/', auth_1.authenticate, (0, validation_1.validateRequest)(createITRequestSchema), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const itRequest = await itRequestService.createITRequest({
            ...req.body,
            requestedBy: userId,
        });
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'CREATE',
            resource: 'IT_REQUEST',
            resourceId: itRequest.id,
            details: `Created IT request: ${itRequest.title}`,
        });
        res.status(201).json(itRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create IT request' });
    }
});
// Update IT request
router.put('/:id', auth_1.authenticate, (0, validation_1.validateRequest)(updateITRequestSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingRequest = await itRequestService.getITRequestById(id);
        if (!existingRequest) {
            return res.status(404).json({ error: 'IT request not found' });
        }
        // Check if user can update this request
        const canUpdate = existingRequest.requestedBy === userId ||
            req.user?.role === 'ADMIN' ||
            req.user?.role === 'IT_ADMIN';
        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this request' });
        }
        const updatedRequest = await itRequestService.updateITRequest(id, req.body);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'UPDATE',
            resource: 'IT_REQUEST',
            resourceId: id,
            details: `Updated IT request: ${updatedRequest.title}`,
        });
        res.json(updatedRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update IT request' });
    }
});
// Delete IT request
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingRequest = await itRequestService.getITRequestById(id);
        if (!existingRequest) {
            return res.status(404).json({ error: 'IT request not found' });
        }
        // Check if user can delete this request
        const canDelete = existingRequest.requestedBy === userId ||
            req.user?.role === 'ADMIN' ||
            req.user?.role === 'IT_ADMIN';
        if (!canDelete) {
            return res.status(403).json({ error: 'Not authorized to delete this request' });
        }
        await itRequestService.deleteITRequest(id);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'DELETE',
            resource: 'IT_REQUEST',
            resourceId: id,
            details: `Deleted IT request: ${existingRequest.title}`,
        });
        res.json({ message: 'IT request deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete IT request' });
    }
});
// Assign IT request to user
router.post('/:id/assign', auth_1.authenticate, (0, validation_1.validateRequest)(assignRequestSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo, notes } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check if user can assign requests
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to assign requests' });
        }
        const updatedRequest = await itRequestService.assignITRequest(id, assignedTo, notes);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'ASSIGN',
            resource: 'IT_REQUEST',
            resourceId: id,
            details: `Assigned IT request to user ${assignedTo}`,
        });
        res.json(updatedRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to assign IT request' });
    }
});
// Update IT request status
router.patch('/:id/status', auth_1.authenticate, (0, validation_1.validateRequest)(updateStatusSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, actualCost } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingRequest = await itRequestService.getITRequestById(id);
        if (!existingRequest) {
            return res.status(404).json({ error: 'IT request not found' });
        }
        // Check if user can update status
        const canUpdateStatus = existingRequest.assignedTo === userId ||
            req.user?.role === 'ADMIN' ||
            req.user?.role === 'IT_ADMIN';
        if (!canUpdateStatus) {
            return res.status(403).json({ error: 'Not authorized to update request status' });
        }
        const updatedRequest = await itRequestService.updateITRequestStatus(id, status, notes, actualCost);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'STATUS_UPDATE',
            resource: 'IT_REQUEST',
            resourceId: id,
            details: `Updated IT request status to ${status}`,
        });
        res.json(updatedRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update IT request status' });
    }
});
// Get IT requests assigned to current user
router.get('/my/assigned', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { page = 1, limit = 10, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            assignedTo: userId,
            status: status,
            priority: priority,
        };
        const result = await itRequestService.getITRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch assigned IT requests' });
    }
});
// Get IT requests created by current user
router.get('/my/created', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { page = 1, limit = 10, status, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            requestedBy: userId,
            status: status,
            priority: priority,
        };
        const result = await itRequestService.getITRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch created IT requests' });
    }
});
//# sourceMappingURL=itRequests.js.map