import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiUrl } from '../../config';
import axios from 'axios';
import { useSession } from '@/ctx';

export default function PaymentMethodScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session } = useSession();
  const { department, obligations } = route.params;

  const unresolvedObligations = obligations.filter(obl => !obl.resolved && obl.amount > 0);

  if (unresolvedObligations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>All Obligations Resolved</Text>
        <Text style={styles.info}>You have resolved all obligations in the {department} department.</Text>
        <Ionicons name="checkmark-circle" size={24} color="#7ABB3B" />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const [paymentMethod, setPaymentMethod] = useState('Mpesa');

  const handlePay = async () => {
    const obligationIndices = obligations.map((obl, index) => index).filter(index => !obligations[index].resolved && obligations[index].amount > 0);

    try {
      const response = await axios.post(
        `${apiUrl}/pay`,
        {
          department,
          obligationIndices,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      navigation.navigate('PaymentReceipt', {
        transactionId: response.data.transactionId,
        studentName: response.data.studentName,
        date: response.data.date,
        paymentMethod,
        transactionType: 'Clearance Payment',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      <Text style={styles.methodText}>Mpesa</Text>
      <Ionicons name="card" size={24} color="#FF9933" />
      <Button title="Submit" onPress={handlePay} style={styles.submitButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#7ABB3B' },
  methodText: { fontSize: 18, marginBottom: 20 },
  info: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' },
  submitButton: { backgroundColor: '#7ABB3B', padding: 10, borderRadius: 5 },
});
