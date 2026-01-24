/**
 * AUTH ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for user authentication, registration, and password management
 * No authentication required for registration, login, forgot-password, reset-password, verify-email
 * Authentication required for profile access and logout
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

/**
 * POST /api/auth/register
 * Register a new user
 * Body: name, email, phone, password, role
 * Returns: userId, email, role
 */
router.post('/register', auth.registerUser);

/**
 * POST /api/auth/login
 * User login
 * Body: email, password
 * Returns: token, user
 */
router.post('/login', auth.loginUser);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 * Body: token
 * Returns: success message
 */
router.post('/verify-email', auth.verifyEmail);

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 * Body: email
 * Returns: success message
 */
router.post('/forgot-password', auth.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * Body: token, newPassword
 * Returns: success message
 */
router.post('/reset-password', auth.resetPassword);

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 * Headers: Authorization: Bearer <token>
 * Returns: user, roleProfile
 */
// router.get('/me', authenticateToken, auth.getCurrentUserProfile);

// Temporary (without middleware): 
router.get('/me', auth.getCurrentUserProfile);

/**
 * POST /api/auth/logout
 * Logout current user
 * Headers: Authorization: Bearer <token>
 * Returns: success message
 */
// router.post('/logout', authenticateToken, auth.logoutUser);

// Temporary (without middleware):
router.post('/logout', auth.logoutUser);

module.exports = router;
