import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import { ITRequestService } from '../services/ITRequestService';
import { AuditService } from '../services/AuditService';

const router = express.Router();
const itRequestService = new ITRequestService();
const auditService = new AuditService();

// Validation schemas
const createITRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'SECURITY', 'MAINTENANCE', 'OTHER']),
  requestedDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  justification: z.string().optional(),
});

const updateITRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  department: z.string().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'SECURITY', 'MAINTENANCE', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  requestedDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  justification: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
});

const assignRequestSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  actualCost: z.number().optional(),
});

// Get all IT requests with filtering and pagination
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      department,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      status: status as string,
      priority: priority as string,
      category: category as string,
      department: department as string,
      assignedTo: assignedTo as string,
      search: search as string,
    };

    const result = await itRequestService.getITRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IT requests' });
  }
});

// Get IT request by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itRequest = await itRequestService.getITRequestById(id);

    if (!itRequest) {
      return res.status(404).json({ error: 'IT request not found' });
    }

    res.json(itRequest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IT request' });
  }
});

// Create new IT request
router.post('/', authenticate, validateRequest(createITRequestSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to create IT request' });
  }
});

// Update IT request
router.put('/:id', authenticate, validateRequest(updateITRequestSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update IT request' });
  }
});

// Delete IT request
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete IT request' });
  }
});

// Assign IT request to user
router.post('/:id/assign', authenticate, validateRequest(assignRequestSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign IT request' });
  }
});

// Update IT request status
router.patch('/:id/status', authenticate, validateRequest(updateStatusSchema), async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update IT request status' });
  }
});

// Get IT requests assigned to current user
router.get('/my/assigned', authenticate, async (req: Request, res: Response) => {
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
      assignedTo: userId,
      status: status as string,
      priority: priority as string,
    };

    const result = await itRequestService.getITRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned IT requests' });
  }
});

// Get IT requests created by current user
router.get('/my/created', authenticate, async (req: Request, res: Response) => {
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

    const result = await itRequestService.getITRequests(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch created IT requests' });
  }
});

export { router as itRequestRoutes };
