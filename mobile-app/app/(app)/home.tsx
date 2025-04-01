import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { apiUrl } from '../../config'
import { useSession } from '@/ctx';

export default function HomeScreen() {
  const [status, setStatus] = useState({});
  const [requestsSent, setRequestsSent] = useState({});
  const {session,signOut} = useSession();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${apiUrl}/status`, { // Updated endpoint
          headers: { Authorization: `Bearer ${session}` },
        });
        setStatus(response.data.status);
        setRequestsSent(response.data.requestsSent);
      } catch (error) {
        console.error('Error fetching status:', error);
        if (error.response?.status === 401) {
          signOut();
          router.replace('/');
        }
      }
    };
    fetchStatus();
  }, []);

  const requestClearance = async (department: string) => {
    try {
      await axios.post(
        `${apiUrl}/request`,
        { department }, // Removed studentId
        { headers: { Authorization: `Bearer ${session}` } }
      );
      alert(`${department} clearance requested`);
      const response = await axios.get(`${apiUrl}/status`, { // Updated endpoint
        headers: { Authorization: `Bearer ${session}` },
      });
      setStatus(response.data.status);
      setRequestsSent(response.data.requestsSent);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Request failed');
    }
  };

  const departments = ['finance', 'library', 'department', 'hostel', 'administration'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clearance Status</Text>
      <FlatList
        data={departments}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>
              {item.charAt(0).toUpperCase() + item.slice(1)}:{' '}
              {status[item] === 'pending' && requestsSent[item]
                ? 'Request Sent - Pending'
                : status[item] === 'pending' && !requestsSent[item]
                ? 'Not Requested'
                : status[item] === 'approved'
                ? 'Approved'
                : status[item] === 'rejected'
                ? 'Rejected'
                : 'Not Requested'}
            </Text>
            {status[item] === undefined ||
            status[item] === null ||
            status[item] === 'rejected' ||
            (status[item] === 'pending' && !requestsSent[item]) ? (
              <Button title="Request" onPress={() => requestClearance(item)} />
            ) : status[item] === 'pending' && requestsSent[item] ? (
              <Text>Request Sent</Text>
            ) : (
              status[item] === 'approved' && <Text> ✅</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  item: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
});