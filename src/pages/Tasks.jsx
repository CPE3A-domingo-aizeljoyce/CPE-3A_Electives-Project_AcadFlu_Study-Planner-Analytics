import { useState, useEffect, useRef } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  Check, X, Clock, Flag, Trash2, ChevronLeft, ChevronRight,
  Plus, BookOpen, Search, List, CalendarDays,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','History','Computer Science'];

const SUBJECT_COLOR = {
  Mathematics: '#6366f1', Physics: '#22c55e', Chemistry: '#f97316',
  Biology: '#8b5cf6', English: '#06b6d4', History: '#fbbf24', 'Computer Science': '#ec4899',
};

const PRIORITY = {
  high:   { bg: 'rgba(239,68,68,0.13)',   color: '#f87171', label: 'High'   },
  medium: { bg: 'rgba(249,115,22,0.13)',  color: '#fb923c', label: 'Medium' },
  low:    { bg: 'rgba(100,116,139,0.13)', color: '#94a3b8', label: 'Low'    },
};

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TODAY = new Date().toISOString().split('T')[0];
const [TODAY_Y, TODAY_M, TODAY_D] = TODAY.split('-').map(Number);

function getDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const SEED_TASKS = [
  { id: 1,  title: 'Calculus – Chapter 5: Integration',    subject: 'Mathematics',      date: TODAY,           startTime: '09:00', endTime: '11:00', priority: 'high',   done: false },
  { id: 2,  title: 'Read Physics textbook Ch. 12',         subject: 'Physics',          date: TODAY,           startTime: '11:30', endTime: '13:00', priority: 'medium', done: true  },
  { id: 3,  title: 'Chemistry – reaction equations',       subject: 'Chemistry',        date: TODAY,           startTime: '14:00', endTime: '15:30', priority: 'high',   done: false },
  { id: 4,  title: 'English essay draft – Climate Change', subject: 'English',          date: TODAY,           startTime: '16:00', endTime: '17:30', priority: 'low',    done: false },
  { id: 5,  title: 'Biology lab report write-up',          subject: 'Biology',          date: offsetDate(1),   startTime: '18:00', endTime: '19:00', priority: 'medium', done: false },
  { id: 6,  title: 'History – WWII analysis essay',        subject: 'History',          date: offsetDate(1),   startTime: '10:00', endTime: '12:00', priority: 'medium', done: false },
  { id: 7,  title: 'Algorithm practice – sorting',         subject: 'Computer Science', date: offsetDate(3),   startTime: '14:00', endTime: '16:00', priority: 'high',   done: false },
  { id: 8,  title: 'Biology quiz review',                  subject: 'Biology',          date: offsetDate(5),   startTime: '09:00', endTime: '10:30', priority: 'high',   done: false },
  { id: 9,  title: 'Calculus – Chapter 6: Derivatives',    subject: 'Mathematics',      date: offsetDate(7),   startTime: '10:00', endTime: '12:00', priority: 'high',   done: false },
  { id: 10, title: 'English vocabulary test prep',         subject: 'English',          date: offsetDate(8),   startTime: '13:00', endTime: '14:00', priority: 'low',    done: false },
  { id: 11, title: 'CS – Binary Trees lecture notes',      subject: 'Computer Science', date: offsetDate(9),   startTime: '15:00', endTime: '17:00', priority: 'medium', done: false },
  { id: 12, title: 'Physics – Thermodynamics problems',    subject: 'Physics',          date: offsetDate(11),  startTime: '09:00', endTime: '11:00', priority: 'high',   done: false },
];

// ─── Small UI pieces ──────────────────────────────────────────────────────────
function PriorityBadge({ p }) {
  const cfg = PRIORITY[p];
  return (
    <span className="shrink-0 rounded-lg px-2 py-0.5 text-xs" style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

function SubjectPill({ subject }) {
  const { accent } = useAppearance();
  const color = SUBJECT_COLOR[subject] || accent.main; 
  return (
    <span className="rounded-md px-2 py-0.5 text-xs shrink-0" style={{ background: `${color}20`, color, fontWeight: 500 }}>
      {subject}
    </span>
  );
}


function Field({ label, children }) {
  const { colors } = useAppearance();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs" style={{ color: colors.textMuted, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskForm({ defaultDate, onAdd, onClose }) {
  const [form, setForm] = useState({ title: '', subject: 'Mathematics', date: defaultDate, startTime: '09:00', endTime: '10:00', priority: 'medium' });
  const [error, setError] = useState('');
  const [customSubject, setCustomSubject] = useState(''); 
  const titleRef = useRef(null);
  const { colors, accent } = useAppearance();

  useEffect(() => { titleRef.current?.focus(); }, []);

  const submit = () => {
    if (!form.title.trim()) { setError('Please enter a task title.'); return; }
    
    const finalSubject = form.subject === 'Others' ? customSubject.trim() : form.subject;
    onAdd({ ...form, subject: finalSubject || 'Others' }); 
    onClose();
  };
  
  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme };
  const cls = "w-full rounded-xl px-3.5 py-2.5 text-sm outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5"
        style={{ background: colors.card, border: `1px solid rgba(${accent.rgb},0.35)`, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base" style={{ fontWeight: 700, color: colors.text }}>New Task</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: colors.card2, color: colors.textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <Field label="Task title">
            <>
              <input ref={titleRef} className={cls} style={{ ...inputStyle, border: error ? '1px solid #ef4444' : `1px solid ${colors.border}` }}
                placeholder="e.g. Read chapter 7..." value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()} />
              {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
            </>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subject">
              <select className={cls} style={inputStyle} value={form.subject} 
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="Others">Others...</option> 
              </select>
              {form.subject === 'Others' && (
                <input 
                  className={`${cls} mt-2`} 
                  style={inputStyle} 
                  placeholder="Type subject name..." 
                  value={customSubject} 
                  onChange={e => setCustomSubject(e.target.value)} 
                />
              )}
            </Field>
            <Field label="Priority">
              <select className={cls} style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
          </div>
          <Field label="Date">
            <input type="date" className={cls} style={inputStyle} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start time">
              <input type="time" className={cls} style={inputStyle} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </Field>
            <Field label="End time">
              <input type="time" className={cls} style={inputStyle} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </Field>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl text-white text-sm hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 20px rgba(${accent.rgb},0.35)` }}>
            Add Task
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm"
            style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Row (list view) ─────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onRemove }) {
  const { colors, accent } = useAppearance();
  const color = SUBJECT_COLOR[task.subject] || accent.main;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl group transition-all"
      style={{ background: colors.card, border: `1px solid ${colors.border}`, opacity: task.done ? 0.5 : 1 }}>
      <button onClick={onToggle} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: task.done ? color : 'transparent', border: `2px solid ${task.done ? color : colors.border}`, boxShadow: task.done ? `0 0 10px ${color}55` : 'none' }}>
        {task.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </button>
      <div className="w-0.5 h-10 rounded-full shrink-0" style={{ background: color, opacity: 0.7 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm mb-1 truncate" style={{ color: task.done ? colors.textMuted : colors.text, fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <SubjectPill subject={task.subject} />
          <span className="flex items-center gap-1 text-xs" style={{ color: colors.textMuted }}>
            <Clock className="w-3 h-3" />{task.startTime}–{task.endTime}
          </span>
        </div>
      </div>
      <PriorityBadge p={task.priority} />
      <button onClick={onRemove} className="hidden sm:flex opacity-0 group-hover:opacity-100 w-7 h-7 rounded-xl items-center justify-center hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
        style={{ color: colors.textMuted }}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ tasks, onToggle, onRemove, onAddForDate }) {
  const [year, setYear]         = useState(TODAY_Y);
  const [month, setMonth]       = useState(TODAY_M - 1);
  const [selected, setSelected] = useState(TODAY);
  const { colors, accent }      = useAppearance();

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const daysInPrev   = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--)
    cells.push({ dateStr: getDateStr(year, month - 1, daysInPrev - i), day: daysInPrev - i, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ dateStr: getDateStr(year, month, d), day: d, current: true });
  for (let d = 1; cells.length < 42; d++)
    cells.push({ dateStr: getDateStr(year, month + 1, d), day: d, current: false });

  const byDate = tasks.reduce((acc, t) => { if (!acc[t.date]) acc[t.date] = []; acc[t.date].push(t); return acc; }, {});
  const selectedTasks = (byDate[selected] ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const selDone  = selectedTasks.filter(t => t.done).length;
  const selTotal = selectedTasks.length;

  return (
    <div className="flex flex-col xl:flex-row gap-5">
      <div className="flex-1 min-w-0 rounded-2xl overflow-hidden flex flex-col" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>{MONTHS[month]} {year}</h3>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 border-b" style={{ borderColor: colors.border }}>
          {DAYS_SHORT.map(d => (
            <div key={d} className="py-2 text-center text-xs" style={{ color: colors.textMuted, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 p-2 gap-1">
          {cells.map((cell, i) => {
            const dayTasks   = byDate[cell.dateStr] ?? [];
            const isToday    = cell.dateStr === TODAY;
            const isSelected = cell.dateStr === selected;
            const allDone    = dayTasks.length > 0 && dayTasks.every(t => t.done);
            return (
              <button key={i} onClick={() => setSelected(cell.dateStr)}
                className="relative flex flex-col items-center justify-start rounded-xl pt-1.5 pb-1 transition-all duration-150"
                style={{
                  minHeight: 56,
                  background: isSelected ? `rgba(${accent.rgb},0.18)` : isToday ? `rgba(${accent.rgb},0.07)` : 'transparent',
                  border: isSelected ? `1.5px solid rgba(${accent.rgb},0.5)` : isToday ? `1.5px solid rgba(${accent.rgb},0.2)` : '1.5px solid transparent',
                }}>
                <span className="text-xs mb-1 leading-none" style={{
                  fontWeight: isToday || isSelected ? 700 : 500,
                  color: isSelected ? accent.light : isToday ? accent.main : cell.current ? colors.textSub : colors.border,
                }}>
                  {cell.day}
                </span>
                <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                  {dayTasks.slice(0, 2).map((t, ti) => (
                    <div key={ti} className="rounded-full"
                      style={{ width: 5, height: 5, background: t.done ? colors.border : (SUBJECT_COLOR[t.subject] || accent.main), opacity: cell.current ? 1 : 0.3 }} />
                  ))}
                  {dayTasks.length > 2 && <span className="text-xs leading-none" style={{ color: colors.textMuted, fontSize: 9 }}>+{dayTasks.length - 2}</span>}
                </div>
                {allDone && (
                  <div className="absolute top-1 right-1 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: '#22c55e' }}>
                    <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full xl:w-80 shrink-0 rounded-2xl flex flex-col" style={{ background: colors.card, border: `1px solid ${colors.border}`, maxHeight: 520 }}>
        <div className="px-4 py-3 flex items-start justify-between gap-3 shrink-0" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <p className="text-sm" style={{ fontWeight: 700, color: colors.text }}>
              {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              {selTotal === 0 ? 'Nothing scheduled' : `${selDone} of ${selTotal} task${selTotal > 1 ? 's' : ''} done`}
            </p>
          </div>
          <button onClick={() => onAddForDate(selected)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})` }}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {selTotal === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
              <BookOpen className="w-9 h-9 mb-3" style={{ color: colors.border }} />
              <p className="text-sm" style={{ color: colors.textMuted, fontWeight: 500 }}>No tasks scheduled</p>
              <button onClick={() => onAddForDate(selected)} className="mt-3 text-xs" style={{ color: accent.main, fontWeight: 500 }}>+ Add a task</button>
            </div>
          ) : selectedTasks.map(task => {
            const color = SUBJECT_COLOR[task.subject] || accent.main;
            return (
              <div key={task.id} className="rounded-xl p-3 group transition-all"
                style={{ background: colors.card2, border: `1px solid ${task.done ? colors.border : `${color}30`}`, opacity: task.done ? 0.5 : 1 }}>
                <div className="flex items-start gap-2.5">
                  <button onClick={() => onToggle(task.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: task.done ? color : 'transparent', border: `2px solid ${task.done ? color : colors.border}` }}>
                    {task.done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug mb-1.5" style={{ color: task.done ? colors.textMuted : colors.text, fontWeight: 500, textDecoration: task.done ? 'line-through' : 'none' }}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <SubjectPill subject={task.subject} />
                      <span className="flex items-center gap-1 text-xs" style={{ color: colors.textMuted }}>
                        <Clock className="w-2.5 h-2.5 shrink-0" />{task.startTime}–{task.endTime}
                      </span>
                      <PriorityBadge p={task.priority} />
                    </div>
                  </div>
                  <button onClick={() => onRemove(task.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0" style={{ color: colors.textMuted }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {selTotal > 0 && (
          <div className="px-4 pb-3 pt-2 shrink-0" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: colors.textMuted, fontWeight: 500 }}>Day progress</span>
              <span style={{ color: accent.main, fontWeight: 700 }}>{Math.round((selDone / selTotal) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: colors.border }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(selDone / selTotal) * 100}%`, background: `linear-gradient(90deg, ${accent.main}, #22c55e)` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────
export function Tasks() {
  const [tasks, setTasks]        = useState(SEED_TASKS);
  const [view, setView]          = useState('list');
  const [search, setSearch]      = useState('');
  const [filterSubject, setFS]   = useState('All');
  const [filterPriority, setFP]  = useState('All');
  const [showForm, setShowForm]  = useState(false);
  const [formDate, setFormDate]  = useState(TODAY);
  const { colors, accent }       = useAppearance();

  const toggle       = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove       = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const addTask      = (data) => setTasks(prev => [...prev, { ...data, id: Date.now(), done: false }]);
  const openFormFor  = (date) => { setFormDate(date); setShowForm(true); };

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    return (t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
      && (filterSubject  === 'All' || t.subject  === filterSubject)
      && (filterPriority === 'All' || t.priority === filterPriority);
  });

  const completed = tasks.filter(t => t.done).length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-full flex flex-col gap-4" style={{ background: colors.bg, padding: '1rem' }}>
      {showForm && <AddTaskForm defaultDate={formDate} onAdd={addTask} onClose={() => setShowForm(false)} />}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.3, color: colors.text }}>Task Scheduler</h1>
          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{completed} of {total} tasks · {pct}% done</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 gap-0.5 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            {[
              { v: 'list',     icon: <List className="w-3.5 h-3.5" />,       label: 'List'     },
              { v: 'calendar', icon: <CalendarDays className="w-3.5 h-3.5" />, label: 'Calendar' },
            ].map(({ v, icon, label }) => (
              <button key={v} onClick={() => setView(v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                style={view === v
                  ? { background: accent.main, color: '#fff', fontWeight: 600, boxShadow: `0 0 10px rgba(${accent.rgb},0.35)` }
                  : { color: colors.textMuted, fontWeight: 500 }}>
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => openFormFor(TODAY)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 16px rgba(${accent.rgb},0.3)` }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl px-4 py-4" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Overall Progress</span>
          <span className="text-sm" style={{ color: accent.main, fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: colors.border }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent.main}, #22c55e)`, boxShadow: `0 0 10px rgba(${accent.rgb},0.4)` }} />
        </div>
        <div className="flex items-center gap-4 mt-2.5">
          {[{ label: 'Total', val: total, color: colors.textMuted }, { label: 'Done', val: completed, color: '#22c55e' }, { label: 'Pending', val: total - completed, color: '#f97316' }].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-sm" style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
              <span className="text-xs" style={{ color: colors.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}`, minWidth: '160px' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: colors.textMuted }} />
            <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: colors.text }}
              placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-3 py-2 rounded-xl text-sm outline-none flex-1" style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub, colorScheme: colors.inputScheme, minWidth: '120px' }}
            value={filterSubject} onChange={e => setFS(e.target.value)}>
            <option value="All">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="px-3 py-2 rounded-xl text-sm outline-none flex-1" style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub, colorScheme: colors.inputScheme, minWidth: '120px' }}
            value={filterPriority} onChange={e => setFP(e.target.value)}>
            <option value="All">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      )}
{/*  */}
      {view === 'list' ? (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: colors.textMuted }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No tasks match your filters.</p>
            </div>
          ) : filtered.map(task => (
            <TaskRow key={task.id} task={task} onToggle={() => toggle(task.id)} onRemove={() => remove(task.id)} />
          ))}
        </div>
      ) : (
        <CalendarView tasks={tasks} onToggle={toggle} onRemove={remove} onAddForDate={openFormFor} />
      )}
    </div>
  );
}