import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { useRouter } from 'expo-router';

const primaryColor = '#7ABB3B';
const textColor = '#333';
const textSecondary = '#666';
const backgroundColor = '#f5f5f5';

export default function CertificateScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session, signOut } = useSession();
  const router = useRouter();

  const fetchStatus = async () => {
    if (!session) {
      Alert.alert('Error', 'Please log in to view your certificate', [
        {
          text: 'OK',
          onPress: () => {
            signOut();
            router.replace('/login');
          },
        },
      ]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data);
    } catch (err) {
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchError = (err) => {
    let message = 'Failed to load clearance status';
    if (err.response) {
      const { status: httpStatus, data } = err.response;
      if (httpStatus === 401) {
        message = 'Session expired. Please log in again.';
        Alert.alert('Error', message, [
          {
            text: 'OK',
            onPress: () => {
              signOut();
              router.replace('/login');
            },
          },
        ]);
        return;
      } else if (data.message) {
        message = data.message;
      }
    } else if (err.request) {
      message = 'Network error. Please check your connection.';
    }
    setError(message);
  };

  const downloadCertificate = async () => {
    try {
      // 1. Get the PDF as blob
      const response = await axios.get(`${apiUrl}/certificate`, {
        headers: { Authorization: `Bearer ${session}` },
        responseType: 'blob'
      });
  
      // 2. Create object URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // 3. Open in browser
      await Linking.openURL(url);
      
    } catch (error) {
      Alert.alert('Error', 'Download failed');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [session]);

  const isCleared = status?.clearanceStatus?.every((cs) => cs.status === 'cleared');
  const pendingDepartments = status?.clearanceStatus
    ?.filter((cs) => cs.status !== 'cleared')
    ?.map((cs) => cs.department)
    ?.join(', ');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clearance Certificate</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Checking clearance status...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStatus}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : isCleared ? (
        <View style={styles.contentContainer}>
          <Text style={styles.message}>
            Congratulations! You are fully cleared to download your certificate.
          </Text>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadCertificate}>
            <Text style={styles.downloadButtonText}>Download Certificate</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.message}>
            You are not yet cleared to download your certificate.
          </Text>
          {pendingDepartments && (
            <Text style={styles.details}>
              Pending departments: {pendingDepartments}
            </Text>
          )}
          <TouchableOpacity 
            style={[styles.downloadButton, { backgroundColor: '#ccc' }]} 
            onPress={fetchStatus}
          >
            <Text style={styles.downloadButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: textColor,
    marginBottom: 24,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  message: {
    fontSize: 18,
    color: textColor,
    textAlign: 'center',
    marginBottom: 16,
  },
  details: {
    fontSize: 16,
    color: textSecondary,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: primaryColor,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    width: '80%',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});