const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Hospital must be associated with a user'],
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true
    },
    registrationNumber: {
      type: String,
      required: [true, 'Hospital registration number is required'],
      unique: true,
      description: 'Government registration or accreditation number'
    },
    address: {
      street: String,
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      postalCode: String,
      country: {
        type: String,
        default: 'India'
      }
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
      }
    },
    contactInfo: {
      mainPhone: {
        type: String,
        required: true
      },
      emergencyPhone: String,
      email: {
        type: String,
        required: true
      },
      website: String
    },
    bloodBankHead: {
      name: String,
      designation: String,
      phone: String,
      email: String
    },
    isVerified: {
      type: Boolean,
      default: false,
      description: 'Verified by admin'
    },
    accreditations: [
      {
        name: String,
        issuer: String,
        expiryDate: Date
      }
    ],
    inventory: {
      'O+': { type: Number, default: 0 },
      'O-': { type: Number, default: 0 },
      'A+': { type: Number, default: 0 },
      'A-': { type: Number, default: 0 },
      'B+': { type: Number, default: 0 },
      'B-': { type: Number, default: 0 },
      'AB+': { type: Number, default: 0 },
      'AB-': { type: Number, default: 0 },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    capacity: {
      maxDonationsPerDay: {
        type: Number,
        default: 50
      },
      maxRequestsPerMonth: {
        type: Number,
        default: 500
      }
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    services: [
      {
        type: String,
        enum: [
          'blood_collection',
          'blood_testing',
          'blood_storage',
          'transfusion_services',
          'plasma_collection',
          'platelets_collection'
        ]
      }
    ],
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    totalRequests: {
      type: Number,
      default: 0
    },
    stats: {
      donationsThisMonth: {
        type: Number,
        default: 0
      },
      requestsFulfilled: {
        type: Number,
        default: 0
      },
      averageResponseTime: {
        type: Number,
        description: 'In minutes'
      }
    }
  },
  {
    timestamps: true
  }
);

// Geospatial index for location-based queries
hospitalSchema.index({ 'location.coordinates': '2dsphere' });
hospitalSchema.index({ isVerified: 1 });
hospitalSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);
