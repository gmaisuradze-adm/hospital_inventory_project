const bcrypt = require('bcryptjs');

async function testPassword() {
  try {
    const result = await bcrypt.compare('admin123', '$2a$10$RVabp0R8dalAn0n9ilv2X.0MTGxYGY.3LFkr1962/vr48vy672L4K');
    console.log('Password match:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

testPassword();
