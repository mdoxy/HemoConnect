import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import DonorApplication from '../models/Donor.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
});

const uploadDonorFiles = (req, res, next) => {
  upload.fields([
    { name: 'aadhaarFile', maxCount: 1 },
    { name: 'medicalFile', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    console.error('Multer upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  });
};

// POST - Submit donor application
router.post('/apply', verifyToken, uploadDonorFiles, async (req, res) => {
  try {
    console.log('POST /api/donor/apply hit');
    console.log('Request method/path:', req.method, req.originalUrl);
    console.log('Donor apply body:', req.body);
    console.log('Donor apply files:', {
      aadhaarFile: req.files?.aadhaarFile?.[0]?.originalname || null,
      medicalFile: req.files?.medicalFile?.[0]?.originalname || null,
    });

    const { fullName, email, eligibilityAnswers, phone, phoneNumber, bloodGroup, bloodType } = req.body;
    const userId = req.userId;

    console.log('Donor apply auth context:', {
      userId,
      role: req.userRole,
      dbName: DonorApplication.db.name,
    });

    if (!fullName || !email || !eligibilityAnswers) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email, and eligibilityAnswers are required',
      });
    }

    // Validate required files
    if (!req.files?.aadhaarFile || !req.files?.medicalFile) {
      return res.status(400).json({
        success: false,
        message: 'Both Aadhaar and Medical Certificate files are required',
      });
    }

    // Validate eligibility answers
    let answers;
    try {
      answers = typeof eligibilityAnswers === 'string'
        ? JSON.parse(eligibilityAnswers)
        : eligibilityAnswers;
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid eligibility answers format',
      });
    }

    // Check if user already has an application
    const existingApp = await DonorApplication.findOne({ userId });
    if (existingApp) {
      console.log(`Donor apply blocked: existing application for user ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a donor application. Please wait for approval.',
      });
    }

    // Create new application
    const newApplication = new DonorApplication({
      userId,
      fullName,
      email,
      phone: phone || phoneNumber || undefined,
      bloodGroup: bloodGroup || bloodType || undefined,
      eligibilityAnswers: answers,
      aadhaarFilePath: req.files.aadhaarFile[0].path,
      medicalReportFilePath: req.files.medicalFile[0].path,
      status: 'Pending',
      submittedAt: new Date(),
    });

    console.log('Saving donor application document:', newApplication.toObject());
    await newApplication.save();
    console.log(`Donor application saved: ${newApplication._id} for user ${userId}`);
    console.log('Saved donor application document:', newApplication.toObject());

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplication._id,
    });
  } catch (error) {
    console.error('Application submission error:', error);
    console.error('Application submission stack:', error.stack);

    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((item) => item.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit application',
    });
  }
});

// GET - Get donor application status
router.get('/status/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user is checking their own status (donor) or is hospital staff
    if (req.userId !== userId && req.userRole !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const application = await DonorApplication.findOne({ userId })
      .select('-aadhaarFilePath -medicalReportFilePath');

    if (!application) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No application found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch application status',
    });
  }
});

// GET - Get all donor applications (for hospital panel)
router.get('/applications', verifyToken, async (req, res) => {
  try {
    // This route can be protected to allow only hospital role
    // Returning all applications with file paths for preview
    const applications = await DonorApplication.find()
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length,
    });
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch applications',
    });
  }
});

// PUT - Update donor application status (for hospital panel)
router.put('/update-status/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, hospitalRemarks } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const application = await DonorApplication.findByIdAndUpdate(
      applicationId,
      {
        status,
        hospitalRemarks: hospitalRemarks || '',
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update application status',
    });
  }
});

// PUT - Schedule donation (for approved donors)
router.put('/schedule-donation/:applicationId', verifyToken, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { scheduledDate, scheduledTime } = req.body;

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time are required',
      });
    }

    const application = await DonorApplication.findOne({
      _id: applicationId,
      userId: req.userId,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved applications can schedule donations',
      });
    }

    // Update the application with scheduled donation details
    application.scheduledDate = scheduledDate;
    application.scheduledTime = scheduledTime;
    application.scheduledAt = new Date();
    application.updatedAt = new Date();

    await application.save();

    res.status(200).json({
      success: true,
      message: 'Donation scheduled successfully',
      data: application,
    });
  } catch (error) {
    console.error('Schedule donation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule donation',
    });
  }
});

export default router;
