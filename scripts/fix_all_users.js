require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const connectDB = require('../server/utils/db');

async function fixAllUsers() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find().select('+password');
    console.log(`Found ${users.length} users in the database`);
    
    if (users.length === 0) {
      console.log('No users found. Creating sample users...');
      
      // Sample user data
      const sampleUsers = [
        { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
        { name: 'Doctor User', email: 'doctor@example.com', role: 'doctor' },
        { name: 'Nurse User', email: 'nurse@example.com', role: 'nurse' }
      ];
      
      // Create users with fresh passwords
      for (const user of sampleUsers) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        await User.create({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role
        });
        
        console.log(`Created new user: ${user.email}`);
      }
    } else {
      // Update all existing users
      for (const user of users) {
        // Reset their password to 'password123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        user.password = hashedPassword;
        await user.save();
        
        console.log(`Updated password for user: ${user.email}`);
      }
    }
    
    console.log('All user accounts have been fixed!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error fixing users:', error);
  }
}

fixAllUsers();