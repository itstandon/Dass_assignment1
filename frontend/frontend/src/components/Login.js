import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '../utils/axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', formData);
      
      // PERSISTENCE: Save token to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // SET TOKEN IN AXIOS HEADERS
      setAuthToken(res.data.token);

      // REDIRECT: Send user to their specific dashboard [Section 5: Onboarding Check]
      if (res.data.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (res.data.role === 'Organizer') {
        navigate('/organizer-dashboard');
      } else if (res.data.role === 'Participant') {
        // Check if participant has completed onboarding
        if (res.data.onboardingCompleted) {
          navigate('/participant-dashboard');
        } else {
          navigate('/onboarding');
        }
      }
      
    } catch (err) {
      alert(err.response?.data?.msg || "Login Failed");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login</h2>
      
      {/* Register Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => navigate('/register')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📝 Create New Account
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email" 
          onChange={e => setFormData({...formData, email: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={e => setFormData({...formData, password: e.target.value})}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;