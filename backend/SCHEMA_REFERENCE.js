/**
 * DATABASE SCHEMA QUICK REFERENCE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * HEALTHCARE-GRADE DATA MODEL
 * Designed for security, scalability, and HIPAA-like compliance
 */

// ============================================================
// 1. USER (Base Model - All platform users)
// ============================================================
User {
  _id: ObjectId,
  name: String (required),
  email: String (unique, required, lowercase),
  phone: String (unique, required),
  password: String (hashed, required, minLength: 8),
  role: enum ['donor', 'patient', 'hospital', 'admin'] (required),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude] (GeoJSON format),
    address: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  profileImage: String (URL),
  isVerified: Boolean (default: false),
  emailVerified: Boolean (default: false),
  phoneVerified: Boolean (default: false),
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  isActive: Boolean (default: true),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 2. DONOR (1:1 with User, role='donor')
// ============================================================
Donor {
  _id: ObjectId,
  userId: ObjectId → User (required, unique, indexed),
  bloodGroup: enum ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] (required),
  availabilityStatus: enum ['available', 'unavailable', 'cooldown'] (default: 'available'),
  lastDonationDate: Date,
  nextEligibleDonationDate: Date (auto: lastDonation + 56 days, computed),
  totalDonations: Number (default: 0),
  healthDeclaration: {
    hasChronicDisease: Boolean,
    hasBoneMarrowDisease: Boolean,
    hasInfectiousDisease: Boolean,
    hasUndergoSurgery: Boolean,
    surgeryDate: Date,
    medications: [String]
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  verified: Boolean (default: false),
  averageRating: Number (1-5, default: 0, computed from feedback),
  totalRatings: Number (default: 0),
  preferences: {
    notificationsByEmail: Boolean (default: true),
    notificationsBySMS: Boolean (default: true),
    pushNotifications: Boolean (default: true),
    anonymousDonation: Boolean (default: false),
    preferredDonationCenters: [ObjectId] → Hospital[]
  },
  badges: [String] (e.g., 'first_donation', 'milestone_5', 'lifetime_hero'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 3. PATIENT (1:1 with User, role='patient')
// ============================================================
Patient {
  _id: ObjectId,
  userId: ObjectId → User (required, unique, indexed),
  medicalRecordNumber: String (unique, required, indexed),
  dateOfBirth: Date (required),
  gender: enum ['M', 'F', 'Other'],
  requiredBloodGroup: enum ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] (required),
  bloodGroupCompatibility: [String] (auto-calculated based on blood type compatibility),
  urgencyLevel: enum ['low', 'medium', 'high', 'critical'] (default: 'medium', required),
  medicalCondition: String (required),
  unitsRequired: Number (1-10, required),
  currentHospital: ObjectId → Hospital (required, indexed),
  admissionDate: Date (required),
  estimatedDischargeDate: Date,
  hospitalContactPerson: {
    name: String,
    phone: String,
    designation: String
  },
  medicalDocumentation: {
    prescriptionDocument: String (URL/path),
    prescriptionUploadDate: Date,
    labReports: [{ url: String, uploadDate: Date }],
    consentFormSigned: Boolean,
    consentFormSignedDate: Date
  },
  guarantor: {
    name: String,
    relationship: String,
    phone: String,
    aadharId: String,
    address: String
  },
  activeRequests: Number (default: 0, computed),
  requestHistory: [ObjectId] → BloodRequest[] (indexed),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 4. HOSPITAL (1:1 with User, role='hospital')
// ============================================================
Hospital {
  _id: ObjectId,
  userId: ObjectId → User (required, unique, indexed),
  name: String (required),
  registrationNumber: String (unique, required, indexed),
  registrationDate: Date,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  location: {
    type: 'Point',
    coordinates: [longitude, latitude] (GeoJSON, indexed for 2dsphere),
    address: String
  },
  contactInfo: {
    mainPhone: String,
    emergencyPhone: String,
    email: String,
    website: String
  },
  bloodBankHead: {
    name: String,
    designation: String,
    phone: String,
    email: String
  },
  isVerified: Boolean (default: false, indexed),
  accreditations: [{
    name: String,
    issuer: String,
    certificateNumber: String,
    issueDate: Date,
    expiryDate: Date
  }],
  inventory: {
    'O+': { units: Number, lastUpdated: Date },
    'O-': { units: Number, lastUpdated: Date },
    'A+': { units: Number, lastUpdated: Date },
    'A-': { units: Number, lastUpdated: Date },
    'B+': { units: Number, lastUpdated: Date },
    'B-': { units: Number, lastUpdated: Date },
    'AB+': { units: Number, lastUpdated: Date },
    'AB-': { units: Number, lastUpdated: Date },
    totalUnits: Number (computed),
    lastInventoryUpdate: Date
  },
  capacity: {
    maxDonationsPerDay: Number (default: 50),
    maxRequestsPerMonth: Number (default: 100)
  },
  operatingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  services: [String] (e.g., 'blood_collection', 'blood_testing', 'blood_storage', 'transfusion_services'),
  averageRating: Number (1-5, default: 0, computed),
  totalRatings: Number (default: 0),
  totalDonations: Number (default: 0, computed),
  totalRequestsFulfilled: Number (default: 0, computed),
  stats: {
    donationsThisMonth: Number,
    requestsFulfilled: Number,
    averageResponseTime: Number (minutes)
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 5. BLOOD REQUEST (Many:1 Patient, Many:1 Hospital)
// ============================================================
BloodRequest {
  _id: ObjectId,
  requestNumber: String (unique, auto-generated as BR-YYYY-MM-XXXXX),
  patientId: ObjectId → Patient (required, indexed),
  hospitalId: ObjectId → Hospital (required, indexed),
  bloodGroup: enum ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] (required),
  urgencyLevel: enum ['low', 'medium', 'high', 'critical'] (required, indexed),
  requiredUnits: Number (1-10, required),
  unitsMatched: Number (default: 0, computed),
  unitsFulfilled: Number (default: 0, computed),
  status: enum ['pending', 'matched', 'partial_fulfilled', 'fulfilled', 'cancelled'] (default: 'pending', indexed),
  cancellationReason: String,
  cancellationDate: Date,
  matchedDonors: [{
    donorId: ObjectId → Donor (indexed),
    donationId: ObjectId → Donation,
    status: enum ['matched', 'accepted', 'rejected', 'completed'],
    matchScore: Number (0-100, calculated based on blood group, location, availability),
    notifiedAt: Date,
    respondedAt: Date,
    responseMessage: String
  }],
  medicalReason: String (required),
  requestingDoctor: {
    name: String,
    registrationNumber: String,
    phone: String,
    email: String
  },
  deliveryDetails: {
    preferredDeliveryTime: Date,
    deliveryAddress: String,
    specialInstructions: String
  },
  priority: Boolean (default: false),
  estimatedFulfillmentDate: Date,
  actualFulfillmentDate: Date,
  notesAndReason: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 6. DONATION (Many:1 BloodRequest, Many:1 Donor, Many:1 Hospital)
// ============================================================
Donation {
  _id: ObjectId,
  donationNumber: String (unique, auto-generated as DN-YYYY-MM-XXXXX),
  requestId: ObjectId → BloodRequest (required, indexed),
  donorId: ObjectId → Donor (required, indexed),
  hospitalId: ObjectId → Hospital (required, indexed),
  bloodGroup: enum ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] (required),
  unitsCollected: Number (0.5-1, measured in units),
  donationStatus: enum ['notified', 'accepted', 'rejected', 'scheduled', 'collection_started', 
                        'collection_completed', 'testing', 'testing_passed', 'testing_failed', 
                        'stored', 'transfused', 'expired', 'discarded'] (default: 'notified', indexed),
  healthScreening: {
    conducted: Boolean (default: false),
    conductedBy: String,
    conductedAt: Date,
    results: {
      hemoglobin: Number,
      bloodPressure: String,
      bodyTemperature: Number,
      passed: Boolean
    }
  },
  labTesting: {
    conducted: Boolean (default: false),
    conductedBy: String,
    conductedAt: Date,
    testDate: Date,
    results: {
      bloodGroupMatch: Boolean,
      hivTest: enum ['negative', 'positive', 'indeterminate', 'pending'],
      hepatitisB: enum ['negative', 'positive', 'indeterminate', 'pending'],
      hepatitisC: enum ['negative', 'positive', 'indeterminate', 'pending'],
      syphilis: enum ['negative', 'positive', 'indeterminate', 'pending'],
      bloodCultureTest: enum ['negative', 'positive', 'indeterminate', 'pending']
    },
    notes: String
  },
  verifiedByHospital: {
    verified: Boolean (default: false),
    verificationDate: Date,
    verifiedBy: ObjectId → User
  },
  bagNumber: String (unique, indexed),
  storageLocation: {
    shelf: String,
    position: String,
    temperature: Number,
    storageUnit: String
  },
  transfusionInfo: {
    transfusedAt: Date,
    transfusedTo: ObjectId → Patient,
    transfusedBy: String,
    transfusionNotes: String
  },
  expiryDate: Date (auto-calculated: createdAt + 42 days, indexed),
  donorFeedback: {
    rating: Number (1-5),
    comment: String,
    providedAt: Date
  },
  hospitalFeedback: {
    rating: Number (1-5),
    comment: String,
    providedAt: Date
  },
  isAnonymous: Boolean (default: false),
  notes: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// 7. CAMPAIGN (Many:Many Hospitals, Many:Many Donors)
// ============================================================
Campaign {
  _id: ObjectId,
  campaignNumber: String (unique, auto-generated as CP-YYYY-MM-XXXXX),
  title: String (required),
  description: String (required),
  organizer: ObjectId → User (Hospital/Organization, required, indexed),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude] (GeoJSON, indexed for 2dsphere),
    address: String,
    city: String,
    state: String,
    radius: Number (km, for proximity searches)
  },
  campaignDate: {
    startDate: Date (required),
    endDate: Date (required),
    registrationDeadline: Date
  },
  targetBloodGroups: [enum ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']] or ['all'],
  targetDonors: Number,
  registeredDonors: [{
    donorId: ObjectId → Donor (indexed),
    registeredAt: Date,
    slotTime: Date,
    attended: Boolean,
    attended: Date,
    donated: Boolean,
    donationId: ObjectId → Donation
  }],
  successMetrics: {
    totalRegistered: Number (computed),
    totalAttended: Number (computed),
    totalDonated: Number (computed),
    totalUnitsCollected: Number (computed)
  },
  type: enum ['emergency', 'planned', 'seasonal', 'community', 'corporate'] (required),
  status: enum ['upcoming', 'active', 'completed', 'cancelled'] (default: 'upcoming', indexed),
  cancellationReason: String,
  cancellationDate: Date,
  images: [{
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  contact: {
    name: String,
    phone: String,
    email: String
  },
  incentives: {
    hasIncentives: Boolean,
    description: String,
    terms: String
  },
  partneredHospitals: [ObjectId] → Hospital[] (indexed),
  visibility: enum ['public', 'private', 'invited'] (default: 'public'),
  announcement: String,
  tags: [String],
  socialMedia: {
    hashtag: String,
    facebookLink: String,
    instagramLink: String,
    twitterLink: String
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

// ============================================================
// RELATIONSHIP SUMMARY
// ============================================================
/*
ENTITY RELATIONSHIPS:

User (1) 
  ├── (1) Donor [role='donor']
  ├── (1) Patient [role='patient']
  ├── (1) Hospital [role='hospital']
  └── (1 to Many) Campaign [as organizer]

Donor (1)
  └── (Many) Donation [blood collection]

Patient (1)
  └── (Many) BloodRequest [blood requirement]

Hospital (1)
  ├── (Many) BloodRequest [serves requests]
  └── (Many) Donation [collection & verification]

BloodRequest (1)
  ├── (1) Patient [blood requirement from]
  ├── (1) Hospital [requested by]
  ├── (Many) Donor [via Donation]
  └── (Many) Donation [fulfillment]

Donation (Many)
  ├── (1) BloodRequest [fulfills]
  ├── (1) Donor [from donor]
  └── (1) Hospital [collected & verified by]

Campaign (1)
  ├── (1) User/Hospital [organized by]
  ├── (Many) Donor [registrations]
  └── (Many) Hospital [partnerships]

CARDINALITY NOTES:
- Donor:Patient = Many:Many (via BloodRequest & Donation)
- Hospital:Campaign = Many:Many (partnerships)
- Donor:Campaign = Many:Many (registrations)
*/

// ============================================================
// DATABASE INDEXES REQUIRED
// ============================================================
/*
USER INDEXES:
  - email (unique)
  - phone (unique)
  - role (indexed for role-based queries)
  - location (2dsphere for geospatial queries)
  - createdAt (indexed for pagination)

DONOR INDEXES:
  - userId (unique)
  - bloodGroup (indexed)
  - availabilityStatus (indexed)
  - location (via User, 2dsphere)
  - createdAt

PATIENT INDEXES:
  - userId (unique)
  - medicalRecordNumber (unique)
  - currentHospital (indexed)
  - urgencyLevel (indexed)
  - requestHistory (indexed)
  - createdAt

HOSPITAL INDEXES:
  - userId (unique)
  - registrationNumber (unique)
  - location (2dsphere for geo-proximity)
  - isVerified (indexed)
  - createdAt

BLOOD REQUEST INDEXES:
  - patientId (indexed)
  - hospitalId (indexed)
  - (hospitalId, status) - compound index
  - bloodGroup (indexed)
  - urgencyLevel (indexed)
  - status (indexed)
  - createdAt (indexed)
  - matchedDonors.donorId (indexed)

DONATION INDEXES:
  - requestId (indexed)
  - donorId (indexed)
  - (donorId, donationStatus) - compound index
  - hospitalId (indexed)
  - donationStatus (indexed)
  - bagNumber (unique)
  - expiryDate (indexed for cleanup queries)
  - createdAt

CAMPAIGN INDEXES:
  - organizer (indexed)
  - location (2dsphere for geo-proximity)
  - status (indexed)
  - campaignDate.startDate (indexed)
  - registeredDonors.donorId (indexed)
  - createdAt
*/

// ============================================================
// UNIQUE CONSTRAINTS & VALIDATIONS
// ============================================================
/*
UNIQUE CONSTRAINTS (Database Level):
  User.email           - Case insensitive
  User.phone           - Must be valid format
  Donor.userId         - One Donor per User (role='donor')
  Patient.userId       - One Patient per User (role='patient')
  Patient.medicalRecordNumber - Unique across system
  Hospital.userId      - One Hospital per User (role='hospital')
  Hospital.registrationNumber - Unique, verified by admin
  BloodRequest.requestNumber  - Auto-generated unique ID
  Donation.donationNumber     - Auto-generated unique ID
  Donation.bagNumber   - Unique storage identifier
  Campaign.campaignNumber     - Auto-generated unique ID

VALIDATION RULES:
  - Blood Group: Must be valid ABO/Rh combination
  - Units: Must be 0.5-1.0 per donation
  - Phone: Must be 10 digits (India format or international)
  - Email: Valid email format, lowercased
  - Password: Minimum 8 chars, hash before storage
  - Urgency: Only high/critical can bypass normal matching rules
  - Status: Valid state transitions enforced by application logic
  - Coordinates: Valid GeoJSON [longitude, latitude]
  - Dates: Future dates only for scheduled events
  - Expiry Date: Auto-calculated as creation + 42 days

DATA INTEGRITY RULES:
  - A Donation can only exist with valid RequestId
  - A BloodRequest must have valid PatientId & HospitalId
  - A Donor's nextEligibleDonationDate must be >= lastDonationDate + 56 days
  - Hospital inventory units cannot be negative
  - Campaign endDate must be >= startDate
  - Donation status follows specific state machine:
    notified → accepted/rejected → scheduled → collection_started → 
    collection_completed → testing → testing_passed/testing_failed → 
    stored → transfused/expired/discarded
*/

// ============================================================
// COMPUTED FIELDS & AUTO-CALCULATED VALUES
// ============================================================
/*
DONOR:
  - nextEligibleDonationDate = lastDonationDate + 56 days
  - averageRating = sum(feedback ratings) / totalRatings
  - availabilityStatus = 'cooldown' if today < nextEligibleDonationDate else 'available'

PATIENT:
  - bloodGroupCompatibility = auto-calculated from requiredBloodGroup
    (e.g., if needed is 'AB-', can receive from any type [universal recipient])
  - activeRequests = count of BloodRequest where status != 'fulfilled' & != 'cancelled'

HOSPITAL:
  - totalUnits = sum of all blood group units in inventory
  - averageRating = sum(feedback ratings) / totalRatings
  - stats.donationsThisMonth = count Donation where createdAt in current month
  - stats.requestsFulfilled = count BloodRequest where status = 'fulfilled' & hospitalId = this
  - stats.averageResponseTime = avg duration from request creation to fulfillment

BLOOD REQUEST:
  - unitsMatched = count of Donation where requestId = this & status = 'accepted'
  - unitsFulfilled = count of Donation where requestId = this & status = 'transfused'
  - bloodGroupCompatibility = pre-calculated acceptable donors based on patient blood type

DONATION:
  - expiryDate = createdAt + 42 days (set on creation, indexed for TTL queries)

CAMPAIGN:
  - totalRegistered = count of registeredDonors
  - totalAttended = count where attended = true
  - totalDonated = count where donated = true
  - totalUnitsCollected = sum of unitsCollected from all donations
*/

// ============================================================
// TTL (TIME TO LIVE) INDEXES
// ============================================================
/*
AUTO-DELETE RECORDS (MongoDB TTL Indexes):
  
Donation:
  - expiryDate field with TTL = 0 seconds
  - Expires blood records 42 days after creation automatically
  
User.verificationToken:
  - verificationTokenExpire field with TTL = 0 seconds
  - Verification tokens auto-delete after expiry
  
User.resetPasswordToken:
  - resetPasswordExpire field with TTL = 0 seconds
  - Password reset tokens auto-delete after expiry

Session (future):
  - expiresAt field with TTL = 24 hours
  - Auto-cleanup of old login sessions
*/

// ============================================================
// QUERY PATTERNS & OPTIMIZATION
// ============================================================
/*
HIGH-FREQUENCY QUERIES (Optimize with indexes):

1. Find available donors by blood group near location:
   db.Donor.find({
     bloodGroup: "AB+",
     availabilityStatus: "available",
     location: { $near: { type: "Point", coordinates: [lon, lat] } }
   })
   
2. Find pending blood requests for a hospital:
   db.BloodRequest.find({
     hospitalId: ObjectId,
     status: { $in: ["pending", "matched"] }
   }).sort({ urgencyLevel: -1, createdAt: 1 })
   
3. Check donor eligibility:
   db.Donor.findOne({ 
     userId: ObjectId,
     nextEligibleDonationDate: { $lte: new Date() }
   })
   
4. Find nearby campaigns:
   db.Campaign.find({
     location: { $near: { type: "Point", coordinates: [lon, lat] } },
     status: "active"
   })
   
5. Donation inventory check:
   db.Hospital.findOne({ _id: ObjectId }).select('inventory')
   
6. Donor matching for request:
   db.Donor.find({
     bloodGroup: requiredGroup,
     availabilityStatus: "available",
     nextEligibleDonationDate: { $lte: new Date() },
     location: { $near: { type: "Point", coordinates: [lon, lat], $maxDistance: 10000 } }
   }).limit(10)

COMPOUND INDEXES (Multi-field):
  - BloodRequest: { hospitalId: 1, status: 1 }
  - Donation: { donorId: 1, donationStatus: 1 }
  - Donation: { expiryDate: 1, donationStatus: 1 }
  - Campaign: { organizer: 1, status: 1 }
*/
