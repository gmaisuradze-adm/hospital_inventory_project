const { Asset, AssetCategory, Location, AssetAssignment } = require('./models');
const { getModel } = require('../../core/database');
const { EventTypes } = require('../../core/events');
const { initializeModuleRegistry } = require('../../core/module-registry');

const moduleRegistry = initializeModuleRegistry();

// Asset Controllers
async function getAllAssets(req, res, next) {
  try {
    const assets = await Asset.findAll({
      include: [
        { model: AssetCategory },
        { model: Location }
      ]
    });
    
    res.json({ assets });
  } catch (error) {
    next(error);
  }
}

async function getAssetById(req, res, next) {
  try {
    const { id } = req.params;
    
    const asset = await Asset.findByPk(id, {
      include: [
        { model: AssetCategory },
        { model: Location },
        { 
          model: AssetAssignment,
          include: [{ model: getModel('User'), attributes: ['id', 'username', 'firstName', 'lastName'] }]
        }
      ]
    });
    
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found'
      });
    }
    
    res.json({ asset });
  } catch (error) {
    next(error);
  }
}

async function createAsset(req, res, next) {
  try {
    const {
      name,
      serialNumber,
      assetTag,
      manufacturer,
      model,
      purchaseDate,
      purchaseCost,
      warrantyExpiration,
      notes,
      status,
      categoryId,
      locationId
    } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Name is required'
      });
    }
    
    // Create asset
    const asset = await Asset.create({
      name,
      serialNumber,
      assetTag,
      manufacturer,
      model,
      purchaseDate,
      purchaseCost,
      warrantyExpiration,
      notes,
      status,
      assetCategoryId: categoryId,
      locationId
    });
    
    // Emit event
    moduleRegistry.emit(EventTypes.ASSET_CREATED, { asset });
    
    res.status(201).json({
      message: 'Asset created successfully',
      asset
    });
  } catch (error) {
    next(error);
  }
}

async function updateAsset(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      serialNumber,
      assetTag,
      manufacturer,
      model,
      purchaseDate,
      purchaseCost,
      warrantyExpiration,
      notes,
      status,
      categoryId,
      locationId
    } = req.body;
    
    // Find asset
    const asset = await Asset.findByPk(id);
    
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found'
      });
    }
    
    // Update asset
    await asset.update({
      name: name || asset.name,
      serialNumber: serialNumber !== undefined ? serialNumber : asset.serialNumber,
      assetTag: assetTag !== undefined ? assetTag : asset.assetTag,
      manufacturer: manufacturer !== undefined ? manufacturer : asset.manufacturer,
      model: model !== undefined ? model : asset.model,
      purchaseDate: purchaseDate !== undefined ? purchaseDate : asset.purchaseDate,
      purchaseCost: purchaseCost !== undefined ? purchaseCost : asset.purchaseCost,
      warrantyExpiration: warrantyExpiration !== undefined ? warrantyExpiration : asset.warrantyExpiration,
      notes: notes !== undefined ? notes : asset.notes,
      status: status || asset.status,
      assetCategoryId: categoryId !== undefined ? categoryId : asset.assetCategoryId,
      locationId: locationId !== undefined ? locationId : asset.locationId
    });
    
    // Reload asset with associations
    await asset.reload({
      include: [
        { model: AssetCategory },
        { model: Location }
      ]
    });
    
    // Emit event
    moduleRegistry.emit(EventTypes.ASSET_UPDATED, { asset });
    
    res.json({
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAsset(req, res, next) {
  try {
    const { id } = req.params;
    
    // Find asset
    const asset = await Asset.findByPk(id);
    
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found'
      });
    }
    
    // Delete asset
    await asset.destroy();
    
    // Emit event
    moduleRegistry.emit(EventTypes.ASSET_DELETED, { assetId: id });
    
    res.json({
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// Asset Category Controllers
async function getAllCategories(req, res, next) {
  try {
    const categories = await AssetCategory.findAll();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description, icon } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Name is required'
      });
    }
    
    // Create category
    const category = await AssetCategory.create({
      name,
      description,
      icon
    });
    
    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
}

// Location Controllers
async function getAllLocations(req, res, next) {
  try {
    const locations = await Location.findAll();
    res.json({ locations });
  } catch (error) {
    next(error);
  }
}

async function createLocation(req, res, next) {
  try {
    const { name, description, address, floor, room } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        error: true,
        message: 'Name is required'
      });
    }
    
    // Create location
    const location = await Location.create({
      name,
      description,
      address,
      floor,
      room
    });
    
    res.status(201).json({
      message: 'Location created successfully',
      location
    });
  } catch (error) {
    next(error);
  }
}

// Asset Assignment Controllers
async function assignAsset(req, res, next) {
  try {
    const { assetId, userId, notes } = req.body;
    
    // Validate input
    if (!assetId || !userId) {
      return res.status(400).json({
        error: true,
        message: 'Asset ID and User ID are required'
      });
    }
    
    // Find asset
    const asset = await Asset.findByPk(assetId);
    
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found'
      });
    }
    
    // Check if asset is available
    if (asset.status !== 'available') {
      return res.status(400).json({
        error: true,
        message: 'Asset is not available for assignment'
      });
    }
    
    // Find user
    const User = getModel('User');
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Create assignment
    const assignment = await AssetAssignment.create({
      assetId,
      userId,
      notes
    });
    
    // Update asset status
    await asset.update({ status: 'assigned' });
    
    // Emit event
    moduleRegistry.emit(EventTypes.ASSET_ASSIGNED, { 
      asset, 
      user: { id: user.id, username: user.username },
      assignment 
    });
    
    res.status(201).json({
      message: 'Asset assigned successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
}

async function unassignAsset(req, res, next) {
  try {
    const { assignmentId } = req.params;
    
    // Find assignment
    const assignment = await AssetAssignment.findByPk(assignmentId, {
      include: [{ model: Asset }]
    });
    
    if (!assignment) {
      return res.status(404).json({
        error: true,
        message: 'Assignment not found'
      });
    }
    
    // Update assignment
    await assignment.update({
      returnDate: new Date()
    });
    
    // Update asset status
    await assignment.asset.update({ status: 'available' });
    
    // Emit event
    moduleRegistry.emit(EventTypes.ASSET_UNASSIGNED, { assignment });
    
    res.json({
      message: 'Asset unassigned successfully',
      assignment
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Asset controllers
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  
  // Category controllers
  getAllCategories,
  createCategory,
  
  // Location controllers
  getAllLocations,
  createLocation,
  
  // Assignment controllers
  assignAsset,
  unassignAsset
};