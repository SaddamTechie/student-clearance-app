import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { verifyStudent } from '../api';
import { ArrowLeftIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const Html5QrcodePlugin = ({ onScanSuccess, onScanError }) => {
  const qrcodeRegionId = 'html5qr-code-full-region';
  const scannerRef = useRef(null);

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const cameraConfig = {
      facingMode: isMobile ? { exact: 'environment' } : 'user',
    };

    scannerRef.current = new Html5QrcodeScanner(
      qrcodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current.render(
      (decodedText, decodedResult) => {
        onScanSuccess(decodedText, decodedResult);
        scannerRef.current.pause(); // Pause instead of clear to allow resume
      },
      onScanError
    );

    return () => {
      scannerRef.current?.clear().catch((error) => {
        console.error('Failed to clear scanner:', error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return <div id={qrcodeRegionId} className="w-full max-w-md mx-auto" />;
};

const QRScanner = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScanSuccess = async (decodedData) => {
    setLoading(true);
    setError('');
    try {
      const parsedData = JSON.parse(decodedData); // Expecting {"id": "student123"}
      const { id: studentId } = parsedData;
      const verification = await verifyStudent(studentId);
      setResult(verification);
      toast.success('Student verified successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify QR code');
      toast.error(err.response?.data?.message || 'Invalid QR code');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
    // Only set error if it's a significant issue, not every frame failure
    if (error !== 'No QR code found in image') {
      setError('Scanner error: ' + error);
      toast.error('Scanner error occurred');
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Scan Student QR Code</h1>
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          <span>Back</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {/* Scanner */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex justify-center">
        <div className="relative">
          <Html5QrcodePlugin
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
          {loading && (
            <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center">
              <div className="h-12 w-12 border-4 border-t-primary border-gray-200 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center space-x-2">
            <QrCodeIcon className="h-6 w-6" />
            <span>Verification Result</span>
          </h2>
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-gray-700">Student ID:</span>{' '}
                {result.studentId}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Email:</span>{' '}
                {result.email}
              </p>
              {result.name && (
                <p>
                  <span className="font-semibold text-gray-700">Name:</span>{' '}
                  {result.name}
                </p>
              )}
              {result.department && (
                <p>
                  <span className="font-semibold text-gray-700">Department:</span>{' '}
                  {result.department}
                </p>
              )}
              <p className="font-semibold text-gray-700">Obligations:</p>
              {result.obligations.length === 0 ? (
                <p className="text-green-600">No issues</p>
              ) : (
                <ul className="list-disc pl-5">
                  {result.obligations.map((obl, index) => (
                    <li key={index} className={obl.resolved ? 'text-green-600' : 'text-red-600'}>
                      {obl.description} - {obl.resolved ? 'Resolved' : 'Pending'}
                    </li>
                  ))}
                </ul>
              )}
              <p>
                <span className="font-semibold text-gray-700">Clearance Status:</span>{' '}
                <span
                  className={
                    result.overallStatus === 'cleared' ? 'text-green-600' : 'text-yellow-600'
                  }
                >
                  {result.overallStatus || 'Pending'}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;