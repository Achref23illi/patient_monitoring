require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const Patient = require('../server/models/Patient');

const connectDB = require('../server/utils/db');

// Connect to database
connectDB();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Doctor User',
    email: 'doctor@example.com',
    password: 'password123',
    role: 'doctor'
  },
  {
    name: 'Nurse User',
    email: 'nurse@example.com',
    password: 'password123',
    role: 'nurse'
  }
];

const patients = [
  {
    name: 'John Doe',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'Male',
    contactInformation: {
      address: '123 Main St',
      phone: '555-123-4567',
      email: 'john@example.com'
    },
    status: 'Active'
  },
  {
    name: 'Jane Smith',
    dateOfBirth: new Date('1975-10-20'),
    gender: 'Female',
    contactInformation: {
      address: '456 Elm St',
      phone: '555-987-6543',
      email: 'jane@example.com'
    },
    status: 'Stable'
  },
  {
    name: 'Robert Johnson',
    dateOfBirth: new Date('1965-03-12'),
    gender: 'Male',
    contactInformation: {
      address: '789 Oak St',
      phone: '555-246-8135',
      email: 'robert@example.com'
    },
    status: 'Critical'
  },
  {
    name: 'Sarah Williams',
    dateOfBirth: new Date('1990-11-28'),
    gender: 'Female',
    contactInformation: {
      address: '321 Pine St',
      phone: '555-369-1478',
      email: 'sarah@example.com'
    },
    status: 'Under Observation'
  }
];

// Seed database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      
      createdUsers.push(newUser);
      console.log(`Created user: ${user.email}`);
    }

    // Create patients
    for (const patient of patients) {
      await Patient.create({
        ...patient,
        createdBy: createdUsers[0]._id
      });
      console.log(`Created patient: ${patient.name}`);
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();