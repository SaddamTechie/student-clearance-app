import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiUrl } from '../../config';

export default function CertificateScreen() {

  const downloadCertificate = async () => {
    const uri = `${apiUrl}/certificate/`;
    const fileUri = `${FileSystem.documentDirectory}_clearance.pdf`;

    try {
      const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, fileUri);
      await Sharing.shareAsync(downloadedUri);
    } catch (error) {
      alert('Error downloading certificate');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download Your Certificate</Text>
      <Button title="Download" onPress={downloadCertificate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});