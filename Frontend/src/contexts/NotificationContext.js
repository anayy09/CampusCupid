import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Fetch notification count on mount and periodically
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/notifications/count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchNotificationCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = useCallback(async (limit = 10) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/notifications?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`${API_URL}/notifications/read`, 
        { notificationIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Simulate receiving a new notification (for testing)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const value = {
    unreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
