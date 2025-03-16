// UI module for handling common UI interactions
const UI = (function() {
    // Private variables
    let currentPage = 'dashboard';
    
    // Cache DOM elements
    const DOM = {
      // Layout elements
      sidebar: document.querySelector('.sidebar'),
      menuToggle: document.getElementById('menu-toggle'),
      navItems: document.querySelectorAll('.nav-item'),
      pageContainers: document.querySelectorAll('.page-container'),
      
      // User info elements
      userName: document.getElementById('user-name'),
      userRole: document.getElementById('user-role'),
      logoutBtn: document.getElementById('logout-btn'),
      
      // Auth page
      authPage: document.getElementById('auth-page'),
      loginForm: document.getElementById('login-form'),
      loginError: document.getElementById('login-error'),
      
      // Notifications
      notificationsBtn: document.getElementById('notifications-btn'),
      notificationsCount: document.getElementById('notifications-count'),
      notificationsDropdown: document.getElementById('notifications-dropdown'),
      notificationsList: document.getElementById('notifications-list'),
      markAllReadBtn: document.getElementById('mark-all-read-btn'),
      
      // Modals
      modalOverlay: document.getElementById('modal-overlay'),
      patientModal: document.getElementById('patient-modal'),
      vitalsModal: document.getElementById('vitals-modal'),
      alertModal: document.getElementById('alert-modal')
    };
    
    // Initialize UI
    const init = () => {
      // Setup event listeners
      setupEventListeners();
      
      // Check authentication status
      checkAuthStatus();
    };
    
    // Setup event listeners
    const setupEventListeners = () => {
      // Menu toggle
      DOM.menuToggle.addEventListener('click', toggleSidebar);
      
      // Navigation
      DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
          const page = item.dataset.page;
          navigateTo(page);
        });
      });
      
      // Logout button
      DOM.logoutBtn.addEventListener('click', handleLogout);
      
      // Login form
      DOM.loginForm.addEventListener('submit', handleLogin);
      
      // Notifications dropdown
      DOM.notificationsBtn.addEventListener('click', toggleNotifications);
      DOM.markAllReadBtn.addEventListener('click', markAllNotificationsRead);
      
      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        // Close notifications dropdown if clicking outside
        if (DOM.notificationsDropdown.classList.contains('hidden') === false &&
            !DOM.notificationsBtn.contains(e.target) &&
            !DOM.notificationsDropdown.contains(e.target)) {
          DOM.notificationsDropdown.classList.add('hidden');
        }
      });
      
      // Modal close buttons
      document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeAllModals());
      });
      
      // Close modal when clicking overlay
      DOM.modalOverlay.addEventListener('click', closeAllModals);
    };
    
    // Check authentication status
    const checkAuthStatus = async () => {
      if (Auth.isAuthenticated()) {
        const { success } = await Auth.checkAuthState();
        
        if (success) {
          showAuthenticatedUI();
        } else {
          showLoginPage();
        }
      } else {
        showLoginPage();
      }
    };
    
    // Show authenticated UI
    const showAuthenticatedUI = () => {
      // Hide auth page
      DOM.authPage.classList.add('hidden');
      
      // Show app content
      document.querySelector('.sidebar').classList.remove('hidden');
      document.querySelector('.main-content').classList.remove('hidden');
      
      // Update user info
      const user = Auth.getUser();
      if (user) {
        DOM.userName.textContent = user.name;
        DOM.userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      }
      
      // Navigate to default page
      navigateTo('dashboard');
      
      // Initialize socket connection
      initializeSocketConnection();
    };
    
    // Show login page
    const showLoginPage = () => {
      // Hide app content
      document.querySelector('.sidebar').classList.add('hidden');
      document.querySelector('.main-content').classList.remove('hidden');
      
      // Hide all page containers except auth page
      DOM.pageContainers.forEach(container => {
        container.classList.add('hidden');
      });
      
      // Show auth page
      DOM.authPage.classList.remove('hidden');
      
      // Clear login form
      DOM.loginForm.reset();
      DOM.loginError.classList.add('hidden');
    };
    
    // Handle login form submission
    const handleLogin = async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Validate inputs
      if (!email || !password) {
        showError('Please enter email and password');
        return;
      }
      
      // Show loading state
      const submitBtn = DOM.loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      
      // Call login API
      const { success, error } = await Auth.login(email, password);
      
      // Reset button
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
      
      if (success) {
        showAuthenticatedUI();
      } else {
        showError(error || 'Login failed');
      }
    };
    
    // Handle logout
    const handleLogout = async () => {
      await Auth.logout();
      showLoginPage();
    };
    
    // Show error message
    const showError = (message) => {
      DOM.loginError.textContent = message;
      DOM.loginError.classList.remove('hidden');
    };
    
    // Toggle sidebar
    const toggleSidebar = () => {
      document.body.classList.toggle('sidebar-collapsed');
    };
    
    // Navigate to page
    const navigateTo = (page) => {
      // Update active nav item
      DOM.navItems.forEach(item => {
        if (item.dataset.page === page) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Hide all page containers
      DOM.pageContainers.forEach(container => {
        container.classList.add('hidden');
      });
      
      // Show selected page
      const pageContainer = document.getElementById(`${page}-page`);
      if (pageContainer) {
        pageContainer.classList.remove('hidden');
      }
      
      // Update current page
      currentPage = page;
      
      // Load page data
      switch (page) {
        case 'dashboard':
          // Dashboard module will handle this
          if (typeof Dashboard !== 'undefined') {
            Dashboard.loadDashboard();
          }
          break;
        case 'patients':
          // Patients module will handle this
          if (typeof PatientsModule !== 'undefined') {
            PatientsModule.loadPatients();
          }
          break;
        case 'vitals':
          // Vitals module will handle this
          if (typeof VitalsModule !== 'undefined') {
            VitalsModule.init();
          }
          break;
        case 'alerts':
          // Alerts module will handle this
          if (typeof AlertsModule !== 'undefined') {
            AlertsModule.loadAlerts();
          }
          break;
      }
    };
    
    // Toggle notifications dropdown
    const toggleNotifications = (e) => {
      e.stopPropagation();
      DOM.notificationsDropdown.classList.toggle('hidden');
    };
    
    // Mark all notifications as read
    const markAllNotificationsRead = () => {
      const notifications = DOM.notificationsList.querySelectorAll('.notification-item');
      notifications.forEach(item => {
        item.classList.remove('unread');
      });
      
      // Update notification count
      updateNotificationCount(0);
    };
    
    // Update notification count
    const updateNotificationCount = (count) => {
      DOM.notificationsCount.textContent = count;
      if (count > 0) {
        DOM.notificationsCount.classList.remove('hidden');
      } else {
        DOM.notificationsCount.classList.add('hidden');
      }
    };
    
    // Add notification
    const addNotification = (notification) => {
      // Create notification item
      const notificationItem = document.createElement('div');
      notificationItem.className = 'notification-item unread';
      notificationItem.dataset.id = notification.id;
      
      // Create notification content
      notificationItem.innerHTML = `
        <div class="notification-header">
          <span class="notification-title">${notification.title}</span>
          <span class="notification-time">${formatTime(notification.timestamp)}</span>
        </div>
        <div class="notification-message">${notification.message}</div>
      `;
      
      // Add click event to mark as read
      notificationItem.addEventListener('click', () => {
        notificationItem.classList.remove('unread');
        
        // Update count
        const unreadCount = DOM.notificationsList.querySelectorAll('.notification-item.unread').length;
        updateNotificationCount(unreadCount);
        
        // Handle notification action (e.g., navigate to alert)
        if (notification.url) {
          navigateTo(notification.url);
        }
      });
      
      // Add to notifications list
      DOM.notificationsList.prepend(notificationItem);
      
      // Update count
      const unreadCount = DOM.notificationsList.querySelectorAll('.notification-item.unread').length;
      updateNotificationCount(unreadCount);
    };
    
    // Initialize Socket.io connection
    const initializeSocketConnection = () => {
      const token = Auth.getToken();
      
      if (!token) return;
      
      // Create socket connection with auth token
      const socket = io({
        auth: {
          token
        }
      });
      
      // Socket connection event
      socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      // Socket error event
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });
      
      // Listen for vital sign updates
      socket.on('vitalSignUpdate', (vitalSign) => {
        console.log('Received vital sign update:', vitalSign);
        
        // Update UI if on vitals page
        if (currentPage === 'vitals' && VitalsModule && VitalsModule.getCurrentPatientId() === vitalSign.patientId) {
          VitalsModule.updateVitals(vitalSign);
        }
      });
      
      // Listen for new alerts
      socket.on('newAlert', (alert) => {
        console.log('Received new alert:', alert);
        
        // Create notification
        addNotification({
          id: alert._id,
          title: `Alert: ${alert.alertType}`,
          message: alert.message,
          timestamp: new Date(alert.timestamp),
          url: 'alerts'
        });
        
        // Update alerts page if viewing it
        if (currentPage === 'alerts' && AlertsModule) {
          AlertsModule.loadAlerts();
        }
        
        // Update dashboard if viewing it
        if (currentPage === 'dashboard' && Dashboard) {
          Dashboard.loadRecentAlerts();
        }
      });
      
      // Listen for critical alerts
      socket.on('criticalAlert', (alert) => {
        console.log('Received critical alert:', alert);
        
        // Create notification with sound
        playAlertSound();
        
        // Add notification with special styling
        addNotification({
          id: alert._id,
          title: `CRITICAL ALERT: ${alert.alertType}`,
          message: alert.message,
          timestamp: new Date(alert.timestamp),
          url: 'alerts'
        });
      });
      
      // Listen for alert resolutions
      socket.on('alertResolved', (data) => {
        console.log('Alert resolved:', data);
        
        // Update alerts page if viewing it
        if (currentPage === 'alerts' && AlertsModule) {
          AlertsModule.loadAlerts();
        }
        
        // Update dashboard if viewing it
        if (currentPage === 'dashboard' && Dashboard) {
          Dashboard.loadRecentAlerts();
        }
      });
      
      // Store socket in global scope
      window.socket = socket;
    };
    
    // Play alert sound
    const playAlertSound = () => {
      try {
        const audio = new Audio('/sounds/alert.mp3');
        audio.play();
      } catch (error) {
        console.error('Error playing alert sound:', error);
      }
    };
    
    // Format time for display
    const formatTime = (date) => {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) {
        return 'Just now';
      } else if (diffMin < 60) {
        return `${diffMin} min ago`;
      } else if (diffHour < 24) {
        return `${diffHour} hr ago`;
      } else if (diffDay < 7) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else {
        // Format date
        return date.toLocaleDateString();
      }
    };
    
    // Modal functions
    const openModal = (modalId) => {
      DOM.modalOverlay.classList.remove('hidden');
      document.getElementById(modalId).classList.remove('hidden');
    };
    
    const closeModal = (modalId) => {
      document.getElementById(modalId).classList.add('hidden');
      DOM.modalOverlay.classList.add('hidden');
    };
    
    const closeAllModals = () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
      });
      DOM.modalOverlay.classList.add('hidden');
    };
    
    // Create pagination controls
    const createPagination = (elementId, currentPage, totalPages, onClick) => {
      const paginationElement = document.getElementById(elementId);
      if (!paginationElement) return;
      
      paginationElement.innerHTML = '';
      
      // Don't show pagination if only one page
      if (totalPages <= 1) return;
      
      // Previous button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'pagination-btn';
      prevBtn.innerHTML = '&laquo;';
      prevBtn.disabled = currentPage === 1;
      if (currentPage > 1) {
        prevBtn.addEventListener('click', () => onClick(currentPage - 1));
      }
      paginationElement.appendChild(prevBtn);
      
      // Page numbers
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + 4);
      
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
          if (i !== currentPage) {
            onClick(i);
          }
        });
        paginationElement.appendChild(pageBtn);
      }
      
      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'pagination-btn';
      nextBtn.innerHTML = '&raquo;';
      nextBtn.disabled = currentPage === totalPages;
      if (currentPage < totalPages) {
        nextBtn.addEventListener('click', () => onClick(currentPage + 1));
      }
      paginationElement.appendChild(nextBtn);
    };
    
    // Public API
    return {
      init,
      navigateTo,
      formatTime,
      openModal,
      closeModal,
      closeAllModals,
      createPagination
    };
  })();
  
  // Initialize UI when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    UI.init();
  });