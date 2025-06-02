const jwt = require('jsonwebtoken');
const { User, Role } = require('./models');
const { getModel } = require('../database');

/**
 * Login controller
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: true,
        message: 'Username and password are required'
      });
    }
    
    // Find user by username
    const user = await User.findOne({
      where: { username },
      include: [{ model: Role }]
    });
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }
    
    // Verify password
    const passwordValid = await user.verifyPassword(password);
    if (!passwordValid) {
      return res.status(401).json({
        error: true,
        message: 'Invalid credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: true,
        message: 'Account is inactive'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const roles = user.roles.map(role => role.name);
    const token = jwt.sign({ 
      userId: user.id,
      username: user.username,
      roles
    }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });
    
    res.json({
      error: false,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles
        }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Username, email, and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          { email }
        ]
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
      lastName
    });
    
    // Assign default role (User)
    const userRole = await Role.findOne({
      where: { name: 'User' }
    });
    
    if (userRole) {
      await user.addRole(userRole);
    }
    
    res.status(201).json({
      error: false,
      message: 'User registered successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

/**
 * Get user profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.userId;
    
    const user = await User.findByPk(userId, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    const roles = user.roles.map(role => role.name);
    
    res.json({
      error: false,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      error: true,
      message: 'Internal Server Error'
    });
  }
}

module.exports = {
  login,
  register,
  getProfile
};
