import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/notifications/`
  : 'http://localhost:5000/api/notifications/';

const getConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const fetchNotifications = async (unread = false) => {
  const url = unread ? `${API_URL}?unread=true` : API_URL;
  const response = await axios.get(url, getConfig());
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await axios.get(`${API_URL}unread-count`, getConfig());
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await axios.put(`${API_URL}${notificationId}`, {}, getConfig());
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await axios.put(`${API_URL}mark-all`, {}, getConfig());
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await axios.delete(`${API_URL}${notificationId}`, getConfig());
  return response.data;
};

export const clearAllNotifications = async () => {
  const response = await axios.delete(API_URL, getConfig());
  return response.data;
};
