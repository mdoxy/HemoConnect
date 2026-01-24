/**
 * ROLE-BASED AUTHORIZATION MIDDLEWARE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Enforces healthcare-grade access control
 * Verifies user role matches endpoint requirements
 * Prevents cross-role data access
 */

/**
 * Role-based authorization middleware
 * 
 * Usage: authorizeRole('donor', 'patient')
 * 
 * Checks if authenticated user's role is in allowed list
 * Requires authenticateToken middleware to run first
 * 
 * @param {...string} allowedRoles - Variable number of allowed role strings
 * @returns {Function} Middleware function
 */
exports.authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is attached (authenticateToken should run first)
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Get user's role from authenticated token
      const userRole = req.user.role;

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. This endpoint requires one of the following roles: ${allowedRoles.join(', ')}`,
          code: 'INSUFFICIENT_ROLE',
          requiredRoles: allowedRoles,
          userRole: userRole // Inform user what role they have
        });
      }

      // User has required role, proceed
      next();

    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Authorization check failed',
        code: 'AUTHZ_ERROR'
      });
    }
  };
};

/**
 * HEALTHCARE-GRADE ROLE SYSTEM
 * 
 * Supported Roles:
 * ├─ donor
 * │  └─ Donates blood, views requests, checks eligibility
 * │
 * ├─ patient
 * │  └─ Creates blood requests, uploads documents, tracks status
 * │
 * ├─ hospital
 * │  └─ Manages donors, approves requests, controls inventory
 * │
 * └─ admin
 *    └─ System-wide management, user verification, campaigns
 */

/**
 * USAGE IN ROUTES
 * 
 * ============ SINGLE ROLE ============
 * router.post(
 *   '/profile',
 *   authenticateToken,
 *   authorizeRole('donor'),
 *   donor.completeDonorProfile
 * );
 * 
 * ============ MULTIPLE ROLES ============
 * router.post(
 *   '/',
 *   authenticateToken,
 *   authorizeRole('admin', 'hospital'),
 *   campaign.createCampaign
 * );
 * 
 * ============ PUBLIC ENDPOINT (NO ROLE CHECK) ============
 * router.get(
 *   '/',
 *   campaign.viewAllCampaigns
 * );
 * 
 * ============ OPTIONAL AUTH (WITH ROLE CHECK IF AUTHENTICATED) ============
 * router.post(
 *   '/:campaignId/register',
 *   authenticateToken,                    // Required
 *   authorizeRole('donor'),               // Checks role
 *   campaign.registerDonorToCampaign
 * );
 */

/**
 * MIDDLEWARE CHAIN EXECUTION ORDER
 * 
 * Request Flow:
 * 
 * 1. HTTP Request arrives
 *    GET /api/donor/profile
 *    Headers: Authorization: Bearer <token>
 * 
 * 2. authenticateToken (from authMiddleware.js)
 *    ├─ Extract and verify JWT
 *    ├─ Attach req.user object
 *    └─ Continue to next middleware
 * 
 * 3. authorizeRole('donor')
 *    ├─ Check if req.user.role === 'donor'
 *    ├─ If yes → next()
 *    └─ If no → return 403 Forbidden
 * 
 * 4. Controller Function
 *    ├─ req.user available (from authenticateToken)
 *    ├─ req.user.role guaranteed to be 'donor' (from authorizeRole)
 *    └─ Execute business logic
 * 
 * 5. Response sent to client
 */

/**
 * ACCESS CONTROL MATRIX
 * 
 * Endpoint                          | donor | patient | hospital | admin |
 * ----------------------------------|-------|---------|----------|-------|
 * POST /auth/register               | ✓     | ✓       | ✓        | ✓     |
 * POST /auth/login                  | ✓     | ✓       | ✓        | ✓     |
 * GET /auth/me                      | ✓     | ✓       | ✓        | ✓     |
 * POST /donor/profile               | ✓     | ✗       | ✗        | ✗     |
 * PUT /donor/availability           | ✓     | ✗       | ✗        | ✗     |
 * POST /patient/create-request      | ✗     | ✓       | ✗        | ✗     |
 * GET /patient/requests             | ✗     | ✓       | ✗        | ✗     |
 * POST /hospital/approve-request    | ✗     | ✗       | ✓        | ✗     |
 * GET /hospital/inventory           | ✗     | ✗       | ✓        | ✗     |
 * POST /campaign                    | ✗     | ✗       | ✓        | ✓     |
 * GET /campaign                     | ✓     | ✓       | ✓        | ✓     |
 * POST /campaign/:id/register       | ✓     | ✗       | ✗        | ✗     |
 * 
 * Key:
 * ✓ = Access allowed
 * ✗ = Access denied (403 Forbidden)
 * 
 * Note: Patient role does NOT have access to donor endpoints and vice versa
 *       This is critical for HIPAA and healthcare-grade data isolation
 */

/**
 * RESPONSE EXAMPLES
 * 
 * ===== SUCCESS (Authorized) =====
 * Status: 200/201
 * Body:
 * {
 *   "status": "success",
 *   "data": { /* endpoint-specific data */ }
 * }
 * 
 * ===== 401 (Not Authenticated) =====
 * Missing authenticateToken middleware
 * 
 * Status: 401
 * Body:
 * {
 *   "status": "error",
 *   "message": "Authentication required",
 *   "code": "NOT_AUTHENTICATED"
 * }
 * 
 * ===== 403 (Insufficient Role) =====
 * User authenticated but role not in allowedRoles
 * 
 * Status: 403
 * Body:
 * {
 *   "status": "error",
 *   "message": "Access denied. This endpoint requires one of the following roles: donor",
 *   "code": "INSUFFICIENT_ROLE",
 *   "requiredRoles": ["donor"],
 *   "userRole": "patient"
 * }
 * 

/**
 * HEALTHCARE-GRADE SECURITY FEATURES
 * 
 * ✅ Role-based access control (RBAC)
 *    - Fine-grained endpoint-level access
 *    - Prevents cross-role data access (critical for HIPAA)
 * 
 * ✅ Stateless authorization
 *    - No database lookups (role in JWT)
 *    - Fast authorization checks
 *    - Scalable to millions of users
 * 
 * ✅ Clear error messages
 *    - Tells user what role is required
 *    - Prevents guessing (doesn't hide requirements)
 *    - HTTP 403 is standard for authorization failures
 * 
 * ✅ Middleware chaining
 *    - authenticate → authorize → controller
 *    - Clear separation of concerns
 *    - Easy to add more middleware (logging, validation)
 * 
 * ✅ No sensitive data exposure
 *    - Passwords never in role checks
 *    - No system internal details leaked
 *    - Only tells user what's required
 * 
 * ✅ Support for multiple roles
 *    - Some endpoints allow multiple roles
 *    - Flexible and extensible design
 *    - Example: admins + hospitals can create campaigns
 */

/**
 * ROLE HIERARCHY (Recommended, Optional)
 * 
 * If implementing role hierarchy:
 * 
 * Admin (super-user)
 *   ├─ Access to admin endpoints
 *   └─ Can perform hospital and donor operations (if needed)
 * 
 * Hospital
 *   ├─ Access to hospital endpoints
 *   └─ Cannot access donor/patient specific endpoints
 * 
 * Patient
 *   ├─ Access to patient endpoints
 *   └─ Cannot access donor/hospital endpoints
 * 
 * Donor
 *   ├─ Access to donor endpoints
 *   └─ Cannot access patient/hospital endpoints
 * 
 * Healthcare Principle:
 *   Each role has minimal permissions (Principle of Least Privilege)
 *   A patient cannot see donor records and vice versa
 *   This is critical for HIPAA compliance
 */

module.exports = {
  authorizeRole
};
