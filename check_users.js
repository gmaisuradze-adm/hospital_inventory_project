require('dotenv').config();
const { connectDatabase } = require('./core/database');
const { User } = require('./core/auth/models');

async function checkUsers() {
  try {
    await connectDatabase();
    
    console.log('=== Database Users Check ===');
    
    const allUsers = await User.findAll();
    console.log('Total users in database:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('- ID:', user.id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Active:', user.active);
      console.log('- Password (first 20 chars):', user.password?.substring(0, 20) + '...');
      console.log('- Password looks like bcrypt:', /^\$2[ayb]\$\d+\$/.test(user.password));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsers();
