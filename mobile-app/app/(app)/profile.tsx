import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CertificateScreen from './certificate';
import QRScreen from './qr';
import ReportScreen from './report';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';
const backgroundColor = '#f5f5f5';
const textColor = '#333';
const textSecondary = '#666';

export default function ProfileScreen() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const { signOut, session } = useSession();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setStudent({
        email: response.data.email,
        studentId: response.data.studentId,
      });
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch profile data';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const savePushToken = async (token) => {
    console.log('Saving push token:', token);
    try {
      const response = await axios.post(
        `${apiUrl}/save-push-token`,
        { token },
        { headers: { Authorization: `Bearer ${session}` } }
      );
      console.log('Backend response:', response.data);
      return true;
    } catch (err) {
      console.error('Failed to save push token:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to save push token: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const updateNotificationStatus = async (enabled) => {
    if (!Device.isDevice) {
      Alert.alert('Error', 'Push notifications require a physical device');
      setNotificationsEnabled(false);
      return;
    }

    setIsToggling(true);
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Current permission status:', existingStatus);

      if (enabled) {
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
          console.log('Requested permission, new status:', finalStatus);
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
          setNotificationsEnabled(false);
          return;
        }
        const token = (await Notifications.getDevicePushTokenAsync()).data; // Use getDevicePushTokenAsync for EAS
        console.log('Device push token:', token);
        const success = await savePushToken(token);
        if (success) {
          setNotificationsEnabled(true);
          Alert.alert('Success', 'Notifications enabled');
        } else {
          setNotificationsEnabled(false);
        }
      } else {
        const success = await savePushToken(null);
        if (success) {
          setNotificationsEnabled(false);
          Alert.alert('Success', 'Notifications disabled');
        } else {
          setNotificationsEnabled(true);
        }
      }
    } catch (err) {
      console.error('Error in updateNotificationStatus:', err);
      Alert.alert('Error', 'An unexpected error occurred: ' + err.message);
      setNotificationsEnabled(!enabled);
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const checkNotificationStatus = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        console.log('Initial permission status:', status);
        setNotificationsEnabled(status === 'granted');
      } catch (err) {
        console.error('Error checking permissions:', err);
      }
    };
    checkNotificationStatus();
  }, [session]);

  const handleToggleNotifications = (value) => {
    if (isToggling) return;
    console.log('Toggle clicked, new value:', value);
    updateNotificationStatus(value);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          signOut();
          Alert.alert('Success', 'Logged out successfully');
        },
      },
    ]);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Enable Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#767577', true: primaryColor }}
                  thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                  disabled={isToggling}
                />
              </View>
            </View>
            <View style={styles.clearanceSection}>
              <Text style={styles.sectionTitle}>Clearance Profile</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out" size={24} color={secondaryColor} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'qr':
        return <QRScreen />;
      case 'certificate':
        return <CertificateScreen />;
      case 'report':
        return <ReportScreen />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={secondaryColor} />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.studentInfo}>
          <Text style={styles.studentId}>Reg.No: {student.studentId}</Text>
          <Text style={styles.studentEmail}>{student.email || 'Not available'}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {[
          { id: 'profile', title: 'Profile', icon: 'person' },
          { id: 'qr', title: 'QR Code', icon: 'qr-code' },
          { id: 'certificate', title: 'Certificate', icon: 'document' },
          { id: 'report', title: 'Report', icon: 'stats-chart' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.activeTabButton]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={activeTab === tab.id ? primaryColor : textSecondary}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.activeTabButtonText,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.contentContainer}>{renderTabContent()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: primaryColor,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  studentInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
  },
  studentId: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  studentEmail: { fontSize: 14, color: '#fff', marginTop: 5 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: -20,
    borderRadius: 15,
    elevation: 5,
  },
  tabButton: { alignItems: 'center', padding: 10, flex: 1 },
  activeTabButton: { borderBottomWidth: 2, borderBottomColor: primaryColor },
  tabButtonText: { fontSize: 12, color: textSecondary, marginTop: 5 },
  activeTabButtonText: { color: primaryColor, fontWeight: 'bold' },
  contentContainer: { flex: 1, padding: 20 },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
  },
  settingsSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: textColor,
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: { fontSize: 16, color: textColor },
  clearanceSection: { marginTop: 20 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: secondaryColor,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
    color: secondaryColor,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    color: secondaryColor,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: textSecondary,
    marginTop: 20,
  },
});