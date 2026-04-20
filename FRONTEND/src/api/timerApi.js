timerApi.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/study-timer/`;

const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// ── Helper ─────────────────────────────────────────────────────────────────
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

// ── POST /api/study-timer/start ─────────────────────────────────────────────
export const startStudySession = async ({ title, subject, mode = 'work', notes = '' }) => {
  const response = await axios.post(`${API_URL}start`, { title, subject, mode, notes }, getConfig());
  return response.data;
};

// ── PATCH /api/study-timer/:id/pause ───────────────────────────────────────
export const pauseStudySession = async (id) => {
  const response = await axios.patch(`${API_URL}${id}/pause`, {}, getConfig());
  return response.data;
};

// ── PATCH /api/study-timer/:id/resume ──────────────────────────────────────
export const resumeStudySession = async (id) => {
  const response = await axios.patch(`${API_URL}${id}/resume`, {}, getConfig());
  return response.data;
};

// ── PATCH /api/study-timer/:id/stop ────────────────────────────────────────
export const stopStudySession = async (id, notes = '') => {
  const response = await axios.patch(`${API_URL}${id}/stop`, { notes }, getConfig());
  return response.data;
};

// ── PATCH /api/study-timer/:id/abandon ─────────────────────────────────────
export const abandonStudySession = async (id) => {
  const response = await axios.patch(`${API_URL}${id}/abandon`, {}, getConfig());
  return response.data;
};

// ── GET /api/study-timer ────────────────────────────────────────────────────
export const fetchStudySessions = async (params = {}) => {
  const response = await axios.get(API_URL, { ...getConfig(), params });
  return response.data;
};

// ── GET /api/study-timer/:id ────────────────────────────────────────────────
export const fetchStudySession = async (id) => {
  const response = await axios.get(`${API_URL}${id}`, getConfig());
  return response.data;
};

// ── GET /api/study-timer/active ─────────────────────────────────────────────
export const fetchActiveSession = async () => {
  const response = await axios.get(`${API_URL}active`, getConfig());
  return response.data;
};

// ── GET /api/study-timer/stats ──────────────────────────────────────────────
export const fetchStudySessionStats = async (params = {}) => {
  const response = await axios.get(`${API_URL}stats`, { ...getConfig(), params });
  return response.data;
};

// ── DELETE /api/study-timer/:id ─────────────────────────────────────────────
export const deleteStudySession = async (id) => {
  const response = await axios.delete(`${API_URL}${id}`, getConfig());
  return response.data;
};