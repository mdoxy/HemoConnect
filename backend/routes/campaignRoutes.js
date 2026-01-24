/**
 * CAMPAIGN ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for blood donation campaigns including creation, registration, and analytics
 * Routes support public viewing and role-based campaign management
 */

const express = require('express');
const router = express.Router();
const { campaign } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRole } = require('../middleware/roleMiddleware');

// ============================================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================================

/**
 * GET /api/campaign
 * View all campaigns with filtering and geospatial search
 * Auth: Not required (public endpoint)
 * Query: status (optional), type (optional), page (optional, default 1), limit (optional, default 10), 
 *        longitude (optional), latitude (optional), radiusKm (optional)
 * Returns: pagination, campaigns
 */
router.get('/', campaign.viewAllCampaigns);

/**
 * GET /api/campaign/:campaignId
 * Get detailed campaign information
 * Auth: Not required (public endpoint)
 * Returns: campaign, registeredDonorsCount, successMetrics
 */
router.get('/:campaignId', campaign.getCampaignDetails);

// ============================================================
// PROTECTED ENDPOINTS (Authentication required)
// ============================================================

/**
 * POST /api/campaign
 * Create a new blood donation campaign
 * Auth: Required (admin or hospital role)
 * Body: title, description, location, campaignDate, targetBloodGroups, type, contact
 * Returns: campaignId, campaignNumber, status
 */
// router.post('/', 
//   authenticateToken, 
//   authorizeRole('admin', 'hospital'), 
//   campaign.createCampaign
// );
router.post('/', campaign.createCampaign);

/**
 * PUT /api/campaign/:campaignId/status
 * Update campaign status (upcoming → active → completed, or cancelled)
 * Auth: Required (admin or campaign creator hospital)
 * Body: status, cancellationReason (optional)
 * Returns: campaignId, status
 */
// router.put('/:campaignId/status', 
//   authenticateToken, 
//   authorizeRole('admin', 'hospital'), 
//   campaign.updateCampaignStatus
// );
router.put('/:campaignId/status', campaign.updateCampaignStatus);

/**
 * GET /api/campaign/:campaignId/analytics
 * Get campaign analytics and metrics
 * Auth: Required (admin or campaign creator hospital)
 * Returns: metrics (totalRegistered, totalAttended, totalDonated, rates)
 */
// router.get('/:campaignId/analytics', 
//   authenticateToken, 
//   authorizeRole('admin', 'hospital'), 
//   campaign.getCampaignAnalytics
// );
router.get('/:campaignId/analytics', campaign.getCampaignAnalytics);

// ============================================================
// DONOR REGISTRATION (Authentication required)
// ============================================================

/**
 * POST /api/campaign/:campaignId/register
 * Register donor to campaign
 * Auth: Required (donor role)
 * Body: slotTime (optional)
 * Returns: campaignId, registrationStatus, slotTime
 */
// router.post('/:campaignId/register', 
//   authenticateToken, 
//   authorizeRole('donor'), 
//   campaign.registerDonorToCampaign
// );
router.post('/:campaignId/register', campaign.registerDonorToCampaign);

/**
 * POST /api/campaign/:campaignId/unregister
 * Unregister donor from campaign
 * Auth: Required (donor role)
 * Body: none
 * Returns: campaignId
 */
// router.post('/:campaignId/unregister', 
//   authenticateToken, 
//   authorizeRole('donor'), 
//   campaign.unregisterDonorFromCampaign
// );
router.post('/:campaignId/unregister', campaign.unregisterDonorFromCampaign);

module.exports = router;
