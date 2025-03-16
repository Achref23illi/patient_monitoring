const express = require('express');
const {
  getAlerts,
  getPatientAlerts,
  getAlert,
  resolveAlert,
  createAlert,
  acknowledgeAlert,
  getAlertStats
} = require('../controllers/alertController');

const { protect, authorize, checkPermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all alerts and create new manual alert
router
  .route('/')
  .get(checkPermission('read:alerts'), getAlerts)
  .post(
    checkPermission('write:alerts'),
    auditLog('create_alert'),
    createAlert
  );

// Get alert statistics
router.route('/stats')
  .get(checkPermission('read:alerts'), getAlertStats);

// Get alerts for a specific patient
router.route('/patient/:patientId')
  .get(checkPermission('read:alerts'), getPatientAlerts);

// Get specific alert
router.route('/:id')
  .get(checkPermission('read:alerts'), getAlert);

// Resolve an alert
router.route('/:id/resolve')
  .put(
    checkPermission('write:alerts'),
    auditLog('resolve_alert'),
    resolveAlert
  );

// Acknowledge an alert
router.route('/:id/acknowledge')
  .put(
    checkPermission('read:alerts'),
    auditLog('acknowledge_alert'),
    acknowledgeAlert
  );

module.exports = router;