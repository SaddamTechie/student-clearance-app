import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';
const backgroundColor = '#f5f5f5';
const textColor = '#333';
const textSecondary = '#666';

export default function HomeScreen() {
  const [clearance, setClearance] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const { session, signOut } = useSession();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // navigation.reset({
        //   index: 0,
        //   routes: [{ name: 'Home' }],
        // });
      };
    }, [navigation])
  );

  const fetchClearance = async () => {
    if (!session) {
      setError('No session available');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${session}`
        },
      });
      setClearance(response.data);
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            setError('Session expired. Please log in again.');
            signOut();
          } else {
            setError(error.response.data?.message || 'Failed to fetch clearance data');
          }
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
    fetchClearance();
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClearance();
    setRefreshing(false);
  };

  const handlePay = async (department, obligations) => {
    const unresolvedObligations = obligations.filter(obl => !obl.resolved && obl.amount > 0);

    if (unresolvedObligations.length === 0) {
      Alert.alert('No Pending Obligations', 'All obligations in this department are resolved.');
      return;
    }

    navigation.navigate('PaymentMethod', {
      department,
      obligations
    });
  };

  const handleRequestClearance = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/request-clearance`, 
        {}, 
        {
          headers: {
            Authorization: `Bearer ${session}`
          }
        }
      );
      setClearance(response.data.clearance);
      Alert.alert('Clearance Requested', 'Your clearance request has been submitted.');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setError(error.response.data?.message || 'Failed to request clearance');
        } else {
          setError('Network error');
        }
      } else {
        setError('An unknown error occurred');
      }
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
            fetchClearance();
          }} 
          color={primaryColor} 
        />
      </View>
    );
  }

  if (!clearance) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="sync-circle" size={48} color={primaryColor} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!clearance.departments) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Invalid clearance data.</Text>
        <Ionicons name="alert-circle" size={24} color={secondaryColor} />
      </View>
    );
  }

  const canRequestClearance = !clearance.clearanceRequested &&
    !Object.values(clearance.departments).some(dept =>
      dept.some(obl => !obl.resolved && obl.amount > 0)
    );

  const departmentStatuses = Object.keys(clearance.departments).map(dept => {
    const isResolved = clearance.departments[dept].every(obl => obl.resolved || obl.amount === 0);
    return {
      department: dept,
      isResolved
    };
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={primaryColor}
        />
      }
    >
      <Text style={styles.title}>Clearance Status</Text>
      {selectedDepartment ? (
        <View>
          <Text style={styles.deptTitle}>{selectedDepartment.toUpperCase()}</Text>
          <Text style={styles.totalText}>
            Total: {clearance.departments[selectedDepartment].reduce((acc, curr) => acc + curr.amount, 0)}
          </Text>
          {clearance.departments[selectedDepartment].length === 0 ? (
            <Text style={styles.info}>No issues</Text>
          ) : (
            clearance.departments[selectedDepartment].map((obl, index) => (
              <View key={index} style={styles.obligation}>
                <Text style={styles.obligationText}>{obl.description}</Text>
                <Text style={styles.obligationAmount}>Amount: {obl.amount}</Text>
                <Text style={styles.obligationStatus}>
                  Status: {obl.resolved ? 'Resolved' : 'Pending'}
                </Text>
              </View>
            ))
          )}
          <Button 
            title="Payment Method" 
            onPress={() => handlePay(selectedDepartment, clearance.departments[selectedDepartment])} 
            color={primaryColor} 
          />
          <Button 
            title="Back" 
            onPress={() => setSelectedDepartment(null)} 
            color={primaryColor} 
          />
        </View>
      ) : (
        <>
          {departmentStatuses.map(({ department, isResolved }) => (
            <TouchableOpacity
              key={department}
              style={[
                styles.departmentCard,
                isResolved ? styles.resolved : styles.notResolved
              ]}
              onPress={() => setSelectedDepartment(department)}
            >
              <Text style={styles.deptText}>{department.toUpperCase()}</Text>
              <Text style={styles.statusText}>
                {isResolved ? 'Resolved' : 'Not Resolved'}
              </Text>
              <Ionicons 
                name={isResolved ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={isResolved ? primaryColor : secondaryColor}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.overall}>
            Overall Status: {clearance.overallStatus}
          </Text>
          {!clearance.clearanceRequested && (
            <Button
              title="Request Clearance"
              onPress={handleRequestClearance}
              disabled={!canRequestClearance}
              color={primaryColor}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: backgroundColor
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: primaryColor
  },
  info: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: textSecondary
  },
  departmentCard: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
  },
  resolved: {
    backgroundColor: '#c6efce'
  },
  notResolved: {
    backgroundColor: '#ffc2c7'
  },
  deptText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: textColor
  },
  statusText: {
    fontSize: 16,
    color: textSecondary,
    marginTop: 2
  },
  obligation: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderColor: '#ccc'
  },
  obligationText: {
    fontSize: 14,
    color: textColor
  },
  obligationAmount: {
    fontSize: 14,
    color: textSecondary
  },
  obligationStatus: {
    fontSize: 14,
    color: textSecondary
  },
  overall: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: textColor
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorTitle: {
    fontSize: 24,
    color: secondaryColor,
    marginBottom: 10
  },
  errorText: {
    fontSize: 16,
    color: textSecondary,
    marginBottom: 20
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
  },
  deptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: textColor
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: textColor
  },
});