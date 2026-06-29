import express from 'express';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { isValidIndianMobile, normalizeIndianMobile } from '../utils/phone.js';
import { sendVerificationEmail } from '../services/notificationService.js';

const router = express.Router();
const memoryUsers = [];
const memoryHospitals = [];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const toAuthResponse = (entity) => ({
  id: entity._id,
  name: entity.name || entity.hospitalName,
  email: entity.email,
  role: entity.role,
  bloodType: entity.bloodType,
  location: entity.location,
  contactNumber: entity.contactNumber || entity.phone,
  verified: entity.verified ?? true,
});

const buildAuthResponse = toAuthResponse;

const memoryCollections = {
  hospital: memoryHospitals,
  donor: memoryUsers,
  requestor: memoryUsers,
};

const getMemoryAccountByEmail = (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  return memoryHospitals.find((entry) => entry.email === normalizedEmail)
    || memoryUsers.find((entry) => entry.email === normalizedEmail)
    || null;
};

const persistMemoryAccount = (account) => {
  const collection = memoryCollections[account.role] || memoryUsers;
  collection.push(account);
  return account;
};

const createMemoryAccount = async ({ name, hospitalName, email, password, role, bloodType, phone, location, contactNumber }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? normalizeIndianMobile(phone) || phone : undefined;
  const normalizedContact = contactNumber ? normalizeIndianMobile(contactNumber) || contactNumber : undefined;
  const account = {
    _id: new mongoose.Types.ObjectId(),
    name,
    hospitalName,
    email: normalizedEmail,
    password: hashedPassword,
    role,
    bloodType,
    phone: normalizedPhone,
    contactNumber: normalizedContact,
    location,
    verified: role === 'hospital',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  persistMemoryAccount(account);
  return account;
};

// Signup Route
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['donor', 'requestor', 'hospital']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    try {
      console.log('POST /api/auth/signup hit');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name, email, password, role, bloodType, phone, location, hospitalName, contactNumber
      } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      if (role === 'hospital') {
        if (!hospitalName?.trim()) return res.status(400).json({ message: 'Hospital name is required' });
        if (!location?.trim()) return res.status(400).json({ message: 'Location is required' });
        if (!contactNumber?.trim()) return res.status(400).json({ message: 'Contact number is required' });
        if (!isValidIndianMobile(contactNumber)) return res.status(400).json({ message: 'Please enter a valid Indian mobile number.' });
      } else {
        if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
        if (!phone?.trim()) return res.status(400).json({ message: 'Phone number is required' });
        if (!isValidIndianMobile(phone)) return res.status(400).json({ message: 'Please enter a valid Indian mobile number.' });
      }

      let phoneVerified = false;


      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      if (!isDatabaseReady()) {
        const existingMemoryAccount = getMemoryAccountByEmail(normalizedEmail);
        if (existingMemoryAccount) return res.status(400).json({ message: 'User already exists' });

        const account = await createMemoryAccount({
          name, hospitalName, email: normalizedEmail, password, role, bloodType, phone, location, contactNumber,
        });
        
        account.emailOTP = otp;
        account.emailOTPExpires = otpExpires;
        account.emailVerified = false;
        account.phoneVerified = phoneVerified;

        try {
          await sendVerificationEmail(normalizedEmail, otp);
          return res.status(201).json({ message: 'Verification OTP sent to email', requireOTP: true });
        } catch (emailError) {
          console.error('Email send failed, auto-verifying memory account:', emailError.message);
          account.emailVerified = true;
          account.emailOTP = null;
          account.emailOTPExpires = null;
          const token = jwt.sign({ userId: account._id, role: account.role }, JWT_SECRET, { expiresIn: '7d' });
          return res.status(201).json({ message: 'Email skipped (SMTP error), account auto-verified', token, user: toAuthResponse(account), requireOTP: false });
        }
      }

      const [existingUser, existingHospital] = await Promise.all([
        User.findOne({ email: normalizedEmail }),
        Hospital.findOne({ email: normalizedEmail }),
      ]);

      if (existingUser || existingHospital) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (role === 'hospital') {
        const hospital = new Hospital({
          hospitalName: hospitalName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          location: location.trim(),
          contactNumber: normalizeIndianMobile(contactNumber) || contactNumber,
          role: 'hospital',
          emailOTP: otp,
          emailOTPExpires: otpExpires,
          emailVerified: false,
          phoneVerified: phoneVerified,
        });
        await hospital.save();
        
        try {
          await sendVerificationEmail(normalizedEmail, otp);
          return res.status(201).json({ message: 'Verification OTP sent to email', requireOTP: true });
        } catch (emailError) {
          console.error('Email send failed, auto-verifying hospital:', emailError.message);
          hospital.emailVerified = true;
          hospital.emailOTP = undefined;
          hospital.emailOTPExpires = undefined;
          await hospital.save();
          const token = jwt.sign({ userId: hospital._id, role: hospital.role }, JWT_SECRET, { expiresIn: '7d' });
          return res.status(201).json({ message: 'Email skipped (SMTP error), account auto-verified', token, user: buildAuthResponse(hospital), requireOTP: false });
        }
      }

      const normalizedPhone = normalizeIndianMobile(phone) || phone;
      const user = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        bloodType,
        phone: normalizedPhone,
        location,
        emailOTP: otp,
        emailOTPExpires: otpExpires,
        emailVerified: false,
        phoneVerified: phoneVerified,
      });

      await user.save();
      
      try {
        await sendVerificationEmail(normalizedEmail, otp);
        return res.status(201).json({ message: 'Verification OTP sent to email', requireOTP: true });
      } catch (emailError) {
        console.error('Email send failed, auto-verifying user:', emailError.message);
        user.emailVerified = true;
        user.emailOTP = undefined;
        user.emailOTPExpires = undefined;
        await user.save();
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ message: 'Email skipped (SMTP error), account auto-verified', token, user: buildAuthResponse(user), requireOTP: false });
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ message: `${field} already exists` });
      }
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: 'Validation error', errors: messages });
      }
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Verify Email OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const normalizedEmail = email.trim().toLowerCase();

    if (!isDatabaseReady()) {
      const account = getMemoryAccountByEmail(normalizedEmail);
      if (!account || account.emailOTP !== otp) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      if (new Date() > account.emailOTPExpires) {
        return res.status(400).json({ message: 'OTP has expired' });
      }
      account.emailVerified = true;
      account.emailOTP = null;
      account.emailOTPExpires = null;
      const token = jwt.sign({ userId: account._id, role: account.role }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ message: 'Email verified successfully', token, user: toAuthResponse(account) });
    }

    const [hospital, user] = await Promise.all([
      Hospital.findOne({ email: normalizedEmail }),
      User.findOne({ email: normalizedEmail }),
    ]);

    const account = hospital || user;
    if (!account) return res.status(404).json({ message: 'User not found' });

    if (account.emailOTP !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > account.emailOTPExpires) return res.status(400).json({ message: 'OTP has expired' });

    account.emailVerified = true;
    account.emailOTP = undefined;
    account.emailOTPExpires = undefined;
    await account.save();

    const token = jwt.sign({ userId: account._id, role: account.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ message: 'Email verified successfully', token, user: buildAuthResponse(account) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login Route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      console.log('POST /api/auth/login hit');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Login validation failed');
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const normalizedEmail = email.trim().toLowerCase();

      if (!isDatabaseReady()) {
        const account = getMemoryAccountByEmail(normalizedEmail);

        if (!account) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, account.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: account._id, role: account.role }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
          message: 'Login successful',
          token,
          user: toAuthResponse(account),
        });
      }

      console.log(`Login DB name: ${mongoose.connection.name}`);
      console.log(`Login collection: ${User.collection.collectionName}`);
      console.log(`Login query email: ${normalizedEmail}`);

      const [hospital, user] = await Promise.all([
        Hospital.findOne({ email: normalizedEmail }).select('+password'),
        User.findOne({ email: normalizedEmail }).select('+password'),
      ]);

      const account = hospital || user;
      console.log(`Login query result: ${account ? `found user ${account._id}` : 'not found'}`);
      if (!account) {
        console.log(`Login failed: user not found for ${normalizedEmail}`);
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        console.log(`Login failed: invalid password for ${normalizedEmail}`);
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      console.log(`Login success: ${account._id}`);

      // Create JWT token with userId and role
      const token = jwt.sign({ userId: account._id, role: account.role }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        token,
        user: buildAuthResponse(account),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get User Profile
router.get('/profile/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const account = [...memoryUsers, ...memoryHospitals].find((entry) => String(entry._id) === req.params.id);

      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json(toAuthResponse(account));
    }

    const [hospital, user] = await Promise.all([
      Hospital.findById(req.params.id),
      User.findById(req.params.id),
    ]);

    const account = hospital || user;
    if (!account) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(toAuthResponse(account));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User Profile
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, phone, location, bloodType, hospitalName, contactNumber } = req.body;
    // Validate phone if provided
    if ((phone && !isValidIndianMobile(phone)) || (contactNumber && !isValidIndianMobile(contactNumber))) {
      return res.status(400).json({ message: 'Please enter a valid Indian mobile number.' });
    }

    if (!isDatabaseReady()) {
      const account = [...memoryUsers, ...memoryHospitals].find((entry) => String(entry._id) === req.params.id);

      if (!account) {
        return res.status(404).json({ message: 'User not found' });
      }

      account.name = name ?? account.name;
      account.hospitalName = hospitalName ?? account.hospitalName;
      account.phone = phone ? normalizeIndianMobile(phone) || phone : account.phone;
      account.contactNumber = contactNumber ? normalizeIndianMobile(contactNumber) || contactNumber : account.contactNumber;
      account.location = location ?? account.location;
      account.bloodType = bloodType ?? account.bloodType;
      account.updatedAt = new Date();

      return res.json({ message: 'Profile updated', user: toAuthResponse(account) });
    }

    const hospital = await Hospital.findById(req.params.id);
    if (hospital) {
      const updatedHospital = await Hospital.findByIdAndUpdate(
        req.params.id,
        {
          hospitalName: hospitalName ?? hospital.hospitalName,
          contactNumber: contactNumber ? normalizeIndianMobile(contactNumber) || contactNumber : hospital.contactNumber,
          location: location ?? hospital.location,
          updatedAt: Date.now(),
        },
        { new: true }
      );

      return res.json({ message: 'Profile updated', user: toAuthResponse(updatedHospital) });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone: phone ? normalizeIndianMobile(phone) || phone : phone, location, bloodType, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated', user: toAuthResponse(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Hospital Profile
router.get('/hospital/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const hospital = memoryHospitals.find((entry) => String(entry._id) === req.params.id);

      if (!hospital) {
        return res.status(404).json({ message: 'Hospital not found' });
      }

      return res.json(toAuthResponse(hospital));
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json(toAuthResponse(hospital));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Hospital Profile
router.put('/hospital/:id', async (req, res) => {
  try {
    const { hospitalName, contactNumber, location } = req.body;

    // Validate contact number if provided
    if (contactNumber && !isValidIndianMobile(contactNumber)) {
      return res.status(400).json({ message: 'Please enter a valid Indian mobile number.' });
    }

    if (!isDatabaseReady()) {
      const hospital = memoryHospitals.find((entry) => String(entry._id) === req.params.id);

      if (!hospital) {
        return res.status(404).json({ message: 'Hospital not found' });
      }

      hospital.hospitalName = hospitalName ?? hospital.hospitalName;
      hospital.contactNumber = contactNumber ? normalizeIndianMobile(contactNumber) || contactNumber : hospital.contactNumber;
      hospital.location = location ?? hospital.location;
      hospital.updatedAt = new Date();

      return res.json({ message: 'Hospital profile updated', user: toAuthResponse(hospital) });
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        hospitalName: hospitalName ?? undefined,
        contactNumber: contactNumber ? normalizeIndianMobile(contactNumber) || contactNumber : undefined,
        location: location ?? undefined,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: false }
    );

    if (!updatedHospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json({ message: 'Hospital profile updated', user: toAuthResponse(updatedHospital) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Hospital Profile
router.delete('/hospital/:id', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const hospitalIndex = memoryHospitals.findIndex((entry) => String(entry._id) === req.params.id);

      if (hospitalIndex === -1) {
        return res.status(404).json({ message: 'Hospital not found' });
      }

      memoryHospitals.splice(hospitalIndex, 1);
      return res.json({ message: 'Hospital account deleted successfully' });
    }

    const hospital = await Hospital.findByIdAndDelete(req.params.id);

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json({ message: 'Hospital account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register or remove FCM token for push notifications
router.post('/fcm-token', async (req, res) => {
  try {
    const { userId, token, deviceType = 'web', action = 'register' } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: 'userId and token are required' });
    }

    if (!isDatabaseReady()) {
      // In-memory mode: silently accept but can't persist tokens
      console.log(`FCM token ${action} received for user ${userId} (memory mode — not persisted)`);
      return res.json({ message: `FCM token ${action}ed (memory mode)`, persisted: false });
    }

    if (action === 'remove') {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: { token } },
      });
      console.log(`FCM token removed for user ${userId}`);
      return res.json({ message: 'FCM token removed' });
    }

    // Register: avoid duplicate tokens
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingToken = user.fcmTokens?.find((t) => t.token === token);
    if (!existingToken) {
      user.fcmTokens.push({ token, deviceType, createdAt: new Date() });
      await user.save();
      console.log(`FCM token registered for user ${userId}`);
    } else {
      console.log(`FCM token already registered for user ${userId}`);
    }

    res.json({ message: 'FCM token registered' });
  } catch (error) {
    console.error('FCM token error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
