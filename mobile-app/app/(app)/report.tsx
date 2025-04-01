import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { apiUrl } from '../../config';
import {Picker} from '@react-native-picker/picker';
import { useSession } from '@/ctx';

export default function ReportScreen() {
  const  [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const { session } = useSession();

  const handleReport = async () => {
    try {
      const response = await axios.post(`${apiUrl}/report`, { department, message }, { 
        headers: { Authorization: `Bearer ${session}` },
      });
      alert('Issue reported successfully');
      setMessage('');
      setDepartment('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to report issue');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report an Issue</Text>
      <Picker
        selectedValue={department}
        onValueChange={(itemValue, itemIndex) =>
          setDepartment(itemValue)
        }>
        <Picker.Item label="Finance" value="finance" />
        <Picker.Item label="Library" value="library" />
        <Picker.Item label="Department" value="department" />
        <Picker.Item label="Hostel" value="hostel" />
        <Picker.Item label="Administration" value="administration" />
   </Picker>
      <TextInput
        style={styles.input}
        placeholder="Describe the issue"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <Button title="Submit" onPress={handleReport} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5, height: 100 },
});