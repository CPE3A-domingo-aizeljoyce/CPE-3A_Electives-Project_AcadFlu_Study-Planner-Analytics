clockifyService.js
const CLOCKIFY_API  = 'https://api.clockify.me/api/v1';
const API_KEY       = process.env.CLOCKIFY_API_KEY;
const WORKSPACE_ID  = process.env.CLOCKIFY_WORKSPACE_ID;

let cachedUserId = null;

const clockifyHeaders = {
  'X-Api-Key':    API_KEY,
  'Content-Type': 'application/json',
};

// ─── Get Clockify user (cached) ───────────────────────────────────────────────
export const getClockifyUser = async () => {
  const res = await fetch(`${CLOCKIFY_API}/user`, {
    headers: clockifyHeaders,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clockify getUser failed (${res.status}): ${err}`);
  }
  return res.json();
};

// Cache the Clockify user ID so we don't call /user on every request
export const getClockifyUserId = async () => {
  if (cachedUserId) return cachedUserId;
  const user    = await getClockifyUser();
  cachedUserId  = user.id;
  return cachedUserId;
};

// ─── Start a new time entry (no end = running timer) ──────────────────────────
export const startTimeEntry = async ({ description }) => {
  const body = {
    start:       new Date().toISOString(),
    description,
    billable:    false,
  };

  const res = await fetch(
    `${CLOCKIFY_API}/workspaces/${WORKSPACE_ID}/time-entries`,
    {
      method:  'POST',
      headers: clockifyHeaders,
      body:    JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clockify startEntry failed (${res.status}): ${err}`);
  }
  return res.json();
};

// ─── Stop the currently running timer ─────────────────────────────────────────
export const stopTimeEntry = async () => {
  const userId = await getClockifyUserId();

  const res = await fetch(
    `${CLOCKIFY_API}/workspaces/${WORKSPACE_ID}/user/${userId}/time-entries`,
    {
      method:  'PATCH',
      headers: clockifyHeaders,
      body:    JSON.stringify({ end: new Date().toISOString() }),
    }
  );

  // 404 = no running timer — not an error for us
  if (res.status === 404) return null;

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clockify stopEntry failed (${res.status}): ${err}`);
  }
  return res.json();
};

// ─── Delete a time entry (for abandoned sessions) ─────────────────────────────
export const deleteTimeEntry = async (entryId) => {
  if (!entryId) return null;

  const res = await fetch(
    `${CLOCKIFY_API}/workspaces/${WORKSPACE_ID}/time-entries/${entryId}`,
    {
      method:  'DELETE',
      headers: clockifyHeaders,
    }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Clockify deleteEntry failed (${res.status}): ${err}`);
  }
  return true;
};

// ─── Get time entries for current user ────────────────────────────────────────
export const getTimeEntries = async ({ page = 1, pageSize = 10, start, end } = {}) => {
  const userId = await getClockifyUserId();
  const params = new URLSearchParams({ page, 'page-size': pageSize });
  if (start) params.append('start', start);
  if (end)   params.append('end',   end);

  const res = await fetch(
    `${CLOCKIFY_API}/workspaces/${WORKSPACE_ID}/user/${userId}/time-entries?${params}`,
    { headers: clockifyHeaders }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clockify getEntries failed (${res.status}): ${err}`);
  }
  return res.json();
};