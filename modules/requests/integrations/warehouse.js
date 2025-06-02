const { Request, RequestItem } = require('../models');
const { Item, Inventory, StockMovement } = require('../../warehouse/models');
const { EventTypes } = require('../../../core/events');
const { setupEventSystem } = require('../../../core/events');
const configManager = require('../../../core/config');

/**
 * Initialize integration between requests module and warehouse module
 */
function initializeWarehouseIntegration() {
  console.log('Initializing request-warehouse integration');
  
  const eventSystem = setupEventSystem();
  const requestConfig = configManager.loadModuleConfig('requests') || {};
  
  // Listen for request approval events to handle automatic fulfillment
  eventSystem.on(EventTypes.REQUEST_APPROVED, async (data) => {
    try {
      const request = await Request.findByPk(data.requestId, {
        include: [{ model: RequestItem, where: { fulfilled: false } }]
      });
      
      if (!request || !request.request_items || request.request_items.length === 0) {
        return;
      }
      
      console.log(`Processing approved request ${request.id} for warehouse fulfillment`);
      
      // Process each requested item
      for (const requestItem of request.request_items) {
        // Find the item and its inventory
        const item = await Item.findByPk(requestItem.itemId);
        if (!item) continue;
        
        // Find inventory with available stock
        const inventory = await Inventory.findOne({
          where: {
            itemId: item.id,
            quantity: { [Sequelize.Op.gte]: requestItem.quantity }
          },
          order: [['lastStockCheck', 'DESC']]
        });
        
        if (!inventory) {
          console.log(`Insufficient stock for item ${item.name} (ID: ${item.id})`);
          eventSystem.emit(EventTypes.REQUEST_ITEM_UPDATED, {
            requestId: request.id,
            requestItemId: requestItem.id,
            status: 'Backordered',
            message: 'Item not in stock'
          });
          continue;
        }
        
        // Create stock movement record
        const stockMovement = await StockMovement.create({
          type: 'issue',
          quantity: requestItem.quantity,
          fromQuantity: inventory.quantity,
          toQuantity: inventory.quantity - requestItem.quantity,
          documentReference: `REQ-${request.id}`,
          notes: `Issued for approved request ${request.title}`,
          inventoryId: inventory.id,
          performedById: data.approverId || request.assigneeId
        });
        
        // Update inventory
        await inventory.update({
          quantity: inventory.quantity - requestItem.quantity,
          lastStockCheck: new Date()
        });
        
        // Update request item
        await requestItem.update({
          fulfilled: true,
          fulfilledDate: new Date(),
          status: 'Fulfilled'
        });
        
        // Emit event for request item fulfillment
        eventSystem.emit(EventTypes.REQUEST_ITEM_UPDATED, {
          requestId: request.id,
          requestItemId: requestItem.id,
          status: 'Fulfilled',
          stockMovementId: stockMovement.id
        });
        
        // Check if stock level is low after fulfillment
        if (inventory.quantity <= item.minimumStockLevel) {
          eventSystem.emit(EventTypes.LOW_STOCK_ALERT, {
            itemId: item.id,
            itemName: item.name,
            currentQuantity: inventory.quantity,
            minimumLevel: item.minimumStockLevel
          });
        }
        
        // Check if reorder point is reached
        if (inventory.quantity <= item.reorderPoint) {
          eventSystem.emit(EventTypes.REORDER_POINT_REACHED, {
            itemId: item.id,
            itemName: item.name,
            currentQuantity: inventory.quantity,
            reorderPoint: item.reorderPoint
          });
        }
      }
      
      // Check if all items are fulfilled
      const pendingItems = await RequestItem.count({
        where: {
          requestId: request.id,
          fulfilled: false
        }
      });
      
      if (pendingItems === 0) {
        await request.update({
          status: 'Fulfilled',
          completedDate: new Date()
        });
        
        eventSystem.emit(EventTypes.REQUEST_COMPLETED, {
          requestId: request.id,
          completedDate: new Date(),
          completedBy: data.approverId || request.assigneeId
        });
      }
      
    } catch (err) {
      console.error('Error processing request-warehouse integration:', err);
    }
  }, 'warehouse-request-fulfillment');
  
  console.log('Request-warehouse integration initialized');
}

module.exports = {
  initializeWarehouseIntegration
};
