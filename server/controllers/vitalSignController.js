const VitalSign = require('../models/VitalSign');
const Patient = require('../models/Patient');
const Alert = require('../models/Alert');

// @desc    Get vital signs for a patient
// @route   GET /api/vitals/patient/:patientId
// @access  Private
exports.getVitalSignsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    
    // Query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    
    // Build query
    const query = { patientId };
    
    // Add date range filters if provided
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.timestamp = { $gte: startDate };
    } else if (endDate) {
      query.timestamp = { $lte: endDate };
    }
    
    // Get total count and paginated results
    const total = await VitalSign.countDocuments(query);
    
    const vitalSigns = await VitalSign.find(query)
      .skip(startIndex)
      .limit(limit)
      .sort({ timestamp: -1 });
    
    // Calculate pagination info
    const pagination = {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    };
    
    res.status(200).json({
      success: true,
      count: vitalSigns.length,
      pagination,
      data: vitalSigns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vital signs',
      error: error.message
    });
  }
};

// @desc    Get latest vital signs for a patient
// @route   GET /api/vitals/patient/:patientId/latest
// @access  Private
exports.getLatestVitalSigns = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Get the latest vital signs
    const latestVitalSigns = await VitalSign.findOne({ patientId })
      .sort({ timestamp: -1 });
    
    if (!latestVitalSigns) {
      return res.status(404).json({
        success: false,
        message: 'No vital signs found for this patient'
      });
    }
    
    res.status(200).json({
      success: true,
      data: latestVitalSigns
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving latest vital signs',
      error: error.message
    });
  }
};

// @desc    Record new vital signs
// @route   POST /api/vitals
// @access  Private
exports.recordVitalSigns = async (req, res) => {
  try {
    const { patientId, temperature, heartRate, respiratoryRate, bloodPressure, oxygenSaturation, glucoseLevel, deviceId, recordMethod, notes } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Create new vital sign record
    const vitalSign = await VitalSign.create({
      patientId,
      temperature,
      heartRate,
      respiratoryRate,
      bloodPressure,
      oxygenSaturation,
      glucoseLevel,
      deviceId,
      recordMethod: recordMethod || 'Manual',
      notes,
      recordedBy: req.user.id
    });
    
    // Update patient's latest vitals
    patient.latestVitals = {
      timestamp: vitalSign.timestamp,
      temperature: temperature || patient.latestVitals?.temperature,
      heartRate: heartRate || patient.latestVitals?.heartRate,
      respiratoryRate: respiratoryRate || patient.latestVitals?.respiratoryRate,
      bloodPressure: bloodPressure || patient.latestVitals?.bloodPressure,
      oxygenSaturation: oxygenSaturation || patient.latestVitals?.oxygenSaturation,
      updatedAt: new Date()
    };
    
    await patient.save();
    
    // Check for abnormal vitals and create alerts if needed
    await checkVitalSignsForAlerts(vitalSign);
    
    res.status(201).json({
      success: true,
      data: vitalSign
    });
  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error recording vital signs',
      error: error.message
    });
  }
};

// @desc    Get a specific vital sign record
// @route   GET /api/vitals/:id
// @access  Private
exports.getVitalSign = async (req, res) => {
  try {
    const vitalSign = await VitalSign.findById(req.params.id);
    
    if (!vitalSign) {
      return res.status(404).json({
        success: false,
        message: 'Vital sign record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vitalSign
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving vital sign record',
      error: error.message
    });
  }
};

// @desc    Update a vital sign record
// @route   PUT /api/vitals/:id
// @access  Private
exports.updateVitalSign = async (req, res) => {
  try {
    let vitalSign = await VitalSign.findById(req.params.id);
    
    if (!vitalSign) {
      return res.status(404).json({
        success: false,
        message: 'Vital sign record not found'
      });
    }
    
    // Update vital sign record
    vitalSign = await VitalSign.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    // Re-check for alerts with updated values
    await checkVitalSignsForAlerts(vitalSign);
    
    res.status(200).json({
      success: true,
      data: vitalSign
    });
  } catch (error) {
    console.error(error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating vital sign record',
      error: error.message
    });
  }
};

// @desc    Delete a vital sign record
// @route   DELETE /api/vitals/:id
// @access  Private (Admin and Doctor only)
exports.deleteVitalSign = async (req, res) => {
  try {
    const vitalSign = await VitalSign.findById(req.params.id);
    
    if (!vitalSign) {
      return res.status(404).json({
        success: false,
        message: 'Vital sign record not found'
      });
    }
    
    await vitalSign.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vital sign record',
      error: error.message
    });
  }
};

// Helper function to check vital signs and create alerts if needed
const checkVitalSignsForAlerts = async (vitalSign) => {
  const alerts = [];
  
  // Define thresholds (these would normally be configurable in a real system)
  const thresholds = {
    heartRate: { min: 60, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
    oxygenSaturation: { min: 95, max: 100 },
    bloodPressure: {
      systolic: { min: 90, max: 140 },
      diastolic: { min: 60, max: 90 }
    },
    respiratoryRate: { min: 12, max: 20 }
  };
  
  // Check heart rate
  if (vitalSign.heartRate && vitalSign.heartRate.value) {
    if (vitalSign.heartRate.value > thresholds.heartRate.max) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'HighHeartRate',
        severity: vitalSign.heartRate.value > thresholds.heartRate.max + 20 ? 'High' : 'Medium',
        message: `High heart rate detected: ${vitalSign.heartRate.value} bpm`,
        vitalSignId: vitalSign._id,
        thresholdValue: thresholds.heartRate.max,
        actualValue: vitalSign.heartRate.value
      });
    } else if (vitalSign.heartRate.value < thresholds.heartRate.min) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'LowHeartRate',
        severity: vitalSign.heartRate.value < thresholds.heartRate.min - 15 ? 'High' : 'Medium',
        message: `Low heart rate detected: ${vitalSign.heartRate.value} bpm`,
        vitalSignId: vitalSign._id,
        thresholdValue: thresholds.heartRate.min,
        actualValue: vitalSign.heartRate.value
      });
    }
  }
  
  // Check temperature
  if (vitalSign.temperature && vitalSign.temperature.value) {
    if (vitalSign.temperature.value > thresholds.temperature.max) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'HighTemperature',
        severity: vitalSign.temperature.value > 38.5 ? 'High' : 'Medium',
        message: `High temperature detected: ${vitalSign.temperature.value}°C`,
        vitalSignId: vitalSign._id,
        thresholdValue: thresholds.temperature.max,
        actualValue: vitalSign.temperature.value
      });
    } else if (vitalSign.temperature.value < thresholds.temperature.min) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'LowTemperature',
        severity: vitalSign.temperature.value < 35 ? 'High' : 'Medium',
        message: `Low temperature detected: ${vitalSign.temperature.value}°C`,
        vitalSignId: vitalSign._id,
        thresholdValue: thresholds.temperature.min,
        actualValue: vitalSign.temperature.value
      });
    }
  }
  
  // Check oxygen saturation
  if (vitalSign.oxygenSaturation && vitalSign.oxygenSaturation.value) {
    if (vitalSign.oxygenSaturation.value < thresholds.oxygenSaturation.min) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'LowOxygenSaturation',
        severity: vitalSign.oxygenSaturation.value < 90 ? 'Critical' : 
                 vitalSign.oxygenSaturation.value < 93 ? 'High' : 'Medium',
        message: `Low oxygen saturation detected: ${vitalSign.oxygenSaturation.value}%`,
        vitalSignId: vitalSign._id,
        thresholdValue: thresholds.oxygenSaturation.min,
        actualValue: vitalSign.oxygenSaturation.value
      });
    }
  }
  
  // Check blood pressure
  if (vitalSign.bloodPressure && vitalSign.bloodPressure.systolic && vitalSign.bloodPressure.diastolic) {
    if (vitalSign.bloodPressure.systolic > thresholds.bloodPressure.systolic.max ||
        vitalSign.bloodPressure.diastolic > thresholds.bloodPressure.diastolic.max) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'HighBloodPressure',
        severity: vitalSign.bloodPressure.systolic > 180 || vitalSign.bloodPressure.diastolic > 120 ? 'Critical' :
                 vitalSign.bloodPressure.systolic > 160 || vitalSign.bloodPressure.diastolic > 100 ? 'High' : 'Medium',
        message: `High blood pressure detected: ${vitalSign.bloodPressure.systolic}/${vitalSign.bloodPressure.diastolic} mmHg`,
        vitalSignId: vitalSign._id,
        thresholdValue: `${thresholds.bloodPressure.systolic.max}/${thresholds.bloodPressure.diastolic.max}`,
        actualValue: `${vitalSign.bloodPressure.systolic}/${vitalSign.bloodPressure.diastolic}`
      });
    } else if (vitalSign.bloodPressure.systolic < thresholds.bloodPressure.systolic.min ||
              vitalSign.bloodPressure.diastolic < thresholds.bloodPressure.diastolic.min) {
      alerts.push({
        patientId: vitalSign.patientId,
        alertType: 'LowBloodPressure',
        severity: vitalSign.bloodPressure.systolic < 80 || vitalSign.bloodPressure.diastolic < 50 ? 'High' : 'Medium',
        message: `Low blood pressure detected: ${vitalSign.bloodPressure.systolic}/${vitalSign.bloodPressure.diastolic} mmHg`,
        vitalSignId: vitalSign._id,
        thresholdValue: `${thresholds.bloodPressure.systolic.min}/${thresholds.bloodPressure.diastolic.min}`,
        actualValue: `${vitalSign.bloodPressure.systolic}/${vitalSign.bloodPressure.diastolic}`
      });
    }
  }
  
  // Create alerts in database
  if (alerts.length > 0) {
    await Alert.insertMany(alerts);
  }
  
  return alerts;
};