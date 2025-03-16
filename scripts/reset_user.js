require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const connectDB = require('../server/utils/db');

async function resetUser() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Delete existing user
    const email = 'doctor@example.com';
    await User.deleteOne({ email });
    console.log(`Deleted user with email: ${email}`);
    
    // Create new user directly
    const newUser = new User({
      name: 'Doctor User',
      email: 'doctor@example.com',
      password: 'password123',  // This will get hashed by the pre-save hook
      role: 'doctor'
    });
    
    // Save the user
    await newUser.save();
    console.log(`Created new user: ${newUser.email} with ID: ${newUser._id}`);
    
    // Verify user was created correctly
    const verifyUser = await User.findOne({ email }).select('+password');
    console.log(`Verified user exists: ${verifyUser.name} (${verifyUser.email})`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting user:', error);
  }
}

resetUser();