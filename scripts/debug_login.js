require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const connectDB = require('../server/utils/db');

async function debugLogin() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Test login credentials
    const email = 'doctor@example.com';
    const password = 'password123';
    
    console.log(`Testing login for: ${email} with password: ${password}`);
    
    // Step 1: Check if user exists
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.error(`User with email ${email} not found in database!`);
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email}) with role: ${user.role}`);
    console.log(`User is ${user.active ? 'active' : 'inactive'}`);
    
    // Step 2: Check the password directly with bcrypt
    console.log('Stored password hash:', user.password);
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match result: ${isMatch}`);
    
    // Step 3: Check the matchPassword method if available
    if (typeof user.matchPassword === 'function') {
      const methodMatch = await user.matchPassword(password);
      console.log(`matchPassword method result: ${methodMatch}`);
    } else {
      console.log('matchPassword method not available on user object');
    }
    
    // Step 4: Create a new hash for testing
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, salt);
    console.log('Newly generated hash:', newHash);
    
    // Step 5: Compare against new hash
    const newHashMatch = await bcrypt.compare(password, newHash);
    console.log(`New hash match result: ${newHashMatch}`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error debugging login:', error);
  }
}

debugLogin();