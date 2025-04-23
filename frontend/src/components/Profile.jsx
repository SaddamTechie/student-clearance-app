import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../App';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  ArrowLeftEndOnRectangleIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

function Profile() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch user info from /me endpoint
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get(`${apiUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load user information');
        setLoading(false);
        toast.error(err.message || 'Error fetching profile');
        if (err.message === 'No authentication token found') {
          navigate('/login');
        }
      }
    };
    fetchUserInfo();
  }, [navigate]);

  // Update password
  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword) {
      setError('Both old and new passwords are required');
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${apiUrl}/staff/password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOldPassword('');
      setNewPassword('');
      setError('');
      toast.success('Password updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      toast.error(error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Profile</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
            <span>Back</span>
          </button>
          {/* <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
          >
            <ArrowLeftEndOnRectangleIcon className="h-6 w-6" />
            <span>Logout</span>
          </button> */}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* User Info */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
          <UserIcon className="h-6 w-6" />
          <span>User Information</span>
        </h2>
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </div>
        ) : userInfo ? (
          <div className="space-y-2">
            {userInfo.name && (
              <p>
                <span className="font-semibold text-gray-700">Name:</span>{' '}
                {userInfo.name}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-700">Email:</span>{' '}
              {userInfo.email}
            </p>
            {userInfo.studentId && (
              <p>
                <span className="font-semibold text-gray-700">Student ID:</span>{' '}
                {userInfo.studentId}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-700">Role:</span>{' '}
              {userInfo.role}
            </p>
            {userInfo.department && (
              <p>
                <span className="font-semibold text-gray-700">Department:</span>{' '}
                {userInfo.department}
              </p>
            )}
            <p>
              <span className="font-semibold text-gray-700">Account Created:</span>{' '}
              {new Date(userInfo.createdAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No user information available</p>
        )}
      </div>

      {/* Update Password */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
          <LockClosedIcon className="h-6 w-6" />
          <span>Update Password</span>
        </h2>
        {loading ? (
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleUpdatePassword}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors w-full md:w-auto"
            >
              Update Password
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;