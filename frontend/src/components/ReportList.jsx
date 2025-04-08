import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getReports } from '../api';
import ReportItem from './ReportItem';
import {
  ArrowLeftEndOnRectangleIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Updated from 'adminToken' for consistency
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-primary">Department Reports</h2>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* Reports List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-gray-500 text-center">No reports found for your department.</p>
        ) : (
          reports.map((report) => (
            <ReportItem key={report._id} report={report} onUpdate={fetchReports} />
          ))
        )}
      </div>
    </div>
  );
};

export default ReportList;