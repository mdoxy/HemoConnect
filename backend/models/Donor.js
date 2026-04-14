import mongoose from 'mongoose';

const DonorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
    eligibilityAnswers: {
      healthyToday: {
        type: Boolean,
        required: true,
      },
      donatedLast3Months: {
        type: Boolean,
        required: true,
      },
      testedPositive: {
        type: Boolean,
        required: true,
      },
      pregnantOrBreastfeeding: {
        type: Boolean,
        required: true,
      },
      chronicIllness: {
        type: Boolean,
        required: true,
      },
    },
    aadhaarFilePath: {
      type: String,
      required: true,
    },
    medicalReportFilePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    hospitalRemarks: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    scheduledDate: {
      type: String,
      default: null,
    },
    scheduledTime: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'donorapplications',
  }
);

export default mongoose.model('DonorApplication', DonorApplicationSchema);
