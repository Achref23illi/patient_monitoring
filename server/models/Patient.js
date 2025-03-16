const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  contactInformation: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },
  medicalHistory: [{
    condition: String,
    diagnosisDate: Date,
    notes: String
  }],
  allergies: [{
    allergen: String,
    reaction: String,
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening']
    }
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date
  }],
  latestVitals: {
    timestamp: Date,
    temperature: Number,
    heartRate: Number,
    respiratoryRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    oxygenSaturation: Number,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Discharged', 'Critical', 'Stable', 'Under Observation'],
    default: 'Active'
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
PatientSchema.index({ name: 1 });
PatientSchema.index({ 'contactInformation.phone': 1 });
PatientSchema.index({ 'contactInformation.email': 1 });
PatientSchema.index({ status: 1 });

module.exports = mongoose.model('Patient', PatientSchema);