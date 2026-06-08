/**
 * @fileoverview Input validation utilities for the Node.js backend.
 * Provides validators for common input types including code, URLs, and parameters.
 * 
 * @module utils/validators
 */

/**
 * Supported programming languages configuration
 * @constant {Object}
 */
const SUPPORTED_LANGUAGES = {
  python: {
    extensions: ['.py', '.pyw'],
    mimeTypes: ['text/x-python', 'application/x-python'],
    aliases: ['py', 'python3', 'python2'],
  },
  javascript: {
    extensions: ['.js', '.mjs', '.cjs'],
    mimeTypes: ['application/javascript', 'text/javascript'],
    aliases: ['js', 'node', 'nodejs'],
  },
  typescript: {
    extensions: ['.ts', '.tsx'],
    mimeTypes: ['application/typescript', 'text/typescript'],
    aliases: ['ts'],
  },
  java: {
    extensions: ['.java'],
    mimeTypes: ['text/x-java-source'],
    aliases: [],
  },
  cpp: {
    extensions: ['.cpp', '.cc', '.cxx', '.c++', '.hpp', '.h'],
    mimeTypes: ['text/x-c++src', 'text/x-c++hdr'],
    aliases: ['c++', 'cplusplus'],
  },
  go: {
    extensions: ['.go'],
    mimeTypes: ['text/x-go'],
    aliases: ['golang'],
  },
  rust: {
    extensions: ['.rs'],
    mimeTypes: ['text/x-rust'],
    aliases: [],
  },
};

// Maximum limits
const MAX_CODE_LENGTH = 100000; // 100KB
const MAX_FILE_SIZE = 1048576;  // 1MB
const MIN_CODE_LENGTH = 1;

/**
 * Validate code input for basic requirements.
 * 
 * @param {string} code - Source code string
 * @param {Object} options - Validation options
 * @param {number} [options.maxLength=100000] - Maximum allowed characters
 * @param {number} [options.minLength=1] - Minimum required characters
 * @param {boolean} [options.allowEmpty=false] - Whether to allow empty code
 * @returns {{isValid: boolean, error: string|null}} Validation result
 * 
 * @example
 * const { isValid, error } = validateCode("print('hello')");
 * if (!isValid) {
 *   throw new ValidationError(error);
 * }
 */
const validateCode = (code, options = {}) => {
  const {
    maxLength = MAX_CODE_LENGTH,
    minLength = MIN_CODE_LENGTH,
    allowEmpty = false,
  } = options;

  // Check if code is provided
  if (code === undefined || code === null) {
    return { isValid: false, error: 'Code is required' };
  }

  if (typeof code !== 'string') {
    return { isValid: false, error: 'Code must be a string' };
  }

  // Check length
  const codeLength = code.length;

  if (!allowEmpty && codeLength < minLength) {
    return { 
      isValid: false, 
      error: `Code must be at least ${minLength} character(s)` 
    };
  }

  if (codeLength > maxLength) {
    return { 
      isValid: false, 
      error: `Code exceeds maximum length of ${maxLength.toLocaleString()} characters` 
    };
  }

  // Check for binary content
  if (/\x00/.test(code)) {
    return { isValid: false, error: 'Code contains binary content' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate and normalize language identifier.
 * 
 * @param {string} language - Language string (can be alias or extension)
 * @param {string[]} [supported] - List of supported languages
 * @returns {{isValid: boolean, error: string|null, normalized: string|null}} Validation result
 * 
 * @example
 * const { isValid, error, normalized } = validateLanguage("py");
 * console.log(normalized); // "python"
 */
const validateLanguage = (language, supported = null) => {
  if (!language) {
    return { isValid: false, error: 'Language is required', normalized: null };
  }

  const languageLower = language.toLowerCase().trim();
  const supportedLangs = supported || Object.keys(SUPPORTED_LANGUAGES);

  // Direct match
  if (supportedLangs.includes(languageLower)) {
    return { isValid: true, error: null, normalized: languageLower };
  }

  // Check aliases
  for (const [lang, config] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (!supportedLangs.includes(lang)) continue;
    if (config.aliases.includes(languageLower)) {
      return { isValid: true, error: null, normalized: lang };
    }
  }

  // Check extensions
  for (const [lang, config] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (!supportedLangs.includes(lang)) continue;
    const ext = languageLower.startsWith('.') ? languageLower : `.${languageLower}`;
    if (config.extensions.includes(ext)) {
      return { isValid: true, error: null, normalized: lang };
    }
  }

  return { 
    isValid: false, 
    error: `Unsupported language: '${language}'. Supported: ${supportedLangs.join(', ')}`,
    normalized: null 
  };
};

/**
 * Detect programming language from filename or code content.
 * 
 * @param {Object} options - Detection options
 * @param {string} [options.filename] - Name of the file
 * @param {string} [options.code] - Source code content
 * @returns {string|null} Detected language or null
 */
const detectLanguage = ({ filename, code }) => {
  // Detection by filename
  if (filename) {
    const ext = filename.includes('.') 
      ? '.' + filename.split('.').pop().toLowerCase() 
      : '';
    for (const [lang, config] of Object.entries(SUPPORTED_LANGUAGES)) {
      if (config.extensions.includes(ext)) {
        return lang;
      }
    }
  }

  // Heuristic detection from code
  if (code) {
    // Python indicators
    if (/^(import\s+|from\s+\w+\s+import|def\s+\w+\s*\(|class\s+\w+)/m.test(code)) {
      return 'python';
    }

    // TypeScript indicators (check before JS)
    if (/interface\s+\w+|:\s*(string|number|boolean|any)\b/.test(code)) {
      return 'typescript';
    }

    // JavaScript indicators
    if (/(const\s+|let\s+|var\s+|function\s+\w+|=>\s*{|require\(|import\s+.*\s+from)/.test(code)) {
      return 'javascript';
    }

    // Java indicators
    if (/(public\s+class|private\s+|protected\s+|System\.out\.)/.test(code)) {
      return 'java';
    }

    // Go indicators
    if (/(package\s+main|func\s+\w+\(|import\s+")/.test(code)) {
      return 'go';
    }

    // Rust indicators
    if (/(fn\s+\w+|let\s+mut|impl\s+|pub\s+fn)/.test(code)) {
      return 'rust';
    }

    // C++ indicators
    if (/(#include\s*<|std::|iostream|namespace\s+)/.test(code)) {
      return 'cpp';
    }
  }

  return null;
};

/**
 * Validate a URL string.
 * 
 * @param {string} url - URL string to validate
 * @param {Object} options - Validation options
 * @param {string[]} [options.allowedSchemes=['http', 'https']] - Allowed schemes
 * @param {string[]} [options.allowedHosts] - Allowed hosts (default: any)
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
const validateUrl = (url, options = {}) => {
  const { 
    allowedSchemes = ['http', 'https'],
    allowedHosts = null 
  } = options;

  if (!url) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const parsed = new URL(url);

    if (!allowedSchemes.includes(parsed.protocol.replace(':', ''))) {
      return { 
        isValid: false, 
        error: `URL scheme must be one of: ${allowedSchemes.join(', ')}` 
      };
    }

    if (allowedHosts && !allowedHosts.includes(parsed.hostname)) {
      return { 
        isValid: false, 
        error: `URL host must be one of: ${allowedHosts.join(', ')}` 
      };
    }

    return { isValid: true, error: null };
  } catch (e) {
    return { isValid: false, error: `Invalid URL format: ${e.message}` };
  }
};

/**
 * Validate and parse a GitHub repository URL.
 * 
 * @param {string} url - GitHub URL string
 * @returns {{isValid: boolean, error: string|null, info: Object|null}} Validation result
 * 
 * @example
 * const { isValid, info } = validateGithubUrl("https://github.com/owner/repo");
 * console.log(info); // { owner: 'owner', repo: 'repo' }
 */
const validateGithubUrl = (url) => {
  if (!url) {
    return { isValid: false, error: 'GitHub URL is required', info: null };
  }

  const patterns = [
    /https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?\s*$/,
    /https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/[^/]+)?\/?\s*$/,
    /git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?\s*$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      const [, owner, repo] = match;
      return { 
        isValid: true, 
        error: null, 
        info: { owner, repo: repo.replace(/\.git$/, '') } 
      };
    }
  }

  return { 
    isValid: false, 
    error: 'Invalid GitHub repository URL format', 
    info: null 
  };
};

/**
 * Validate an integer value.
 * 
 * @param {*} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} [options.min] - Minimum allowed value
 * @param {number} [options.max] - Maximum allowed value
 * @param {string} [options.fieldName='Value'] - Field name for errors
 * @returns {{isValid: boolean, error: string|null, value: number|null}} Validation result
 */
const validateInteger = (value, options = {}) => {
  const { min, max, fieldName = 'Value' } = options;

  const intValue = parseInt(value, 10);
  
  if (isNaN(intValue)) {
    return { isValid: false, error: `${fieldName} must be an integer`, value: null };
  }

  if (min !== undefined && intValue < min) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${min}`, 
      value: null 
    };
  }

  if (max !== undefined && intValue > max) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at most ${max}`, 
      value: null 
    };
  }

  return { isValid: true, error: null, value: intValue };
};

/**
 * Validate a string value.
 * 
 * @param {*} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} [options.minLength=0] - Minimum string length
 * @param {number} [options.maxLength] - Maximum string length
 * @param {RegExp} [options.pattern] - Regex pattern to match
 * @param {string} [options.fieldName='Value'] - Field name for errors
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
const validateString = (value, options = {}) => {
  const { minLength = 0, maxLength, pattern, fieldName = 'Value' } = options;

  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  if (value.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters` 
    };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at most ${maxLength} characters` 
    };
  }

  if (pattern && !pattern.test(value)) {
    return { isValid: false, error: `${fieldName} has invalid format` };
  }

  return { isValid: true, error: null };
};

/**
 * Sanitize a string value.
 * 
 * @param {string} value - String to sanitize
 * @param {Object} options - Sanitization options
 * @param {number} [options.maxLength] - Maximum length (truncate if exceeded)
 * @param {boolean} [options.stripWhitespace=true] - Strip leading/trailing whitespace
 * @param {boolean} [options.removeNullBytes=true] - Remove null bytes
 * @returns {string} Sanitized string
 */
const sanitizeString = (value, options = {}) => {
  const { 
    maxLength, 
    stripWhitespace = true, 
    removeNullBytes = true 
  } = options;

  let result = value;

  if (stripWhitespace) {
    result = result.trim();
  }

  if (removeNullBytes) {
    result = result.replace(/\x00/gu, '');
  }

  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
};

/**
 * Validate email format.
 * 
 * @param {string} email - Email address to validate
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  // RFC 5322 simplified pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email address too long' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate password strength.
 * 
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @param {number} [options.minLength=8] - Minimum length
 * @param {boolean} [options.requireUppercase=true] - Require uppercase letter
 * @param {boolean} [options.requireLowercase=true] - Require lowercase letter
 * @param {boolean} [options.requireNumber=true] - Require number
 * @param {boolean} [options.requireSpecial=false] - Require special character
 * @returns {{isValid: boolean, error: string|null}} Validation result
 */
const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { 
      isValid: false, 
      error: `Password must be at least ${minLength} characters` 
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase letter' 
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one lowercase letter' 
    };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one number' 
    };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one special character' 
    };
  }

  return { isValid: true, error: null };
};

module.exports = {
  // Constants
  SUPPORTED_LANGUAGES,
  MAX_CODE_LENGTH,
  MAX_FILE_SIZE,
  MIN_CODE_LENGTH,
  
  // Code validators
  validateCode,
  validateLanguage,
  detectLanguage,
  
  // URL validators
  validateUrl,
  validateGithubUrl,
  
  // General validators
  validateInteger,
  validateString,
  sanitizeString,
  
  // Auth validators
  validateEmail,
  validatePassword,
};
