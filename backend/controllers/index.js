/**
 * CONTROLLERS INDEX
 * Central export point for all controllers
 * Import and use in routes
 */

const authController = require('./authController');
const donorController = require('./donorController');
const patientController = require('./patientController');
const hospitalController = require('./hospitalController');
const bloodRequestController = require('./bloodRequestController');
const campaignController = require('./campaignController');

module.exports = {
  // Auth Controller Exports
  auth: {
    registerUser: authController.registerUser,
    loginUser: authController.loginUser,
    getCurrentUserProfile: authController.getCurrentUserProfile,
    logoutUser: authController.logoutUser,
    verifyEmail: authController.verifyEmail,
    forgotPassword: authController.forgotPassword,
    resetPassword: authController.resetPassword
  },

  // Donor Controller Exports
  donor: {
    completeDonorProfile: donorController.completeDonorProfile,
    updateAvailabilityStatus: donorController.updateAvailabilityStatus,
    viewAssignedRequests: donorController.viewAssignedRequests,
    viewDonationHistory: donorController.viewDonationHistory,
    checkDonorEligibility: donorController.checkDonorEligibility,
    acceptDonationRequest: donorController.acceptDonationRequest,
    rejectDonationRequest: donorController.rejectDonationRequest
  },

  // Patient Controller Exports
  patient: {
    completePatientProfile: patientController.completePatientProfile,
    createBloodRequest: patientController.createBloodRequest,
    viewRequestStatus: patientController.viewRequestStatus,
    uploadPrescription: patientController.uploadPrescription,
    uploadConsentForm: patientController.uploadConsentForm,
    cancelBloodRequest: patientController.cancelBloodRequest
  },

  // Hospital Controller Exports
  hospital: {
    verifyDonor: hospitalController.verifyDonor,
    approveBloodRequest: hospitalController.approveBloodRequest,
    rejectBloodRequest: hospitalController.rejectBloodRequest,
    approveDonation: hospitalController.approveDonation,
    rejectDonation: hospitalController.rejectDonation,
    updateBloodRequestStatus: hospitalController.updateBloodRequestStatus,
    viewActiveRequests: hospitalController.viewActiveRequests,
    viewCompletedRequests: hospitalController.viewCompletedRequests,
    viewBloodInventory: hospitalController.viewBloodInventory,
    updateBloodInventory: hospitalController.updateBloodInventory
  },

  // Blood Request Controller Exports
  bloodRequest: {
    createBloodRequest: bloodRequestController.createBloodRequest,
    fetchRequestsByUrgency: bloodRequestController.fetchRequestsByUrgency,
    updateBloodRequestStatus: bloodRequestController.updateBloodRequestStatus,
    linkDonorToRequest: bloodRequestController.linkDonorToRequest,
    getRequestDetails: bloodRequestController.getRequestDetails,
    searchNearbyDonors: bloodRequestController.searchNearbyDonors,
    autoMatchDonors: bloodRequestController.autoMatchDonors
  },

  // Campaign Controller Exports
  campaign: {
    createCampaign: campaignController.createCampaign,
    viewAllCampaigns: campaignController.viewAllCampaigns,
    getCampaignDetails: campaignController.getCampaignDetails,
    registerDonorToCampaign: campaignController.registerDonorToCampaign,
    unregisterDonorFromCampaign: campaignController.unregisterDonorFromCampaign,
    updateCampaignStatus: campaignController.updateCampaignStatus,
    getCampaignAnalytics: campaignController.getCampaignAnalytics
  }
};
