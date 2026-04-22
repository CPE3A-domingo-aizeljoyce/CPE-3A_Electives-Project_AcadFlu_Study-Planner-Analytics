import axios from 'axios';

// FIXED: was hardcoded 'http://localhost:5000' — breaks in production
// Add to your frontend .env: VITE_API_URL=http://localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/tasks/`;

const getConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  };
};

export const fetchTasks = async () => {
  const token = localStorage.getItem('token');   
  const response = await axios.get(`${API_BASE}/api/tasks`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    }
  });
  
  return response.data;
};

export const fetchTask = async (id) => {
  const response = await axios.get(`${API_URL}${id}`, getConfig());
  return response.data;
};

export const createNewTask = async (taskData) => {
  const response = await axios.post(API_URL, taskData, getConfig());
  return response.data;
};

export const updateExistingTask = async (id, taskData) => {
  const response = await axios.put(`${API_URL}${id}`, taskData, getConfig());
  return response.data;
};

export const deleteExistingTask = async (id) => {
  const response = await axios.delete(`${API_URL}${id}`, getConfig());
  return response.data;
};

export const toggleTaskDone = async (id) => {
  const response = await axios.patch(`${API_URL}${id}/toggle`, {}, getConfig());
  return response.data;
};

export const updateStatusTask = async (id, status) => {
  const response = await axios.patch(`${API_URL}${id}/status`, { status }, getConfig());
  return response.data;
};

export const syncTaskToCalendar = async (taskId) => {
  const response = await axios.post(`${API_URL}${taskId}/sync-calendar`, {}, getConfig());
  return response.data;
};

export const fetchCalendarEvents = async (startDate, endDate) => {
  const response = await axios.get(`${API_URL}calendar/events`, {
    ...getConfig(),
    params: {
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
    },
  });
  return response.data;
};

export const fetchCalendarStats = async (startDate, endDate) => {
  const response = await axios.get(`${API_URL}calendar/stats`, {
    ...getConfig(),
    params: {
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
    },
  });
  return response.data;
};