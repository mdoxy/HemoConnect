/**
 * PATIENT CONTROLLER
 * Handles patient-related operations: profile, blood requests, document uploads
 */

// Models - to be imported from models folder
// const Patient = require('../models/Patient');
// const User = require('../models/User');
// const BloodRequest = require('../models/BloodRequest');
// const Donation = require('../models/Donation');

/**
 * COMPLETE PATIENT PROFILE - Fill in medical information
 * Only users with role='patient' can complete their profile
 */
exports.completePatientProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can complete patient profile'
      });
    }

    const {
      medicalRecordNumber,
      dateOfBirth,
      gender,
      requiredBloodGroup,
      medicalCondition,
      currentHospital,
      hospitalContactPerson,
      guarantor
    } = req.body;

    // Validate required fields
    if (!medicalRecordNumber || !dateOfBirth || !requiredBloodGroup || !currentHospital) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: medicalRecordNumber, dateOfBirth, requiredBloodGroup, currentHospital'
      });
    }

    // Validate blood group
    const validBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodGroups.includes(requiredBloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group. Must be one of: ' + validBloodGroups.join(', ')
      });
    }

    // Validate date of birth (must be in past)
    const dob = new Date(dateOfBirth);
    if (dob > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth cannot be in the future'
      });
    }

    // Validate gender
    const validGenders = ['M', 'F', 'Other'];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender. Must be: M, F, or Other'
      });
    }

    // Calculate blood group compatibility (who can donate to this patient)
    // This is based on ABO/Rh compatibility rules
    const bloodGroupCompatibility = calculateCompatibleDonors(requiredBloodGroup);

    // Update patient profile
    // const patient = await Patient.findOneAndUpdate(
    //   { userId },
    //   {
    //     medicalRecordNumber,
    //     dateOfBirth: dob,
    //     gender,
    //     requiredBloodGroup,
    //     bloodGroupCompatibility,
    //     medicalCondition: medicalCondition || '',
    //     currentHospital,
    //     admissionDate: new Date(),
    //     hospitalContactPerson,
    //     guarantor
    //   },
    //   { new: true }
    // );

    return res.status(200).json({
      success: true,
      message: 'Patient profile completed successfully',
      data: {
        // patient
      }
    });

  } catch (error) {
    console.error('Complete patient profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error completing patient profile',
      error: error.message
    });
  }
};

/**
 * CREATE BLOOD REQUEST - Patient creates urgent blood request
 */
exports.createBloodRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can create blood requests'
      });
    }

    const {
      bloodGroup,
      urgencyLevel,
      requiredUnits,
      medicalReason,
      requestingDoctor,
      hospitalId
    } = req.body;

    // Validate required fields
    if (!bloodGroup || !urgencyLevel || !requiredUnits || !hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bloodGroup, urgencyLevel, requiredUnits, hospitalId'
      });
    }

    // Validate blood group
    const validBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group'
      });
    }

    // Validate urgency level
    const validUrgencyLevels = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencyLevels.includes(urgencyLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency level. Must be: low, medium, high, or critical'
      });
    }

    // Validate units (1-10)
    if (requiredUnits < 1 || requiredUnits > 10 || !Number.isInteger(requiredUnits)) {
      return res.status(400).json({
        success: false,
        message: 'Required units must be an integer between 1 and 10'
      });
    }

    // Validate requesting doctor info
    if (!requestingDoctor || !requestingDoctor.name || !requestingDoctor.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Doctor information is required (name and registration number)'
      });
    }

    // Fetch patient to get patient ID
    // const patient = await Patient.findOne({ userId });
    // if (!patient) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Patient profile not found'
    //   });
    // }

    // Auto-generate request number
    // const requestNumber = `BR-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create blood request
    // const bloodRequest = await BloodRequest.create({
    //   requestNumber,
    //   patientId: patient._id,
    //   hospitalId,
    //   bloodGroup,
    //   urgencyLevel,
    //   requiredUnits,
    //   medicalReason,
    //   requestingDoctor,
    //   status: 'pending'
    // });

    // TODO: Trigger donor matching algorithm (geospatial + blood group + availability)

    return res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        // requestId: bloodRequest._id,
        // requestNumber: bloodRequest.requestNumber,
        // status: 'pending'
      }
    });

  } catch (error) {
    console.error('Create blood request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating blood request',
      error: error.message
    });
  }
};

/**
 * VIEW BLOOD REQUEST STATUS - Get all patient's blood requests with detailed status
 */
exports.viewRequestStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can view their blood requests'
      });
    }

    const { status = null, page = 1, limit = 10 } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch patient ID
    // const patient = await Patient.findOne({ userId });
    // if (!patient) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Patient profile not found'
    //   });
    // }

    // Build query
    // const query = { patientId: patient._id };
    // if (status) {
    //   query.status = status;
    // }

    // Fetch blood requests with details
    // const requests = await BloodRequest.find(query)
    //   .populate('hospitalId', 'name address contactInfo')
    //   .populate('matchedDonors.donorId', 'name bloodGroup')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // const totalRequests = await BloodRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Blood requests retrieved',
      data: {
        // pagination: {
        //   currentPage: page,
        //   totalPages: Math.ceil(totalRequests / limit),
        //   totalRequests
        // },
        // requests
      }
    });

  } catch (error) {
    console.error('View request status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving blood requests',
      error: error.message
    });
  }
};

/**
 * UPLOAD PRESCRIPTION - Upload prescription document for blood request
 * Supports: PDF, JPG, PNG (max 5MB)
 */
exports.uploadPrescription = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can upload prescriptions'
      });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Blood request ID is required'
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file type (PDF, JPG, PNG only)
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, JPG, and PNG are allowed'
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    // Fetch blood request
    // const bloodRequest = await BloodRequest.findById(requestId);
    // if (!bloodRequest) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    // Save file to cloud storage (AWS S3, Azure Blob, etc.)
    // const fileUrl = await uploadToCloudStorage(req.file);

    // Update blood request with prescription document
    // bloodRequest.medicalDocumentation.prescriptionDocument = fileUrl;
    // bloodRequest.medicalDocumentation.prescriptionUploadDate = new Date();
    // await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: {
        // fileUrl,
        // fileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Upload prescription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading prescription',
      error: error.message
    });
  }
};

/**
 * UPLOAD CONSENT FORM - Upload signed consent form
 * Confirms patient's consent for blood transfusion
 */
exports.uploadConsentForm = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can upload consent forms'
      });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Blood request ID is required'
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, JPG, and PNG are allowed'
      });
    }

    // Fetch blood request
    // const bloodRequest = await BloodRequest.findById(requestId);
    // if (!bloodRequest) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    // Save consent form to cloud storage
    // const fileUrl = await uploadToCloudStorage(req.file);

    // Update blood request - mark consent as signed
    // bloodRequest.medicalDocumentation.consentFormSigned = true;
    // bloodRequest.medicalDocumentation.consentFormSignedDate = new Date();
    // bloodRequest.medicalDocumentation.labReports.push({
    //   url: fileUrl,
    //   uploadDate: new Date()
    // });
    // await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Consent form uploaded successfully',
      data: {
        // fileUrl,
        // consentStatus: 'signed'
      }
    });

  } catch (error) {
    console.error('Upload consent form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading consent form',
      error: error.message
    });
  }
};

/**
 * CANCEL BLOOD REQUEST - Patient can cancel pending request
 */
exports.cancelBloodRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can cancel blood requests'
      });
    }

    const { requestId, reason } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Blood request ID is required'
      });
    }

    // Fetch blood request
    // const bloodRequest = await BloodRequest.findById(requestId);
    // if (!bloodRequest) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    // Only pending or matched requests can be cancelled
    // if (!['pending', 'matched'].includes(bloodRequest.status)) {
    //   return res.status(409).json({
    //     success: false,
    //     message: `Cannot cancel request with status: ${bloodRequest.status}`
    //   });
    // }

    // Update request status
    // bloodRequest.status = 'cancelled';
    // bloodRequest.cancellationReason = reason || 'No reason provided';
    // bloodRequest.cancellationDate = new Date();
    // await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request cancelled successfully',
      data: {
        // requestId: bloodRequest._id,
        // status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('Cancel blood request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling blood request',
      error: error.message
    });
  }
};

/**
 * HELPER FUNCTION - Calculate compatible donor blood groups
 * Based on ABO/Rh compatibility rules
 */
function calculateCompatibleDonors(recipientBloodGroup) {
  // Blood group compatibility matrix
  const compatibility = {
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
    'A+': ['O+', 'O-', 'A+', 'A-'],
    'A-': ['O-', 'A-'],
    'B+': ['O+', 'O-', 'B+', 'B-'],
    'B-': ['O-', 'B-'],
    'AB+': ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    'AB-': ['O-', 'A-', 'B-', 'AB-']
  };

  return compatibility[recipientBloodGroup] || [];
}
