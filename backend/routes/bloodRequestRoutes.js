/**
 * BLOOD REQUEST ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for core blood request operations including creation, matching, and status tracking
 * Routes shared between patient and hospital with role-based authorization
 */

const express = require('express');
const router = express.Router();
const { bloodRequest } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRole } = require('../middleware/roleMiddleware');

// ============================================================
// REQUEST CREATION & RETRIEVAL
// ============================================================

/**
 * POST /api/blood-request
 * Create a new blood request
 * Auth: Required (patient or hospital role)
 * Body: bloodGroup, urgencyLevel, requiredUnits, medicalReason, requestingDoctor, hospitalId
 * Returns: requestId, requestNumber, status
 */
// router.post('/', 
//   authenticateToken, 
//   authorizeRole('patient', 'hospital'), 
//   bloodRequest.createBloodRequest
// );
router.post('/', bloodRequest.createBloodRequest);

/**
 * GET /api/blood-request
 * Get all blood requests with filtering by urgency
 * Auth: Required
 * Query: urgencyLevel (optional: low|medium|high|critical), page (optional, default 1), limit (optional, default 10)
 * Returns: pagination, requests
 */
// router.get('/', authenticateToken, bloodRequest.fetchRequestsByUrgency);
router.get('/', bloodRequest.fetchRequestsByUrgency);

/**
 * GET /api/blood-request/:requestId
 * Get detailed blood request information
 * Auth: Optional (public view, detailed for auth users)
 * Returns: request with populated relationships (patient, hospital, matched donors)
 */
router.get('/:requestId', bloodRequest.getRequestDetails);

// ============================================================
// STATUS MANAGEMENT
// ============================================================

/**
 * PUT /api/blood-request/:requestId/status
 * Update blood request status with state machine validation
 * Auth: Required (patient or hospital role)
 * Body: status (pending|matched|partial_fulfilled|fulfilled|cancelled)
 * Returns: requestId, status, updatedAt
 */
// router.put('/:requestId/status', 
//   authenticateToken, 
//   authorizeRole('patient', 'hospital'), 
//   bloodRequest.updateBloodRequestStatus
// );
router.put('/:requestId/status', bloodRequest.updateBloodRequestStatus);

// ============================================================
// DONOR MATCHING & LINKING
// ============================================================

/**
 * POST /api/blood-request/:requestId/link-donor
 * Link a specific donor to blood request (manual matching)
 * Auth: Required (hospital role)
 * Body: donorUserId, matchScore (0-100)
 * Returns: requestId, donorId, matchScore, status
 */
// router.post('/:requestId/link-donor', 
//   authenticateToken, 
//   authorizeRole('hospital'), 
//   bloodRequest.linkDonorToRequest
// );
router.post('/:requestId/link-donor', bloodRequest.linkDonorToRequest);

/**
 * POST /api/blood-request/:requestId/auto-match
 * Automatically match eligible donors based on matching algorithm
 * Auth: Required (hospital role)
 * Body: none
 * Returns: requestId, matchCount, donors (array with match scores)
 */
// router.post('/:requestId/auto-match', 
//   authenticateToken, 
//   authorizeRole('hospital'), 
//   bloodRequest.autoMatchDonors
// );
router.post('/:requestId/auto-match', bloodRequest.autoMatchDonors);

// ============================================================
// GEOSPATIAL SEARCH
// ============================================================

/**
 * GET /api/blood-request/search/nearby
 * Search for nearby eligible donors for a blood request
 * Auth: Required (hospital role)
 * Query: requestId, radiusKm (optional, default 10km)
 * Returns: totalDonorsFound, radius, donors
 */
// router.get('/search/nearby', 
//   authenticateToken, 
//   authorizeRole('hospital'), 
//   bloodRequest.searchNearbyDonors
// );
router.get('/search/nearby', bloodRequest.searchNearbyDonors);

module.exports = router;
