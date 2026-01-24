/**
 * CONTROLLERS QUICK REFERENCE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Fast lookup guide for all 44 controller functions
 */

// ============================================================
// IMPORT STATEMENT FOR ROUTES
// ============================================================

// Single import:
const controllers = require('../controllers');

// Usage in routes:
router.post('/register', controllers.auth.registerUser);
router.post('/donor/profile', controllers.donor.completeDonorProfile);
router.post('/patient/request', controllers.patient.createBloodRequest);
// ... etc

// ============================================================
// AUTH CONTROLLER - 7 Functions
// ============================================================

/*
FILE: authController.js
EXPORT POINT: controllers.auth

1. registerUser(req, res)
   POST /auth/register
   Body: name, email, phone, password, role
   Returns: userId, email, role
   Status: 201

2. loginUser(req, res)
   POST /auth/login
   Body: email, password
   Returns: token, user
   Status: 200

3. getCurrentUserProfile(req, res)
   GET /auth/me
   Headers: Authorization: Bearer <token>
   Returns: user, roleProfile
   Status: 200

4. logoutUser(req, res)
   POST /auth/logout
   Returns: success message
   Status: 200

5. verifyEmail(req, res)
   POST /auth/verify-email
   Body: token
   Returns: success message
   Status: 200

6. forgotPassword(req, res)
   POST /auth/forgot-password
   Body: email
   Returns: success message
   Status: 200

7. resetPassword(req, res)
   POST /auth/reset-password
   Body: token, newPassword
   Returns: success message
   Status: 200
*/

// ============================================================
// DONOR CONTROLLER - 7 Functions
// ============================================================

/*
FILE: donorController.js
EXPORT POINT: controllers.donor
ROLE: donor only

1. completeDonorProfile(req, res)
   POST /donor/complete-profile
   Body: bloodGroup, healthDeclaration, emergencyContact, preferences
   Returns: donor profile
   Status: 200

2. updateAvailabilityStatus(req, res)
   PUT /donor/availability
   Body: status (available|unavailable|cooldown)
   Returns: availabilityStatus
   Status: 200

3. viewAssignedRequests(req, res)
   GET /donor/requests
   Query: radius, urgencyLevel
   Returns: totalRequests, requests
   Status: 200

4. viewDonationHistory(req, res)
   GET /donor/donation-history
   Query: page, limit, status
   Returns: pagination, donations
   Status: 200

5. checkDonorEligibility(req, res)
   GET /donor/eligibility
   Returns: isEligible, nextEligibleDate, totalDonations
   Status: 200

6. acceptDonationRequest(req, res)
   POST /donor/accept-request
   Body: requestId
   Returns: donationId, donationStatus
   Status: 201

7. rejectDonationRequest(req, res)
   POST /donor/reject-request
   Body: requestId, reason
   Returns: requestId
   Status: 200
*/

// ============================================================
// PATIENT CONTROLLER - 6 Functions
// ============================================================

/*
FILE: patientController.js
EXPORT POINT: controllers.patient
ROLE: patient only

1. completePatientProfile(req, res)
   POST /patient/complete-profile
   Body: medicalRecordNumber, dateOfBirth, gender, requiredBloodGroup, etc
   Returns: patient profile
   Status: 200

2. createBloodRequest(req, res)
   POST /patient/create-request
   Body: bloodGroup, urgencyLevel, requiredUnits, medicalReason, requestingDoctor, hospitalId
   Returns: requestId, requestNumber, status
   Status: 201

3. viewRequestStatus(req, res)
   GET /patient/requests
   Query: status, page, limit
   Returns: pagination, requests
   Status: 200

4. uploadPrescription(req, res)
   POST /patient/upload-prescription
   Body: requestId, file (multipart)
   Returns: fileUrl, fileName
   Status: 200

5. uploadConsentForm(req, res)
   POST /patient/upload-consent
   Body: requestId, file (multipart)
   Returns: fileUrl, consentStatus
   Status: 200

6. cancelBloodRequest(req, res)
   POST /patient/cancel-request
   Body: requestId, reason
   Returns: requestId, status
   Status: 200
*/

// ============================================================
// HOSPITAL CONTROLLER - 10 Functions
// ============================================================

/*
FILE: hospitalController.js
EXPORT POINT: controllers.hospital
ROLE: hospital only

1. verifyDonor(req, res)
   POST /hospital/verify-donor
   Body: donorUserId
   Returns: donorId, verified
   Status: 200

2. approveBloodRequest(req, res)
   POST /hospital/approve-request
   Body: requestId
   Returns: requestId, status
   Status: 200

3. rejectBloodRequest(req, res)
   POST /hospital/reject-request
   Body: requestId, reason
   Returns: requestId, status
   Status: 200

4. approveDonation(req, res)
   POST /hospital/approve-donation
   Body: donationId
   Returns: donationId, status, expiryDate
   Status: 200

5. rejectDonation(req, res)
   POST /hospital/reject-donation
   Body: donationId, reason
   Returns: donationId, status
   Status: 200

6. updateBloodRequestStatus(req, res)
   PUT /hospital/request-status
   Body: requestId, status
   Returns: requestId, status
   Status: 200

7. viewActiveRequests(req, res)
   GET /hospital/active-requests
   Query: page, limit, urgencyLevel
   Returns: pagination, requests
   Status: 200

8. viewCompletedRequests(req, res)
   GET /hospital/completed-requests
   Query: page, limit, startDate, endDate
   Returns: pagination, requests
   Status: 200

9. viewBloodInventory(req, res)
   GET /hospital/inventory
   Returns: inventory, totalUnits, lastUpdated
   Status: 200

10. updateBloodInventory(req, res)
    PUT /hospital/inventory
    Body: bloodGroup, units
    Returns: bloodGroup, units, updatedAt
    Status: 200
*/

// ============================================================
// BLOOD REQUEST CONTROLLER - 7 Functions
// ============================================================

/*
FILE: bloodRequestController.js
EXPORT POINT: controllers.bloodRequest
ROLE: patient, hospital, public (varies)

1. createBloodRequest(req, res)
   POST /blood-request/create
   Body: bloodGroup, urgencyLevel, requiredUnits, medicalReason, requestingDoctor, hospitalId
   Returns: requestId, requestNumber, status
   Status: 201

2. fetchRequestsByUrgency(req, res)
   GET /blood-request/by-urgency
   Query: urgencyLevel, page, limit
   Returns: pagination, requests
   Status: 200

3. updateBloodRequestStatus(req, res)
   PUT /blood-request/status
   Body: requestId, status
   Returns: requestId, status, updatedAt
   Status: 200

4. linkDonorToRequest(req, res)
   POST /blood-request/link-donor
   Body: requestId, donorUserId, matchScore
   Returns: requestId, donorId, matchScore, status
   Status: 200

5. getRequestDetails(req, res)
   GET /blood-request/:requestId
   Returns: request (with populated relationships)
   Status: 200

6. searchNearbyDonors(req, res)
   GET /blood-request/search-donors
   Query: requestId, radiusKm
   Returns: totalDonorsFound, radius, donors
   Status: 200

7. autoMatchDonors(req, res)
   POST /blood-request/auto-match
   Body: requestId
   Returns: requestId, matchCount, donors
   Status: 200
*/

// ============================================================
// CAMPAIGN CONTROLLER - 7 Functions
// ============================================================

/*
FILE: campaignController.js
EXPORT POINT: controllers.campaign
ROLE: admin/hospital (create), public (view), donor (register)

1. createCampaign(req, res)
   POST /campaign/create
   Role: admin, hospital
   Body: title, description, location, campaignDate, targetBloodGroups, type, contact
   Returns: campaignId, campaignNumber, status
   Status: 201

2. viewAllCampaigns(req, res)
   GET /campaign/all
   Query: status, type, page, limit, longitude, latitude, radiusKm
   Returns: pagination, campaigns
   Status: 200

3. getCampaignDetails(req, res)
   GET /campaign/:campaignId
   Returns: campaign, registeredDonorsCount, successMetrics
   Status: 200

4. registerDonorToCampaign(req, res)
   POST /campaign/register
   Role: donor
   Body: campaignId, slotTime
   Returns: campaignId, registrationStatus, slotTime
   Status: 200

5. unregisterDonorFromCampaign(req, res)
   POST /campaign/unregister
   Role: donor
   Body: campaignId
   Returns: campaignId
   Status: 200

6. updateCampaignStatus(req, res)
   PUT /campaign/status
   Role: admin, hospital (creator)
   Body: campaignId, status, cancellationReason
   Returns: campaignId, status
   Status: 200

7. getCampaignAnalytics(req, res)
   GET /campaign/:campaignId/analytics
   Role: admin, hospital (creator)
   Returns: metrics (registered, attended, donated, units, rates)
   Status: 200
*/

// ============================================================
// HTTP STATUS CODES USED
// ============================================================

/*
200 OK
  - Successful GET
  - Successful PUT/PATCH
  - Successful DELETE
  - Successful POST that doesn't create new resource

201 CREATED
  - Successful user registration
  - Successful POST that creates new resource
  - New blood request created
  - New campaign created

400 BAD REQUEST
  - Validation error
  - Missing required field
  - Invalid format/value
  - Invalid enum value

401 UNAUTHORIZED
  - Missing JWT token
  - Invalid/expired token
  - Token verification failed

403 FORBIDDEN
  - Role-based access denied
  - User doesn't have permission
  - Cannot manage other user's resources

404 NOT FOUND
  - Resource doesn't exist
  - User not found
  - Request/Donation not found

409 CONFLICT
  - Duplicate entry (email, phone, etc)
  - Invalid state transition
  - Already exists (duplicate registration)
  - Resource in wrong state for operation

429 TOO MANY REQUESTS
  - Brute force protection (login)
  - Account locked after failed attempts

500 INTERNAL SERVER ERROR
  - Uncaught exception
  - Database error
  - Unexpected error
*/

// ============================================================
// COMMON VALIDATION RULES
// ============================================================

/*
REQUIRED VALIDATIONS BY CONTROLLER:

Auth Controller:
  - Email: Valid format, unique, lowercase
  - Phone: 10 digits, unique
  - Password: Min 8 characters
  - Role: Must be donor|patient|hospital|admin

Donor Controller:
  - Blood Group: O+, O-, A+, A-, B+, B-, AB+, AB-
  - Emergency Contact: name, phone, relationship
  - Status: available, unavailable, cooldown
  - Eligibility: Next eligible date <= today

Patient Controller:
  - Medical Record: Unique per system
  - Date of Birth: Must be in past
  - Gender: M, F, Other
  - Units: 1-10 integer
  - Doctor: name, registration number required

Hospital Controller:
  - Blood Group Inventory: Non-negative units
  - Status: pending, matched, partial_fulfilled, fulfilled, cancelled
  - Rejection: Reason required

Blood Request Controller:
  - Urgency: low, medium, high, critical
  - Blood Group: Valid ABO/Rh type
  - Status Transition: Valid state machine

Campaign Controller:
  - Campaign Type: emergency, planned, seasonal, community, corporate
  - Dates: startDate < endDate, startDate not in past
  - Coordinates: Valid GeoJSON [longitude, latitude]
  - Status: upcoming, active, completed, cancelled
*/

// ============================================================
// FEATURE HIGHLIGHTS
// ============================================================

/*
SECURITY FEATURES:
✓ Role-based access control (RBAC)
✓ Ownership verification for resources
✓ Brute force protection (5 attempts)
✓ Account lockout (15 minutes)
✓ Password hashing (bcrypt 10 rounds)
✓ JWT token validation
✓ File type/size validation
✓ Input sanitization patterns

BUSINESS LOGIC FEATURES:
✓ Blood group compatibility calculation
✓ 56-day donation eligibility rule
✓ Geospatial donor matching (20km radius)
✓ Status state machine validation
✓ Automatic request numbering
✓ Campaign metrics calculation
✓ Inventory management
✓ Request urgency prioritization

DATA INTEGRITY:
✓ Unique constraints (email, phone, medical record)
✓ Referential integrity (foreign keys)
✓ State transition validation
✓ Pagination support
✓ Soft delete capability
✓ Timestamp tracking (createdAt, updatedAt)

SCALABILITY PATTERNS:
✓ Async/await throughout
✓ Try-catch error handling
✓ Pagination for large datasets
✓ Query filtering & sorting
✓ Geospatial indexing ready
✓ TTL index support (expiry)
✓ Cloud file storage integration
✓ Notification trigger points
*/

// ============================================================
// READY FOR INTEGRATION
// ============================================================

/*
These controllers are ready to be connected to:

1. ROUTES
   Define endpoints that call these controller methods
   Apply middleware for validation & authentication

2. MODELS
   Implement actual database operations (commented out in controllers)
   Use Mongoose schemas with proper indexes

3. MIDDLEWARE
   JWT verification
   Role-based access
   Error handling
   Input validation
   Request logging

4. SERVICES (Optional)
   Extract business logic
   Implement matching algorithm
   Handle notifications
   File upload logic

5. UTILITIES
   Input validators
   Error handlers
   Constants
   Logger
   Email service
*/
