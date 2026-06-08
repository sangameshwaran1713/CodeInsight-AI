const logger = require('../utils/logger');

/**
 * Audit logging middleware for sensitive operations
 * Logs authentication, authorization, and data access events
 */

const auditLog = (action, details = {}) => {
  return (req, res, next) => {
    const auditData = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?.id || 'anonymous',
      userEmail: req.user?.email || 'N/A',
      userRole: req.user?.role || 'N/A',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      method: req.method,
      url: req.originalUrl,
      ...details,
    };

    // Log immediately
    logger.info('AUDIT:', auditData);

    // Capture response status
    const originalSend = res.send;
    res.send = function (data) {
      auditData.statusCode = res.statusCode;
      auditData.success = res.statusCode < 400;
      
      // Log completion
      logger.info('AUDIT_COMPLETE:', auditData);
      
      originalSend.call(this, data);
    };

    next();
  };
};

// Specific audit loggers for common operations
const auditAuth = {
  login: auditLog('AUTH_LOGIN'),
  register: auditLog('AUTH_REGISTER'),
  logout: auditLog('AUTH_LOGOUT'),
  passwordReset: auditLog('AUTH_PASSWORD_RESET'),
  emailVerification: auditLog('AUTH_EMAIL_VERIFICATION'),
};

const auditData = {
  create: (resourceType) => auditLog('DATA_CREATE', { resourceType }),
  read: (resourceType) => auditLog('DATA_READ', { resourceType }),
  update: (resourceType) => auditLog('DATA_UPDATE', { resourceType }),
  delete: (resourceType) => auditLog('DATA_DELETE', { resourceType }),
};

const auditAdmin = {
  userManagement: auditLog('ADMIN_USER_MANAGEMENT'),
  roleChange: auditLog('ADMIN_ROLE_CHANGE'),
  systemConfig: auditLog('ADMIN_SYSTEM_CONFIG'),
};

module.exports = {
  auditLog,
  auditAuth,
  auditData,
  auditAdmin,
};
