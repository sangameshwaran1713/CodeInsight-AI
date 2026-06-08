const User = require('../models/User.model');
const { ROLES, ROLE_HIERARCHY, getRolePermissions } = require('../config/roles.config');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin+)
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:userId
// @access  Private (Admin+)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:userId/role
// @access  Private (Admin+)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUser = req.targetUser;

    // Validate role
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified',
      });
    }

    // Only super_admin can assign super_admin role
    if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can assign super admin role',
      });
    }

    // Can only assign roles lower than your own (except super_admin)
    const currentUserRoleIndex = ROLE_HIERARCHY.indexOf(req.user.role);
    const newRoleIndex = ROLE_HIERARCHY.indexOf(role);
    
    if (newRoleIndex >= currentUserRoleIndex && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'You cannot assign a role equal to or higher than your own',
      });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin+)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const targetUser = req.targetUser;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean',
      });
    }

    // Can't deactivate yourself
    if (targetUser._id.toString() === req.user.id && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user permissions
// @route   PUT /api/admin/users/:userId/permissions
// @access  Private (Admin+)
exports.updateUserPermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const targetUser = req.targetUser;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array',
      });
    }

    targetUser.permissions = permissions;
    await targetUser.save();

    res.json({
      success: true,
      message: 'User permissions updated',
      data: {
        id: targetUser._id,
        name: targetUser.name,
        permissions: targetUser.permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:userId
// @access  Private (Admin+)
exports.deleteUser = async (req, res, next) => {
  try {
    const targetUser = req.targetUser;

    // Can't delete yourself
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(targetUser._id);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin+)
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Users active in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeThisWeek = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo },
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        newUsersThisMonth,
        activeThisWeek,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available roles
// @route   GET /api/admin/roles
// @access  Private (Admin+)
exports.getRoles = async (req, res, next) => {
  try {
    // Only show roles the user can assign (lower than their own)
    const userRoleIndex = ROLE_HIERARCHY.indexOf(req.user.role);
    
    let assignableRoles;
    if (req.user.role === ROLES.SUPER_ADMIN) {
      assignableRoles = [...ROLE_HIERARCHY];
    } else {
      assignableRoles = ROLE_HIERARCHY.slice(0, userRoleIndex);
    }

    const rolesWithPermissions = assignableRoles.map(role => ({
      name: role,
      permissions: getRolePermissions(role),
    }));

    res.json({
      success: true,
      data: {
        roles: rolesWithPermissions,
        hierarchy: ROLE_HIERARCHY,
      },
    });
  } catch (error) {
    next(error);
  }
};
