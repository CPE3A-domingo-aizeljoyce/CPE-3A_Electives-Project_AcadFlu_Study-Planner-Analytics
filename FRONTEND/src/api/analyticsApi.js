import axios from 'axios';

export const fetchAnalyticsData = async (timeframe = 'weekly') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:5000/api/study-timer/analytics?timeframe=${timeframe}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
 
    return response.data || [];
  } catch (error) {
    console.error("API Error fetching analytics:", error);
    return [];
  }
};