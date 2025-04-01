import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../App';
import { useNavigate } from 'react-router-dom';

function Requests({ department, onLogout }) {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${apiUrl}/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    };
    fetchRequests();
  }, []);

  const handleAction = async (requestId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${apiUrl}/approve/${requestId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.map(r => r._id === requestId ? { ...r, status } : r));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <h2>{department} Requests</h2>
      <button onClick={() => navigate('/profile')}>Profile</button>
      <button onClick={onLogout}>Logout</button>
      <ul>
        {requests.map(request => (
          <li key={request._id}>
            {request.studentId} - {request.status}
            {request.status === 'pending' && (
              <>
                <button onClick={() => handleAction(request._id, 'approved')}>Approve</button>
                <button onClick={() => handleAction(request._id, 'rejected')}>Reject</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Requests;