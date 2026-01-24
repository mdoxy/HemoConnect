const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      required: [true, 'Blood request ID is required']
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor ID is required']
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital ID is required']
    },
    bloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      required: [true, 'Blood group is required']
    },
    unitsCollected: {
      type: Number,
      required: [true, 'Units collected must be specified'],
      min: [0.5, 'Minimum 0.5 units'],
      max: [1, 'Standard donation is 1 unit']
    },
    donationStatus: {
      type: String,
      enum: [
        'notified',
        'accepted',
        'rejected',
        'scheduled',
        'collection_started',
        'collection_completed',
        'testing',
        'testing_passed',
        'testing_failed',
        'stored',
        'transfused',
        'expired'
      ],
      default: 'notified'
    },
    healthScreening: {
      conducted: {
        type: Boolean,
        default: false
      },
      conductedBy: String,
      conductedAt: Date,
      results: {
        hemoglobin: Number,
        bloodPressure: String,
        bodyTemperature: Number,
        passed: Boolean
      }
    },
    labTesting: {
      conducted: {
        type: Boolean,
        default: false
      },
      conductedBy: String,
      conductedAt: Date,
      testDate: Date,
      results: {
        bloodGroupMatch: Boolean,
        hivTest: { type: String, enum: ['negative', 'positive', 'indeterminate'] },
        hepatitisB: { type: String, enum: ['negative', 'positive', 'indeterminate'] },
        hepatitisC: { type: String, enum: ['negative', 'positive', 'indeterminate'] },
        syphilis: { type: String, enum: ['negative', 'positive', 'indeterminate'] },
        bloodCultureTest: { type: String, enum: ['negative', 'positive', 'indeterminate'] }
      },
      notes: String
    },
    verifiedByHospital: {
      verified: {
        type: Boolean,
        default: false
      },
      verificationDate: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        description: 'Hospital staff member who verified'
      }
    },
    bagNumber: {
      type: String,
      unique: true,
      sparse: true,
      description: 'Blood bag ID for tracking'
    },
    storageLocation: {
      shelf: String,
      position: String,
      temperature: Number,
      description: 'Physical storage location in blood bank'
    },
    transfusionInfo: {
      transfusedAt: Date,
      transfusedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      },
      transfusedBy: String,
      transfusionNotes: String
    },
    expiryDate: {
      type: Date,
      description: 'Blood typically expires after 42 days'
    },
    compensation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Compensation',
      description: 'Reference to donor compensation if applicable'
    },
    feedbackFromDonor: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      providedAt: Date
    },
    feedbackFromHospital: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      providedAt: Date
    },
    notes: String,
    isAnonymous: {
      type: Boolean,
      default: false,
      description: 'Anonymous donation option'
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate expiry date (42 days from collection)
donationSchema.pre('save', function (next) {
  if (this.isModified('createdAt') || !this.expiryDate) {
    const expiryDate = new Date(this.createdAt);
    expiryDate.setDate(expiryDate.getDate() + 42);
    this.expiryDate = expiryDate;
  }
  next();
});

// Indexes for common queries
donationSchema.index({ donorId: 1, donationStatus: 1 });
donationSchema.index({ hospitalId: 1 });
donationSchema.index({ requestId: 1 });
donationSchema.index({ donationStatus: 1 });
donationSchema.index({ bagNumber: 1 });
donationSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Donation', donationSchema);
