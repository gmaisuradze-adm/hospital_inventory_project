"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.procurementRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const ProcurementService_1 = require("../services/ProcurementService");
const AuditService_1 = require("../services/AuditService");
const router = express_1.default.Router();
exports.procurementRoutes = router;
const procurementService = new ProcurementService_1.ProcurementService();
const auditService = new AuditService_1.AuditService();
// Validation schemas
const createProcurementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    department: zod_1.z.string().min(1, 'Department is required'),
    category: zod_1.z.enum(['HARDWARE', 'SOFTWARE', 'SERVICES', 'MAINTENANCE', 'OTHER']),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    estimatedCost: zod_1.z.number().positive('Estimated cost must be positive'),
    budget: zod_1.z.string().min(1, 'Budget is required'),
    vendor: zod_1.z.string().optional(),
    deliveryDate: zod_1.z.string().optional(),
    justification: zod_1.z.string().min(10, 'Justification is required'),
    specifications: zod_1.z.string().optional(),
});
const updateProcurementSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(10).optional(),
    department: zod_1.z.string().min(1).optional(),
    category: zod_1.z.enum(['HARDWARE', 'SOFTWARE', 'SERVICES', 'MAINTENANCE', 'OTHER']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: zod_1.z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED']).optional(),
    estimatedCost: zod_1.z.number().positive().optional(),
    actualCost: zod_1.z.number().positive().optional(),
    budget: zod_1.z.string().min(1).optional(),
    vendor: zod_1.z.string().optional(),
    deliveryDate: zod_1.z.string().optional(),
    justification: zod_1.z.string().min(10).optional(),
    specifications: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    approvedBy: zod_1.z.string().optional(),
});
const approveProcurementSchema = zod_1.z.object({
    approved: zod_1.z.boolean(),
    notes: zod_1.z.string().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED']),
    notes: zod_1.z.string().optional(),
    actualCost: zod_1.z.number().positive().optional(),
    vendor: zod_1.z.string().optional(),
    orderNumber: zod_1.z.string().optional(),
    deliveryDate: zod_1.z.string().optional(),
});
// Get all procurement requests with filtering and pagination
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, category, department, budget, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            status: status,
            priority: priority,
            category: category,
            department: department,
            budget: budget,
            search: search,
        };
        const result = await procurementService.getProcurementRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch procurement requests' });
    }
});
// Get procurement request by ID
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const procurement = await procurementService.getProcurementById(id);
        if (!procurement) {
            return res.status(404).json({ error: 'Procurement request not found' });
        }
        res.json(procurement);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch procurement request' });
    }
});
// Create new procurement request
router.post('/', auth_1.authenticate, (0, validation_1.validateRequest)(createProcurementSchema), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const procurement = await procurementService.createProcurement({
            ...req.body,
            requestedBy: userId,
        });
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'CREATE',
            resource: 'PROCUREMENT',
            resourceId: procurement.id,
            details: `Created procurement request: ${procurement.title}`,
        });
        res.status(201).json(procurement);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create procurement request' });
    }
});
// Update procurement request
router.put('/:id', auth_1.authenticate, (0, validation_1.validateRequest)(updateProcurementSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingProcurement = await procurementService.getProcurementById(id);
        if (!existingProcurement) {
            return res.status(404).json({ error: 'Procurement request not found' });
        }
        // Check if user can update this request
        const canUpdate = existingProcurement.requestedBy === userId ||
            req.user?.role === 'ADMIN' ||
            req.user?.role === 'FINANCE_ADMIN';
        if (!canUpdate) {
            return res.status(403).json({ error: 'Not authorized to update this request' });
        }
        const updatedProcurement = await procurementService.updateProcurement(id, req.body);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'UPDATE',
            resource: 'PROCUREMENT',
            resourceId: id,
            details: `Updated procurement request: ${updatedProcurement.title}`,
        });
        res.json(updatedProcurement);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update procurement request' });
    }
});
// Delete procurement request
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const existingProcurement = await procurementService.getProcurementById(id);
        if (!existingProcurement) {
            return res.status(404).json({ error: 'Procurement request not found' });
        }
        // Check if user can delete this request
        const canDelete = existingProcurement.requestedBy === userId ||
            req.user?.role === 'ADMIN' ||
            req.user?.role === 'FINANCE_ADMIN';
        if (!canDelete) {
            return res.status(403).json({ error: 'Not authorized to delete this request' });
        }
        // Cannot delete if already approved or ordered
        if (['APPROVED', 'ORDERED', 'DELIVERED'].includes(existingProcurement.status)) {
            return res.status(400).json({ error: 'Cannot delete approved or ordered procurement request' });
        }
        await procurementService.deleteProcurement(id);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'DELETE',
            resource: 'PROCUREMENT',
            resourceId: id,
            details: `Deleted procurement request: ${existingProcurement.title}`,
        });
        res.json({ message: 'Procurement request deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete procurement request' });
    }
});
// Approve/reject procurement request
router.post('/:id/approve', auth_1.authenticate, (0, validation_1.validateRequest)(approveProcurementSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved, notes } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check if user can approve requests
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to approve procurement requests' });
        }
        const updatedProcurement = await procurementService.approveProcurement(id, approved, userId, notes);
        // Log audit trail
        await auditService.logAction({
            userId,
            action: approved ? 'APPROVE' : 'REJECT',
            resource: 'PROCUREMENT',
            resourceId: id,
            details: `${approved ? 'Approved' : 'Rejected'} procurement request: ${updatedProcurement.title}`,
        });
        res.json(updatedProcurement);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to approve procurement request' });
    }
});
// Update procurement status
router.patch('/:id/status', auth_1.authenticate, (0, validation_1.validateRequest)(updateStatusSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, actualCost, vendor, orderNumber, deliveryDate } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Check if user can update status
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to update procurement status' });
        }
        const updatedProcurement = await procurementService.updateProcurementStatus(id, status, { notes, actualCost, vendor, orderNumber, deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined });
        // Log audit trail
        await auditService.logAction({
            userId,
            action: 'STATUS_UPDATE',
            resource: 'PROCUREMENT',
            resourceId: id,
            details: `Updated procurement status to ${status}`,
        });
        res.json(updatedProcurement);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update procurement status' });
    }
});
// Get procurement requests by current user
router.get('/my/requests', auth_1.authenticate, async (req, res) => {
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
        const result = await procurementService.getProcurementRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user procurement requests' });
    }
});
// Get procurement statistics
router.get('/stats/overview', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user can view stats
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view procurement statistics' });
        }
        const stats = await procurementService.getProcurementStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch procurement statistics' });
    }
});
// Get budget summary
router.get('/budget/summary', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user can view budget info
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view budget summary' });
        }
        const { year, quarter } = req.query;
        const summary = await procurementService.getBudgetSummary(year ? parseInt(year) : undefined, quarter ? parseInt(quarter) : undefined);
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch budget summary' });
    }
});
// Get pending approvals
router.get('/approvals/pending', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user can approve requests
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view pending approvals' });
        }
        const { page = 1, limit = 10, priority, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;
        const filters = {
            status: 'PENDING_APPROVAL',
            priority: priority,
        };
        const result = await procurementService.getProcurementRequests(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending approvals' });
    }
});
//# sourceMappingURL=procurement.js.map