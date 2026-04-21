import express from 'express';
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  stopStudySession,
  abandonStudySession,       // ← ADDED
  getStudySessions,
  getStudySession,
  getStudySessionStats,
  deleteStudySession,
  getActiveSession,
  getClockifyEntries,
} from '../controllers/timerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/active',           getActiveSession);
router.get('/stats',            getStudySessionStats);
router.get('/clockify-entries', getClockifyEntries);
router.get('/',                 getStudySessions);
router.get('/:id',              getStudySession);

router.post  ('/start',          startStudySession);
router.patch ('/:id/pause',      pauseStudySession);
router.patch ('/:id/resume',     resumeStudySession);
router.patch ('/:id/stop',       stopStudySession);
router.patch ('/:id/abandon',    abandonStudySession);   // ← ADDED
router.delete('/:id',            deleteStudySession);

export default router;