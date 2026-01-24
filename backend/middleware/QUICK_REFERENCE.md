/**
 * MIDDLEWARE QUICK REFERENCE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Fast lookup guide for all middleware functions and usage patterns
 */

# MIDDLEWARE QUICK REFERENCE

## Import All Middleware

```javascript
const {
  // Authentication
  authenticateToken,
  optionalAuthentication,
  
  // Authorization
  authorizeRole,
  
  // Error handling
  globalErrorHandler,
  notFoundHandler,
  AppError,
  asyncHandler,
  
  // Validation
  validateBody,
  validateEmail,
  validatePhone,
  validatePassword,
  validateBloodGroup,
  validateEnum,
  validatePagination
} = require('./middleware');
```

---

## MIDDLEWARE CHEAT SHEET

### 1. Protect Route (Require Authentication + Specific Role)

```javascript
router.get(
  '/profile',
  authenticateToken,
  authorizeRole('donor'),
  donor.completeDonorProfile
);
```

### 2. Public Route with Optional Authentication

```javascript
router.get(
  '/campaigns',
  optionalAuthentication,
  campaign.viewAllCampaigns
);
```

### 3. Multiple Allowed Roles

```javascript
router.post(
  '/create-campaign',
  authenticateToken,
  authorizeRole('admin', 'hospital'),
  campaign.createCampaign
);
```

### 4. Input Validation Chain

```javascript
router.post(
  '/register',
  validateBody(['email', 'password', 'name', 'phone', 'role']),
  validateEmail('email'),
  validatePhone('phone'),
  validatePassword('password'),
  auth.registerUser
);
```

### 5. Validate Enum Field

```javascript
router.put(
  '/availability',
  authenticateToken,
  authorizeRole('donor'),
  validateEnum('status', ['available', 'unavailable', 'cooldown']),
  donor.updateAvailabilityStatus
);
```

### 6. Validate Blood Group

```javascript
router.post(
  '/profile',
  authenticateToken,
  authorizeRole('donor'),
  validateBloodGroup('bloodGroup'),
  donor.completeDonorProfile
);
```

### 7. Pagination Support

```javascript
router.get(
  '/requests',
  authenticateToken,
  authorizeRole('donor'),
  validatePagination,
  donor.viewAssignedRequests
);
```

### 8. Custom Error Handling in Controller

```javascript
// In controller
exports.someFunction = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  
  res.json({ data: user });
});
```

---

## MIDDLEWARE SIGNATURES

### Authentication

```javascript
authenticateToken(req, res, next)
// Requires: Authorization: Bearer <token>
// Attaches: req.user = { id, email, role, iat, exp }
// On failure: 401 Unauthorized

optionalAuthentication(req, res, next)
// Optional token
// Attaches: req.user (if valid) or req.user = null
// Never fails
```

### Authorization

```javascript
authorizeRole('donor')
authorizeRole('admin', 'hospital')
// Requires: authenticateToken to run first
// Checks: req.user.role is in allowed list
// On failure: 403 Forbidden
```

### Error Handling

```javascript
globalErrorHandler(err, req, res, next)
// Must be LAST middleware in app.js
// Catches all errors and formats response
// Sanitizes sensitive data in production

notFoundHandler(req, res)
// Call before globalErrorHandler
// Returns 404 for unmatched routes
```

### Validation

```javascript
validateBody(['email', 'password'])
// Checks all fields are present in req.body

validateEmail('email')
// Checks valid email format
// Normalizes to lowercase

validatePhone('phone')
// Checks 10 digits
// Removes formatting

validatePassword('password')
// Checks min 8 chars
// Requires letters and numbers

validateBloodGroup('bloodGroup')
// Checks valid blood group (O+, O-, etc)

validateEnum('status', ['active', 'inactive'])
// Checks value is in allowed list

validatePagination
// Normalizes page and limit
// Adds: req.pagination = { page, limit, skip }
```

---

## COMMON ROUTE PATTERNS

### Pattern 1: Donor-Only Endpoint

```javascript
router.post(
  '/profile',
  authenticateToken,
  authorizeRole('donor'),
  validateBody(['bloodGroup', 'healthDeclaration']),
  validateBloodGroup('bloodGroup'),
  donor.completeDonorProfile
);
```

### Pattern 2: Hospital-Only Endpoint

```javascript
router.post(
  '/approve-request',
  authenticateToken,
  authorizeRole('hospital'),
  validateBody(['requestId']),
  hospital.approveBloodRequest
);
```

### Pattern 3: Public Endpoint

```javascript
router.get(
  '/campaigns',
  validatePagination,
  campaign.viewAllCampaigns
);
```

### Pattern 4: Shared Endpoint (Multiple Roles)

```javascript
router.post(
  '/blood-request',
  authenticateToken,
  authorizeRole('patient', 'hospital'),
  validateBody(['bloodGroup', 'units']),
  validateBloodGroup('bloodGroup'),
  bloodRequest.createBloodRequest
);
```

### Pattern 5: List with Pagination

```javascript
router.get(
  '/requests',
  authenticateToken,
  authorizeRole('donor', 'patient'),
  validatePagination,
  request.viewRequests
);
// req.pagination.page, req.pagination.limit available in controller
```

---

## ERROR RESPONSES

### 400 Bad Request (Validation)

```json
{
  "status": "error",
  "message": "Invalid email format",
  "code": "INVALID_EMAIL",
  "timestamp": "2026-01-23T10:30:45.123Z",
  "path": "/api/auth/register",
  "method": "POST"
}
```

### 401 Unauthorized (Authentication)

```json
{
  "status": "error",
  "message": "Authorization token required",
  "code": "MISSING_TOKEN",
  "timestamp": "2026-01-23T10:30:45.123Z",
  "path": "/api/donor/profile",
  "method": "GET"
}
```

### 403 Forbidden (Authorization)

```json
{
  "status": "error",
  "message": "Access denied. This endpoint requires one of the following roles: donor",
  "code": "INSUFFICIENT_ROLE",
  "requiredRoles": ["donor"],
  "userRole": "patient",
  "timestamp": "2026-01-23T10:30:45.123Z",
  "path": "/api/donor/profile",
  "method": "POST"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Endpoint not found",
  "code": "NOT_FOUND",
  "path": "/api/nonexistent",
  "method": "GET",
  "timestamp": "2026-01-23T10:30:45.123Z"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "timestamp": "2026-01-23T10:30:45.123Z",
  "path": "/api/auth/login",
  "method": "POST"
}
```

---

## REQUEST OBJECT AFTER AUTHENTICATION

```javascript
// After authenticateToken middleware
req.user = {
  id: "user123",
  email: "john@example.com",
  role: "donor",
  iat: 1705424000,        // Issued at (seconds)
  exp: 1706029000         // Expires at (seconds)
}

// After validatePagination middleware
req.pagination = {
  page: 1,
  limit: 10,
  skip: 0
}
```

---

## APP.JS SKELETON

```javascript
const express = require('express');
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

const app = express();

// Parsing
app.use(express.json());

// Routes (example)
app.post('/api/auth/register',
  validateBody(['email', 'password', 'name', 'phone', 'role']),
  validateEmail('email'),
  validatePhone('phone'),
  validatePassword('password'),
  authRoutes
);

app.use('/api/donor',
  authenticateToken,
  authorizeRole('donor'),
  donorRoutes
);

// 404 (before error handler)
app.use(notFoundHandler);

// Error handler (MUST BE LAST)
app.use(globalErrorHandler);

module.exports = app;
```

---

## MIDDLEWARE EXECUTION ORDER

```
Request comes in
    ↓
1. express.json() - Parse body
    ↓
2. validateBody() - Check required fields
    ↓
3. validateEmail() - Check email format
    ↓
4. validatePhone() - Check phone format
    ↓
5. validatePassword() - Check password strength
    ↓
6. authenticateToken - Verify JWT
    ↓
7. authorizeRole() - Check role
    ↓
8. validateEnum() - Check enum value
    ↓
9. validateBloodGroup() - Check blood group
    ↓
10. validatePagination - Normalize pagination
    ↓
11. Controller Function (business logic)
    ↓
12. Response sent
    ↓
    If error:
    ├─ globalErrorHandler catches it
    ├─ Formats response
    ├─ Removes sensitive data
    └─ Sends to client
```

---

## SECURITY CHECKLIST

- ✅ All private endpoints have `authenticateToken`
- ✅ Role-based endpoints have `authorizeRole`
- ✅ Input validation before controller
- ✅ JWT secret in environment variable
- ✅ Passwords hashed (bcrypt in controller)
- ✅ Error responses don't leak sensitive data
- ✅ Token expiry configured
- ✅ notFoundHandler before globalErrorHandler
- ✅ globalErrorHandler is last middleware
- ✅ No middleware order mistakes

---

## COMMON MISTAKES TO AVOID

❌ **Don't:** Skip authenticateToken for private endpoints
```javascript
// BAD - No authentication!
router.get('/donor/requests', donor.viewAssignedRequests);
```

✅ **Do:** Always authenticate sensitive endpoints
```javascript
// GOOD
router.get('/donor/requests', authenticateToken, authorizeRole('donor'), donor.viewAssignedRequests);
```

---

❌ **Don't:** Use authorizeRole without authenticateToken
```javascript
// BAD - authenticateToken not called first!
router.post('/profile', authorizeRole('donor'), donor.completeDonorProfile);
```

✅ **Do:** Always authenticate before authorize
```javascript
// GOOD
router.post('/profile', authenticateToken, authorizeRole('donor'), donor.completeDonorProfile);
```

---

❌ **Don't:** Skip input validation
```javascript
// BAD - Accepts any input
router.post('/register', auth.registerUser);
```

✅ **Do:** Validate all inputs
```javascript
// GOOD
router.post('/register',
  validateBody(['email', 'password']),
  validateEmail('email'),
  validatePassword('password'),
  auth.registerUser
);
```

---

❌ **Don't:** Forget globalErrorHandler
```javascript
// BAD - Unhandled errors crash server
app.use(routes);
```

✅ **Do:** Always add error handler last
```javascript
// GOOD
app.use(routes);
app.use(notFoundHandler);
app.use(globalErrorHandler);
```

---

## STATUS CODES QUICK REFERENCE

| Code | Meaning | When to Use |
|------|---------|------------|
| 200 | OK | GET/PUT success |
| 201 | Created | POST creates new resource |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Wrong role/permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Unexpected error |

---

## HEALTHCARE-GRADE SECURITY SUMMARY

✅ Stateless JWT authentication (scales infinitely)
✅ Role-based access control (HIPAA-ready)
✅ Healthcare-grade error handling (no info leaks)
✅ Input validation (prevents injection attacks)
✅ Token expiry (automatic logout)
✅ Password hashing (bcrypt 10 rounds)
✅ Audit logging (traceability)
✅ Environment-based secrets (security)

**All middleware production-ready and secure.**
