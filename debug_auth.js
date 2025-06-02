require('dotenv').config();
const { connectDatabase } = require('./core/database');
const { User } = require('./core/auth/models');
const bcrypt = require('bcrypt');

async function debugAuth() {
  try {
    await connectDatabase();
    
    console.log('=== Authentication Debug ===');
    
    // Find the admin user
    const user = await User.findOne({ where: { username: 'admin' } });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Active:', user.active);
    console.log('- Has password:', !!user.password);
    console.log('- Password length:', user.password?.length);
    console.log('- Password starts with:', user.password?.substring(0, 10) + '...');
    
    // Test password
    const testPassword = 'admin123';
    console.log('\n=== Password Testing ===');
    console.log('Testing password:', testPassword);
    
    // Test with model method
    console.log('\n1. Testing with User.checkPassword():');
    try {
      const passwordValid = await user.checkPassword(testPassword);
      console.log('   Result:', passwordValid);
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    // Test with direct bcrypt
    console.log('\n2. Testing with direct bcrypt.compare():');
    try {
      const directCompare = await bcrypt.compare(testPassword, user.password);
      console.log('   Result:', directCompare);
    } catch (error) {
      console.log('   Error:', error.message);
    }
    
    // Test hash generation
    console.log('\n3. Testing hash generation:');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('   New hash:', newHash);
    const testNewHash = await bcrypt.compare(testPassword, newHash);
    console.log('   New hash test:', testNewHash);
    
    // Test if password is already hashed
    console.log('\n4. Checking if stored password looks like bcrypt hash:');
    const bcryptPattern = /^\$2[ayb]\$\d+\$/;
    const looksLikeBcrypt = bcryptPattern.test(user.password);
    console.log('   Looks like bcrypt hash:', looksLikeBcrypt);
    
    if (!looksLikeBcrypt) {
      console.log('   🚨 WARNING: Stored password does not look like a bcrypt hash!');
      console.log('   This might be the issue - password might be stored as plaintext');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

debugAuth();
