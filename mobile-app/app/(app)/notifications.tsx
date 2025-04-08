import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import axios from 'axios';
import { apiUrl, socketUrl } from '../../config';
import { useSession } from '@/ctx';
import { Ionicons } from '@expo/vector-icons';
import io from 'socket.io-client';
import { useNotificationsContext } from '../../notificationContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const primaryColor = '#7ABB3B';
const secondaryColor = '#FF9933';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotificationsScreen() {
  const { updateUnreadCount } = useNotificationsContext();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const { session } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Push notifications are disabled. Enable them in settings to receive updates.');
        }
        if (Platform.OS === 'android') {
          Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: primaryColor,
          });
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }
    };

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      setNotifications((prev) => [
        { _id: Date.now().toString(), message: body, read: false, createdAt: new Date() },
        ...prev,
      ]);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        setNotifications(response.data);
        updateUnreadCount(response.data.filter((n) => !n.read).length);
        setError(null);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch notifications';
        setError(message);
        Alert.alert('Error', message);
      }
    };
    fetchNotifications();

    const socket = io(`${socketUrl}`, { transports: ['websocket'] });
    socket.on('connect', () => {
      const userId = JSON.parse(atob(session.split('.')[1])).id;
      socket.emit('join', userId);
    });
    socket.on('notification', async (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      updateUnreadCount((prev) => prev + 1);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Notification',
          body: notification.message,
          data: { notificationId: notification._id },
        },
        trigger: null,
      });
    });
    socket.on('error', (err) => {
      setError(err.message);
      Alert.alert('Socket Error', err.message);
    });

    return () => socket.disconnect();
  }, [session, updateUnreadCount]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`${apiUrl}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      updateUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${session}` },
      });
      setNotifications(response.data);
      updateUnreadCount(response.data.filter((n) => !n.read).length);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch notifications';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setRefreshing(false);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={secondaryColor} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {notifications.filter((n) => !n.read).length} unread
        </Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={48} color={textSecondary} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification._id}
              style={[
                styles.notificationItem,
                notification.read ? styles.read : styles.unread,
              ]}
              onPress={() => !notification.read && markAsRead(notification._id)}
            >
              <Ionicons
                name={notification.read ? 'mail-open' : 'mail'}
                size={24}
                color={notification.read ? textSecondary : primaryColor}
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
    </View>
  );
}

const textSecondary = '#666';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: primaryColor,
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
  },
  scrollContent: { padding: 15 },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  read: { backgroundColor: '#fff' },
  unread: { backgroundColor: '#e6ffe6' },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  message: { fontSize: 16, fontWeight: '500', color: '#333' },
  date: { fontSize: 12, color: textSecondary, marginTop: 5 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: secondaryColor,
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
});