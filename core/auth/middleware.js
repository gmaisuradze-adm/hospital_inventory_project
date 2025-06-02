const jwt = require('jsonwebtoken');

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token'
    });
  }
}

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Required role(s)
 */
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required'
      });
    }
    
    const hasRole = Array.isArray(roles) 
      ? roles.includes(req.user.role)
      : roles === req.user.role;
    
    if (!hasRole) {
      return res.status(403).json({
        error: true,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

module.exports = {
  authenticate,
  authorize
};