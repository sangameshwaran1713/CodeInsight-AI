// Role-based Access Control Configuration (Frontend)

export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const PERMISSIONS = {
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
export const ROLE_HIERARCHY = [
  ROLES.USER,
  ROLES.MODERATOR,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

// Permissions assigned to each role
export const ROLE_PERMISSIONS = {
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
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

// Check if a role has a specific permission
export const hasPermission = (role, permission, customPermissions = []) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission) || customPermissions.includes(permission);
};

// Check if roleA is higher than or equal to roleB in hierarchy
export const isRoleHigherOrEqual = (roleA, roleB) => {
  const indexA = ROLE_HIERARCHY.indexOf(roleA);
  const indexB = ROLE_HIERARCHY.indexOf(roleB);
  return indexA >= indexB;
};

// Check if user has admin-level access
export const isAdmin = (role) => {
  return ['admin', 'super_admin'].includes(role);
};

// Check if user has moderator-level access
export const isModerator = (role) => {
  return ['moderator', 'admin', 'super_admin'].includes(role);
};

// Get role display name
export const getRoleDisplayName = (role) => {
  const names = {
    user: 'User',
    moderator: 'Moderator',
    admin: 'Admin',
    super_admin: 'Super Admin',
  };
  return names[role] || role;
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  const colors = {
    user: 'bg-gray-500',
    moderator: 'bg-blue-500',
    admin: 'bg-purple-500',
    super_admin: 'bg-red-500',
  };
  return colors[role] || 'bg-gray-500';
};
