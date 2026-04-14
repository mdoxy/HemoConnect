import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    requestorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Requestor',
      required: true,
    },
    // Backward-compatible alias used by existing UI/components.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    hospitalId: {
      type: String,
      default: null,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
    },
    unitsRequired: {
      type: Number,
      required: true,
      min: 1,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    requiredDate: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    prescriptionFilePath: {
      type: String,
      required: true,
    },
    idProofFilePath: {
      type: String,
      default: null,
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
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },
    requesterEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    requesterPhone: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'requests',
  }
);

export default mongoose.model('Request', requestSchema);