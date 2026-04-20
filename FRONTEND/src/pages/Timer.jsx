import { useState, useEffect, useRef } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  Brain, Coffee, Check, Pencil, Play, Pause, RotateCcw, SkipForward,
  Volume2, VolumeX, Settings, BarChart2, X, Plus, ChevronDown, ChevronUp, ChevronRight,
} from 'lucide-react';

// ─── Timer mode config ────────────────────────────────────────────────────────
const defaultModeConfig = {
  work:  { label: 'Focus',       duration: 25 * 60, color: '#6366f1', glow: 'rgba(99,102,241,0.45)', icon: Brain  },
  short: { label: 'Short Break', duration:  5 * 60, color: '#22c55e', glow: 'rgba(34,197,94,0.45)',  icon: Coffee },
  long:  { label: 'Long Break',  duration: 15 * 60, color: '#06b6d4', glow: 'rgba(6,182,212,0.45)',  icon: Coffee },
};

// ─── Dummy task list & session history ───────────────────────────────────────
const defaultTasks = [
  'Calculus – Chapter 5',
  'Physics Textbook Ch. 12',
  'Chemistry Problems',
  'English Essay Draft',
  'Biology Lab Report',
];

const defaultHistory = [
  { label: 'Calculus',      duration: '25:00', type: 'work',  time: '09:00' },
  { label: 'Short Break',   duration: '05:00', type: 'break', time: '09:25' },
  { label: 'Calculus',      duration: '25:00', type: 'work',  time: '09:30' },
  { label: 'Physics Ch.12', duration: '25:00', type: 'work',  time: '09:55' },
];

// ─── MinuteStepper – inline editable minutes ──────────────────────────────────
function MinuteStepper({ value, color, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value));
  const ref = useRef(null);
  const { colors } = useAppearance();

  const open   = () => { setDraft(String(value)); setEditing(true); setTimeout(() => ref.current?.select(), 0); };
  const commit = () => { const n = parseInt(draft, 10); if (!isNaN(n) && n >= 1 && n <= 180) onChange(n); setEditing(false); };

  if (editing) return (
    <div className="flex items-center gap-1">
      <input ref={ref} type="number" min={1} max={180} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-14 rounded-lg px-2 py-1 text-sm text-center outline-none"
        style={{ background: colors.card2, border: `1px solid ${color}`, color, fontWeight: 700 }} />
      <span className="text-xs" style={{ color: colors.textMuted }}>min</span>
      <button onClick={commit} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <button onClick={open} className="flex items-center gap-1.5 group" title="Click to edit">
      <span className="text-sm px-2.5 py-0.5 rounded-lg group-hover:opacity-80 transition-opacity"
        style={{ background: `${color}18`, color, fontWeight: 700 }}>
        {value} min
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: colors.textMuted }} />
    </button>
  );
}

// ─── LabelEditor – inline editable mode name ─────────────────────────────────
function LabelEditor({ value, color, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const ref = useRef(null);
  const { colors } = useAppearance();

  const open   = () => { setDraft(value); setEditing(true); setTimeout(() => ref.current?.select(), 0); };
  const commit = () => { if (draft.trim()) onSave(draft.trim()); setEditing(false); };

  if (editing) return (
    <input ref={ref} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className="rounded-lg px-2 py-0.5 text-sm text-center outline-none w-28"
      style={{ background: colors.card2, border: `1px solid ${color}`, color: colors.text, fontWeight: 600 }} />
  );

  return (
    <button onClick={open} className="flex items-center gap-1 group">
      <span className="text-sm" style={{ color: colors.textSub }}>{value}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: colors.textMuted }} />
    </button>
  );
}

// ─── Study Timer Page ─────────────────────────────────────────────────────────
export function StudyTimer() {
  const { colors, accent } = useAppearance();
  const accentGlow = `rgba(${accent.rgb},0.45)`;

  const [modeConfig, setModeConfig] = useState(() => ({
    ...defaultModeConfig,
    work: { ...defaultModeConfig.work, color: accent.main, glow: accentGlow },
  }));
  const [mode,          setMode]          = useState('work');
  const [timeLeft,      setTimeLeft]      = useState(defaultModeConfig.work.duration);
  const [running,       setRunning]       = useState(false);
  const [sessions,      setSessions]      = useState(4);
  const [sessionGoal,   setSessionGoal]   = useState(8);
  const [editingGoal,   setEditingGoal]   = useState(false);
  const [goalDraft,     setGoalDraft]     = useState('8');
  const [selectedTask,  setSelectedTask]  = useState(defaultTasks[0]);
  const [tasks,         setTasks]         = useState(defaultTasks);
  const [addingTask,    setAddingTask]    = useState(false);
  const [newTask,       setNewTask]       = useState('');
  const [editingTaskIdx, setEditingTaskIdx] = useState(null);
  const [editingTaskVal, setEditingTaskVal] = useState('');
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const [history,       setHistory]       = useState(defaultHistory);
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [statsOpen,     setStatsOpen]     = useState(false);

  const intervalRef = useRef(null);
  const newTaskRef  = useRef(null);
  const goalRef     = useRef(null);

  const config = modeConfig[mode];

  // Keep work mode color in sync with accent
  useEffect(() => {
    setModeConfig(prev => ({ ...prev, work: { ...prev.work, color: accent.main, glow: `rgba(${accent.rgb},0.45)` } }));
  }, [accent.main, accent.rgb]);

  // Responsive ring
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

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setRunning(false);
            if (mode === 'work') {
              setSessions(s => s + 1);
              const now = new Date();
              const t   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
              setHistory(h => [{ label: selectedTask, duration: `${String(Math.floor(modeConfig.work.duration / 60)).padStart(2,'0')}:00`, type: 'work', time: t }, ...h]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, modeConfig, selectedTask]);

  const switchMode     = (m) => { setMode(m); setTimeLeft(modeConfig[m].duration); setRunning(false); };
  const reset          = () => { setTimeLeft(config.duration); setRunning(false); };
  const skip           = () => { const next = { work: 'short', short: 'work', long: 'work' }; switchMode(next[mode]); };
  const updateDuration = (m, mins) => { setModeConfig(prev => ({ ...prev, [m]: { ...prev[m], duration: mins * 60 } })); if (m === mode && !running) setTimeLeft(mins * 60); };
  const updateLabel    = (m, label) => setModeConfig(prev => ({ ...prev, [m]: { ...prev[m], label } }));

  const addTaskItem = () => { const t = newTask.trim(); if (!t) { setAddingTask(false); return; } setTasks(prev => [...prev, t]); setNewTask(''); setAddingTask(false); };
  const removeTask  = (i) => { const next = tasks.filter((_, j) => j !== i); setTasks(next); if (selectedTask === tasks[i]) setSelectedTask(next[0] ?? ''); };
  const commitEditTask = () => { if (editingTaskIdx === null) return; const t = editingTaskVal.trim(); if (t) { const next = tasks.map((x, i) => i === editingTaskIdx ? t : x); setTasks(next); if (selectedTask === tasks[editingTaskIdx]) setSelectedTask(t); } setEditingTaskIdx(null); };
  const openGoalEdit = () => { setGoalDraft(String(sessionGoal)); setEditingGoal(true); setTimeout(() => goalRef.current?.select(), 0); };
  const commitGoal   = () => { const n = parseInt(goalDraft, 10); if (!isNaN(n) && n >= 1 && n <= 20) setSessionGoal(n); setEditingGoal(false); };

  const displayMins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const displaySecs = String(timeLeft % 60).padStart(2, '0');
  const ModeIcon    = config.icon;

  const statRows = [
    { label: 'Focus Sessions',   value: sessions.toString(),                                                                                              color: accent.main },
    { label: 'Total Focus Time', value: `${Math.floor(sessions * Math.floor(modeConfig.work.duration / 60) / 60)}h ${(sessions * Math.floor(modeConfig.work.duration / 60)) % 60}m`, color: '#22c55e' },
    { label: 'Breaks Taken',     value: Math.max(0, sessions - 1).toString(),                                                                             color: '#06b6d4'   },
    { label: 'Productivity',     value: '87%',                                                                                                            color: '#f97316'   },
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

        {/* Settings panel */}
        {settingsOpen && (
          <div className="mb-5 p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${accent.main}`, boxShadow: `0 0 24px rgba(${accent.rgb},0.1)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Timer Configuration</h3>
              <button onClick={() => setSettingsOpen(false)} style={{ color: colors.textMuted }}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.keys(modeConfig).map(m => (
                <div key={m} className="p-3.5 rounded-xl flex flex-col gap-3" style={{ background: colors.card2, border: `1px solid ${colors.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: modeConfig[m].color }} />
                    <LabelEditor value={modeConfig[m].label} color={modeConfig[m].color} onSave={v => updateLabel(m, v)} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: colors.textMuted }}>Duration</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateDuration(m, Math.max(1, Math.floor(modeConfig[m].duration / 60) - 1))}
                        className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: colors.border, color: colors.textSub }}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <MinuteStepper value={Math.floor(modeConfig[m].duration / 60)} color={modeConfig[m].color} onChange={v => updateDuration(m, v)} />
                      <button onClick={() => updateDuration(m, Math.min(180, Math.floor(modeConfig[m].duration / 60) + 1))}
                        className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: colors.border, color: colors.textSub }}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
              <div className="flex items-center gap-2.5">
                <span className="text-xs" style={{ color: colors.textSub }}>Session goal</span>
                {editingGoal ? (
                  <input ref={goalRef} type="number" min={1} max={20} value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value)} onBlur={commitGoal}
                    onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                    className="w-14 rounded-lg px-2 py-1 text-sm text-center outline-none"
                    style={{ background: colors.card2, border: `1px solid ${accent.main}`, color: accent.light, fontWeight: 700 }} />
                ) : (
                  <button onClick={openGoalEdit} className="flex items-center gap-1.5 group">
                    <span className="text-xs px-2.5 py-0.5 rounded-lg" style={{ background: `rgba(${accent.rgb},0.15)`, color: accent.light, fontWeight: 700 }}>
                      {sessionGoal} sessions
                    </span>
                    <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: colors.textMuted }} />
                  </button>
                )}
              </div>
              <button onClick={() => setSoundEnabled(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: soundEnabled ? `rgba(${accent.rgb},0.12)` : colors.border, border: `1px solid ${soundEnabled ? accent.main : colors.border}`, color: soundEnabled ? accent.light : colors.textMuted }}>
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Sound {soundEnabled ? 'On' : 'Off'}
              </button>
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
                    <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={colors.border} strokeWidth={10} />
                    <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={config.color} strokeWidth={10}
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
              <div className="w-full mt-6 mb-5" style={{ maxWidth: 320 }}>
                <p className="text-xs mb-2 text-center" style={{ fontWeight: 500, color: colors.textMuted }}>Currently working on</p>
                <select className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-center"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme }}
                  value={selectedTask} onChange={e => setSelectedTask(e.target.value)}>
                  {tasks.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={reset} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={() => setRunning(r => !r)}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)`, boxShadow: `0 0 32px ${config.glow}, 0 8px 24px rgba(0,0,0,0.25)` }}>
                  {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>
                <button onClick={skip} className="w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95"
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
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
              </div>
            </div>

            {/* Session history */}
            <div className="rounded-2xl p-5" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <h3 className="text-sm mb-3" style={{ fontWeight: 700, color: colors.text }}>Session History</h3>
              <div className="flex flex-col gap-2">
                {history.slice(0, 6).map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: colors.card2 }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.type === 'work' ? accent.main : '#22c55e' }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate" style={{ color: colors.text, fontWeight: 500 }}>{h.label}</span>
                    </div>
                    <span className="text-xs" style={{ color: colors.textMuted }}>{h.duration}</span>
                    <span className="text-xs" style={{ color: colors.textMuted }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 