const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor must be associated with a user'],
      unique: true
    },
    bloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      required: [true, 'Blood group is required']
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'unavailable', 'cooldown'],
      default: 'available',
      description: 'available: ready to donate, unavailable: not ready, cooldown: recently donated'
    },
    lastDonationDate: {
      type: Date,
      default: null,
      description: 'Donors can typically donate every 56 days'
    },
    totalDonations: {
      type: Number,
      default: 0,
      min: 0
    },
    nextEligibleDonationDate: {
      type: Date,
      default: null,
      description: 'Calculated based on 56-day interval from last donation'
    },
    healthDeclaration: {
      type: {
        hasChronicDisease: Boolean,
        hasBoneMarrowDisease: Boolean,
        hasInfectiousDisease: Boolean,
        hasUndergoSurgery: Boolean,
        surgeryDate: Date,
        medications: [String]
      },
      default: {}
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    verified: {
      type: Boolean,
      default: false,
      description: 'Verified by hospital after first donation'
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
      description: 'Based on reliability and donation history'
    },
    preferences: {
      notificationsByEmail: {
        type: Boolean,
        default: true
      },
      notificationsBySMS: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Auto-update availabilityStatus based on lastDonationDate
donorSchema.pre('save', function (next) {
  if (this.lastDonationDate) {
    const cooldownPeriod = 56; // days
    const nextEligible = new Date(this.lastDonationDate);
    nextEligible.setDate(nextEligible.getDate() + cooldownPeriod);
    
    this.nextEligibleDonationDate = nextEligible;
    
    if (nextEligible > new Date()) {
      this.availabilityStatus = 'cooldown';
    } else {
      this.availabilityStatus = 'available';
    }
  }
  next();
});

// Index for blood group searches
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ availabilityStatus: 1 });
donorSchema.index({ userId: 1 });

module.exports = mongoose.model('Donor', donorSchema);
