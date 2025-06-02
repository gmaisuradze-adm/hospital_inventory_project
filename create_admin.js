require('dotenv').config();
const bcrypt = require('bcrypt');
const { connectDatabase } = require('./core/database');
const { User } = require('./core/auth/models');

async function createAdmin() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();
    
    // Create admin user if doesn't exist
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    
    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@hospital.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      active: true
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
