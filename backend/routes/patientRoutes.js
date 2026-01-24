/**
 * PATIENT ROUTES
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Endpoints for patient blood requests, document uploads, and request tracking
 * All routes require authentication and patient role
 */

const express = require('express');
const router = express.Router();
const { patient } = require('../controllers');

// Middleware (to be implemented)
// const { authenticateToken } = require('../middleware/authMiddleware');
// const { authorizeRole } = require('../middleware/roleMiddleware');
// const { uploadFiles } = require('../middleware/uploadMiddleware');

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

/**
 * POST /api/patient/profile
 * Complete patient profile with medical information
 * Auth: Required (patient role)
 * Body: medicalRecordNumber, dateOfBirth, gender, requiredBloodGroup, hospital, guarantor
 * Returns: patient profile
 */
// router.post('/profile', authenticateToken, authorizeRole('patient'), patient.completePatientProfile);
router.post('/profile', patient.completePatientProfile);

// ============================================================
// BLOOD REQUEST MANAGEMENT
// ============================================================

/**
 * POST /api/patient/create-request
 * Create a new blood request
 * Auth: Required (patient role)
 * Body: bloodGroup, urgencyLevel, requiredUnits, medicalReason, requestingDoctor, hospitalId
 * Returns: requestId, requestNumber, status
 */
// router.post('/create-request', authenticateToken, authorizeRole('patient'), patient.createBloodRequest);
router.post('/create-request', patient.createBloodRequest);

/**
 * GET /api/patient/requests
 * View patient's blood requests with pagination and filtering
 * Auth: Required (patient role)
 * Query: status (optional), page (optional, default 1), limit (optional, default 10)
 * Returns: pagination, requests
 */
// router.get('/requests', authenticateToken, authorizeRole('patient'), patient.viewRequestStatus);
router.get('/requests', patient.viewRequestStatus);

/**
 * POST /api/patient/cancel-request/:requestId
 * Cancel a pending blood request
 * Auth: Required (patient role)
 * Body: reason (optional)
 * Returns: requestId, status
 */
// router.post('/cancel-request/:requestId', authenticateToken, authorizeRole('patient'), patient.cancelBloodRequest);
router.post('/cancel-request/:requestId', patient.cancelBloodRequest);

// ============================================================
// DOCUMENT UPLOADS
// ============================================================

/**
 * POST /api/patient/upload-prescription
 * Upload doctor's prescription
 * Auth: Required (patient role)
 * Form Data: requestId, file (PDF/JPG/PNG, max 5MB)
 * Returns: fileUrl, fileName
 */
// router.post('/upload-prescription', 
//   authenticateToken, 
//   authorizeRole('patient'), 
//   uploadFiles.single('file'),
//   patient.uploadPrescription
// );
router.post('/upload-prescription', patient.uploadPrescription);

/**
 * POST /api/patient/upload-consent
 * Upload signed consent form
 * Auth: Required (patient role)
 * Form Data: requestId, file (PDF/JPG/PNG, max 5MB)
 * Returns: fileUrl, consentStatus
 */
// router.post('/upload-consent',
//   authenticateToken,
//   authorizeRole('patient'),
//   uploadFiles.single('file'),
//   patient.uploadConsentForm
// );
router.post('/upload-consent', patient.uploadConsentForm);

module.exports = router;
