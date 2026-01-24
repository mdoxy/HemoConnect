const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
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
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: [true, 'Urgency level is required']
    },
    requiredUnits: {
      type: Number,
      required: [true, 'Number of units is required'],
      min: [1, 'At least 1 unit is required'],
      max: [10, 'Maximum 10 units can be requested']
    },
    unitsMatched: {
      type: Number,
      default: 0,
      description: 'Number of matched units'
    },
    unitsFulfilled: {
      type: Number,
      default: 0,
      description: 'Number of actually received units'
    },
    status: {
      type: String,
      enum: ['pending', 'matched', 'partial_fulfilled', 'fulfilled', 'cancelled'],
      default: 'pending'
    },
    cancellationReason: {
      type: String,
      description: 'Reason if request was cancelled'
    },
    matchedDonors: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donor'
        },
        donationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donation'
        },
        status: {
          type: String,
          enum: ['matched', 'accepted', 'rejected', 'completed'],
          default: 'matched'
        },
        matchScore: {
          type: Number,
          description: 'Proximity and compatibility score'
        },
        notifiedAt: Date,
        respondedAt: Date
      }
    ],
    medicalReason: {
      type: String,
      required: false,
      description: 'Medical condition for which blood is needed'
    },
    requestingDoctor: {
      name: String,
      registrationNumber: String,
      phone: String,
      email: String
    },
    deliveryDetails: {
      preferredDeliveryTime: Date,
      deliveryAddress: String,
      specialInstructions: String
    },
    priority: {
      type: Boolean,
      default: false,
      description: 'If marked as VIP/priority'
    },
    estimatedFulfillmentDate: Date,
    actualFulfillmentDate: Date,
    notes: String
  },
  {
    timestamps: true
  }
);

// Auto-update status based on units fulfilled
bloodRequestSchema.pre('save', function (next) {
  if (this.unitsFulfilled === 0) {
    this.status = 'pending';
  } else if (this.unitsFulfilled < this.requiredUnits) {
    this.status = 'partial_fulfilled';
  } else if (this.unitsFulfilled >= this.requiredUnits) {
    this.status = 'fulfilled';
  }
  next();
});

// Indexes for common queries
bloodRequestSchema.index({ hospitalId: 1, status: 1 });
bloodRequestSchema.index({ patientId: 1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ urgencyLevel: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
