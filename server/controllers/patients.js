const express = require('express');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  updatePatientVitals
} = require('../controllers/patientController');

const { protect, authorize, checkPermission, auditLog } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all patients and create new patient
router
  .route('/')
  .get(checkPermission('read:patients'), getPatients)
  .post(
    checkPermission('write:patients'),
    auditLog('create_patient'),
    createPatient
  );

// Get, update and delete specific patient
router
  .route('/:id')
  .get(checkPermission('read:patients'), getPatient)
  .put(
    checkPermission('write:patients'),
    auditLog('update_patient'),
    updatePatient
  )
  .delete(
    authorize('admin', 'doctor'),
    checkPermission('write:patients'),
    auditLog('delete_patient'),
    deletePatient
  );

// Update patient vitals
router.route('/:id/vitals')
  .put(
    checkPermission('write:vitals'),
    auditLog('update_vitals'),
    updatePatientVitals
  );

module.exports = router;