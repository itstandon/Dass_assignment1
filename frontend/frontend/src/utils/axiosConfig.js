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

export default axios;