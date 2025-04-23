import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../App';
import { toast } from 'sonner';
import {
  TrashIcon,
  PlusIcon,
  UserIcon,
  ArrowLeftEndOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

function AdminPanel() {
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${apiUrl}/staff/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStaffList(response.data);
        setFilteredStaff(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch staff');
        setLoading(false);
        toast.error('Failed to load staff list');
      }
    };
    fetchStaff();
  }, []);

  // Filter staff by department
  useEffect(() => {
    if (departmentFilter === '') {
      setFilteredStaff(staffList);
    } else {
      setFilteredStaff(staffList.filter((staff) => staff.department === departmentFilter));
    }
  }, [departmentFilter, staffList]);

  // Register new staff
  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${apiUrl}/staff/register`,
        { email, department },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStaffList((prev) => [...prev, response.data.staff]);
      setEmail('');
      setDepartment('');
      setIsModalOpen(false);
      toast.success('Staff registered successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error(error);
    }
  };

  // Delete staff
  const handleDelete = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${apiUrl}/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList((prev) => prev.filter((staff) => staff._id !== staffId));
      toast.success('Staff deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
        {/* <div className="flex space-x-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
          >
            <UserIcon className="h-6 w-6" />
            <span>Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
          >
            <ArrowLeftEndOnRectangleIcon className="h-6 w-6" />
            <span>Logout</span>
          </button>
        </div> */}
      </div>

      {/* Add Staff Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Filter by Department</label>
        <div className="relative">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full md:w-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">All Departments</option>
            <option value="finance">Finance</option>
            <option value="library">Library</option>
            <option value="academic">Academics</option>
            <option value="hostel">Hostel</option>
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No staff found
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{staff.email}</td>
                    <td className="p-3 capitalize">{staff.department}</td>
                    <td className="p-3">{staff.role}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(staff._id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Adding Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-primary mb-4">Register New Staff</h3>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option value="">Select Department</option>
                <option value="finance">Finance</option>
                <option value="library">Library</option>
                <option value="academics">Academics</option>
                <option value="hostel">Hostel</option>
              </select>
              <ChevronDownIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;