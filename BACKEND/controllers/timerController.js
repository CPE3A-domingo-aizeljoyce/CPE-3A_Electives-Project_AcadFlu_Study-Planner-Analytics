timerController.js
import StudySession from '../models/StudySession.js';
import mongoose    from 'mongoose';
import {
  startTimeEntry,
  stopTimeEntry,
  deleteTimeEntry,
  getTimeEntries,
} from '../utils/clockifyService.js';

// ─── Helper: safe Clockify call (never crashes the main flow) ─────────────────
const safeClockify = async (fn, label) => {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[Clockify] ${label} failed (non-fatal):`, err.message);
    return null;
  }
};

// @desc  Start a new study session
// @route POST /api/study-timer/start
// @access Private
export const startStudySession = async (req, res) => {
  try {
    const { title, subject, mode = 'work', notes } = req.body;

    if (!title || !subject) {
      return res.status(400).json({
        message: 'Please provide title and subject for the study session',
      });
    }

    // Block if user already has an active session
    const existingSession = await StudySession.findOne({
      user:   req.user._id,
      status: { $in: ['running', 'paused'] },
    });

    if (existingSession) {
      return res.status(400).json({
        message: 'You already have an active study session. Please stop it before starting a new one.',
      });
    }

    // ── Clockify: start time entry ──────────────────────────────────────────
    const clockifyEntry = await safeClockify(
      () => startTimeEntry({ description: `${title} [${subject}]` }),
      'startTimeEntry'
    );

    // ── Create DB session ───────────────────────────────────────────────────
    const studySession = await StudySession.create({
      user:            req.user._id,
      title,
      subject,
      mode,
      notes,
      startTime:       new Date(),
      status:          'running',
      clockifyEntryId: clockifyEntry?.id ?? null,
    });

    res.status(201).json({ success: true, data: studySession });
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({ message: 'Failed to start study session', error: error.message });
  }
};

// @desc  Pause a study session
// @route PATCH /api/study-timer/:id/pause
// @access Private
export const pauseStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (studySession.status !== 'running') {
      return res.status(400).json({ message: 'Can only pause a running session' });
    }

    // ── Clockify: stop the running timer ────────────────────────────────────
    await safeClockify(() => stopTimeEntry(), 'stopTimeEntry (pause)');

    studySession.pause();
    await studySession.save();

    res.json({ success: true, data: studySession });
  } catch (error) {
    console.error('Error pausing study session:', error);
    res.status(500).json({ message: 'Failed to pause study session', error: error.message });
  }
};

// @desc  Resume a study session
// @route PATCH /api/study-timer/:id/resume
// @access Private
export const resumeStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (studySession.status !== 'paused') {
      return res.status(400).json({ message: 'Can only resume a paused session' });
    }

    // ── Clockify: start a new time entry for the resumed session ────────────
    const clockifyEntry = await safeClockify(
      () => startTimeEntry({ description: `${studySession.title} [${studySession.subject}] (resumed)` }),
      'startTimeEntry (resume)'
    );

    if (clockifyEntry?.id) {
      studySession.clockifyEntryId = clockifyEntry.id;
    }

    studySession.resume();
    await studySession.save();

    res.json({ success: true, data: studySession });
  } catch (error) {
    console.error('Error resuming study session:', error);
    res.status(500).json({ message: 'Failed to resume study session', error: error.message });
  }
};

// @desc  Stop/Complete a study session
// @route PATCH /api/study-timer/:id/stop
// @access Private
export const stopStudySession = async (req, res) => {
  try {
    const { id }    = req.params;
    const { notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (studySession.status === 'completed' || studySession.status === 'abandoned') {
      return res.status(400).json({ message: 'Session is already stopped' });
    }

    // ── Clockify: stop the running timer ────────────────────────────────────
    await safeClockify(() => stopTimeEntry(), 'stopTimeEntry (stop)');

    if (notes !== undefined) studySession.notes = notes;

    studySession.stop();
    await studySession.save();

    res.json({ success: true, data: studySession, message: 'Study session completed successfully' });
  } catch (error) {
    console.error('Error stopping study session:', error);
    res.status(500).json({ message: 'Failed to stop study session', error: error.message });
  }
};

// @desc  Abandon a study session (deletes it — not saved)
// @route PATCH /api/study-timer/:id/abandon
// @access Private
export const abandonStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (studySession.status === 'completed') {
      return res.status(400).json({ message: 'Cannot abandon a completed session' });
    }

    // ── Clockify: stop the timer if it was running ───────────────────────────
    await safeClockify(() => stopTimeEntry(), 'stopTimeEntry (abandon)');

    // Delete the session entirely — user chose not to save it
    await StudySession.findByIdAndDelete(id);

    res.json({ success: true, message: 'Study session abandoned and removed' });
  } catch (error) {
    console.error('Error abandoning study session:', error);
    res.status(500).json({ message: 'Failed to abandon study session', error: error.message });
  }
};

// @desc  Get all study sessions
// @route GET /api/study-timer
// @access Private
export const getStudySessions = async (req, res) => {
  try {
    const {
      page      = 1,
      limit     = 10,
      status,
      subject,
      startDate,
      endDate,
      sort      = '-startTime',
    } = req.query;

    const query = { user: req.user._id };

    if (status)  query.status  = status;
    if (subject) query.subject = new RegExp(subject, 'i');

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate)   query.startTime.$lte = new Date(endDate);
    }

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const sessions = await StudySession.find(query).sort(sort).skip(skip).limit(limitNum);
    const total    = await StudySession.countDocuments(query);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    res.status(500).json({ message: 'Failed to fetch study sessions', error: error.message });
  }
};

// @desc  Get a single study session
// @route GET /api/study-timer/:id
// @access Private
export const getStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ success: true, data: studySession });
  } catch (error) {
    console.error('Error fetching study session:', error);
    res.status(500).json({ message: 'Failed to fetch study session', error: error.message });
  }
};

// @desc  Get study session statistics
// @route GET /api/study-timer/stats
// @access Private
export const getStudySessionStats = async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;

    const matchStage = { user: req.user._id, status: 'completed' };

    if (startDate || endDate) {
      matchStage.startTime = {};
      if (startDate) matchStage.startTime.$gte = new Date(startDate);
      if (endDate)   matchStage.startTime.$lte = new Date(endDate);
    }

    if (subject) matchStage.subject = new RegExp(subject, 'i');

    const stats = await StudySession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:                 null,
          totalSessions:       { $sum: 1 },
          totalDuration:       { $sum: '$duration' },
          totalPausedDuration: { $sum: '$pausedDuration' },
          totalActualDuration: { $sum: { $subtract: ['$duration', '$pausedDuration'] } },
          avgDuration:         { $avg: '$duration' },
          avgActualDuration:   { $avg: { $subtract: ['$duration', '$pausedDuration'] } },
          avgPomodoroCount:    { $avg: '$pomodoroCount' },
        },
      },
    ]);

    const dailyStats = await StudySession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year:  { $year:       '$startTime' },
            month: { $month:      '$startTime' },
            day:   { $dayOfMonth: '$startTime' },
          },
          sessions:            { $sum: 1 },
          totalDuration:       { $sum: '$duration' },
          totalActualDuration: { $sum: { $subtract: ['$duration', '$pausedDuration'] } },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 },
    ]);

    const subjectStats = await StudySession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:                 '$subject',
          sessions:            { $sum: 1 },
          totalDuration:       { $sum: '$duration' },
          totalActualDuration: { $sum: { $subtract: ['$duration', '$pausedDuration'] } },
        },
      },
      { $sort: { totalActualDuration: -1 } },
    ]);

    const modeStats = await StudySession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:           '$mode',
          sessions:      { $sum: 1 },
          totalDuration: { $sum: '$duration' },
        },
      },
    ]);

    const result = {
      overview: stats.length > 0 ? stats[0] : {
        totalSessions: 0, totalDuration: 0, totalPausedDuration: 0,
        totalActualDuration: 0, avgDuration: 0, avgActualDuration: 0, avgPomodoroCount: 0,
      },
      dailyBreakdown: dailyStats.map(s => ({
        date:                new Date(s._id.year, s._id.month - 1, s._id.day),
        sessions:            s.sessions,
        totalDuration:       s.totalDuration,
        totalActualDuration: s.totalActualDuration,
      })),
      subjectBreakdown: subjectStats.map(s => ({
        subject:             s._id,
        sessions:            s.sessions,
        totalDuration:       s.totalDuration,
        totalActualDuration: s.totalActualDuration,
      })),
      modeBreakdown: modeStats.map(s => ({
        mode:          s._id,
        sessions:      s.sessions,
        totalDuration: s.totalDuration,
      })),
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching study session stats:', error);
    res.status(500).json({ message: 'Failed to fetch study session statistics', error: error.message });
  }
};

// @desc  Delete a study session
// @route DELETE /api/study-timer/:id
// @access Private
export const deleteStudySession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid session ID' });
    }

    const studySession = await StudySession.findOne({ _id: id, user: req.user._id });

    if (!studySession) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    if (studySession.status === 'running') {
      return res.status(400).json({
        message: 'Cannot delete a running session. Please stop it first.',
      });
    }

    // ── Clockify: delete the entry if it exists ──────────────────────────────
    if (studySession.clockifyEntryId) {
      await safeClockify(
        () => deleteTimeEntry(studySession.clockifyEntryId),
        'deleteTimeEntry'
      );
    }

    await StudySession.findByIdAndDelete(id);
    res.json({ success: true, message: 'Study session deleted successfully' });
  } catch (error) {
    console.error('Error deleting study session:', error);
    res.status(500).json({ message: 'Failed to delete study session', error: error.message });
  }
};

// @desc  Get active (running OR paused) session
// @route GET /api/study-timer/active
// @access Private
export const getActiveSession = async (req, res) => {
  try {
    const activeSession = await StudySession.findOne({
      user:   req.user._id,
      status: { $in: ['running', 'paused'] },
    });

    if (!activeSession) {
      return res.json({ success: true, data: null, message: 'No active study session' });
    }

    res.json({ success: true, data: activeSession });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ message: 'Failed to fetch active study session', error: error.message });
  }
};

// @desc  Get Clockify time entries (external API data)
// @route GET /api/study-timer/clockify-entries
// @access Private
export const getClockifyEntries = async (req, res) => {
  try {
    const { page, pageSize, start, end } = req.query;
    const entries = await getTimeEntries({ page, pageSize, start, end });
    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching Clockify entries:', error);
    res.status(500).json({ message: 'Failed to fetch Clockify entries', error: error.message });
  }
};