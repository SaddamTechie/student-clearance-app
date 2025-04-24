import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { verifyStudent } from '../api';
import { 
  ArrowLeftIcon, 
  QrCodeIcon, 
  CameraIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraId, setCameraId] = useState('');
  const [cameras, setCameras] = useState([]);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'upload'
  
  // Using a string ID for scanner element instead of ref
  const qrScannerId = "qr-reader";
  const scannerInstanceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Create a div separate from React's control for the scanner
  useEffect(() => {
    // Create a container div if it doesn't exist
    let container = document.getElementById(qrScannerId);
    if (!container) {
      container = document.createElement('div');
      container.id = qrScannerId;
      document.body.appendChild(container);
    }

    // Initialize available cameras
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id); // Default to first camera
        } else {
          setError('No camera found. Please connect a camera or try uploading an image.');
          setActiveTab('upload'); // Default to upload if no cameras
        }
      })
      .catch(err => {
        console.error('Error getting cameras', err);
        setError('Unable to access cameras. Please check permissions or try uploading an image.');
        setActiveTab('upload'); // Default to upload if camera error
      });
      
    // Clean up scanner and container on component unmount
    return () => {
      stopScanner();
      
      // Only remove if we created it
      const containerToRemove = document.getElementById(qrScannerId);
      if (containerToRemove) {
        try {
          // Remove the container safely
          containerToRemove.remove();
        } catch (err) {
          console.error('Error removing scanner container:', err);
        }
      }
    };
  }, []);
  
  const startScanner = async () => {
    setError('');
    
    if (!cameraId) {
      setError('Please select a camera.');
      return;
    }
    
    try {
      // First ensure any previous scanner instance is properly cleared
      await stopScanner();
      
      // Get a reference to the existing container
      const container = document.getElementById(qrScannerId);
      
      // Create a new scanner instance
      scannerInstanceRef.current = new Html5Qrcode(qrScannerId);
      
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
      setScanning(false);
    }
  };
  
  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        // Only call stop if actually scanning
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        // Always clear the instance to ensure clean DOM
        await scannerInstanceRef.current.clear();
        scannerInstanceRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      } finally {
        setScanning(false);
      }
    }
  };
  
  const onScanSuccess = async (decodedText) => {
    // Stop scanning once we have a result
    await stopScanner();
    processQRData(decodedText);
  };
  
  const processQRData = async (decodedText) => {
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
    // Ensure we stop and clear any existing scanner
    await stopScanner();
    
    // Reset state
    setResult(null);
    setError('');
    
    // If camera tab, initiate scanning
    if (activeTab === 'camera') {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startScanner();
      }, 300);
    }
  };
  
  const switchCamera = async (newCameraId) => {
    if (scanning) {
      await stopScanner();
    }
    setCameraId(newCameraId);
  };
  
  const handleTabChange = async (tab) => {
    if (scanning) {
      await stopScanner();
    }
    setActiveTab(tab);
    setError('');
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    setError('');
    setLoading(true);
    
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      setLoading(false);
      return;
    }
    
    try {
      // Ensure we have a clean scanner instance
      stopScanner().then(() => {
        // Create a new instance for file scanning
        scannerInstanceRef.current = new Html5Qrcode(qrScannerId);
        
        // Scan the image file
        scannerInstanceRef.current.scanFile(file, true)
          .then(decodedText => {
            processQRData(decodedText);
          })
          .catch(err => {
            console.error('QR scan error:', err);
            setError('Could not find a valid QR code in the image. Please try another image.');
            toast.error('No QR code found in image');
            setLoading(false);
          });
      });
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing image. Please try again.');
      setLoading(false);
    }
    
    // Reset file input
    e.target.value = null;
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Helper function to check overall clearance status
  const getOverallClearanceStatus = (clearanceStatusArray) => {
    if (!clearanceStatusArray || !Array.isArray(clearanceStatusArray)) return 'unknown';
    
    // Check if all departments are cleared
    const allCleared = clearanceStatusArray.every(status => status.status === 'cleared');
    return allCleared ? 'cleared' : 'pending';
  };

  // Get the status color class
  const getStatusColorClass = (status) => {
    switch (status) {
      case 'cleared': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
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
      
      {/* Tabs */}
      {!result && (
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('camera')}
              className={`py-2 px-4 flex items-center space-x-2 ${
                activeTab === 'camera'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={loading || cameras.length === 0}
            >
              <CameraIcon className="h-5 w-5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => handleTabChange('upload')}
              className={`py-2 px-4 flex items-center space-x-2 ${
                activeTab === 'upload'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              disabled={loading}
            >
              <PhotoIcon className="h-5 w-5" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Camera selector - only show when camera tab is active */}
      {activeTab === 'camera' && cameras.length > 1 && !result && (
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
          {/* Camera Tab Content */}
          {activeTab === 'camera' && (
            <>
              {/* Instructions */}
              {!scanning && !loading && (
                <div className="text-center mb-6">
                  <CameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    Click the button below to start the camera and scan a student QR code
                  </p>
                </div>
              )}
              
              {/* Scanner - Just provide a container that React doesn't control */}
              <div className={`w-full ${scanning ? 'h-80' : 'h-24'} mx-auto overflow-hidden relative`}>
                {/* This is a placeholder that matches the position where the actual scanner is displayed */}
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
                
                {/* Move the actual scanner element here from body when needed */}
                {activeTab === 'camera' && (
                  <div id="scanner-container" className="w-full h-full">
                    {/* The Html5QrCode library will inject elements into the qrScannerId div */}
                  </div>
                )}
              </div>
              
              {/* Camera Controls */}
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
            </>
          )}

          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <div className="text-center py-6">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
              
              <PhotoIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  Select an image containing a QR code
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: JPEG, PNG, GIF, WEBP
                </p>
              </div>
              
              <button
                onClick={triggerFileInput}
                disabled={loading}
                className="bg-primary hover:bg-secondary text-white font-medium py-2 px-6 rounded-lg shadow transition-colors flex items-center space-x-2 mx-auto disabled:bg-gray-300"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>Choose Image</span>
              </button>
            </div>
          )}
          
          {/* Loading indicator - for both tabs */}
          {loading && (
            <div className="text-center mt-6">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2 text-gray-600">
                {activeTab === 'camera' ? 'Processing QR code...' : 'Analyzing image...'}
              </p>
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
            
            {/* Department Clearance Status */}
            {result.clearanceStatus && result.clearanceStatus.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold text-gray-700 mb-2">Clearance Status:</p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  {result.clearanceStatus.map((status, index) => (
                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-0">
                      <span className="capitalize">{status.department}</span>
                      <span className={getStatusColorClass(status.status)}>
                        {status.status === 'cleared' ? '✓ Cleared' : '⚠ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Obligations */}
            <div className="mt-3">
              <p className="font-semibold text-gray-700">Obligations:</p>
              {!result.obligations || result.obligations.length === 0 ? (
                <p className="text-green-600 mt-1">No issues</p>
              ) : (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-1">
                  {result.obligations.map((obl, index) => (
                    <div key={index} className="mb-2 pb-2 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{obl.type}</span>
                        <span className={obl.status === 'cleared' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                          {obl.status === 'cleared' ? 'Resolved' : `${obl.amount ? 'Ksh ' + obl.amount : 'Pending'}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{obl.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Department: <span className="capitalize">{obl.department}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Overall Status */}
            <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
              <p className="font-semibold text-gray-700">
                Overall Status:{' '}
                <span className={getStatusColorClass(getOverallClearanceStatus(result.clearanceStatus))}>
                  {getOverallClearanceStatus(result.clearanceStatus) === 'cleared' 
                    ? '✓ All departments cleared' 
                    : '⚠ Some clearances pending'}
                </span>
              </p>
            </div>
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
      {activeTab === 'camera' && scanning && !loading && !result && (
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
      
      {/* Image upload tips */}
      {activeTab === 'upload' && !loading && !result && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6 rounded">
          <h3 className="font-medium text-blue-700 mb-1">Tips for uploading QR code images:</h3>
          <ul className="list-disc pl-5 text-sm text-blue-700">
            <li>Make sure the QR code is clearly visible in the image</li>
            <li>The image should be well-lit and not blurry</li>
            <li>The entire QR code should be in the frame</li>
            <li>Screenshots of QR codes also work well</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QRScanner;