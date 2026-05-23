import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import Requestor from '../models/Requestor.js';
import DonorApplication from '../models/Donor.js';
import Request from '../models/Request.js';
import BloodRequest from '../models/BloodRequest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
const envFiles = [
  path.resolve(__dirname, '..', '.env'),
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
];

envFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI or MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Helper to create dummy uploads
const ensureDummyUploads = () => {
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dummyFiles = [
    'dummy-aadhaar.pdf',
    'dummy-medical.pdf',
    'dummy-prescription.pdf',
    'dummy-idproof.pdf'
  ];

  dummyFiles.forEach(file => {
    const filePath = path.join(uploadsDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `Dummy file content for ${file} testing.`);
      console.log(`Created dummy upload file: uploads/${file}`);
    }
  });
};

const runSeed = async () => {
  try {
    ensureDummyUploads();

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log(`Connected to database: ${mongoose.connection.name}`);

    // Clean up existing dummy data first
    const testEmails = [
      'donor1@test.com',
      'donor2@test.com',
      'requestor1@test.com',
      'requestor2@test.com',
      'hospital1@test.com',
      'hospital2@test.com',
    ];

    console.log('Cleaning up existing dummy data...');
    // Delete users, requestors, hospitals
    await User.deleteMany({ email: { $in: testEmails } });
    await Requestor.deleteMany({ email: { $in: testEmails } });
    await Hospital.deleteMany({ email: { $in: testEmails } });

    // Find and delete donor applications and requests related to these test emails
    await DonorApplication.deleteMany({ email: { $in: testEmails } });
    await Request.deleteMany({ requesterEmail: { $in: testEmails } });
    await BloodRequest.deleteMany({ requesterEmail: { $in: testEmails } });

    console.log('Creating password hashes...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    console.log('Inserting dummy hospitals...');
    const hospital1 = new Hospital({
      hospitalName: 'City General Hospital',
      email: 'hospital1@test.com',
      password: hashedPassword,
      location: 'Mumbai Central, Mumbai',
      contactNumber: '+919876543214',
      role: 'hospital',
      verified: true,
    });

    const hospital2 = new Hospital({
      hospitalName: 'Apollo Care Hospital',
      email: 'hospital2@test.com',
      password: hashedPassword,
      location: 'Connaught Place, New Delhi',
      contactNumber: '+919876543215',
      role: 'hospital',
      verified: true,
    });

    await hospital1.save();
    await hospital2.save();
    console.log('✓ Seeded hospitals');

    console.log('Inserting dummy donors (User)...');
    const donor1 = new User({
      name: 'Rahul Sharma',
      email: 'donor1@test.com',
      password: hashedPassword,
      role: 'donor',
      bloodType: 'O+',
      phone: '+919876543210',
      location: 'Andheri West, Mumbai',
      verified: true,
    });

    const donor2 = new User({
      name: 'Priya Patel',
      email: 'donor2@test.com',
      password: hashedPassword,
      role: 'donor',
      bloodType: 'A-',
      phone: '+919876543211',
      location: 'Saket, New Delhi',
      verified: true,
    });

    await donor1.save();
    await donor2.save();
    console.log('✓ Seeded donors in User collection');

    console.log('Inserting dummy requestors (User & Requestor collections for compatibility)...');
    const requestor1Id = new mongoose.Types.ObjectId();
    const requestor2Id = new mongoose.Types.ObjectId();

    // In User collection
    const requestor1User = new User({
      _id: requestor1Id,
      name: 'Amit Kumar',
      email: 'requestor1@test.com',
      password: hashedPassword,
      role: 'requestor',
      phone: '+919876543212',
      location: 'Indiranagar, Bangalore',
      verified: true,
    });

    const requestor2User = new User({
      _id: requestor2Id,
      name: 'Sneha Reddy',
      email: 'requestor2@test.com',
      password: hashedPassword,
      role: 'requestor',
      phone: '+919876543213',
      location: 'Gachibowli, Hyderabad',
      verified: true,
    });

    await requestor1User.save();
    await requestor2User.save();

    // In Requestor collection
    const requestor1Req = new Requestor({
      _id: requestor1Id,
      name: 'Amit Kumar',
      email: 'requestor1@test.com',
      phone: '+919876543212',
      password: hashedPassword,
      role: 'requestor',
    });

    const requestor2Req = new Requestor({
      _id: requestor2Id,
      name: 'Sneha Reddy',
      email: 'requestor2@test.com',
      phone: '+919876543213',
      password: hashedPassword,
      role: 'requestor',
    });

    await requestor1Req.save();
    await requestor2Req.save();
    console.log('✓ Seeded requestors in both User and Requestor collections');

    console.log('Inserting dummy donor applications...');
    // Approved donor application for donor1 (Rahul Sharma)
    const donorApp1 = new DonorApplication({
      userId: donor1._id,
      fullName: donor1.name,
      email: donor1.email,
      phone: donor1.phone,
      bloodGroup: donor1.bloodType,
      eligibilityAnswers: {
        healthyToday: true,
        donatedLast3Months: false,
        testedPositive: false,
        pregnantOrBreastfeeding: false,
        chronicIllness: false,
      },
      aadhaarFilePath: 'uploads/dummy-aadhaar.pdf',
      medicalReportFilePath: 'uploads/dummy-medical.pdf',
      status: 'Approved',
      hospitalRemarks: 'Verified all documents. Looks good to donate.',
      scheduledDate: '2026-06-01',
      scheduledTime: '10:00 AM',
      scheduledAt: new Date(),
    });

    // Pending donor application for donor2 (Priya Patel)
    const donorApp2 = new DonorApplication({
      userId: donor2._id,
      fullName: donor2.name,
      email: donor2.email,
      phone: donor2.phone,
      bloodGroup: donor2.bloodType,
      eligibilityAnswers: {
        healthyToday: true,
        donatedLast3Months: false,
        testedPositive: false,
        pregnantOrBreastfeeding: false,
        chronicIllness: false,
      },
      aadhaarFilePath: 'uploads/dummy-aadhaar.pdf',
      medicalReportFilePath: 'uploads/dummy-medical.pdf',
      status: 'Pending',
    });

    await donorApp1.save();
    await donorApp2.save();
    console.log('✓ Seeded donor applications');

    console.log('Inserting dummy requests and legacy blood requests...');
    // Pending request for requestor1 (Amit Kumar)
    const request1 = new Request({
      requestorId: requestor1Id,
      userId: requestor1Id,
      hospitalId: hospital1._id.toString(),
      patientName: 'Ramesh Kumar',
      age: 45,
      gender: 'Male',
      bloodGroup: 'B+',
      unitsRequired: 2,
      hospitalName: hospital1.hospitalName,
      requiredDate: '2026-05-30',
      reason: 'Scheduled major heart surgery',
      prescriptionFilePath: 'uploads/dummy-prescription.pdf',
      idProofFilePath: 'uploads/dummy-idproof.pdf',
      status: 'Pending',
      requesterName: requestor1User.name,
      requesterEmail: requestor1User.email,
      requesterPhone: requestor1User.phone,
    });

    // Legacy blood request duplicate for compatibility
    const legacyRequest1 = new BloodRequest({
      userId: requestor1Id,
      hospitalId: hospital1._id.toString(),
      patientName: 'Ramesh Kumar',
      age: 45,
      gender: 'Male',
      bloodGroup: 'B+',
      unitsRequired: 2,
      hospitalName: hospital1.hospitalName,
      requiredDate: '2026-05-30',
      reason: 'Scheduled major heart surgery',
      prescriptionFilePath: 'uploads/dummy-prescription.pdf',
      idProofFilePath: 'uploads/dummy-idproof.pdf',
      status: 'Pending',
      requesterName: requestor1User.name,
      requesterEmail: requestor1User.email,
      requesterPhone: requestor1User.phone,
    });

    // Approved request for requestor2 (Sneha Reddy)
    const request2 = new Request({
      requestorId: requestor2Id,
      userId: requestor2Id,
      hospitalId: hospital2._id.toString(),
      patientName: 'Kiran Reddy',
      age: 32,
      gender: 'Female',
      bloodGroup: 'O-',
      unitsRequired: 3,
      hospitalName: hospital2.hospitalName,
      requiredDate: '2026-05-28',
      reason: 'Severe anemia transfusion',
      prescriptionFilePath: 'uploads/dummy-prescription.pdf',
      idProofFilePath: 'uploads/dummy-idproof.pdf',
      status: 'Approved',
      hospitalRemarks: 'Units allocated and ready for pickup.',
      requesterName: requestor2User.name,
      requesterEmail: requestor2User.email,
      requesterPhone: requestor2User.phone,
    });

    // Legacy blood request duplicate for compatibility
    const legacyRequest2 = new BloodRequest({
      userId: requestor2Id,
      hospitalId: hospital2._id.toString(),
      patientName: 'Kiran Reddy',
      age: 32,
      gender: 'Female',
      bloodGroup: 'O-',
      unitsRequired: 3,
      hospitalName: hospital2.hospitalName,
      requiredDate: '2026-05-28',
      reason: 'Severe anemia transfusion',
      prescriptionFilePath: 'uploads/dummy-prescription.pdf',
      idProofFilePath: 'uploads/dummy-idproof.pdf',
      status: 'Approved',
      hospitalRemarks: 'Units allocated and ready for pickup.',
      requesterName: requestor2User.name,
      requesterEmail: requestor2User.email,
      requesterPhone: requestor2User.phone,
    });

    await request1.save();
    await legacyRequest1.save();
    await request2.save();
    await legacyRequest2.save();
    console.log('✓ Seeded requests and legacy blood requests');

    console.log('\n=========================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('=========================================');
    console.log('Credentials for Testing (all passwords are "password123"):');
    console.log('-----------------------------------------');
    console.log('1. Hospitals:');
    console.log('   - City General Hospital: hospital1@test.com');
    console.log('   - Apollo Care Hospital:  hospital2@test.com');
    console.log('2. Donors:');
    console.log('   - Rahul Sharma (O+, Appr): donor1@test.com');
    console.log('   - Priya Patel  (A-, Pend): donor2@test.com');
    console.log('3. Requestors:');
    console.log('   - Amit Kumar   (Req B+, Pend): requestor1@test.com');
    console.log('   - Sneha Reddy  (Req O-, Appr): requestor2@test.com');
    console.log('=========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runSeed();
