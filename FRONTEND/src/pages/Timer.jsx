import { useState, useEffect, useRef } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { useTasks, TODAY } from '../components/TaskContext'; 
import {
  Brain, Coffee, Play, Pause, RotateCcw, SkipForward,
  X, Plus, ChevronDown, Save, Trash2
} from 'lucide-react';
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  stopStudySession,
  abandonStudySession,
  fetchStudySessions,
  fetchActiveSession,
  fetchStudySessionStats,
  deleteStudySession,
  formatDuration,
} from '../api/timerApi';

// ─── Mode config ──────────────────────────────────────────────────────────────
const defaultModeConfig = {
  work:  { label: 'Focus',       duration: 25 * 60, icon: Brain  },
  short: { label: 'Short Break', duration:  5 * 60, icon: Coffee },
  long:  { label: 'Long Break',  duration: 15 * 60, icon: Coffee },
};

const MODE_COLORS = {
  work:  { color: '#6366f1', glow: 'rgba(99,102,241,0.45)'  },
  short: { color: '#22c55e', glow: 'rgba(34,197,94,0.45)'   },
  long:  { color: '#06b6d4', glow: 'rgba(6,182,212,0.45)'   },
};

const SETTINGS_KEY = 'sf_settings';
const defaultTimerSettings = {
  focusDuration: '25', shortBreak: '5', longBreak: '15',
  sessionsBeforeLong: '4', autoStartBreaks: true, autoStartSessions: false,
  soundEnabled: true, notifyOnComplete: true,
};
const defaultNotifSettings = {
  taskReminders: true, breakReminders: true,
};

const parseTimerSettings = (payload) => ({
  focusDuration:      String(payload?.focusDuration      ?? payload?.timer?.focusDuration      ?? defaultTimerSettings.focusDuration),
  shortBreak:         String(payload?.shortBreak         ?? payload?.timer?.shortBreak         ?? defaultTimerSettings.shortBreak),
  longBreak:          String(payload?.longBreak          ?? payload?.timer?.longBreak          ?? defaultTimerSettings.longBreak),
  sessionsBeforeLong: String(payload?.sessionsBeforeLong ?? payload?.timer?.sessionsBeforeLong ?? defaultTimerSettings.sessionsBeforeLong),
  autoStartBreaks:    payload?.autoStartBreaks    ?? payload?.timer?.autoStartBreaks    ?? defaultTimerSettings.autoStartBreaks,
  autoStartSessions:  payload?.autoStartSessions  ?? payload?.timer?.autoStartSessions  ?? defaultTimerSettings.autoStartSessions,
  soundEnabled:       payload?.soundEnabled        ?? payload?.timer?.soundEnabled        ?? defaultTimerSettings.soundEnabled,
  notifyOnComplete:   payload?.notifyOnComplete    ?? payload?.timer?.notifyOnComplete    ?? defaultTimerSettings.notifyOnComplete,
  taskReminders:      payload?.taskReminders       ?? payload?.notifs?.taskReminders      ?? defaultNotifSettings.taskReminders,
  breakReminders:     payload?.breakReminders      ?? payload?.notifs?.breakReminders     ?? defaultNotifSettings.breakReminders,
});

const parseMinutes = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num * 60 : fallback;
};

const loadSavedTimerSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return parseTimerSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultTimerSettings;
  }
};

const buildModeConfig = (accentColor, accentGlow, settings) => {
  const s = settings || loadSavedTimerSettings();
  return {
    work: {
      ...defaultModeConfig.work,
      duration: parseMinutes(s.focusDuration, defaultModeConfig.work.duration),
      icon: Brain, color: accentColor, glow: accentGlow,
    },
    short: {
      ...defaultModeConfig.short,
      duration: parseMinutes(s.shortBreak, defaultModeConfig.short.duration),
      icon: Coffee, ...MODE_COLORS.short,
    },
    long: {
      ...defaultModeConfig.long,
      duration: parseMinutes(s.longBreak, defaultModeConfig.long.duration),
      icon: Coffee, ...MODE_COLORS.long,
    },
  };
};

// ─── Web Audio ────────────────────────────────────────────────────────────────
const createSound = (type) => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    const beep = (freq, start, dur, vol = 0.25) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gain);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    if (type === 'complete') { beep(523,0.0,0.25,0.3); beep(659,0.2,0.25,0.3); beep(784,0.4,0.45,0.35); }
    else if (type === 'start')  { beep(660,0.0,0.12,0.2); beep(880,0.15,0.18,0.2); }
    else if (type === 'pause')  { beep(440,0.0,0.15,0.15); }
    else if (type === 'resume') { beep(550,0.0,0.12,0.18); beep(660,0.12,0.15,0.18); }
  } catch (err) { console.warn('Audio not available:', err.message); }
};

const getTodayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

// ─── Study Timer ──────────────────────────────────────────────────────────────
export function StudyTimer() {
  const { colors, accent } = useAppearance();
  const accentGlow = `rgba(${accent.rgb},0.45)`;

  const { tasks: globalTasks, remove: removeTaskGlobal, addTask: addTaskGlobal, updateTask } = useTasks();
  const activeTasks = (globalTasks || []).filter(t => !t.done && t.status !== 'completed' && t.status !== 'done');

  const [timerSettings, setTimerSettings] = useState(loadSavedTimerSettings);
  const [modeConfig, setModeConfig] = useState(() =>
    buildModeConfig(accent.main, accentGlow, loadSavedTimerSettings())
  );

  const [sessionGoal, setSessionGoal] = useState(() => {
    const s = localStorage.getItem('studySessionGoal');
    return s ? parseInt(s, 10) : 8;
  });

  const [mode,           setMode]          = useState('work');
  const [timeLeft,       setTimeLeft]      = useState(() => buildModeConfig(accent.main, accentGlow).work.duration);
  const [running,        setRunning]       = useState(false);
  const [todayWorkCount, setTodayWorkCount] = useState(0);
  const [totalStats,     setTotalStats]    = useState({ totalSessions: 0, totalActualDuration: 0 });
  const [editingGoal,    setEditingGoal]   = useState(false);
  const [goalDraft,      setGoalDraft]     = useState(String(sessionGoal));
  const [selectedTask,   setSelectedTask]  = useState('');
  
  const [addingTask,     setAddingTask]    = useState(false);
  const [newTask,        setNewTask]       = useState('');
  const [soundEnabled,   setSoundEnabled]  = useState(() => loadSavedTimerSettings().soundEnabled);
  const [history,        setHistory]       = useState([]);
  const [statsOpen,      setStatsOpen]     = useState(false);
  const [activeSession,  setActiveSession] = useState(null);
  const [loading,        setLoading]       = useState(true);
  const [saving,         setSaving]        = useState(false);
  const [sessionNotes,   setSessionNotes]  = useState('');
  const [showAbandonPrompt, setShowAbandonPrompt] = useState(false);

  const intervalRef       = useRef(null);
  const savingRef         = useRef(false);
  const isCompletingRef   = useRef(false);
  const newTaskRef        = useRef(null);
  const goalRef           = useRef(null);
  const onCompleteRef     = useRef(null);
  const soundEnabledRef   = useRef(soundEnabled);
  const todayWorkCountRef = useRef(0);

  const config        = modeConfig[mode];
  const sessionLocked = !!activeSession;

  soundEnabledRef.current = soundEnabled;

  const playSound = (type) => { if (soundEnabledRef.current) createSound(type); };

  // ── Web Notifications ────────────────────────────────────────────────────────
  const showNotif = (title, body, tag) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(title, { body, tag, requireInteraction: false, silent: false });
        n.onclick = () => window.focus();
      }
    } catch (e) { console.error(e); }
  };

  const showSessionCompleteNotification = (fromMode, toMode) => {
    if (!timerSettings.notifyOnComplete) return;
    const names  = { work: 'Focus Session', short: 'Short Break', long: 'Long Break' };
    const emojis = { work: '🎯', short: '☕', long: '🌟' };
    showNotif(`${emojis[fromMode]} ${names[fromMode]} Complete`, `${names[toMode]} is ready.`, 'study-timer');
  };

  const showTaskReminder = () => {
    if (!timerSettings.taskReminders) return;
    showNotif('📚 Focus Session Started', `Working on: ${selectedTask || 'Study'}. Stay focused!`, 'task-reminder');
  };

  const showBreakReminder = () => {
    if (!timerSettings.breakReminders) return;
    showNotif('☕ Time to Recharge', "Take this time to rest and hydrate. You've earned it!", 'break-reminder');
  };

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('studySessionGoal', String(sessionGoal));
  }, [sessionGoal]);

  useEffect(() => {
    setSoundEnabled(timerSettings.soundEnabled);
  }, [timerSettings.soundEnabled]);

  // Set default selected task from global state if empty
  useEffect(() => {
    if (!selectedTask && activeTasks.length > 0 && !sessionLocked) {
      setSelectedTask(activeTasks[0].title);
    }
  }, [activeTasks, selectedTask, sessionLocked]);

  useEffect(() => {
    const needs = timerSettings.notifyOnComplete || timerSettings.taskReminders || timerSettings.breakReminders;
    if (needs && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, [timerSettings.notifyOnComplete, timerSettings.taskReminders, timerSettings.breakReminders]);

  useEffect(() => {
    const onUpdate = (e) => {
      const s = parseTimerSettings(e?.detail || loadSavedTimerSettings());
      setTimerSettings(s);
      setSoundEnabled(s.soundEnabled);
    };
    const onStorage = (e) => {
      if (e.key === SETTINGS_KEY) {
        const s = parseTimerSettings(e.newValue ? JSON.parse(e.newValue) : null);
        setTimerSettings(s);
        setSoundEnabled(s.soundEnabled);
      }
    };
    window.addEventListener('studyTimerSettingsUpdated', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('studyTimerSettingsUpdated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const next = buildModeConfig(accent.main, accentGlow, timerSettings);
    setModeConfig(next);
    if (!running && !activeSession) setTimeLeft(next[mode].duration);
  }, [timerSettings, mode, running, accent.main, accentGlow, activeSession]);

  useEffect(() => {
    setModeConfig(prev => ({
      ...prev,
      work: { ...prev.work, color: accent.main, glow: `rgba(${accent.rgb},0.45)` },
    }));
  }, [accent.main, accent.rgb]);

  // ── Responsive ring ──────────────────────────────────────────────────────────
  const [ringSize, setRingSize] = useState(260);
  const ringWrapRef = useRef(null);
  useEffect(() => {
    const measure = () => {
      if (ringWrapRef.current) setRingSize(Math.min(ringWrapRef.current.offsetWidth - 16, 300));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const radius     = (ringSize / 2) - 12;
  const circ       = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - timeLeft / config.duration);

  // ── Timer tick ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setTimeout(() => onCompleteRef.current?.(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // ── Load initial data ────────────────────────────────────────────────────────
  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const activeRes = await fetchActiveSession();
      if (activeRes.data) {
        const session        = activeRes.data;
        const sessionMode    = session.mode || 'work';
        const currentCfg     = buildModeConfig(accent.main, accentGlow, loadSavedTimerSettings());
        const targetDuration = currentCfg[sessionMode]?.duration || defaultModeConfig[sessionMode].duration;

        const now         = new Date();
        const wallElapsed = Math.floor((now - new Date(session.startTime)) / 1000);
        let pausedSoFar   = session.pausedDuration || 0;
        if (session.status === 'paused' && session.lastPausedAt) {
          pausedSoFar += Math.floor((now - new Date(session.lastPausedAt)) / 1000);
        }
        const actualElapsed = Math.max(0, wallElapsed - pausedSoFar);
        const remaining     = Math.max(0, targetDuration - actualElapsed);

        setMode(sessionMode);
        setActiveSession(session);
        setTimeLeft(remaining);
        setRunning(session.status === 'running');
        if (session.notes) setSessionNotes(session.notes);
        if (session.title) {
          setSelectedTask(session.title);
        }
      }

      const histRes = await fetchStudySessions({ limit: 10, status: 'completed' });
      if (histRes.data) {
        setHistory(histRes.data.map(s => ({
          label:    s.title,
          duration: formatDuration(Math.max(0, (s.duration || 0) - (s.pausedDuration || 0))),
          type:     s.mode === 'work' ? 'work' : 'break',
          time:     new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id:       s._id,
          mode:     s.mode,
        })));
      }

      const todayStart = getTodayStart();
      const todayRes = await fetchStudySessions({
        status: 'completed',
        mode: 'work',
        startDate: todayStart.toISOString(),
      });

      if (todayRes.data) {
        const count = todayRes.data.length;
        setTodayWorkCount(count);
        todayWorkCountRef.current = count;
      }

      const statsRes = await fetchStudySessionStats();
      if (statsRes.data) {
        setTotalStats({
          totalSessions:       statsRes.data.overview.totalSessions       || 0,
          totalActualDuration: statsRes.data.overview.totalActualDuration || 0,
        });
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  //Support explicit mode override for Auto-Start feature
  const handleStartSession = async (explicitMode, isAutoStart = false) => {
    if (!isAutoStart && (running || activeSession)) return;

    const targetMode = typeof explicitMode === 'string' ? explicitMode : mode;
    const targetConfig = modeConfig[targetMode];
    
    // Automatically generate names for breaks to avoid blank database entries
    let taskName = selectedTask.trim();
    if (!taskName) {
      taskName = `${targetConfig.label} Session`;
    }

    const targetDuration = targetConfig.duration;

    setTimeLeft(targetDuration);
    setRunning(true); 
    playSound('start');
    
    try {
      const matchingTask = globalTasks.find(t => t.title === taskName);
      const subject = matchingTask ? matchingTask.subject : 'General';
      
      const res = await startStudySession({ title: taskName, subject, mode: targetMode, notes: '' });
      
      const sessionData = res?.data || res;
      if (sessionData && (sessionData._id || sessionData.id)) {
        setActiveSession(sessionData);
        
        if (targetMode === 'work') showTaskReminder();
        else if (targetMode === 'long') showBreakReminder();
      }
    } catch (err) {
      console.error('Error starting session:', err);
      
      if (err?.response?.status === 400 && err?.response?.data?.existingSession) {
        try {
          const ghostSessionId = err.response.data.existingSession._id;
          await abandonStudySession(ghostSessionId); 

          const matchingTask = globalTasks.find(t => t.title === taskName);
          const subject = matchingTask ? matchingTask.subject : 'General';
          
          const retryRes = await startStudySession({ title: taskName, subject, mode: targetMode, notes: '' });
          
          const sessionData = retryRes?.data || retryRes;
          if (sessionData && (sessionData._id || sessionData.id)) {
            setActiveSession(sessionData);
            if (targetMode === 'work') showTaskReminder();
            else if (targetMode === 'long') showBreakReminder();
            return;
          }
        } catch (retryErr) {
          console.error('Failed to retry starting session:', retryErr);
        }
      }

      setRunning(false); 
      setTimeLeft(targetDuration);
      alert('Failed to connect to the backend. Please check your network or server.');
    }
  };

  // ── Pause ────────────────────────────────────────────────────────────────────
  const handlePauseSession = async () => {
    setRunning(false);
    playSound('pause');
    
    if (!activeSession) return; 
   
    try {
      const res = await pauseStudySession(activeSession._id);
      setActiveSession(res.data);
    } catch (err) {
      setRunning(true);
      console.error('Error pausing session:', err);
    }
  };

  // ── Resume ───────────────────────────────────────────────────────────────────
  const handleResumeSession = async () => {
    if (!activeSession) return;
    setRunning(true);
    playSound('resume');
    
    try {
      const res = await resumeStudySession(activeSession._id);
      const sessionData = res?.data || res;
      if (sessionData && sessionData._id) {
        setActiveSession(sessionData);
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      setRunning(false);
      alert('Failed to resume. Your session might be out of sync with the server.');
    }
  };

  // ── Stop/Save ────────────────────────────────────────────────────────────────
  const handleStopSession = async (silent = false) => {
     if (savingRef.current || !activeSession) return null;
    savingRef.current = true;
    setSaving(true);

    const sessionId   = activeSession._id;
    const sessionMode = activeSession.mode || mode;
    setActiveSession(null);
    setRunning(false);
    setTimeLeft(modeConfig[sessionMode]?.duration || config.duration);
    setSessionNotes('');

    try {
      const res     = await stopStudySession(sessionId, sessionNotes);
      const stopped = res.data;

      setHistory(prev => [{
        label:    stopped.title,
        duration: formatDuration(Math.max(0, (stopped.duration || 0) - (stopped.pausedDuration || 0))),
        type:     stopped.mode === 'work' ? 'work' : 'break',
        time:     new Date(stopped.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id:       stopped._id,
        mode:     stopped.mode,
      }, ...prev].slice(0, 10));

      if (sessionMode === 'work') {
        const newCount = todayWorkCountRef.current + 1;
        todayWorkCountRef.current = newCount;
        setTodayWorkCount(newCount);
      }

      setTotalStats(prev => ({
        totalSessions:       prev.totalSessions + 1,
        totalActualDuration: prev.totalActualDuration +
          Math.max(0, (stopped.duration || 0) - (stopped.pausedDuration || 0)),
      }));

      return stopped;
    } catch (err) {
      console.error('Error stopping session:', err);
      if (!silent) alert('Failed to stop session. Please try again.');
      return null;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ── Session complete (timer hits 0) ──────────────────────────────────────────
  const handleSessionComplete = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    try {
      playSound('complete');
      const currentMode = activeSession?.mode || mode;
      const finishedTaskTitle = activeSession?.title || selectedTask;
      
      if (activeSession) {
        await handleStopSession(true);
      }

      const currentFinishedFocusCount = todayWorkCountRef.current; 
      let nextMode;

      if (currentMode === 'work') {
        if (finishedTaskTitle) {
          const matchingTask = globalTasks.find(t => t.title === finishedTaskTitle);
          if (matchingTask && !matchingTask.done && updateTask) {
            updateTask(matchingTask.id, { done: true });
          }
        }

        const sessionsBeforeLong = Number(timerSettings.sessionsBeforeLong) || 4;
        
        if (currentFinishedFocusCount > 0 && currentFinishedFocusCount % sessionsBeforeLong === 0) {
          nextMode = 'long';
          setTimeout(() => showBreakReminder(), 500);
        } else {
          nextMode = 'short';
        }
      } else {
        nextMode = 'work';
      }

      setMode(nextMode);
      setTimeLeft(modeConfig[nextMode].duration);
      setRunning(false);

      showSessionCompleteNotification(currentMode, nextMode);

      const shouldAutoStart = 
        (currentMode === 'work' && timerSettings.autoStartBreaks) || 
        (currentMode !== 'work' && timerSettings.autoStartSessions);

      if (shouldAutoStart) {
        setTimeout(() => {
          handleStartSession(nextMode, true); 
        }, 1000); 
      }

    } finally {
      isCompletingRef.current = false;
    }
  };
  onCompleteRef.current = handleSessionComplete;

  // ── Abandon ──────────────────────────────────────────────────────────────────
  const handleAbandonSession = () => {
    if (!activeSession) return;
    setShowAbandonPrompt(true);
  };

  const executeAbandonSession = async () => {
    if (!activeSession) return;
    const sessionId = activeSession._id;
    setRunning(false);
    setActiveSession(null);
    setTimeLeft(config.duration);
    setSessionNotes('');
    setShowAbandonPrompt(false);
    try { await abandonStudySession(sessionId); } catch (err) { console.error(err); }
  };

  // ── Delete History ──────────────────────────────────────────────────────────
  const executeDeleteSession = async (sessionItem) => {
    if (!sessionItem) return;
    const targetId = sessionItem.id || sessionItem._id;
    setHistory(prev => prev.filter(item => (item.id || item._id) !== targetId));
    if (sessionItem.mode === 'work') {
      setTotalStats(prev => ({
        ...prev,
        totalSessions: Math.max(0, prev.totalSessions - 1),
      }));
    }
    if (targetId) {
      try {
        await deleteStudySession(targetId);
      } catch (err) { 
        console.error('Failed to delete in backend:', err); 
      }
    }
  };

  // ── Mode switch ───────────────────────────────────────────────────────────────
  const switchMode = (m) => {
    if (running && activeSession) { handleAbandonSession(); return; }
    setMode(m);
    setTimeLeft(modeConfig[m].duration);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    if (activeSession) handleAbandonSession();
    else setTimeLeft(config.duration);
  };

  // ── Skip ─────────────────────────────────────────────────────────────────────
  const skip = () => switchMode({ work: 'short', short: 'work', long: 'work' }[mode]);

  // ── Task management (SYNCED WITH GLOBAL DB) ──────────────────────────────────
  const handleAddTaskItem = () => {
    const t = newTask.trim();
    if (!t) { setAddingTask(false); return; }
    
    const fallbackDate = typeof TODAY !== 'undefined' ? TODAY : new Date().toISOString().split('T')[0];
    addTaskGlobal({
      title: t,
      subject: 'Others',
      date: fallbackDate,
      startTime: '09:00',
      endTime: '10:00',
      priority: 'medium'
    });
    
    setNewTask('');
    setAddingTask(false);
    setSelectedTask(t);
  };

  const openGoalEdit = () => {
    setGoalDraft(String(sessionGoal));
    setEditingGoal(true);
    setTimeout(() => goalRef.current?.select(), 0);
  };

  const commitGoal = () => {
    const n = parseInt(goalDraft, 10);
    if (!isNaN(n) && n >= 1 && n <= 20) setSessionGoal(n);
    setEditingGoal(false);
  };

  const displayMins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const displaySecs = String(timeLeft % 60).padStart(2, '0');
  const ModeIcon    = config.icon;

  const statRows = [
    { label: 'Focus Sessions Today', value: todayWorkCount.toString(),                      color: accent.main  },
    { label: 'Total Focus Time',     value: formatDuration(totalStats.totalActualDuration), color: '#22c55e'    },
    { label: 'All-time Sessions',    value: totalStats.totalSessions.toString(),             color: '#06b6d4'    },
    { label: 'Current Session',
      value: activeSession ? (running ? 'Running' : 'Paused') : 'Idle',
      color: activeSession ? (running ? '#22c55e' : '#f97316') : '#94a3b8' },
  ];

  return (
    <div className="min-h-full" style={{ background: colors.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:max-w-5xl lg:px-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `rgba(${accent.rgb},0.12)`, border: `1px solid rgba(${accent.rgb},0.2)` }}>
              <Brain className="w-5 h-5" style={{ color: accent.main }} />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Study Timer</h1>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Pomodoro-style focus sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Focus', key: 'focusDuration', icon: Brain, color: accent.main, bgColor: `rgba(${accent.rgb},0.1)`, borderColor: `rgba(${accent.rgb},0.2)` },
              { label: 'Short Break', key: 'shortBreak', icon: Coffee, color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' },
              { label: 'Long Break', key: 'longBreak', icon: Coffee, color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.2)' },
            ].map(t => {
              const Icon = t.icon;
              const saveSettings = (updated) => {
                if (sessionLocked) return;
                setTimerSettings(updated);
                const payload = { profile: {}, timer: updated, notifs: {} };
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
                window.dispatchEvent(new CustomEvent('studyTimerSettingsUpdated', { detail: payload }));
                setModeConfig(buildModeConfig(accent.main, accentGlow, updated));
              };
              return (
                <div
                  key={t.key}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg"
                  style={{
                    background: t.bgColor,
                    border: `1px solid ${t.borderColor}`,
                    opacity: sessionLocked ? 0.65 : 1,
                  }}>
                  <Icon className="w-3 h-3 flex-shrink-0" style={{ color: t.color }} />
                  <button onClick={() => {
                    const newVal = Math.max(1, Number(timerSettings[t.key]) - 1);
                    saveSettings({ ...timerSettings, [t.key]: String(newVal) });
                  }} className="w-5 h-5 rounded flex items-center justify-center hover:opacity-70" style={{ color: t.color, fontSize: '12px', fontWeight: 700 }}>−</button>
                  <input type="number" min="1" max="120" className="w-8 bg-transparent border-none outline-none text-center text-xs disabled:cursor-not-allowed" 
                    style={{ color: t.color, fontWeight: 700 }}
                    value={timerSettings[t.key]} 
                    disabled={sessionLocked}
                    onChange={e => {
  const val = e.target.value;
  if (val === '') {
    saveSettings({ ...timerSettings, [t.key]: '' });
    return;
  }
  const num = Number(val);
  if (Number.isFinite(num) && num > 0) {
    saveSettings({ ...timerSettings, [t.key]: val });
  }
}} />
                  <button onClick={() => {
                    const newVal = Number(timerSettings[t.key]) + 1;
                    saveSettings({ ...timerSettings, [t.key]: String(newVal) });
                  }} className="w-5 h-5 rounded flex items-center justify-center hover:opacity-70" style={{ color: t.color, fontSize: '12px', fontWeight: 700 }}>+</button>
                  <span className="text-xs ml-1" style={{ color: t.color, fontWeight: 600, whiteSpace: 'nowrap' }}>min</span>
                </div>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="mb-6 p-4 rounded-2xl text-center" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="text-sm" style={{ color: colors.textMuted }}>Loading timer data...</div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT: timer */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">

            <div className="p-1.5 rounded-2xl flex gap-1.5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              {Object.keys(modeConfig).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 truncate px-1"
                  style={mode === m
                    ? { background: modeConfig[m].color, color: '#fff', fontWeight: 700, boxShadow: `0 0 18px ${modeConfig[m].glow}` }
                    : { color: colors.textMuted, fontWeight: 500 }}>
                  {modeConfig[m].label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl p-5 sm:p-8 flex flex-col items-center" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>

              <div ref={ringWrapRef} className="w-full flex items-center justify-center" style={{ maxWidth: 312 }}>
                <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${config.glow.replace('0.45','0.07')} 0%, transparent 72%)` }} />
                  <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                    <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={colors.border} strokeWidth={10} />
                    <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={config.color} strokeWidth={10}
                      strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${config.glow})` }} />
                  </svg>
                  <div className="relative z-10 text-center select-none">
                    <div className="tabular-nums"
                      style={{ fontSize: Math.max(ringSize * 0.22, 40), fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, color: colors.text }}>
                      {displayMins}:{displaySecs}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <ModeIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      <span className="text-sm" style={{ color: config.color, fontWeight: 600 }}>{config.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task selector using GLOBAL tasks */}
              <div className="w-full mt-6 mb-3" style={{ maxWidth: 320 }}>
                <p className="text-xs mb-2 text-center" style={{ fontWeight: 500, color: colors.textMuted }}>
                  Currently working on
                </p>
                <select
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-center"
                  style={{
                    background:   colors.card2,
                    border:       `1px solid ${sessionLocked ? `rgba(${accent.rgb},0.3)` : colors.border}`,
                    color:        sessionLocked ? colors.textMuted : colors.text,
                    colorScheme:  colors.inputScheme,
                    cursor:       sessionLocked ? 'not-allowed' : 'pointer',
                    opacity:      sessionLocked ? 0.75 : 1,
                  }}
                  value={sessionLocked ? (activeSession?.title || selectedTask) : selectedTask}
                  onChange={e => setSelectedTask(e.target.value)}
                  disabled={sessionLocked}>
                  
                  {!sessionLocked && activeTasks.length === 0 && <option value="">Add a task first</option>}
                  
                  {sessionLocked && (
                    <option value={activeSession?.title || selectedTask}>{activeSession?.title || selectedTask}</option>
                  )}

                  {!sessionLocked && activeTasks.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                </select>
                {sessionLocked && (
                  <p className="text-xs text-center mt-1" style={{ color: colors.textMuted }}>
                    Task locked during active session
                  </p>
                )}
              </div>

              {activeSession && (
                <div className="w-full mb-5" style={{ maxWidth: 320 }}>
                  <p className="text-xs mb-2 text-center" style={{ fontWeight: 500, color: colors.textMuted }}>
                    Session notes
                  </p>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme }}
                    value={sessionNotes}
                    onChange={e => setSessionNotes(e.target.value)}
                    placeholder="Add notes about this session..."
                    rows={2} />
                </div>
              )}

              <div className="flex items-center justify-center gap-4">
                <button onClick={reset}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <RotateCcw className="w-5 h-5" />
                </button>

                {!activeSession && !running ? (
                  <button onClick={() => handleStartSession(mode)}
                    disabled={loading || !selectedTask || selectedTask.trim() === ''}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${(!selectedTask || selectedTask.trim() === '') ? 'opacity-50 cursor-not-allowed' : 'text-white hover:scale-105 active:scale-95'}`}
                    style={{ 
                      background: (!selectedTask || selectedTask.trim() === '') ? colors.card2 : `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, 
                      border: (!selectedTask || selectedTask.trim() === '') ? `2px dashed ${colors.border}` : 'none',
                      color: (!selectedTask || selectedTask.trim() === '') ? colors.textMuted : '#fff',
                      boxShadow: (!selectedTask || selectedTask.trim() === '') ? 'none' : `0 0 32px ${config.glow}, 0 8px 24px rgba(0,0,0,0.25)` 
                    }}>
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                ) : running ? (
                  <button onClick={handlePauseSession}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, boxShadow: `0 0 32px ${config.glow}, 0 8px 24px rgba(0,0,0,0.25)` }}>
                    <Pause className="w-8 h-8" />
                  </button>
                ) : (
                  <button onClick={handleResumeSession}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, boxShadow: `0 0 32px ${config.glow}, 0 8px 24px rgba(0,0,0,0.25)` }}>
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                )}

                <button onClick={skip}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {activeSession && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={() => handleStopSession(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:scale-105 active:scale-95"
                    style={{ background: `rgba(${accent.rgb},0.1)`, border: `1px solid ${accent.main}`, color: accent.light }}
                    disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save & Stop'}
                  </button>
                  <button
                    onClick={handleAbandonSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:scale-105 active:scale-95"
                    style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                    <X className="w-4 h-4" />
                    Abandon
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <div>
                <div className="text-sm" style={{ fontWeight: 600, color: colors.text }}>
                  {todayWorkCount >= sessionGoal ? (
                    <span style={{ color: '#22c55e' }}>🎉 Daily goal reached! ({todayWorkCount}/{sessionGoal})</span>
                  ) : mode !== 'work' ? (
                    <span style={{ color: config.color, fontWeight: 700 }}>☕ Taking a {config.label.toLowerCase()}...</span>
                  ) : (
                    <>
                      Session {todayWorkCount + 1} of{' '}
                      {editingGoal ? (
                        <input
                          ref={goalRef}
                          type="number" min={1} max={20}
                          value={goalDraft}
                          onChange={e => setGoalDraft(e.target.value)}
                          onBlur={commitGoal}
                          onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                          className="w-10 text-center rounded outline-none text-sm"
                          style={{ background: `rgba(${accent.rgb},0.1)`, border: `1px solid ${accent.main}`, color: accent.main }} />
                      ) : (
                        <button onClick={openGoalEdit} className="hover:underline" style={{ color: accent.main }}>
                          {sessionGoal}
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
  Long break every {timerSettings.sessionsBeforeLong} Focus sessions
</div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: Math.min(sessionGoal, 12) }).map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{
                      width:        i < todayWorkCount ? 24 : 10,
                      height:       10,
                      background:   i < todayWorkCount ? accent.main : colors.border,
                      boxShadow:    i < todayWorkCount ? `0 0 8px rgba(${accent.rgb},0.5)` : 'none',
                      borderRadius: 5,
                    }} />
                ))}
                {sessionGoal > 12 && (
                  <span className="text-xs" style={{ color: colors.textMuted }}>+{sessionGoal - 12}</span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: stats + tasks + history */}
          <div className="flex flex-col gap-4 lg:w-72 xl:w-80 shrink-0">

            <div className="rounded-2xl overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setStatsOpen(v => !v)}>
                <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Stats</h3>
                <ChevronDown className="w-4 h-4 lg:hidden transition-transform duration-200"
                  style={{ color: colors.textMuted, transform: statsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              <div className={`lg:block ${statsOpen ? 'block' : 'hidden'}`}>
                <div className="flex flex-col gap-2 px-5 pb-5">
                  {statRows.map(s => (
                    <div key={s.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: colors.card2 }}>
                      <span className="text-xs" style={{ color: colors.textMuted }}>{s.label}</span>
                      <span className="text-sm" style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🌟 GLOBAL STUDY TASKS */}
            <div className="rounded-2xl p-5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Study Tasks</h3>
                <button
                  onClick={() => { if (!sessionLocked) { setAddingTask(true); setTimeout(() => newTaskRef.current?.focus(), 0); } }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                  style={{
                    background: `rgba(${accent.rgb},${sessionLocked ? 0.04 : 0.1})`,
                    color:      sessionLocked ? colors.textMuted : accent.light,
                    fontWeight: 600,
                    cursor:     sessionLocked ? 'not-allowed' : 'pointer',
                  }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {activeTasks.map((task) => (
                  <div key={task.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl group transition-colors"
                    style={{
                      background: selectedTask === task.title ? `rgba(${accent.rgb},0.1)` : 'transparent',
                      border:     `1px solid ${selectedTask === task.title ? `rgba(${accent.rgb},0.2)` : 'transparent'}`,
                    }}>
                    <button
                      onClick={() => !sessionLocked && setSelectedTask(task.title)}
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: selectedTask === task.title ? accent.main : colors.border,
                        border:     `1px solid ${selectedTask === task.title ? accent.main : colors.textMuted}`,
                      }} />
                    
                    <span
                      className="flex-1 text-xs truncate"
                      style={{
                        color:      selectedTask === task.title ? colors.text : colors.textMuted,
                        fontWeight: selectedTask === task.title ? 600 : 400,
                        cursor:     sessionLocked ? 'default' : 'pointer',
                      }}
                      onClick={() => !sessionLocked && setSelectedTask(task.title)}>
                      {task.title}
                    </span>
                    
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => !sessionLocked && removeTaskGlobal(task.id)}
                        className="hover:text-red-400"
                        style={{ color: colors.textMuted }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {addingTask && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `rgba(${accent.rgb},0.08)` }}>
                    <input
                      ref={newTaskRef}
                      value={newTask}
                      onChange={e => setNewTask(e.target.value)}
                      onBlur={handleAddTaskItem}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddTaskItem(); if (e.key === 'Escape') setAddingTask(false); }}
                      className="flex-1 bg-transparent text-xs outline-none"
                      style={{ color: colors.text }}
                      placeholder="New task..." />
                  </div>
                )}
                
                {activeTasks.length === 0 && !addingTask && (
                  <div className="text-center py-3">
                    <span className="text-xs" style={{ color: colors.textMuted }}>No tasks yet — add one above</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 className="text-sm mb-3" style={{ fontWeight: 700, color: colors.text }}>Session History</h3>
              <div className="flex flex-col gap-2">
                {history.slice(0, 10).map((h, i) => (
                  <div key={h.id || i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                    style={{ background: colors.card2 }}>
                    <div className="w-2 h-2 rounded-full shrink-0"
  style={{ background: h.mode === 'work' ? accent.main : (h.mode === 'long' ? '#06b6d4' : '#22c55e') }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate block" style={{ color: colors.text, fontWeight: 500 }}>
                        {h.label}
                      </span>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: colors.textMuted }}>{h.duration}</span>
                    <span className="text-xs shrink-0" style={{ color: colors.textMuted }}>{h.time}</span>
                    
                    <button
                      onClick={() => executeDeleteSession(h)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                      style={{ color: colors.textMuted }}>
                      <X className="w-3 h-3" />
                    </button>
                    
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-4">
                    <span className="text-xs" style={{ color: colors.textMuted }}>No completed sessions yet</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 1. Abandon Session Modal */}
      {showAbandonPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAbandonPrompt(false)}>
          
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 text-center transform transition-all"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <X className="w-8 h-8" style={{ color: '#ef4444' }} />
            </div>
            
            <div>
              <h3 className="text-lg mb-1.5" style={{ fontWeight: 700, color: colors.text }}>Abandon Session?</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                Are you sure you want to abandon this session? It will not be saved to your history.
              </p>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowAbandonPrompt(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: colors.card2, color: colors.textSub, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={executeAbandonSession} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ef4444', fontWeight: 600, boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)' }}>
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
