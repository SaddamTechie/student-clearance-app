import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LearnMoreScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>How to Use Student Clearance</Text>
      <Text style={styles.subheading}>A step-by-step guide to navigating the clearance process.</Text>

      <View style={styles.stepContainer}>
        <Ionicons name="checkmark-circle" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 1: Clear Obligations</Text>
        <Text style={styles.stepText}>
          Start by clearing any outstanding obligations in each department. This is a prerequisite for requesting clearance.
        </Text>
      </View>

      <View style={styles.stepContainer}>
        <Ionicons name="paper-plane" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 2: Request Clearance</Text>
        <Text style={styles.stepText}>
          Once all obligations are cleared, request clearance from the Home tab. This will initiate the review process.
        </Text>
      </View>

      <View style={styles.stepContainer}>
        <Ionicons name="sync-circle" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 3: Track Clearance Status</Text>
        <Text style={styles.stepText}>
          Monitor your clearance status in the Status tab. This will show the progress of your clearance request.
        </Text>
      </View>

      <View style={styles.stepContainer}>
        <Ionicons name="document" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 4: Download Clearance Certificate</Text>
        <Text style={styles.stepText}>
          Once your clearance is fully approved, you can download your clearance certificate from the Profile screen or Status tab.
        </Text>
      </View>

      <View style={styles.stepContainer}>
        <Ionicons name="qr-code" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 5: QR Code Verification</Text>
        <Text style={styles.stepText}>
          Use the QR code feature in the Profile screen for verification purposes if needed.
        </Text>
      </View>

      <View style={styles.stepContainer}>
        <Ionicons name="alert-circle" size={24} color="#7ABB3B" style={styles.icon} />
        <Text style={styles.stepTitle}>Step 6: Report Issues</Text>
        <Text style={styles.stepText}>
          If you encounter any issues during the clearance process, report them through the Profile screen.
        </Text>
      </View>


      <Text style={styles.note}>
        If you have any further questions or need assistance, please contact your university's administration.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, marginBottom: 10, textAlign: 'center', color: '#7ABB3B' },
  subheading: { fontSize: 16, marginBottom: 20, color: '#666', textAlign: 'center' },
  stepContainer: { marginBottom: 20 },
  icon: { marginRight: 10 },
  stepTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  stepText: { fontSize: 16, color: '#666' },
  image: { width: '100%', height: 150, borderRadius: 10, marginBottom: 20 },
  note: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
});
