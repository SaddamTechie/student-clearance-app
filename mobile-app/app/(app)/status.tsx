import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';

export default function StatusScreen() {
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);
  const { session } = useSession();

  useEffect(() => {
    const fetchClearance = async () => {
      if (!session) {
        setError('No session available');
        return;
      }
      try {
        const response = await axios.get(`${apiUrl}/status`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setClearance(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching clearance:', error);
        setError(error.response?.data?.message || 'Failed to fetch clearance data');
      }
    };
    fetchClearance();
  }, [session]);

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!clearance) return <Text>Loading...</Text>;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cleared':
        return { name: 'checkmark-circle', color: '#28a745' }; // Green
      case 'rejected':
        return { name: 'close-circle', color: '#dc3545' }; // Red
      case 'reviewing':
        return { name: 'time-outline', color: '#ffc107' }; // Yellow
      case 'pending':
      default:
        return { name: 'ellipse-outline', color: '#6c757d' }; // Gray
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clearance Status</Text>
      {!clearance.clearanceRequested ? (
        <Text style={styles.info}>Request clearance from the Home tab to start tracking.</Text>
      ) : (
        <>
          {Array.from(clearance.departmentStatus).map(([dept, status]) => {
            const { name, color } = getStatusIcon(status);
            const comment = clearance.comments?.get(dept);
            return (
              <View key={dept} style={styles.statusItem}>
                <Ionicons name={name} size={24} color={color} style={styles.icon} />
                <View style={styles.textContainer}>
                  <Text style={styles.deptText}>{dept.toUpperCase()}</Text>
                  <Text style={[styles.statusText, { color }]}>{status.toUpperCase()}</Text>
                  {comment && <Text style={styles.commentText}>Note: {comment}</Text>}
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
  commentText: { fontSize: 14, color: '#666', marginTop: 5 },
  overall: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20 },
  error: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});