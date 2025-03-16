// Patients Module
const PatientsModule = (function() {
    // Private variables
    let currentPage = 1;
    let patientsPerPage = 10;
    let statusFilter = '';
    let searchQuery = '';
    
    // Cache DOM elements
    const DOM = {
      patientsTableBody: document.getElementById('patients-table-body'),
      statusFilter: document.getElementById('status-filter'),
      patientSearch: document.getElementById('patient-search'),
      patientSearchBtn: document.getElementById('patient-search-btn'),
      addPatientBtn: document.getElementById('add-patient-btn'),
      patientsPagination: document.getElementById('patients-pagination'),
      
      // Patient modal elements
      patientModal: document.getElementById('patient-modal'),
      patientModalTitle: document.getElementById('patient-modal-title'),
      patientForm: document.getElementById('patient-form'),
      patientId: document.getElementById('patient-id'),
      patientName: document.getElementById('patient-name'),
      patientDob: document.getElementById('patient-dob'),
      patientGender: document.getElementById('patient-gender'),
      patientAddress: document.getElementById('patient-address'),
      patientPhone: document.getElementById('patient-phone'),
      patientEmail: document.getElementById('patient-email'),
      patientStatus: document.getElementById('patient-status'),
      patientNotes: document.getElementById('patient-notes'),
      savePatientBtn: document.getElementById('save-patient-btn'),
      cancelPatientBtn: document.getElementById('cancel-patient-btn')
    };
    
    // Initialize patients module
    const init = () => {
      // Add event listeners
      setupEventListeners();
      
      // Load initial patients data
      loadPatients();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
      // Status filter change
      DOM.statusFilter.addEventListener('change', () => {
        statusFilter = DOM.statusFilter.value;
        currentPage = 1;
        loadPatients();
      });
      
      // Search input
      DOM.patientSearch.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          searchQuery = DOM.patientSearch.value.trim();
          currentPage = 1;
          loadPatients();
        }
      });
      
      // Search button click
      DOM.patientSearchBtn.addEventListener('click', () => {
        searchQuery = DOM.patientSearch.value.trim();
        currentPage = 1;
        loadPatients();
      });
      
      // Add patient button
      DOM.addPatientBtn.addEventListener('click', () => {
        showAddPatientModal();
      });
      
      // Save patient button
      DOM.savePatientBtn.addEventListener('click', savePatient);
      
      // Cancel patient button
      DOM.cancelPatientBtn.addEventListener('click', () => {
        UI.closeModal('patient-modal');
      });
      
      // Patient form submission (to prevent default)
      DOM.patientForm.addEventListener('submit', (e) => {
        e.preventDefault();
      });
    };
    
    // Load patients data
    const loadPatients = async () => {
      try {
        // Show loading state
        DOM.patientsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading patients...</td></tr>';
        
        // Prepare filters
        const filters = {};
        
        if (statusFilter) {
          filters.status = statusFilter;
        }
        
        if (searchQuery) {
          filters.name = searchQuery;
        }
        
        // Fetch patients
        const { success, data, error } = await ApiService.patients.getAll(
          currentPage,
          patientsPerPage,
          filters
        );
        
        if (!success) {
          DOM.patientsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Error loading patients: ${error}</td></tr>`;
          return;
        }
        
        // Check if no patients
        if (data.data.length === 0) {
          DOM.patientsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No patients found</td></tr>';
          DOM.patientsPagination.innerHTML = '';
          return;
        }
        
        // Clear existing rows
        DOM.patientsTableBody.innerHTML = '';
        
        // Add patient rows
        data.data.forEach(patient => {
          const row = document.createElement('tr');
          
          // Calculate age
          const age = calculateAge(patient.dateOfBirth);
          
          // Format last updated time
          const lastUpdated = UI.formatTime(patient.updatedAt || patient.createdAt);
          
          // Create row content
          row.innerHTML = `
            <td>${patient.name}</td>
            <td>${age}</td>
            <td>${patient.gender}</td>
            <td>
              <span class="patient-status ${patient.status.toLowerCase()}">${patient.status}</span>
            </td>
            <td>${lastUpdated}</td>
            <td>
              <div class="action-btns">
                <button class="action-btn view" data-id="${patient._id}" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${patient._id}" title="Edit Patient">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${patient._id}" title="Delete Patient">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          `;
          
          // Add event listeners to action buttons
          const viewBtn = row.querySelector('.action-btn.view');
          const editBtn = row.querySelector('.action-btn.edit');
          const deleteBtn = row.querySelector('.action-btn.delete');
          
          viewBtn.addEventListener('click', () => {
            viewPatientDetails(patient._id);
          });
          
          editBtn.addEventListener('click', () => {
            showEditPatientModal(patient);
          });
          
          deleteBtn.addEventListener('click', () => {
            confirmDeletePatient(patient._id, patient.name);
          });
          
          DOM.patientsTableBody.appendChild(row);
        });
        
        // Create pagination
        createPagination(data.pagination);
        
      } catch (error) {
        console.error('Error loading patients:', error);
        DOM.patientsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error loading patients</td></tr>';
      }
    };
    
    // Create pagination controls
    const createPagination = (pagination) => {
      UI.createPagination(
        'patients-pagination',
        pagination.page,
        pagination.pages,
        (page) => {
          currentPage = page;
          loadPatients();
        }
      );
    };
    
    // Calculate age from date of birth
    const calculateAge = (dateOfBirth) => {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      return age;
    };
    
    // Show add patient modal
    const showAddPatientModal = () => {
      // Set modal title
      DOM.patientModalTitle.textContent = 'Add New Patient';
      
      // Clear form
      DOM.patientForm.reset();
      DOM.patientId.value = '';
      
      // Set default status
      DOM.patientStatus.value = 'Active';
      
      // Show modal
      UI.openModal('patient-modal');
    };
    
    // Show edit patient modal
    const showEditPatientModal = (patient) => {
      // Set modal title
      DOM.patientModalTitle.textContent = 'Edit Patient';
      
      // Fill form with patient data
      DOM.patientId.value = patient._id;
      DOM.patientName.value = patient.name;
      DOM.patientDob.value = new Date(patient.dateOfBirth).toISOString().split('T')[0];
      DOM.patientGender.value = patient.gender;
      DOM.patientAddress.value = patient.contactInformation.address;
      DOM.patientPhone.value = patient.contactInformation.phone;
      DOM.patientEmail.value = patient.contactInformation.email || '';
      DOM.patientStatus.value = patient.status;
      DOM.patientNotes.value = patient.notes || '';
      
      // Show modal
      UI.openModal('patient-modal');
    };
    
    // Save patient (create or update)
    const savePatient = async () => {
      try {
        // Validate form
        if (!DOM.patientForm.checkValidity()) {
          DOM.patientForm.reportValidity();
          return;
        }
        
        // Get form data
        const patientData = {
          name: DOM.patientName.value,
          dateOfBirth: DOM.patientDob.value,
          gender: DOM.patientGender.value,
          contactInformation: {
            address: DOM.patientAddress.value,
            phone: DOM.patientPhone.value,
            email: DOM.patientEmail.value
          },
          status: DOM.patientStatus.value,
          notes: DOM.patientNotes.value
        };
        
        // Disable save button
        DOM.savePatientBtn.disabled = true;
        DOM.savePatientBtn.textContent = 'Saving...';
        
        let result;
        
        // Check if creating or updating
        if (DOM.patientId.value) {
          // Update existing patient
          result = await ApiService.patients.update(DOM.patientId.value, patientData);
        } else {
          // Create new patient
          result = await ApiService.patients.create(patientData);
        }
        
        // Reset button
        DOM.savePatientBtn.disabled = false;
        DOM.savePatientBtn.textContent = 'Save Patient';
        
        if (result.success) {
          // Close modal
          UI.closeModal('patient-modal');
          
          // Reload patients
          loadPatients();
        } else {
          alert(`Error saving patient: ${result.error}`);
        }
      } catch (error) {
        console.error('Error saving patient:', error);
        
        // Reset button
        DOM.savePatientBtn.disabled = false;
        DOM.savePatientBtn.textContent = 'Save Patient';
        
        alert('Error saving patient');
      }
    };
    
    // View patient details (redirect to vitals page)
    const viewPatientDetails = (patientId) => {
      // Store selected patient ID in session storage
      sessionStorage.setItem('selectedPatientId', patientId);
      
      // Navigate to vitals page
      UI.navigateTo('vitals');
    };
    
    // Confirm delete patient
    const confirmDeletePatient = (patientId, patientName) => {
      if (confirm(`Are you sure you want to delete patient "${patientName}"?`)) {
        deletePatient(patientId);
      }
    };
    
    // Delete patient
    const deletePatient = async (patientId) => {
      try {
        const { success, error } = await ApiService.patients.delete(patientId);
        
        if (success) {
          // Reload patients
          loadPatients();
        } else {
          alert(`Error deleting patient: ${error}`);
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Error deleting patient');
      }
    };
    
    // Public API
    return {
      init,
      loadPatients
    };
  })();
  
  // Initialize patients module when navigating to patients page
  document.addEventListener('DOMContentLoaded', () => {
    // The main UI module will call PatientsModule.loadPatients()
    // when navigating to the patients page
    console.log('Patients.js loaded successfully');
  });