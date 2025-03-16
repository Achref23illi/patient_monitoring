// Alerts Module
const AlertsModule = (function() {
    // Private variables
    let currentPage = 1;
    let alertsPerPage = 20;
    let patientFilter = '';
    let statusFilter = '';
    let severityFilter = '';
    
    // Cache DOM elements
    const DOM = {
      alertsTableBody: document.getElementById('alerts-table-body'),
      alertPatientFilter: document.getElementById('alert-patient-filter'),
      alertStatusFilter: document.getElementById('alert-status-filter'),
      alertSeverityFilter: document.getElementById('alert-severity-filter'),
      alertsPagination: document.getElementById('alerts-pagination'),
      
      // Alert modal elements
      alertModal: document.getElementById('alert-modal'),
      alertDetails: document.getElementById('alert-details'),
      resolveAlertBtn: document.getElementById('resolve-alert-btn'),
      closeAlertBtn: document.getElementById('close-alert-btn')
    };
    
    // Initialize alerts module
    const init = async () => {
      // Setup event listeners
      setupEventListeners();
      
      // Load patients for filter dropdown
      await loadPatients();
      
      // Load initial alerts data
      loadAlerts();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
      // Patient filter change
      DOM.alertPatientFilter.addEventListener('change', () => {
        patientFilter = DOM.alertPatientFilter.value;
        currentPage = 1;
        loadAlerts();
      });
      
      // Status filter change
      DOM.alertStatusFilter.addEventListener('change', () => {
        statusFilter = DOM.alertStatusFilter.value;
        currentPage = 1;
        loadAlerts();
      });
      
      // Severity filter change
      DOM.alertSeverityFilter.addEventListener('change', () => {
        severityFilter = DOM.alertSeverityFilter.value;
        currentPage = 1;
        loadAlerts();
      });
      
      // Close alert modal button
      DOM.closeAlertBtn.addEventListener('click', () => {
        UI.closeModal('alert-modal');
      });
    };
    
    // Load patients for filter dropdown
    const loadPatients = async () => {
      try {
        const { success, data, error } = await ApiService.patients.getAll(1, 100);
        
        if (!success) {
          console.error('Error loading patients:', error);
          return;
        }
        
        // Clear dropdown options except the placeholder
        DOM.alertPatientFilter.innerHTML = '<option value="">All Patients</option>';
        
        // Add patient options
        data.data.forEach(patient => {
          const option = document.createElement('option');
          option.value = patient._id;
          option.textContent = patient.name;
          DOM.alertPatientFilter.appendChild(option);
        });
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    
    // Load alerts data
    const loadAlerts = async () => {
      try {
        // Show loading state
        DOM.alertsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading alerts...</td></tr>';
        
        // Prepare filters
        const filters = {};
        
        if (patientFilter) {
          filters.patientId = patientFilter;
        }
        
        if (statusFilter) {
          filters.resolved = statusFilter;
        }
        
        if (severityFilter) {
          filters.severity = severityFilter;
        }
        
        // Fetch alerts
        let result;
        
        if (patientFilter) {
          // Get alerts for specific patient
          result = await ApiService.alerts.getByPatient(
            patientFilter,
            currentPage,
            alertsPerPage,
            filters
          );
        } else {
          // Get all alerts
          result = await ApiService.alerts.getAll(
            currentPage,
            alertsPerPage,
            filters
          );
        }
        
        const { success, data, error } = result;
        
        if (!success) {
          DOM.alertsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading alerts: ${error}</td></tr>`;
          return;
        }
        
        // Check if no alerts
        if (data.data.length === 0) {
          DOM.alertsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No alerts found</td></tr>';
          DOM.alertsPagination.innerHTML = '';
          return;
        }
        
        // Clear existing rows
        DOM.alertsTableBody.innerHTML = '';
        
        // Add alert rows
        data.data.forEach(alert => {
          const row = document.createElement('tr');
          
          // Format date and time
          const datetime = new Date(alert.timestamp).toLocaleString();
          
          // Format patient name
          const patientName = alert.patientId?.name || 'Unknown Patient';
          
          // Format status
          const status = alert.resolved ? 'Resolved' : 'Unresolved';
          
          // Create row content
          row.innerHTML = `
            <td>${datetime}</td>
            <td>${patientName}</td>
            <td>${alert.alertType}</td>
            <td>${alert.message}</td>
            <td><span class="severity-badge ${alert.severity.toLowerCase()}">${alert.severity}</span></td>
            <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
            <td>
              <div class="action-btns">
                <button class="action-btn view" data-id="${alert._id}" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                ${!alert.resolved ? `
                  <button class="action-btn resolve" data-id="${alert._id}" title="Resolve Alert">
                    <i class="fas fa-check"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          `;
          
          // Add event listeners to action buttons
          const viewBtn = row.querySelector('.action-btn.view');
          viewBtn.addEventListener('click', () => {
            viewAlertDetails(alert._id);
          });
          
          const resolveBtn = row.querySelector('.action-btn.resolve');
          if (resolveBtn) {
            resolveBtn.addEventListener('click', () => {
              resolveAlert(alert._id);
            });
          }
          
          DOM.alertsTableBody.appendChild(row);
        });
        
        // Create pagination
        UI.createPagination(
          'alerts-pagination',
          data.pagination.page,
          data.pagination.pages,
          (page) => {
            currentPage = page;
            loadAlerts();
          }
        );
        
      } catch (error) {
        console.error('Error loading alerts:', error);
        DOM.alertsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading alerts</td></tr>';
      }
    };
    
    // View alert details
    const viewAlertDetails = async (alertId) => {
      try {
        // Show loading state
        DOM.alertDetails.innerHTML = '<p class="text-center">Loading alert details...</p>';
        
        // Show modal
        UI.openModal('alert-modal');
        
        // Fetch alert details
        const { success, data, error } = await ApiService.alerts.getById(alertId);
        
        if (!success) {
          DOM.alertDetails.innerHTML = `<p class="text-center">Error loading alert details: ${error}</p>`;
          return;
        }
        
        const alert = data.data;
        
        // Format date and time
        const datetime = new Date(alert.timestamp).toLocaleString();
        
        // Format patient name
        const patientName = alert.patientId?.name || 'Unknown Patient';
        
        // Create alert details HTML
        let detailsHTML = `
          <div class="alert-detail-item">
            <h4>Patient</h4>
            <p>${patientName}</p>
          </div>
          <div class="alert-detail-item">
            <h4>Time</h4>
            <p>${datetime}</p>
          </div>
          <div class="alert-detail-item">
            <h4>Type</h4>
            <p>${alert.alertType}</p>
          </div>
          <div class="alert-detail-item">
            <h4>Message</h4>
            <p>${alert.message}</p>
          </div>
          <div class="alert-detail-item">
            <h4>Severity</h4>
            <p><span class="severity-badge ${alert.severity.toLowerCase()}">${alert.severity}</span></p>
          </div>
          <div class="alert-detail-item">
            <h4>Status</h4>
            <p><span class="status-badge ${alert.resolved ? 'resolved' : 'unresolved'}">${alert.resolved ? 'Resolved' : 'Unresolved'}</span></p>
          </div>
        `;
        
        // Add vital signs info if available
        if (alert.vitalSignId) {
          const vital = alert.vitalSignId;
          
          detailsHTML += `
            <div class="alert-vitals">
              <h4>Vital Signs</h4>
              <div class="vital-reading">
                <div class="label">Temperature:</div>
                <div class="value">${vital.temperature?.value ? `${vital.temperature.value} ${vital.temperature.unit || '°C'}` : '--'}</div>
              </div>
              <div class="vital-reading">
                <div class="label">Heart Rate:</div>
                <div class="value">${vital.heartRate?.value ? `${vital.heartRate.value} ${vital.heartRate.unit || 'bpm'}` : '--'}</div>
              </div>
              <div class="vital-reading">
                <div class="label">Respiratory Rate:</div>
                <div class="value">${vital.respiratoryRate?.value ? `${vital.respiratoryRate.value} ${vital.respiratoryRate.unit || 'breaths/min'}` : '--'}</div>
              </div>
              <div class="vital-reading">
                <div class="label">Blood Pressure:</div>
                <div class="value">${vital.bloodPressure?.systolic ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic} ${vital.bloodPressure.unit || 'mmHg'}` : '--'}</div>
              </div>
              <div class="vital-reading">
                <div class="label">Oxygen Saturation:</div>
                <div class="value">${vital.oxygenSaturation?.value ? `${vital.oxygenSaturation.value} ${vital.oxygenSaturation.unit || '%'}` : '--'}</div>
              </div>
            </div>
          `;
        }
        
        // Add resolution info if resolved
        if (alert.resolved) {
          const resolutionTime = new Date(alert.resolutionTimestamp).toLocaleString();
          const resolvedBy = alert.resolvedBy?.name || 'System';
          
          detailsHTML += `
            <div class="alert-detail-item">
              <h4>Resolved At</h4>
              <p>${resolutionTime}</p>
            </div>
            <div class="alert-detail-item">
              <h4>Resolved By</h4>
              <p>${resolvedBy}</p>
            </div>
          `;
          
          if (alert.resolutionNotes) {
            detailsHTML += `
              <div class="alert-detail-item">
                <h4>Resolution Notes</h4>
                <p>${alert.resolutionNotes}</p>
              </div>
            `;
          }
          
          // Hide resolve button if already resolved
          DOM.resolveAlertBtn.classList.add('hidden');
        } else {
          // Show resolve button
          DOM.resolveAlertBtn.classList.remove('hidden');
          
          // Add event listener to resolve button
          DOM.resolveAlertBtn.onclick = () => {
            const notes = prompt('Enter resolution notes (optional):');
            resolveAlert(alertId, notes);
          };
        }
        
        // Update alert details
        DOM.alertDetails.innerHTML = detailsHTML;
        
      } catch (error) {
        console.error('Error viewing alert details:', error);
        DOM.alertDetails.innerHTML = '<p class="text-center">Error loading alert details</p>';
      }
    };
    
    // Resolve alert
    const resolveAlert = async (alertId, resolutionNotes = '') => {
      try {
        const { success, error } = await ApiService.alerts.resolve(alertId, resolutionNotes);
        
        if (success) {
          // Close modal if open
          UI.closeModal('alert-modal');
          
          // Reload alerts
          loadAlerts();
          
          // Acknowledge the alert
          await ApiService.alerts.acknowledge(alertId);
        } else {
          alert(`Error resolving alert: ${error}`);
        }
      } catch (error) {
        console.error('Error resolving alert:', error);
        alert('Error resolving alert');
      }
    };
    
    // Public API
    return {
      init,
      loadAlerts
    };
  })();
  
  // Initialize alerts module when navigating to alerts page
  document.addEventListener('DOMContentLoaded', () => {
    // The main UI module will call AlertsModule.loadAlerts()
    // when navigating to the alerts page
    console.log('Alerts.js loaded successfully');
  });