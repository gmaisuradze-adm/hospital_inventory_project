const jwt = require('jsonwebtoken');
const { User } = require('./models');

/**
 * Login controller
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, hasPassword: !!password });
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: true,
        message: 'Username and password are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ where: { username } });
    console.log('User found:', { 
      found: !!user, 
      active: user?.active,
      hasStoredPassword: !!user?.password,
      storedPasswordLength: user?.password?.length
    });
    
    if (!user || !user.active) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials or inactive account'
      });
    }
    
    // Check password
    console.log('Checking password for user:', username);
    const passwordValid = await user.checkPassword(password);
    console.log('Password validation result:', passwordValid);
    
    if (!passwordValid) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login timestamp
    await user.update({ lastLogin: new Date() });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1d' }
    );
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    });
    
  } catch (error) {
    next(error);
  }
}

/**
 * Register user controller
 */
async function register(req, res, next) {
  try {
    const { username, email, password, firstName, lastName, role } = req.body;
    
    // Validate input
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: true,
        message: 'All fields are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: true,
        message: 'Username or email already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'staff' // Default to staff if not specified
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({ user });
    
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  getProfile
};