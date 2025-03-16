const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  alertType: {
    type: String,
    enum: [
      'HighHeartRate', 'LowHeartRate',
      'HighTemperature', 'LowTemperature',
      'HighBloodPressure', 'LowBloodPressure',
      'LowOxygenSaturation',
      'HighGlucose', 'LowGlucose',
      'DeviceDisconnected',
      'Custom'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  vitalSignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VitalSign'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  thresholdValue: {
    type: Number
  },
  actualValue: {
    type: Number
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolutionTimestamp: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  },
  notifiedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationTime: Date,
    notificationMethod: {
      type: String,
      enum: ['InApp', 'Email', 'SMS']
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedTime: Date
  }],
  escalated: {
    type: Boolean,
    default: false
  },
  escalationLevel: {
    type: Number,
    default: 0
  },
  escalationTime: Date
}, {
  timestamps: true
});

// Create compound index for efficient querying
AlertSchema.index({ patientId: 1, timestamp: -1 });
AlertSchema.index({ resolved: 1, severity: 1 });
AlertSchema.index({ alertType: 1 });

module.exports = mongoose.model('Alert', AlertSchema);