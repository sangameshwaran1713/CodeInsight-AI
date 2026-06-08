/**
 * @fileoverview API response utilities for consistent response formatting.
 * Provides standardized success and error response structures.
 * 
 * @module utils/response
 */

/**
 * Standard API response structure
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} [data] - Response data (for successful responses)
 * @property {string} [message] - Human-readable message
 * @property {Object} [error] - Error details (for error responses)
 * @property {Object} [meta] - Metadata (pagination, etc.)
 */

/**
 * Send a successful response
 * 
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} [options.data] - Response data
 * @param {string} [options.message] - Success message
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {Object} [options.meta] - Additional metadata
 * 
 * @example
 * // Basic usage
 * sendSuccess(res, { data: { user: userObj } });
 * 
 * // With message and meta
 * sendSuccess(res, {
 *   data: users,
 *   message: 'Users retrieved successfully',
 *   meta: { page: 1, total: 100 }
 * });
 */
const sendSuccess = (res, options = {}) => {
  const {
    data = null,
    message = 'Success',
    statusCode = 200,
    meta = null,
  } = options;

  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * 
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {string} [options.message] - Error message
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} [options.code] - Error code for client handling
 * @param {Object} [options.details] - Additional error details
 * 
 * @example
 * // Basic usage
 * sendError(res, { message: 'User not found', statusCode: 404 });
 * 
 * // With error code and details
 * sendError(res, {
 *   message: 'Validation failed',
 *   statusCode: 400,
 *   code: 'VALIDATION_ERROR',
 *   details: { field: 'email', message: 'Invalid email format' }
 * });
 */
const sendError = (res, options = {}) => {
  const {
    message = 'An error occurred',
    statusCode = 500,
    code = null,
    details = null,
  } = options;

  const response = {
    success: false,
    message,
  };

  if (code) {
    response.code = code;
  }

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && options.stack) {
    response.stack = options.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a created response (201)
 * 
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
const sendCreated = (res, options = {}) => {
  return sendSuccess(res, { ...options, statusCode: 201 });
};

/**
 * Send a no content response (204)
 * 
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Send a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {Object} options - Pagination options
 * @param {Array} options.data - Array of items
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total number of items
 * @param {string} [options.message] - Success message
 */
const sendPaginated = (res, options = {}) => {
  const { data, page, limit, total, message = 'Success' } = options;

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return sendSuccess(res, {
    data,
    message,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
};

/**
 * HTTP Status codes enum for consistency
 * @constant {Object}
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error codes for client-side handling
 * @constant {Object}
 */
const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Analysis errors
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  UNSUPPORTED_LANGUAGE: 'UNSUPPORTED_LANGUAGE',
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated,
  HttpStatus,
  ErrorCodes,
};
