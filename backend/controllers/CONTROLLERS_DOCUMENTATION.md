/**
 * CONTROLLERS DOCUMENTATION
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Complete guide to all controller functions, their purposes, parameters, and responses
 */

// ============================================================
// AUTH CONTROLLER (authController.js)
// ============================================================

/**
 * 1. registerUser(req, res)
 * 
 * PURPOSE: Create new user with role-specific profile (donor/patient/hospital/admin)
 * 
 * ENDPOINT: POST /api/auth/register
 * 
 * REQUEST BODY:
 * {
 *   name: String,                    // Required
 *   email: String,                   // Required, unique, lowercase
 *   phone: String,                   // Required, unique, 10 digits
 *   password: String,                // Required, min 8 chars
 *   role: String,                    // Required: donor|patient|hospital|admin
 *   locationData: {                  // Optional
 *     coordinates: [lon, lat],
 *     address: String
 *   },
 *   additionalData: {}               // Role-specific profile data
 * }
 * 
 * RESPONSE (201):
 * {
 *   success: true,
 *   message: "User registered successfully...",
 *   data: {
 *     name, email, role, isVerified, createdAt
 *   }
 * }
 * 
 * VALIDATIONS:
 * - Email format validation
 * - Phone format validation (10 digits)
 * - Password strength (min 8 chars)
 * - Valid role check
 * - Unique email & phone check
 */

/**
 * 2. loginUser(req, res)
 * 
 * PURPOSE: Authenticate user and return JWT token
 * 
 * ENDPOINT: POST /api/auth/login
 * 
 * REQUEST BODY:
 * {
 *   email: String,          // Required, case-insensitive
 *   password: String        // Required
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     token: JWT,
 *     user: {
 *       userId, name, email, role, isVerified, lastLogin
 *     }
 *   }
 * }
 * 
 * SECURITY FEATURES:
 * - Brute force protection (5 attempts → 15 min lockout)
 * - Password hashing with bcrypt
 * - JWT token generation (7 days default)
 * - Last login tracking
 */

/**
 * 3. getCurrentUserProfile(req, res)
 * 
 * PURPOSE: Return authenticated user's complete profile with role-specific data
 * 
 * ENDPOINT: GET /api/auth/me
 * HEADERS: Authorization: Bearer <JWT_TOKEN>
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     user: {...},
 *     roleProfile: {...}  // Donor/Patient/Hospital specific data
 *   }
 * }
 * 
 * REQUIRES: Valid JWT token in Authorization header
 */

/**
 * 4. logoutUser(req, res)
 * 
 * PURPOSE: Invalidate JWT token (stateless, optional blacklist)
 * 
 * ENDPOINT: POST /api/auth/logout
 * HEADERS: Authorization: Bearer <JWT_TOKEN>
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   message: "Logout successful"
 * }
 */

/**
 * 5. verifyEmail(req, res)
 * 
 * PURPOSE: Confirm user's email using verification token
 * 
 * ENDPOINT: POST /api/auth/verify-email
 * 
 * REQUEST BODY:
 * {
 *   token: String  // Email verification token
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   message: "Email verified successfully"
 * }
 */

/**
 * 6. forgotPassword(req, res)
 * 
 * PURPOSE: Send password reset link to email
 * 
 * ENDPOINT: POST /api/auth/forgot-password
 * 
 * REQUEST BODY:
 * {
 *   email: String  // User's email
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   message: "Password reset link sent to email"
 * }
 * 
 * NOTE: Token expires in 1 hour
 */

/**
 * 7. resetPassword(req, res)
 * 
 * PURPOSE: Update password using reset token
 * 
 * ENDPOINT: POST /api/auth/reset-password
 * 
 * REQUEST BODY:
 * {
 *   token: String,         // Reset token from email
 *   newPassword: String    // New password (min 8 chars)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   message: "Password reset successfully"
 * }
 */

// ============================================================
// DONOR CONTROLLER (donorController.js)
// ============================================================

/**
 * 1. completeDonorProfile(req, res)
 * 
 * PURPOSE: Complete donor profile with blood group and health info
 * 
 * ENDPOINT: POST /api/donor/complete-profile
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   bloodGroup: String,           // O+, O-, A+, A-, B+, B-, AB+, AB-
 *   healthDeclaration: {
 *     hasChronicDisease: Boolean,
 *     hasBoneMarrowDisease: Boolean,
 *     hasInfectiousDisease: Boolean,
 *     hasUndergoSurgery: Boolean,
 *     surgeryDate: Date,
 *     medications: [String]
 *   },
 *   emergencyContact: {
 *     name: String,
 *     phone: String,
 *     relationship: String
 *   },
 *   preferences: {
 *     notificationsByEmail: Boolean,
 *     notificationsBySMS: Boolean,
 *     pushNotifications: Boolean
 *   }
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { donor profile data }
 * }
 */

/**
 * 2. updateAvailabilityStatus(req, res)
 * 
 * PURPOSE: Change donor availability (available/unavailable/cooldown)
 * 
 * ENDPOINT: PUT /api/donor/availability
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   status: String  // available | unavailable | cooldown
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { availabilityStatus }
 * }
 */

/**
 * 3. viewAssignedRequests(req, res)
 * 
 * PURPOSE: View blood requests matching donor's blood group & location
 * 
 * ENDPOINT: GET /api/donor/requests
 * ROLE: donor only
 * 
 * QUERY PARAMS:
 * {
 *   radius: Number (default 10 km),
 *   urgencyLevel: String (optional filter)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     totalRequests: Number,
 *     requests: [...]
 *   }
 * }
 * 
 * FEATURES:
 * - Geospatial search (donor location → request location)
 * - Blood group matching
 * - Urgency level filtering
 */

/**
 * 4. viewDonationHistory(req, res)
 * 
 * PURPOSE: Get all past and current donations with pagination
 * 
 * ENDPOINT: GET /api/donor/donation-history
 * ROLE: donor only
 * 
 * QUERY PARAMS:
 * {
 *   page: Number (default 1),
 *   limit: Number (default 10),
 *   status: String (optional filter)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: { currentPage, totalPages, totalDonations },
 *     donations: [...]
 *   }
 * }
 */

/**
 * 5. checkDonorEligibility(req, res)
 * 
 * PURPOSE: Verify donor can donate (56-day rule)
 * 
 * ENDPOINT: GET /api/donor/eligibility
 * ROLE: donor only
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     isEligible: Boolean,
 *     nextEligibleDate: String,
 *     lastDonationDate: Date,
 *     totalDonations: Number,
 *     availabilityStatus: String
 *   }
 * }
 * 
 * LOGIC:
 * - 56 days must pass between donations
 * - Check against nextEligibleDonationDate
 */

/**
 * 6. acceptDonationRequest(req, res)
 * 
 * PURPOSE: Donor accepts a matching blood request
 * 
 * ENDPOINT: POST /api/donor/accept-request
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String
 * }
 * 
 * RESPONSE (201):
 * {
 *   success: true,
 *   data: {
 *     donationId: String,
 *     donationStatus: "accepted"
 *   }
 * }
 * 
 * CREATES:
 * - New Donation record
 * - Updates BloodRequest with matched donor
 * - Triggers notification to hospital
 */

/**
 * 7. rejectDonationRequest(req, res)
 * 
 * PURPOSE: Donor declines a matching request
 * 
 * ENDPOINT: POST /api/donor/reject-request
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   reason: String (optional)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId }
 * }
 */

// ============================================================
// PATIENT CONTROLLER (patientController.js)
// ============================================================

/**
 * 1. completePatientProfile(req, res)
 * 
 * PURPOSE: Complete patient profile with medical information
 * 
 * ENDPOINT: POST /api/patient/complete-profile
 * ROLE: patient only
 * 
 * REQUEST BODY:
 * {
 *   medicalRecordNumber: String (unique),
 *   dateOfBirth: Date,
 *   gender: String (M | F | Other),
 *   requiredBloodGroup: String,
 *   medicalCondition: String,
 *   currentHospital: String (ObjectId),
 *   hospitalContactPerson: { name, phone, designation },
 *   guarantor: { name, relationship, phone, aadharId }
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { patient profile }
 * }
 * 
 * AUTO-CALCULATED:
 * - bloodGroupCompatibility: Which donors can donate
 */

/**
 * 2. createBloodRequest(req, res)
 * 
 * PURPOSE: Patient creates urgent blood requirement request
 * 
 * ENDPOINT: POST /api/patient/create-request
 * ROLE: patient only
 * 
 * REQUEST BODY:
 * {
 *   bloodGroup: String,            // Required
 *   urgencyLevel: String,          // low | medium | high | critical
 *   requiredUnits: Number,         // 1-10
 *   medicalReason: String,
 *   requestingDoctor: {
 *     name: String,
 *     registrationNumber: String,
 *     phone: String,
 *     email: String
 *   },
 *   hospitalId: String
 * }
 * 
 * RESPONSE (201):
 * {
 *   success: true,
 *   data: {
 *     requestId: String,
 *     requestNumber: String,
 *     status: "pending",
 *     matchingStarted: true
 *   }
 * }
 * 
 * TRIGGERS:
 * - Auto-matching algorithm starts
 * - Donor notifications sent
 */

/**
 * 3. viewRequestStatus(req, res)
 * 
 * PURPOSE: View all blood requests with detailed status
 * 
 * ENDPOINT: GET /api/patient/requests
 * ROLE: patient only
 * 
 * QUERY PARAMS:
 * {
 *   status: String (optional),
 *   page: Number,
 *   limit: Number
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: {...},
 *     requests: [...]
 *   }
 * }
 */

/**
 * 4. uploadPrescription(req, res)
 * 
 * PURPOSE: Upload doctor's prescription document
 * 
 * ENDPOINT: POST /api/patient/upload-prescription
 * ROLE: patient only
 * 
 * FORM DATA:
 * {
 *   requestId: String,
 *   file: File (PDF, JPG, PNG, max 5MB)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { fileUrl, fileName }
 * }
 * 
 * ALLOWED TYPES: PDF, JPG, PNG (max 5MB)
 * STORAGE: Cloud storage (S3, Azure, GCP)
 */

/**
 * 5. uploadConsentForm(req, res)
 * 
 * PURPOSE: Upload signed consent form for transfusion
 * 
 * ENDPOINT: POST /api/patient/upload-consent
 * ROLE: patient only
 * 
 * FORM DATA:
 * {
 *   requestId: String,
 *   file: File (PDF, JPG, PNG)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { fileUrl, consentStatus: "signed" }
 * }
 * 
 * MARKS: Consent form as signed
 */

/**
 * 6. cancelBloodRequest(req, res)
 * 
 * PURPOSE: Patient cancels pending blood request
 * 
 * ENDPOINT: POST /api/patient/cancel-request
 * ROLE: patient only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   reason: String (optional)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, status: "cancelled" }
 * }
 * 
 * ALLOWED: Only pending/matched requests can be cancelled
 */

// ============================================================
// HOSPITAL CONTROLLER (hospitalController.js)
// ============================================================

/**
 * 1. verifyDonor(req, res)
 * 
 * PURPOSE: Hospital verifies donor identity and eligibility
 * 
 * ENDPOINT: POST /api/hospital/verify-donor
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   donorUserId: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { donorId, verified: true }
 * }
 */

/**
 * 2. approveBloodRequest(req, res)
 * 
 * PURPOSE: Hospital approves blood request (triggers matching)
 * 
 * ENDPOINT: POST /api/hospital/approve-request
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, status: "matched" }
 * }
 */

/**
 * 3. rejectBloodRequest(req, res)
 * 
 * PURPOSE: Hospital rejects blood request
 * 
 * ENDPOINT: POST /api/hospital/reject-request
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   reason: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, status: "cancelled" }
 * }
 */

/**
 * 4. approveDonation(req, res)
 * 
 * PURPOSE: Hospital approves & stores donation in inventory
 * 
 * ENDPOINT: POST /api/hospital/approve-donation
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   donationId: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { donationId, status: "stored", expiryDate }
 * }
 * 
 * AUTO-CALCULATES:
 * - Expiry date (42 days from collection)
 * - Hospital verification timestamp
 */

/**
 * 5. rejectDonation(req, res)
 * 
 * PURPOSE: Hospital rejects donation (failed test, contamination)
 * 
 * ENDPOINT: POST /api/hospital/reject-donation
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   donationId: String,
 *   reason: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { donationId, status: "discarded" }
 * }
 */

/**
 * 6. updateBloodRequestStatus(req, res)
 * 
 * PURPOSE: Update request progress (pending→matched→fulfilled)
 * 
 * ENDPOINT: PUT /api/hospital/request-status
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   status: String (pending|matched|partial_fulfilled|fulfilled|cancelled)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, status }
 * }
 */

/**
 * 7. viewActiveRequests(req, res)
 * 
 * PURPOSE: Get all pending/matched requests
 * 
 * ENDPOINT: GET /api/hospital/active-requests
 * ROLE: hospital only
 * 
 * QUERY PARAMS:
 * {
 *   page: Number,
 *   limit: Number,
 *   urgencyLevel: String (optional)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: {...},
 *     requests: [...]
 *   }
 * }
 * 
 * SORTING: By urgency level (critical first), then by date
 */

/**
 * 8. viewCompletedRequests(req, res)
 * 
 * PURPOSE: Get fulfilled/cancelled requests
 * 
 * ENDPOINT: GET /api/hospital/completed-requests
 * ROLE: hospital only
 * 
 * QUERY PARAMS:
 * {
 *   page: Number,
 *   limit: Number,
 *   startDate: Date,
 *   endDate: Date
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: {...},
 *     requests: [...]
 *   }
 * }
 */

/**
 * 9. viewBloodInventory(req, res)
 * 
 * PURPOSE: View current blood stock levels
 * 
 * ENDPOINT: GET /api/hospital/inventory
 * ROLE: hospital only
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     inventory: {
 *       'O+': { units, lastUpdated },
 *       'O-': { units, lastUpdated },
 *       ...
 *     },
 *     totalUnits: Number,
 *     lastUpdated: Date
 *   }
 * }
 */

/**
 * 10. updateBloodInventory(req, res)
 * 
 * PURPOSE: Manually update blood stock levels
 * 
 * ENDPOINT: PUT /api/hospital/inventory
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   bloodGroup: String,
 *   units: Number
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { bloodGroup, units, updatedAt }
 * }
 * 
 * VALIDATION: Units must be non-negative integer
 */

// ============================================================
// BLOOD REQUEST CONTROLLER (bloodRequestController.js)
// ============================================================

/**
 * 1. createBloodRequest(req, res)
 * 
 * PURPOSE: Create new blood request (patient or hospital)
 * 
 * ENDPOINT: POST /api/blood-request/create
 * ROLE: patient, hospital
 * 
 * REQUEST BODY:
 * {
 *   bloodGroup: String,
 *   urgencyLevel: String,
 *   requiredUnits: Number,
 *   medicalReason: String,
 *   requestingDoctor: {...},
 *   hospitalId: String,
 *   patientId: String (hospital only)
 * }
 * 
 * RESPONSE (201):
 * {
 *   success: true,
 *   data: { requestId, requestNumber, status, matchingStarted }
 * }
 */

/**
 * 2. fetchRequestsByUrgency(req, res)
 * 
 * PURPOSE: Get blood requests filtered by urgency level
 * 
 * ENDPOINT: GET /api/blood-request/by-urgency
 * 
 * QUERY PARAMS:
 * {
 *   urgencyLevel: String (required),
 *   page: Number,
 *   limit: Number
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: {...},
 *     requests: [...]
 *   }
 * }
 * 
 * SORTING: Newest requests first
 */

/**
 * 3. updateBloodRequestStatus(req, res)
 * 
 * PURPOSE: Update request status with state validation
 * 
 * ENDPOINT: PUT /api/blood-request/status
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   status: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, status, updatedAt }
 * }
 * 
 * STATE MACHINE:
 * pending → matched → partial_fulfilled → fulfilled
 * (or cancelled at any point)
 */

/**
 * 4. linkDonorToRequest(req, res)
 * 
 * PURPOSE: Associate a donor with a request
 * 
 * ENDPOINT: POST /api/blood-request/link-donor
 * ROLE: hospital only
 * 
 * REQUEST BODY:
 * {
 *   requestId: String,
 *   donorUserId: String,
 *   matchScore: Number (0-100, optional)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { requestId, donorId, matchScore, status }
 * }
 */

/**
 * 5. getRequestDetails(req, res)
 * 
 * PURPOSE: Fetch complete request details with all relationships
 * 
 * ENDPOINT: GET /api/blood-request/:requestId
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     request: {
 *       patientId: {...},
 *       hospitalId: {...},
 *       matchedDonors: [...],
 *       ...
 *     }
 *   }
 * }
 */

/**
 * 6. searchNearbyDonors(req, res)
 * 
 * PURPOSE: Find eligible donors by proximity
 * 
 * ENDPOINT: GET /api/blood-request/search-donors
 * 
 * QUERY PARAMS:
 * {
 *   requestId: String (required),
 *   radiusKm: Number (default 10)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     totalDonorsFound: Number,
 *     radius: String,
 *     donors: [...]
 *   }
 * }
 * 
 * FILTERS:
 * - Blood group match
 * - Availability status
 * - Eligibility (56-day rule)
 * - Location proximity
 */

/**
 * 7. autoMatchDonors(req, res)
 * 
 * PURPOSE: Run automatic donor matching algorithm
 * 
 * ENDPOINT: POST /api/blood-request/auto-match
 * 
 * REQUEST BODY:
 * {
 *   requestId: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     requestId: String,
 *     matchCount: Number,
 *     donors: [...]
 *   }
 * }
 * 
 * MATCHING ALGORITHM:
 * 1. Blood group: Exact match required
 * 2. Location: Proximity-based (20km default)
 * 3. Availability: Must be eligible
 * 4. Score: 0-100 based on distance + history + activity
 * 
 * NOTIFICATIONS: Sent to all matched donors
 */

// ============================================================
// CAMPAIGN CONTROLLER (campaignController.js)
// ============================================================

/**
 * 1. createCampaign(req, res)
 * 
 * PURPOSE: Create blood donation campaign (admin/hospital)
 * 
 * ENDPOINT: POST /api/campaign/create
 * ROLE: admin, hospital
 * 
 * REQUEST BODY:
 * {
 *   title: String,
 *   description: String,
 *   location: {
 *     coordinates: [lon, lat],
 *     address: String,
 *     city: String,
 *     state: String,
 *     radius: Number
 *   },
 *   campaignDate: {
 *     startDate: Date,
 *     endDate: Date,
 *     registrationDeadline: Date
 *   },
 *   targetBloodGroups: [String] or ['all'],
 *   targetDonors: Number,
 *   type: String (emergency|planned|seasonal|community|corporate),
 *   contact: { name, phone, email },
 *   incentives: { hasIncentives, description }
 * }
 * 
 * RESPONSE (201):
 * {
 *   success: true,
 *   data: { campaignId, campaignNumber, status }
 * }
 * 
 * AUTO-GENERATED:
 * - Campaign number (CP-YYYY-MM-XXXXX)
 * - Success metrics initialized
 */

/**
 * 2. viewAllCampaigns(req, res)
 * 
 * PURPOSE: Get list of active/upcoming campaigns (PUBLIC)
 * 
 * ENDPOINT: GET /api/campaign/all
 * 
 * QUERY PARAMS:
 * {
 *   status: String (upcoming|active|completed|cancelled),
 *   type: String (optional),
 *   page: Number,
 *   limit: Number,
 *   longitude: Number (optional),
 *   latitude: Number (optional),
 *   radiusKm: Number (default 20)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     pagination: {...},
 *     campaigns: [...]
 *   }
 * }
 * 
 * FEATURES:
 * - Status filtering (default: active + upcoming)
 * - Geospatial search (if coordinates provided)
 * - Type filtering
 * - Populated organizer details
 */

/**
 * 3. getCampaignDetails(req, res)
 * 
 * PURPOSE: Fetch detailed campaign information
 * 
 * ENDPOINT: GET /api/campaign/:campaignId
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     campaign: {...},
 *     registeredDonorsCount: Number,
 *     successMetrics: {...}
 *   }
 * }
 */

/**
 * 4. registerDonorToCampaign(req, res)
 * 
 * PURPOSE: Donor registers for blood donation campaign
 * 
 * ENDPOINT: POST /api/campaign/register
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   campaignId: String,
 *   slotTime: Date (optional, walk-in if not provided)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     campaignId,
 *     registrationStatus: "registered",
 *     slotTime
 *   }
 * }
 * 
 * VALIDATIONS:
 * - Campaign must be open for registration
 * - Donor must be eligible (56-day rule)
 * - No duplicate registrations
 */

/**
 * 5. unregisterDonorFromCampaign(req, res)
 * 
 * PURPOSE: Donor cancels campaign registration
 * 
 * ENDPOINT: POST /api/campaign/unregister
 * ROLE: donor only
 * 
 * REQUEST BODY:
 * {
 *   campaignId: String
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { campaignId }
 * }
 */

/**
 * 6. updateCampaignStatus(req, res)
 * 
 * PURPOSE: Update campaign status (upcoming→active→completed)
 * 
 * ENDPOINT: PUT /api/campaign/status
 * ROLE: admin, hospital (creator)
 * 
 * REQUEST BODY:
 * {
 *   campaignId: String,
 *   status: String (upcoming|active|completed|cancelled),
 *   cancellationReason: String (if cancelled)
 * }
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: { campaignId, status }
 * }
 */

/**
 * 7. getCampaignAnalytics(req, res)
 * 
 * PURPOSE: Get campaign performance metrics
 * 
 * ENDPOINT: GET /api/campaign/:campaignId/analytics
 * ROLE: admin, hospital (creator)
 * 
 * RESPONSE (200):
 * {
 *   success: true,
 *   data: {
 *     campaignId,
 *     campaignName,
 *     metrics: {
 *       targetDonors,
 *       totalRegistered,
 *       totalAttended,
 *       totalDonated,
 *       totalUnitsCollected,
 *       attendanceRate,
 *       donationRate
 *     }
 *   }
 * }
 * 
 * METRICS CALCULATED:
 * - Attendance rate: (attended / registered) * 100
 * - Donation rate: (donated / attended) * 100
 * - Units per donor: totalUnitsCollected / totalDonated
 */

// ============================================================
// COMMON PATTERNS & BEST PRACTICES
// ============================================================

/**
 * ERROR RESPONSES:
 * 
 * 400 - Bad Request (validation error)
 * {
 *   success: false,
 *   message: "Descriptive error message",
 *   error: error.message
 * }
 * 
 * 401 - Unauthorized (missing/invalid token)
 * 403 - Forbidden (role-based access denied)
 * 404 - Not Found (resource doesn't exist)
 * 409 - Conflict (duplicate, already exists, invalid state)
 * 429 - Too Many Requests (rate limiting, account locked)
 * 500 - Server Error
 */

/**
 * AUTHENTICATION:
 * - All endpoints except register, login, public campaigns require JWT
 * - Token passed in Authorization header: "Bearer <token>"
 * - Token verified and decoded to get userId and role
 * - Role-based access control enforced per endpoint
 */

/**
 * VALIDATION LAYERS:
 * 1. Input validation (required fields, format, length)
 * 2. Business logic validation (state transitions, eligibility)
 * 3. Authorization checks (role & ownership)
 * 4. Database uniqueness constraints
 */

/**
 * ASYNC/AWAIT PATTERN:
 * All controller methods use async/await for:
 * - Database queries
 * - API calls
 * - File uploads
 * - Notifications
 * - Proper error handling with try-catch
 */

/**
 * STATUS CODES SUMMARY:
 * 200 - OK (GET, PUT, DELETE success)
 * 201 - Created (POST success, new resource)
 * 400 - Bad Request (validation failed)
 * 401 - Unauthorized (no/invalid token)
 * 403 - Forbidden (role/permission denied)
 * 404 - Not Found (resource missing)
 * 409 - Conflict (duplicate, invalid state)
 * 429 - Too Many Requests (brute force protection)
 * 500 - Server Error (unexpected exception)
 */
