import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../App';
import { useNavigate } from 'react-router-dom';

function Profile({ onLogout }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleUpdatePassword = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${apiUrl}/staff/password`, { oldPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Password updated successfully');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      <button onClick={() => navigate('/')}>Back</button>
      <button onClick={onLogout}>Logout</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <h3>Update Password</h3>
      <input
        type="password"
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button onClick={handleUpdatePassword}>Update Password</button>
    </div>
  );
}

export default Profile;