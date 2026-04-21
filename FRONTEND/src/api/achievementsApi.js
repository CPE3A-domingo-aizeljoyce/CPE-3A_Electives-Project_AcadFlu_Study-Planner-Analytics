import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/achievements`;

const getConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

// GET /api/achievements — all achievements with status + progress
export const fetchAchievements = async () => {
  const res = await axios.get(API_URL, getConfig());
  return res.data;
};

// POST /api/achievements/check — trigger a fresh achievement check
export const triggerAchievementCheck = async () => {
  const res = await axios.post(`${API_URL}/check`, {}, getConfig());
  return res.data;
};