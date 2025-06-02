const express = require('express');
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../core/auth/middleware');

const router = express.Router();

// Service Category Routes
router.get('/categories', authenticate, controllers.getAllServiceCategories);
router.post('/categories', authenticate, authorize(['admin', 'manager']), controllers.createServiceCategory);

// Incident Management Routes
router.get('/incidents', authenticate, controllers.getIncidents);
router.get('/incidents/:id', authenticate, controllers.getIncidentById);
router.post('/incidents', authenticate, controllers.reportIncident);
router.patch('/incidents/:id/status', authenticate, controllers.updateIncidentStatus);
router.post('/incidents/:id/notes', authenticate, controllers.addIncidentNote);

// Maintenance Management Routes
router.get('/maintenance/schedules', authenticate, controllers.getMaintenanceSchedules);
router.post('/maintenance/schedules', authenticate, authorize(['admin', 'manager', 'technician']), controllers.createMaintenanceSchedule);
router.get('/maintenance/events', authenticate, controllers.getUpcomingMaintenanceEvents);
router.patch('/maintenance/events/:id/complete', authenticate, authorize(['admin', 'manager', 'technician']), controllers.completeMaintenanceEvent);

// Knowledge Base Routes
router.get('/knowledge', authenticate, controllers.getKnowledgeArticles);
router.post('/knowledge', authenticate, authorize(['admin', 'manager', 'technician']), controllers.createKnowledgeArticle);

// Reporting Routes
router.get('/reports/sla', authenticate, authorize(['admin', 'manager']), controllers.getSLAMetrics);

module.exports = router;
