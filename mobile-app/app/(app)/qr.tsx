import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';

export default function QRScreen() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useSession();

  useEffect(() => {
    const fetchQR = async () => {
      if (!session) {
        setError('No active session found');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${apiUrl}/qr`, {
          headers: { Authorization: `Bearer ${session}` },
          timeout: 10000 // Add timeout to prevent indefinite hanging
        });
        
        // Check if response data is as expected
        if (response.data && response.data.qrCode) {
          setQrCode(response.data.qrCode);
        } else {
          console.warn('Unexpected response format:', response.data);
          setError('Invalid QR code data received');
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
        
        // Handle specific error cases
        if (error.response) {
          // The server responded with a status code outside 2xx range
          setError(`Server error: ${error.response.status}`);
        } else if (error.request) {
          // The request was made but no response was received
          setError('Network error. Please check your connection.');
        } else {
          // Something happened in setting up the request
          setError(`Error: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchQR();
  }, [session]);

  // Safety check to prevent rendering malformed QR code
  const renderQRCode = () => {
    try {
      return <QRCode value={qrCode || 'fallback'} size={200} />;
    } catch (err) {
      console.error('Error rendering QR code:', err);
      return <Text style={styles.errorText}>Unable to render QR code</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading QR code...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : qrCode ? (
        <View style={styles.qrContainer}>
          {renderQRCode()}
        </View>
      ) : (
        <Text style={styles.noDataText}>No QR code available</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333'
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '80%'
  },
  errorText: {
    color: '#cc0000',
    textAlign: 'center',
    fontSize: 16
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});