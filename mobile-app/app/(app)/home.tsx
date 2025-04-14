// mobile/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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

export default function HomeScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState({});
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

  const requestClearance = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/request-clearance`,
        {},
        { headers: { Authorization: `Bearer ${session}` } }
      );
      Alert.alert('Success', response.data.message);
      fetchStatus();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to request clearance');
    }
  };

  const payObligation = async (obligationId) => {
    const amount = parseFloat(paymentAmount[obligationId] || '0');
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount');
      return;
    }
    try {
      const response = await axios.post(
        `${apiUrl}/pay-obligation`,
        { obligationId, amount },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      Alert.alert('Success', response.data.message);
      setPaymentAmount({ ...paymentAmount, [obligationId]: '' });
      fetchStatus();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed');
    }
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
        <Text style={styles.errorText}>Unable to load data</Text>
      </View>
    );
  }

  // Order departments: Academics first
  const departments = ['academics', 'finance', 'library', 'hostel'].map((dept) => ({
    name: dept,
    status: status.clearanceStatus.find((s) => s.department === dept)?.status || 'pending',
    comment: status.clearanceStatus.find((s) => s.department === dept)?.comment || '',
    obligations: status.obligations.filter((ob) => ob.department === dept),
  }));

  const canRequestClearance =
    departments.find((d) => d.name === 'academics').obligations.every((ob) => ob.status === 'cleared') &&
    !status.clearanceRequestStatus;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clearance Dashboard</Text>
      {departments.map((dept) => (
        <View key={dept.name} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{dept.name}</Text>
            <Ionicons
              name={
                dept.status === 'cleared'
                  ? 'checkmark-circle'
                  : dept.status === 'rejected'
                  ? 'close-circle'
                  : 'time-outline'
              }
              size={24}
              color={
                dept.status === 'cleared'
                  ? primaryColor
                  : dept.status === 'rejected'
                  ? secondaryColor
                  : textSecondary
              }
            />
          </View>
          <Text style={styles.cardStatus}>Status: {dept.status.toUpperCase()}</Text>
          {dept.comment && <Text style={styles.cardComment}>Note: {dept.comment}</Text>}
          {dept.obligations.length > 0 ? (
            dept.obligations.map((ob) => (
              <View key={ob._id} style={styles.obligation}>
                <Text style={styles.obligationTitle}>{ob.type}</Text>
                <Text style={styles.obligationDetail}>{ob.description}</Text>
                <Text style={styles.obligationDetail}>
                  Amount: {ob.amount} | Paid: {ob.amountPaid} | Due: {new Date(ob.dueDate).toLocaleDateString()}
                </Text>
                {ob.status !== 'cleared' && (
                  <View style={styles.paymentContainer}>
                    
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={paymentAmount[ob._id] || ''}
                      onChangeText={(text) => setPaymentAmount({ ...paymentAmount, [ob._id]: text })}
                    />
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => payObligation(ob._id)}
                    >
                      <Text style={styles.payButtonText}>Pay</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noObligations}>No pending obligations</Text>
          )}
        </View>
      ))}
      <TouchableOpacity
        style={[styles.actionButton, !canRequestClearance && styles.disabledButton]}
        onPress={requestClearance}
        disabled={!canRequestClearance}
      >
        <Text style={styles.actionButtonText}>Request Clearance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: textColor, textAlign: 'center', marginVertical: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: textColor },
  cardStatus: { fontSize: 16, color: textSecondary, marginTop: 5 },
  cardComment: { fontSize: 14, color: textSecondary, marginTop: 5, fontStyle: 'italic' },
  obligation: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  obligationTitle: { fontSize: 16, fontWeight: '600', color: textColor },
  obligationDetail: { fontSize: 14, color: textSecondary, marginTop: 4 },
  paymentContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  paymentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  payButton: { backgroundColor: secondaryColor, padding: 10, borderRadius: 8 },
  payButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  noObligations: { fontSize: 14, color: textSecondary, marginTop: 10, textAlign: 'center' },
  actionButton: {
    backgroundColor: primaryColor,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  disabledButton: { backgroundColor: '#ccc', opacity: 0.6 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: textSecondary, marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: textSecondary },
});