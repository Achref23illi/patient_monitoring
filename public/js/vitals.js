// Vitals Module
const VitalsModule = (function() {
    // Private variables
    let currentPatientId = null;
    let vitalHistoryChart = null;
    let currentPage = 1;
    let vitalsPerPage = 10;
    let timeframe = '24h';
    let vitalType = 'all';
    
    // Cache DOM elements
    const DOM = {
      patientSelect: document.getElementById('vitals-patient-select'),
      recordVitalsBtn: document.getElementById('record-vitals-btn'),
      vitalsView: document.getElementById('vitals-view'),
      noPatientSelected: document.getElementById('no-patient-selected'),
      
      // Current vitals elements
      currentTemperature: document.getElementById('current-temperature'),
      currentHeartRate: document.getElementById('current-heartrate'),
      currentRespRate: document.getElementById('current-resprate'),
      currentBP: document.getElementById('current-bp'),
      currentSpO2: document.getElementById('current-spo2'),
      
      // Chart elements
      vitalsHistoryChart: document.getElementById('vitals-history-chart'),
      vitalsTimeframe: document.getElementById('vitals-timeframe'),
      vitalsType: document.getElementById('vitals-type'),
      
      // Table elements
      vitalsTableBody: document.getElementById('vitals-table-body'),
      vitalsPagination: document.getElementById('vitals-pagination'),
      
      // Modal elements
      vitalsModal: document.getElementById('vitals-modal'),
      vitalsForm: document.getElementById('vitals-form'),
      vitalTemperature: document.getElementById('vital-temperature'),
      vitalTemperatureUnit: document.getElementById('vital-temperature-unit'),
      vitalHeartRate: document.getElementById('vital-heartrate'),
      vitalRespRate: document.getElementById('vital-resprate'),
      vitalSpO2: document.getElementById('vital-spo2'),
      vitalBpSystolic: document.getElementById('vital-bp-systolic'),
      vitalBpDiastolic: document.getElementById('vital-bp-diastolic'),
      vitalNotes: document.getElementById('vital-notes'),
      saveVitalsBtn: document.getElementById('save-vitals-btn'),
      cancelVitalsBtn: document.getElementById('cancel-vitals-btn')
    };
    
    // Initialize vitals module
    const init = async () => {
      // Setup event listeners
      setupEventListeners();
      
      // Load patients for dropdown
      await loadPatients();
      
      // Check if a patient was selected from another page
      const selectedPatientId = sessionStorage.getItem('selectedPatientId');
      if (selectedPatientId) {
        DOM.patientSelect.value = selectedPatientId;
        selectPatient(selectedPatientId);
        
        // Clear session storage to prevent auto-selection on next visit
        sessionStorage.removeItem('selectedPatientId');
      } else if (DOM.patientSelect.value) {
        // If a patient is already selected in the dropdown
        selectPatient(DOM.patientSelect.value);
      }
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
      // Patient selection change
      DOM.patientSelect.addEventListener('change', () => {
        const patientId = DOM.patientSelect.value;
        selectPatient(patientId);
      });
      
      // Record vitals button
      DOM.recordVitalsBtn.addEventListener('click', () => {
        showRecordVitalsModal();
      });
      
      // Timeframe selection change
      DOM.vitalsTimeframe.addEventListener('change', () => {
        timeframe = DOM.vitalsTimeframe.value;
        loadVitalsChart();
      });
      
      // Vital type selection change
      DOM.vitalsType.addEventListener('change', () => {
        vitalType = DOM.vitalsType.value;
        loadVitalsChart();
      });
      
      // Save vitals button
      DOM.saveVitalsBtn.addEventListener('click', saveVitals);
      
      // Cancel vitals button
      DOM.cancelVitalsBtn.addEventListener('click', () => {
        UI.closeModal('vitals-modal');
      });
      
      // Vitals form submission (to prevent default)
      DOM.vitalsForm.addEventListener('submit', (e) => {
        e.preventDefault();
      });
    };
    
    // Load patients for dropdown
    const loadPatients = async () => {
      try {
        const { success, data, error } = await ApiService.patients.getAll(1, 100);
        
        if (!success) {
          console.error('Error loading patients:', error);
          return;
        }
        
        // Clear dropdown options except the placeholder
        DOM.patientSelect.innerHTML = '<option value="">Select Patient</option>';
        
        // Add patient options
        data.data.forEach(patient => {
          const option = document.createElement('option');
          option.value = patient._id;
          option.textContent = patient.name;
          DOM.patientSelect.appendChild(option);
        });
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };
    
    // Select a patient
    const selectPatient = (patientId) => {
      // Check if a patient is selected
      if (!patientId) {
        // Hide vitals view
        DOM.vitalsView.classList.add('hidden');
        DOM.noPatientSelected.classList.remove('hidden');
        DOM.recordVitalsBtn.disabled = true;
        currentPatientId = null;
        return;
      }
      
      // Show vitals view
      DOM.vitalsView.classList.remove('hidden');
      DOM.noPatientSelected.classList.add('hidden');
      DOM.recordVitalsBtn.disabled = false;
      
      // Set current patient ID
      currentPatientId = patientId;
      
      // Load patient vitals
      loadLatestVitals();
      loadVitalsHistory();
      loadVitalsChart();
      
      // Join socket room for this patient
      if (window.socket) {
        window.socket.emit('joinPatientRoom', patientId);
      }
    };
    
    // Load latest vitals for the selected patient
    const loadLatestVitals = async () => {
      try {
        const { success, data, error } = await ApiService.vitals.getLatest(currentPatientId);
        
        if (!success || !data) {
          // Clear current vitals
          DOM.currentTemperature.textContent = '--';
          DOM.currentHeartRate.textContent = '--';
          DOM.currentRespRate.textContent = '--';
          DOM.currentBP.textContent = '--';
          DOM.currentSpO2.textContent = '--';
          return;
        }
        
        // Update current vitals
        updateVitals(data.data);
        
      } catch (error) {
        console.error('Error loading latest vitals:', error);
      }
    };
    
    // Update vitals display with new data
    const updateVitals = (vitalSign) => {
      if (vitalSign.temperature && vitalSign.temperature.value) {
        DOM.currentTemperature.textContent = `${vitalSign.temperature.value} ${vitalSign.temperature.unit || '°C'}`;
      }
      
      if (vitalSign.heartRate && vitalSign.heartRate.value) {
        DOM.currentHeartRate.textContent = `${vitalSign.heartRate.value} ${vitalSign.heartRate.unit || 'bpm'}`;
      }
      
      if (vitalSign.respiratoryRate && vitalSign.respiratoryRate.value) {
        DOM.currentRespRate.textContent = `${vitalSign.respiratoryRate.value} ${vitalSign.respiratoryRate.unit || 'breaths/min'}`;
      }
      
      if (vitalSign.bloodPressure && vitalSign.bloodPressure.systolic && vitalSign.bloodPressure.diastolic) {
        DOM.currentBP.textContent = `${vitalSign.bloodPressure.systolic}/${vitalSign.bloodPressure.diastolic} ${vitalSign.bloodPressure.unit || 'mmHg'}`;
      }
      
      if (vitalSign.oxygenSaturation && vitalSign.oxygenSaturation.value) {
        DOM.currentSpO2.textContent = `${vitalSign.oxygenSaturation.value} ${vitalSign.oxygenSaturation.unit || '%'}`;
      }
    };
    
    // Load vitals history for the selected patient
    const loadVitalsHistory = async () => {
      try {
        // Show loading state
        DOM.vitalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading vitals history...</td></tr>';
        
        const { success, data, error } = await ApiService.vitals.getByPatient(
          currentPatientId,
          currentPage,
          vitalsPerPage
        );
        
        if (!success) {
          DOM.vitalsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Error loading vitals history: ${error}</td></tr>`;
          return;
        }
        
        // Check if no vitals
        if (data.data.length === 0) {
          DOM.vitalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No vitals recorded yet</td></tr>';
          DOM.vitalsPagination.innerHTML = '';
          return;
        }
        
        // Clear existing rows
        DOM.vitalsTableBody.innerHTML = '';
        
        // Add vital sign rows
        data.data.forEach(vital => {
          const row = document.createElement('tr');
          
          // Format date and time
          const datetime = new Date(vital.timestamp).toLocaleString();
          
          // Create row content
          row.innerHTML = `
            <td>${datetime}</td>
            <td>${vital.temperature?.value ? `${vital.temperature.value} ${vital.temperature.unit || '°C'}` : '--'}</td>
            <td>${vital.heartRate?.value ? `${vital.heartRate.value} ${vital.heartRate.unit || 'bpm'}` : '--'}</td>
            <td>${vital.respiratoryRate?.value ? `${vital.respiratoryRate.value} ${vital.respiratoryRate.unit || 'breaths/min'}` : '--'}</td>
            <td>${vital.bloodPressure?.systolic ? `${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic} ${vital.bloodPressure.unit || 'mmHg'}` : '--'}</td>
            <td>${vital.oxygenSaturation?.value ? `${vital.oxygenSaturation.value} ${vital.oxygenSaturation.unit || '%'}` : '--'}</td>
            <td>${vital.recordedBy ? 'Staff' : 'Device'}</td>
          `;
          
          DOM.vitalsTableBody.appendChild(row);
        });
        
        // Create pagination
        UI.createPagination(
          'vitals-pagination',
          data.pagination.page,
          data.pagination.pages,
          (page) => {
            currentPage = page;
            loadVitalsHistory();
          }
        );
        
      } catch (error) {
        console.error('Error loading vitals history:', error);
        DOM.vitalsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading vitals history</td></tr>';
      }
    };
    
    // Load vitals chart
    const loadVitalsChart = async () => {
      try {
        // For demo purposes, use mock data
        // In a real application, you would fetch actual data based on timeframe and vitalType
        const mockData = ChartHelpers.generateMockVitalsData(
          timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30
        );
        
        // Filter datasets based on vital type
        if (vitalType !== 'all') {
          mockData.datasets = mockData.datasets.filter(dataset => {
            return dataset.label.toLowerCase().includes(vitalType);
          });
        }
        
        // Create or update chart
        if (vitalHistoryChart) {
          vitalHistoryChart.data = mockData;
          vitalHistoryChart.update();
        } else {
          vitalHistoryChart = ChartHelpers.createLineChart('vitals-history-chart', mockData);
        }
        
      } catch (error) {
        console.error('Error loading vitals chart:', error);
      }
    };
    
    // Show record vitals modal
    const showRecordVitalsModal = () => {
      // Clear form
      DOM.vitalsForm.reset();
      
      // Set default values
      DOM.vitalTemperatureUnit.value = '°C';
      
      // Show modal
      UI.openModal('vitals-modal');
    };
    
    // Save vitals
    const saveVitals = async () => {
      try {
        // Get form data
        const vitalData = {
          patientId: currentPatientId,
          recordMethod: 'Manual'
        };
        
        // Add temperature if provided
        if (DOM.vitalTemperature.value) {
          vitalData.temperature = {
            value: parseFloat(DOM.vitalTemperature.value),
            unit: DOM.vitalTemperatureUnit.value
          };
        }
        
        // Add heart rate if provided
        if (DOM.vitalHeartRate.value) {
          vitalData.heartRate = {
            value: parseInt(DOM.vitalHeartRate.value),
            unit: 'bpm'
          };
        }
        
        // Add respiratory rate if provided
        if (DOM.vitalRespRate.value) {
          vitalData.respiratoryRate = {
            value: parseInt(DOM.vitalRespRate.value),
            unit: 'breaths/min'
          };
        }
        
        // Add oxygen saturation if provided
        if (DOM.vitalSpO2.value) {
          vitalData.oxygenSaturation = {
            value: parseInt(DOM.vitalSpO2.value),
            unit: '%'
          };
        }
        
        // Add blood pressure if provided
        if (DOM.vitalBpSystolic.value && DOM.vitalBpDiastolic.value) {
          vitalData.bloodPressure = {
            systolic: parseInt(DOM.vitalBpSystolic.value),
            diastolic: parseInt(DOM.vitalBpDiastolic.value),
            unit: 'mmHg'
          };
        }
        
        // Add notes if provided
        if (DOM.vitalNotes.value) {
          vitalData.notes = DOM.vitalNotes.value;
        }
        
        // Disable save button
        DOM.saveVitalsBtn.disabled = true;
        DOM.saveVitalsBtn.textContent = 'Saving...';
        
        // Save vitals
        const { success, data, error } = await ApiService.vitals.record(vitalData);
        
        // Reset button
        DOM.saveVitalsBtn.disabled = false;
        DOM.saveVitalsBtn.textContent = 'Save Vitals';
        
        if (success) {
          // Close modal
          UI.closeModal('vitals-modal');
          
          // Reload vitals
          loadLatestVitals();
          loadVitalsHistory();
          loadVitalsChart();
        } else {
          alert(`Error saving vitals: ${error}`);
        }
      } catch (error) {
        console.error('Error saving vitals:', error);
        
        // Reset button
        DOM.saveVitalsBtn.disabled = false;
        DOM.saveVitalsBtn.textContent = 'Save Vitals';
        
        alert('Error saving vitals');
      }
    };
    
    // Get current patient ID (for socket events)
    const getCurrentPatientId = () => {
      return currentPatientId;
    };
    
    // Public API
    return {
      init,
      getCurrentPatientId,
      updateVitals
    };
  })();
  
  // Initialize vitals module when navigating to vitals page
  document.addEventListener('DOMContentLoaded', () => {
    // The main UI module will call VitalsModule.init()
    // when navigating to the vitals page
    console.log('Vitals.js loaded successfully');
  });