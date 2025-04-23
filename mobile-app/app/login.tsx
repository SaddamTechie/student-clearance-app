import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useSession();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/login`, { email, password });
      if (response.data.role !== 'student') {
        setError('This app is for students only');
        setLoading(false);
        return;
      }
      signIn(response.data.token);
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
        <Image
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
      </View>
      <Text style={styles.signInHeading}>Sign In</Text>
      <Text style={styles.signInSubheading}>Enter your email and password</Text>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Ionicons name="alert-circle" size={24} color="#FF9933" />
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
          />
          <Ionicons
            name={showPassword ? 'eye' : 'eye-off'}
            size={24}
            color="#666"
            onPress={() => setShowPassword(!showPassword)}
          />
        </View>
      </View>
      {/* <Text style={styles.forgotPassword}>Forgot Password?</Text> */}
      {loading ? (
        <ActivityIndicator size="large" color="#7ABB3B" style={styles.loading} />
      ) : (
        <Button
          title="Sign In"
          onPress={handleLogin}
          style={styles.signInButton}
          color="#7ABB3B"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  appBar: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 20 },
  logo: { width: 50, height: 50 },
  signInHeading: { fontSize: 30, marginBottom: 10, textAlign: 'center', color: '#7ABB3B',fontWeight: 'bold' },
  signInSubheading: { fontSize: 12, marginBottom: 20, color: '#666', textAlign: 'center' },
  inputContainer: { marginBottom: 10 },
  label: { fontSize: 16, marginBottom: 5, color: '#666' },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#fff' },
  passwordInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#fff' },
  passwordField: { flex: 1 },
  errorContainer: { marginBottom: 10, alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red', marginBottom: 5 },
  forgotPassword: { fontSize: 16, color: '#666', marginBottom: 10, textAlign: 'right' },
  loading: { padding: 10 },
  signInButton: { backgroundColor: '#7ABB3B', padding: 10, borderRadius: 5 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  registerText: { fontSize: 16, color: '#666' },
  signUpLink: { fontSize: 16, color: '#7ABB3B', marginLeft: 5 },
});
