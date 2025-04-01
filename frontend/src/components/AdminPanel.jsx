import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../App';
import { useNavigate } from 'react-router-dom';

function AdminPanel({ onLogout }) {
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(`${apiUrl}/staff/register`, { email, department }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Staff registered successfully');
      setEmail('');
      setDepartment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={() => navigate('/profile')}>Profile</button>
      <button onClick={onLogout}>Logout</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Register Staff</h3>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <select value={department} onChange={(e) => setDepartment(e.target.value)}>
        <option value="">Select Department</option>
        <option value="finance">Finance</option>
        <option value="library">Library</option>
        <option value="department">Department</option>
        <option value="hostel">Hostel</option>
        <option value="administration">Administration</option>
      </select>
      <button onClick={handleRegister}>Register Staff</button>
    </div>
  );
}

export default AdminPanel;