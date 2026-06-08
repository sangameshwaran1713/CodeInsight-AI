const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword,
  verifyEmail,
  verifyEmailWithOTP,
  resendVerification,
  requestPasswordOTP,
  changePasswordWithOTP,
  forgotPassword,
  resetPassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation } = require('../middleware/validation.middleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email-otp', verifyEmailWithOTP);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.post('/resend-verification', protect, resendVerification);
router.post('/request-password-otp', protect, requestPasswordOTP);
router.put('/password-with-otp', protect, changePasswordWithOTP);

module.exports = router;
