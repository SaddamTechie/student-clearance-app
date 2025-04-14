// mobile/screens/HistoryScreen.tsx
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

export default function HistoryScreen() {
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
      Alert.alert('Error', err.response?.data?.message || 'Failed to fetch history');
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
        <Text style={styles.errorText}>Unable to load history</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={primaryColor} />
      }
    >
      <Text style={styles.title}>Clearance History</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Updates</Text>
        {status.clearanceHistory.length === 0 ? (
          <Text style={styles.noDataText}>No history available</Text>
        ) : (
          status.clearanceHistory.map((entry, index) => (
            <View key={index} style={styles.historyItem}>
              <Ionicons
                name={entry.status === 'cleared' ? 'checkmark-circle' : entry.department === 'System' ? 'information-circle' : 'close-circle'}
                size={20}
                color={entry.status === 'cleared' ? primaryColor : entry.department === 'System' ? textSecondary : secondaryColor}
                style={styles.icon}
              />
              <View>
                <Text style={styles.historyText}>
                  {entry.department}: {entry.status.toUpperCase()}
                </Text>
                <Text style={styles.historyDetail}>
                  {new Date(entry.timestamp).toLocaleString()}
                </Text>
                {entry.comment && <Text style={styles.commentText}>Note: {entry.comment}</Text>}
              </View>
            </View>
          ))
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Records</Text>
        {status.obligations.filter((ob) => ob.amountPaid > 0).length === 0 ? (
          <Text style={styles.noDataText}>No payments made</Text>
        ) : (
          status.obligations
            .filter((ob) => ob.amountPaid > 0)
            .map((ob) => (
              <View key={ob._id} style={styles.historyItem}>
                <Ionicons name="cash" size={20} color={primaryColor} style={styles.icon} />
                <View>
                  <Text style={styles.historyText}>{ob.type}</Text>
                  <Text style={styles.historyDetail}>
                    Paid: {ob.amountPaid} of {ob.amount} | {new Date(ob.dueDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.commentText}>{ob.description} ({ob.department})</Text>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: textColor, textAlign: 'center', marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: textColor, marginBottom: 10 },
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  historyText: { fontSize: 16, fontWeight: '600', color: textColor },
  historyDetail: { fontSize: 14, color: textSecondary, marginTop: 2 },
  commentText: { fontSize: 14, color: textSecondary, marginTop: 4 },
  noDataText: { fontSize: 16, color: textSecondary, textAlign: 'center', padding: 10 },
  icon: { marginRight: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: textSecondary, marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: textSecondary },
});