import { useState, useEffect, useRef } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  useTasks, TODAY, CURRENT_SPRINT_NUM, DEFAULT_SPRINT_GOALS,
  getTaskSprintNum, getSprintRange,
} from '../components/TaskContext';
import {
  Check, X, Clock, Flag, Trash2, ChevronLeft, ChevronRight,
  Plus, BookOpen, Search, List, CalendarDays, LayoutGrid,
  Zap, Target, Pencil,
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

// ─── Kanban column definitions ────────────────────────────────────────────────
const KANBAN_COLS = [
  { id: 'todo',        label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', badge: 'rgba(148,163,184,0.15)' },
  { id: 'in-progress', label: 'In Progress', color: '#6366f1', bg: 'rgba(99,102,241,0.06)',  badge: 'rgba(99,102,241,0.15)'  },
  { id: 'done',        label: 'Done',        color: '#22c55e', bg: 'rgba(34,197,94,0.06)',   badge: 'rgba(34,197,94,0.15)'   },
];

const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// TODAY is imported from TaskContext — derive calendar helpers from it
const [TODAY_Y, TODAY_M, TODAY_D] = TODAY.split('-').map(Number);

function getDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Shared small UI pieces ───────────────────────────────────────────────────
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
    if (form.date < TODAY) { setError('Cannot add tasks to past dates.'); return; }
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
            <input
              type="date"
              className={cls}
              style={inputStyle}
              value={form.date}
              min={TODAY}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
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

// ─── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ task, onMoveCol, onRemove, onToggle }) {
  const { colors, accent } = useAppearance();
  const subjectColor = SUBJECT_COLOR[task.subject] || accent.main;
  const isDone = task.status === 'done';
  const moveCols = KANBAN_COLS.filter(c => c.id !== task.status);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="rounded-2xl p-3 transition-all duration-150"
      style={{
        background: colors.card,
        border: `1px solid ${isDone ? colors.border : `${subjectColor}28`}`,
        opacity: isDone ? 0.65 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {/* Row 1: color stripe + title + check + trash
           check/trash are fixed w-6 h-6 so they never push the title.       */}
      <div className="flex items-start gap-2 mb-2.5">
        <div
          className="rounded-full shrink-0"
          style={{ width: 3, alignSelf: 'stretch', minHeight: 30, background: subjectColor, opacity: isDone ? 0.4 : 0.8 }}
        />
        <p
          className="flex-1 min-w-0 text-xs leading-snug"
          style={{ color: isDone ? colors.textMuted : colors.text, fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.5 }}
        >
          {task.title}
        </p>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            title={isDone ? 'Mark as to-do' : 'Mark as done'}
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: isDone ? 'rgba(34,197,94,0.18)' : colors.card2, color: isDone ? '#22c55e' : colors.textMuted, border: 'none', cursor: 'pointer' }}>
            <Check className="w-3 h-3" strokeWidth={3} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}
            title="Delete"
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:text-red-400"
            style={{ background: colors.card2, color: colors.textMuted, border: 'none', cursor: 'pointer' }}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Row 2: pills — flex-wrap handles any card width safely */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        <SubjectPill subject={task.subject} />
        <PriorityBadge p={task.priority} />
      </div>

      {/* Row 3: time + move buttons
           flex-wrap means buttons fall to next line on narrow cards instead
           of ever pushing outside the card boundary.                         */}
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="flex items-center gap-1 text-xs flex-1 min-w-0" style={{ color: colors.textMuted }}>
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">{task.startTime}–{task.endTime}</span>
        </span>
        {moveCols.map(col => (
          <button
            key={col.id}
            onClick={(e) => { e.stopPropagation(); onMoveCol(task.id, col.id); }}
            title={`Move to ${col.label}`}
            className="flex items-center gap-0.5 px-2 py-1 rounded-lg shrink-0 active:scale-95"
            style={{
              background: `${col.color}18`,
              color: col.color,
              fontWeight: 600,
              fontSize: 10,
              border: `1px solid ${col.color}25`,
              cursor: 'pointer',
            }}>
            <ChevronRight className="w-2.5 h-2.5 shrink-0" />
            <span>{col.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onMoveCol, onRemove, onToggle, onAdd }) {
  const { colors, accent } = useAppearance();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = Number(e.dataTransfer.getData('taskId'));
    if (taskId) onMoveCol(taskId, col.id);
  };

  return (
    <div className="flex flex-col w-full min-w-0">

      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
          <span className="text-xs truncate" style={{ fontWeight: 700, color: colors.text, letterSpacing: '0.03em' }}>
            {col.label.toUpperCase()}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: col.badge, color: col.color, fontWeight: 700 }}>
            {tasks.length}
          </span>
        </div>
        {col.id === 'todo' && (
          <button
            onClick={onAdd}
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            title="Add task"
            style={{ background: `rgba(${accent.rgb},0.12)`, color: accent.main, border: 'none', cursor: 'pointer' }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top accent line */}
      <div className="rounded-full mb-3" style={{ height: 3, background: col.color, opacity: 0.5 }} />

      {/* Drop zone — no maxHeight so stacked columns scroll with the page,
           not independently, keeping the layout clean on all screen sizes.   */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col gap-2 rounded-2xl p-2 transition-all duration-150"
        style={{
          minHeight: 120,
          background: isDragOver ? `rgba(${accent.rgb},0.07)` : col.bg,
          border: `2px dashed ${isDragOver ? accent.main : 'transparent'}`,
        }}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center" style={{ opacity: 0.4 }}>
            <BookOpen className="w-6 h-6 mb-1.5" style={{ color: colors.textMuted }} />
            <p className="text-xs" style={{ color: colors.textMuted, fontWeight: 500 }}>
              {isDragOver ? 'Drop here' : 'No tasks'}
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onMoveCol={onMoveCol}
              onRemove={onRemove}
              onToggle={onToggle}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, onMoveCol, onRemove, onToggle, onAdd }) {
  const byStatus = {
    'todo':        tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'done':        tasks.filter(t => t.status === 'done'),
  };

  const sharedColProps = { onMoveCol, onRemove, onToggle, onAdd };

  // auto-fit + minmax(min(100%, 240px), 1fr):
  //   • The browser fits as many 240 px columns as the available width allows.
  //   • min(100%, 240px) ensures a single column is never wider than the
  //     container, making horizontal overflow mathematically impossible.
  //   • Result: 3 cols on wide desktop, 2 on tablet, 1 on phone —
  //     all columns always visible, no tabs, no JS breakpoint logic.
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
      gap: '1rem',
      alignItems: 'start',
    }}>
      {KANBAN_COLS.map(col => (
        <KanbanColumn key={col.id} col={col} tasks={byStatus[col.id]} {...sharedColProps} />
      ))}
    </div>
  );
}

// ─── Sprint Banner ────────────────────────────────────────────────────────────
function SprintBanner({ tasks, selectedSprint, onSelectSprint, sprintGoals, onUpdateGoal }) {
  const { colors, accent } = useAppearance();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft,   setGoalDraft]   = useState('');
  const goalRef = useRef(null);

  // Collect all sprint numbers that have tasks; always include sprint 1
  const sprintNums = [...new Set(
    tasks.map(t => getTaskSprintNum(t.date)).filter(n => n !== null && n >= 1)
  )].sort((a, b) => a - b);
  if (!sprintNums.includes(1)) sprintNums.unshift(1);

  // Stats for selected sprint (or all tasks)
  const pool      = selectedSprint !== null ? tasks.filter(t => getTaskSprintNum(t.date) === selectedSprint) : tasks;
  const poolDone  = pool.filter(t => t.done).length;
  const poolTotal = pool.length;
  const poolPct   = poolTotal > 0 ? Math.round((poolDone / poolTotal) * 100) : 0;
  const range     = selectedSprint !== null ? getSprintRange(selectedSprint) : null;
  const fmtDate   = str => new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const startEdit = () => {
    setGoalDraft(sprintGoals[selectedSprint] || '');
    setEditingGoal(true);
    setTimeout(() => goalRef.current?.focus(), 40);
  };
  const saveGoal = () => {
    onUpdateGoal(selectedSprint, goalDraft.trim());
    setEditingGoal(false);
  };

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: colors.card, border: `1px solid rgba(${accent.rgb},0.22)`, boxShadow: `0 4px 24px rgba(${accent.rgb},0.06)` }}>

      {/* Row 1: label + sprint tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" style={{ color: accent.main }} />
          <span className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Sprint View</span>
          {selectedSprint !== null && selectedSprint === CURRENT_SPRINT_NUM && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `rgba(${accent.rgb},0.13)`, color: accent.main, fontWeight: 600 }}>
              Active
            </span>
          )}
        </div>
        {/* Sprint tab buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => { onSelectSprint(null); setEditingGoal(false); }}
            className="px-2.5 py-1 rounded-lg text-xs transition-all"
            style={selectedSprint === null
              ? { background: accent.main, color: '#fff', fontWeight: 600, boxShadow: `0 0 8px rgba(${accent.rgb},0.28)` }
              : { background: colors.card2, color: colors.textMuted, fontWeight: 500 }}>
            All
          </button>
          {sprintNums.map(num => (
            <button key={num}
              onClick={() => { onSelectSprint(num); setEditingGoal(false); }}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={selectedSprint === num
                ? { background: accent.main, color: '#fff', fontWeight: 600, boxShadow: `0 0 8px rgba(${accent.rgb},0.28)` }
                : num === CURRENT_SPRINT_NUM
                  ? { background: `rgba(${accent.rgb},0.10)`, color: accent.main, fontWeight: 600, border: `1px solid rgba(${accent.rgb},0.2)` }
                  : { background: colors.card2, color: colors.textMuted, fontWeight: 500 }}>
              Week {num}
            </button>
          ))}
        </div>
      </div>

      {/* Sprint detail — shown when a specific sprint is selected */}
      {selectedSprint !== null && (
        <>
          {/* Sprint goal row */}
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: accent.main, opacity: 0.75 }} />
            {editingGoal ? (
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                <input ref={goalRef}
                  className="flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                  style={{ background: colors.card2, border: `1px solid rgba(${accent.rgb},0.35)`, color: colors.text, minWidth: 180 }}
                  value={goalDraft}
                  onChange={e => setGoalDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                  placeholder="e.g. Finish all chapter readings..."
                />
                <button onClick={saveGoal}
                  className="text-xs px-2.5 py-1.5 rounded-lg"
                  style={{ background: accent.main, color: '#fff', fontWeight: 600 }}>
                  Save
                </button>
                <button onClick={() => setEditingGoal(false)}
                  className="text-xs px-2.5 py-1.5 rounded-lg"
                  style={{ background: colors.card2, color: colors.textMuted }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-start gap-2 group">
                <p className="text-xs flex-1 leading-relaxed"
                  style={{
                    color: sprintGoals[selectedSprint] ? colors.textSub : colors.textMuted,
                    fontStyle: sprintGoals[selectedSprint] ? 'normal' : 'italic',
                  }}>
                  {sprintGoals[selectedSprint] || 'No sprint goal set — hover and click ✏ to add one.'}
                </p>
                <button onClick={startEdit}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-opacity"
                  style={{ background: colors.card2, color: colors.textMuted, border: `1px solid ${colors.border}` }}
                  title="Edit sprint goal">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Date range + task counts */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: colors.textMuted }}>
              <CalendarDays className="w-3.5 h-3.5" />
              {fmtDate(range.start)} – {fmtDate(range.end)}
            </span>
            <div className="flex items-center gap-3">
              {[
                { label: 'Tasks', val: poolTotal,            color: colors.textMuted },
                { label: 'Done',  val: poolDone,             color: '#22c55e'        },
                { label: 'Left',  val: poolTotal - poolDone, color: '#f97316'        },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
                  <span className="text-xs" style={{ color: colors.textMuted }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint progress bar */}
          {poolTotal > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: colors.textMuted, fontWeight: 500 }}>Week {selectedSprint} progress</span>
                <span style={{ color: accent.main, fontWeight: 700 }}>{poolPct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: colors.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${poolPct}%`, background: `linear-gradient(90deg, ${accent.main}, #22c55e)` }} />
              </div>
            </div>
          )}
        </>
      )}

      {/* "All" view — mini card per sprint */}
      {selectedSprint === null && sprintNums.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {sprintNums.map(num => {
            const sTasks = tasks.filter(t => getTaskSprintNum(t.date) === num);
            const sDone  = sTasks.filter(t => t.done).length;
            const sPct   = sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : 0;
            const sRange = getSprintRange(num);
            const isCur  = num === CURRENT_SPRINT_NUM;
            return (
              <button key={num} onClick={() => onSelectSprint(num)}
                className="flex flex-col gap-1.5 p-3 rounded-xl flex-1 text-left transition-all"
                style={{
                  minWidth: 110, cursor: 'pointer',
                  background: colors.card2,
                  border: `1px solid ${isCur ? `rgba(${accent.rgb},0.3)` : colors.border}`,
                }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ fontWeight: 700, color: isCur ? accent.main : colors.text }}>
                    Week {num}{isCur ? ' · now' : ''}
                  </span>
                  <span className="text-xs" style={{ color: accent.main, fontWeight: 700 }}>{sPct}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: colors.border }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${sPct}%`, background: `linear-gradient(90deg, ${accent.main}, #22c55e)` }} />
                </div>
                <span className="text-xs" style={{ color: colors.textMuted }}>{fmtDate(sRange.start)} – {fmtDate(sRange.end)}</span>
                <span className="text-xs" style={{ color: colors.textMuted }}>{sDone} / {sTasks.length} tasks done</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────
export function Tasks() {
  // ── All task state and mutations come from shared context ──
  const { tasks, sprintGoals, toggle, remove, addTask, moveToCol, updateGoal } = useTasks();

  // ── UI-only state stays local ──
  const [view, setView]             = useState('list');
  const [search, setSearch]         = useState('');
  const [filterSubject, setFS]      = useState('All');
  const [filterPriority, setFP]     = useState('All');
  const [showForm, setShowForm]     = useState(false);
  const [formDate, setFormDate]     = useState(TODAY);
  const [selectedSprint, setSprint] = useState(CURRENT_SPRINT_NUM);
  const { colors, accent }          = useAppearance();

  const openFormFor = (date) => {
    let d = date;
    if (!d && selectedSprint !== null) {
      const r = getSprintRange(selectedSprint);
      d = r.start >= TODAY ? r.start : TODAY;
    }
    setFormDate(d || TODAY);
    setShowForm(true);
  };

  // Filtered tasks — respects search, subject, priority AND selected sprint
  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    return (t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
      && (filterSubject  === 'All' || t.subject  === filterSubject)
      && (filterPriority === 'All' || t.priority === filterPriority)
      && (selectedSprint === null  || getTaskSprintNum(t.date) === selectedSprint);
  });

  const completed = tasks.filter(t => t.done).length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Default date for new tasks respects the active sprint
  const newTaskDate = (() => {
    if (selectedSprint === null) return TODAY;
    const r = getSprintRange(selectedSprint);
    return r.start >= TODAY ? r.start : TODAY;
  })();

  // View options config
  const VIEW_OPTIONS = [
    { v: 'list',     icon: <List       className="w-3.5 h-3.5" />, label: 'List'     },
    { v: 'kanban',   icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Kanban'   },
    { v: 'calendar', icon: <CalendarDays className="w-3.5 h-3.5" />, label: 'Calendar' },
  ];

  return (
    <div className="min-h-full flex flex-col gap-4" style={{ background: colors.bg, padding: '1rem' }}>
      {showForm && <AddTaskForm defaultDate={formDate} onAdd={addTask} onClose={() => setShowForm(false)} />}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.3, color: colors.text }}>Task Scheduler</h1>
          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{completed} of {total} tasks · {pct}% done</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center p-1 gap-0.5 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            {VIEW_OPTIONS.map(({ v, icon, label }) => (
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
          {/* New Task button */}
          <button onClick={() => openFormFor(newTaskDate)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 16px rgba(${accent.rgb},0.3)` }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* ── Sprint Banner ── */}
      <SprintBanner
        tasks={tasks}
        selectedSprint={selectedSprint}
        onSelectSprint={setSprint}
        sprintGoals={sprintGoals}
        onUpdateGoal={updateGoal}
      />

      {/* ── Overall Progress ── */}
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

      {/* ── Search & Filter bar — shown for List and Kanban ── */}
      {(view === 'list' || view === 'kanban') && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}`, minWidth: '160px' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: colors.textMuted }} />
            <input className="flex-1 bg-transparent text-sm outline-none" style={{ color: colors.text }}
              placeholder={selectedSprint !== null ? `Search Week ${selectedSprint} tasks...` : 'Search tasks...'}
              value={search} onChange={e => setSearch(e.target.value)} />
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

      {/* ── View Render ── */}
      {view === 'list' && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: colors.textMuted }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {selectedSprint !== null
                  ? `No tasks in Week ${selectedSprint} match your filters.`
                  : 'No tasks match your filters.'}
              </p>
            </div>
          ) : filtered.map(task => (
            <TaskRow key={task.id} task={task} onToggle={() => toggle(task.id)} onRemove={() => remove(task.id)} />
          ))}
        </div>
      )}

      {view === 'kanban' && (
        <KanbanView
          tasks={filtered}
          onMoveCol={moveToCol}
          onRemove={remove}
          onToggle={toggle}
          onAdd={() => openFormFor(newTaskDate)}
        />
      )}

      {view === 'calendar' && (
        <CalendarView tasks={tasks} onToggle={toggle} onRemove={remove} onAddForDate={openFormFor} />
      )}
    </div>
  );
}