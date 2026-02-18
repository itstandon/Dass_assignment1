import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    contactNumber: '',
    college: '',
    participantType: 'IIIT' // Default to IIIT as per requirement
  });

  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      await axios.post('/api/auth/register', formData);
      alert("Registration Successful!");
      navigate('/login');
    } catch (err) {
      // This will catch the "IIIT students must use @iiit.ac.in..." error from your backend
      alert(err.response?.data?.msg || "Registration Failed");
    }
  };

  return (
    <div className="register-container">
      <h2>Participant Registration</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="First Name" required onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
        <input type="text" placeholder="Last Name" required onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
        <input type="email" placeholder="Email" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
        <input type="password" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
        <input type="tel" placeholder="Contact Number" required onChange={(e) => setFormData({...formData, contactNumber: e.target.value})} />
        <input type="text" placeholder="College/Organization Name" required onChange={(e) => setFormData({...formData, college: e.target.value})} />
        
        <select value={formData.participantType} onChange={(e) => setFormData({...formData, participantType: e.target.value})}>
          <option value="IIIT">IIIT Student</option>
          <option value="Non-IIIT">Non-IIIT Participant</option>
        </select>
        
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;