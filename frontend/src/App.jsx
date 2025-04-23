import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import Requests from './components/Requests';
import Profile from './components/Profile';
import ReportList from './components/ReportList';
import QRScanner from './components/QRScanner';
import StaffDashboard from './components/StaffDashboard';
import Notifications from './components/Notifications';
import Students from './components/Students';

export const apiUrl = import.meta.env.VITE_API_URL;
export const socketUrl = import.meta.env.VITE_SOCKET_URL;

function App() {
  return (
    <AuthProvider>
      {(authContext) => (
        <NotificationProvider userId={authContext.isAuthenticated ? authContext.userId : null}>
          <Router>
            <div className="min-h-screen bg-gray-100">
              {authContext.isAuthenticated && <Navbar />}
              <Routes>
                <Route
                  path="/login"
                  element={
                    !authContext.isAuthenticated ? (
                      <Login
                        setAuth={(val) => authContext.login(val)}
                        setRole={() => {}} // Not needed with context
                        setDepartment={() => {}} // Not needed with context
                      />
                    ) : (
                      <Navigate to="/" />
                    )
                  }
                />
                <Route
                  path="/"
                  element={
                    authContext.isAuthenticated && authContext.role === 'staff' ? (
                      <StaffDashboard department={authContext.department} />
                    ) : authContext.isAuthenticated && authContext.role === 'admin' ? (
                      <AdminPanel />
                    ) : (
                      <Navigate to="/login" />
                    )
                  }
                />
                <Route
                  path="/profile"
                  element={authContext.isAuthenticated ? <Profile /> : <Navigate to="/login" />}
                />
                <Route
                  path="/reports"
                  element={authContext.isAuthenticated ? <ReportList /> : <Navigate to="/login" />}
                />
                <Route
                  path="/students"
                  element={authContext.isAuthenticated ? <Students/> : <Navigate to="/login" />}
                />
                <Route
                  path="/scan"
                  element={authContext.isAuthenticated ? <QRScanner /> : <Navigate to="/login" />}
                />
                <Route
                  path="/notifications"
                  element={authContext.isAuthenticated ? <Notifications /> : <Navigate to="/login" />}
                />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      )}
    </AuthProvider>
  );
}

export default App;