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
  const colorMap = {
    high:   '11',
    medium: '5',
    low:    '8',
  };
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

    if (!title || !subject || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (endTime <= startTime) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const task = await Task.create({
      user:        req.user.id,
      title,
      subject,
      date:        new Date(date),
      startTime,
      endTime,
      priority:    priority || 'medium',
      status:      'todo',
      done:        false,
      description: description || '',
    });

    if (syncToCalendar && req.user.googleRefreshToken) {
      try {
        const googleEventId = await syncTaskToCalendarInternal(req.user.id, task);
        task.googleEventId  = googleEventId;
        await task.save();
      } catch (calendarError) {
        console.warn('Failed to sync task to calendar:', calendarError.message);
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

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to access this task' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

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

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    task.done   = !task.done;
    task.status = task.done ? 'done' : 'todo';

    task = await task.save();

    if (task.googleEventId && req.user.googleRefreshToken) {
      try {
        await markTaskDoneInCalendarInternal(req.user.id, task.googleEventId, task.done);
      } catch (calendarError) {
        console.warn('Failed to update task in calendar:', calendarError.message);
      }
    }

    // ── Achievement hook: fire only when task was just marked as done ─────────
    if (task.done) {
      checkAndAwardAchievements(req.user.id)
        .catch(err => console.error('[Achievements] toggleTask hook error:', err.message));
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

   const task = await Task.findByIdAndUpdate(id, { status }, { new: true });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to update task status" });
  }
};

// ─── Calendar Integration ─────────────────────────────────────────────────────

// SYNC SPECIFIC TASK TO CALENDAR
export const syncTaskToCalendar = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    if (!req.user.googleRefreshToken) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }

    const googleEventId = await syncTaskToCalendarInternal(req.user.id, task);
    task.googleEventId  = googleEventId;
    await task.save();

    res.status(200).json({ message: 'Task synced to calendar', task });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET CALENDAR EVENTS
export const getCalendarEvents = async (req, res) => {
  try {
    if (!req.user.googleRefreshToken) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate query params required' });
    }

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
    if (!req.user.googleRefreshToken) {
      return res.status(400).json({ message: 'User not connected to Google Calendar' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate query params required' });
    }

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

// @desc    Update task details (Edit)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Failed to update task details" });
  }
};