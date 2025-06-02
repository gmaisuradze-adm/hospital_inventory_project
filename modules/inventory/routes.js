const express = require('express');
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../core/auth/middleware');

const router = express.Router();

// Asset routes
router.get('/assets', authenticate, controllers.getAllAssets);
router.get('/assets/:id', authenticate, controllers.getAssetById);
router.post('/assets', authenticate, authorize(['admin', 'manager']), controllers.createAsset);
router.put('/assets/:id', authenticate, authorize(['admin', 'manager']), controllers.updateAsset);
router.delete('/assets/:id', authenticate, authorize('admin'), controllers.deleteAsset);

// Category routes
router.get('/categories', authenticate, controllers.getAllCategories);
router.post('/categories', authenticate, authorize(['admin', 'manager']), controllers.createCategory);

// Location routes
router.get('/locations', authenticate, controllers.getAllLocations);
router.post('/locations', authenticate, authorize(['admin', 'manager']), controllers.createLocation);

// Assignment routes
router.post('/assignments', authenticate, authorize(['admin', 'manager']), controllers.assignAsset);
router.put('/assignments/:assignmentId/unassign', authenticate, authorize(['admin', 'manager']), controllers.unassignAsset);

module.exports = router;