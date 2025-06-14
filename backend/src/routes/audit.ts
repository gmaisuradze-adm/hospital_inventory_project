import express from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuditService } from '../services/AuditService';

const router = express.Router();
const auditService = new AuditService();

// Get audit logs with filtering and pagination
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has permission to view audit logs
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view audit logs' });
    }

    const {
      page = 1,
      limit = 10,
      userId,
      action,
      resource,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      startDate: startDate as string,
      endDate: endDate as string,
    };

    const auditLogs = await auditService.getAuditLogs(
      parseInt(page as string),
      parseInt(limit as string),
      filters,
      { field: sortBy as string, order: sortOrder as 'asc' | 'desc' }
    );

    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has permission to view audit logs
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view audit logs' });
    }

    const { id } = req.params;
    const auditLog = await auditService.getAuditLogById(id);

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(auditLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get audit statistics
router.get('/stats/overview', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has permission to view audit stats
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view audit statistics' });
    }

    const { startDate, endDate } = req.query;
    const stats = await auditService.getAuditStats(
      startDate as string,
      endDate as string
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get user activity summary
router.get('/users/:userId/activity', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has permission or is viewing their own activity
    const requestedUserId = req.params.userId;
    const currentUserId = req.user?.id;

    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN' && requestedUserId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to view this user activity' });
    }

    const { startDate, endDate, limit = 50 } = req.query;
    const activity = await auditService.getUserActivity(
      requestedUserId,
      startDate as string,
      endDate as string,
      parseInt(limit as string)
    );

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Export audit logs (CSV)
router.get('/export/csv', authenticate, async (req: Request, res: Response) => {
  try {
    // Check if user has permission to export audit logs
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
      return res.status(403).json({ error: 'Not authorized to export audit logs' });
    }

    const { startDate, endDate, ...filters } = req.query;
    
    // TODO: Implement CSV export functionality
    res.json({ message: 'CSV export endpoint - not yet implemented' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

export const auditRoutes = router;
