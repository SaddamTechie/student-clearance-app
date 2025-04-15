import React from 'react';
import { updateReportStatus } from '../api';
import { toast } from 'sonner';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ReportItem = ({ report, onUpdate }) => {
  const handleResolve = async () => {
    try {
      await updateReportStatus(report._id, 'resolved');
      toast.success('Report marked as resolved');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve report');
    }
  };

  return (
    <div className="border-b p-4 hover:bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <p className="text-gray-700">
            <span className="font-semibold">Department :</span> {report.department}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Student ID:</span> {report.studentId}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Message:</span> {report.message}
          </p>
        </div>
        <div>
          <p className="text-gray-700">
            <span className="font-semibold">Status:</span>{' '}
            <span
              className={`${
                report.status === 'resolved' ? 'text-green-600' : 'text-yellow-600'
              }`}
            >
              {report.status}
            </span>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Date:</span>{' '}
            {new Date(report.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      {report.status === 'pending' && (
        <button
          onClick={handleResolve}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors flex items-center space-x-2"
        >
          <CheckCircleIcon className="h-5 w-5" />
          <span>Mark as Resolved</span>
        </button>
      )}
    </div>
  );
};

export default ReportItem;