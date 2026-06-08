/**
 * @fileoverview Central export point for all utility modules.
 * Import utilities from here for cleaner imports throughout the application.
 * 
 * @module utils
 * 
 * @example
 * const { logger, asyncHandler, sendSuccess, ValidationError } = require('./utils');
 */

// Logging utilities
const logger = require('./logger');

// Error classes
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  RateLimitError 
} = require('./errors');

// Response utilities
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNoContent, 
  sendPaginated, 
  HttpStatus, 
  ErrorCodes 
} = require('./response');

// Async handling utilities
const { 
  asyncHandler, 
  wrapAll, 
  retryAsync, 
  withTimeout 
} = require('./asyncHandler');

// Validation utilities
const { 
  SUPPORTED_LANGUAGES,
  MAX_CODE_LENGTH,
  MAX_FILE_SIZE,
  MIN_CODE_LENGTH,
  validateCode,
  validateLanguage,
  detectLanguage,
  validateUrl,
  validateGithubUrl,
  validateInteger,
  validateString,
  sanitizeString,
  validateEmail,
  validatePassword,
} = require('./validators');

// Helper functions
const helpers = require('./helpers');

// Constants
const constants = require('./constants');

module.exports = {
  // Logger
  logger,

  // Errors
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,

  // Response
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendPaginated,
  HttpStatus,
  ErrorCodes,

  // Async handlers
  asyncHandler,
  wrapAll,
  retryAsync,
  withTimeout,

  // Validators
  SUPPORTED_LANGUAGES,
  MAX_CODE_LENGTH,
  MAX_FILE_SIZE,
  MIN_CODE_LENGTH,
  validateCode,
  validateLanguage,
  detectLanguage,
  validateUrl,
  validateGithubUrl,
  validateInteger,
  validateString,
  sanitizeString,
  validateEmail,
  validatePassword,

  // Helpers
  helpers,

  // Constants
  constants,
};
