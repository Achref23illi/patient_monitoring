const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the right format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // Or get token from cookie
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to request object
    req.user = await User.findById(decoded.id);

    // Add JWT payload data to request
    req.userData = decoded;

    // Check if user still exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found with this token'
      });
    }

    // Check if user is active
    if (!req.user.active) {
      return res.status(401).json({
        success: false,
        message: 'This user account has been deactivated'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check for specific permissions
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.userData.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to perform this action`
      });
    }
    next();
  };
};

// Audit logging middleware
exports.auditLog = (action) => {
  return (req, res, next) => {
    // Create an object to store audit information
    req.auditData = {
      action,
      userId: req.user ? req.user._id : null,
      userRole: req.user ? req.user.role : null,
      timestamp: new Date(),
      ipAddress: req.ip,
      method: req.method,
      url: req.originalUrl,
      resourceId: req.params.id || null
    };
    
    // The actual logging would be implemented elsewhere
    // This just sets up the data for logging

    next();
  };
};