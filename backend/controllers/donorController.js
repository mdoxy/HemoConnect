/**
 * DONOR CONTROLLER
 * Handles donor-related operations: profile completion, availability, donation history
 */

// Models - to be imported from models folder
// const Donor = require('../models/Donor');
// const User = require('../models/User');
// const Donation = require('../models/Donation');
// const BloodRequest = require('../models/BloodRequest');

/**
 * COMPLETE DONOR PROFILE - Fill in blood group and health information
 * Only users with role='donor' can complete their profile
 */
exports.completeDonorProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can complete donor profile'
      });
    }

    const {
      bloodGroup,
      healthDeclaration,
      emergencyContact,
      preferences
    } = req.body;

    // Validate blood group
    const validBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!bloodGroup || !validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group. Must be one of: ' + validBloodGroups.join(', ')
      });
    }

    // Validate health declaration
    if (healthDeclaration && typeof healthDeclaration !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Health declaration must be an object'
      });
    }

    // Validate emergency contact
    if (!emergencyContact || !emergencyContact.name || !emergencyContact.phone || !emergencyContact.relationship) {
      return res.status(400).json({
        success: false,
        message: 'Emergency contact must include name, phone, and relationship'
      });
    }

    // Update donor profile
    // const donor = await Donor.findOneAndUpdate(
    //   { userId },
    //   {
    //     bloodGroup,
    //     healthDeclaration: healthDeclaration || {},
    //     emergencyContact,
    //     preferences: preferences || {
    //       notificationsByEmail: true,
    //       notificationsBySMS: true,
    //       pushNotifications: true
    //     },
    //     availabilityStatus: 'available'
    //   },
    //   { new: true }
    // );

    return res.status(200).json({
      success: true,
      message: 'Donor profile completed successfully',
      data: {
        // donor
      }
    });

  } catch (error) {
    console.error('Complete donor profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error completing donor profile',
      error: error.message
    });
  }
};

/**
 * UPDATE DONOR AVAILABILITY - Change availability status
 * Status: available | unavailable | cooldown
 */
exports.updateAvailabilityStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can update availability'
      });
    }

    const { status } = req.body;

    // Validate status
    const validStatuses = ['available', 'unavailable', 'cooldown'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, unavailable, or cooldown'
      });
    }

    // Update donor availability
    // const donor = await Donor.findOneAndUpdate(
    //   { userId },
    //   { availabilityStatus: status },
    //   { new: true }
    // );

    // if (!donor) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor profile not found'
    //   });
    // }

    return res.status(200).json({
      success: true,
      message: `Availability status updated to: ${status}`,
      data: {
        // availabilityStatus: donor.availabilityStatus
      }
    });

  } catch (error) {
    console.error('Update availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating availability status',
      error: error.message
    });
  }
};

/**
 * VIEW ASSIGNED & NEARBY BLOOD REQUESTS
 * Returns blood requests matching donor's blood group and location
 */
exports.viewAssignedRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can view assigned requests'
      });
    }

    const { radius = 10, urgencyLevel = null } = req.query;

    // Fetch donor profile to get blood group and location
    // const donor = await Donor.findOne({ userId });
    // const user = await User.findById(userId);

    // if (!donor || !user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor profile not found'
    //   });
    // }

    // Build query for nearby blood requests
    // const query = {
    //   bloodGroup: donor.bloodGroup,
    //   status: { $in: ['pending', 'matched'] },
    //   location: {
    //     $near: {
    //       $geometry: {
    //         type: 'Point',
    //         coordinates: user.location.coordinates
    //       },
    //       $maxDistance: radius * 1000 // Convert km to meters
    //     }
    //   }
    // };

    // Add urgency filter if provided
    // if (urgencyLevel) {
    //   query.urgencyLevel = urgencyLevel;
    // }

    // Fetch matching blood requests with hospital details
    // const requests = await BloodRequest.find(query)
    //   .populate('hospitalId', 'name address location')
    //   .sort({ urgencyLevel: -1, createdAt: -1 })
    //   .limit(20);

    return res.status(200).json({
      success: true,
      message: 'Nearby blood requests retrieved',
      data: {
        // totalRequests: requests.length,
        // requests
      }
    });

  } catch (error) {
    console.error('View assigned requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving blood requests',
      error: error.message
    });
  }
};

/**
 * VIEW DONATION HISTORY - Get all past and current donations
 */
exports.viewDonationHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can view donation history'
      });
    }

    const { page = 1, limit = 10, status = null } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    // const query = { donorId: userId };
    // if (status) {
    //   query.donationStatus = status;
    // }

    // Fetch donations with pagination
    // const donations = await Donation.find(query)
    //   .populate('requestId', 'bloodGroup urgencyLevel requiredUnits')
    //   .populate('hospitalId', 'name address')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // Get total count for pagination
    // const totalDonations = await Donation.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Donation history retrieved',
      data: {
        // pagination: {
        //   currentPage: page,
        //   totalPages: Math.ceil(totalDonations / limit),
        //   totalDonations
        // },
        // donations
      }
    });

  } catch (error) {
    console.error('View donation history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving donation history',
      error: error.message
    });
  }
};

/**
 * GET DONOR ELIGIBILITY STATUS - Check if donor can donate
 * Considers: last donation date (56-day rule), health status
 */
exports.checkDonorEligibility = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can check eligibility'
      });
    }

    // Fetch donor profile
    // const donor = await Donor.findOne({ userId });
    // if (!donor) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor profile not found'
    //   });
    // }

    // Check eligibility criteria
    // const now = new Date();
    // const isEligible = donor.nextEligibleDonationDate <= now;
    // const daysUntilEligible = Math.ceil((donor.nextEligibleDonationDate - now) / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      success: true,
      message: 'Donor eligibility status retrieved',
      data: {
        // isEligible,
        // nextEligibleDate: isEligible ? 'Now' : `${daysUntilEligible} days`,
        // lastDonationDate: donor.lastDonationDate,
        // totalDonations: donor.totalDonations,
        // availabilityStatus: donor.availabilityStatus
      }
    });

  } catch (error) {
    console.error('Check eligibility error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking eligibility',
      error: error.message
    });
  }
};

/**
 * ACCEPT BLOOD REQUEST DONATION - Donor accepts a matching request
 */
exports.acceptDonationRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can accept donation requests'
      });
    }

    const { requestId } = req.body;

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

    // Check if donor already accepted this request
    // const alreadyMatched = bloodRequest.matchedDonors.some(d => d.donorId.toString() === userId);
    // if (alreadyMatched) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'You have already responded to this request'
    //   });
    // }

    // Create donation record
    // const donation = await Donation.create({
    //   requestId,
    //   donorId: userId,
    //   hospitalId: bloodRequest.hospitalId,
    //   bloodGroup: bloodRequest.bloodGroup,
    //   donationStatus: 'accepted'
    // });

    // Update blood request with matched donor
    // bloodRequest.matchedDonors.push({
    //   donorId: userId,
    //   donationId: donation._id,
    //   status: 'accepted',
    //   matchScore: 100,
    //   respondedAt: new Date()
    // });
    // await bloodRequest.save();

    return res.status(201).json({
      success: true,
      message: 'Donation request accepted successfully',
      data: {
        // donationId: donation._id,
        // donationStatus: 'accepted'
      }
    });

  } catch (error) {
    console.error('Accept donation request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error accepting donation request',
      error: error.message
    });
  }
};

/**
 * REJECT BLOOD REQUEST - Donor declines a matching request
 */
exports.rejectDonationRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can reject donation requests'
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

    // Check if donor already responded
    // const matchedDonor = bloodRequest.matchedDonors.find(d => d.donorId.toString() === userId);
    // if (matchedDonor) {
    //   matchedDonor.status = 'rejected';
    //   matchedDonor.responseMessage = reason || 'No reason provided';
    //   await bloodRequest.save();
    // }

    return res.status(200).json({
      success: true,
      message: 'Donation request rejected',
      data: {
        // requestId
      }
    });

  } catch (error) {
    console.error('Reject donation request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rejecting donation request',
      error: error.message
    });
  }
};
