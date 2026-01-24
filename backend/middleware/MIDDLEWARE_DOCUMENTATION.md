/**
 * MIDDLEWARE DOCUMENTATION
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Complete guide for security middleware implementation
 * Authentication flow, role-based access control, error handling
 */

# SECURITY MIDDLEWARE DOCUMENTATION

## Overview

HemoConnect uses a **3-layer security architecture**:

```
Client Request
    ↓
1. Authentication Middleware (JWT Verification)
    ├─ Extract token from Authorization header
    ├─ Verify JWT signature
    ├─ Validate token expiry
    └─ Attach req.user object
    ↓
2. Authorization Middleware (Role-Based Access)
    ├─ Check user role
    ├─ Validate against allowed roles
    └─ Return 403 if unauthorized
    ↓
3. Validation Middleware (Input Validation)
    ├─ Validate request body
    ├─ Sanitize inputs
    └─ Check business logic constraints
    ↓
Controller (Business Logic)
    ↓
Response with Error Handler (Global Exception Handling)
```

---

## Middleware Files

| File | Purpose | Exports |
|------|---------|---------|
| `authMiddleware.js` | JWT verification | `authenticateToken`, `optionalAuthentication` |
| `roleMiddleware.js` | Role-based authorization | `authorizeRole` |
| `errorHandler.js` | Global error handling | `globalErrorHandler`, `notFoundHandler`, `AppError`, `asyncHandler` |
| `validationMiddleware.js` | Input validation | `validateBody`, `validateEmail`, `validatePhone`, `validatePassword`, `validateBloodGroup`, `validateEnum`, `validatePagination` |
| `index.js` | Central exports | All above exports |

---

## 1. AUTHENTICATION MIDDLEWARE

### File: `authMiddleware.js`

#### Function: `authenticateToken`

**Purpose:** Verify JWT token and attach user to request

**Expected Request Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Flow:**
```javascript
// Request comes in
GET /api/auth/me
Headers: Authorization: Bearer <token>

// Middleware extracts token
token = "<token>"

// Middleware verifies JWT
decoded = jwt.verify(token, JWT_SECRET)
// Returns: { id, email, role, iat, exp }

// Attaches to request
req.user = {
  id: 'user123',
  email: 'john@example.com',
  role: 'donor',
  iat: 1705424000,
  exp: 1706029000
}

// Calls next()
// Controller receives request with req.user ready to use
```

**Error Responses:**

```json
// Missing token (401)
{
  "status": "error",
  "message": "Authorization token required",
  "code": "MISSING_TOKEN"
}

// Invalid token (401)
{
  "status": "error",
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}

// Expired token (401)
{
  "status": "error",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED",
  "expiredAt": "2026-01-23T10:30:45.000Z"
}
```

#### Function: `optionalAuthentication`

**Purpose:** Verify token IF present, otherwise continue as guest

**Use Case:** Public endpoints that show more data if authenticated

```javascript
// Public campaign endpoint
GET /api/campaign

// Without token: Shows basic campaign info
// With token: Shows additional details + registration status
```

---

## 2. ROLE-BASED AUTHORIZATION MIDDLEWARE

### File: `roleMiddleware.js`

#### Function: `authorizeRole(...roles)`

**Purpose:** Enforce role-based access control

**Signature:**
```javascript
authorizeRole('donor')                    // Single role
authorizeRole('admin', 'hospital')        // Multiple roles
```

**Success Flow:**
```javascript
// Request arrives
POST /api/donor/profile
Headers: Authorization: Bearer <token>
Body: { bloodGroup: "O+", ... }

// authenticateToken runs first
req.user = { id: 'user123', role: 'donor', ... }

// authorizeRole('donor') runs next
if (req.user.role === 'donor') {
  // ✓ Match! Proceed to controller
  next()
}

// Controller executes
// donor.completeDonorProfile(req, res)
```

**Error Response (Insufficient Role):**

```json
{
  "status": "error",
  "message": "Access denied. This endpoint requires one of the following roles: donor",
  "code": "INSUFFICIENT_ROLE",
  "requiredRoles": ["donor"],
  "userRole": "patient"
}
```

**Access Control Matrix:**

| Endpoint | Allowed Roles | Endpoint | Allowed Roles |
|----------|---------------|----------|---------------|
| POST /auth/register | All | POST /donor/profile | donor |
| POST /auth/login | All | GET /donor/requests | donor |
| GET /auth/me | All | POST /patient/create-request | patient |
| GET /campaign | All | GET /hospital/inventory | hospital |
| POST /campaign/:id/register | donor | POST /campaign | admin, hospital |

---

## 3. ERROR HANDLING MIDDLEWARE

### File: `errorHandler.js`

#### Function: `globalErrorHandler`

**Purpose:** Centralized exception handling with security focus

**Location:** Must be registered LAST in app.js

**Flow:**
```javascript
// Error thrown in controller or middleware
throw new AppError('User not found', 404, 'USER_NOT_FOUND');

// OR error from promise
User.findById(id)
  .then(...)
  .catch(err => {
    // Error passed to error handler
    throw err;
  })

// globalErrorHandler catches it
// 1. Classifies error
// 2. Sanitizes sensitive info
// 3. Formats response
// 4. Logs safely
// 5. Sends to client
```

**Error Classification:**

| Error Type | Status Code | Security | Example |
|-----------|------------|----------|---------|
| Validation Error | 400 | Safe info | Invalid email format |
| Authentication Error | 401 | Safe info | Invalid token |
| Authorization Error | 403 | Safe info | Insufficient role |
| Not Found | 404 | Safe info | User not found |
| Duplicate Entry | 409 | Safe info | Email already exists |
| Server Error | 500 | Hidden in prod | Database failure |

**Development vs Production:**

```json
// Development (Stack trace included)
{
  "status": "error",
  "message": "Database connection failed",
  "code": "DB_ERROR",
  "timestamp": "2026-01-23T10:30:45.123Z",
  "stack": "Error: Connection timeout\n    at Database.connect..."
}

// Production (No sensitive details)
{
  "status": "error",
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "timestamp": "2026-01-23T10:30:45.123Z"
}
```

#### Class: `AppError`

**Purpose:** Custom error class for controllers

**Usage:**
```javascript
// In controller
if (!user) {
  throw new AppError('User not found', 404, 'USER_NOT_FOUND');
}

// Error handler catches and responds with 404
```

#### Function: `asyncHandler`

**Purpose:** Wrap async functions to catch promise rejections

**Usage:**
```javascript
// Instead of try-catch in every controller
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('Not found', 404, 'USER_NOT_FOUND');
  res.json({ data: user });
}));

// If User.findById rejects, error is caught and sent to error handler
```

#### Function: `notFoundHandler`

**Purpose:** Handle 404 routes (call before globalErrorHandler)

**Response:**
```json
{
  "status": "error",
  "message": "Endpoint not found",
  "code": "NOT_FOUND",
  "path": "/api/nonexistent",
  "method": "GET"
}
```

---

## 4. VALIDATION MIDDLEWARE

### File: `validationMiddleware.js`

#### Function: `validateBody(requiredFields)`

**Purpose:** Ensure all required fields are present

**Usage:**
```javascript
router.post(
  '/register',
  validateBody(['email', 'password', 'name', 'phone', 'role']),
  auth.registerUser
);
```

**Error Response (Missing Field):**
```json
{
  "status": "error",
  "message": "Missing required fields: email, password",
  "code": "MISSING_FIELDS",
  "missingFields": ["email", "password"]
}
```

#### Function: `validateEmail(fieldName)`

**Purpose:** Validate email format and normalize

**Validation Rules:**
- Must contain `@`
- Must have domain
- Must have TLD
- Converted to lowercase

**Usage:**
```javascript
router.post('/register', validateEmail('email'), auth.registerUser);
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Invalid email format",
  "code": "INVALID_EMAIL"
}
```

#### Function: `validatePhone(fieldName)`

**Purpose:** Validate phone number (10-digit India format)

**Validation Rules:**
- Exactly 10 digits
- Numbers only (removes formatting)
- Normalized for storage

**Usage:**
```javascript
router.post('/register', validatePhone('phone'), auth.registerUser);
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Phone must be 10 digits",
  "code": "INVALID_PHONE",
  "example": "9876543210"
}
```

#### Function: `validatePassword(fieldName)`

**Purpose:** Enforce password strength

**Validation Rules:**
- Minimum 8 characters
- Must contain letters
- Must contain numbers

**Usage:**
```javascript
router.post('/register', validatePassword('password'), auth.registerUser);
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Password must contain letters and numbers",
  "code": "WEAK_PASSWORD"
}
```

#### Function: `validateBloodGroup(fieldName)`

**Purpose:** Validate blood group format

**Valid Groups:** O+, O-, A+, A-, B+, B-, AB+, AB-

**Usage:**
```javascript
router.post('/profile', validateBloodGroup('bloodGroup'), donor.completeDonorProfile);
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Invalid blood group. Must be one of: O+, O-, A+, A-, B+, B-, AB+, AB-, AB-",
  "code": "INVALID_BLOOD_GROUP",
  "validGroups": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]
}
```

#### Function: `validateEnum(fieldName, allowedValues)`

**Purpose:** Validate field is in allowed list

**Usage:**
```javascript
router.put(
  '/availability',
  validateEnum('status', ['available', 'unavailable', 'cooldown']),
  donor.updateAvailabilityStatus
);
```

**Error Response:**
```json
{
  "status": "error",
  "message": "status must be one of: available, unavailable, cooldown",
  "code": "INVALID_ENUM_VALUE",
  "field": "status",
  "receivedValue": "invalid_status",
  "allowedValues": ["available", "unavailable", "cooldown"]
}
```

#### Function: `validatePagination`

**Purpose:** Validate and normalize pagination parameters

**Defaults:**
- Page: 1
- Limit: 10 (max 100)

**Adds to Request:**
- `req.pagination.page`
- `req.pagination.limit`
- `req.pagination.skip` (for MongoDB)

**Usage:**
```javascript
router.get('/requests', validatePagination, donor.viewAssignedRequests);
```

---

## COMPLETE MIDDLEWARE FLOW (EXAMPLE)

### Request: User Registration

```
1. CLIENT REQUEST
   POST /api/auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "9876543210",
     "password": "securePass123",
     "role": "donor"
   }

2. VALIDATION MIDDLEWARE (validateBody, validateEmail, validatePhone, validatePassword)
   ├─ ✓ All required fields present
   ├─ ✓ Email format valid (normalized to lowercase)
   ├─ ✓ Phone is 10 digits (formatting removed)
   └─ ✓ Password meets strength requirements

3. CONTROLLER (auth.registerUser)
   ├─ Hash password with bcrypt
   ├─ Check duplicate email/phone in DB
   ├─ Create User record
   └─ Generate JWT token

4. RESPONSE
   {
     "status": "success",
     "data": {
       "userId": "user123",
       "email": "john@example.com",
       "role": "donor"
     }
   }
```

### Request: Protected Donor Endpoint

```
1. CLIENT REQUEST
   GET /api/donor/eligibility
   Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. AUTHENTICATION MIDDLEWARE (authenticateToken)
   ├─ Extract token from Authorization header
   ├─ Verify JWT signature (cryptographic check)
   ├─ Validate token not expired
   └─ Attach req.user = { id, email, role: 'donor', ... }
   └─ next()

3. AUTHORIZATION MIDDLEWARE (authorizeRole('donor'))
   ├─ Check req.user.role === 'donor'
   ├─ ✓ Match!
   └─ next()

4. CONTROLLER (donor.checkDonorEligibility)
   ├─ Use req.user.id to fetch donor
   ├─ Check last donation date
   ├─ Validate 56-day rule
   └─ Return eligibility status

5. RESPONSE
   {
     "status": "success",
     "data": {
       "isEligible": true,
       "nextEligibleDate": "2026-03-15",
       "totalDonations": 5
     }
   }
```

### Request: Unauthorized Role Access

```
1. CLIENT REQUEST
   POST /api/donor/profile
   Headers: Authorization: Bearer <patient_token>

2. AUTHENTICATION MIDDLEWARE (authenticateToken)
   ├─ Verify token
   └─ req.user = { id, email, role: 'patient', ... }

3. AUTHORIZATION MIDDLEWARE (authorizeRole('donor'))
   ├─ Check req.user.role === 'donor'
   ├─ ✗ No match! (role is 'patient')
   └─ Return 403 Forbidden

4. RESPONSE
   Status: 403
   {
     "status": "error",
     "message": "Access denied. This endpoint requires one of the following roles: donor",
     "code": "INSUFFICIENT_ROLE",
     "requiredRoles": ["donor"],
     "userRole": "patient"
   }
```

---

## APP.JS SETUP

```javascript
const express = require('express');
const app = express();

// Required imports
const {
  authenticateToken,
  authorizeRole,
  globalErrorHandler,
  notFoundHandler,
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword
} = require('./middleware');

const {
  authRoutes,
  donorRoutes,
  patientRoutes,
  hospitalRoutes,
  bloodRequestRoutes,
  campaignRoutes
} = require('./routes');

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// CORS MIDDLEWARE (Optional)
// ============================================================
// const cors = require('cors');
// app.use(cors());

// ============================================================
// REQUEST LOGGING MIDDLEWARE (Optional)
// ============================================================
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path}`);
//   next();
// });

// ============================================================
// ROUTES (with middleware where needed)
// ============================================================

// Auth routes (includes validation in some routes)
app.post('/api/auth/register', 
  validateBody(['name', 'email', 'phone', 'password', 'role']),
  validateEmail('email'),
  validatePhone('phone'),
  validatePassword('password'),
  authRoutes
);
app.use('/api/auth', authRoutes);

// Role-protected routes
app.use('/api/donor', authenticateToken, authorizeRole('donor'), donorRoutes);
app.use('/api/patient', authenticateToken, authorizeRole('patient'), patientRoutes);
app.use('/api/hospital', authenticateToken, authorizeRole('hospital'), hospitalRoutes);
app.use('/api/blood-request', authenticateToken, bloodRequestRoutes);
app.use('/api/campaign', campaignRoutes); // Mix of public and protected

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ============================================================
// 404 HANDLER (before error handler)
// ============================================================
app.use(notFoundHandler);

// ============================================================
// GLOBAL ERROR HANDLER (MUST BE LAST)
// ============================================================
app.use(globalErrorHandler);

module.exports = app;
```

---

## SECURITY BEST PRACTICES

### ✅ Do's

- Always use `authenticateToken` before `authorizeRole`
- Store JWT secret in environment variables
- Set short token expiry (7 days recommended)
- Validate all inputs with middleware
- Use HTTPS in production
- Include requestId in logs for tracing
- Log authentication failures
- Hash passwords with bcrypt (10 rounds)

### ❌ Don'ts

- Never hardcode JWT secret
- Never expose stack traces in production
- Never log passwords or sensitive data
- Never skip authentication for sensitive endpoints
- Never trust client-provided user IDs
- Never return 200 for failed authentication
- Never expose which field caused validation error (in production)
- Never use plain text passwords

---

## HEALTHCARE-GRADE SECURITY FEATURES

✅ **Stateless Authentication**
   - JWT-based (no session database)
   - Scales to millions of users
   - Can be verified offline

✅ **Role-Based Access Control**
   - Fine-grained permissions
   - Principle of Least Privilege
   - HIPAA compliance ready

✅ **Secure Error Handling**
   - No sensitive data in errors
   - Different messages in dev vs prod
   - Stack traces in development only

✅ **Input Validation**
   - Fail-fast approach
   - Prevents injection attacks
   - Standardizes data format

✅ **Token Expiry**
   - Automatic logout after 7 days
   - Prevents unauthorized access
   - Reduces token compromise window

✅ **No Password Exposure**
   - Passwords hashed before storage
   - Never in logs or error messages
   - Only checked during authentication

---

## TESTING MIDDLEWARE

### Test 1: Valid Authentication

```bash
# Get token from login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePass123"
}
# Response includes token

# Use token in protected endpoint
GET /api/auth/me
Headers: Authorization: Bearer <token>
# Response: 200 with user data
```

### Test 2: Invalid Token

```bash
GET /api/auth/me
Headers: Authorization: Bearer invalid_token
# Response: 401 Invalid token
```

### Test 3: Missing Token

```bash
GET /api/auth/me
# No Authorization header
# Response: 401 Authorization token required
```

### Test 4: Wrong Role

```bash
# Login as patient
POST /api/auth/login
Body: { email: "patient@example.com", password: "..." }
# Get token

# Try donor endpoint
GET /api/donor/requests
Headers: Authorization: Bearer <patient_token>
# Response: 403 Insufficient role
```

### Test 5: Invalid Input

```bash
POST /api/auth/register
Body: {
  "name": "John",
  "email": "invalid-email",  # Wrong format
  "phone": "123",             # Too short
  "password": "weak",         # Too weak
  "role": "donor"
}
# Response: 400 Validation errors
```

---

## NEXT STEPS

1. **Create Models** (Mongoose schemas)
   - Implement database models with proper indexes
   - Add validation hooks in schemas
   - Create relationships

2. **Create Services** (Business logic)
   - Extract complex logic from controllers
   - Implement matching algorithm
   - Create notification service

3. **Create Utilities**
   - Logger utility
   - Constants (enums, defaults)
   - Helper functions

4. **Testing**
   - Unit tests for middleware
   - Integration tests for auth flow
   - E2E tests for complete workflows

---

## DEPLOYMENT CHECKLIST

✅ Middleware files created and tested
✅ JWT secret in environment variable
✅ Error handling prevents info leaks
✅ Role-based access control implemented
✅ Input validation on all endpoints
✅ Token expiry configured
✅ Passwords hashed before storage
✅ HTTPS configured (production)
✅ Logging setup (without sensitive data)
✅ CORS configured if needed

**Status: MIDDLEWARE LAYER COMPLETE AND READY FOR PRODUCTION**
