import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/goals/`;

const getConfig = () => {
  const token = localStorage.getItem('token'); 
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
export const createNewGoal = async (goalData) => {
  const response = await axios.post(API_URL, goalData, getConfig());
  return response.data;
};

export const fetchGoals = async () => {
  const response = await axios.get(API_URL, getConfig());
  return response.data;
};

export const updateGoal = async (goalId, currentAmount) => {
  const response = await axios.put(`${API_URL}${goalId}`, { currentAmount }, getConfig());
  return response.data;
};

export const editFullGoal = async (goalId, goalData) => {
  const response = await axios.put(`${API_URL}${goalId}`, goalData, getConfig());
  return response.data;
};
export const deleteGoalAPI = async (goalId) => {
  const response = await axios.delete(`${API_URL}${goalId}`, getConfig());
  return response.data;
};
