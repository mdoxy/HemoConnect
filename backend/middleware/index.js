/**
 * MIDDLEWARE INDEX
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Central exports for all middleware modules
 * Simplifies imports in routes and app.js
 */

// Authentication middleware
const { authenticateToken, optionalAuthentication } = require('./authMiddleware');

// Authorization middleware
const { authorizeRole } = require('./roleMiddleware');

// Error handling middleware
const { globalErrorHandler, notFoundHandler, AppError, asyncHandler } = require('./errorHandler');

// Validation middleware
const {
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateBloodGroup,
  validateEnum,
  validatePagination
} = require('./validationMiddleware');

module.exports = {
  // Authentication
  authenticateToken,
  optionalAuthentication,

  // Authorization
  authorizeRole,

  // Error handling
  globalErrorHandler,
  notFoundHandler,
  AppError,
  asyncHandler,

  // Validation
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateBloodGroup,
  validateEnum,
  validatePagination
};
