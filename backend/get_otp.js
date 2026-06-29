import mongoose from 'mongoose';

const uri = 'mongodb+srv://moremayuri008_db_user:Paper08@blood-donation.j1zdgbp.mongodb.net/Hemoconnect?appName=blood-donation';

async function getOTP() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const user = await db.collection('users').findOne({ email: 'fagoni4537@fishnone.com' });
  if (user) {
    console.log(`Found OTP for ${user.email}: ${user.emailOTP}`);
  } else {
    console.log('User not found in users collection');
  }

  const hospital = await db.collection('hospitals').findOne({ email: 'fagoni4537@fishnone.com' });
  if (hospital) {
    console.log(`Found OTP for ${hospital.email}: ${hospital.emailOTP}`);
  } else {
    console.log('Hospital not found in hospitals collection');
  }
  
  await mongoose.disconnect();
}

getOTP().catch(console.error);
