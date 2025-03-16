// Main application module
const Dashboard = (function() {
    // Cache DOM elements
    const DOM = {
      // Dashboard elements
      totalPatients: document.getElementById('total-patients'),
      activeAlerts: document.getElementById('active-alerts'),
      monitoringCount: document.getElementById('monitoring-count'),
      activeDevices: document.getElementById('active-devices'),
      lastUpdatedTime: document.getElementById('last-updated-time'),
      
      // Recent alerts
      recentAlertsList: document.getElementById('recent-alerts-list'),
      
      // Patients overview
      patientsOverviewList: document.getElementById('patients-overview-list'),
      
      // Charts
      alertsChart: document.getElementById('alerts-chart'),
      vitalsChart: document.getElementById('vitals-chart')
    };
    
    // Chart instances
    let alertsChartInstance = null;
    let vitalsChartInstance = null;
    
    // Load dashboard data
    const loadDashboard = async () => {
      try {
        // Update last updated time
        DOM.lastUpdatedTime.textContent = UI.formatTime(new Date());
        
        // Get dashboard stats
        const { success, data, error } = await ApiService.dashboard.getStats();
        
        if (!success) {
          console.error('Error loading dashboard:', error);
          return;
        }
        
        // Update dashboard stats
        updateDashboardStats(data);
        
        // Load recent alerts
        loadRecentAlerts();
        
        // Load patients overview
        loadPatientsOverview();
        
        // Initialize charts
        initializeCharts(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    };
    
    // Update dashboard statistics
    const updateDashboardStats = (data) => {
      DOM.totalPatients.textContent = data.totalPatients;
      DOM.activeAlerts.textContent = data.activeAlerts;
      DOM.monitoringCount.textContent = data.monitoringCount;
      DOM.activeDevices.textContent = data.activeDevices || '0';
    };
    
    // Load recent alerts
    const loadRecentAlerts = async () => {
      try {
        const { success, data } = await ApiService.alerts.getAll(1, 5, { resolved: false });
        
        if (!success) return;
        
        // Clear existing alerts
        DOM.recentAlertsList.innerHTML = '';
        
        if (data.data.length === 0) {
          DOM.recentAlertsList.innerHTML = '<div class="info-message">No active alerts</div>';
          return;
        }
        
        // Add alerts to list
        data.data.forEach(alert => {
          const alertItem = document.createElement('div');
          alertItem.className = `alert-item ${alert.severity.toLowerCase()}`;
          alertItem.innerHTML = `
            <div class="alert-details">
              <div class="alert-meta">
                <span class="alert-patient">${alert.patientId.name || 'Patient'}</span>
                <span class="alert-time">${UI.formatTime(alert.timestamp)}</span>
              </div>
              <div class="alert-message">${alert.message}</div>
            </div>
            <div class="alert-actions">
              <button class="view-alert-btn" data-id="${alert._id}">View</button>
            </div>
          `;
          
          // Add event listener to view button
          alertItem.querySelector('.view-alert-btn').addEventListener('click', () => {
            UI.navigateTo('alerts');
            // The alerts module should handle showing the alert details
          });
          
          DOM.recentAlertsList.appendChild(alertItem);
        });
      } catch (error) {
        console.error('Error loading recent alerts:', error);
      }
    };
    
    // Load patients overview
    const loadPatientsOverview = async () => {
      try {
        const { success, data } = await ApiService.patients.getAll(1, 5);
        
        if (!success) return;
        
        // Clear existing patients
        DOM.patientsOverviewList.innerHTML = '';
        
        if (data.data.length === 0) {
          DOM.patientsOverviewList.innerHTML = '<div class="info-message">No patients</div>';
          return;
        }
        
        // Add patients to list
        data.data.forEach(patient => {
          const patientItem = document.createElement('div');
          patientItem.className = 'patient-item';
          
          // Get initials for avatar
          const initials = patient.name.split(' ').map(n => n[0]).join('').toUpperCase();
          
          patientItem.innerHTML = `
            <div class="patient-avatar">${initials}</div>
            <div class="patient-info">
              <div class="patient-name">${patient.name}</div>
              <div class="patient-meta">
                <span>${calculateAge(patient.dateOfBirth)} years</span>
                <span>${patient.gender}</span>
              </div>
            </div>
            <div class="patient-status ${patient.status.toLowerCase()}">${patient.status}</div>
          `;
          
          // Add event listener
          patientItem.addEventListener('click', () => {
            UI.navigateTo('patients');
            // The patients module should handle showing the patient details
          });
          
          DOM.patientsOverviewList.appendChild(patientItem);
        });
      } catch (error) {
        console.error('Error loading patients overview:', error);
      }
    };
    
    // Initialize charts
    const initializeCharts = (data) => {
      initializeAlertsChart(data.alertStats);
      initializeVitalsChart();
    };
    
    // Initialize alerts chart
    const initializeAlertsChart = (alertStats) => {
      if (!alertStats) return;
      
      // Destroy existing chart if it exists
      if (alertsChartInstance) {
        alertsChartInstance.destroy();
      }
      
      // Prepare data
      const severityLabels = Object.keys(alertStats.severityCounts);
      const severityCounts = Object.values(alertStats.severityCounts);
      
      const typeLabels = Object.keys(alertStats.typeCounts).slice(0, 5); // Top 5 types
      const typeCounts = Object.values(alertStats.typeCounts).slice(0, 5);
      
      // Create chart
      const ctx = DOM.alertsChart.getContext('2d');
      
      alertsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [...severityLabels, ...typeLabels],
          datasets: [
            {
              label: 'By Severity',
              data: [...severityCounts, ...Array(typeLabels.length).fill(0)],
              backgroundColor: 'rgba(67, 97, 238, 0.7)',
              borderColor: 'rgba(67, 97, 238, 1)',
              borderWidth: 1
            },
            {
              label: 'By Type',
              data: [...Array(severityLabels.length).fill(0), ...typeCounts],
              backgroundColor: 'rgba(249, 168, 38, 0.7)',
              borderColor: 'rgba(249, 168, 38, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'Alert Distribution'
            }
          }
        }
      });
    };
    
    // Initialize vitals chart (placeholder with sample data)
    const initializeVitalsChart = () => {
      // Destroy existing chart if it exists
      if (vitalsChartInstance) {
        vitalsChartInstance.destroy();
      }
      
      // Mock data for demonstration
      const timestamps = [];
      const heartRateData = [];
      const temperatureData = [];
      
      // Generate sample data for the last 24 hours
      const now = new Date();
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        timestamps.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        // Random heart rate between 60-100
        heartRateData.push(Math.floor(Math.random() * 40) + 60);
        
        // Random temperature between 36.5-37.5
        temperatureData.push((Math.random() * 1 + 36.5).toFixed(1));
      }
      
      // Create chart
      const ctx = DOM.vitalsChart.getContext('2d');
      
      vitalsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timestamps,
          datasets: [
            {
              label: 'Heart Rate (bpm)',
              data: heartRateData,
              borderColor: 'rgba(230, 57, 70, 1)',
              backgroundColor: 'rgba(230, 57, 70, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y'
            },
            {
              label: 'Temperature (°C)',
              data: temperatureData,
              borderColor: 'rgba(76, 201, 240, 1)',
              backgroundColor: 'rgba(76, 201, 240, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false,
              min: 40,
              max: 120,
              title: {
                display: true,
                text: 'Heart Rate (bpm)'
              }
            },
            y1: {
              position: 'right',
              beginAtZero: false,
              min: 35,
              max: 40,
              title: {
                display: true,
                text: 'Temperature (°C)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Sample Vital Signs Trends'
            }
          }
        }
      });
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
    
    // Public API
    return {
      loadDashboard,
      loadRecentAlerts
    };
  })();
  
  // Patients module
  const PatientsModule = (function() {
    // To be implemented later
    
    return {
      loadPatients: () => {
        console.log('Loading patients...');
        // Implementation will be added
      }
    };
  })();
  
  // Vitals module
  const VitalsModule = (function() {
    // To be implemented later
    let currentPatientId = null;
    
    return {
      init: () => {
        console.log('Initializing vitals module...');
        // Implementation will be added
      },
      getCurrentPatientId: () => currentPatientId,
      updateVitals: (vitalSign) => {
        console.log('Updating vitals with:', vitalSign);
        // Implementation will be added
      }
    };
  })();
  
  // Alerts module
  const AlertsModule = (function() {
    // To be implemented later
    
    return {
      loadAlerts: () => {
        console.log('Loading alerts...');
        // Implementation will be added
      }
    };
  })();