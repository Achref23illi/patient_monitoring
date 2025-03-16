const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/patient-monitor');
    console.log('MongoDB connection successful!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

testConnection();