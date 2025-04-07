// notificationContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl, socketUrl } from './config';
import io from 'socket.io-client';
import { useSession } from './ctx';

interface NotificationsContextValue {
  unreadCount: number;
  updateUnreadCount: (newCount: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { session } = useSession();

  useEffect(() => {
    if (!session) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${session}` },
        });
        const data = response.data;
        setUnreadCount(data.filter((n) => !n.read).length);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnreadCount();

    const socket = io(`${socketUrl}`, { transports: ['websocket'] });
    socket.on('connect', () => {
      let userId;
      try {
        userId = JSON.parse(atob(session.split('.')[1])).id;
        socket.emit('join', userId);
      } catch (err) {
        console.error('Error parsing JWT:', err);
      }
    });
    socket.on('notification', (notification) => {
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, [session]);

  const updateUnreadCount = (newCount: number) => {
    setUnreadCount(newCount);
  };

  return (
    <NotificationsContext.Provider value={{ unreadCount, updateUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => React.useContext(NotificationsContext);