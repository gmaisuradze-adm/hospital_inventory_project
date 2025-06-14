"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const router = express_1.default.Router();
const notificationService = new NotificationService_1.NotificationService();
// Get all notifications for user
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { page = 1, limit = 10, unreadOnly = false, type } = req.query;
        const notifications = await notificationService.getUserNotifications(userId, parseInt(page), parseInt(limit), unreadOnly === 'true', type);
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// Mark notification as read
router.patch('/:id/read', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        await notificationService.markAsRead(id, userId);
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// Mark all notifications as read
router.patch('/all/read', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        await notificationService.markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});
// Delete notification
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        await notificationService.deleteNotification(id, userId);
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// Get unread count
router.get('/unread/count', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const count = await notificationService.getUnreadCount(userId);
        res.json({ count });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});
exports.notificationRoutes = router;
//# sourceMappingURL=notifications.js.map