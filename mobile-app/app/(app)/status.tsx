import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';

export default function StatusScreen() {
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);
  const { session } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch clearance data
  const fetchClearance = async () => {
    if (!session) {
      setError('No session available');
      return;
    }
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      console.log('Clearance data received:', JSON.stringify(response.data, null, 2));
      setClearance(response.data);
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            setError('Session expired. Please log in again.');
          } else {
            setError(error.response.data?.message || 'Failed to fetch clearance data');
          }
        } else {
          setError('Network error');
        }
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    fetchClearance(); // Initial fetch

    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchClearance, 10000);

    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClearance();
    setRefreshing(false);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Ionicons name="alert-circle" size={24} color="#FF9933" />
        <Button title="Retry" onPress={() => setError(null)} />
      </View>
    );
  }

  if (!clearance) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync-circle" size={48} color="#7ABB3B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!clearance.departmentStatus) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Invalid clearance data.</Text>
        <Ionicons name="alert-circle" size={24} color="#FF9933" />
      </View>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cleared':
        return { name: 'checkmark-circle', color: '#28a745' };
      case 'rejected':
        return { name: 'close-circle', color: '#dc3545' };
      case 'reviewing':
        return { name: 'time-outline', color: '#ffc107' };
      case 'pending':
      default:
        return { name: 'ellipse-outline', color: '#6c757d' };
    }
  };

  const departmentStatuses = Object.entries(clearance.departmentStatus);
  const total = departmentStatuses.length;
  const clearedCount = departmentStatuses.filter(([_, status]) => status === 'cleared').length;
  const progressPercentage = total > 0 ? (clearedCount / total) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>Clearance Status</Text>
      {!clearance.clearanceRequested ? (
        <Text style={styles.info}>Request clearance from the Home tab to start tracking.</Text>
      ) : (
        <>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {clearedCount} of {total} Departments Cleared ({Math.round(progressPercentage)}%)
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
          {departmentStatuses.map(([dept, status]) => {
            const { name, color } = getStatusIcon(status);
            return (
              <View key={dept} style={styles.statusItem}>
                <Ionicons name={name} size={24} color={color} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.deptText}>{dept.toUpperCase()}</Text>
                  <Text style={[styles.statusText, { color }]}>{status.toUpperCase()}</Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.overall}>
            Overall Status: {clearance.overallStatus.toUpperCase()}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  info: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 16, textAlign: 'center', marginBottom: 10, color: '#333' },
  progressBar: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  deptText: { fontSize: 18, fontWeight: 'bold' },
  statusText: { fontSize: 16, fontWeight: '500', marginTop: 2 },
  overall: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 24, color: '#FF9933', marginBottom: 10 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666', marginTop: 20 },
});
