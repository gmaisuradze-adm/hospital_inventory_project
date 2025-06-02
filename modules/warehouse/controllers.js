const { Item, Warehouse, Zone, StorageLocation, Inventory, StockMovement } = require('./models');
const { Sequelize } = require('../../core/database');
const { EventTypes } = require('../../core/events');
const { setupEventSystem } = require('../../core/events');

const eventSystem = setupEventSystem();

// Item Controllers
async function getAllItems(req, res) {
  try {
    const { search, category } = req.query;
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter[Sequelize.Op.or] = [
        { name: { [Sequelize.Op.iLike]: `%${search}%` } },
        { sku: { [Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    
    const items = await Item.findAll({ 
      where: filter,
      include: [{
        model: Inventory,
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
          [Sequelize.fn('SUM', Sequelize.col('reservedQuantity')), 'totalReserved']
        ]
      }],
      group: ['item.id']
    });
    
    res.json({
      error: false,
      data: items
    });
  } catch (err) {
    console.error('Error getting items:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function getItemById(req, res) {
  try {
    const { id } = req.params;
    
    const item = await Item.findByPk(id, {
      include: [{
        model: Inventory,
        include: [{ model: StorageLocation, include: [{ model: Zone, include: [Warehouse] }] }]
      }]
    });
    
    if (!item) {
      return res.status(404).json({
        error: true,
        message: 'Item not found'
      });
    }
    
    res.json({
      error: false,
      data: item
    });
  } catch (err) {
    console.error('Error getting item:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createItem(req, res) {
  try {
    const {
      name,
      sku,
      description,
      category,
      manufacturer,
      model,
      unitPrice,
      minimumStockLevel,
      reorderPoint,
      attributes
    } = req.body;
    
    // Validate required fields
    if (!name || !sku) {
      return res.status(400).json({
        error: true,
        message: 'Name and SKU are required'
      });
    }
    
    // Check if SKU exists
    const existingItem = await Item.findOne({ where: { sku } });
    if (existingItem) {
      return res.status(409).json({
        error: true,
        message: 'Item with this SKU already exists'
      });
    }
    
    // Create item
    const item = await Item.create({
      name,
      sku,
      description,
      category,
      manufacturer,
      model,
      unitPrice,
      minimumStockLevel: minimumStockLevel || 0,
      reorderPoint: reorderPoint || 10,
      attributes: attributes || {}
    });
    
    res.status(201).json({
      error: false,
      message: 'Item created successfully',
      data: item
    });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function updateItem(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      manufacturer,
      model,
      unitPrice,
      minimumStockLevel,
      reorderPoint,
      attributes
    } = req.body;
    
    // Find item
    const item = await Item.findByPk(id);
    if (!item) {
      return res.status(404).json({
        error: true,
        message: 'Item not found'
      });
    }
    
    // Update item
    await item.update({
      name,
      description,
      category,
      manufacturer,
      model,
      unitPrice,
      minimumStockLevel,
      reorderPoint,
      attributes: attributes || item.attributes
    });
    
    res.json({
      error: false,
      message: 'Item updated successfully',
      data: item
    });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Warehouse Controllers
async function getAllWarehouses(req, res) {
  try {
    const warehouses = await Warehouse.findAll({
      include: [{
        model: Zone,
        include: [{ 
          model: StorageLocation,
          include: [{ model: Inventory }]
        }]
      }]
    });
    
    res.json({
      error: false,
      data: warehouses
    });
  } catch (err) {
    console.error('Error getting warehouses:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createWarehouse(req, res) {
  try {
    const { name, location, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Warehouse name is required'
      });
    }
    
    // Create warehouse
    const warehouse = await Warehouse.create({
      name,
      location,
      description
    });
    
    res.status(201).json({
      error: false,
      message: 'Warehouse created successfully',
      data: warehouse
    });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Zone Controllers
async function getZones(req, res) {
  try {
    const { warehouseId } = req.query;
    const where = {};
    
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }
    
    const zones = await Zone.findAll({ 
      where,
      include: [{ model: StorageLocation }]
    });
    
    res.json({
      error: false,
      data: zones
    });
  } catch (err) {
    console.error('Error getting zones:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createZone(req, res) {
  try {
    const { name, code, description, warehouseId } = req.body;
    
    // Validate required fields
    if (!name || !warehouseId) {
      return res.status(400).json({
        error: true,
        message: 'Zone name and warehouse ID are required'
      });
    }
    
    // Check if warehouse exists
    const warehouse = await Warehouse.findByPk(warehouseId);
    if (!warehouse) {
      return res.status(404).json({
        error: true,
        message: 'Warehouse not found'
      });
    }
    
    // Create zone
    const zone = await Zone.create({
      name,
      code,
      description,
      warehouseId
    });
    
    res.status(201).json({
      error: false,
      message: 'Zone created successfully',
      data: zone
    });
  } catch (err) {
    console.error('Error creating zone:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Storage Location Controllers
async function getStorageLocations(req, res) {
  try {
    const { zoneId } = req.query;
    const where = {};
    
    if (zoneId) {
      where.zoneId = zoneId;
    }
    
    const storageLocations = await StorageLocation.findAll({
      where,
      include: [{ 
        model: Inventory,
        include: [{ model: Item }]
      }, {
        model: Zone,
        include: [{ model: Warehouse }]
      }]
    });
    
    res.json({
      error: false,
      data: storageLocations
    });
  } catch (err) {
    console.error('Error getting storage locations:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function createStorageLocation(req, res) {
  try {
    const { name, code, type, description, capacity, zoneId } = req.body;
    
    // Validate required fields
    if (!name || !zoneId) {
      return res.status(400).json({
        error: true,
        message: 'Storage location name and zone ID are required'
      });
    }
    
    // Check if zone exists
    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      return res.status(404).json({
        error: true,
        message: 'Zone not found'
      });
    }
    
    // Create storage location
    const storageLocation = await StorageLocation.create({
      name,
      code,
      type,
      description,
      capacity,
      zoneId
    });
    
    res.status(201).json({
      error: false,
      message: 'Storage location created successfully',
      data: storageLocation
    });
  } catch (err) {
    console.error('Error creating storage location:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Inventory Controllers
async function getInventory(req, res) {
  try {
    const { itemId, storageLocationId } = req.query;
    const where = {};
    
    if (itemId) {
      where.itemId = itemId;
    }
    
    if (storageLocationId) {
      where.storageLocationId = storageLocationId;
    }
    
    const inventory = await Inventory.findAll({
      where,
      include: [
        { model: Item },
        { model: StorageLocation, include: [{ model: Zone, include: [Warehouse] }] },
        { model: StockMovement, limit: 10, order: [['timestamp', 'DESC']] }
      ]
    });
    
    res.json({
      error: false,
      data: inventory
    });
  } catch (err) {
    console.error('Error getting inventory:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

// Stock Movement Controllers
async function createStockMovement(req, res) {
  try {
    const {
      type,
      quantity,
      itemId,
      storageLocationId,
      documentReference,
      notes
    } = req.body;
    
    // Validate required fields
    if (!type || quantity === undefined || !itemId || !storageLocationId) {
      return res.status(400).json({
        error: true,
        message: 'Type, quantity, item ID, and storage location ID are required'
      });
    }
    
    // Find or create inventory record
    let inventory = await Inventory.findOne({
      where: {
        itemId,
        storageLocationId
      }
    });
    
    if (!inventory) {
      inventory = await Inventory.create({
        itemId,
        storageLocationId,
        quantity: 0,
        reservedQuantity: 0,
        lastStockCheck: new Date()
      });
    }
    
    // Record original quantity
    const fromQuantity = inventory.quantity;
    
    // Update inventory based on movement type
    let toQuantity;
    
    switch (type) {
      case 'receipt':
        toQuantity = fromQuantity + quantity;
        break;
      case 'issue':
        toQuantity = fromQuantity - quantity;
        if (toQuantity < 0) {
          return res.status(400).json({
            error: true,
            message: 'Insufficient stock'
          });
        }
        break;
      case 'adjustment':
        toQuantity = quantity; // Direct set to new quantity
        break;
      case 'transfer':
        // Transfer is handled separately
        return res.status(400).json({
          error: true,
          message: 'Use transfer endpoint for stock transfers'
        });
      default:
        toQuantity = fromQuantity;
    }
    
    // Update inventory quantity
    await inventory.update({
      quantity: toQuantity,
      lastStockCheck: new Date()
    });
    
    // Create stock movement record
    const stockMovement = await StockMovement.create({
      type,
      quantity,
      fromQuantity,
      toQuantity,
      documentReference,
      notes,
      inventoryId: inventory.id,
      performedById: req.user.userId
    });
    
    // Emit stock updated event
    eventSystem.emit(EventTypes.STOCK_UPDATED, {
      inventoryId: inventory.id,
      itemId,
      storageLocationId,
      fromQuantity,
      toQuantity,
      userId: req.user.userId,
      movementId: stockMovement.id
    });
    
    res.status(201).json({
      error: false,
      message: 'Stock movement recorded successfully',
      data: {
        stockMovement,
        inventory
      }
    });
  } catch (err) {
    console.error('Error creating stock movement:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

async function transferStock(req, res) {
  try {
    const {
      quantity,
      itemId,
      fromStorageLocationId,
      toStorageLocationId,
      documentReference,
      notes
    } = req.body;
    
    // Validate required fields
    if (quantity === undefined || !itemId || !fromStorageLocationId || !toStorageLocationId) {
      return res.status(400).json({
        error: true,
        message: 'Quantity, item ID, source and destination storage locations are required'
      });
    }
    
    if (fromStorageLocationId === toStorageLocationId) {
      return res.status(400).json({
        error: true,
        message: 'Source and destination cannot be the same'
      });
    }
    
    // Find source inventory
    const sourceInventory = await Inventory.findOne({
      where: {
        itemId,
        storageLocationId: fromStorageLocationId
      }
    });
    
    if (!sourceInventory || sourceInventory.quantity < quantity) {
      return res.status(400).json({
        error: true,
        message: 'Insufficient stock at source location'
      });
    }
    
    // Find or create destination inventory
    let destInventory = await Inventory.findOne({
      where: {
        itemId,
        storageLocationId: toStorageLocationId
      }
    });
    
    if (!destInventory) {
      destInventory = await Inventory.create({
        itemId,
        storageLocationId: toStorageLocationId,
        quantity: 0,
        reservedQuantity: 0,
        lastStockCheck: new Date()
      });
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Update source inventory
      const sourceFromQuantity = sourceInventory.quantity;
      const sourceToQuantity = sourceFromQuantity - quantity;
      
      await sourceInventory.update({
        quantity: sourceToQuantity,
        lastStockCheck: new Date()
      }, { transaction });
      
      // Create source movement record
      const sourceMovement = await StockMovement.create({
        type: 'transfer-out',
        quantity,
        fromQuantity: sourceFromQuantity,
        toQuantity: sourceToQuantity,
        documentReference,
        notes: notes ? `${notes} - Transfer to ${toStorageLocationId}` : `Transfer to ${toStorageLocationId}`,
        inventoryId: sourceInventory.id,
        performedById: req.user.userId
      }, { transaction });
      
      // Update destination inventory
      const destFromQuantity = destInventory.quantity;
      const destToQuantity = destFromQuantity + quantity;
      
      await destInventory.update({
        quantity: destToQuantity,
        lastStockCheck: new Date()
      }, { transaction });
      
      // Create destination movement record
      const destMovement = await StockMovement.create({
        type: 'transfer-in',
        quantity,
        fromQuantity: destFromQuantity,
        toQuantity: destToQuantity,
        documentReference,
        notes: notes ? `${notes} - Transfer from ${fromStorageLocationId}` : `Transfer from ${fromStorageLocationId}`,
        inventoryId: destInventory.id,
        performedById: req.user.userId
      }, { transaction });
      
      // Commit transaction
      await transaction.commit();
      
      // Emit stock relocation event
      eventSystem.emit(EventTypes.ITEM_RELOCATED, {
        itemId,
        quantity,
        fromLocationId: fromStorageLocationId,
        toLocationId: toStorageLocationId,
        userId: req.user.userId,
        sourceMovementId: sourceMovement.id,
        destMovementId: destMovement.id
      });
      
      res.status(201).json({
        error: false,
        message: 'Stock transferred successfully',
        data: {
          sourceInventory,
          destInventory,
          sourceMovement,
          destMovement
        }
      });
    } catch (err) {
      // Rollback transaction on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error transferring stock:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

module.exports = {
  // Item controllers
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  
  // Warehouse controllers
  getAllWarehouses,
  createWarehouse,
  
  // Zone controllers
  getZones,
  createZone,
  
  // Storage Location controllers
  getStorageLocations,
  createStorageLocation,
  
  // Inventory controllers
  getInventory,
  
  // Stock Movement controllers
  createStockMovement,
  transferStock
};
