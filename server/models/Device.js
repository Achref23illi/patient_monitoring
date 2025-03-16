const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceType: {
    type: String,
    enum: [
      'HeartRateMonitor',
      'BloodPressureMonitor',
      'OxygenSaturationMonitor',
      'GlucoseMonitor',
      'TemperatureMonitor',
      'ECGMonitor',
      'WearableDevice',
      'Other'
    ],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  assignedLocation: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Disconnected'],
    default: 'Active'
  },
  connectionStatus: {
    type: String,
    enum: ['Connected', 'Disconnected', 'Intermittent'],
    default: 'Disconnected'
  },
  lastConnected: {
    type: Date
  },
  lastReading: {
    type: Date
  },
  lastCalibrated: {
    type: Date
  },
  nextCalibrationDue: {
    type: Date
  },
  firmwareVersion: {
    type: String
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  ipAddress: {
    type: String
  },
  macAddress: {
    type: String
  },
  notes: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
DeviceSchema.index({ serialNumber: 1 });
DeviceSchema.index({ deviceType: 1, status: 1 });
DeviceSchema.index({ patientId: 1, connectionStatus: 1 });

module.exports = mongoose.model('Device', DeviceSchema);