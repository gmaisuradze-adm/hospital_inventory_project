"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const InventoryService_1 = require("../services/InventoryService");
const ITRequestService_1 = require("../services/ITRequestService");
const ProcurementService_1 = require("../services/ProcurementService");
const UserService_1 = require("../services/UserService");
const router = express_1.default.Router();
const inventoryService = new InventoryService_1.InventoryService();
const itRequestService = new ITRequestService_1.ITRequestService();
const procurementService = new ProcurementService_1.ProcurementService();
const userService = new UserService_1.UserService();
// Get dashboard overview
router.get('/overview', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get stats based on user role
        const [inventoryStats, itRequestStats, procurementStats, userStats] = await Promise.all([
            inventoryService.getInventoryStats(),
            itRequestService.getITRequestStats(),
            procurementService.getProcurementStats(),
            req.user?.role === 'ADMIN' ? userService.getUserStats() : null
        ]);
        const overview = {
            inventory: inventoryStats,
            itRequests: itRequestStats,
            procurement: procurementStats,
            users: userStats,
        };
        res.json(overview);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard overview' });
    }
});
// Get user-specific dashboard data
router.get('/my-dashboard', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Get user-specific data
        const [myItRequests, assignedItRequests, myProcurementRequests, recentActivity] = await Promise.all([
            itRequestService.getITRequests(1, 5, { requestedBy: userId }),
            req.user?.role === 'IT_ADMIN' || req.user?.role === 'ADMIN'
                ? itRequestService.getITRequests(1, 5, { assignedTo: userId })
                : Promise.resolve({ data: [], pagination: {} }),
            procurementService.getProcurementRequests(1, 5, { requestedBy: userId }),
            // TODO: Get recent activity from audit service
            Promise.resolve([])
        ]);
        const dashboard = {
            myRequests: {
                itRequests: myItRequests.data,
                procurement: myProcurementRequests.data,
            },
            assignedRequests: {
                itRequests: assignedItRequests.data,
            },
            recentActivity,
        };
        res.json(dashboard);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user dashboard' });
    }
});
// Get chart data for dashboard
router.get('/charts/requests-by-status', auth_1.authenticate, async (req, res) => {
    try {
        const { type = 'it-requests', period = '30' } = req.query;
        // TODO: Implement chart data aggregation
        // This would typically involve grouping requests by status and date
        const mockData = {
            labels: ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'],
            datasets: [{
                    data: [10, 5, 8, 15, 2],
                    backgroundColor: ['#FFA500', '#4CAF50', '#2196F3', '#8BC34A', '#F44336']
                }]
        };
        res.json(mockData);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});
// Get chart data for inventory trends
router.get('/charts/inventory-trends', auth_1.authenticate, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        // TODO: Implement inventory trend data
        const mockData = {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                    label: 'Low Stock Items',
                    data: [5, 8, 3, 7],
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)'
                }, {
                    label: 'New Items Added',
                    data: [12, 15, 8, 10],
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)'
                }]
        };
        res.json(mockData);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory trends' });
    }
});
// Get recent activities
router.get('/recent-activities', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 10 } = req.query;
        // TODO: Implement recent activities from audit service
        const mockActivities = [
            {
                id: '1',
                action: 'Created IT Request',
                description: 'New laptop request for development team',
                timestamp: new Date().toISOString(),
                user: 'John Doe'
            },
            {
                id: '2',
                action: 'Updated Inventory',
                description: 'Added 10 new Dell monitors to inventory',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                user: 'Jane Smith'
            }
        ];
        res.json(mockActivities);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent activities' });
    }
});
// Get alerts and notifications summary
router.get('/alerts', auth_1.authenticate, async (req, res) => {
    try {
        // TODO: Implement alerts aggregation
        const mockAlerts = {
            lowStock: 5,
            overdueRequests: 3,
            pendingApprovals: 8,
            systemAlerts: 1
        };
        res.json(mockAlerts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
exports.dashboardRoutes = router;
//# sourceMappingURL=dashboard.js.map