/**
 * BLOOD REQUEST CONTROLLER
 * Handles blood request operations: creation, matching, status updates
 */

// Models - to be imported from models folder
// const BloodRequest = require('../models/BloodRequest');
// const Donor = require('../models/Donor');
// const Hospital = require('../models/Hospital');
// const Patient = require('../models/Patient');
// const User = require('../models/User');

/**
 * CREATE BLOOD REQUEST - Create new urgent blood requirement
 * Can be created by patient or hospital on behalf of patient
 */
exports.createBloodRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !['patient', 'hospital'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only patients or hospitals can create blood requests'
      });
    }

    const {
      bloodGroup,
      urgencyLevel,
      requiredUnits,
      medicalReason,
      requestingDoctor,
      hospitalId,
      patientId = null
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

    // Validate units
    if (requiredUnits < 1 || requiredUnits > 10 || !Number.isInteger(requiredUnits)) {
      return res.status(400).json({
        success: false,
        message: 'Required units must be an integer between 1 and 10'
      });
    }

    // Validate requesting doctor
    if (!requestingDoctor || !requestingDoctor.name || !requestingDoctor.registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Doctor information required (name and registration number)'
      });
    }

    // If hospital is creating for patient, patientId is required
    if (req.user?.role === 'hospital' && !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required when hospital creates request'
      });
    }

    // Auto-generate request number (BR-YYYY-MM-XXXXX)
    // const requestNumber = `BR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create blood request
    // const bloodRequest = await BloodRequest.create({
    //   requestNumber,
    //   patientId: patientId || userId,
    //   hospitalId,
    //   bloodGroup,
    //   urgencyLevel,
    //   requiredUnits,
    //   medicalReason: medicalReason || '',
    //   requestingDoctor,
    //   status: 'pending',
    //   priority: urgencyLevel === 'critical'
    // });

    // TODO: Trigger automatic donor matching algorithm
    // - Find donors with matching blood group
    // - Filter by location proximity
    // - Check availability and eligibility
    // - Send notifications to matched donors
    // - Calculate match scores

    return res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        // requestId: bloodRequest._id,
        // requestNumber: bloodRequest.requestNumber,
        // status: 'pending',
        // matchingStarted: true
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
 * FETCH REQUESTS BY URGENCY - Get blood requests filtered by urgency level
 */
exports.fetchRequestsByUrgency = async (req, res) => {
  try {
    const { urgencyLevel, page = 1, limit = 10 } = req.query;

    if (!urgencyLevel) {
      return res.status(400).json({
        success: false,
        message: 'Urgency level is required'
      });
    }

    // Validate urgency level
    const validUrgencyLevels = ['low', 'medium', 'high', 'critical'];
    if (!validUrgencyLevels.includes(urgencyLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency level'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    // const query = {
    //   urgencyLevel,
    //   status: { $in: ['pending', 'matched'] }
    // };

    // Fetch requests sorted by creation date (newest first)
    // const requests = await BloodRequest.find(query)
    //   .populate('patientId', 'name medicalRecordNumber requiredBloodGroup')
    //   .populate('hospitalId', 'name address location')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // const totalRequests = await BloodRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: `Blood requests with urgency level: ${urgencyLevel}`,
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
    console.error('Fetch requests by urgency error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blood requests',
      error: error.message
    });
  }
};

/**
 * UPDATE BLOOD REQUEST STATUS - Update status and track progress
 * Status: pending → matched → partial_fulfilled → fulfilled
 */
exports.updateBloodRequestStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'matched', 'partial_fulfilled', 'fulfilled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
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

    // Validate state transition (can't go backwards)
    // const statusOrder = ['pending', 'matched', 'partial_fulfilled', 'fulfilled', 'cancelled'];
    // const currentIndex = statusOrder.indexOf(bloodRequest.status);
    // const newIndex = statusOrder.indexOf(status);
    // if (newIndex < currentIndex && status !== 'cancelled') {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Cannot change status from ${bloodRequest.status} to ${status}`
    //   });
    // }

    // Update status
    // bloodRequest.status = status;
    // if (status === 'fulfilled') {
    //   bloodRequest.actualFulfillmentDate = new Date();
    // }
    // if (status === 'cancelled') {
    //   bloodRequest.cancellationDate = new Date();
    // }
    // await bloodRequest.save();

    // TODO: Send status update notifications to patient and hospital

    return res.status(200).json({
      success: true,
      message: 'Blood request status updated',
      data: {
        // requestId: bloodRequest._id,
        // status: bloodRequest.status,
        // updatedAt: bloodRequest.updatedAt
      }
    });

  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blood request status',
      error: error.message
    });
  }
};

/**
 * LINK DONOR TO REQUEST - Associate a donor with a blood request
 * Hospital confirms that a specific donor will fulfill the request
 */
exports.linkDonorToRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can link donors to requests'
      });
    }

    const { requestId, donorUserId, matchScore = 100 } = req.body;

    if (!requestId || !donorUserId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and donor user ID are required'
      });
    }

    // Validate match score
    if (matchScore < 0 || matchScore > 100) {
      return res.status(400).json({
        success: false,
        message: 'Match score must be between 0 and 100'
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

    // Verify hospital owns this request
    // if (bloodRequest.hospitalId.toString() !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only manage your own requests'
    //   });
    // }

    // Check if donor is already linked
    // const alreadyLinked = bloodRequest.matchedDonors.some(d => d.donorId.toString() === donorUserId);
    // if (alreadyLinked) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'This donor is already linked to this request'
    //   });
    // }

    // Fetch donor to validate
    // const donor = await Donor.findOne({ userId: donorUserId });
    // if (!donor) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor not found'
    //   });
    // }

    // Add donor to matched donors array
    // bloodRequest.matchedDonors.push({
    //   donorId: donorUserId,
    //   status: 'matched',
    //   matchScore,
    //   notifiedAt: new Date()
    // });
    // bloodRequest.unitsMatched += 1; // Increment matched units
    // await bloodRequest.save();

    // TODO: Send notification to donor about the match

    return res.status(200).json({
      success: true,
      message: 'Donor linked to blood request successfully',
      data: {
        // requestId: bloodRequest._id,
        // donorId: donorUserId,
        // matchScore,
        // status: 'matched'
      }
    });

  } catch (error) {
    console.error('Link donor to request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error linking donor to request',
      error: error.message
    });
  }
};

/**
 * GET REQUEST DETAILS - Fetch complete details of a blood request
 * Includes: patient info, hospital details, matched donors, status
 */
exports.getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Fetch blood request with all related data
    // const request = await BloodRequest.findById(requestId)
    //   .populate('patientId', 'name medicalRecordNumber requiredBloodGroup urgencyLevel')
    //   .populate('hospitalId', 'name address contactInfo')
    //   .populate('matchedDonors.donorId', 'name bloodGroup availabilityStatus')
    //   .populate('matchedDonors.donationId', 'donationStatus');

    // if (!request) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: 'Blood request details retrieved',
      data: {
        // request
      }
    });

  } catch (error) {
    console.error('Get request details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving request details',
      error: error.message
    });
  }
};

/**
 * SEARCH NEARBY DONORS FOR REQUEST - Find eligible donors by proximity
 * Considers: blood group match, location, availability
 */
exports.searchNearbyDonors = async (req, res) => {
  try {
    const { requestId, radiusKm = 10 } = req.query;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Fetch blood request
    // const bloodRequest = await BloodRequest.findById(requestId)
    //   .populate('hospitalId', 'location');

    // if (!bloodRequest) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    // Find nearby donors with matching blood group
    // const donors = await Donor.find({
    //   bloodGroup: bloodRequest.bloodGroup,
    //   availabilityStatus: 'available',
    //   nextEligibleDonationDate: { $lte: new Date() },
    //   location: {
    //     $near: {
    //       $geometry: {
    //         type: 'Point',
    //         coordinates: bloodRequest.hospitalId.location.coordinates
    //       },
    //       $maxDistance: radiusKm * 1000 // Convert km to meters
    //     }
    //   }
    // })
    // .limit(20)
    // .sort({ distance: 1 }); // Closest donors first

    return res.status(200).json({
      success: true,
      message: 'Nearby eligible donors found',
      data: {
        // totalDonorsFound: donors.length,
        // radius: `${radiusKm}km`,
        // donors
      }
    });

  } catch (error) {
    console.error('Search nearby donors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching for nearby donors',
      error: error.message
    });
  }
};

/**
 * AUTO-MATCH ALGORITHM - Find best matching donors for a blood request
 * Uses: blood group, location, availability, past donation history
 */
exports.autoMatchDonors = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    // Fetch blood request
    // const bloodRequest = await BloodRequest.findById(requestId)
    //   .populate('hospitalId', 'location');

    // if (!bloodRequest) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Blood request not found'
    //   });
    // }

    // MATCHING ALGORITHM:
    // 1. Blood group: Exact match required (critical factor)
    // 2. Location: Proximity (within 20km default)
    // 3. Availability: Must be available and eligible (56-day rule)
    // 4. Score calculation:
    //    - Base score: 100
    //    - Deduct for distance
    //    - Bonus for nearby location (+10)
    //    - Bonus for high donation count (+5)
    //    - Bonus for recent activity (+3)

    // const matchedDonors = await performDonorMatching(
    //   bloodRequest.bloodGroup,
    //   bloodRequest.hospitalId.location.coordinates,
    //   bloodRequest.requiredUnits
    // );

    // if (matchedDonors.length === 0) {
    //   return res.status(200).json({
    //     success: true,
    //     message: 'No matching donors found in acceptable distance',
    //     data: {
    //       matchCount: 0,
    //       donors: []
    //     }
    //   });
    // }

    // Update request with matched donors
    // bloodRequest.matchedDonors = matchedDonors;
    // bloodRequest.status = 'matched';
    // await bloodRequest.save();

    // TODO: Send notifications to all matched donors

    return res.status(200).json({
      success: true,
      message: 'Donor matching completed',
      data: {
        // requestId: bloodRequest._id,
        // matchCount: matchedDonors.length,
        // donors: matchedDonors
      }
    });

  } catch (error) {
    console.error('Auto-match error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error performing donor matching',
      error: error.message
    });
  }
};
