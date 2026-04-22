import Task from '../models/Task.js';
import User from '../models/User.js';
import { google } from 'googleapis';
import Goal from '../models/goalModel.js';
import { checkAndAwardAchievements } from '../utils/achievementService.js';

const calendar = google.calendar('v3');

// ─── Google Calendar Helpers ──────────────────────────────────────────────────

async function getOAuth2Client(userId) {
  const user = await User.findById(userId);

  if (!user || !user.googleRefreshToken) {
    throw new Error('User not connected to Google Calendar');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.SERVER_URL + '/api/auth/google/callback'
  );

  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
    access_token:  user.googleAccessToken,
    expiry_date:   user.googleTokenExpiry,
  });

  if (user.googleTokenExpiry && new Date() > new Date(user.googleTokenExpiry)) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    user.googleAccessToken = credentials.access_token;
    user.googleTokenExpiry = credentials.expiry_date;
    await user.save();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
      access_token:  credentials.access_token,
      expiry_date:   credentials.expiry_date,
    });
  }

  return oauth2Client;
}

function getCalendarColorFromPriority(priority) {
  const colorMap = { high: '11', medium: '5', low: '8' };
  return colorMap[priority] || '8';
}

async function syncTaskToCalendarInternal(userId, task) {
  try {
    const auth    = await getOAuth2Client(userId);
    const dateStr = task.date.toISOString().split('T')[0];

    const eventData = {
      summary:     task.title,
      description: `Subject: ${task.subject}\nPriority: ${task.priority}${task.description ? '\n' + task.description : ''}`,
      start: {
        dateTime: `${dateStr}T${task.startTime}:00`,
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: `${dateStr}T${task.endTime}:00`,
        timeZone: 'Asia/Manila',
      },
      colorId:      getCalendarColorFromPriority(task.priority),
      transparency: task.done ? 'transparent' : 'opaque',
    };

    let event;

    if (task.googleEventId) {
      event = await calendar.events.update({
        auth,
        calendarId: 'primary',
        eventId:    task.googleEventId,
        resource:   eventData,
      });
    } else {
      event = await calendar.events.insert({
        auth,
        calendarId: 'primary',
        resource:   eventData,
      });
    }

    return event.data.id;
  } catch (error) {
    console.error('Error syncing task to calendar:', error);
    throw new Error(`Failed to sync task to calendar: ${error.message}`);
  }
}

async function removeTaskFromCalendarInternal(userId, googleEventId) {
  try {
    if (!googleEventId) return;
    const auth = await getOAuth2Client(userId);
    await calendar.events.delete({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
    });
    return true;
  } catch (error) {
    // 410 Gone = already deleted on Google's side — treat as success
    if (error.code === 410 || error.status === 410) return true;
    console.error('Error removing task from calendar:', error);
    return false;
  }
}

async function markTaskDoneInCalendarInternal(userId, googleEventId, isDone) {
  try {
    if (!googleEventId) return;
    const auth  = await getOAuth2Client(userId);
    const event = await calendar.events.get({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
    });
    event.data.transparency = isDone ? 'transparent' : 'opaque';
    await calendar.events.update({
      auth,
      calendarId: 'primary',
      eventId:    googleEventId,
      resource:   event.data,
    });
    return true;
  } catch (error) {
    console.error('Error marking task done in calendar:', error);
    return false;
  }
}

// ─── Task CRUD ────────────────────────────────────────────────────────────────

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const { title, subject, date, startTime, endTime, priority, description, syncToCalendar } = req.body;

    if (!title || !subject || !date || !startTime || !endTime)
      return res.status(400).json({ message: 'Missing required fields' });

    if (endTime <= startTime)
      return res.status(400).json({ message: 'End time must be after start time.' });

    const task = await Task.create({
      user:           req.user.id,
      title,
      subject,
      date:           new Date(date),
      startTime,
      endTime,
      priority:       priority || 'medium',
      status:         'todo',
      done:           false,
      description:    description || '',
      calendarSynced: false,
    });

    console.log(`[Tasks] Created "${task.title}" — syncToCalendar=${syncToCalendar}, hasToken=${!!req.user.googleRefreshToken}`);

    if (syncToCalendar && req.user.googleRefreshToken) {
      try {
        const googleEventId = await syncTaskToCalendarInternal(req.user.id, task);
        task.googleEventId   = googleEventId;
        task.calendarSynced  = true;
        task.lastCalendarSyncAt = new Date();
        await task.save();
        console.log(`[Tasks] Calendar sync SUCCESS — eventId: ${googleEventId}`);
      } catch (calendarError) {
        task.calendarSynced = false;
        await task.save();
        console.warn(`[Tasks] Calendar sync FAILED: ${calendarError.message}`);
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET ALL TASKS
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ date: 1, startTime: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET SINGLE TASK
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to access this task' });
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE TASK
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task    = await Task.findById(id);

    if (!task)
      return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to update this task' });

    const { syncToCalendar, ...fields } = req.body;
    const allowed = ['title', 'subject', 'date', 'startTime', 'endTime', 'priority', 'description', 'status', 'done'];
    for (const key of allowed) {
      if (fields[key] !== undefined)
        task[key] = key === 'date' ? new Date(fields[key]) : fields[key];
    }

    // Sync updated fields to calendar if task is already synced
    if (req.user.googleRefreshToken) {
      const shouldSync = syncToCalendar === true || (syncToCalendar === undefined && task.calendarSynced);
      if (shouldSync) {
        try {
          const googleEventId = await syncTaskToCalendarInternal(req.user.id, task);
          task.googleEventId      = googleEventId;
          task.calendarSynced     = true;
          task.lastCalendarSyncAt = new Date();
        } catch (calErr) {
          console.warn(`[Tasks] Calendar update failed on edit: ${calErr.message}`);
        }
      } else if (syncToCalendar === false && task.googleEventId) {
        // User explicitly unsynced — remove from Calendar
        try {
          await removeTaskFromCalendarInternal(req.user.id, task.googleEventId);
          task.googleEventId  = null;
          task.calendarSynced = false;
        } catch (calErr) {
          console.warn(`[Tasks] Calendar removal failed: ${calErr.message}`);
        }
      }
    }

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error('[Tasks] updateTask error:', error.message);
    res.status(500).json({ message: 'Failed to update task details' });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to delete this task' });

    if (task.googleEventId && req.user.googleRefreshToken) {
      try {
        await removeTaskFromCalendarInternal(req.user.id, task.googleEventId);
      } catch (calendarError) {
        console.warn('Failed to remove task from calendar:', calendarError.message);
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// TOGGLE TASK COMPLETION
export const toggleTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to update this task' });

    task.done   = !task.done;
    task.status = task.done ? 'done' : 'todo';
    task        = await task.save();

    if (task.googleEventId && req.user.googleRefreshToken) {
      try {
        await markTaskDoneInCalendarInternal(req.user.id, task.googleEventId, task.done);
      } catch (calendarError) {
        console.warn('Failed to update task in calendar:', calendarError.message);
      }
    }

    if (task.done) {
      checkAndAwardAchievements(req.user.id)
        .catch(err => console.error('[Achievements] toggleTask hook error:', err.message));
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE TASK STATUS (Kanban drag-drop)
export const updateTaskStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(id, { status }, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status' });
  }
};

// SYNC SPECIFIC TASK TO CALENDAR (manual)
export const syncTaskToCalendar = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to update this task' });
    if (!req.user.googleRefreshToken)
      return res.status(400).json({ message: 'User not connected to Google Calendar' });

    const googleEventId     = await syncTaskToCalendarInternal(req.user.id, task);
    task.googleEventId      = googleEventId;
    task.calendarSynced     = true;
    task.lastCalendarSyncAt = new Date();
    await task.save();

    res.status(200).json({ message: 'Task synced to calendar', task });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET CALENDAR EVENTS
export const getCalendarEvents = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken)
      return res.status(400).json({ message: 'User not connected to Google Calendar' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ message: 'startDate and endDate query params required' });

    const auth = await getOAuth2Client(req.user.id);
    const events = await calendar.events.list({
      auth,
      calendarId:   'primary',
      timeMin:      new Date(startDate).toISOString(),
      timeMax:      new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy:      'startTime',
      fields:       'items(id,summary,start,end,description,colorId)',
    });

    res.status(200).json(events.data.items || []);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET CALENDAR STATS
export const getCalendarStats = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken)
      return res.status(400).json({ message: 'User not connected to Google Calendar' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ message: 'startDate and endDate query params required' });

    const auth = await getOAuth2Client(req.user.id);
    const events = await calendar.events.list({
      auth,
      calendarId:   'primary',
      timeMin:      new Date(startDate).toISOString(),
      timeMax:      new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy:      'startTime',
      fields:       'items(id,summary,start,end,description,colorId,transparency)',
    });

    const items = events.data.items || [];
    const stats = {
      totalEvents:     items.length,
      completedEvents: items.filter(e => e.transparency === 'transparent').length,
      byColor:         {},
      totalDuration:   0,
    };

    items.forEach(event => {
      const color          = event.colorId || '8';
      stats.byColor[color] = (stats.byColor[color] || 0) + 1;
      if (event.start.dateTime && event.end.dateTime) {
        const start          = new Date(event.start.dateTime);
        const end            = new Date(event.end.dateTime);
        stats.totalDuration += (end - start) / (1000 * 60);
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── 2-WAY SYNC: Google Calendar → Database ───────────────────────────────────
//
// HOW IT WORKS:
// 1. Uses Google Calendar "sync tokens" — after each events.list() call, Google
//    returns a nextSyncToken. Save it to the User model.
// 2. Next time this endpoint is called, send that token instead of timeMin/timeMax.
//    Google then returns ONLY events that changed since the token was issued.
// 3. Cancelled events (status === 'cancelled') are events deleted in Google Calendar.
// 4. We match them against our MongoDB tasks by googleEventId and delete them.
// 5. Only tasks with googleEventId are touched — local-only tasks are safe.
//
// CALLED BY: frontend on Tasks page load (silent background check)
//
export const syncFromCalendar = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken) {
      // Non-Google users: silently skip
      return res.status(200).json({
        message:      'No Google Calendar connected.',
        deletedCount: 0,
        deletedTasks: [],
      });
    }

    const auth = await getOAuth2Client(req.user.id);
    const user = await User.findById(req.user.id);

    // ── Build list params ──────────────────────────────────────────────────────
    const listParams = {
      auth,
      calendarId:  'primary',
      showDeleted: true,   // ← crucial: include events with status='cancelled'
      fields:      'nextSyncToken,nextPageToken,items(id,status,summary)',
    };

    if (user.calendarSyncToken) {
      // Incremental sync: only changes since last token
      listParams.syncToken = user.calendarSyncToken;
      console.log(`[CalendarSync] Incremental sync for user ${req.user.id}`);
    } else {
      // First sync ever: establish baseline over a wide time window
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 12); // 12 months back
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);  // 6 months forward

      listParams.timeMin      = timeMin.toISOString();
      listParams.timeMax      = timeMax.toISOString();
      listParams.singleEvents = true;
      listParams.maxResults   = 2500;
      console.log(`[CalendarSync] First baseline sync for user ${req.user.id}`);
    }

    // ── Call Google Calendar API ───────────────────────────────────────────────
    let response;
    try {
      response = await calendar.events.list(listParams);
    } catch (apiErr) {
      // HTTP 410 Gone = sync token expired — clear it so next call does full sync
      if (apiErr.code === 410 || apiErr.status === 410) {
        console.warn(`[CalendarSync] Sync token expired for user ${req.user.id} — resetting`);
        user.calendarSyncToken = null;
        await user.save();
        return res.status(200).json({
          message:      'Calendar sync token expired and was reset. Refresh to re-sync.',
          deletedCount: 0,
          deletedTasks: [],
          tokenReset:   true,
        });
      }
      throw apiErr;
    }

    const events = response.data.items || [];

    // ── Save the new sync token for next incremental call ─────────────────────
    if (response.data.nextSyncToken) {
      user.calendarSyncToken = response.data.nextSyncToken;
      await user.save();
      console.log(`[CalendarSync] New sync token saved for user ${req.user.id}`);
    }

    // ── Find cancelled event IDs ───────────────────────────────────────────────
    const cancelledIds = events
      .filter(e => e.status === 'cancelled')
      .map(e => e.id);

    console.log(`[CalendarSync] ${events.length} changed events, ${cancelledIds.length} cancelled`);

    if (cancelledIds.length === 0) {
      return res.status(200).json({
        message:      'Calendar sync complete — no remote deletions found.',
        deletedCount: 0,
        deletedTasks: [],
      });
    }

    // ── Match cancelled events against MongoDB tasks ───────────────────────────
    // SAFETY: only tasks belonging to this user + have googleEventId
    const tasksToDelete = await Task.find({
      user:          req.user.id,
      googleEventId: { $in: cancelledIds },
    });

    console.log(`[CalendarSync] ${tasksToDelete.length} matching tasks found in DB`);

    const deletedTasks = [];

    for (const task of tasksToDelete) {
      console.log(
        `[CalendarSync] Removing task "${task.title}" ` +
        `(googleEventId: ${task.googleEventId}) — deleted from Google Calendar`
      );
      await Task.findByIdAndDelete(task._id);
      deletedTasks.push({
        id:    task._id,
        title: task.title,
        date:  task.date,
      });
    }

    const count = deletedTasks.length;
    const message = count > 0
      ? `${count} task${count > 1 ? 's were' : ' was'} removed because ${count > 1 ? 'their' : 'its'} Google Calendar event${count > 1 ? 's were' : ' was'} deleted.`
      : 'Calendar sync complete — no changes detected.';

    console.log(`[CalendarSync] Done — ${count} tasks removed for user ${req.user.id}`);

    res.status(200).json({
      message,
      deletedCount: count,
      deletedTasks,
    });

  } catch (err) {
    // Non-fatal: log and return gracefully
    console.error('[CalendarSync] Sync error:', err.message);
    res.status(200).json({
      message:      `Calendar sync skipped: ${err.message}`,
      deletedCount: 0,
      deletedTasks: [],
      error:        true,
    });
  }
};