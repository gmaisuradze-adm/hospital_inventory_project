const express = require('express');
const controller = require('./controllers');
const { authMiddleware, roleMiddleware } = require('../../core/auth/middleware');

const router = express.Router();

/**
 * Report Template Routes
 */
router.post(
  '/report-templates',
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'analyst']),
  controller.createReportTemplate
);

router.get(
  '/report-templates',
  authMiddleware,
  controller.getReportTemplates
);

router.get(
  '/report-templates/:id',
  authMiddleware,
  controller.getReportTemplateById
);

router.put(
  '/report-templates/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager', 'analyst']),
  controller.updateReportTemplate
);

router.delete(
  '/report-templates/:id',
  authMiddleware,
  roleMiddleware(['admin', 'manager']),
  controller.deleteReportTemplate
);

/**
 * Report Generation Routes
 */
router.post(
  '/reports/generate/:templateId',
  authMiddleware,
  controller.generateReport
);

router.get(
  '/reports/saved',
  authMiddleware,
  controller.getSavedReports
);

router.get(
  '/reports/saved/:id',
  authMiddleware,
  controller.getSavedReportById
);

router.delete(
  '/reports/saved/:id',
  authMiddleware,
  controller.deleteSavedReport
);

/**
 * Dashboard Routes
 */
router.post(
  '/dashboards',
  authMiddleware,
  controller.createDashboard
);

router.get(
  '/dashboards',
  authMiddleware,
  controller.getDashboards
);

router.get(
  '/dashboards/:id',
  authMiddleware,
  controller.getDashboardById
);

router.put(
  '/dashboards/:id',
  authMiddleware,
  controller.updateDashboard
);

router.delete(
  '/dashboards/:id',
  authMiddleware,
  controller.deleteDashboard
);

/**
 * Dashboard Widget Routes
 */
router.post(
  '/dashboards/:dashboardId/widgets',
  authMiddleware,
  controller.addWidgetToDashboard
);

router.put(
  '/widgets/:id',
  authMiddleware,
  controller.updateDashboardWidget
);

router.delete(
  '/widgets/:id',
  authMiddleware,
  controller.deleteDashboardWidget
);

/**
 * Audit Log Routes
 */
router.get(
  '/audit-logs',
  authMiddleware,
  roleMiddleware(['admin', 'auditor']),
  controller.getAuditLogs
);

/**
 * Alert Subscription Routes
 */
router.post(
  '/alerts/subscriptions',
  authMiddleware,
  controller.createAlertSubscription
);

router.get(
  '/alerts/subscriptions',
  authMiddleware,
  controller.getUserAlertSubscriptions
);

router.put(
  '/alerts/subscriptions/:id',
  authMiddleware,
  controller.updateAlertSubscription
);

router.delete(
  '/alerts/subscriptions/:id',
  authMiddleware,
  controller.deleteAlertSubscription
);

/**
 * Data Source Routes for Dynamic Reports
 */
router.get(
  '/data-sources/inventory',
  authMiddleware,
  controller.getInventoryDataSource
);

router.get(
  '/data-sources/warehouse',
  authMiddleware,
  controller.getWarehouseDataSource
);

router.get(
  '/data-sources/service',
  authMiddleware,
  controller.getServiceDataSource
);

router.get(
  '/data-sources/requests',
  authMiddleware,
  controller.getRequestsDataSource
);

module.exports = router;