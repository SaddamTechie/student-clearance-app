import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator,Image } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../config';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateRegistrationNumber = (regNo) => {
    const pattern = /^[A-Z]{2}\d{3}\/\d{6}\/\d{2}$/;
    return pattern.test(regNo);
  };

  const validateName = (name) => {
    const pattern = /^[a-zA-Z ]+$/;
    return pattern.test(name);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleRegister = async () => {
    if (!validateRegistrationNumber(studentId)) {
      setError('Invalid registration number. It should be in the format "CT201/111809/20".');
      return;
    }
    if (!validateName(name)) {
      setError('Name should only contain alphabets.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password should be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/register`, { studentId, name, email, password });
      const loginResponse = await axios.post(`${apiUrl}/login`, { email, password });
      alert(response.data.message);
      router.replace('/home');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response.status === 400) {
          setError(error.response.data.message || 'Registration failed');
        } else if (error.response.status === 409) {
          setError('Email already exists.');
        } else {
          setError(error.response.data.message || 'Registration failed');
        }
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
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subheading}>Fill up all the details needed</Text>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Ionicons name="alert-circle" size={24} color="#FF9933" />
        </View>
      )}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Student Registration Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your student ID (e.g., CT201/111809/20)"
          value={studentId}
          onChangeText={setStudentId}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a strong password (at least 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#7ABB3B" style={styles.loading} />
      ) : (
        <Button
          title="Register"
          onPress={handleRegister}
          style={styles.registerButton}
          color="#7ABB3B"
        />
      )}
      <View style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <Text
          style={styles.signInLink}
          onPress={() => router.push('/login')}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  appBar: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 20 },
  logo: { width: 50, height: 50 },
  appBarTitle: { fontSize: 18, color: '#fff', marginLeft: 10 },
  title: { fontSize: 30, marginBottom: 10, textAlign: 'center', color: '#7ABB3B',fontWeight: 'bold' },
  subheading: { fontSize: 12, marginBottom: 20, color: '#666', textAlign: 'center' },
  inputContainer: { marginBottom: 10 },
  label: { fontSize: 16, marginBottom: 5, color: '#666' },
  input: { borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#fff' },
  errorContainer: { marginBottom: 10, alignItems: 'center' },
  errorText: { fontSize: 16, color: 'red', marginBottom: 5 },
  loading: { padding: 10 },
  registerButton: { backgroundColor: '#7ABB3B', padding: 10, borderRadius: 5 },
  loginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginText: { fontSize: 16, color: '#666' },
  signInLink: { fontSize: 16, color: '#7ABB3B', marginLeft: 5 },
});
