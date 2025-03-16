// Charts helper module
const ChartHelpers = (function() {
    // Color scheme
    const colors = {
      primary: 'rgba(67, 97, 238, 1)',
      primaryLight: 'rgba(67, 97, 238, 0.2)',
      danger: 'rgba(230, 57, 70, 1)',
      dangerLight: 'rgba(230, 57, 70, 0.2)',
      warning: 'rgba(249, 168, 38, 1)',
      warningLight: 'rgba(249, 168, 38, 0.2)',
      success: 'rgba(47, 179, 128, 1)',
      successLight: 'rgba(47, 179, 128, 0.2)',
      info: 'rgba(76, 201, 240, 1)',
      infoLight: 'rgba(76, 201, 240, 0.2)'
    };
  
    // Create a responsive line chart
    const createLineChart = (canvasId, data, options = {}) => {
      const ctx = document.getElementById(canvasId).getContext('2d');
      
      // Default options
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        elements: {
          line: {
            tension: 0.4
          },
          point: {
            radius: 3,
            hoverRadius: 5
          }
        }
      };
      
      // Merge options
      const chartOptions = { ...defaultOptions, ...options };
      
      return new Chart(ctx, {
        type: 'line',
        data: data,
        options: chartOptions
      });
    };
    
    // Create a bar chart
    const createBarChart = (canvasId, data, options = {}) => {
      const ctx = document.getElementById(canvasId).getContext('2d');
      
      // Default options
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      };
      
      // Merge options
      const chartOptions = { ...defaultOptions, ...options };
      
      return new Chart(ctx, {
        type: 'bar',
        data: data,
        options: chartOptions
      });
    };
    
    // Create a doughnut/pie chart
    const createDoughnutChart = (canvasId, data, options = {}) => {
      const ctx = document.getElementById(canvasId).getContext('2d');
      
      // Default options
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        cutout: '50%'
      };
      
      // Merge options
      const chartOptions = { ...defaultOptions, ...options };
      
      return new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: chartOptions
      });
    };
    
    // Generate random data for testing
    const generateMockVitalsData = (days = 7) => {
      const labels = [];
      const heartRateData = [];
      const temperatureData = [];
      const oxygenData = [];
      
      const now = new Date();
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        // Random data within normal ranges
        heartRateData.push(Math.floor(Math.random() * 30) + 60); // 60-90 bpm
        temperatureData.push((Math.random() * 1.5 + 36).toFixed(1)); // 36-37.5 °C
        oxygenData.push(Math.floor(Math.random() * 5) + 95); // 95-100 %
      }
      
      return {
        labels,
        datasets: [
          {
            label: 'Heart Rate (bpm)',
            data: heartRateData,
            borderColor: colors.danger,
            backgroundColor: colors.dangerLight,
            fill: true
          },
          {
            label: 'Temperature (°C)',
            data: temperatureData,
            borderColor: colors.warning,
            backgroundColor: colors.warningLight,
            fill: true
          },
          {
            label: 'Oxygen Saturation (%)',
            data: oxygenData,
            borderColor: colors.info,
            backgroundColor: colors.infoLight,
            fill: true
          }
        ]
      };
    };
  
    // Public API
    return {
      colors,
      createLineChart,
      createBarChart,
      createDoughnutChart,
      generateMockVitalsData
    };
  })();
  
  console.log('Charts.js loaded successfully');