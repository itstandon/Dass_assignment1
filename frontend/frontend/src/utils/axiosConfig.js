import axios from 'axios';

// Set base URL for all requests
axios.defaults.baseURL = 'https://cozy-magic-production.up.railway.app';

// Function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// Set token from localStorage on app initialization
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Add response interceptor to handle archived accounts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // If account is archived (403) or token invalid (401), logout user
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      const errorMsg = error.response.data?.msg || '';
      
      // Check if it's an archived account error
      if (errorMsg.includes('archived') || errorMsg.includes('Token is not valid')) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setAuthToken(null);
        
        // Redirect to login with error message
        alert(errorMsg || 'Session expired. Please login again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;