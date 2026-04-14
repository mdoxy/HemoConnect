import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Request from '../models/Request.js';
import BloodRequest from '../models/BloodRequest.js';
import Requestor from '../models/Requestor.js';
import User from '../models/User.js';

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

// POST - Submit blood request
const handleCreateRequest = async (req, res) => {
  try {
    console.log('Blood request received:', {
      body: req.body,
      files: req.files ? Object.keys(req.files) : 'none',
    });

    const {
      userId,
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      hospitalId,
      requiredDate,
      reason,
      requesterName,
      requesterEmail,
      requesterPhone,
    } = req.body;

    // Validate required fields
    if (!patientName || !bloodGroup || !unitsRequired || !hospitalName) {
      console.log('Validation failed: missing required fields', {
        patientName, bloodGroup, unitsRequired, hospitalName
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, bloodGroup, unitsRequired, hospitalName',
      });
    }

    // Validate prescription file
    if (!req.files?.prescriptionFile || req.files.prescriptionFile.length === 0) {
      console.log('Validation failed: prescription file missing');
      return res.status(400).json({
        success: false,
        message: 'Prescription file is required',
      });
    }

    // Validate and normalize requester phone
    let normalizedPhone = requesterPhone;
    if (requesterPhone) {
      const { isValidIndianMobile, normalizeIndianMobile } = await import('../utils/phone.js');
      if (!isValidIndianMobile(requesterPhone)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid Indian mobile number.' });
      }
      normalizedPhone = normalizeIndianMobile(requesterPhone) || requesterPhone;
    }

    const requestorId = userId;
    if (!requestorId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const [requestor, userAsRequestor] = await Promise.all([
      Requestor.findById(requestorId),
      User.findById(requestorId),
    ]);

    const requestorAccount = requestor || userAsRequestor;
    if (!requestorAccount) {
      return res.status(404).json({
        success: false,
        message: 'Requestor not found',
      });
    }

    // Create new blood request
    const newRequest = new Request({
      requestorId,
      userId: requestorId,
      hospitalId: hospitalId || null,
      patientName,
      bloodGroup,
      unitsRequired: parseInt(unitsRequired),
      hospitalName,
      requiredDate,
      reason,
      requesterName,
      requesterEmail,
      requesterPhone: normalizedPhone,
      prescriptionFilePath: req.files.prescriptionFile[0].path,
      idProofFilePath: req.files.idProofFile ? req.files.idProofFile[0].path : null,
      status: 'Pending',
      submittedAt: new Date(),
    });

    const savedRequest = await newRequest.save();

    // Keep legacy compatibility: also persist in BloodRequest collection.
    const legacyRequest = new BloodRequest({
      userId: requestorId,
      hospitalId: hospitalId || null,
      patientName,
      bloodGroup,
      unitsRequired: parseInt(unitsRequired),
      hospitalName,
      requiredDate,
      reason,
      requesterName,
      requesterEmail,
      requesterPhone: normalizedPhone,
      prescriptionFilePath: req.files.prescriptionFile[0].path,
      idProofFilePath: req.files.idProofFile ? req.files.idProofFile[0].path : null,
      status: 'Pending',
      submittedAt: new Date(),
    });

    const savedLegacyRequest = await legacyRequest.save();
    console.log('Blood request saved successfully:', savedRequest._id, savedLegacyRequest._id);

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      requestId: savedRequest._id,
      bloodRequestId: savedLegacyRequest._id,
      request: savedRequest,
    });
  } catch (error) {
    console.error('Error submitting blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit blood request',
      error: error.message,
    });
  }
};

// Primary POST - Submit blood request
router.post('/', upload.fields([
  { name: 'prescriptionFile', maxCount: 1 },
  { name: 'idProofFile', maxCount: 1 }
]), handleCreateRequest);

// Compatibility alias: POST /submit -> same handler
router.post('/submit', upload.fields([
  { name: 'prescriptionFile', maxCount: 1 },
  { name: 'idProofFile', maxCount: 1 }
]), handleCreateRequest);

// GET - Fetch blood requests by user ID (for requestor dashboard)
// IMPORTANT: This must come BEFORE /:requestId route to avoid route collision
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const requests = await Request.find({
      $or: [
        { requestorId: userId },
        { userId },
      ],
    }).sort({ submittedAt: -1 });
    
    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching user blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message,
    });
  }
});

// GET - Fetch all blood requests (for hospital panel)
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find().sort({ submittedAt: -1 });
    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message,
    });
  }
});

// PUT - Update blood request status (for hospital)
router.put('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason, hospitalRemarks } = req.body;

    // Validate status
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'Rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (hospitalRemarks) {
      updateData.hospitalRemarks = hospitalRemarks;
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    res.json({
      success: true,
      message: 'Blood request updated successfully',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Error updating blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blood request',
      error: error.message,
    });
  }
});

// GET - Fetch single blood request
router.get('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood request',
      error: error.message,
    });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message,
    });
  } else if (error) {
    console.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed',
    });
  }
  next();
});

export default router;
