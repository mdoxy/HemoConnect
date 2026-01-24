/**
 * HOSPITAL CONTROLLER
 * Handles hospital operations: donor verification, blood request management, inventory
 */

// Models - to be imported from models folder
// const Hospital = require('../models/Hospital');
// const User = require('../models/User');
// const Donor = require('../models/Donor');
// const Donation = require('../models/Donation');
// const BloodRequest = require('../models/BloodRequest');

/**
 * VERIFY DONOR - Hospital verifies donor identity and eligibility
 * Only hospitals can verify donors
 */
exports.verifyDonor = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can verify donors'
      });
    }

    const { donorUserId } = req.body;

    if (!donorUserId) {
      return res.status(400).json({
        success: false,
        message: 'Donor user ID is required'
      });
    }

    // Fetch donor and verify
    // const donor = await Donor.findOne({ userId: donorUserId });
    // if (!donor) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor not found'
    //   });
    // }

    // Mark donor as verified by this hospital
    // donor.verified = true;
    // await donor.save();

    // Update corresponding User document
    // const donorUser = await User.findByIdAndUpdate(
    //   donorUserId,
    //   { isVerified: true },
    //   { new: true }
    // );

    return res.status(200).json({
      success: true,
      message: 'Donor verified successfully',
      data: {
        // donorId: donorUserId,
        // verified: true
      }
    });

  } catch (error) {
    console.error('Verify donor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying donor',
      error: error.message
    });
  }
};

/**
 * APPROVE BLOOD REQUEST - Hospital approves a blood request
 * Triggers donor matching and notification
 */
exports.approveBloodRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can approve blood requests'
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

    // Verify this hospital owns the request
    // if (bloodRequest.hospitalId.toString() !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only manage your own requests'
    //   });
    // }

    // Update request status
    // bloodRequest.status = 'matched';
    // await bloodRequest.save();

    // TODO: Trigger matching algorithm to find suitable donors
    // TODO: Send notifications to matched donors

    return res.status(200).json({
      success: true,
      message: 'Blood request approved successfully',
      data: {
        // requestId: bloodRequest._id,
        // status: 'matched'
      }
    });

  } catch (error) {
    console.error('Approve blood request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error approving blood request',
      error: error.message
    });
  }
};

/**
 * REJECT BLOOD REQUEST - Hospital rejects a blood request
 */
exports.rejectBloodRequest = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can reject blood requests'
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

    // Update request status
    // bloodRequest.status = 'cancelled';
    // bloodRequest.cancellationReason = reason || 'Hospital rejected request';
    // bloodRequest.cancellationDate = new Date();
    // await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request rejected',
      data: {
        // requestId: bloodRequest._id,
        // status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('Reject blood request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rejecting blood request',
      error: error.message
    });
  }
};

/**
 * APPROVE DONATION - Hospital approves and confirms donation collection
 * Updates donation status to stored in inventory
 */
exports.approveDonation = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can approve donations'
      });
    }

    const { donationId } = req.body;

    if (!donationId) {
      return res.status(400).json({
        success: false,
        message: 'Donation ID is required'
      });
    }

    // Fetch donation
    // const donation = await Donation.findById(donationId);
    // if (!donation) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donation not found'
    //   });
    // }

    // Verify this hospital collected the donation
    // if (donation.hospitalId.toString() !== userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only manage donations from your hospital'
    //   });
    // }

    // Update donation status and add hospital verification
    // donation.donationStatus = 'stored';
    // donation.verifiedByHospital = {
    //   verified: true,
    //   verificationDate: new Date(),
    //   verifiedBy: userId
    // };

    // Auto-calculate expiry date (42 days from collection)
    // donation.expiryDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000);

    // await donation.save();

    // TODO: Update hospital inventory
    // TODO: Send notification to patient that blood is ready

    return res.status(200).json({
      success: true,
      message: 'Donation approved and stored',
      data: {
        // donationId: donation._id,
        // status: 'stored',
        // expiryDate: donation.expiryDate
      }
    });

  } catch (error) {
    console.error('Approve donation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error approving donation',
      error: error.message
    });
  }
};

/**
 * REJECT DONATION - Hospital rejects donation (failed testing, contamination, etc.)
 */
exports.rejectDonation = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can reject donations'
      });
    }

    const { donationId, reason } = req.body;

    if (!donationId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Donation ID and rejection reason are required'
      });
    }

    // Fetch donation
    // const donation = await Donation.findById(donationId);
    // if (!donation) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donation not found'
    //   });
    // }

    // Update donation status
    // donation.donationStatus = 'discarded';
    // donation.notes = reason;
    // await donation.save();

    return res.status(200).json({
      success: true,
      message: 'Donation rejected and discarded',
      data: {
        // donationId: donation._id,
        // status: 'discarded'
      }
    });

  } catch (error) {
    console.error('Reject donation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rejecting donation',
      error: error.message
    });
  }
};

/**
 * UPDATE BLOOD REQUEST STATUS - Hospital updates request progress
 * Status: pending | matched | partial_fulfilled | fulfilled | cancelled
 */
exports.updateBloodRequestStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can update blood request status'
      });
    }

    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Blood request ID and status are required'
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

    // Update status
    // bloodRequest.status = status;
    // if (status === 'fulfilled') {
    //   bloodRequest.actualFulfillmentDate = new Date();
    // }
    // await bloodRequest.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request status updated',
      data: {
        // requestId: bloodRequest._id,
        // status: bloodRequest.status
      }
    });

  } catch (error) {
    console.error('Update request status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blood request status',
      error: error.message
    });
  }
};

/**
 * VIEW ACTIVE REQUESTS - Get all pending/matched blood requests
 */
exports.viewActiveRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can view requests'
      });
    }

    const { page = 1, limit = 10, urgencyLevel = null } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query for active requests
    // const query = {
    //   hospitalId: userId,
    //   status: { $in: ['pending', 'matched', 'partial_fulfilled'] }
    // };

    // Add urgency filter if provided
    // if (urgencyLevel) {
    //   query.urgencyLevel = urgencyLevel;
    // }

    // Fetch active requests with patient details
    // const requests = await BloodRequest.find(query)
    //   .populate('patientId', 'name medicalRecordNumber requiredBloodGroup')
    //   .populate('matchedDonors.donorId', 'name bloodGroup availabilityStatus')
    //   .sort({ urgencyLevel: -1, createdAt: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // const totalRequests = await BloodRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Active blood requests retrieved',
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
    console.error('View active requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving active requests',
      error: error.message
    });
  }
};

/**
 * VIEW COMPLETED REQUESTS - Get all fulfilled/cancelled requests with analytics
 */
exports.viewCompletedRequests = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can view requests'
      });
    }

    const { page = 1, limit = 10, startDate = null, endDate = null } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query for completed requests
    // const query = {
    //   hospitalId: userId,
    //   status: { $in: ['fulfilled', 'cancelled'] }
    // };

    // Add date range filter if provided
    // if (startDate && endDate) {
    //   query.createdAt = {
    //     $gte: new Date(startDate),
    //     $lte: new Date(endDate)
    //   };
    // }

    // Fetch completed requests
    // const requests = await BloodRequest.find(query)
    //   .populate('patientId', 'name medicalRecordNumber')
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // const totalRequests = await BloodRequest.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Completed blood requests retrieved',
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
    console.error('View completed requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving completed requests',
      error: error.message
    });
  }
};

/**
 * VIEW BLOOD INVENTORY - Get hospital's current blood stock
 */
exports.viewBloodInventory = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can view inventory'
      });
    }

    // Fetch hospital inventory
    // const hospital = await Hospital.findOne({ userId }).select('inventory');
    // if (!hospital) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Hospital not found'
    //   });
    // }

    // Calculate total units in inventory
    // const totalUnits = Object.keys(hospital.inventory)
    //   .filter(key => key !== 'lastInventoryUpdate')
    //   .reduce((sum, key) => sum + (hospital.inventory[key].units || 0), 0);

    return res.status(200).json({
      success: true,
      message: 'Blood inventory retrieved',
      data: {
        // inventory: hospital.inventory,
        // totalUnits,
        // lastUpdated: hospital.inventory.lastInventoryUpdate
      }
    });

  } catch (error) {
    console.error('View inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving blood inventory',
      error: error.message
    });
  }
};

/**
 * UPDATE BLOOD INVENTORY - Hospital updates blood stock manually
 */
exports.updateBloodInventory = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Only hospitals can update inventory'
      });
    }

    const { bloodGroup, units } = req.body;

    if (!bloodGroup || units === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Blood group and units are required'
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

    // Validate units (must be non-negative number)
    if (units < 0 || !Number.isInteger(units)) {
      return res.status(400).json({
        success: false,
        message: 'Units must be a non-negative integer'
      });
    }

    // Update hospital inventory
    // const hospital = await Hospital.findOneAndUpdate(
    //   { userId },
    //   {
    //     [`inventory.${bloodGroup}.units`]: units,
    //     'inventory.lastInventoryUpdate': new Date()
    //   },
    //   { new: true }
    // ).select('inventory');

    return res.status(200).json({
      success: true,
      message: 'Blood inventory updated successfully',
      data: {
        // bloodGroup,
        // units,
        // updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blood inventory',
      error: error.message
    });
  }
};
