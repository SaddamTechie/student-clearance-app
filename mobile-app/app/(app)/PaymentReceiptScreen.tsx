import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function PaymentReceiptScreen() {
  const route = useRoute();
  const { transactionId, studentName, date, paymentMethod, transactionType } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Receipt</Text>
      <Text style={styles.receiptText}>Transaction ID: {transactionId}</Text>
      <Text style={styles.receiptText}>Student Name: {studentName}</Text>
      <Text style={styles.receiptText}>Date: {date}</Text>
      <Text style={styles.receiptText}>Payment Method: {paymentMethod}</Text>
      <Text style={styles.receiptText}>Transaction Type: {transactionType}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  receiptText: { fontSize: 18, marginBottom: 10 },
});
