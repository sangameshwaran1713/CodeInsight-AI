const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission, canManageUser } = require('../middleware/auth.middleware');
const { PERMISSIONS } = require('../config/roles.config');
const {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  updateUserPermissions,
  deleteUser,
  getAnalytics,
  getRoles,
} = require('../controllers/admin.controller');

// All routes require authentication
router.use(protect);

// Get available roles (for admin UI)
router.get('/roles', authorize('admin', 'super_admin'), getRoles);

// Analytics
router.get(
  '/analytics',
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getAnalytics
);

// User management routes
router.get(
  '/users',
  requirePermission(PERMISSIONS.VIEW_USERS),
  getUsers
);

router.get(
  '/users/:userId',
  requirePermission(PERMISSIONS.VIEW_USERS),
  getUser
);

router.put(
  '/users/:userId/role',
  requirePermission(PERMISSIONS.CHANGE_USER_ROLE),
  canManageUser,
  updateUserRole
);

router.put(
  '/users/:userId/status',
  requirePermission(PERMISSIONS.EDIT_USERS),
  canManageUser,
  updateUserStatus
);

router.put(
  '/users/:userId/permissions',
  requirePermission(PERMISSIONS.EDIT_USERS),
  canManageUser,
  updateUserPermissions
);

router.delete(
  '/users/:userId',
  requirePermission(PERMISSIONS.DELETE_USERS),
  canManageUser,
  deleteUser
);

module.exports = router;
