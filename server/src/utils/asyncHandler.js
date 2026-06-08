/**
 * @fileoverview Async handler wrapper to eliminate try-catch boilerplate.
 * Wraps async route handlers to automatically catch errors and forward
 * them to the error handling middleware.
 * 
 * @module utils/asyncHandler
 */

/**
 * Wrap an async function to handle promise rejections automatically.
 * This eliminates the need for try-catch blocks in every controller.
 * 
 * @param {Function} fn - Async function (req, res, next) => Promise
 * @returns {Function} Wrapped function that catches errors
 * 
 * @example
 * // Before (with try-catch)
 * const getUsers = async (req, res, next) => {
 *   try {
 *     const users = await User.find();
 *     res.json({ success: true, data: users });
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // After (with asyncHandler)
 * const getUsers = asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json({ success: true, data: users });
 * });
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrap multiple handlers at once (useful for routes)
 * 
 * @param {...Function} handlers - Array of async handlers
 * @returns {Array} Array of wrapped handlers
 * 
 * @example
 * router.get('/users', ...wrapAll(validateQuery, getUsers));
 */
const wrapAll = (...handlers) => {
  return handlers.map(handler => asyncHandler(handler));
};

/**
 * Execute multiple async operations in parallel with error handling.
 * Returns results array or throws first error encountered.
 * 
 * @param {Array<Promise>} promises - Array of promises
 * @returns {Promise<Array>} Array of resolved values
 * 
 * @example
 * const [users, posts] = await parallelAsync([
 *   User.find(),
 *   Post.find()
 * ]);
 */
const parallelAsync = async (promises) => {
  return Promise.all(promises);
};

/**
 * Execute async operations sequentially.
 * Each operation receives the result of the previous one.
 * 
 * @param {Array<Function>} fns - Array of async functions
 * @param {*} initialValue - Initial value to pass to first function
 * @returns {Promise<*>} Final result
 * 
 * @example
 * const result = await sequentialAsync([
 *   async (val) => val + 1,
 *   async (val) => val * 2
 * ], 5); // Returns 12
 */
const sequentialAsync = async (fns, initialValue) => {
  return fns.reduce(
    async (prevPromise, fn) => {
      const prev = await prevPromise;
      return fn(prev);
    },
    Promise.resolve(initialValue)
  );
};

/**
 * Retry an async operation with exponential backoff.
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.baseDelay=1000] - Base delay in ms
 * @param {Function} [options.shouldRetry] - Function to determine if error is retryable
 * @returns {Promise<*>} Result of the function
 * 
 * @example
 * const result = await retryAsync(
 *   () => fetchExternalAPI(),
 *   { maxRetries: 3, baseDelay: 1000 }
 * );
 */
const retryAsync = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    shouldRetry = () => true,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Execute an async function with a timeout.
 * 
 * @param {Function} fn - Async function
 * @param {number} ms - Timeout in milliseconds
 * @param {string} [message] - Custom timeout error message
 * @returns {Promise<*>} Result or timeout error
 * 
 * @example
 * const result = await withTimeout(
 *   fetchData,
 *   5000,
 *   'Data fetch timed out'
 * );
 */
const withTimeout = async (fn, ms, message = 'Operation timed out') => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

module.exports = {
  asyncHandler,
  wrapAll,
  parallelAsync,
  sequentialAsync,
  retryAsync,
  withTimeout,
};
