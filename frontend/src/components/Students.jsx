import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { apiUrl } from '../App';
import {
  UserIcon,
  ArrowLeftEndOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

function Students() {
  const [students, setStudents] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Please log in to view students');
        }
        const url = yearFilter
          ? `${apiUrl}/students?year=${yearFilter}`
          : `${apiUrl}/students`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(response.data.students);
        setLoading(false);
      } catch (err) {
        let message = err.response?.data?.message || 'Failed to fetch students';
        if (err.response?.status === 401) {
          message = 'Session expired. Please log in again.';
          toast.error(message, {
            onAutoClose: () => {
              localStorage.removeItem('authToken');
              navigate('/login');
            },
          });
        } else if (err.response?.status === 403) {
          message = 'Only admins can view this page.';
          toast.error(message);
        } else {
          toast.error(message);
        }
        setError(message);
        setLoading(false);
      }
    };
    fetchStudents();
  }, [yearFilter, navigate]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Student Clearance Status</h1>
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex justify-between items-center">
          {error}
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              setStudents([]);
              setYearFilter(yearFilter); // Trigger re-fetch
            }}
            className="bg-primary text-white px-4 py-1 rounded-md hover:bg-secondary transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Filter by Year</label>
        <div className="relative">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full md:w-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Students Table/Cards */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Student ID</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-primary text-white">
                  <tr>
                    <th className="p-3 text-left">Student ID</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Year</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.studentId} className="border-b hover:bg-gray-50">
                        <td className="p-3">{student.studentId}</td>
                        <td className="p-3">{student.email}</td>
                        <td className="p-3">{student.yearOfStudy}</td>
                        {console.log(student)}
                        <td
                          className={`p-3 ${
                            student.overallStatus === 'cleared'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {student.yearOfStudy === 4 ? student.overallStatus:'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile: Cards */}
            <div className="md:hidden space-y-4 p-4">
              {students.length === 0 ? (
                <p className="text-center text-gray-500">No students found</p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.studentId}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-lg font-semibold text-gray-700">
                      {student.studentId}
                    </h2>
                    <p className="text-gray-600 mt-1">Email: {student.email}</p>
                    <p className="text-gray-600 mt-1">Year: {student.year}</p>
                    <p
                      className={`mt-1 ${
                        student.overallStatus === 'cleared'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      Status: {student.overallStatus}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Students;