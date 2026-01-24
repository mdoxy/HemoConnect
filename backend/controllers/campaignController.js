/**
 * CAMPAIGN CONTROLLER
 * Handles blood donation campaigns: creation, registration, analytics
 */

// Models - to be imported from models folder
// const Campaign = require('../models/Campaign');
// const Hospital = require('../models/Hospital');
// const Donor = require('../models/Donor');
// const Donation = require('../models/Donation');
// const User = require('../models/User');

/**
 * CREATE CAMPAIGN - Admin or hospital creates a blood donation campaign
 * Only admins and hospitals can create campaigns
 */
exports.createCampaign = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !['admin', 'hospital'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and hospitals can create campaigns'
      });
    }

    const {
      title,
      description,
      location,
      campaignDate,
      targetBloodGroups = ['all'],
      targetDonors,
      type,
      contact,
      incentives = {}
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !campaignDate || !type || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, location, campaignDate, type, contact'
      });
    }

    // Validate campaign dates
    const startDate = new Date(campaignDate.startDate);
    const endDate = new Date(campaignDate.endDate);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Campaign start date cannot be in the past'
      });
    }

    // Validate campaign type
    const validTypes = ['emergency', 'planned', 'seasonal', 'community', 'corporate'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign type. Must be: ' + validTypes.join(', ')
      });
    }

    // Validate blood groups if specified
    const validBloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    if (!Array.isArray(targetBloodGroups) || 
        (targetBloodGroups[0] !== 'all' && !targetBloodGroups.every(bg => validBloodGroups.includes(bg)))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group target'
      });
    }

    // Validate location (GeoJSON Point)
    if (!location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location must include valid coordinates [longitude, latitude]'
      });
    }

    // Validate contact info
    if (!contact.name || !contact.phone) {
      return res.status(400).json({
        success: false,
        message: 'Contact name and phone are required'
      });
    }

    // Auto-generate campaign number
    // const campaignNumber = `CP-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create campaign
    // const campaign = await Campaign.create({
    //   campaignNumber,
    //   title,
    //   description,
    //   organizer: userId,
    //   location: {
    //     type: 'Point',
    //     coordinates: location.coordinates,
    //     address: location.address,
    //     city: location.city,
    //     state: location.state,
    //     radius: location.radius || 10 // Default 10km radius
    //   },
    //   campaignDate: {
    //     startDate,
    //     endDate,
    //     registrationDeadline: location.registrationDeadline || endDate
    //   },
    //   targetBloodGroups,
    //   targetDonors: targetDonors || 50,
    //   type,
    //   status: 'upcoming',
    //   contact,
    //   incentives,
    //   registeredDonors: [],
    //   successMetrics: {
    //     totalRegistered: 0,
    //     totalAttended: 0,
    //     totalDonated: 0,
    //     totalUnitsCollected: 0
    //   }
    // });

    return res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: {
        // campaignId: campaign._id,
        // campaignNumber: campaign.campaignNumber,
        // status: 'upcoming'
      }
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating campaign',
      error: error.message
    });
  }
};

/**
 * VIEW ALL CAMPAIGNS - Get list of all active and upcoming campaigns
 * Public endpoint - donors can view campaigns
 */
exports.viewAllCampaigns = async (req, res) => {
  try {
    const {
      status = null,
      type = null,
      page = 1,
      limit = 10,
      longitude = null,
      latitude = null,
      radiusKm = 20
    } = req.query;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build query
    // const query = {};

    // Filter by status
    // if (status) {
    //   const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    //   if (validStatuses.includes(status)) {
    //     query.status = status;
    //   }
    // } else {
    //   // Default: show only active and upcoming
    //   query.status = { $in: ['active', 'upcoming'] };
    // }

    // Filter by type
    // if (type) {
    //   query.type = type;
    // }

    // Filter by location if coordinates provided
    // if (longitude && latitude) {
    //   query.location = {
    //     $near: {
    //       $geometry: {
    //         type: 'Point',
    //         coordinates: [parseFloat(longitude), parseFloat(latitude)]
    //       },
    //       $maxDistance: radiusKm * 1000 // Convert km to meters
    //     }
    //   };
    // }

    // Fetch campaigns with organizer details
    // const campaigns = await Campaign.find(query)
    //   .populate('organizer', 'name email contactInfo')
    //   .sort({ campaignDate.startDate: 1 })
    //   .skip(skip)
    //   .limit(parseInt(limit));

    // const totalCampaigns = await Campaign.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Campaigns retrieved successfully',
      data: {
        // pagination: {
        //   currentPage: page,
        //   totalPages: Math.ceil(totalCampaigns / limit),
        //   totalCampaigns
        // },
        // campaigns
      }
    });

  } catch (error) {
    console.error('View campaigns error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving campaigns',
      error: error.message
    });
  }
};

/**
 * GET CAMPAIGN DETAILS - Fetch detailed information about a specific campaign
 */
exports.getCampaignDetails = async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    // Fetch campaign with detailed data
    // const campaign = await Campaign.findById(campaignId)
    //   .populate('organizer', 'name email address contactInfo')
    //   .populate('partneredHospitals', 'name address contactInfo');

    // if (!campaign) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Campaign not found'
    //   });
    // }

    // Fetch donations associated with campaign (if campaign is active)
    // if (campaign.status === 'active' || campaign.status === 'completed') {
    //   const donations = await Donation.find({
    //     // Assuming donations have campaign reference
    //   }).select('bloodGroup unitsCollected donationStatus');
    // }

    return res.status(200).json({
      success: true,
      message: 'Campaign details retrieved',
      data: {
        // campaign,
        // registeredDonorsCount: campaign.registeredDonors.length,
        // successMetrics: campaign.successMetrics
      }
    });

  } catch (error) {
    console.error('Get campaign details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving campaign details',
      error: error.message
    });
  }
};

/**
 * REGISTER DONOR TO CAMPAIGN - Donor registers for a blood donation campaign
 * Creates a slot/appointment for the donor
 */
exports.registerDonorToCampaign = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can register for campaigns'
      });
    }

    const { campaignId, slotTime } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    // Fetch campaign
    // const campaign = await Campaign.findById(campaignId);
    // if (!campaign) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Campaign not found'
    //   });
    // }

    // Verify campaign is still open for registration
    // const now = new Date();
    // const registrationDeadline = campaign.campaignDate.registrationDeadline;
    // if (now > registrationDeadline) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'Campaign registration has closed'
    //   });
    // }

    // Check if donor already registered
    // const alreadyRegistered = campaign.registeredDonors.some(d => d.donorId.toString() === userId);
    // if (alreadyRegistered) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'You are already registered for this campaign'
    //   });
    // }

    // Fetch donor to verify eligibility
    // const donor = await Donor.findOne({ userId });
    // if (!donor) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor profile not found'
    //   });
    // }

    // Check if donor is eligible (56-day rule)
    // if (donor.nextEligibleDonationDate > new Date()) {
    //   const daysUntilEligible = Math.ceil((donor.nextEligibleDonationDate - new Date()) / (1000 * 60 * 60 * 24));
    //   return res.status(409).json({
    //     success: false,
    //     message: `You are not eligible to donate yet. Eligible in ${daysUntilEligible} days.`
    //   });
    // }

    // Register donor
    // campaign.registeredDonors.push({
    //   donorId: userId,
    //   registeredAt: new Date(),
    //   slotTime: slotTime ? new Date(slotTime) : null,
    //   attended: false,
    //   donated: false
    // });
    // campaign.successMetrics.totalRegistered = campaign.registeredDonors.length;
    // await campaign.save();

    return res.status(200).json({
      success: true,
      message: 'Donor registered for campaign successfully',
      data: {
        // campaignId: campaign._id,
        // registrationStatus: 'registered',
        // slotTime: slotTime || 'Walk-in accepted'
      }
    });

  } catch (error) {
    console.error('Register donor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error registering for campaign',
      error: error.message
    });
  }
};

/**
 * UNREGISTER DONOR FROM CAMPAIGN - Donor cancels campaign registration
 */
exports.unregisterDonorFromCampaign = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || req.user?.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can unregister from campaigns'
      });
    }

    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    // Fetch campaign
    // const campaign = await Campaign.findById(campaignId);
    // if (!campaign) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Campaign not found'
    //   });
    // }

    // Find and remove donor from registered list
    // const donorIndex = campaign.registeredDonors.findIndex(d => d.donorId.toString() === userId);
    // if (donorIndex === -1) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Donor not registered for this campaign'
    //   });
    // }

    // campaign.registeredDonors.splice(donorIndex, 1);
    // campaign.successMetrics.totalRegistered = campaign.registeredDonors.length;
    // await campaign.save();

    return res.status(200).json({
      success: true,
      message: 'Unregistered from campaign successfully',
      data: {
        // campaignId: campaign._id
      }
    });

  } catch (error) {
    console.error('Unregister donor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error unregistering from campaign',
      error: error.message
    });
  }
};

/**
 * UPDATE CAMPAIGN STATUS - Admin/organizer updates campaign status
 * Status: upcoming → active → completed or cancelled
 */
exports.updateCampaignStatus = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !['admin', 'hospital'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and hospitals can update campaign status'
      });
    }

    const { campaignId, status } = req.body;

    if (!campaignId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID and status are required'
      });
    }

    // Validate status
    const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: ' + validStatuses.join(', ')
      });
    }

    // Fetch campaign
    // const campaign = await Campaign.findById(campaignId);
    // if (!campaign) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Campaign not found'
    //   });
    // }

    // Verify authorization (must be organizer or admin)
    // if (campaign.organizer.toString() !== userId && req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only manage campaigns you created'
    //   });
    // }

    // Update status
    // campaign.status = status;
    // if (status === 'cancelled') {
    //   campaign.cancellationDate = new Date();
    //   campaign.cancellationReason = req.body.cancellationReason || 'No reason provided';
    // }
    // await campaign.save();

    return res.status(200).json({
      success: true,
      message: 'Campaign status updated',
      data: {
        // campaignId: campaign._id,
        // status: campaign.status
      }
    });

  } catch (error) {
    console.error('Update campaign status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating campaign status',
      error: error.message
    });
  }
};

/**
 * GET CAMPAIGN ANALYTICS - Get statistics about campaign performance
 * Admin & organizer only
 */
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId || !['admin', 'hospital'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and hospitals can view campaign analytics'
      });
    }

    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: 'Campaign ID is required'
      });
    }

    // Fetch campaign
    // const campaign = await Campaign.findById(campaignId);
    // if (!campaign) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Campaign not found'
    //   });
    // }

    // Verify authorization
    // if (campaign.organizer.toString() !== userId && req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'You can only view analytics for campaigns you created'
    //   });
    // }

    // Calculate additional analytics
    // const totalRegistered = campaign.registeredDonors.length;
    // const totalAttended = campaign.registeredDonors.filter(d => d.attended).length;
    // const totalDonated = campaign.registeredDonors.filter(d => d.donated).length;
    // const attendanceRate = totalRegistered ? Math.round((totalAttended / totalRegistered) * 100) : 0;
    // const donationRate = totalAttended ? Math.round((totalDonated / totalAttended) * 100) : 0;

    return res.status(200).json({
      success: true,
      message: 'Campaign analytics retrieved',
      data: {
        // campaignId: campaign._id,
        // campaignName: campaign.title,
        // duration: {
        //   start: campaign.campaignDate.startDate,
        //   end: campaign.campaignDate.endDate
        // },
        // metrics: {
        //   targetDonors: campaign.targetDonors,
        //   totalRegistered,
        //   totalAttended,
        //   totalDonated,
        //   totalUnitsCollected: campaign.successMetrics.totalUnitsCollected,
        //   attendanceRate: `${attendanceRate}%`,
        //   donationRate: `${donationRate}%`
        // }
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving campaign analytics',
      error: error.message
    });
  }
};
