// mobile/screens/StatusScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '../../ctx';
import { Ionicons } from '@expo/vector-icons';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';
const backgroundColor = '#f5f5f5';
const textColor = '#333';
const textSecondary = '#666';

export default function StatusScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { session } = useSession();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load status</Text>
      </View>
    );
  }

  const departments = ['academics', 'finance', 'library', 'hostel'].map((dept) => ({
    name: dept,
    status: status.clearanceStatus.find((s) => s.department === dept)?.status || 'pending',
    active: status.clearanceRequestDepartment === dept,
  }));

  const clearedCount = departments.filter((d) => d.status === 'cleared').length;
  const total = departments.length;
  const progressPercentage = total > 0 ? (clearedCount / total) * 100 : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primaryColor} />
      }
    >
      <Text style={styles.title}>Clearance Progress</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {clearedCount} of {total} Departments Cleared ({Math.round(progressPercentage)}%)
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>
      {status.clearanceRequestStatus ? (
        <Text style={styles.currentDept}>
          Current Review: {status.clearanceRequestDepartment || 'Complete'}
        </Text>
      ) : (
        <Text style={styles.info}>Pay Academic obligations to request clearance.</Text>
      )}
      {departments.map((dept) => (
        <View key={dept.name} style={[styles.statusCard, dept.active && styles.activeCard]}>
          <Ionicons
            name={
              dept.status === 'cleared'
                ? 'checkmark-circle'
                : dept.status === 'rejected'
                ? 'close-circle'
                : 'time-outline'
            }
            size={28}
            color={
              dept.status === 'cleared'
                ? primaryColor
                : dept.status === 'rejected'
                ? secondaryColor
                : textSecondary
            }
            style={styles.icon}
          />
          <View>
            <Text style={styles.deptText}>{dept.name}</Text>
            <Text style={styles.statusText}>{dept.status.toUpperCase()}</Text>
            {dept.active && <Text style={styles.activeText}>Under Review</Text>}
          </View>
        </View>
      ))}
      <Text style={styles.overall}>
        Overall Status: {clearedCount === total ? 'Cleared' : 'In Progress'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: textColor, textAlign: 'center', marginVertical: 20 },
  progressContainer: { marginBottom: 20, alignItems: 'center' },
  progressText: { fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 10 },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: primaryColor },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCard: { borderWidth: 2, borderColor: primaryColor },
  icon: { marginRight: 15 },
  deptText: { fontSize: 18, fontWeight: 'bold', color: textColor },
  statusText: { fontSize: 16, fontWeight: '500', color: textSecondary, marginTop: 2 },
  activeText: { fontSize: 14, color: primaryColor, marginTop: 4 },
  overall: { fontSize: 20, fontWeight: 'bold', color: textColor, textAlign: 'center', marginVertical: 20 },
  currentDept: { fontSize: 16, color: textColor, textAlign: 'center', marginBottom: 10 },
  info: { fontSize: 16, color: textSecondary, textAlign: 'center', marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: textSecondary, marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: textSecondary },
});