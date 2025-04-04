import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';

export default function HomeScreen() {
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);
  const { session } = useSession();

  useEffect(() => {
    const fetchClearance = async () => {
      if (!session) {
        setError('No session available');
        return;
      }
      try {
        const response = await axios.get(`${apiUrl}/status`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setClearance(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching clearance:', error);
        setError(error.response?.data?.message || 'Failed to fetch clearance data');
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

  const handleRequestClearance = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/request-clearance`,
        {},
        { headers: { Authorization: `Bearer ${session}` } }
      );
      setClearance(response.data.clearance);
    } catch (error) {
      console.error('Error requesting clearance:', error);
      setError(error.response?.data?.message || 'Failed to request clearance');
    }
  };

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!clearance) return <Text>Loading...</Text>;

  const canRequestClearance = !clearance.clearanceRequested && 
    !Object.values(clearance.departments).some(dept => 
      dept.some(obl => !obl.resolved && obl.amount > 0)
    );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clearance Status</Text>
      {clearance.clearanceRequested ? (
        <Text style={styles.info}>Clearance requested. Awaiting department approvals.</Text>
      ) : (
        <Text style={styles.info}>Review your requirements below before requesting clearance.</Text>
      )}
      {Object.entries(clearance.departments || {}).map(([dept, obligations]) => (
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
          {clearance.clearanceRequested && (
            <Text>Department Status: {clearance.departmentStatus[dept]}</Text>
          )}
        </View>
      ))}
      <Text style={styles.overall}>Overall Status: {clearance.overallStatus}</Text>
      {!clearance.clearanceRequested && (
        <Button
          title="Request Clearance"
          onPress={handleRequestClearance}
          disabled={!canRequestClearance}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  info: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' },
  department: { marginBottom: 20 },
  deptTitle: { fontSize: 18, fontWeight: 'bold' },
  obligation: { borderWidth: 1, padding: 10, marginVertical: 5 },
  overall: { fontSize: 18, marginTop: 20, marginBottom: 20, textAlign: 'center' },
  error: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});