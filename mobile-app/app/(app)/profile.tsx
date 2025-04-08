import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CertificateScreen from './certificate';
import QRScreen from './qr';
import ReportScreen from './report';

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
  const { signOut, session } = useSession();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${session}`
        },
      });
      setStudent({
        email: response.data.email,
        studentId: response.data.studentId
      });
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const handleLogout = async () => {
    signOut();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.settingItem}>
                <Text style={styles.settingText}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#767577', true: primaryColor }}
                  thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
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
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>QR Code</Text>
            <Text style={styles.tabContentText}>Your QR code will be displayed here</Text>
            <QRScreen />
            {/* Placeholder for QR code component */}
            {/* Add QR code component here when implemented */}
          </View>
        );
      case 'certificate':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Certificate</Text>
            <Text style={styles.tabContentText}>Download your certificate here</Text>
            <CertificateScreen />
            {/* Add certificate download button here when implemented */}
          </View>
        );
      case 'report':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>Report</Text>
            <ReportScreen />
          </View>
        );
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
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Ionicons name="alert-circle" size={24} color={secondaryColor} />
        <Button
          title="Retry"
          onPress={() => {
            setError(null);
            fetchProfile();
          }}
          color={primaryColor}
        />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync-circle" size={48} color={primaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
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
          { id: 'report', title: 'Report', icon: 'stats-chart' }
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
                activeTab === tab.id && styles.activeTabButtonText
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.contentContainer}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: backgroundColor
  },
  header: {
    padding: 20,
    backgroundColor: primaryColor,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10
  },
  studentInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10
  },
  studentId: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold'
  },
  studentEmail: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: -20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  tabButton: {
    alignItems: 'center',
    padding: 10,
    flex: 1
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: primaryColor
  },
  tabButtonText: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 5
  },
  activeTabButtonText: {
    color: primaryColor,
    fontWeight: 'bold'
  },
  contentContainer: {
    flex: 1,
    padding: 20
  },
  tabContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 2
  },
  tabContentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: textColor,
    marginBottom: 15
  },
  tabContentText: {
    fontSize: 16,
    color: textSecondary,
    lineHeight: 24
  },
  settingsSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: textColor,
    marginBottom: 15
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  settingText: {
    fontSize: 16,
    color: textColor
  },
  clearanceSection: {
    marginTop: 20
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: secondaryColor,
    marginTop: 10
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 10,
    color: secondaryColor,
    fontWeight: 'bold'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorTitle: {
    fontSize: 24,
    color: secondaryColor,
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    color: textSecondary,
    marginBottom: 20,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 18,
    color: textSecondary,
    marginTop: 20
  }
});