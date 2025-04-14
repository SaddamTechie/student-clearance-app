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
import { useNavigation } from '@react-navigation/native';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';
const backgroundColor = '#f5f5f5';
const textColor = '#333';
const textSecondary = '#666';

export default function HomeScreen() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState({}); // { obligationId: { amount, phoneNumber } }
  const [paymentStatus, setPaymentStatus] = useState({}); // { obligationId: 'success' | null }
  const { session, signOut } = useSession();
  const navigation = useNavigation();

  const handleError = (err, action = 'perform action', retryCallback = null) => {
    let message = `Failed to ${action}`;
    let buttons = [];

    if (err.response) {
      const { status: httpStatus, data } = err.response;
      if (httpStatus === 401) {
        message = 'Session expired. Please log in again.';
        buttons = [
          {
            text: 'OK',
            onPress: () => {
              signOut();
              navigation.replace('Login');
            },
          },
        ];
      } else if (httpStatus >= 400 && httpStatus < 500) {
        message = data.message || `Invalid request: ${action}`;
        buttons = [{ text: 'OK' }];
      } else if (httpStatus >= 500) {
        message = `Server error: ${action}. Try again later.`;
        buttons = retryCallback
          ? [
              { text: 'Retry', onPress: retryCallback },
              { text: 'Cancel' },
            ]
          : [{ text: 'OK' }];
      }
    } else if (err.request) {
      message = 'Network error. Please check your connection.';
      buttons = retryCallback
        ? [
            { text: 'Retry', onPress: retryCallback },
            { text: 'Cancel' },
          ]
        : [{ text: 'OK' }];
    } else {
      message = `Error: ${err.message}`;
      buttons = [{ text: 'OK' }];
    }

    Alert.alert('Error', message, buttons);
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data);
    } catch (err) {
      handleError(err, 'fetch status', fetchStatus);
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
      Alert.alert('Success', response.data.message, [{ text: 'OK', onPress: fetchStatus }]);
    } catch (err) {
      handleError(err, 'request clearance', requestClearance);
    }
  };

  const payObligation = async (obligationId) => {
    const { amount, phoneNumber } = paymentData[obligationId] || {};
    const parsedAmount = parseFloat(amount || '0');
    const obligation = status.obligations.find((ob) => ob._id === obligationId);
    const balance = obligation ? obligation.amount - obligation.amountPaid : 0;

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount');
      return;
    }
    if (parsedAmount > balance) {
      Alert.alert('Error', `Payment cannot exceed remaining balance of ${balance}`);
      return;
    }
    if (!phoneNumber || !/^\+?\d{10,15}$/.test(phoneNumber)) {
      Alert.alert('Error', 'Enter a valid phone number (10-15 digits)');
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/pay-obligation`,
        { obligationId, amount: parsedAmount, phoneNumber },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      setPaymentStatus((prev) => ({ ...prev, [obligationId]: 'success' }));
      setTimeout(() => {
        setPaymentStatus((prev) => ({ ...prev, [obligationId]: null }));
      }, 3000); // Clear success message after 3 seconds
      Alert.alert('Success', response.data.message, [
        {
          text: 'OK',
          onPress: () => {
            setPaymentData((prev) => ({ ...prev, [obligationId]: { amount: '', phoneNumber: '' } }));
            fetchStatus();
          },
        },
      ]);
    } catch (err) {
      handleError(err, 'make payment', () => payObligation(obligationId));
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatus}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use lowercase department names
  const departments = ['academics', 'finance', 'library', 'hostel'].map((dept) => ({
    name: dept,
    status: status.clearanceStatus.find((s) => s.department === dept)?.status || 'pending',
    comment: status.clearanceStatus.find((s) => s.department === dept)?.comment || '',
    obligations: status.obligations.filter((ob) => ob.department === dept),
  }));

  const canRequestClearance =
    departments
      .find((d) => d.name === 'academics')
      .obligations.every((ob) => ob.status === 'cleared') && !status.clearanceRequestStatus;

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
                  Amount: {ob.amount} | Paid: {ob.amountPaid} | Balance: {ob.amount - ob.amountPaid} | Due:{' '}
                  {new Date(ob.dueDate).toLocaleDateString()}
                </Text>
                {paymentStatus[ob._id] === 'success' && (
                  <Text style={styles.successMessage}>Payment Successful!</Text>
                )}
                {ob.status !== 'cleared' && (
                  <View style={styles.paymentContainer}>
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="Enter amount"
                      keyboardType="numeric"
                      value={paymentData[ob._id]?.amount || ''}
                      onChangeText={(text) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          [ob._id]: { ...prev[ob._id], amount: text },
                        }))
                      }
                    />
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                      value={paymentData[ob._id]?.phoneNumber || ''}
                      onChangeText={(text) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          [ob._id]: { ...prev[ob._id], phoneNumber: text },
                        }))
                      }
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
  paymentContainer: { marginTop: 10 },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: textColor,
  },
  payButton: {
    backgroundColor: secondaryColor,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
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
  errorText: { fontSize: 16, color: textSecondary, marginBottom: 20 },
  retryButton: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  successMessage: {
    fontSize: 14,
    color: primaryColor,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});