import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { NotificationContext } from '../contexts/NotificationContext';
import { BellIcon, UserIcon, ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { role, logout } = useContext(AuthContext) || {};
  const notificationContext = useContext(NotificationContext);
  const unreadCount = notificationContext ? notificationContext.unreadCount : 0; // Fallback to 0
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold flex items-center space-x-2">
            <img src="/logo.png" alt="Logo" className="h-12 w-12" />
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          {role === 'admin' && (
            <>
              <Link to="/" className="hover:text-secondary transition-colors">
                Dashboard
              </Link>
            </>
          )}
          {role === 'staff' && (
            <>
              <Link to="/reports" className="hover:text-secondary transition-colors">
                Reports
              </Link>
              <Link to="/scan" className="hover:text-secondary transition-colors">
                Scan QR
              </Link>
            </>
          )}

          {/* Notification Icon */}
          <Link to="/notifications" className="relative">
            <BellIcon className="h-6 w-6 hover:text-secondary transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Icon */}
          <Link to="/profile">
            <UserIcon className="h-6 w-6 hover:text-secondary transition-colors" />
          </Link>

          {/* Logout Icon */}
          <button onClick={handleLogout}>
            <ArrowLeftEndOnRectangleIcon className="h-6 w-6 hover:text-secondary transition-colors" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;