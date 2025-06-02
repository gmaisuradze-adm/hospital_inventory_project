/**
 * Database seed file to populate initial data
 * Run using: node seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('./core/database');
const { User, Role } = require('./core/auth/models');
const { AssetCategory, Location } = require('./modules/inventory/models');
const { Workflow, WorkflowStep } = require('./modules/requests/models');
const { Warehouse, Zone, StorageLocation, Item } = require('./modules/warehouse/models');

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();

    console.log('Syncing database models...');
    await sequelize.sync({ force: true });

    console.log('Creating roles...');
    const roles = await Role.bulkCreate([
      { name: 'admin', description: 'Administrator with full access' },
      { name: 'manager', description: 'Departmental manager' },
      { name: 'technician', description: 'IT technician' },
      { name: 'user', description: 'Standard user' },
      { name: 'inventory_manager', description: 'Inventory/Warehouse manager' }
    ]);

    console.log('Creating admin user...');
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    });

    // Assign admin role
    const adminRole = roles.find(r => r.name === 'admin');
    await adminUser.addRole(adminRole);

    // Create regular users
    console.log('Creating regular users...');
    const users = [
      { username: 'manager', email: 'manager@hospital.com', firstName: 'Manager', lastName: 'User', role: 'manager' },
      { username: 'technician', email: 'technician@hospital.com', firstName: 'Tech', lastName: 'Support', role: 'technician' },
      { username: 'inventory', email: 'inventory@hospital.com', firstName: 'Inventory', lastName: 'Manager', role: 'inventory_manager' },
      { username: 'user', email: 'user@hospital.com', firstName: 'Regular', lastName: 'User', role: 'user' }
    ];

    for (const userData of users) {
      const userRole = roles.find(r => r.name === userData.role);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true
      });
      
      await user.addRole(userRole);
    }

    // Create asset categories
    console.log('Creating asset categories...');
    const categories = await AssetCategory.bulkCreate([
      { name: 'Computer', description: 'Desktops, Laptops, and Workstations' },
      { name: 'Server', description: 'Server Hardware' },
      { name: 'Network', description: 'Switches, Routers, Access Points' },
      { name: 'Peripheral', description: 'Monitors, Printers, Scanners' },
      { name: 'Mobile', description: 'Phones, Tablets' }
    ]);

    // Create locations
    console.log('Creating locations...');
    const locations = await Location.bulkCreate([
      { name: 'IT Department', type: 'Department', floor: '1', room: '101' },
      { name: 'Emergency Room', type: 'Department', floor: '1', room: '150' },
      { name: 'Radiology', type: 'Department', floor: '2', room: '205' },
      { name: 'Admin Office', type: 'Office', floor: '3', room: '320' },
      { name: 'Main Warehouse', type: 'Storage', address: '123 Hospital St.' }
    ]);

    // Create warehouses, zones, and storage locations
    console.log('Creating warehouses...');
    const warehouses = await Warehouse.bulkCreate([
      { name: 'Main IT Warehouse', location: '123 Hospital St.', description: 'Primary IT equipment storage' },
      { name: 'Secondary Storage', location: 'Hospital Basement', description: 'Overflow storage' }
    ]);

    console.log('Creating zones...');
    const zones = await Zone.bulkCreate([
      { name: 'Computer Storage', code: 'COMP-A', description: 'Computer equipment storage', warehouseId: warehouses[0].id },
      { name: 'Network Storage', code: 'NET-A', description: 'Network equipment storage', warehouseId: warehouses[0].id },
      { name: 'Hardware Storage', code: 'HW-A', description: 'Hardware parts storage', warehouseId: warehouses[0].id },
      { name: 'Archive', code: 'ARCH-B', description: 'Archived equipment', warehouseId: warehouses[1].id }
    ]);

    console.log('Creating storage locations...');
    const storageLocations = await StorageLocation.bulkCreate([
      { name: 'Computer Shelf A', code: 'COMP-A1', type: 'shelf', capacity: 50, zoneId: zones[0].id },
      { name: 'Computer Shelf B', code: 'COMP-A2', type: 'shelf', capacity: 50, zoneId: zones[0].id },
      { name: 'Network Rack 1', code: 'NET-A1', type: 'rack', capacity: 30, zoneId: zones[1].id },
      { name: 'Network Rack 2', code: 'NET-A2', type: 'rack', capacity: 30, zoneId: zones[1].id },
      { name: 'Parts Bin 1', code: 'HW-A1', type: 'bin', capacity: 100, zoneId: zones[2].id },
      { name: 'Archive Shelf 1', code: 'ARCH-B1', type: 'shelf', capacity: 100, zoneId: zones[3].id }
    ]);

    // Create inventory items
    console.log('Creating inventory items...');
    const items = await Item.bulkCreate([
      { 
        name: 'Dell Latitude Laptop', 
        sku: 'COMP-LAPTOP-001', 
        description: 'Standard laptop for staff use', 
        category: 'Computer', 
        manufacturer: 'Dell', 
        model: 'Latitude 7420',
        unitPrice: 999.99,
        minimumStockLevel: 5,
        reorderPoint: 10
      },
      { 
        name: 'HP Desktop PC', 
        sku: 'COMP-DESKTOP-001', 
        description: 'Standard desktop workstation', 
        category: 'Computer', 
        manufacturer: 'HP', 
        model: 'ProDesk 600 G6',
        unitPrice: 799.99,
        minimumStockLevel: 3,
        reorderPoint: 7
      },
      { 
        name: 'Cisco Switch', 
        sku: 'NET-SWITCH-001', 
        description: '48-port gigabit switch', 
        category: 'Network', 
        manufacturer: 'Cisco', 
        model: 'Catalyst 2960-X',
        unitPrice: 1299.99,
        minimumStockLevel: 1,
        reorderPoint: 2
      },
      { 
        name: 'HDMI Cable', 
        sku: 'CABLE-HDMI-001', 
        description: '6ft HDMI Cable', 
        category: 'Accessory', 
        manufacturer: 'Generic', 
        model: 'HDMI 2.0',
        unitPrice: 9.99,
        minimumStockLevel: 20,
        reorderPoint: 30
      },
      { 
        name: 'USB Mouse', 
        sku: 'ACC-MOUSE-001', 
        description: 'Standard USB mouse', 
        category: 'Accessory', 
        manufacturer: 'Logitech', 
        model: 'M100',
        unitPrice: 12.99,
        minimumStockLevel: 15,
        reorderPoint: 25
      }
    ]);

    // Create workflows
    console.log('Creating workflows...');
    const equipmentWorkflow = await Workflow.create({
      name: 'equipment-request',
      description: 'Standard equipment request workflow',
      type: 'Equipment',
      active: true
    });

    // Create workflow steps
    console.log('Creating workflow steps...');
    await WorkflowStep.bulkCreate([
      {
        name: 'Request Review',
        description: 'Initial review of equipment request',
        stepOrder: 1,
        requiredRole: 'manager',
        workflowId: equipmentWorkflow.id
      },
      {
        name: 'Inventory Check',
        description: 'Check if equipment is available in inventory',
        stepOrder: 2,
        requiredRole: 'inventory_manager',
        workflowId: equipmentWorkflow.id
      },
      {
        name: 'Final Approval',
        description: 'Final approval before fulfillment',
        stepOrder: 3,
        requiredRole: 'manager',
        workflowId: equipmentWorkflow.id
      },
      {
        name: 'Fulfillment',
        description: 'Prepare and deliver equipment',
        stepOrder: 4,
        requiredRole: 'technician',
        workflowId: equipmentWorkflow.id
      }
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
