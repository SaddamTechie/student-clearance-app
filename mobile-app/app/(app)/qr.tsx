import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
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
    let isMounted = true; // To prevent memory leaks

    const fetchQR = async () => {
      if (!session) {
        if (isMounted) {
          setError('No active session found');
          setLoading(false);
        }
        return;
      }
      
      try {
        const response = await axios.get(`${apiUrl}/qr`, {
          headers: { Authorization: `Bearer ${session}` },
          timeout: 10000
        });
        
        if (isMounted) {
          if (response.data?.qrCode) {
            setQrCode(response.data.qrCode);
          } else {
            setError('Invalid QR code data');
          }
        }
      } catch (error) {
        if (isMounted) {
          setError(error.response?.data?.message || 
                  error.message || 
                  'Failed to load QR code');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchQR();

    return () => { isMounted = false }; // Cleanup
  }, [session]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading QR Code...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      <View style={styles.qrContainer}>
        {qrCode ? (
          <QRCode
            value={qrCode}
            size={250}
            color="black"
            backgroundColor="white"
            quietZone={10}
          />
        ) : (
          <Text style={styles.noDataText}>No QR code available</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
});