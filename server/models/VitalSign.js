const mongoose = require('mongoose');

const VitalSignSchema = new mongoose.Schema({
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
  temperature: {
    value: {
      type: Number,
      min: 30,
      max: 45
    },
    unit: {
      type: String,
      enum: ['°C', '°F'],
      default: '°C'
    }
  },
  heartRate: {
    value: {
      type: Number,
      min: 0,
      max: 300
    },
    unit: {
      type: String,
      default: 'bpm'
    }
  },
  respiratoryRate: {
    value: {
      type: Number,
      min: 0,
      max: 100
    },
    unit: {
      type: String,
      default: 'breaths/min'
    }
  },
  bloodPressure: {
    systolic: {
      type: Number,
      min: 0,
      max: 300
    },
    diastolic: {
      type: Number,
      min: 0,
      max: 200
    },
    unit: {
      type: String,
      default: 'mmHg'
    }
  },
  oxygenSaturation: {
    value: {
      type: Number,
      min: 0,
      max: 100
    },
    unit: {
      type: String,
      default: '%'
    }
  },
  glucoseLevel: {
    value: {
      type: Number,
      min: 0,
      max: 1000
    },
    unit: {
      type: String,
      enum: ['mg/dL', 'mmol/L'],
      default: 'mg/dL'
    }
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordMethod: {
    type: String,
    enum: ['Automatic', 'Manual'],
    default: 'Automatic'
  }
}, {
  timestamps: true
});

// Create a compound index for efficient querying by patient and time range
VitalSignSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('VitalSign', VitalSignSchema);