const Alert = require('../models/Alert');
const Patient = require('../models/Patient');

// @desc    Get all alerts
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
  try {
    // Implement pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Search and filtering options
    const searchOptions = {};
    
    // Filter by resolved status if provided
    if (req.query.resolved !== undefined) {
      searchOptions.resolved = req.query.resolved === 'true';
    }
    
    // Filter by severity if provided
    if (req.query.severity) {
      searchOptions.severity = req.query.severity;
    }
    
    // Filter by alert type if provided
    if (req.query.alertType) {
      searchOptions.alertType = req.query.alertType;
    }
    
    // Time range filtering
    if (req.query.startDate || req.query.endDate) {
      searchOptions.timestamp = {};
      
      if (req.query.startDate) {
        searchOptions.timestamp.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        searchOptions.timestamp.$lte = new Date(req.query.endDate);
      }
    }
    
    // Get total count and paginated results
    const total = await Alert.countDocuments(searchOptions);
    
    const alerts = await Alert.find(searchOptions)
      .populate('patientId', 'name')
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
      count: alerts.length,
      pagination,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving alerts',
      error: error.message
    });
  }
};

// @desc    Get alerts for a specific patient
// @route   GET /api/alerts/patient/:patientId
// @access  Private
exports.getPatientAlerts = async (req, res) => {
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
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Search and filtering options
    const searchOptions = { patientId };
    
    // Filter by resolved status if provided
    if (req.query.resolved !== undefined) {
      searchOptions.resolved = req.query.resolved === 'true';
    }
    
    // Filter by severity if provided
    if (req.query.severity) {
      searchOptions.severity = req.query.severity;
    }
    
    // Time range filtering
    if (req.query.startDate || req.query.endDate) {
      searchOptions.timestamp = {};
      
      if (req.query.startDate) {
        searchOptions.timestamp.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        searchOptions.timestamp.$lte = new Date(req.query.endDate);
      }
    }
    
    // Get total count and paginated results
    const total = await Alert.countDocuments(searchOptions);
    
    const alerts = await Alert.find(searchOptions)
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
      count: alerts.length,
      pagination,
      data: alerts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving patient alerts',
      error: error.message
    });
  }
};

// @desc    Get a specific alert
// @route   GET /api/alerts/:id
// @access  Private
exports.getAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('vitalSignId')
      .populate('resolvedBy', 'name');
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving alert',
      error: error.message
    });
  }
};

// @desc    Resolve an alert
// @route   PUT /api/alerts/:id/resolve
// @access  Private
exports.resolveAlert = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    
    let alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    // Update alert
    alert.resolved = true;
    alert.resolutionTimestamp = new Date();
    alert.resolvedBy = req.user.id;
    
    if (resolutionNotes) {
      alert.resolutionNotes = resolutionNotes;
    }
    
    await alert.save();
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
      error: error.message
    });
  }
};

// @desc    Create a manual alert
// @route   POST /api/alerts
// @access  Private
exports.createAlert = async (req, res) => {
  try {
    const { patientId, alertType, severity, message, vitalSignId } = req.body;
    
    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Create alert
    const alert = await Alert.create({
      patientId,
      alertType: alertType || 'Custom',
      severity: severity || 'Medium',
      message,
      vitalSignId,
      // Add the user who created this alert to the notified users list
      notifiedUsers: [{
        userId: req.user.id,
        notificationTime: new Date(),
        notificationMethod: 'InApp',
        acknowledged: true,
        acknowledgedTime: new Date()
      }]
    });
    
    res.status(201).json({
      success: true,
      data: alert
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
      message: 'Error creating alert',
      error: error.message
    });
  }
};

// @desc    Acknowledge an alert notification
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
exports.acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    // Check if this user has already been notified
    const notifiedUserIndex = alert.notifiedUsers.findIndex(
      user => user.userId.toString() === req.user.id
    );
    
    if (notifiedUserIndex === -1) {
      // Add user to notified users
      alert.notifiedUsers.push({
        userId: req.user.id,
        notificationTime: new Date(),
        notificationMethod: 'InApp',
        acknowledged: true,
        acknowledgedTime: new Date()
      });
    } else {
      // Update existing notification
      alert.notifiedUsers[notifiedUserIndex].acknowledged = true;
      alert.notifiedUsers[notifiedUserIndex].acknowledgedTime = new Date();
    }
    
    await alert.save();
    
    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert',
      error: error.message
    });
  }
};

// @desc    Get alert statistics
// @route   GET /api/alerts/stats
// @access  Private
exports.getAlertStats = async (req, res) => {
  try {
    // Time range filtering
    const timeFilter = {};
    
    if (req.query.startDate || req.query.endDate) {
      timeFilter.timestamp = {};
      
      if (req.query.startDate) {
        timeFilter.timestamp.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        timeFilter.timestamp.$lte = new Date(req.query.endDate);
      }
    }
    
    // Count alerts by severity
    const severityCounts = await Alert.aggregate([
      { $match: timeFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Count alerts by type
    const typeCounts = await Alert.aggregate([
      { $match: timeFilter },
      { $group: { _id: '$alertType', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);
    
    // Count alerts by resolved status
    const resolvedCounts = await Alert.aggregate([
      { $match: timeFilter },
      { $group: { _id: '$resolved', count: { $sum: 1 } } }
    ]);
    
    // Calculate average resolution time for resolved alerts
    const averageResolutionTimeResult = await Alert.aggregate([
      { 
        $match: { 
          ...timeFilter,
          resolved: true,
          resolutionTimestamp: { $exists: true }
        } 
      },
      { 
        $project: { 
          resolutionTime: { 
            $subtract: ['$resolutionTimestamp', '$timestamp'] 
          } 
        } 
      },
      { $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } }
    ]);
    
    const averageResolutionTime = averageResolutionTimeResult.length > 0
      ? Math.round(averageResolutionTimeResult[0].avgTime / 1000 / 60) // Convert to minutes
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        severityCounts: severityCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        resolvedCounts: resolvedCounts.reduce((acc, curr) => {
          acc[curr._id ? 'resolved' : 'unresolved'] = curr.count;
          return acc;
        }, { resolved: 0, unresolved: 0 }),
        averageResolutionTime // in minutes
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving alert statistics',
      error: error.message
    });
  }
};