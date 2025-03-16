// API Service module
const ApiService = (function() {
    // Make authenticated API request
    const apiRequest = async (url, method = 'GET', body = null) => {
      try {
        const token = Auth.getToken();
        
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
        
        const options = {
          method,
          headers
        };
        
        if (body && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `API request failed with status ${response.status}`);
        }
        
        return { success: true, data };
      } catch (error) {
        console.error(`API ${method} request to ${url} failed:`, error);
        
        // Handle authentication errors
        if (error.message.includes('Authentication') || 
            error.message.includes('jwt') || 
            error.message.includes('token')) {
          // Redirect to login page
          window.location.href = '/';
        }
        
        return { success: false, error: error.message };
      }
    };
    
    // Patient API methods
    const patients = {
      getAll: async (page = 1, limit = 10, filters = {}) => {
        // Build query string from filters
        const queryParams = new URLSearchParams({ page, limit, ...filters });
        return await apiRequest(`/api/patients?${queryParams}`);
      },
      
      getById: async (id) => {
        return await apiRequest(`/api/patients/${id}`);
      },
      
      create: async (patientData) => {
        return await apiRequest('/api/patients', 'POST', patientData);
      },
      
      update: async (id, patientData) => {
        return await apiRequest(`/api/patients/${id}`, 'PUT', patientData);
      },
      
      delete: async (id) => {
        return await apiRequest(`/api/patients/${id}`, 'DELETE');
      }
    };
    
    // Vital Signs API methods
    const vitals = {
      getByPatient: async (patientId, page = 1, limit = 50, filters = {}) => {
        const queryParams = new URLSearchParams({ page, limit, ...filters });
        return await apiRequest(`/api/vitals/patient/${patientId}?${queryParams}`);
      },
      
      getLatest: async (patientId) => {
        return await apiRequest(`/api/vitals/patient/${patientId}/latest`);
      },
      
      record: async (vitalData) => {
        return await apiRequest('/api/vitals', 'POST', vitalData);
      },
      
      update: async (id, vitalData) => {
        return await apiRequest(`/api/vitals/${id}`, 'PUT', vitalData);
      }
    };
    
    // Alerts API methods
    const alerts = {
      getAll: async (page = 1, limit = 20, filters = {}) => {
        const queryParams = new URLSearchParams({ page, limit, ...filters });
        return await apiRequest(`/api/alerts?${queryParams}`);
      },
      
      getByPatient: async (patientId, page = 1, limit = 20, filters = {}) => {
        const queryParams = new URLSearchParams({ page, limit, ...filters });
        return await apiRequest(`/api/alerts/patient/${patientId}?${queryParams}`);
      },
      
      getById: async (id) => {
        return await apiRequest(`/api/alerts/${id}`);
      },
      
      resolve: async (id, resolutionNotes) => {
        return await apiRequest(`/api/alerts/${id}/resolve`, 'PUT', { resolutionNotes });
      },
      
      acknowledge: async (id) => {
        return await apiRequest(`/api/alerts/${id}/acknowledge`, 'PUT');
      },
      
      create: async (alertData) => {
        return await apiRequest('/api/alerts', 'POST', alertData);
      },
      
      getStats: async (filters = {}) => {
        const queryParams = new URLSearchParams(filters);
        return await apiRequest(`/api/alerts/stats?${queryParams}`);
      }
    };
    
    // Dashboard API methods
    const dashboard = {
      // Get dashboard statistics
      getStats: async () => {
        // This is a custom endpoint we'll need to create on the backend
        // For now, we'll mock it by combining data from other endpoints
        
        try {
          // Get active alerts count
          const alertsResponse = await alerts.getAll(1, 1, { resolved: false });
          const activeAlertsCount = alertsResponse.success ? alertsResponse.data.pagination.total : 0;
          
          // Get total patients count
          const patientsResponse = await patients.getAll(1, 1);
          const totalPatientsCount = patientsResponse.success ? patientsResponse.data.pagination.total : 0;
          
          // Get recent alerts (last 5)
          const recentAlertsResponse = await alerts.getAll(1, 5);
          const recentAlerts = recentAlertsResponse.success ? recentAlertsResponse.data.data : [];
          
          // Get alert statistics
          const alertStatsResponse = await alerts.getStats();
          const alertStats = alertStatsResponse.success ? alertStatsResponse.data.data : null;
          
          return {
            success: true,
            data: {
              totalPatients: totalPatientsCount,
              activeAlerts: activeAlertsCount,
              monitoringCount: totalPatientsCount, // We could refine this with a status filter
              activeDevices: 0, // Would need a devices endpoint
              recentAlerts,
              alertStats
            }
          };
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          return { success: false, error: error.message };
        }
      }
    };
    
    // Public API
    return {
      patients,
      vitals,
      alerts,
      dashboard
    };
  })();