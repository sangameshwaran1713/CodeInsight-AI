/**
 * @fileoverview Centralized logger utility for the Node.js backend.
 * Provides structured logging with different levels and formats for
 * development and production environments.
 * 
 * @module utils/logger
 * @requires winston
 */

const winston = require('winston');
const path = require('path');

/**
 * Log levels configuration
 * @constant {Object}
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Colors for each log level (development console output)
 * @constant {Object}
 */
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(LOG_COLORS);

/**
 * Determine current log level based on environment
 * @returns {string} Log level name
 */
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL;
  
  if (configuredLevel) {
    return configuredLevel;
  }
  
  return env === 'development' ? 'debug' : 'info';
};

/**
 * Custom format for development environment
 * Includes colorized output with timestamps
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = ` ${JSON.stringify(metadata)}`;
    }
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Custom format for production environment
 * JSON structured logging for easy parsing
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports based on environment
 * @returns {Array} Winston transports
 */
const createTransports = () => {
  const transports = [];
  const env = process.env.NODE_ENV || 'development';
  
  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: env === 'development' ? developmentFormat : productionFormat,
    })
  );
  
  // File transports (production only)
  if (env === 'production') {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
    
    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join('logs', 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }
  
  return transports;
};

/**
 * Winston logger instance
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: LOG_LEVELS,
  transports: createTransports(),
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Log an HTTP request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
  const { method, originalUrl, ip } = req;
  const { statusCode } = res;
  
  const level = statusCode >= 400 ? 'warn' : 'http';
  
  logger.log(level, `${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    status: statusCode,
    duration: `${duration}ms`,
    ip,
    userAgent: req.get('User-Agent'),
  });
};

/**
 * Log an error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

/**
 * Create a child logger with additional context
 * @param {Object} metadata - Metadata to include in all logs
 * @returns {Object} Child logger
 */
logger.child = (metadata) => {
  return {
    error: (msg, meta = {}) => logger.error(msg, { ...metadata, ...meta }),
    warn: (msg, meta = {}) => logger.warn(msg, { ...metadata, ...meta }),
    info: (msg, meta = {}) => logger.info(msg, { ...metadata, ...meta }),
    http: (msg, meta = {}) => logger.http(msg, { ...metadata, ...meta }),
    debug: (msg, meta = {}) => logger.debug(msg, { ...metadata, ...meta }),
  };
};

module.exports = logger;
