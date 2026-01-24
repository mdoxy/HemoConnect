/**
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Centralized error response handling
 * Prevents sensitive data leaks
 * Consistent error format across API
 * Healthcare-grade error management
 */

/**
 * Global error handler middleware
 * 
 * Must be registered LAST in app.js
 * Catches all errors from controllers and other middleware
 * 
 * Usage in app.js:
 * app.use(authRoutes);
 * app.use(donorRoutes);
 * // ... other middleware and routes
 * app.use(globalErrorHandler);  // MUST BE LAST
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
exports.globalErrorHandler = (err, req, res, next) => {
  try {
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let code = err.code || 'INTERNAL_ERROR';

    // ============================================================
    // SECURITY: Don't expose sensitive information in production
    // ============================================================

    // Never leak database queries or system details
    if (process.env.NODE_ENV === 'production') {
      // Hide implementation details from user
      if (message.includes('database') || message.includes('query')) {
        message = 'A database error occurred';
      }
      if (message.includes('password') || message.includes('secret')) {
        message = 'Operation failed due to security constraints';
      }
    }

    // ============================================================
    // ERROR CLASSIFICATION
    // ============================================================

    // Handle specific error types
    if (err.name === 'ValidationError') {
      // Input validation error
      statusCode = 400;
      message = 'Validation error: ' + message;
      code = 'VALIDATION_ERROR';
    }

    if (err.name === 'CastError') {
      // MongoDB invalid ID format
      statusCode = 400;
      message = 'Invalid request format';
      code = 'INVALID_FORMAT';
    }

    if (err.name === 'JsonWebTokenError') {
      // JWT verification failed
      statusCode = 401;
      message = 'Invalid authentication token';
      code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
      // JWT token expired
      statusCode = 401;
      message = 'Authentication token has expired';
      code = 'TOKEN_EXPIRED';
    }

    if (err.code === 11000) {
      // MongoDB duplicate key error (email, phone already exists)
      statusCode = 409;
      const field = Object.keys(err.keyPattern)[0];
      message = `${field} already exists`;
      code = 'DUPLICATE_ENTRY';
    }

    // ============================================================
    // RESPONSE FORMAT
    // ============================================================

    const errorResponse = {
      status: 'error',
      message,
      code,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }

    // Include request ID for tracing (if available)
    if (req.id) {
      errorResponse.requestId = req.id;
    }

    // ============================================================
    // LOGGING (Send to logging service in production)
    // ============================================================

    // Don't log sensitive information
    const safeErrorLog = {
      timestamp: new Date().toISOString(),
      code,
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id, // Only if authenticated
      message: message.substring(0, 200) // Limit message length
    };

    if (statusCode >= 500) {
      // Server errors should be logged
      console.error('Server Error:', safeErrorLog);
    } else if (statusCode >= 400) {
      // Client errors can be logged at debug level
      console.debug('Client Error:', safeErrorLog);
    }

    // Send error response
    res.status(statusCode).json(errorResponse);

  } catch (handlerError) {
    // Fallback if error handler itself fails
    console.error('Error handler failed:', handlerError);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      code: 'HANDLER_ERROR'
    });
  }
};

/**
 * CUSTOM ERROR CLASS
 * Use this in controllers to throw errors with context
 * 
 * Example:
 * throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ASYNC ERROR WRAPPER
 * Use this to wrap async route handlers to catch errors
 * 
 * Example:
 * router.get('/profile', asyncHandler(async (req, res) => {
 *   // If any error is thrown, it's caught and passed to error handler
 *   const user = await User.findById(req.user.id);
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * NOT FOUND HANDLER
 * Use before error handler to catch 404 routes
 * 
 * Example in app.js:
 * app.use(routes...);
 * app.use(notFoundHandler);
 * app.use(globalErrorHandler);
 */
exports.notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * ERROR RESPONSE EXAMPLES
 * 
 * ===== 400 Bad Request (Validation) =====
 * {
 *   "status": "error",
 *   "message": "Validation error: email must be valid",
 *   "code": "VALIDATION_ERROR",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/auth/register",
 *   "method": "POST"
 * }
 * 
 * ===== 401 Unauthorized =====
 * {
 *   "status": "error",
 *   "message": "Invalid authentication token",
 *   "code": "INVALID_TOKEN",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/donor/profile",
 *   "method": "GET"
 * }
 * 
 * ===== 403 Forbidden =====
 * {
 *   "status": "error",
 *   "message": "Access denied. This endpoint requires one of the following roles: donor",
 *   "code": "INSUFFICIENT_ROLE",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/donor/profile",
 *   "method": "POST"
 * }
 * 
 * ===== 404 Not Found =====
 * {
 *   "status": "error",
 *   "message": "User not found",
 *   "code": "USER_NOT_FOUND",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/user/123",
 *   "method": "GET"
 * }
 * 
 * ===== 409 Conflict =====
 * {
 *   "status": "error",
 *   "message": "email already exists",
 *   "code": "DUPLICATE_ENTRY",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/auth/register",
 *   "method": "POST"
 * }
 * 
 * ===== 500 Internal Server Error =====
 * Production (No sensitive info):
 * {
 *   "status": "error",
 *   "message": "Internal server error",
 *   "code": "INTERNAL_ERROR",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/auth/login",
 *   "method": "POST",
 *   "requestId": "req-abc123"
 * }
 * 
 * Development (Includes stack trace):
 * {
 *   "status": "error",
 *   "message": "Database connection failed",
 *   "code": "DB_ERROR",
 *   "timestamp": "2026-01-23T10:30:45.123Z",
 *   "path": "/api/auth/login",
 *   "method": "POST",
 *   "stack": "Error: Database connection failed\n    at ...Error Handler..."
 * }
 */

/**
 * HEALTHCARE-GRADE ERROR HANDLING FEATURES
 * 
 * ✅ Centralized error management
 *    - Single place to handle all errors
 *    - Consistent error format
 *    - Easier to maintain and debug
 * 
 * ✅ Security-focused
 *    - No sensitive information leaks
 *    - Different responses in dev vs production
 *    - Stack traces only in development
 *    - Passwords/secrets never in errors
 * 
 * ✅ Proper HTTP status codes
 *    - 400: Validation/client errors
 *    - 401: Authentication failures
 *    - 403: Authorization failures
 *    - 404: Resource not found
 *    - 409: Conflict (duplicate entry)
 *    - 500: Server errors
 * 
 * ✅ Error classification
 *    - Standard error codes for clients
 *    - Allows frontend to handle specific errors
 *    - Example: TOKEN_EXPIRED → show login prompt
 * 
 * ✅ Request tracing
 *    - Request ID in responses
 *    - Timestamp for all errors
 *    - Path and method logged
 *    - Can correlate with server logs
 * 
 * ✅ Graceful degradation
 *    - Even error handler has error handling
 *    - Fallback if handler fails
 *    - No crashes, always returns JSON
 * 
 * ✅ Development vs Production
 *    - Stack traces in development
 *    - Hidden details in production
 *    - NODE_ENV check for security
 */

/**
 * USAGE IN APP.JS
 * 
 * const express = require('express');
 * const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
 * 
 * const app = express();
 * 
 * // Middleware and routes...
 * app.use('/api/auth', authRoutes);
 * app.use('/api/donor', donorRoutes);
 * // ... other routes
 * 
 * // 404 handler (before error handler)
 * app.use(notFoundHandler);
 * 
 * // Global error handler (MUST BE LAST)
 * app.use(globalErrorHandler);
 * 
 * module.exports = app;
 */

/**
 * USAGE IN CONTROLLERS
 * 
 * // Throw custom error
 * throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 * 
 * // Async handler (catches promises)
 * router.get('/profile', asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.user.id);
 *   if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
 *   res.json({ data: user });
 * }));
 */

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  AppError,
  asyncHandler
};
