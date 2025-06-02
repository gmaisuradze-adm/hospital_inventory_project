const express = require('express');
const controllers = require('./controllers');
const { authenticate, authorize } = require('../../core/auth/middleware');

const router = express.Router();

// Item routes
router.get('/items', authenticate, controllers.getAllItems);
router.get('/items/:id', authenticate, controllers.getItemById);
router.post('/items', authenticate, authorize(['admin', 'manager']), controllers.createItem);
router.put('/items/:id', authenticate, authorize(['admin', 'manager']), controllers.updateItem);

// Warehouse routes
router.get('/warehouses', authenticate, controllers.getAllWarehouses);
router.post('/warehouses', authenticate, authorize(['admin']), controllers.createWarehouse);

// Zone routes
router.get('/zones', authenticate, controllers.getZones);
router.post('/zones', authenticate, authorize(['admin', 'manager']), controllers.createZone);

// Storage Location routes
router.get('/storage-locations', authenticate, controllers.getStorageLocations);
router.post('/storage-locations', authenticate, authorize(['admin', 'manager']), controllers.createStorageLocation);

// Inventory routes
router.get('/inventory', authenticate, controllers.getInventory);

// Stock Movement routes
router.post('/stock-movements', authenticate, authorize(['admin', 'manager']), controllers.createStockMovement);
router.post('/stock-transfers', authenticate, authorize(['admin', 'manager']), controllers.transferStock);

module.exports = router;
