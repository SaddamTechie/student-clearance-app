import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { apiUrl } from '../App';

const StaffDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');

  // Fetch requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/staff/requests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setRequests(response.data);
      filterRequests(response.data, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests by status
  const filterRequests = (data, filter) => {
    if (filter === 'all') {
      setFilteredRequests(data);
    } else {
      setFilteredRequests(data.filter((req) => req.status === filter));
    }
  };

  useEffect(() => {
    filterRequests(requests, statusFilter);
  }, [statusFilter, requests]);

  // Update request status
  const handleUpdateStatus = async (studentId, status) => {
    try {
      const response = await axios.post(
        `${apiUrl}/staff/update-clearance`,
        { studentId, status, comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setRequests((prev) =>
        prev.map((req) =>
          req.studentId === studentId ? { ...req, status, comment: response.data.comment } : req
        )
      );
      setSelectedRequest(null);
      setComment('');
      toast.success(`Request ${status} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} request`);
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Staff Dashboard</h1>
        <button
          onClick={fetchRequests}
          className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
        >
          <ArrowPathIcon className="h-6 w-6" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Filter by Status</label>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="pending">Pending</option>
            <option value="cleared">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Student ID</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Obligations</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filteredRequests.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No requests found</p>
        ) : (
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 text-left">Student ID</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Obligations</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.studentId} className="border-b hover:bg-gray-50">
                  <td className="p-3">{req.studentId}</td>
                  <td className="p-3">
                    <span
                      className={`${
                        req.status === 'cleared'
                          ? 'text-green-600'
                          : req.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3">{req.obligations?.join(', ') || 'None'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="text-primary hover:text-secondary transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-primary mb-4">Request Details</h3>
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-gray-700">Student ID:</span>{' '}
                {selectedRequest.studentId}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Status:</span>{' '}
                {selectedRequest.status}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Obligations:</span>{' '}
                {selectedRequest.obligations?.join(', ') || 'None'}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Comment:</span>{' '}
                {selectedRequest.comment || 'None'}
              </p>
            </div>
            {selectedRequest.status === 'pending' && (
              <>
                <textarea
                  placeholder="Add a comment (optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 mt-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex justify-end space-x-4 mt-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.studentId, 'cleared')}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors flex items-center space-x-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRequest.studentId, 'rejected')}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setSelectedRequest(null)}
              className="mt-4 text-gray-700 hover:text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;