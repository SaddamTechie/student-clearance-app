import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './home';
import QRScreen from './qr';
import CertificateScreen from './certificate';
import ReportScreen from './report';
import ProfileScreen from './profile';
import { Text } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '../../ctx';
import StatusScreen from './status';
import PaymentMethodScreen from './PaymentMethodScreen';
import PaymentReceiptScreen from './PaymentReceiptScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
    </Stack.Navigator>
  );
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'QR') iconName = 'qr-code';
          else if (route.name === 'Certificate') iconName = 'document';
          // else if (route.name === 'Report') iconName = 'alert';
          else if (route.name === 'Status') iconName = 'alert';
          else if (route.name === 'Profile') iconName = 'person'; // Profile icon
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7ABB3B',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="QR" component={QRScreen}  />
      <Tab.Screen name="Certificate" component={CertificateScreen}  />
      {/* <Tab.Screen name="Report" component={ReportScreen}  /> */}
      <Tab.Screen name="Status" component={StatusScreen}  />
      <Tab.Screen name="Profile" component={ProfileScreen}  />
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

  return <AppTabs />;
}
