/**
 * AUTH CONTROLLER
 * Handles user authentication, registration, and profile management
 * Supports role-based user creation (donor, patient, hospital, admin)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models - to be imported from models folder
// const User = require('../models/User');
// const Donor = require('../models/Donor');
// const Patient = require('../models/Patient');
// const Hospital = require('../models/Hospital');

/**
 * REGISTER USER - Create new user with role-specific profile
 * Roles: donor | patient | hospital | admin
 */
exports.registerUser = async (req, res) => {
  try {
    // Destructure and validate required fields
    const { name, email, phone, password, role, locationData, additionalData } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, password, role'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone format (India: 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Must be 10 digits'
      });
    }

    // Validate role
    const validRoles = ['donor', 'patient', 'hospital', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: donor, patient, hospital, or admin'
      });
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists (email & phone unique)
    // const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
    // if (existingUser) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'User with this email or phone already exists'
    //   });
    // }

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create base User document
    // const userData = {
    //   name,
    //   email: email.toLowerCase(),
    //   phone,
    //   password: hashedPassword,
    //   role,
    //   location: locationData || null,
    //   isVerified: false,
    //   emailVerified: false,
    //   phoneVerified: false
    // };
    // const newUser = await User.create(userData);

    // Create role-specific profile based on role
    // const profileData = { userId: newUser._id, ...additionalData };
    // let profile;

    // switch (role) {
    //   case 'donor':
    //     profile = await Donor.create(profileData);
    //     break;
    //   case 'patient':
    //     profile = await Patient.create(profileData);
    //     break;
    //   case 'hospital':
    //     profile = await Hospital.create(profileData);
    //     break;
    //   case 'admin':
    //     // Admin has no separate profile table
    //     break;
    //   default:
    //     throw new Error('Invalid role');
    // }

    // Return success response without sensitive data
    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        // userId: newUser._id,
        name,
        email: email.toLowerCase(),
        role,
        isVerified: false,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * LOGIN USER - Authenticate user and return JWT token
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email (case-insensitive)
    // const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    // if (!user) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid email or password'
    //   });
    // }

    // Check if user is active
    // if (!user.isActive) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Your account has been deactivated'
    //   });
    // }

    // Compare password with stored hash
    // const isPasswordMatch = await bcrypt.compare(password, user.password);
    // if (!isPasswordMatch) {
    //   // Increment login attempts for brute force protection
    //   user.loginAttempts = (user.loginAttempts || 0) + 1;
    //   if (user.loginAttempts >= 5) {
    //     user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    //     await user.save();
    //     return res.status(429).json({
    //       success: false,
    //       message: 'Too many login attempts. Account locked for 15 minutes.'
    //     });
    //   }
    //   await user.save();
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Invalid email or password'
    //   });
    // }

    // Check if account is locked
    // if (user.lockUntil && user.lockUntil > new Date()) {
    //   return res.status(429).json({
    //     success: false,
    //     message: 'Account is locked. Try again later.'
    //   });
    // }

    // Reset login attempts on successful login
    // user.loginAttempts = 0;
    // user.lockUntil = null;
    // user.lastLogin = new Date();
    // await user.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const jwtExpiry = process.env.JWT_EXPIRY || '7d';

    // const token = jwt.sign(
    //   {
    //     userId: user._id,
    //     email: user.email,
    //     role: user.role
    //   },
    //   jwtSecret,
    //   { expiresIn: jwtExpiry }
    // );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        // token,
        // user: {
        //   userId: user._id,
        //   name: user.name,
        //   email: user.email,
        //   role: user.role,
        //   isVerified: user.isVerified,
        //   lastLogin: user.lastLogin
        // }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * GET CURRENT USER PROFILE - Return authenticated user's profile
 * Requires valid JWT token in Authorization header
 */
exports.getCurrentUserProfile = async (req, res) => {
  try {
    // Note: User ID should come from JWT middleware (req.user.userId)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please login.'
      });
    }

    // Fetch user by ID
    // const user = await User.findById(userId);
    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'User not found'
    //   });
    // }

    // Fetch role-specific profile
    // let profileData = null;
    // switch (user.role) {
    //   case 'donor':
    //     profileData = await Donor.findOne({ userId });
    //     break;
    //   case 'patient':
    //     profileData = await Patient.findOne({ userId });
    //     break;
    //   case 'hospital':
    //     profileData = await Hospital.findOne({ userId });
    //     break;
    // }

    return res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        // user,
        // roleProfile: profileData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

/**
 * LOGOUT USER - Invalidate token (optional, JWT is stateless)
 * In production, add token to blacklist in Redis
 */
exports.logoutUser = async (req, res) => {
  try {
    // Optional: Add token to blacklist (Redis implementation)
    // const token = req.headers.authorization?.split(' ')[1];
    // if (token) {
    //   await redisClient.setex(`blacklist_${token}`, 86400, 'true'); // 24 hour expiry
    // }

    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

/**
 * VERIFY EMAIL - Confirm user email using verification token
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Find user by verification token
    // const user = await User.findOne({
    //   verificationToken: token,
    //   verificationTokenExpire: { $gt: new Date() }
    // });

    // if (!user) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid or expired verification token'
    //   });
    // }

    // Mark email as verified and clear token
    // user.emailVerified = true;
    // user.isVerified = true;
    // user.verificationToken = null;
    // user.verificationTokenExpire = null;
    // await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

/**
 * FORGOT PASSWORD - Send password reset token to email
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    // const user = await User.findOne({ email: email.toLowerCase() });
    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'User not found'
    //   });
    // }

    // Generate reset token (crypto)
    // const resetToken = crypto.randomBytes(32).toString('hex');
    // user.resetPasswordToken = resetToken;
    // user.resetPasswordExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour expiry
    // await user.save();

    // Send email with reset link (implement email service separately)
    // await sendPasswordResetEmail(user.email, resetToken);

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing password reset',
      error: error.message
    });
  }
};

/**
 * RESET PASSWORD - Update password using reset token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find user by reset token
    // const user = await User.findOne({
    //   resetPasswordToken: token,
    //   resetPasswordExpire: { $gt: new Date() }
    // });

    // if (!user) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid or expired reset token'
    //   });
    // }

    // Hash new password and update
    // user.password = await bcrypt.hash(newPassword, 10);
    // user.resetPasswordToken = null;
    // user.resetPasswordExpire = null;
    // await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};
