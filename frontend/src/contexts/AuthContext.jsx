import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAuthenticated(true);
        setRole(decoded.role);
        setDepartment(decoded.department);
        setUserId(decoded.id);
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('authToken');
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('authToken', token);
    const decoded = JSON.parse(atob(token.split('.')[1]));
    setIsAuthenticated(true);
    setRole(decoded.role);
    setDepartment(decoded.department);
    setUserId(decoded.id);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setRole(null);
    setDepartment(null);
    setUserId(null);
  };

  const value = { isAuthenticated, role, department, userId, login, logout };

  // If children is a function, call it with the context value; otherwise, render it directly
  return (
    <AuthContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </AuthContext.Provider>
  );
};