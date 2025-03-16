// Authentication module
const Auth = (function() {
    // Private variables
    let token = localStorage.getItem('token');
    let user = JSON.parse(localStorage.getItem('user'));
    
    // Check if token exists and is valid
    const isAuthenticated = () => {
      return !!token;
    };
    
    // Get current user
    const getUser = () => {
      return user;
    };
    
    // Get token
    const getToken = () => {
      return token;
    };
    
    // Login user
    const login = async (email, password) => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }
        
        // Save token and user in localStorage
        token = data.token;
        user = data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user };
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }
    };
    
    // Logout user
    const logout = async () => {
      try {
        // Call logout API (optional, depends on your backend implementation)
        if (token) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        token = null;
        user = null;
        
        return { success: true };
      } catch (error) {
        console.error('Logout error:', error);
        
        // Still clear localStorage even if API call fails
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        token = null;
        user = null;
        
        return { success: true };
      }
    };
    
    // Register user (if needed)
    const register = async (userData) => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        
        return { success: true, user: data.user };
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }
    };
    
    // Check current auth state from API
    const checkAuthState = async () => {
      if (!token) {
        return { success: false, error: 'No token found' };
      }
      
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }
        
        // Update user data
        user = data.data;
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user };
      } catch (error) {
        console.error('Auth check error:', error);
        
        // Clear localStorage if token is invalid
        if (error.message.includes('Authentication failed') || 
            error.message.includes('jwt') || 
            error.message.includes('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          token = null;
          user = null;
        }
        
        return { success: false, error: error.message };
      }
    };
    
    // Public API
    return {
      isAuthenticated,
      getUser,
      getToken,
      login,
      logout,
      register,
      checkAuthState
    };
  })();