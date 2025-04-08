import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { apiUrl } from '../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useSession();
  const router = useRouter();

  const savePushToken = async (token) => {
    try {
      await axios.post(
        `${apiUrl}/save-push-token`,
        { token },
        { headers: { Authorization: `Bearer ${token}` } } // Use the new token
      );
      console.log('Push token saved successfully');
    } catch (err) {
      console.error('Failed to save push token:', err);
      Alert.alert('Warning', 'Could not save push notification token. You may not receive notifications.');
    }
  };

  const registerForPushNotifications = async (token) => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus === 'granted') {
        const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
        await savePushToken(token); // Save the token after login
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${apiUrl}/login`, { email, password });
      if (response.data.role !== 'student') {
        setError('This app is for students only');
        setLoading(false);
        return;
      }
      const token = response.data.token;
      signIn(token);
      await registerForPushNotifications(token); // Register and save push token
      router.replace('/');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Login failed');
      } else {
        setError('An unknown error occurred');
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      </View>
      <Text style={styles.signInHeading}>Sign In</Text>
      <Text style={styles.signInSubheading}>Enter your email and password</Text>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={secondaryColor} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordField}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={24}
              color={loading ? '#ccc' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.forgotPasswordContainer}
        onPress={() => Alert.alert('Forgot Password', 'This feature is not yet implemented.')}
      >
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.signInButton, loading && styles.signInButtonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.signInButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <View style={styles.registerLink}>
        <Text style={styles.registerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
  },
  signInHeading: {
    fontSize: 30,
    marginBottom: 10,
    textAlign: 'center',
    color: primaryColor,
    fontWeight: 'bold',
  },
  signInSubheading: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordField: {
    flex: 1,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    fontSize: 14,
    color: primaryColor,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: primaryColor,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signInButtonDisabled: {
    backgroundColor: '#b0d68d',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    fontSize: 16,
    color: primaryColor,
    marginLeft: 5,
    fontWeight: 'bold',
  },
});