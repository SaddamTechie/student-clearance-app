import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';

export default function ProfileScreen() {
  const [student, setStudent] = useState(null);
  const {signOut,session} = useSession();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/status`, { // Updated endpoint
          headers: { Authorization: `Bearer ${session}` },
        });
        setStudent({ email: response.data.email,studentId:response.data.studentId });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {student ? (
        <>
          <Text>Student Reg.No: {student.studentId}</Text>
          <Text>Email: {student.email || 'Not available'}</Text>
        </>
      ) : (
        <Text>Loading...</Text>
      )}
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});