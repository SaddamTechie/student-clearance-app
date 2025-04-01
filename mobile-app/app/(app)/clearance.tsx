import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';

export default function ClearanceScreen() {
  const [clearance, setClearance] = useState(null);
  const { session } = useSession();

  useEffect(() => {
    const fetchClearance = async () => {
      try {
        const response = await axios.get(`${apiUrl}/status`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setClearance(response.data);
      } catch (error) {
        console.error('Error fetching clearance:', error);
      }
    };
    fetchClearance();
  }, [session]);

  const handlePay = async (department, index) => {
    try {
      const response = await axios.post(
        `${apiUrl}/pay`,
        { department, obligationIndex: index },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      setClearance(response.data.clearance);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  if (!clearance) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clearance Status</Text>
      {Array.from(clearance.departments).map(([dept, obligations]) => (
        <View key={dept} style={styles.department}>
          <Text style={styles.deptTitle}>{dept.toUpperCase()}</Text>
          {obligations.length === 0 ? (
            <Text>No issues</Text>
          ) : (
            obligations.map((obl, index) => (
              <View key={index} style={styles.obligation}>
                <Text>{obl.description}</Text>
                <Text>Amount: {obl.amount}</Text>
                <Text>Status: {obl.resolved ? 'Resolved' : 'Pending'}</Text>
                {!obl.resolved && obl.amount > 0 && (
                  <Button title="Pay Now" onPress={() => handlePay(dept, index)} />
                )}
              </View>
            ))
          )}
        </View>
      ))}
      <Text style={styles.overall}>Overall Status: {clearance.overallStatus}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  department: { marginBottom: 20 },
  deptTitle: { fontSize: 18, fontWeight: 'bold' },
  obligation: { borderWidth: 1, padding: 10, marginVertical: 5 },
  overall: { fontSize: 18, marginTop: 20, textAlign: 'center' },
});