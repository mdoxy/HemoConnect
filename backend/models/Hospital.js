import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    role: {
      type: String,
      default: 'hospital',
      enum: ['hospital'],
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'hospitals',
  }
);

export default mongoose.model('Hospital', hospitalSchema);