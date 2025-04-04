import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { session } = useSession();
  const navigation = useNavigation();

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

  const handlePay = async (department, obligations) => {
    navigation.navigate('PaymentMethod', { department, obligations });
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

  const departmentStatuses = Object.keys(clearance.departments).map(dept => {
    const isResolved = clearance.departments[dept].every(obl => obl.resolved || obl.amount === 0);
    return { department: dept, isResolved };
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Clearance Status</Text>
      {selectedDepartment ? (
        <View>
          <Text style={styles.deptTitle}>{selectedDepartment.toUpperCase()}</Text>
          <Text style={styles.totalText}>
            Total: {clearance.departments[selectedDepartment].reduce((acc, curr) => acc + curr.amount, 0)}
          </Text>
          {clearance.departments[selectedDepartment].length === 0 ? (
            <Text>No issues</Text>
          ) : (
            clearance.departments[selectedDepartment].map((obl, index) => (
              <View key={index} style={styles.obligation}>
                <Text>{obl.description}</Text>
                <Text>Amount: {obl.amount}</Text>
                <Text>Status: {obl.resolved ? 'Resolved' : 'Pending'}</Text>
              </View>
            ))
          )}
          <Button title="Payment Method" onPress={() => handlePay(selectedDepartment, clearance.departments[selectedDepartment])} />
          <Button title="Back" onPress={() => setSelectedDepartment(null)} />
        </View>
      ) : (
        <>
          {departmentStatuses.map(({ department, isResolved }) => (
            <TouchableOpacity
              key={department}
              style={[styles.departmentCard, isResolved ? styles.resolved : styles.notResolved]}
              onPress={() => setSelectedDepartment(department)}
            >
              <Text style={styles.deptText}>{department.toUpperCase()}</Text>
              <Text style={styles.statusText}>{isResolved ? 'Resolved' : 'Not Resolved'}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.overall}>Overall Status: {clearance.overallStatus}</Text>
          {!clearance.clearanceRequested && (
            <Button
              title="Request Clearance"
              onPress={handleRequestClearance}
              disabled={!canRequestClearance}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  info: { fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#666' },
  departmentCard: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  resolved: { backgroundColor: '#c6efce' },
  notResolved: { backgroundColor: '#ffc2c7' },
  deptText: { fontSize: 18, fontWeight: 'bold' },
  statusText: { fontSize: 16, color: '#666', marginTop: 2 },
  obligation: { borderWidth: 1, padding: 10, marginVertical: 5 },
  overall: { fontSize: 18, marginTop: 20, marginBottom: 20, textAlign: 'center' },
  error: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
  deptTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  totalText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
});
