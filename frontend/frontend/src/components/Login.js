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
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      
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
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} />
      <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;