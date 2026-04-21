import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notes`;

const getConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export const fetchNotes = async () => {
  const response = await axios.get(API_URL, getConfig());
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await axios.post(API_URL, noteData, getConfig());
  return response.data;
};

export const deleteNoteAPI = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getConfig());
  return response.data;
};

export const updateNoteAPI = async (id, noteData) => {
  const response = await axios.put(`${API_URL}/${id}`, noteData, getConfig());
  return response.data;
};