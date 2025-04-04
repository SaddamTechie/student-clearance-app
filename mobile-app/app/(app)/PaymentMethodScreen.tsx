import React, { useState } from 'react';
import axios from 'axios';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';

export default function PaymentMethodScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { department, obligations } = route.params;
  const [paymentMethod, setPaymentMethod] = useState('Mpesa');
  const {session} = useSession();

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
      <Button title="Submit" onPress={handlePay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  methodText: { fontSize: 18, marginBottom: 20 },
});
