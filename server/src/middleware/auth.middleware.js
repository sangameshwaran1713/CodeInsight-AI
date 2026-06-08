const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { hasPermission, ROLES, isRoleHigherOrEqual } = require('../config/roles.config');

const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Contact support.',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check for specific permission
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userCustomPermissions = req.user.permissions || [];
    
    // Check if user has ANY of the required permissions
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(userRole, permission) || userCustomPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Check if user can manage target user (based on role hierarchy)
const canManageUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Can't manage users with higher or equal role (except yourself)
    if (targetUserId !== req.user.id && !isRoleHigherOrEqual(req.user.role, targetUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot manage users with a higher role',
      });
    }

    // Super admins can't be modified by regular admins
    if (targetUser.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can manage other super admins',
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, requirePermission, canManageUser };
