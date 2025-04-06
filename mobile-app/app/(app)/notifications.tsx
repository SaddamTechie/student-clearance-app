import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { apiUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setNotifications(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch notifications');
      }
    };
    fetchNotifications();

    // Setup Socket.IO
    const socket = io('http://localhost:5000', { transports: ['websocket'] }); // Force websocket
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      const userId = JSON.parse(atob(session.split('.')[1])).id; // Decode JWT payload
      socket.emit('join', userId);
      console.log('Joined room:', userId);
    });
    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
    });
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setError('Failed to connect to notification server');
    });
    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
      setError(err.message);
    });

    return () => {
      console.log('Disconnecting socket');
      socket.disconnect();
    };
  }, [session]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`${apiUrl}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!notifications) return <Text>Loading...</Text>;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.info}>No notifications yet.</Text>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification._id}
            style={[styles.notificationItem, notification.read ? styles.read : styles.unread]}
            onPress={() => !notification.read && markAsRead(notification._id)}
          >
            <Ionicons
              name={notification.read ? 'mail-open-outline' : 'mail-outline'}
              size={24}
              color={notification.read ? '#666' : '#007AFF'}
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.date}>
                {new Date(notification.createdAt).toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

NotificationsScreen.tabBarIcon = ({ color, size }) => {
  const { session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      try {
        const response = await axios.get(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setUnreadCount(response.data.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnread();
  }, [session]);

  return (
    <View>
      <Ionicons name="notifications" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  info: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 20 },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  read: { backgroundColor: '#fff' },
  unread: { backgroundColor: '#e6f0ff' },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  message: { fontSize: 16, fontWeight: '500' },
  date: { fontSize: 12, color: '#666', marginTop: 5 },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12 },
  error: { fontSize: 16, color: 'red', textAlign: 'center', padding: 20 },
});