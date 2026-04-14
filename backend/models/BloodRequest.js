import mongoose from 'mongoose';

const BloodRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hospitalId: {
      type: String,
    },
    patientName: {
      type: String,
      required: true,
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
    },
    unitsRequired: {
      type: Number,
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    requiredDate: {
      type: String,
    },
    reason: {
      type: String,
    },
    prescriptionFilePath: String,
    idProofFilePath: String,
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
    requesterName: String,
    requesterEmail: String,
    requesterPhone: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('BloodRequest', BloodRequestSchema);
