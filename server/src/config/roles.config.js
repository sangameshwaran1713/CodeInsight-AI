// Role-based Access Control Configuration

const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

const PERMISSIONS = {
  // Analysis permissions
  ANALYZE_CODE: 'analyze:code',
  VIEW_OWN_HISTORY: 'view:own_history',
  DELETE_OWN_HISTORY: 'delete:own_history',
  
  // Playground permissions
  USE_PLAYGROUND: 'use:playground',
  EXECUTE_CODE: 'execute:code',
  
  // User management permissions
  VIEW_USERS: 'view:users',
  EDIT_USERS: 'edit:users',
  DELETE_USERS: 'delete:users',
  CHANGE_USER_ROLE: 'change:user_role',
  
  // System permissions
  VIEW_ANALYTICS: 'view:analytics',
  MANAGE_SETTINGS: 'manage:settings',
  VIEW_LOGS: 'view:logs',
  
  // Content moderation
  VIEW_ALL_HISTORY: 'view:all_history',
  DELETE_ANY_HISTORY: 'delete:any_history',
};

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY = [
  ROLES.USER,
  ROLES.MODERATOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

// Permissions assigned to each role
const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.ANALYZE_CODE,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.DELETE_OWN_HISTORY,
    PERMISSIONS.USE_PLAYGROUND,
    PERMISSIONS.EXECUTE_CODE,
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.ANALYZE_CODE,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.DELETE_OWN_HISTORY,
    PERMISSIONS.USE_PLAYGROUND,
    PERMISSIONS.EXECUTE_CODE,
    PERMISSIONS.VIEW_ALL_HISTORY,
    PERMISSIONS.DELETE_ANY_HISTORY,
    PERMISSIONS.VIEW_USERS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.ANALYZE_CODE,
    PERMISSIONS.VIEW_OWN_HISTORY,
    PERMISSIONS.DELETE_OWN_HISTORY,
    PERMISSIONS.USE_PLAYGROUND,
    PERMISSIONS.EXECUTE_CODE,
    PERMISSIONS.VIEW_ALL_HISTORY,
    PERMISSIONS.DELETE_ANY_HISTORY,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.CHANGE_USER_ROLE,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [ROLES.SUPER_ADMIN]: [
    // Super admin has ALL permissions
    ...Object.values(PERMISSIONS),
  ],
};

// Check if a role has a specific permission
const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

// Check if roleA is higher than or equal to roleB in hierarchy
const isRoleHigherOrEqual = (roleA, roleB) => {
  const indexA = ROLE_HIERARCHY.indexOf(roleA);
  const indexB = ROLE_HIERARCHY.indexOf(roleB);
  return indexA >= indexB;
};

// Get all permissions for a role
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
  isRoleHigherOrEqual,
  getRolePermissions,
};
