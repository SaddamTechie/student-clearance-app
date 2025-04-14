import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '../../ctx';
import io from 'socket.io-client';
import { NotificationsProvider,useNotificationsContext } from '../../notificationContext';

import HomeScreen from './home';
import QRScreen from './qr';
import CertificateScreen from './certificate';
import ReportScreen from './report';
import ProfileScreen from './profile';
import StatusScreen from './status';
import PaymentMethodScreen from './PaymentMethodScreen';
import PaymentReceiptScreen from './PaymentReceiptScreen';
import NotificationsScreen from './notifications';
import { apiUrl, socketUrl } from '../../config';
import HistoryScreen from './history';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack for nested navigation
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
    <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
  </Stack.Navigator>
);

// Bottom Tab Navigator
function AppTabs() {
  const { session } = useSession();
  const { unreadCount } = useNotificationsContext();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'QR') iconName = 'qr-code';
          else if (route.name === 'Status') iconName = 'reorder-three-sharp';
          else if (route.name === 'Notifications') iconName = 'notifications';
          else if (route.name === 'Profile') iconName = 'person';

          if (route.name === 'Notifications') {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7ABB3B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="Status" component={StatusScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      {/* <Tab.Screen name="Notifications" component={HistoryScreen} /> */}
      <Tab.Screen name="QR" component={QRScreen} />
      {/* <Tab.Screen name="Certificate" component={CertificateScreen} /> */}
      {/* <Tab.Screen name="Report" component={ReportScreen} /> */}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!session) {
    return <Redirect href="/landingpage" />;
  }

  return (
    <NotificationsProvider>
      <AppTabs />
    </NotificationsProvider>
  );
}

const styles = StyleSheet.create({
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
});
