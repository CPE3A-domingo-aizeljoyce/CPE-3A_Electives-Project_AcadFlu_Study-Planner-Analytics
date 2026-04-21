import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/`;

const getConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchAnalyticsData = async (timeframe = 'weekly') => {
  const response = await axios.get(`${API_URL}?timeframe=${timeframe}`, getConfig());
  return response.data;
};

export const saveSessionData = async (sessionData) => {
  const response = await axios.post(`${API_URL}save`, sessionData, getConfig());
  return response.data;
};