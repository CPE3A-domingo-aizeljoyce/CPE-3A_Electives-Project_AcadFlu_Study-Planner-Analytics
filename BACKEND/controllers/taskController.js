import Task from '../models/Task.js';
import { google } from 'googleapis';
import { checkAndAwardAchievements } from '../utils/achievementService.js';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  setEventDoneStatus,
  getOAuth2Client,
} from '../utils/googleCalendarService.js';

const calendar = google.calendar('v3');

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const {
      title, subject, date, startTime, endTime,
      priority, description, syncToCalendar,
    } = req.body;

    if (!title || !subject || !date || !startTime || !endTime)
      return res.status(400).json({ message: 'Missing required fields.' });

    if (endTime <= startTime)
      return res.status(400).json({ message: 'End time must be after start time.' });

    const task = await Task.create({
      user:           req.user.id,
      title:          title.trim(),
      subject:        subject.trim(),
      date:           new Date(date),
      startTime,
      endTime,
      priority:       priority || 'medium',
      status:         'todo',
      done:           false,
      description:    description?.trim() || '',
      calendarSynced: false,   // ← always start as false
    });

    console.log(`[Tasks] Created task "${task.title}" for user ${req.user.id}`);
    console.log(`[Tasks] syncToCalendar=${syncToCalendar}, hasRefreshToken=${!!req.user.googleRefreshToken}`);

    // ── Calendar sync ─────────────────────────────────────────────────────────
    if (syncToCalendar && req.user.googleRefreshToken) {
      try {
        const googleEventId = await createCalendarEvent(req.user.id, task);
        task.googleEventId  = googleEventId;
        task.calendarSynced = true;   // ✅ only set true when event actually created
        await task.save();
        console.log(`[Tasks] Calendar sync SUCCESS — eventId: ${googleEventId}`);
      } catch (calErr) {
        // ✅ Task still saves, calendarSynced stays false
        task.calendarSynced = false;
        await task.save();
        console.warn(`[Tasks] Calendar sync FAILED: ${calErr.message}`);
      }
    } else if (syncToCalendar && !req.user.googleRefreshToken) {
      console.warn(`[Tasks] syncToCalendar=true but user has no Google refresh token — skipping`);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error('[Tasks] createTask error:', err.message);
    res.status(400).json({ message: err.message });
  }
};

// GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ date: 1, startTime: 1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/tasks/:id
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found.' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to access this task.' });
    res.status(200).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/tasks/:id  ← FIXED: now syncs calendar + checks ownership
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found.' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to update this task.' });

    const { syncToCalendar, ...fields } = req.body;

    // Apply allowed field updates
    const allowed = ['title', 'subject', 'date', 'startTime', 'endTime', 'priority', 'description', 'status', 'done'];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        task[key] = key === 'date' ? new Date(fields[key]) : fields[key];
      }
    }

    // ── Calendar sync on edit ──────────────────────────────────────────────────
    if (req.user.googleRefreshToken) {
      // sync if: explicitly true, OR task was already synced and user didn't say false
      const shouldSync = syncToCalendar === true
        || (syncToCalendar === undefined && task.calendarSynced);

      if (shouldSync) {
        try {
          const googleEventId = await updateCalendarEvent(req.user.id, task.googleEventId, task);
          task.googleEventId  = googleEventId;
          task.calendarSynced = true;
        } catch (calErr) {
          console.warn(`[Tasks] Calendar update failed on edit: ${calErr.message}`);
          // Task still saves to DB
        }
      } else if (syncToCalendar === false && task.googleEventId) {
        // User explicitly unchecked "Sync" → remove from Calendar
        try {
          await deleteCalendarEvent(req.user.id, task.googleEventId);
          task.googleEventId  = null;
          task.calendarSynced = false;
        } catch (calErr) {
          console.warn(`[Tasks] Calendar removal failed: ${calErr.message}`);
        }
      }
    }

    await task.save();
    res.status(200).json(task);
  } catch (err) {
    console.error('[Tasks] updateTask:', err.message);
    res.status(500).json({ message: 'Failed to update task.' });
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found.' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to delete this task.' });

    // Remove from Calendar first (non-blocking)
    if (task.googleEventId && req.user.googleRefreshToken) {
      try {
        await deleteCalendarEvent(req.user.id, task.googleEventId);
      } catch (calErr) {
        console.warn(`[Tasks] Calendar delete failed: ${calErr.message}`);
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH /api/tasks/:id/toggle
export const toggleTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found.' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to update this task.' });

    task.done   = !task.done;
    task.status = task.done ? 'done' : 'todo';
    task        = await task.save();

    // Update Calendar transparency (non-blocking)
    if (task.googleEventId && req.user.googleRefreshToken) {
      try {
        await setEventDoneStatus(req.user.id, task.googleEventId, task.done);
      } catch (calErr) {
        console.warn(`[Tasks] Calendar transparency update failed: ${calErr.message}`);
      }
    }

    // Achievement hook
    if (task.done) {
      checkAndAwardAchievements(req.user.id)
        .catch(err => console.error('[Achievements] toggleTask error:', err.message));
    }

    res.status(200).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PATCH /api/tasks/:id/status  (Kanban drag-and-drop)
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task status.' });
  }
};

// ─── Calendar endpoints ───────────────────────────────────────────────────────

// POST /api/tasks/:id/sync-calendar  (manual sync button)
export const syncTaskToCalendar = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ message: 'Task not found.' });
    if (task.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized.' });
    if (!req.user.googleRefreshToken)
      return res.status(400).json({
        message: 'Please sign in with Google first to use Calendar sync.',
      });

    const googleEventId = await updateCalendarEvent(req.user.id, task.googleEventId, task);
    task.googleEventId  = googleEventId;
    task.calendarSynced = true;
    await task.save();

    res.status(200).json({ message: 'Task synced to Google Calendar.', task });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/tasks/calendar/events
export const getCalendarEvents = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken)
      return res.status(400).json({ message: 'User not connected to Google Calendar.' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ message: 'startDate and endDate are required.' });

    const auth   = await getOAuth2Client(req.user.id);
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
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/tasks/calendar/stats
export const getCalendarStats = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken)
      return res.status(400).json({ message: 'User not connected to Google Calendar.' });

    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ message: 'startDate and endDate are required.' });

    const auth   = await getOAuth2Client(req.user.id);
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
      if (event.start?.dateTime && event.end?.dateTime) {
        stats.totalDuration +=
          (new Date(event.end.dateTime) - new Date(event.start.dateTime)) / (1000 * 60);
      }
    });

    res.status(200).json(stats);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
