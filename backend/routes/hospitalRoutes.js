/**
 * HOSPITAL ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for hospital blood bank operations, donor verification, donation management, and inventory
 * All routes require authentication and hospital role
 */

const express = require('express');
const router = express.Router();
const { hospital } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRole } = require('../middleware/roleMiddleware');

// ============================================================
// DONOR VERIFICATION
// ============================================================

/**
 * POST /api/hospital/verify-donor
 * Verify donor identity and registration
 * Auth: Required (hospital role)
 * Body: donorUserId
 * Returns: donorId, verified
 */
// router.post('/verify-donor', authenticateToken, authorizeRole('hospital'), hospital.verifyDonor);
router.post('/verify-donor', hospital.verifyDonor);

// ============================================================
// BLOOD REQUEST MANAGEMENT
// ============================================================

/**
 * POST /api/hospital/approve-request
 * Approve a blood request
 * Auth: Required (hospital role)
 * Body: requestId
 * Returns: requestId, status
 */
// router.post('/approve-request', authenticateToken, authorizeRole('hospital'), hospital.approveBloodRequest);
router.post('/approve-request', hospital.approveBloodRequest);

/**
 * POST /api/hospital/reject-request
 * Reject a blood request
 * Auth: Required (hospital role)
 * Body: requestId, reason
 * Returns: requestId, status
 */
// router.post('/reject-request', authenticateToken, authorizeRole('hospital'), hospital.rejectBloodRequest);
router.post('/reject-request', hospital.rejectBloodRequest);

/**
 * PUT /api/hospital/request-status
 * Update blood request status with state machine validation
 * Auth: Required (hospital role)
 * Body: requestId, status
 * Returns: requestId, status
 */
// router.put('/request-status', authenticateToken, authorizeRole('hospital'), hospital.updateBloodRequestStatus);
router.put('/request-status', hospital.updateBloodRequestStatus);

/**
 * GET /api/hospital/active-requests
 * View active (pending/matched) blood requests with filtering
 * Auth: Required (hospital role)
 * Query: page (optional, default 1), limit (optional, default 10), urgencyLevel (optional)
 * Returns: pagination, requests
 */
// router.get('/active-requests', authenticateToken, authorizeRole('hospital'), hospital.viewActiveRequests);
router.get('/active-requests', hospital.viewActiveRequests);

/**
 * GET /api/hospital/completed-requests
 * View completed (fulfilled/cancelled) blood requests
 * Auth: Required (hospital role)
 * Query: page (optional, default 1), limit (optional, default 10), startDate (optional), endDate (optional)
 * Returns: pagination, requests
 */
// router.get('/completed-requests', authenticateToken, authorizeRole('hospital'), hospital.viewCompletedRequests);
router.get('/completed-requests', hospital.viewCompletedRequests);

// ============================================================
// DONATION MANAGEMENT
// ============================================================

/**
 * POST /api/hospital/approve-donation
 * Approve collected blood donation (store in inventory)
 * Auth: Required (hospital role)
 * Body: donationId
 * Returns: donationId, status, expiryDate
 */
// router.post('/approve-donation', authenticateToken, authorizeRole('hospital'), hospital.approveDonation);
router.post('/approve-donation', hospital.approveDonation);

/**
 * POST /api/hospital/reject-donation
 * Reject blood donation (contamination, failed tests, etc)
 * Auth: Required (hospital role)
 * Body: donationId, reason
 * Returns: donationId, status
 */
// router.post('/reject-donation', authenticateToken, authorizeRole('hospital'), hospital.rejectDonation);
router.post('/reject-donation', hospital.rejectDonation);

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================

/**
 * GET /api/hospital/inventory
 * View blood inventory with all blood group units
 * Auth: Required (hospital role)
 * Query: none
 * Returns: inventory, totalUnits, lastUpdated
 */
// router.get('/inventory', authenticateToken, authorizeRole('hospital'), hospital.viewBloodInventory);
router.get('/inventory', hospital.viewBloodInventory);

/**
 * PUT /api/hospital/inventory
 * Update blood inventory manually
 * Auth: Required (hospital role)
 * Body: bloodGroup, units (non-negative integer)
 * Returns: bloodGroup, units, updatedAt
 */
// router.put('/inventory', authenticateToken, authorizeRole('hospital'), hospital.updateBloodInventory);
router.put('/inventory', hospital.updateBloodInventory);

module.exports = router;
