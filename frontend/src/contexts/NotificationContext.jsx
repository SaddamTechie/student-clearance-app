import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { apiUrl,socketUrl } from '../App';


export const NotificationContext = createContext();

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let socket;

    const setupSocket = () => {
      socket = io(`${socketUrl}`, { transports: ['websocket'] });
      socket.on('connect', () => {
        if (userId) {
          socket.emit('join', userId);
          console.log('Socket joined room:', userId);
        }
      });
      socket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        if (!notification.read) setUnreadCount((prev) => prev + 1);
      });
      socket.on('connect_error', (err) => console.error('Socket error:', err));
    };

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await axios.get(`${apiUrl}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n) => !n.read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    if (userId) {
      fetchNotifications();
      setupSocket();
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [userId]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(`${apiUrl}/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0)); // Ensure it doesn’t go negative
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const value = { notifications, unreadCount, markAsRead };

  return (
    <NotificationContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </NotificationContext.Provider>
  );
};