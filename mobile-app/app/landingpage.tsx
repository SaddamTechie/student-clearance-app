import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';


export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.appBar}>
        <Image
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>Welcome to Student Clearance</Text>
      <Text style={styles.tagline}>Streamline your clearance process with ease.</Text>
      <Text style={styles.description}>
        This app helps students manage their clearance status efficiently, ensuring a smooth graduation process.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/login')}
      >
        <Ionicons name="log-in" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      {/* <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/register')}
      >
        <Ionicons name="person-add" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        style={styles.learnMoreButton}
        onPress={() => router.push('/about')}
      >
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  appBar: { alignItems: 'center', padding: 10, marginBottom: 20 },
  logo: { width: 50, height: 50 },
  title: {
    fontSize: 28,
    marginBottom: 10,
    color: '#7ABB3B',
  },
  tagline: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  icon: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
    width: '80%',
  },
  button: {
    backgroundColor: '#7ABB3B',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  learnMoreButton: {
    backgroundColor: '#FF9933',
    padding: 10,
    borderRadius: 5,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  learnMoreText: {
    color: 'white',
    fontSize: 16,
  },
});
