import React, { useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../App';

function Login({ setAuth, setRole, setDepartment }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiUrl}/login`, { email, password });
      if (response.data.role === 'student') {
        setError('This portal is for staff only');
        return;
      }
      localStorage.setItem('authToken', response.data.token);
      setAuth(true);
      setRole(response.data.role);
      setDepartment(response.data.department);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <h2>Staff Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;