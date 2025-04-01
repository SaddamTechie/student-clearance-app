import React from 'react';
import { updateReportStatus } from '../api';

const ReportItem = ({ report, onUpdate }) => {
  const handleResolve = async () => {
    try {
      await updateReportStatus(report._id, 'resolved');
      onUpdate(); // Refresh list
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  return (
    <div style={styles.item}>
      <p><strong>Student ID:</strong> {report.studentId}</p>
      <p><strong>Message:</strong> {report.message}</p>
      <p><strong>Status:</strong> {report.status}</p>
      <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleString()}</p>
      {report.status === 'pending' && (
        <button onClick={handleResolve} style={styles.button}>
          Mark as Resolved
        </button>
      )}
    </div>
  );
};

const styles = {
  item: { border: '1px solid #ccc', padding: '10px', margin: '10px 0' },
  button: { padding: '5px 10px', background: '#28a745', color: 'white', border: 'none' },
};

export default ReportItem;