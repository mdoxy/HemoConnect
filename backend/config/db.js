import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const { MONGO_URI, MONGODB_URI } = process.env;
    const mongoUri = MONGO_URI || MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    
    const dbName = connection.connection.name;
    const dbHost = connection.connection.host;
    
    console.log('\nMongoDB Atlas connected');
    console.log(`Database: ${dbName}`);
    console.log(`Host: ${dbHost}`);
    
    // Verify we're using the correct database
    if (dbName === 'Hemoconnect') {
      console.log('✓ Confirmed: Connected to Hemoconnect database\n');
    } else {
      console.warn(`Connected to ${dbName} \n`);
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

export default connectDB;
