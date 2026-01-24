/**
 * APP.JS SETUP
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Express app configuration with route mounting
 * This file shows how to integrate all routes with middleware
 */

const express = require('express');
const app = express();

// ============================================================
// MIDDLEWARE SETUP (To be implemented)
// ============================================================

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (to be implemented)
// const cors = require('cors');
// app.use(cors());

// Request logger middleware (to be implemented)
// const { requestLogger } = require('./middleware/loggerMiddleware');
// app.use(requestLogger);

// ============================================================
// ROUTE IMPORTS
// ============================================================

const {
  authRoutes,
  donorRoutes,
  patientRoutes,
  hospitalRoutes,
  bloodRequestRoutes,
  campaignRoutes,
} = require('./routes');

// ============================================================
// ROUTE MOUNTING
// ============================================================

/**
 * ROUTE STRUCTURE:
 * 
 * /api/auth               - User authentication and profile
 * /api/donor              - Donor-specific operations
 * /api/patient            - Patient-specific operations
 * /api/hospital           - Hospital-specific operations
 * /api/blood-request      - Core blood request operations
 * /api/campaign           - Campaign management
 */

// Mount auth routes (public + protected)
app.use('/api/auth', authRoutes);

// Mount donor routes (all protected, donor only)
app.use('/api/donor', donorRoutes);

// Mount patient routes (all protected, patient only)
app.use('/api/patient', patientRoutes);

// Mount hospital routes (all protected, hospital only)
app.use('/api/hospital', hospitalRoutes);

// Mount blood request routes (shared, role-based)
app.use('/api/blood-request', bloodRequestRoutes);

// Mount campaign routes (public + protected)
app.use('/api/campaign', campaignRoutes);

// ============================================================
// HEALTH CHECK ENDPOINT (Optional)
// ============================================================

/**
 * GET /api/health
 * Health check endpoint for deployment/monitoring
 * Returns: status, timestamp, version
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (To be implemented)
// ============================================================

// const { globalErrorHandler } = require('./middleware/errorHandler');
// app.use(globalErrorHandler);

/**
 * EXAMPLE ERROR HANDLER:
 * 
 * app.use((err, req, res, next) => {
 *   console.error('Error:', err);
 *   
 *   const statusCode = err.statusCode || 500;
 *   const message = err.message || 'Internal server error';
 *   
 *   res.status(statusCode).json({
 *     status: 'error',
 *     message,
 *     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
 *   });
 * });
 */

module.exports = app;
