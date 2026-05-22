const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('./auth.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const authSchemas = require('./auth.validation');

const router = express.Router();

// Limiters to prevent brute-force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 login requests (Increased for development)
    message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 forgot-password requests per hour
    message: { success: false, message: 'Too many OTP requests from this IP, please try again after an hour' }
});

router.post('/register', validate(authSchemas.register), AuthController.register);
router.post('/verify-register', validate(authSchemas.verifyOTP), AuthController.verifyRegister);
router.post('/login', loginLimiter, validate(authSchemas.login), AuthController.login);
router.post('/verify-device-otp', AuthController.verifyDeviceOTP);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/forgot-password', otpLimiter, validate(authSchemas.forgotPassword), AuthController.forgotPassword);
router.post('/reset-password', loginLimiter, validate(authSchemas.resetPassword), AuthController.resetPassword);
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router;
