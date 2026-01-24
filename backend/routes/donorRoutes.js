/**
 * DONOR ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for donor profile management, availability, requests, and donation tracking
 * All routes require authentication and donor role
 */

const express = require('express');
const router = express.Router();
const { donor } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRole } = require('../middleware/roleMiddleware');

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

/**
 * POST /api/donor/profile
 * Complete donor profile with blood group and health declaration
 * Auth: Required (donor role)
 * Body: bloodGroup, healthDeclaration, emergencyContact, preferences
 * Returns: donor profile
 */
// router.post('/profile', authenticateToken, authorizeRole('donor'), donor.completeDonorProfile);
router.post('/profile', donor.completeDonorProfile);

/**
 * PUT /api/donor/availability
 * Update donor availability status
 * Auth: Required (donor role)
 * Body: status (available|unavailable|cooldown)
 * Returns: availabilityStatus
 */
// router.put('/availability', authenticateToken, authorizeRole('donor'), donor.updateAvailabilityStatus);
router.put('/availability', donor.updateAvailabilityStatus);

/**
 * GET /api/donor/eligibility
 * Check if donor is eligible for donation
 * Auth: Required (donor role)
 * Query: none
 * Returns: isEligible, nextEligibleDate, totalDonations
 */
// router.get('/eligibility', authenticateToken, authorizeRole('donor'), donor.checkDonorEligibility);
router.get('/eligibility', donor.checkDonorEligibility);

// ============================================================
// REQUEST MANAGEMENT
// ============================================================

/**
 * GET /api/donor/requests
 * View blood requests nearby matching donor's blood group
 * Auth: Required (donor role)
 * Query: radius (optional, default 10km), urgencyLevel (optional)
 * Returns: totalRequests, requests
 */
// router.get('/requests', authenticateToken, authorizeRole('donor'), donor.viewAssignedRequests);
router.get('/requests', donor.viewAssignedRequests);

/**
 * POST /api/donor/accept-request
 * Accept a blood donation request
 * Auth: Required (donor role)
 * Body: requestId
 * Returns: donationId, donationStatus
 */
// router.post('/accept-request', authenticateToken, authorizeRole('donor'), donor.acceptDonationRequest);
router.post('/accept-request', donor.acceptDonationRequest);

/**
 * POST /api/donor/reject-request
 * Reject a blood donation request
 * Auth: Required (donor role)
 * Body: requestId, reason (optional)
 * Returns: requestId
 */
// router.post('/reject-request', authenticateToken, authorizeRole('donor'), donor.rejectDonationRequest);
router.post('/reject-request', donor.rejectDonationRequest);

// ============================================================
// DONATION HISTORY
// ============================================================

/**
 * GET /api/donor/donation-history
 * View donor's donation history with pagination
 * Auth: Required (donor role)
 * Query: page (optional, default 1), limit (optional, default 10), status (optional)
 * Returns: pagination, donations
 */
// router.get('/donation-history', authenticateToken, authorizeRole('donor'), donor.viewDonationHistory);
router.get('/donation-history', donor.viewDonationHistory);

module.exports = router;
