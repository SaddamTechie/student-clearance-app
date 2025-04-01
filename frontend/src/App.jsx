import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Requests from './components/Requests';
import Profile from './components/Profile';
import ReportList from './components/ReportList';
import QRScanner from './components/QRScanner';

const apiUrl = 'http://localhost:5000/api/clearance';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      const decoded = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      setRole(decoded.role);
      setDepartment(decoded.department);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setRole(null);
    setDepartment(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} setRole={setRole} setDepartment={setDepartment} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={
            isAuthenticated && role === 'staff' ? (
              <Requests department={department} onLogout={handleLogout} />
            ) : isAuthenticated && role === 'admin' ? (
              <AdminPanel onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route path="/reports" element={<ReportList/>} />
        <Route
          path="/scan"
          element={
              <QRScanner />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
export { apiUrl };