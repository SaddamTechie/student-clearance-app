import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:5000'

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/clearance/staff/requests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setRequests(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch requests');
      }
    };
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (studentId, status, comment = '') => {
    try {
      const response = await axios.post(
        `${API_URL}/api/clearance/staff/update-clearance`,
        { studentId, status, comment },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setRequests(requests.map(req => 
        req.studentId === studentId ? { ...req, status, comment } : req
      ));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (error) return <p>{error}</p>;
  if (!requests.length) return <p>No pending requests</p>;

  return (
    <div>
      <h1>Staff Dashboard</h1>
      {requests.map(req => (
        <div key={req.studentId} style={styles.request}>
          <p><strong>Student ID:</strong> {req.studentId}</p>
          <p><strong>Status:</strong> {req.status}</p>
          <p><strong>Obligations:</strong> {req.obligations.join(', ')}</p>
          <p><strong>Comment:</strong> {req.comment || 'None'}</p>
          <button onClick={() => handleUpdateStatus(req.studentId, 'Cleared')}>
            Approve
          </button>
          <button onClick={() => handleUpdateStatus(req.studentId, 'Rejected', 'Missing docs')}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

const styles = {
  request: { border: '1px solid #ccc', padding: '10px', margin: '10px 0' },
};

export default StaffDashboard;