import { useState, useEffect, useRef } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  Brain, Coffee, Check, Pencil, Play, Pause, RotateCcw, SkipForward,
  Volume2, VolumeX, Settings, X, Plus, ChevronDown, ChevronUp,
  Trash2, Save
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
  formatDuration
} from '../api/timerApi';

// ─── Default mode config (durations only — colors set dynamically) ────────────
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
  taskReminders: true, breakReminders: true, dailyDigest: false,
  achievementAlerts: true, streakWarning: true, weeklyReport: true,
  emailNotifs: false, soundAlerts: true,
};

const parseTimerSettings = (payload) => ({
  focusDuration: String(payload?.focusDuration || payload?.timer?.focusDuration || defaultTimerSettings.focusDuration),
  shortBreak: String(payload?.shortBreak || payload?.timer?.shortBreak || defaultTimerSettings.shortBreak),
  longBreak: String(payload?.longBreak || payload?.timer?.longBreak || defaultTimerSettings.longBreak),
  sessionsBeforeLong: String(payload?.sessionsBeforeLong || payload?.timer?.sessionsBeforeLong || defaultTimerSettings.sessionsBeforeLong),
  autoStartBreaks: payload?.autoStartBreaks ?? payload?.timer?.autoStartBreaks ?? defaultTimerSettings.autoStartBreaks,
  autoStartSessions: payload?.autoStartSessions ?? payload?.timer?.autoStartSessions ?? defaultTimerSettings.autoStartSessions,
  soundEnabled: payload?.soundEnabled ?? payload?.timer?.soundEnabled ?? defaultTimerSettings.soundEnabled,
  notifyOnComplete: payload?.notifyOnComplete ?? payload?.timer?.notifyOnComplete ?? defaultTimerSettings.notifyOnComplete,
  taskReminders: payload?.taskReminders ?? payload?.notifs?.taskReminders ?? defaultNotifSettings.taskReminders,
  breakReminders: payload?.breakReminders ?? payload?.notifs?.breakReminders ?? defaultNotifSettings.breakReminders,
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

const loadModeConfig = (accentColor, accentGlow, timerSettings = null) => {
  const settings = timerSettings || loadSavedTimerSettings();

  const saved = localStorage.getItem('studyModeConfig');
  const base  = saved ? JSON.parse(saved) : {};
  const workDuration  = parseMinutes(settings.focusDuration, base.work?.duration || defaultModeConfig.work.duration);
  const shortDuration = parseMinutes(settings.shortBreak,   base.short?.duration || defaultModeConfig.short.duration);
  const longDuration  = parseMinutes(settings.longBreak,    base.long?.duration || defaultModeConfig.long.duration);

  return {
    work: {
      ...defaultModeConfig.work,
      ...(base.work  || {}),
      duration: workDuration,
      icon:  Brain,
      color: accentColor,
      glow:  accentGlow,
    },
    short: {
      ...defaultModeConfig.short,
      ...(base.short || {}),
      duration: shortDuration,
      icon:  Coffee,
      ...MODE_COLORS.short,
    },
    long: {
      ...defaultModeConfig.long,
      ...(base.long  || {}),
      duration: longDuration,
      icon:  Coffee,
      ...MODE_COLORS.long,
    },
  };
};


// ─── Timer mode labels are still stored locally, but durations are controlled by Settings only ───

// ─── Web Audio: generates sounds without any external files ──────────────────
const createSound = (type) => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const beep = (freq, start, duration, vol = 0.25) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.connect(gain);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };

    if (type === 'complete') {
      // Ascending 3-note chime
      beep(523, 0.0, 0.25, 0.3);   // C5
      beep(659, 0.2, 0.25, 0.3);   // E5
      beep(784, 0.4, 0.45, 0.35);  // G5
    } else if (type === 'start') {
      beep(660, 0.0, 0.12, 0.2);
      beep(880, 0.15, 0.18, 0.2);
    } else if (type === 'pause') {
      beep(440, 0.0, 0.15, 0.15);
    } else if (type === 'resume') {
      beep(550, 0.0, 0.12, 0.18);
      beep(660, 0.12, 0.15, 0.18);
    }
  } catch (err) {
    console.warn('Audio not available:', err.message);
  }
};


// ─── Study Timer Page ─────────────────────────────────────────────────────────
export function StudyTimer() {
  const { colors, accent } = useAppearance();
  const accentGlow = `rgba(${accent.rgb},0.45)`;

  const [timerSettings, setTimerSettings] = useState(loadSavedTimerSettings);

  // ── modeConfig: loaded from localStorage, colors injected fresh each time ──
  const [modeConfig, setModeConfig] = useState(() =>
    loadModeConfig(accent.main, accentGlow, loadSavedTimerSettings())
  );

  // ── sessionGoal: persisted to localStorage ──────────────────────────────────
  const [sessionGoal, setSessionGoal] = useState(() => {
    const saved = localStorage.getItem('studySessionGoal');
    return saved ? parseInt(saved, 10) : 8;
  });

  const [mode,           setMode]          = useState('work');
  const [timeLeft,       setTimeLeft]      = useState(() => loadModeConfig(accent.main, accentGlow).work.duration);
  const [running,        setRunning]       = useState(false);
  const [sessions,       setSessions]      = useState(0);
  const [editingGoal,    setEditingGoal]   = useState(false);
  const [goalDraft,      setGoalDraft]     = useState(String(sessionGoal));
  const [selectedTask,   setSelectedTask]  = useState('');
  const [tasks,          setTasks]         = useState([]);
  const [addingTask,     setAddingTask]    = useState(false);
  const [newTask,        setNewTask]       = useState('');
  const [editingTaskIdx, setEditingTaskIdx] = useState(null);
  const [editingTaskVal, setEditingTaskVal] = useState('');
  const [soundEnabled,   setSoundEnabled]  = useState(() => loadSavedTimerSettings().soundEnabled);
  const [history,        setHistory]       = useState([]);
  const [settingsOpen,   setSettingsOpen]  = useState(false);
  const [statsOpen,      setStatsOpen]     = useState(false);
  const [activeSession,  setActiveSession] = useState(null);
  const [loading,        setLoading]       = useState(true);
  const [saving,         setSaving]        = useState(false);
  const [sessionNotes,   setSessionNotes]  = useState('');

  const intervalRef   = useRef(null);
  const newTaskRef    = useRef(null);
  const goalRef       = useRef(null);
  const onCompleteRef = useRef(null);
  // Keep soundEnabled accessible inside intervals without stale closure
  const soundEnabledRef = useRef(soundEnabled);

  const config = modeConfig[mode];

  // ── Keep soundEnabledRef in sync ──────────────────────────────────────────
  soundEnabledRef.current = soundEnabled;

  const playSound = (type) => {
    if (soundEnabledRef.current) createSound(type);
  };

  // ── Show notification when session completes ──────────────────────────────
  const showSessionCompleteNotification = (sessionMode, nextMode) => {
    if (!timerSettings.notifyOnComplete) return;
    if (!('Notification' in window)) return;

    const modeNames = { work: 'Focus Session', short: 'Short Break', long: 'Long Break' };
    const modeEmojis = { work: '🎯', short: '☕', long: '🌟' };
    
    const sessionModeLabel = modeNames[sessionMode] || 'Session';
    const title = `${modeEmojis[sessionMode] || '✓'} ${sessionModeLabel} Complete`;
    const body = `${modeNames[nextMode]} is ready to begin.`;

    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          tag: 'study-timer',
          requireInteraction: false,
          silent: false,
        });
        notification.onclick = () => window.focus();
      } else {
        console.warn('Notification permission not granted');
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  // ── Show task reminder when starting a focus session ──────────────────────
  const showTaskReminder = () => {
    if (!timerSettings.taskReminders) return;
    if (!('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
        const taskName = selectedTask || 'Study';
        const notification = new Notification('📚 Focus Session Started', {
          body: `Working on: ${taskName}. Stay focused!`,
          tag: 'task-reminder',
          requireInteraction: false,
          silent: false,
        });
        notification.onclick = () => window.focus();
      }
    } catch (error) {
      console.error('Error showing task reminder:', error);
    }
  };

  // ── Show break reminder when on a long break ──────────────────────────────
  const showBreakReminder = () => {
    if (!timerSettings.breakReminders) return;
    if (!('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification('☕ Time to Recharge', {
          body: 'Take this time to rest and hydrate. You\'ve earned it!',
          tag: 'break-reminder',
          requireInteraction: false,
          silent: false,
        });
        notification.onclick = () => window.focus();
      }
    } catch (error) {
      console.error('Error showing break reminder:', error);
    }
  };

  // ── Persist sessionGoal ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('studySessionGoal', String(sessionGoal));
  }, [sessionGoal]);

  // ── Sync soundEnabled from timerSettings ─────────────────────────────────
  useEffect(() => {
    setSoundEnabled(timerSettings.soundEnabled);
  }, [timerSettings.soundEnabled]);

  // ── Request notification permissions when any notification setting is enabled ─
  useEffect(() => {
    const needsPermission = timerSettings.notifyOnComplete || timerSettings.taskReminders || timerSettings.breakReminders;
    if (needsPermission && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              console.log('Notification permission granted');
            }
          })
          .catch(error => console.error('Error requesting notification permission:', error));
      }
    }
  }, [timerSettings.notifyOnComplete, timerSettings.taskReminders, timerSettings.breakReminders]);

  // ── Listen for settings updates from the Settings page ────────────────────
  useEffect(() => {
    const handleTimerSettingsUpdated = (event) => {
      const nextSettings = parseTimerSettings(event?.detail || loadSavedTimerSettings());
      setTimerSettings(nextSettings);
      setSoundEnabled(nextSettings.soundEnabled);
    };

    const handleStorageChange = (event) => {
      if (event.key === SETTINGS_KEY) {
        const nextSettings = parseTimerSettings(event.newValue ? JSON.parse(event.newValue) : null);
        setTimerSettings(nextSettings);
        setSoundEnabled(nextSettings.soundEnabled);
      }
    };

    window.addEventListener('studyTimerSettingsUpdated', handleTimerSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('studyTimerSettingsUpdated', handleTimerSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ── Apply saved timer settings into current timer state ────────────────────
  useEffect(() => {
    const newModeConfig = loadModeConfig(accent.main, accentGlow, timerSettings);
    setModeConfig(newModeConfig);

    if (!running) {
      setTimeLeft(newModeConfig[mode].duration);
    }
  }, [timerSettings, mode, running, accent.main, accentGlow]);

  // ── Sync work mode color with accent ─────────────────────────────────────
  useEffect(() => {
    setModeConfig(prev => ({
      ...prev,
      work: { ...prev.work, color: accent.main, glow: `rgba(${accent.rgb},0.45)` },
    }));
  }, [accent.main, accent.rgb]);

  // ── Responsive ring ───────────────────────────────────────────────────────
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

  const radius       = (ringSize / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference * (1 - timeLeft / config.duration);

  // ── Timer tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
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

  // ── Load initial data ─────────────────────────────────────────────────────
  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const activeResponse = await fetchActiveSession();
      if (activeResponse.data) {
        setActiveSession(activeResponse.data);
        const elapsed   = Math.floor((new Date() - new Date(activeResponse.data.startTime)) / 1000);
        const remaining = Math.max(0, config.duration - elapsed + activeResponse.data.pausedDuration);
        setTimeLeft(remaining);
        setRunning(activeResponse.data.status === 'running');
      }

      const sessionsResponse = await fetchStudySessions({ limit: 10, status: 'completed' });
      if (sessionsResponse.data) {
        setHistory(sessionsResponse.data.map(s => ({
          label:    s.title,
          duration: formatDuration(s.duration - s.pausedDuration),
          type:     s.mode === 'work' ? 'work' : 'break',
          time:     new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          id:       s._id,
        })));
      }

      const statsResponse = await fetchStudySessionStats();
      if (statsResponse.data) {
        setSessions(statsResponse.data.overview.totalSessions || 0);
      }

      const savedTasks = localStorage.getItem('studyTasks');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed);
        if (!selectedTask) setSelectedTask(parsed[0] || '');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Start — optimistic ────────────────────────────────────────────────────
  const handleStartSession = async () => {
    if (!selectedTask.trim()) { alert('Please select a task to study'); return; }
    setRunning(true);
    setTimeLeft(config.duration);
    playSound('start');
    try {
      const subject  = selectedTask.split(' – ')[0] || selectedTask.split(' ')[0];
      const response = await startStudySession({ title: selectedTask, subject, mode, notes: '' });
      setActiveSession(response.data);
      
      // Show appropriate reminder based on session mode
      if (mode === 'work') {
        showTaskReminder();
      } else if (mode === 'long') {
        showBreakReminder();
      }
    } catch (error) {
      setRunning(false);
      setTimeLeft(config.duration);
      console.error('Error starting session:', error);
      alert('Failed to start study session. Please try again.');
    }
  };

  // ── Pause — optimistic ────────────────────────────────────────────────────
  const handlePauseSession = async () => {
    if (!activeSession) return;
    setRunning(false);
    playSound('pause');
    try {
      const response = await pauseStudySession(activeSession._id);
      setActiveSession(response.data);
    } catch (error) {
      setRunning(true);
      console.error('Error pausing session:', error);
    }
  };

  // ── Resume — optimistic ───────────────────────────────────────────────────
  const handleResumeSession = async () => {
    if (!activeSession) return;
    setRunning(true);
    playSound('resume');
    try {
      const response = await resumeStudySession(activeSession._id);
      setActiveSession(response.data);
    } catch (error) {
      setRunning(false);
      console.error('Error resuming session:', error);
    }
  };

  // ── Stop/Save ─────────────────────────────────────────────────────────────
  const handleStopSession = async () => {
    if (!activeSession) return;
    const sessionId = activeSession._id;
    setActiveSession(null);
    setRunning(false);
    setTimeLeft(config.duration);
    setSessionNotes('');

    try {
      setSaving(true);
      const response = await stopStudySession(sessionId, sessionNotes);
      setHistory(prev => [{
        label:    response.data.title,
        duration: formatDuration(response.data.duration - response.data.pausedDuration),
        type:     response.data.mode === 'work' ? 'work' : 'break',
        time:     new Date(response.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id:       response.data._id,
      }, ...prev].slice(0, 10));
      setSessions(prev => prev + 1);
    } catch (error) {
      console.error('Error stopping session:', error);
      alert('Failed to stop study session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Session complete (timer hits 0) ───────────────────────────────────────
  const handleSessionComplete = async () => {
    playSound('complete');
    if (!activeSession) return;

    const currentMode = mode;
    await handleStopSession();

    let nextMode;
    if (currentMode === 'work') {
      const sessionsBeforeLong = Number(timerSettings.sessionsBeforeLong) || 4;
      nextMode = sessions % sessionsBeforeLong === sessionsBeforeLong - 1 ? 'long' : 'short';
      setMode(nextMode);
      setTimeLeft(modeConfig[nextMode].duration);
      showSessionCompleteNotification(currentMode, nextMode);
      
      // Show break reminder if going to long break
      if (nextMode === 'long') {
        setTimeout(() => showBreakReminder(), 500);
      }
      
      setRunning(timerSettings.autoStartBreaks);
    } else {
      nextMode = 'work';
      setMode('work');
      setTimeLeft(modeConfig.work.duration);
      showSessionCompleteNotification(currentMode, nextMode);
      setRunning(timerSettings.autoStartSessions);
    }
  };
  onCompleteRef.current = handleSessionComplete;

  // ── Abandon ───────────────────────────────────────────────────────────────
  const handleAbandonSession = async () => {
    if (!activeSession) return;
    if (confirm('Are you sure you want to abandon this session? This will not be saved.')) {
      const sessionId = activeSession._id;
      setRunning(false);
      setActiveSession(null);
      setTimeLeft(config.duration);
      try { await abandonStudySession(sessionId); } catch (err) { console.error(err); }
    }
  };

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchMode = (m) => {
    if (running && activeSession) { handleAbandonSession(); return; }
    setMode(m);
    setTimeLeft(modeConfig[m].duration);
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    if (activeSession) { handleAbandonSession(); }
    else { setTimeLeft(config.duration); }
  };

  // ── Skip ──────────────────────────────────────────────────────────────────
  const skip = () => switchMode({ work: 'short', short: 'work', long: 'work' }[mode]);

  // ── Task management ───────────────────────────────────────────────────────
  const addTaskItem = () => {
    const t = newTask.trim();
    if (!t) { setAddingTask(false); return; }
    const next = [...tasks, t];
    setTasks(next);
    localStorage.setItem('studyTasks', JSON.stringify(next));
    setNewTask('');
    setAddingTask(false);
    if (!selectedTask) setSelectedTask(t);
  };

  const removeTask = (i) => {
    const next = tasks.filter((_, j) => j !== i);
    setTasks(next);
    localStorage.setItem('studyTasks', JSON.stringify(next));
    if (selectedTask === tasks[i]) setSelectedTask(next[0] || '');
  };

  const commitEditTask = () => {
    if (editingTaskIdx === null) return;
    const t = editingTaskVal.trim();
    if (t) {
      const next = tasks.map((x, i) => i === editingTaskIdx ? t : x);
      setTasks(next);
      localStorage.setItem('studyTasks', JSON.stringify(next));
      if (selectedTask === tasks[editingTaskIdx]) setSelectedTask(t);
    }
    setEditingTaskIdx(null);
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
    { label: 'Focus Sessions',   value: sessions.toString(), color: accent.main },
    { label: 'Total Focus Time', value: formatDuration(sessions * modeConfig.work.duration), color: '#22c55e' },
    { label: 'Breaks Taken',     value: Math.max(0, sessions - 1).toString(), color: '#06b6d4' },
    { label: 'Current Session',  value: activeSession ? (running ? 'Running' : 'Paused') : 'Idle', color: activeSession ? (running ? '#22c55e' : '#f97316') : '#94a3b8' },
  ];

  return (
    <div className="min-h-full" style={{ background: colors.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:max-w-5xl lg:px-6">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Study Timer</h1>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Pomodoro-style focus sessions</p>
          </div>
          <button onClick={() => setSettingsOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ background: settingsOpen ? `rgba(${accent.rgb},0.15)` : colors.card, border: `1px solid ${settingsOpen ? accent.main : colors.border}`, color: settingsOpen ? accent.light : colors.textMuted, fontWeight: 600 }}>
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Timer</span>
          </button>
        </div>

        {loading && (
          <div className="mb-6 p-4 rounded-2xl text-center" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="text-sm" style={{ color: colors.textMuted }}>Loading timer data...</div>
          </div>
        )}

        {/* Settings panel */}
        {settingsOpen && (
          <div className="mb-5 p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${accent.main}`, boxShadow: `0 0 24px rgba(${accent.rgb},0.1)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Timer Configuration</h3>
              <button onClick={() => setSettingsOpen(false)} style={{ color: colors.textMuted }}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Focus Duration', value: timerSettings.focusDuration, color: accent.main },
                { label: 'Short Break', value: timerSettings.shortBreak, color: '#22c55e' },
                { label: 'Long Break', value: timerSettings.longBreak, color: '#06b6d4' },
              ].map(item => (
                <div key={item.label} className="p-3.5 rounded-xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div className="text-xs mb-1" style={{ color: colors.textMuted }}>{item.label}</div>
                  <div className="text-xl font-semibold" style={{ color: item.color }}>{item.value} min</div>
                </div>
              ))}
            </div>
            <div className="space-y-3 mt-4">
              {[
                { label: 'Auto-start Breaks', value: timerSettings.autoStartBreaks },
                { label: 'Auto-start Sessions', value: timerSettings.autoStartSessions },
                { label: 'Timer Sounds', value: timerSettings.soundEnabled },
                { label: 'Session Complete Notification', value: timerSettings.notifyOnComplete },
              ].map(opt => (
                <div key={opt.label} className="flex items-center justify-between p-4 rounded-xl" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 500, color: colors.text }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{opt.value ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div className="w-9 h-5 rounded-full" style={{ background: opt.value ? `rgba(${accent.rgb},0.25)` : colors.border }}>
                    <div className="h-full rounded-full" style={{ width: opt.value ? '60%' : '15%', background: opt.value ? accent.main : colors.textMuted }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-center" style={{ color: colors.textMuted }}>
              Timer durations are controlled only from Settings. Your changes are saved permanently and persist across reloads.
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT: timer */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">

            {/* Mode tabs */}
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

            {/* Timer card */}
            <div className="rounded-3xl p-5 sm:p-8 flex flex-col items-center" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>

              {/* Ring */}
              <div ref={ringWrapRef} className="w-full flex items-center justify-center" style={{ maxWidth: 312 }}>
                <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${config.glow.replace('0.45','0.07')} 0%, transparent 72%)` }} />
                  <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                    <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={colors.border} strokeWidth={10} />
                    <circle cx={ringSize/2} cy={ringSize/2} r={radius} fill="none" stroke={config.color} strokeWidth={10}
                      strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
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

              {/* Task selector */}
              <div className="w-full mt-6 mb-3" style={{ maxWidth: 320 }}>
                <p className="text-xs mb-2 text-center" style={{ fontWeight: 500, color: colors.textMuted }}>Currently working on</p>
                <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-center"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme }}
                  value={selectedTask} onChange={e => setSelectedTask(e.target.value)}>
                  {tasks.length === 0 && <option value="">Add a task first</option>}
                  {tasks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Session notes */}
              {activeSession && (
                <div className="w-full mb-5" style={{ maxWidth: 320 }}>
                  <p className="text-xs mb-2 text-center" style={{ fontWeight: 500, color: colors.textMuted }}>Session notes</p>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme }}
                    value={sessionNotes} onChange={e => setSessionNotes(e.target.value)}
                    placeholder="Add notes about this session..." rows={2} />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={reset} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <RotateCcw className="w-5 h-5" />
                </button>

                {!activeSession && !running ? (
                  <button onClick={handleStartSession}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, boxShadow: `0 0 32px ${config.glow}, 0 8px 24px rgba(0,0,0,0.25)` }}
                    disabled={loading || !selectedTask}>
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

                <button onClick={skip} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Session controls */}
              {activeSession && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button onClick={handleStopSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:scale-105 active:scale-95"
                    style={{ background: `rgba(${accent.rgb},0.1)`, border: `1px solid ${accent.main}`, color: accent.light }}
                    disabled={saving}>
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save & Stop'}
                  </button>
                  <button onClick={handleAbandonSession}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:scale-105 active:scale-95"
                    style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                    <X className="w-4 h-4" />
                    Abandon
                  </button>
                </div>
              )}
            </div>

            {/* Session dots */}
            <div className="px-5 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <div>
                <div className="text-sm" style={{ fontWeight: 600, color: colors.text }}>
                  Session {sessions + 1} of{' '}
                  <button onClick={openGoalEdit} className="hover:underline" style={{ color: accent.main }}>{sessionGoal}</button>
                </div>
                <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Long break every 4 sessions</div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: Math.min(sessionGoal, 12) }).map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{ width: i < sessions ? 24 : 10, height: 10, background: i < sessions ? accent.main : colors.border, boxShadow: i < sessions ? `0 0 8px rgba(${accent.rgb},0.5)` : 'none', borderRadius: 5 }} />
                ))}
                {sessionGoal > 12 && <span className="text-xs" style={{ color: colors.textMuted }}>+{sessionGoal - 12}</span>}
              </div>
            </div>
          </div>

          {/* RIGHT: stats + tasks + history */}
          <div className="flex flex-col gap-4 lg:w-72 xl:w-80 shrink-0">

            {/* Today's stats */}
            <div className="rounded-2xl overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setStatsOpen(v => !v)}>
                <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Today's Stats</h3>
                <ChevronDown className="w-4 h-4 lg:hidden transition-transform duration-200"
                  style={{ color: colors.textMuted, transform: statsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              <div className={`lg:block ${statsOpen ? 'block' : 'hidden'}`}>
                <div className="flex flex-col gap-2 px-5 pb-5">
                  {statRows.map(s => (
                    <div key={s.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: colors.card2 }}>
                      <span className="text-xs" style={{ color: colors.textMuted }}>{s.label}</span>
                      <span className="text-sm" style={{ color: s.color, fontWeight: 700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study tasks */}
            <div className="rounded-2xl p-5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Study Tasks</h3>
                <button onClick={() => { setAddingTask(true); setTimeout(() => newTaskRef.current?.focus(), 0); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: `rgba(${accent.rgb},0.1)`, color: accent.light, fontWeight: 600 }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl group transition-colors"
                    style={{ background: selectedTask === task ? `rgba(${accent.rgb},0.1)` : 'transparent', border: `1px solid ${selectedTask === task ? `rgba(${accent.rgb},0.2)` : 'transparent'}` }}>
                    <button onClick={() => setSelectedTask(task)} className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: selectedTask === task ? accent.main : colors.border, border: `1px solid ${selectedTask === task ? accent.main : colors.textMuted}` }} />
                    {editingTaskIdx === i ? (
                      <input autoFocus value={editingTaskVal} onChange={e => setEditingTaskVal(e.target.value)}
                        onBlur={commitEditTask} onKeyDown={e => { if (e.key === 'Enter') commitEditTask(); if (e.key === 'Escape') setEditingTaskIdx(null); }}
                        className="flex-1 bg-transparent text-xs outline-none" style={{ color: colors.text }} />
                    ) : (
                      <span className="flex-1 text-xs truncate cursor-pointer"
                        style={{ color: selectedTask === task ? colors.text : colors.textMuted, fontWeight: selectedTask === task ? 600 : 400 }}
                        onClick={() => setSelectedTask(task)}>
                        {task}
                      </span>
                    )}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingTaskIdx(i); setEditingTaskVal(task); }} style={{ color: colors.textMuted }}>
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeTask(i)} className="hover:text-red-400" style={{ color: colors.textMuted }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {addingTask && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `rgba(${accent.rgb},0.08)` }}>
                    <input ref={newTaskRef} value={newTask} onChange={e => setNewTask(e.target.value)}
                      onBlur={addTaskItem} onKeyDown={e => { if (e.key === 'Enter') addTaskItem(); if (e.key === 'Escape') setAddingTask(false); }}
                      className="flex-1 bg-transparent text-xs outline-none" style={{ color: colors.text }}
                      placeholder="New task..." />
                  </div>
                )}
                {tasks.length === 0 && !addingTask && (
                  <div className="text-center py-3">
                    <span className="text-xs" style={{ color: colors.textMuted }}>No tasks yet — add one above</span>
                  </div>
                )}
              </div>
            </div>

            {/* Session history */}
            <div className="rounded-2xl p-5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 className="text-sm mb-3" style={{ fontWeight: 700, color: colors.text }}>Session History</h3>
              <div className="flex flex-col gap-2">
                {history.slice(0, 6).map((h, i) => (
                  <div key={h.id || i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group" style={{ background: colors.card2 }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.type === 'work' ? accent.main : '#22c55e' }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate" style={{ color: colors.text, fontWeight: 500 }}>{h.label}</span>
                    </div>
                    <span className="text-xs" style={{ color: colors.textMuted }}>{h.duration}</span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>{h.time}</span>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this session?')) {
                          try {
                            await deleteStudySession(h.id);
                            setHistory(prev => prev.filter(item => item.id !== h.id));
                          } catch (err) {
                            alert('Failed to delete session.');
                          }
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                      style={{ color: colors.textMuted }}>
                      <Trash2 className="w-3 h-3" />
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
    </div>
  );
}
