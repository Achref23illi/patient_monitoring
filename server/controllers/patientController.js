const Patient = require('../models/Patient');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
exports.getPatients = async (req, res) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Search and filtering options
    const searchOptions = {};
    
    // Filter by name if provided
    if (req.query.name) {
      searchOptions.name = { $regex: req.query.name, $options: 'i' };
    }
    
    // Filter by status if provided
    if (req.query.status) {
      searchOptions.status = req.query.status;
    }
    
    // Get total count and paginated results
    const total = await Patient.countDocuments(searchOptions);
    const patients = await Patient.find(searchOptions)
      .skip(startIndex)
      .limit(limit)
      .sort({ name: 1 });
    
    // Calculate pagination info
    const pagination = {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    };
    
    res.status(200).json({
      success: true,
      count: patients.length,
      pagination,
      data: patients
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving patients',
      error: error.message
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving patient',
      error: error.message
    });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
exports.createPatient = async (req, res) => {
  try {
    // Add creator info
    req.body.createdBy = req.user.id;
    
    const patient = await Patient.create(req.body);
    
    res.status(201).json({
      success: true,
      data: patient
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
      message: 'Error creating patient',
      error: error.message
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Update patient
    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: patient
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
      message: 'Error updating patient',
      error: error.message
    });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin and Doctor only)
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    await patient.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
};

// @desc    Update patient vital signs
// @route   PUT /api/patients/:id/vitals
// @access  Private
exports.updatePatientVitals = async (req, res) => {
  try {
    const { temperature, heartRate, respiratoryRate, bloodPressure, oxygenSaturation } = req.body;
    
    // Find patient
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Update latest vitals
    patient.latestVitals = {
      timestamp: new Date(),
      temperature,
      heartRate,
      respiratoryRate,
      bloodPressure,
      oxygenSaturation,
      updatedAt: new Date()
    };
    
    await patient.save();
    
    res.status(200).json({
      success: true,
      data: patient.latestVitals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating patient vitals',
      error: error.message
    });
  }
};