const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient must be associated with a user'],
      unique: true
    },
    medicalRecordNumber: {
      type: String,
      unique: true,
      sparse: true,
      description: 'Hospital-assigned patient ID'
    },
    requiredBloodGroup: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      required: [true, 'Required blood group must be specified']
    },
    bloodGroupCompatibility: {
      type: [String],
      description: 'Compatible blood groups that can be transfused'
    },
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: [true, 'Urgency level is required'],
      description: 'low: elective, medium: planned, high: urgent, critical: life-threatening'
    },
    medicalCondition: {
      type: String,
      required: false,
      description: 'Brief description of patient condition (optional)'
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Number of units required must be specified'],
      min: [1, 'At least 1 unit is required'],
      max: [10, 'Maximum 10 units can be requested at once']
    },
    currentHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital must be specified'],
      description: 'Hospital where patient is admitted'
    },
    admissionDate: {
      type: Date,
      required: [true, 'Admission date is required']
    },
    hospitalContactPerson: {
      name: String,
      phone: String,
      designation: String
    },
    medicalDocumentation: {
      prescriptionDocument: {
        type: String,
        description: 'URL or file path to prescription'
      },
      labReports: [String],
      consentFormSigned: {
        type: Boolean,
        default: false,
        description: 'Informed consent must be obtained'
      }
    },
    guarantor: {
      name: String,
      relationship: String,
      phone: String,
      aadharId: String,
      description: 'Person responsible for payment'
    },
    activeRequests: {
      type: Number,
      default: 0,
      description: 'Number of active blood requests'
    },
    requestHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Calculate compatible blood groups based on required blood group
patientSchema.pre('save', function (next) {
  const bloodGroupMap = {
    'O+': ['O+', 'O-'],
    'O-': ['O-'],
    'A+': ['A+', 'A-', 'O+', 'O-'],
    'A-': ['A-', 'O-'],
    'B+': ['B+', 'B-', 'O+', 'O-'],
    'B-': ['B-', 'O-'],
    'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
    'AB-': ['AB-', 'A-', 'B-', 'O-']
  };

  this.bloodGroupCompatibility = bloodGroupMap[this.requiredBloodGroup] || [];
  next();
});

// Indexes
patientSchema.index({ currentHospital: 1 });
patientSchema.index({ urgencyLevel: 1 });
patientSchema.index({ userId: 1 });
patientSchema.index({ medicalRecordNumber: 1 });

module.exports = mongoose.model('Patient', patientSchema);
