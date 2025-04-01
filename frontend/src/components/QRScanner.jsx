import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { verifyStudent } from '../api';

const Html5QrcodePlugin = ({ onScanSuccess, onScanError }) => {
  const qrcodeRegionId = "html5qr-code-full-region";
  const scannerRef = useRef(null); // Reference to hold the scanner instance

  useEffect(() => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const cameraConfig = {
      facingMode: isMobile ? { exact: "environment" } : "user",
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
        scannerRef.current.clear(); // Stop scanning after success
      },
      onScanError
    );

    return () => {
      scannerRef.current?.clear().catch((error) => {
        console.error("Failed to clear scanner:", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return <div id={qrcodeRegionId} />;
};

const QRScanner = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

  const handleScanSuccess = async (decodedData, decodedResult) => {
    console.log("Scan successful! Stopping scanner...");
    console.log("Decoded data:", decodedData);
    if (decodedData) {
            try {
              console.log("Working")
              const parsedData = JSON.parse(decodedData); // Assumes QR contains JSON like {"id": "student123"}
              const { studentId } = parsedData;
              console.log("id",studentId)
              const verification = await verifyStudent(studentId);
              setResult(verification);
              setError(null);
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to verify QR code');
              setResult(null);
            }
          }
  };

  const handleScanError = (error) => {
    console.error("Scan error:", error);
  };

  return (
    <div>
      <h1>QR Code Scanner (Stops after success)</h1>
      <Html5QrcodePlugin
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
      {result && (
        <div>
          <p><strong>Student ID:</strong> {result.studentId}</p>
          <p><strong>Email:</strong> {result.email}</p>
          <p><strong>Department:</strong> {result.department}</p>
          <p><strong>Status:</strong> {result.status}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;

















// import React, { useState } from 'react';
// import QRScanner from 'qr-scanner';
// import { verifyStudent } from '../api';

// const QRScanner = () => {
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   const handleScan = async (data) => {
//     if (data) {
//       try {
//         const parsedData = JSON.parse(data.text); // Assumes QR contains JSON like {"id": "student123"}
//         const { id } = parsedData;
//         const verification = await verifyStudent(id);
//         setResult(verification);
//         setError(null);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Failed to verify QR code');
//         setResult(null);
//       }
//     }
//   };

//   const handleError = (err) => {
//     console.error('QR scan error:', err);
//     setError('Error scanning QR code');
//   };

//   QrScanner.scanImage(image)
//     .then(result => console.log(result))
//     .catch(error => console.log(error || 'No QR code found.'));

//   return (
//     <div style={styles.container}>
//       <h2>Scan Student QR Code</h2>
//       <QrReader
//         onResult={handleScan}
//         onError={handleError}
//         style={{ width: '100%', maxWidth: '400px' }}
//       />
//       {error && <p style={styles.error}>{error}</p>}
//       {result && (
//         <div style={styles.result}>
//           <p><strong>Student ID:</strong> {result.studentId}</p>
//           <p><strong>Email:</strong> {result.email}</p>
//           <p><strong>Department:</strong> {result.department}</p>
//           <p><strong>Status:</strong> {result.status}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// const styles = {
//   container: { maxWidth: '400px', margin: '20px auto', textAlign: 'center' },
//   error: { color: 'red', marginTop: '10px' },
//   result: { marginTop: '20px', border: '1px solid #ccc', padding: '10px' },
// };

// export default QRScanner;


