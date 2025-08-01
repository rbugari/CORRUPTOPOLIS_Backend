const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const registerUpload = require('../middleware/registerUpload');

router.post('/register', registerUpload.single('avatar'), authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/resend-verification-email', authController.resendVerificationEmail);

// @route   GET api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, authController.getProfile);

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/accept-terms', authController.acceptTerms);
router.post('/update-premium-status', authMiddleware, authController.updatePremiumStatus);

module.exports = router;
