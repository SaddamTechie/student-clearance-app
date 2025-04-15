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
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '../../ctx';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';
const backgroundColor = '#f5f5f5';
const textColor = '#333';
const textSecondary = '#666';

export default function Home() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState({}); // { obligationId: { amount, phoneNumber } }
  const [paymentStatus, setPaymentStatus] = useState({}); // { obligationId: { type: 'success' | 'error', message: string } }
  const { session, signOut } = useSession();
  const router = useRouter();

  const handleError = (err, action = 'perform action', retryCallback = null) => {
    let message = `Unable to ${action}`;
    let buttons = [];

    if (err.response) {
      const { status: httpStatus, data } = err.response;
      if (httpStatus === 401) {
        message = 'Your session has expired. Please log in again.';
        buttons = [
          {
            text: 'OK',
            onPress: () => {
              signOut();
              router.replace('/login');
            },
          },
        ];
      } else if (httpStatus >= 400 && httpStatus < 500) {
        if (data.errors && Array.isArray(data.errors)) {
          message = data.errors.join('\n');
        } else if (data.message) {
          message = data.message;
        } else if (data.details) {
          message = data.details;
        } else {
          message = `${action.charAt(0).toUpperCase() + action.slice(1)} failed (Error ${httpStatus})`;
        }
        buttons = [{ text: 'OK' }];
      } else if (httpStatus >= 500) {
        message = `Server issue while trying to ${action}. Please try again later.`;
        buttons = retryCallback
          ? [
              { text: 'Retry', onPress: retryCallback },
              { text: 'Cancel' },
            ]
          : [{ text: 'OK' }];
      }
    } else if (err.request) {
      message = `No response from server. Please check your internet connection and try again.`;
      buttons = retryCallback
        ? [
            { text: 'Retry', onPress: retryCallback },
            { text: 'Cancel' },
          ]
        : [{ text: 'OK' }];
    } else {
      message = `Unexpected error: ${err.message}`;
      buttons = [{ text: 'OK' }];
    }

    Alert.alert('Error', message, buttons);
    return message;
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data);
    } catch (err) {
      handleError(err, 'load clearance status', fetchStatus);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data);
    } catch (err) {
      handleError(err, 'refresh clearance status', onRefresh);
    } finally {
      setRefreshing(false);
    }
  };

  const requestClearance = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/request-clearance`,
        {},
        { headers: { Authorization: `Bearer ${session}` } }
      );
      const successMessage = response.data.message || 'Clearance request submitted successfully';
      setPaymentStatus((prev) => ({
        ...prev,
        global: { type: 'success', message: successMessage },
      }));
      setTimeout(() => {
        setPaymentStatus((prev) => ({ ...prev, global: null }));
      }, 5000);
      Alert.alert('Success', successMessage, [{ text: 'OK', onPress: fetchStatus }]);
    } catch (err) {
      const errorMessage = handleError(err, 'request clearance', requestClearance);
      setPaymentStatus((prev) => ({
        ...prev,
        global: { type: 'error', message: errorMessage },
      }));
      setTimeout(() => {
        setPaymentStatus((prev) => ({ ...prev, global: null }));
      }, 5000);
    }
  };

  const payObligation = async (obligationId) => {
    const { amount, phoneNumber } = paymentData[obligationId] || {};
    const parsedAmount = parseFloat(amount || '0');
    const obligation = status.obligations.find((ob) => ob._id === obligationId);
    const balance = obligation ? obligation.amount - obligation.amountPaid : 0;

    if (!parsedAmount || parsedAmount <= 0) {
      const errorMessage = 'Please enter a valid payment amount greater than 0';
      setPaymentStatus((prev) => ({ ...prev, [obligationId]: { type: 'error', message: errorMessage } }));
      Alert.alert('Error', errorMessage);
      return;
    }
    if (parsedAmount > balance) {
      const errorMessage = `Payment cannot exceed remaining balance of ${balance}`;
      setPaymentStatus((prev) => ({ ...prev, [obligationId]: { type: 'error', message: errorMessage } }));
      Alert.alert('Error', errorMessage);
      return;
    }
    const cleanPhone = phoneNumber.replace(/^\+/, '');
    if (!cleanPhone || !/^254[17]\d{8}$/.test(cleanPhone)) {
      const errorMessage = 'Phone number must start with +2541 or +2547 followed by 8 digits (e.g., 254798765423)';
      setPaymentStatus((prev) => ({ ...prev, [obligationId]: { type: 'error', message: errorMessage } }));
      Alert.alert('Error', errorMessage);
      return;
    }

    try {
      const response = await axios.post(
        `${apiUrl}/pay-obligation`,
        { obligationId, amount: parsedAmount, phoneNumber: cleanPhone },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      const successMessage = response.data.message || `Paid ${parsedAmount} for ${obligation.type}`;
      setPaymentStatus((prev) => ({
        ...prev,
        [obligationId]: { type: 'success', message: successMessage },
      }));
      setTimeout(() => {
        setPaymentStatus((prev) => ({ ...prev, [obligationId]: null }));
      }, 5000);
      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            setPaymentData((prev) => ({ ...prev, [obligationId]: { amount: '', phoneNumber: '+254' } }));
            fetchStatus();
          },
        },
      ]);
    } catch (err) {
      const errorMessage = handleError(err, 'process payment', () => payObligation(obligationId));
      setPaymentStatus((prev) => ({
        ...prev,
        [obligationId]: { type: 'error', message: errorMessage },
      }));
      setTimeout(() => {
        setPaymentStatus((prev) => ({ ...prev, [obligationId]: null }));
      }, 5000);
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
        <Text style={styles.errorText}>Unable to load clearance data</Text>
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
      ?.obligations.every((ob) => ob.status === 'cleared') && !status.clearanceRequestStatus;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={primaryColor}
        />
      }
    >
      <Text style={styles.title}>Clearance Dashboard</Text>
      {paymentStatus.global && (
        <View
          style={[
            styles.statusMessageContainer,
            {
              backgroundColor:
                paymentStatus.global.type === 'success' ? '#E6F3D9' : '#FEE2E2',
            },
          ]}
        >
          <Text
            style={[
              styles.statusMessage,
              {
                color: paymentStatus.global.type === 'success' ? primaryColor : '#DC2626',
              },
            ]}
          >
            {paymentStatus.global.message}
          </Text>
        </View>
      )}
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
                  Amount: {ob.amount} | Paid: {ob.amountPaid} | Balance:{' '}
                  {ob.amount - ob.amountPaid} | Due: {new Date(ob.dueDate).toLocaleDateString()}
                </Text>
                {paymentStatus[ob._id] && (
                  <View
                    style={[
                      styles.statusMessageContainer,
                      {
                        backgroundColor:
                          paymentStatus[ob._id].type === 'success' ? '#E6F3D9' : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusMessage,
                        {
                          color:
                            paymentStatus[ob._id].type === 'success'
                              ? primaryColor
                              : '#DC2626',
                        },
                      ]}
                    >
                      {paymentStatus[ob._id].message}
                    </Text>
                  </View>
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
                      placeholder="+254"
                      keyboardType="phone-pad"
                      value={
                        paymentData[ob._id]?.phoneNumber
                          ? paymentData[ob._id].phoneNumber
                          : '+254'
                      }
                      onChangeText={(text) => {
                        if (!text.startsWith('+254')) {
                          text = '+254';
                        }
                        setPaymentData((prev) => ({
                          ...prev,
                          [ob._id]: { ...prev[ob._id], phoneNumber: text },
                        }));
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.payButton, { backgroundColor: secondaryColor }]}
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
  container: {
    flex: 1,
    backgroundColor,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: textColor,
    textAlign: 'center',
    marginVertical: 24,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: textColor,
  },
  cardStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: textSecondary,
    marginTop: 8,
  },
  cardComment: {
    fontSize: 14,
    color: textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  obligation: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  obligationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: textColor,
  },
  obligationDetail: {
    fontSize: 14,
    color: textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  paymentContainer: {
    marginTop: 12,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: textColor,
    backgroundColor: '#fafafa',
  },
  payButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noObligations: {
    fontSize: 14,
    color: textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: primaryColor,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: textSecondary,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: primaryColor,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusMessageContainer: {
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});