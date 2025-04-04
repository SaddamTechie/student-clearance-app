import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentReceiptScreen() {
  const route = useRoute();
  const { transactionId, studentName, date, paymentMethod, transactionType } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Receipt</Text>
      <Ionicons name="receipt" size={24} color="#7ABB3B" />
      <Text style={styles.receiptText}>Transaction ID: {transactionId}</Text>
      <Text style={styles.receiptText}>Student Name: {studentName}</Text>
      <Text style={styles.receiptText}>Date: {date}</Text>
      <Text style={styles.receiptText}>Payment Method: {paymentMethod}</Text>
      <Text style={styles.receiptText}>Transaction Type: {transactionType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#7ABB3B' },
  receiptText: { fontSize: 18, marginBottom: 10 },
});
