import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      email: 'admin@hospital.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      department: 'Administration',
    },
  });

  // Create IT Admin user
  const itAdmin = await prisma.user.upsert({
    where: { email: 'itadmin@hospital.com' },
    update: {},
    create: {
      email: 'itadmin@hospital.com',
      username: 'itadmin',
      password: await bcrypt.hash('itadmin123', 10),
      firstName: 'IT',
      lastName: 'Administrator',
      role: 'IT_ADMIN',
      department: 'IT',
    },
  });

  // Create Finance Admin user
  const financeAdmin = await prisma.user.upsert({
    where: { email: 'finance@hospital.com' },
    update: {},
    create: {
      email: 'finance@hospital.com',
      username: 'financeadmin',
      password: await bcrypt.hash('finance123', 10),
      firstName: 'Finance',
      lastName: 'Administrator',
      role: 'FINANCE_ADMIN',
      department: 'Finance',
    },
  });

  // Create Manager user
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hospital.com' },
    update: {},
    create: {
      email: 'manager@hospital.com',
      username: 'manager',
      password: await bcrypt.hash('manager123', 10),
      firstName: 'Department',
      lastName: 'Manager',
      role: 'MANAGER',
      department: 'ICU',
    },
  });

  // Create regular users
  const users = [
    {
      email: 'doctor1@hospital.com',
      username: 'doctor1',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      department: 'ICU',
    },
    {
      email: 'nurse1@hospital.com',
      username: 'nurse1',
      firstName: 'Mary',
      lastName: 'Smith',
      department: 'Emergency',
    },
    {
      email: 'tech1@hospital.com',
      username: 'tech1',
      firstName: 'John',
      lastName: 'Wilson',
      department: 'IT',
    },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: await bcrypt.hash('user123', 10),
        role: 'USER',
      },
    });
  }

  // Create sample inventory items
  const inventoryItems = [
    {
      name: 'Dell OptiPlex 7090',
      description: 'Desktop computer for medical records',
      category: 'COMPUTER',
      status: 'IN_USE',
      location: 'ICU Station 1',
      serialNumber: 'DL001',
      model: 'OptiPlex 7090',
      manufacturer: 'Dell',
      purchaseDate: new Date('2023-01-15'),
      warrantyExpiry: new Date('2026-01-15'),
      cost: 899.99,
      department: 'ICU',
    },
    {
      name: 'HP LaserJet Pro M404n',
      description: 'Network printer for reports',
      category: 'PRINTER',
      status: 'AVAILABLE',
      location: 'IT Storage',
      serialNumber: 'HP001',
      model: 'LaserJet Pro M404n',
      manufacturer: 'HP',
      purchaseDate: new Date('2023-03-20'),
      warrantyExpiry: new Date('2026-03-20'),
      cost: 249.99,
      department: 'IT',
    },
    {
      name: 'Cisco Catalyst 2960-X',
      description: 'Network switch for department connectivity',
      category: 'NETWORK_EQUIPMENT',
      status: 'IN_USE',
      location: 'Server Room',
      serialNumber: 'CS001',
      model: 'Catalyst 2960-X',
      manufacturer: 'Cisco',
      purchaseDate: new Date('2022-11-10'),
      warrantyExpiry: new Date('2025-11-10'),
      cost: 1299.99,
      department: 'IT',
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { serialNumber: item.serialNumber },
      update: {},
      create: item,
    });
  }

  // Create sample IT requests
  const itRequests = [
    {
      title: 'New laptop for development',
      description: 'Need a new laptop for software development tasks',
      department: 'IT',
      priority: 'HIGH',
      category: 'HARDWARE',
      status: 'PENDING',
      estimatedCost: 1500.0,
      justification: 'Current laptop is too slow for development work',
      requestedBy: itAdmin.id,
    },
    {
      title: 'Software license renewal',
      description: 'Renew Microsoft Office licenses for 50 users',
      department: 'Administration',
      priority: 'MEDIUM',
      category: 'SOFTWARE',
      status: 'IN_PROGRESS',
      estimatedCost: 2500.0,
      actualCost: 2400.0,
      justification: 'Annual license renewal required',
      requestedBy: manager.id,
      assignedTo: itAdmin.id,
    },
  ];

  for (const request of itRequests) {
    await prisma.iTRequest.create({
      data: request,
    });
  }

  // Create sample procurement requests
  const procurementRequests = [
    {
      title: 'Medical equipment for ICU',
      description: 'Purchase of patient monitoring equipment',
      department: 'ICU',
      category: 'HARDWARE',
      priority: 'HIGH',
      status: 'PENDING_APPROVAL',
      estimatedCost: 15000.0,
      budget: 'ICU Equipment 2024',
      justification: 'Replace aging monitoring equipment to ensure patient safety',
      requestedBy: manager.id,
    },
    {
      title: 'IT Infrastructure Upgrade',
      description: 'Server upgrade and network improvements',
      department: 'IT',
      category: 'HARDWARE',
      priority: 'MEDIUM',
      status: 'APPROVED',
      estimatedCost: 25000.0,
      actualCost: 24500.0,
      budget: 'IT Infrastructure 2024',
      vendor: 'TechCorp Solutions',
      orderNumber: 'PO-2024-001',
      justification: 'Improve system performance and reliability',
      requestedBy: itAdmin.id,
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  ];

  for (const request of procurementRequests) {
    await prisma.procurementRequest.create({
      data: request,
    });
  }

  // Create sample forms
  const forms = [
    {
      name: 'IT Request Form',
      description: 'Standard form for IT service requests',
      fields: JSON.stringify({
        fields: [
          {
            id: 'request_type',
            type: 'select',
            label: 'Request Type',
            required: true,
            options: ['Hardware', 'Software', 'Network', 'Security'],
          },
          {
            id: 'description',
            type: 'textarea',
            label: 'Description',
            required: true,
            placeholder: 'Describe your request in detail',
          },
          {
            id: 'priority',
            type: 'select',
            label: 'Priority',
            required: true,
            options: ['Low', 'Medium', 'High', 'Urgent'],
          },
        ],
      }),
      createdBy: itAdmin.id,
    },
    {
      name: 'Equipment Request Form',
      description: 'Form for requesting new equipment',
      fields: JSON.stringify({
        fields: [
          {
            id: 'equipment_type',
            type: 'text',
            label: 'Equipment Type',
            required: true,
          },
          {
            id: 'quantity',
            type: 'number',
            label: 'Quantity',
            required: true,
          },
          {
            id: 'justification',
            type: 'textarea',
            label: 'Justification',
            required: true,
          },
        ],
      }),
      createdBy: manager.id,
    },
  ];

  for (const form of forms) {
    await prisma.form.create({
      data: form,
    });
  }

  // Create sample notifications
  const notifications = [
    {
      title: 'New IT Request Assigned',
      message: 'You have been assigned a new IT request for laptop procurement',
      type: 'INFO',
      userId: itAdmin.id,
    },
    {
      title: 'Procurement Request Approved',
      message: 'Your procurement request for medical equipment has been approved',
      type: 'SUCCESS',
      userId: manager.id,
    },
    {
      title: 'Low Stock Alert',
      message: 'Printer paper inventory is running low',
      type: 'WARNING',
      userId: adminUser.id,
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification,
    });
  }

  console.log('Database seeding completed successfully!');
  console.log('Created users:');
  console.log('- Admin: admin@hospital.com / admin123');
  console.log('- IT Admin: itadmin@hospital.com / itadmin123');
  console.log('- Finance Admin: finance@hospital.com / finance123');
  console.log('- Manager: manager@hospital.com / manager123');
  console.log('- Doctor: doctor1@hospital.com / user123');
  console.log('- Nurse: nurse1@hospital.com / user123');
  console.log('- Tech: tech1@hospital.com / user123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
