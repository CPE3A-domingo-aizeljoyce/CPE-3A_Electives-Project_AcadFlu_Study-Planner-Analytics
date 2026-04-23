const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
};

// GET /api/settings
export const getSettings = async () => {
  const token = getToken();
  if (!token) throw new Error('No authentication token found');

  const res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(res);
};

// PUT /api/settings
export const updateSettings = async ({ profile, notifs, timer }) => {
  const token = getToken();
  if (!token) throw new Error('No authentication token found');

  const res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ profile, notifs, timer }),
  });
  return handleResponse(res);
};
