import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead } = useContext(NotificationContext) || {};
  const [filter, setFilter] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter notifications
  useEffect(() => {
    if (!notifications) return;
    setLoading(false);
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'unread') {
      setFilteredNotifications(notifications.filter((n) => !n.read));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter((n) => n.read));
    }
  }, [notifications, filter]);

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markAsRead(n._id)));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center space-x-2">
          <BellIcon className="h-6 w-6" />
          <span>Notifications</span>
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary hover:text-secondary transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          <span>Back</span>
        </button>
      </div>

      {/* Filter and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="relative w-full md:w-64">
          <label className="block text-gray-700 font-semibold mb-2">Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="all">All ({notifications?.length || 0})</option>
            <option value="unread">Unread ({unreadCount || 0})</option>
            <option value="read">Read</option>
          </select>
          <ChevronDownIcon className="h-5 w-5 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary transition-colors flex items-center space-x-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {loading || !notifications ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications found</p>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`border-b p-4 flex justify-between items-center ${
                !notification.read ? 'bg-gray-50' : ''
              }`}
            >
              <div>
                <p className="text-gray-700">
                  <span className="font-semibold">{notification.type}:</span>{' '}
                  {notification.message}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification._id)}
                  className="text-primary hover:text-secondary transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;