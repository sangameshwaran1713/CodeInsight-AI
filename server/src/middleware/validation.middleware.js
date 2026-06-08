const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  handleValidationErrors,
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors,
];

// Analysis validation rules
const analysisValidation = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 50000 })
    .withMessage('Code cannot exceed 50000 characters (50KB)')
    .trim()
    .customSanitizer((value) => {
      // Remove potential XSS and injection attempts
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }),
  body('language')
    .notEmpty()
    .withMessage('Language is required')
    .isIn([
      'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
      'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
      'scala', 'html', 'css', 'sql',
    ])
    .withMessage('Invalid programming language'),
  body('analysisTypes')
    .optional()
    .isArray()
    .withMessage('analysisTypes must be an array')
    .custom((value) => {
      const validTypes = ['explain', 'line-by-line', 'bugs', 'fix', 'complexity', 'improve'];
      return value.every((type) => validTypes.includes(type));
    })
    .withMessage('Invalid analysis type'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  analysisValidation,
  handleValidationErrors,
};
