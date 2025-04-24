import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { verifyStudent } from '../api';
import { 
  ArrowLeftIcon, 
  QrCodeIcon, 
  CameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState([]);
  
  const qrScannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  
  // Initialize available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id); // Default to first camera
        } else {
          setError('No camera found. Please connect a camera and refresh.');
        }
      })
      .catch(err => {
        console.error('Error getting cameras', err);
        setError('Unable to access cameras. Please check permissions.');
      });
      
    return () => {
      stopScanner();
    };
  }, []);
  
  const startScanner = async () => {
    setError('');
    
    if (!cameraId) {
      setError('Please select a camera.');
      return;
    }
    
    try {
      if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode(qrScannerRef.current.id);
      }
      
      // Start scanning with selected camera
      await scannerInstanceRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
      
      setScanning(true);
      toast.success('Camera started. Position QR code in the frame.');
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError(`Failed to start scanner: ${err.message || 'Unknown error'}`);
      toast.error('Failed to start camera');
    }
  };
  
  const stopScanner = async () => {
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
      try {
        await scannerInstanceRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };
  
  const onScanSuccess = async (decodedText) => {
    // Immediately stop scanning once we have a result
    await stopScanner();
    setLoading(true);
    
    try {
      toast.info('QR code detected! Verifying...');
      
      // Try parsing the QR data
      let studentId;
      try {
        const parsedData = JSON.parse(decodedText);
        studentId = parsedData.id;
      } catch (parseErr) {
        // If it's not JSON, maybe it's just the ID directly
        studentId = decodedText.trim();
      }
      
      if (!studentId) {
        throw new Error('Could not find student ID in QR code');
      }
      
      // Verify the student
      const verification = await verifyStudent(studentId);
      setResult(verification);
      toast.success('Student verified successfully');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to verify QR code');
      toast.error('Verification failed');
      
      // Allow scanning again if verification failed
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };
  
  const onScanFailure = (error) => {
    // Do nothing for common scan failures 
    // ("No QR code found" errors are expected and shouldn't be shown to user)
    if (error === 'No QR code found' || 
        error.includes('NotFoundException') || 
        error.includes('able to detect')) {
      return;
    }
    
    console.warn('Scan error:', error);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleNewScan = async () => {
    setResult(null);
    setError('');
    await startScanner();
  };
  
  const switchCamera = async (newCameraId) => {
    if (scanning) {
      await stopScanner();
    }
    setCameraId(newCameraId);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">Scan Student QR Code</h1>
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back</span>
        </button>
      </div>
      
      {/* Camera selector */}
      {cameras.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Camera
          </label>
          <select
            value={cameraId}
            onChange={(e) => switchCamera(e.target.value)}
            disabled={scanning || loading}
            className="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Camera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Scanner View */}
      {!result && (
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          {/* Instructions */}
          {!scanning && !loading && (
            <div className="text-center mb-6">
              <CameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                Click the button below to start the camera and scan a student QR code
              </p>
            </div>
          )}
          
          {/* Scanner */}
          <div 
            ref={qrScannerRef} 
            id="qr-reader" 
            className={`w-full ${scanning ? 'h-80' : 'h-0'} mx-auto overflow-hidden relative`}
          >
            {scanning && (
              <div className="absolute inset-0 border-4 border-dashed border-blue-400 opacity-70 pointer-events-none z-10 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-blue-500 rounded-lg"></div>
                </div>
                <div className="bg-black bg-opacity-70 text-white p-3 rounded text-sm absolute bottom-4">
                  Position QR code inside the blue box
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex justify-center mt-6">
            {!scanning ? (
              <button
                onClick={startScanner}
                disabled={loading || !cameraId}
                className="bg-primary hover:bg-secondary text-white font-medium py-2 px-6 rounded-lg shadow transition-colors flex items-center space-x-2 disabled:bg-gray-300"
              >
                <CameraIcon className="h-5 w-5" />
                <span>Start Camera</span>
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg shadow transition-colors flex items-center space-x-2"
              >
                <XMarkIcon className="h-5 w-5" />
                <span>Stop Camera</span>
              </button>
            )}
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="text-center mt-6">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2 text-gray-600">Processing QR code...</p>
            </div>
          )}
        </div>
      )}
      
      {/* Result */}
      {result && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold text-primary mb-4 flex items-center">
            <QrCodeIcon className="h-6 w-6 mr-2" />
            Verification Result
          </h2>
          
          <div className="space-y-3 mb-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700 font-medium">Student verified successfully</p>
            </div>
            
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
            
            <div className="mt-3">
              <p className="font-semibold text-gray-700">Obligations:</p>
              {result.obligations.length === 0 ? (
                <p className="text-green-600 mt-1">No issues</p>
              ) : (
                <ul className="list-disc pl-5 mt-1">
                  {result.obligations.map((obl, index) => (
                    <li key={index} className={obl.resolved ? 'text-green-600' : 'text-red-600'}>
                      {obl.description} - {obl.resolved ? 'Resolved' : 'Pending'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
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
          
          <button
            onClick={handleNewScan}
            className="bg-primary hover:bg-secondary text-white font-medium py-2 px-4 rounded shadow transition-colors"
          >
            Scan Another QR Code
          </button>
        </div>
      )}
      
      {/* Helpful tips */}
      {scanning && !loading && !result && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6 rounded">
          <h3 className="font-medium text-blue-700 mb-1">Tips for scanning:</h3>
          <ul className="list-disc pl-5 text-sm text-blue-700">
            <li>Ensure good lighting on the QR code</li>
            <li>Hold your device steady</li>
            <li>Make sure the entire QR code is visible in the frame</li>
            <li>Keep a reasonable distance - not too close or far</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScanner;