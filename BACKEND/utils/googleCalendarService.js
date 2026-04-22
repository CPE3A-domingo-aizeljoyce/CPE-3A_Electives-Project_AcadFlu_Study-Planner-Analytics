import { google } from 'googleapis';
import User from '../models/User.js';

const calendar = google.calendar('v3');

// ── Get authenticated OAuth2 client for a user ────────────────────────────────
export async function getOAuth2Client(userId) {
  const user = await User.findById(userId);

  if (!user?.googleRefreshToken) {
    throw new Error(
      'User not connected to Google Calendar. Please sign in with Google first.'
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.SERVER_URL}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
    access_token:  user.googleAccessToken,
    expiry_date:   user.googleTokenExpiry,
  });

  // Auto-refresh if access token is expired
  if (user.googleTokenExpiry && Date.now() > user.googleTokenExpiry) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.googleAccessToken = credentials.access_token;
      user.googleTokenExpiry = credentials.expiry_date;
      await user.save();
      oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
        access_token:  credentials.access_token,
        expiry_date:   credentials.expiry_date,
      });
      console.log('[Calendar] Access token refreshed for user:', userId);
    } catch (refreshErr) {
      console.error('[Calendar] Token refresh failed:', refreshErr.message);
      throw new Error(
        'Google session expired. Please re-login with Google to reconnect Calendar.'
      );
    }
  }

  return oauth2Client;
}

// ── Map task priority → Google Calendar color ID ──────────────────────────────
// 11 = Tomato (red)  |  5 = Banana (yellow)  |  8 = Graphite (grey)
function colorIdFromPriority(priority) {
  const map = { high: '11', medium: '5', low: '8' };
  return map[priority] || '8';
}

// ── Build a Google Calendar event resource from a Task document ───────────────
function buildEventResource(task) {
  // Handle both Date objects and ISO strings
  const dateStr = task.date instanceof Date
    ? task.date.toISOString().split('T')[0]
    : String(task.date).split('T')[0];

  const descLines = [
    `Subject: ${task.subject}`,
    `Priority: ${task.priority}`,
  ];
  if (task.description) descLines.push('', task.description);

  return {
    summary:      task.title,
    description:  descLines.join('\n'),
    start: {
      dateTime: `${dateStr}T${task.startTime}:00`,
      timeZone: 'Asia/Manila',
    },
    end: {
      dateTime: `${dateStr}T${task.endTime}:00`,
      timeZone: 'Asia/Manila',
    },
    colorId:      colorIdFromPriority(task.priority),
    // Completed tasks show as "free" (strikethrough) in Calendar
    transparency: task.done ? 'transparent' : 'opaque',
    source: {
      title: 'StudyFlow',
      url:   process.env.CLIENT_URL || 'http://localhost:5173',
    },
  };
}

// ── CREATE a new Google Calendar event ───────────────────────────────────────
export async function createCalendarEvent(userId, task) {
  const auth     = await getOAuth2Client(userId);
  const resource = buildEventResource(task);

  const response = await calendar.events.insert({
    auth,
    calendarId: 'primary',
    resource,
  });

  console.log(`[Calendar] Created  "${task.title}" → eventId: ${response.data.id}`);
  return response.data.id;
}

// ── UPDATE an existing Google Calendar event ─────────────────────────────────
// If no googleEventId yet, creates a new event instead
export async function updateCalendarEvent(userId, googleEventId, task) {
  if (!googleEventId) {
    return createCalendarEvent(userId, task);
  }

  const auth     = await getOAuth2Client(userId);
  const resource = buildEventResource(task);

  const response = await calendar.events.update({
    auth,
    calendarId: 'primary',
    eventId:    googleEventId,
    resource,
  });

  console.log(`[Calendar] Updated  "${task.title}" → eventId: ${response.data.id}`);
  return response.data.id;
}

// ── DELETE a Google Calendar event ───────────────────────────────────────────
export async function deleteCalendarEvent(userId, googleEventId) {
  if (!googleEventId) return false;

  try {
    const auth = await getOAuth2Client(userId);
    await calendar.events.delete({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
    });
    console.log(`[Calendar] Deleted  eventId: ${googleEventId}`);
    return true;
  } catch (err) {
    // 410 Gone = already deleted on Google's side → treat as success
    if (err.code === 410 || err.status === 410) return true;
    console.error('[Calendar] Delete failed:', err.message);
    return false;
  }
}

// ── Mark a calendar event as done (transparent) or active (opaque) ────────────
export async function setEventDoneStatus(userId, googleEventId, isDone) {
  if (!googleEventId) return false;

  try {
    const auth = await getOAuth2Client(userId);

    // Fetch the existing event to preserve all other fields
    const { data: existing } = await calendar.events.get({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
    });

    existing.transparency = isDone ? 'transparent' : 'opaque';

    await calendar.events.update({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
      resource:   existing,
    });

    console.log(`[Calendar] Marked   eventId: ${googleEventId} as ${isDone ? 'done' : 'active'}`);
    return true;
  } catch (err) {
    console.error('[Calendar] setEventDoneStatus failed:', err.message);
    return false;
  }
}