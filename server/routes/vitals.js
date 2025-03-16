const express = require('express');
const {
  getVitalSignsByPatient,
  getLatestVitalSigns,
  recordVitalSigns,
  getVitalSign,
  updateVitalSign,
  deleteVitalSign
} = require('../controllers/vitalSignController');

const { protect, authorize, checkPermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Record new vital signs
router
  .route('/')
  .post(
    checkPermission('write:vitals'),
    auditLog('record_vital_signs'),
    recordVitalSigns
  );

// Get, update and delete specific vital sign record
router
  .route('/:id')
  .get(checkPermission('read:vitals'), getVitalSign)
  .put(
    checkPermission('write:vitals'),
    auditLog('update_vital_sign'),
    updateVitalSign
  )
  .delete(
    authorize('admin', 'doctor'),
    checkPermission('write:vitals'),
    auditLog('delete_vital_sign'),
    deleteVitalSign
  );

// Get vital signs for a specific patient
router.route('/patient/:patientId')
  .get(checkPermission('read:vitals'), getVitalSignsByPatient);

// Get latest vital signs for a specific patient
router.route('/patient/:patientId/latest')
  .get(checkPermission('read:vitals'), getLatestVitalSigns);

module.exports = router;