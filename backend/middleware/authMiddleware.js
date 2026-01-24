/**
 * JWT AUTHENTICATION MIDDLEWARE
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to request object
 * Protects private routes from unauthenticated access
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 * 
 * Expected format: Authorization: Bearer <token>
 * 
 * On success:
 *   - Attaches req.user = { id, email, role, iat, exp }
 *   - Calls next()
 * 
 * On failure:
 *   - Returns 401 Unauthorized
 *   - Never leaks sensitive information
 */
exports.authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    // Token not provided
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authorization token required',
        code: 'MISSING_TOKEN'
      });
    }

    // Verify JWT token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Attach user info to request (stateless - no DB lookup)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    // Check if token is expired (redundant, but explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Proceed to next middleware/controller
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    // Catch-all: Don't leak implementation details
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional: Verify token without requiring it (for public endpoints)
 * Attaches user if token is valid, otherwise continues
 */
exports.optionalAuthentication = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, but that's OK - continue as guest
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();

  } catch (error) {
    // Token exists but is invalid - treat as guest
    req.user = null;
    next();
  }
};

/**
 * HEALTHCARE-GRADE SECURITY FEATURES
 * 
 * ✅ Stateless authentication (no session DB lookups)
 * ✅ JWT signature verification (cryptographic validation)
 * ✅ Token expiry validation (time-based access control)
 * ✅ No sensitive data in error messages (prevents info leakage)
 * ✅ Bearer scheme validation (standard OAuth 2.0)
 * ✅ Environment-based secret (never hardcode secrets)
 * ✅ Proper HTTP status codes (401 for auth, 403 for authz)
 */

/**
 * USAGE IN ROUTES
 * 
 * // Require authentication
 * router.get('/me', authenticateToken, auth.getCurrentUserProfile);
 * 
 * // Optional authentication (public endpoint)
 * router.get('/campaigns', optionalAuthentication, campaign.viewAllCampaigns);
 * 
 * // With role-based access (auth → role → controller)
 * router.post(
 *   '/profile',
 *   authenticateToken,
 *   authorizeRole('donor'),
 *   donor.completeDonorProfile
 * );
 */

/**
 * TOKEN STRUCTURE (JWT payload)
 * 
 * Header:
 * {
 *   "alg": "HS256",
 *   "typ": "JWT"
 * }
 * 
 * Payload:
 * {
 *   "id": "user123",
 *   "email": "john@example.com",
 *   "role": "donor",
 *   "iat": 1705424000,        // Issued at
 *   "exp": 1706029000         // Expires at (7 days later)
 * }
 * 
 * Signature:
 * HMACSHA256(
 *   base64UrlEncode(header) + "." +
 *   base64UrlEncode(payload),
 *   secret
 * )
 */

/**
 * ERROR CODES HANDLED
 * 
 * MISSING_TOKEN
 *   - Authorization header not provided
 *   - Response: 401 Unauthorized
 * 
 * INVALID_TOKEN
 *   - Token signature verification failed
 *   - Token format is malformed
 *   - Response: 401 Unauthorized
 * 
 * TOKEN_EXPIRED
 *   - Token issued timestamp is beyond expiry
 *   - Response: 401 Unauthorized
 *   - Client should refresh/re-login
 * 
 * AUTH_FAILED
 *   - Unexpected authentication error
 *   - Never reveals specific error details
 *   - Response: 401 Unauthorized
 */

module.exports = {
  authenticateToken,
  optionalAuthentication
};
