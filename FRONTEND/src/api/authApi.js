const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw { message: data.message, requiresVerification: data.requiresVerification };
  return data;
};

// POST /api/auth/register
export const registerUser = async ({ name, email, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
};

// POST /api/auth/login
export const loginUser = async ({ email, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

// POST /api/auth/google — send Google credential from frontend
export const googleAuthApi = async (credential) => {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ credential }),
  });
  return handleResponse(res);
};

// GET /api/auth/me
export const getMe = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found.');
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};