import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { ProcurementService } from '../services/ProcurementService';
import { AuditService } from '../services/AuditService';

const router = express.Router();
const procurementService = new ProcurementService();
const auditService = new AuditService();

// Validation schemas
const createProcurementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'SERVICES', 'MAINTENANCE', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedCost: z.number().positive('Estimated cost must be positive'),
  budget: z.string().min(1, 'Budget is required'),
  vendor: z.string().optional(),
  deliveryDate: z.string().optional(),
  justification: z.string().min(10, 'Justification is required'),
  specifications: z.string().optional(),
});

const updateProcurementSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  department: z.string().min(1).optional(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'SERVICES', 'MAINTENANCE', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED']).optional(),
  estimatedCost: z.number().positive().optional(),
  actualCost: z.number().positive().optional(),
  budget: z.string().min(1).optional(),
  vendor: z.string().optional(),
  deliveryDate: z.string().optional(),
  justification: z.string().min(10).optional(),
  specifications: z.string().optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
});

const approveProcurementSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional(),
  actualCost: z.number().positive().optional(),
  vendor: z.string().optional(),
  orderNumber: z.string().optional(),
  deliveryDate: z.string().optional(),
});

// Get all procurement requests with filtering and pagination
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      department,
      budget,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      status: status as string,
      priority: priority as string,
      category: category as string,
      department: department as string,
      budget: budget as string,
      search: search as string,
    };

    const result = await procurementService.getProcurementRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch procurement requests' });
  }
});

// Get procurement request by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const procurement = await procurementService.getProcurementById(id);

    if (!procurement) {
      return res.status(404).json({ error: 'Procurement request not found' });
    }

    res.json(procurement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch procurement request' });
  }
});

// Create new procurement request
router.post('/', authenticate, validateRequest(createProcurementSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create procurement request' });
  }
});

// Update procurement request
router.put('/:id', authenticate, validateRequest(updateProcurementSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update procurement request' });
  }
});

// Delete procurement request
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete procurement request' });
  }
});

// Approve/reject procurement request
router.post('/:id/approve', authenticate, validateRequest(approveProcurementSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve procurement request' });
  }
});

// Update procurement status
router.patch('/:id/status', authenticate, validateRequest(updateStatusSchema), async (req: Request, res: Response) => {
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

    const updatedProcurement = await procurementService.updateProcurementStatus(
      id,
      status,
      { notes, actualCost, vendor, orderNumber, deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined }
    );

    // Log audit trail
    await auditService.logAction({
      userId,
      action: 'STATUS_UPDATE',
      resource: 'PROCUREMENT',
      resourceId: id,
      details: `Updated procurement status to ${status}`,
    });

    res.json(updatedProcurement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update procurement status' });
  }
});

// Get procurement requests by current user
router.get('/my/requests', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      page = 1,
      limit = 10,
      status,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      requestedBy: userId,
      status: status as string,
      priority: priority as string,
    };

    const result = await procurementService.getProcurementRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user procurement requests' });
  }
});

// Get procurement statistics
router.get('/stats/overview', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user can view stats
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view procurement statistics' });
    }

    const stats = await procurementService.getProcurementStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch procurement statistics' });
  }
});

// Get budget summary
router.get('/budget/summary', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user can view budget info
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view budget summary' });
    }

    const { year, quarter } = req.query;
    const summary = await procurementService.getBudgetSummary(
      year ? parseInt(year as string) : undefined,
      quarter ? parseInt(quarter as string) : undefined
    );
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget summary' });
  }
});

// Get pending approvals
router.get('/approvals/pending', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user can approve requests
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FINANCE_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view pending approvals' });
    }

    const {
      page = 1,
      limit = 10,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'asc'
    } = req.query;

    const filters = {
      status: 'PENDING_APPROVAL',
      priority: priority as string,
    };

    const result = await procurementService.getProcurementRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
});

export { router as procurementRoutes };
