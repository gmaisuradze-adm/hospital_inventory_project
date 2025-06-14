"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const AuditService_1 = require("../services/AuditService");
const router = express_1.default.Router();
const auditService = new AuditService_1.AuditService();
// Get audit logs with filtering and pagination
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user has permission to view audit logs
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view audit logs' });
        }
        const { page = 1, limit = 10, userId, action, resource, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const filters = {
            userId: userId,
            action: action,
            resource: resource,
            startDate: startDate,
            endDate: endDate,
        };
        const auditLogs = await auditService.getAuditLogs(parseInt(page), parseInt(limit), filters, { field: sortBy, order: sortOrder });
        res.json(auditLogs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});
// Get audit log by ID
router.get('/:id', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});
// Get audit statistics
router.get('/stats/overview', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user has permission to view audit stats
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to view audit statistics' });
        }
        const { startDate, endDate } = req.query;
        const stats = await auditService.getAuditStats(startDate, endDate);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit statistics' });
    }
});
// Get user activity summary
router.get('/users/:userId/activity', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user has permission or is viewing their own activity
        const requestedUserId = req.params.userId;
        const currentUserId = req.user?.id;
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN' && requestedUserId !== currentUserId) {
            return res.status(403).json({ error: 'Not authorized to view this user activity' });
        }
        const { startDate, endDate, limit = 50 } = req.query;
        const activity = await auditService.getUserActivity(requestedUserId, startDate, endDate, parseInt(limit));
        res.json(activity);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
});
// Export audit logs (CSV)
router.get('/export/csv', auth_1.authenticate, async (req, res) => {
    try {
        // Check if user has permission to export audit logs
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'IT_ADMIN') {
            return res.status(403).json({ error: 'Not authorized to export audit logs' });
        }
        const { startDate, endDate, ...filters } = req.query;
        // TODO: Implement CSV export functionality
        res.json({ message: 'CSV export endpoint - not yet implemented' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to export audit logs' });
    }
});
exports.auditRoutes = router;
//# sourceMappingURL=audit.js.map