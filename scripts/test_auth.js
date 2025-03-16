require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');
const bcrypt = require('bcryptjs');
const connectDB = require('../server/utils/db');

async function testAuth() {
  try {
    // Connect to database
    await connectDB();
    
    console.log('Connected to MongoDB');
    
    // Try to find user
    const email = 'doctor@example.com';
    const password = 'password123';
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`User with email ${email} not found in the database`);
      
      // Create a test user
      console.log('Creating a test user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = await User.create({
        name: 'Test Doctor',
        email: email,
        password: hashedPassword,
        role: 'doctor'
      });
      
      console.log(`Test user created with id: ${newUser._id}`);
    } else {
      console.log(`User found: ${user.name}`);
      
      // Test password matching
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (isMatch) {
        console.log('Password matches! Authentication would succeed.');
      } else {
        console.log('Password does NOT match. Authentication would fail.');
        
        // Update the password
        console.log('Updating password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        user.password = hashedPassword;
        await user.save();
        
        console.log('Password updated successfully');
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error testing authentication:', error);
  }
}

testAuth();