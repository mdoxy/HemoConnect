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
    // GeoJSON Point — [longitude, latitude]
    // Required for $near geospatial queries in the live emergency feed.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: null,
      },
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
    // ── Priority System Fields ─────────────────────────────────────────────────
    priorityScore: {
      type: Number,
      default: 0,
    },
    // Derived label from score: critical | high | medium | low
    // Updated whenever priorityScore changes (creation + escalation).
    priorityLevel: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'low',
    },
    emergency: {
      type: Boolean,
      default: false,
    },
    hoursLeft: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'requests',
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// 2dsphere index enables $near geospatial queries for the live emergency feed
requestSchema.index({ location: '2dsphere' });
// Compound index: fast lookup by status + priority for the emergency dashboard
requestSchema.index({ status: 1, priorityScore: -1 });

export default mongoose.model('Request', requestSchema);