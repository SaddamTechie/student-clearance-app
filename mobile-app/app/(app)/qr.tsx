import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { apiUrl } from '../../config'; // Ensure this points to your backend
import { useSession } from '@/ctx';

export default function QRScreen() {
  const [qrCode, setQrCode] = useState('');
  const { session } = useSession();

  useEffect(() => {
    const fetchQR = async () => {
      if (!session) {
        console.error('No session available');
        return;
      }
      try {
        const response = await axios.get(`${apiUrl}/qr`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setQrCode(response.data.qrCode); // Expecting {"id": "student123"}
      } catch (error) {
        console.error('Error fetching QR code:', error);
      }
    };
    fetchQR();
  }, [session]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      {qrCode ? (
        <QRCode value={qrCode} size={200} />
      ) : (
        <Text>Loading QR code...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});