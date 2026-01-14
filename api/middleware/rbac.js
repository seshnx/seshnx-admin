// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ============================================================================

/**
 * Permission matrix for each role
 * Defines what actions each role can perform
 */
const PERMISSIONS = {
  // SuperAdmin can do everything
  SuperAdmin: ['*'],

  // GAdmin (Global Admin) permissions
  GAdmin: [
    'users:read',
    'users:update',
    'users:ban',
    'users:delete',
    'content:read',
    'content:delete',
    'content:moderate',
    'analytics:read',
    'settings:read',
    'settings:update',
    'schools:read',
    'schools:create',
    'schools:update',
    'schools:delete',
    'students:read',
    'students:update',
    'invites:read',
    'invites:create',
    'invites:delete'
  ],

  // EDUAdmin (Education Admin) permissions
  EDUAdmin: [
    'users:read', // Read-only for users
    'schools:read',
    'schools:update', // Can update assigned schools only
    'students:read',
    'students:update',
    'analytics:read'
  ]
};

/**
 * Check if a role has a specific permission
 * @param {Array<string>} userRoles - User's roles
 * @param {string} requiredPermission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(userRoles, requiredPermission) {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Check each role the user has
  for (const role of userRoles) {
    const rolePermissions = PERMISSIONS[role] || [];

    // Wildcard permission means can do anything
    if (rolePermissions.includes('*')) {
      return true;
    }

    // Check if role has the specific permission
    if (rolePermissions.includes(requiredPermission)) {
      return true;
    }
  }

  return false;
}

/**
 * Express.js-style middleware to check permissions
 * @param {string} requiredPermission - Required permission
 * @returns {Function} Middleware function
 */
export function checkPermission(requiredPermission) {
  return (req, res, next) => {
    // Check if admin is attached to request (by auth middleware)
    if (!req.admin) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if admin has required permission
    const userHasPermission = hasPermission(req.admin.roles, requiredPermission);

    if (!userHasPermission) {
      return res.status(403).json({
        error: `Forbidden: ${requiredPermission} permission required`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermission,
        userRoles: req.admin.roles
      });
    }

    // User has permission, continue
    next();
  };
}

/**
 * Check if user is SuperAdmin
 * @returns {Function} Middleware function
 */
export function requireSuperAdmin(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.admin.isSuperAdmin) {
    return res.status(403).json({
      error: 'Forbidden: SuperAdmin access required',
      code: 'SUPERADMIN_REQUIRED'
    });
  }

  next();
}

/**
 * Check if user can manage other admins
 * Only SuperAdmin can manage other SuperAdmins
 * SuperAdmin and GAdmin can manage GAdmins and EDUAdmins
 * @returns {Function} Middleware function
 */
export function canManageAdmins(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Only SuperAdmin and GAdmin can manage admins
  const canManage = req.admin.roles.some(role =>
    role === 'SuperAdmin' || role === 'GAdmin'
  );

  if (!canManage) {
    return res.status(403).json({
      error: 'Forbidden: Insufficient permissions to manage admins',
      code: 'CANNOT_MANAGE_ADMINS'
    });
  }

  next();
}

/**
 * Check if user can modify system settings
 * @returns {Function} Middleware function
 */
export function canModifySettings(req, res, next) {
  const allowed = hasPermission(req.admin?.roles || [], 'settings:update');

  if (!allowed) {
    return res.status(403).json({
      error: 'Forbidden: Settings modification not allowed',
      code: 'CANNOT_MODIFY_SETTINGS'
    });
  }

  next();
}

/**
 * Get all permissions for a role (for display purposes)
 * @param {string} role - Role name
 * @returns {Array<string>} List of permissions
 */
export function getRolePermissions(role) {
  return PERMISSIONS[role] || [];
}

/**
 * Get all available roles
 * @returns {Array<string>} List of roles
 */
export function getAllRoles() {
  return Object.keys(PERMISSIONS);
}

/**
 * Export permissions matrix for reference
 */
export { PERMISSIONS };
