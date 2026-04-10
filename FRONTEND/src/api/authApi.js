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

// POST /api/auth/google
// FIX: was sending { credential } but backend expects { access_token }
export const googleAuthApi = async (access_token) => {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ access_token }),   // ← was { credential }
  });
  return handleResponse(res);
};

// POST /api/auth/forgot-password ← ADDED
export const forgotPasswordApi = async (email) => {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  });
  return handleResponse(res);
};

// POST /api/auth/reset-password ← ADDED
export const resetPasswordApi = async ({ token, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token, password }),
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