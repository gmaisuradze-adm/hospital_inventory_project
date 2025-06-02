const express = require('express');
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../core/auth/middleware');

const router = express.Router();

// Request routes
router.get('/requests', authenticate, controllers.getAllRequests);
router.get('/requests/:id', authenticate, controllers.getRequestById);
router.post('/requests', authenticate, controllers.createRequest);
router.patch('/requests/:id/status', authenticate, controllers.updateRequestStatus);
router.post('/requests/:id/assign', authenticate, authorize(['admin', 'manager']), controllers.assignRequest);
router.post('/requests/:id/comments', authenticate, controllers.addRequestComment);

// Workflow routes
router.get('/workflows', authenticate, controllers.getAllWorkflows);
router.post('/workflows', authenticate, authorize(['admin']), controllers.createWorkflow);
router.post('/requests/:requestId/workflow-step', authenticate, controllers.processWorkflowStep);

module.exports = router;
