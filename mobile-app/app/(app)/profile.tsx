import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const { signOut, session } = useSession();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${apiUrl}/status`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setStudent({ email: response.data.email, studentId: response.data.studentId });
        setError(null);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            setError(error.response.data?.message || 'Failed to fetch profile data');
          } else {
            setError('Network error');
          }
        } else {
          setError('An unknown error occurred');
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    signOut();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Ionicons name="alert-circle" size={24} color="#FF9933" />
        <Button title="Retry" onPress={() => setError(null)} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync-circle" size={48} color="#7ABB3B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Profile</Text>
        <View style={styles.studentInfo}>
          <Text style={styles.studentId}>Student Reg.No: {student.studentId}</Text>
          <Text style={styles.studentEmail}>Email: {student.email || 'Not available'}</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Notification')}>
          <Ionicons name="notifications" size={24} color="#7ABB3B" />
          <Text style={styles.settingText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.clearanceSection}>
        <Text style={styles.sectionTitle}>Clearance Profile</Text>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('QR')}>
          <Ionicons name="qr-code" size={24} color="#7ABB3B" />
          <Text style={styles.settingText}>QR Code Verification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Certificate')}>
          <Ionicons name="document" size={24} color="#7ABB3B" />
          <Text style={styles.settingText}>Download Certificate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#FF9933" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  appBar: { padding: 20, backgroundColor: '#7ABB3B', marginBottom: 20 },
  appBarTitle: { fontSize: 24, color: '#fff' },
  studentInfo: { marginTop: 10 },
  studentId: { fontSize: 18, color: '#fff' },
  studentEmail: { fontSize: 16, color: '#fff', marginTop: 5 },
  settingsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  settingText: { fontSize: 16, marginLeft: 10 },
  clearanceSection: { marginBottom: 20 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FFC2C7', borderRadius: 10, elevation: 2 },
  logoutText: { fontSize: 16, marginLeft: 10, color: '#FF9933' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: { fontSize: 24, color: '#FF9933', marginBottom: 10 },
  errorText: { fontSize: 16, color: '#666', marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666', marginTop: 20 },
});
