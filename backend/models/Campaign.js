const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Campaign description is required']
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer is required'],
      description: 'Hospital or organization organizing the campaign'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function (v) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Invalid coordinates'
        }
      },
      address: String,
      city: String,
      state: String
    },
    campaignDate: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      endDate: {
        type: Date,
        required: [true, 'End date is required']
      }
    },
    targetBloodGroups: [
      {
        type: String,
        enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'all']
      }
    ],
    targetDonors: {
      type: Number,
      description: 'Target number of donors for this campaign'
    },
    registeredDonors: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donor'
        },
        registeredAt: {
          type: Date,
          default: Date.now
        },
        slotTime: Date,
        attended: {
          type: Boolean,
          default: false
        },
        donated: {
          type: Boolean,
          default: false
        },
        donationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donation',
          description: 'If donation was completed'
        }
      }
    ],
    successMetrics: {
      totalRegistered: {
        type: Number,
        default: 0
      },
      totalAttended: {
        type: Number,
        default: 0
      },
      totalDonated: {
        type: Number,
        default: 0
      },
      totalUnitsCollected: {
        type: Number,
        default: 0
      }
    },
    type: {
      type: String,
      enum: ['emergency', 'planned', 'seasonal', 'community', 'corporate'],
      default: 'planned'
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    cancellationReason: String,
    images: [
      {
        url: String,
        caption: String,
        uploadedAt: Date
      }
    ],
    contact: {
      name: String,
      phone: String,
      email: String
    },
    incentives: {
      hasIncentives: {
        type: Boolean,
        default: false
      },
      description: String,
      terms: String
    },
    partneredHospitals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
      }
    ],
    visibility: {
      type: String,
      enum: ['public', 'private', 'invited'],
      default: 'public'
    },
    announcement: String,
    tags: [String],
    socialMedia: {
      hashtag: String,
      facebookLink: String,
      instagramLink: String,
      twitterLink: String
    }
  },
  {
    timestamps: true
  }
);

// Geospatial index
campaignSchema.index({ 'location.coordinates': '2dsphere' });
campaignSchema.index({ status: 1 });
campaignSchema.index({ 'campaignDate.startDate': 1 });
campaignSchema.index({ organizer: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
