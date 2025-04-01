import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReports } from '../api';
import ReportItem from './ReportItem';

const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <h2>Your Department Reports</h2>
      <button onClick={handleLogout} style={styles.logoutButton}>
        Logout
      </button>
      <Link to="/scan" style={styles.scanLink}>
        Scan QR Code
      </Link>
      {loading ? (
        <p>Loading...</p>
      ) : reports.length === 0 ? (
        <p>No reports found for your department.</p>
      ) : (
        reports.map((report) => (
          <ReportItem key={report._id} report={report} onUpdate={fetchReports} />
        ))
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '800px', margin: '20px auto', padding: '20px' },
  logoutButton: { padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', float: 'right' },
};

export default ReportList;