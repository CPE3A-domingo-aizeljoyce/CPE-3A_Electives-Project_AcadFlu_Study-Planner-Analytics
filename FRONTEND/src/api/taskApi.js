const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// GET /api/tasks
export const fetchTasks = async () => {
  const res = await fetch(`${BASE}/api/tasks`, {
    headers: authHeader(),
  });
  return handleResponse(res);
};

// POST /api/tasks
export const createNewTask = async (data) => {
  const res = await fetch(`${BASE}/api/tasks`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body:    JSON.stringify(data),
  });
  return handleResponse(res);
};

// PUT /api/tasks/:id  ← NEW
export const updateExistingTask = async (id, data) => {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body:    JSON.stringify(data),
  });
  return handleResponse(res);
};

// DELETE /api/tasks/:id
export const deleteExistingTask = async (id) => {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method:  'DELETE',
    headers: authHeader(),
  });
  return handleResponse(res);
};

// PATCH /api/tasks/:id/toggle
export const toggleTaskDone = async (id) => {
  const res = await fetch(`${BASE}/api/tasks/${id}/toggle`, {
    method:  'PATCH',
    headers: authHeader(),
  });
  return handleResponse(res);
};

// PATCH /api/tasks/:id/status
export const updateStatusTask = async (id, status) => {
  const res = await fetch(`${BASE}/api/tasks/${id}/status`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body:    JSON.stringify({ status }),
  });
  return handleResponse(res);
};

// POST /api/tasks/:id/sync-calendar  ← NEW
export const syncTaskToCalendar = async (id) => {
  const res = await fetch(`${BASE}/api/tasks/${id}/sync-calendar`, {
    method:  'POST',
    headers: authHeader(),
  });
  return handleResponse(res);
};
