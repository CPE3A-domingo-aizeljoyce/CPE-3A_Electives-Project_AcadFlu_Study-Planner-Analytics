const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Response handler ───────────────────────────────────────────────────────────
// Handles both { error } and { message } shapes from the backend.
// Also handles non-JSON bodies (e.g. Express 413 "request entity too large").
const handleResponse = async (res) => {
  let data = {};
  try {
    data = await res.json();
  } catch {
    // Body is not JSON — e.g. Express plain-text 413 error
    if (!res.ok) {
      const err = new Error(
        res.status === 413
          ? 'Image is too large. Please use a smaller image.'
          : `Request failed with status ${res.status}.`
      );
      err.status = res.status;
      throw err;
    }
    return {};
  }

  if (!res.ok) {
    // Backend uses { error } in settings/auth controllers, { message } in others
    const err = new Error(data.error || data.message || 'Request failed.');
    err.error  = data.error  || null;
    err.detail = data.detail || null;
    err.step   = data.step   || null;
    err.status = res.status;
    err.requiresVerification = data.requiresVerification || false;
    err.isGoogleSignIn       = data.isGoogleSignIn       || false;
    err.isGoogleAccount      = data.isGoogleAccount      || false;
    throw err;
  }

  return data;
};

// ── Auth headers helper ────────────────────────────────────────────────────────
const authHeaders = (withBody = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (withBody) headers['Content-Type'] = 'application/json';
  if (token)   headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// POST /api/auth/register
export const registerUser = async ({ name, email, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
};

// POST /api/auth/login
export const loginUser = async ({ email, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

// POST /api/auth/google
export const googleAuthApi = async (access_token) => {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ access_token }),
  });
  return handleResponse(res);
};

// POST /api/auth/forgot-password
export const forgotPasswordApi = async (email) => {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ email }),
  });
  return handleResponse(res);
};

// POST /api/auth/reset-password
export const resetPasswordApi = async ({ token, password }) => {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ token, password }),
  });
  return handleResponse(res);
};

// GET /api/auth/me
export const getMe = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found.');
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ── Settings API ───────────────────────────────────────────────────────────────

// GET /api/settings
export const getSettingsApi = async () => {
  const res = await fetch(`${BASE_URL}/api/settings`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// PUT /api/settings
export const updateSettingsApi = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/settings`, {
    method:  'PUT',
    headers: authHeaders(true),
    body:    JSON.stringify(payload),
  });
  return handleResponse(res);
};

// POST /api/settings/change-password
export const changePasswordApi = async ({ currentPassword, newPassword, confirmPassword }) => {
  const res = await fetch(`${BASE_URL}/api/settings/change-password`, {
    method:  'POST',
    headers: authHeaders(true),
    body:    JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  return handleResponse(res);
};

// DELETE /api/auth/delete-account
export const deleteAccountApi = async () => {
  const res = await fetch(`${BASE_URL}/api/auth/delete-account`, {
    method:  'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

// ✅ NEW — PATCH /api/settings/avatar
// Pass a base64 data URL string to set, or null to remove the avatar
export const updateAvatarApi = async (avatarBase64OrNull) => {
  const res = await fetch(`${BASE_URL}/api/settings/avatar`, {
    method:  'PATCH',
    headers: authHeaders(true),
    body:    JSON.stringify({ avatar: avatarBase64OrNull }),
  });
  return handleResponse(res);
};
