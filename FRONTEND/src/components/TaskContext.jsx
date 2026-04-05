import { createContext, useContext, useState } from 'react';

// ─── Date helpers ─────────────────────────────────────────────────────────────
function getWeekStart(dateStr) {
  const d   = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Exported constants ───────────────────────────────────────────────────────
export const TODAY           = new Date().toISOString().split('T')[0];
export const WEEK1_START     = getWeekStart(TODAY);

/**
 * Returns 1-based sprint week number relative to current week's Monday.
 * Returns null if the date falls before the current week.
 */
export function getTaskSprintNum(dateStr) {
  const start    = new Date(WEEK1_START + 'T12:00:00');
  const date     = new Date(dateStr     + 'T12:00:00');
  const diffDays = Math.round((date - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7) + 1;
}

/** Returns { start, end } ISO date strings for sprint number N */
export function getSprintRange(num) {
  const s = new Date(WEEK1_START + 'T12:00:00');
  s.setDate(s.getDate() + (num - 1) * 7);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return {
    start: s.toISOString().split('T')[0],
    end:   e.toISOString().split('T')[0],
  };
}

export const CURRENT_SPRINT_NUM = getTaskSprintNum(TODAY) || 1;

export const DEFAULT_SPRINT_GOALS = {
  1: 'Complete all foundational coursework and stay ahead of deadlines this week.',
  2: 'Reinforce key topics and tackle advanced problem sets.',
  3: 'Deep review sessions and begin preparation for upcoming exams.',
};

// ─── Seed tasks ───────────────────────────────────────────────────────────────
// Single source of truth — used by both Tasks page and Dashboard
const SEED_TASKS = [
  { id: 1,  title: 'Calculus – Chapter 5: Integration',    subject: 'Mathematics',      date: TODAY,           startTime: '09:00', endTime: '11:00', priority: 'high',   done: false, status: 'in-progress' },
  { id: 2,  title: 'Read Physics textbook Ch. 12',         subject: 'Physics',          date: TODAY,           startTime: '11:30', endTime: '13:00', priority: 'medium', done: true,  status: 'done'        },
  { id: 3,  title: 'Chemistry – reaction equations',       subject: 'Chemistry',        date: TODAY,           startTime: '14:00', endTime: '15:30', priority: 'high',   done: false, status: 'in-progress' },
  { id: 4,  title: 'English essay draft – Climate Change', subject: 'English',          date: TODAY,           startTime: '16:00', endTime: '17:30', priority: 'low',    done: false, status: 'todo'        },
  { id: 5,  title: 'Biology lab report write-up',          subject: 'Biology',          date: offsetDate(1),   startTime: '18:00', endTime: '19:00', priority: 'medium', done: false, status: 'todo'        },
  { id: 6,  title: 'History – WWII analysis essay',        subject: 'History',          date: offsetDate(1),   startTime: '10:00', endTime: '12:00', priority: 'medium', done: false, status: 'todo'        },
  { id: 7,  title: 'Algorithm practice – sorting',         subject: 'Computer Science', date: offsetDate(3),   startTime: '14:00', endTime: '16:00', priority: 'high',   done: false, status: 'todo'        },
  { id: 8,  title: 'Biology quiz review',                  subject: 'Biology',          date: offsetDate(5),   startTime: '09:00', endTime: '10:30', priority: 'high',   done: false, status: 'todo'        },
  { id: 9,  title: 'Calculus – Chapter 6: Derivatives',    subject: 'Mathematics',      date: offsetDate(7),   startTime: '10:00', endTime: '12:00', priority: 'high',   done: false, status: 'todo'        },
  { id: 10, title: 'English vocabulary test prep',         subject: 'English',          date: offsetDate(8),   startTime: '13:00', endTime: '14:00', priority: 'low',    done: false, status: 'todo'        },
  { id: 11, title: 'CS – Binary Trees lecture notes',      subject: 'Computer Science', date: offsetDate(9),   startTime: '15:00', endTime: '17:00', priority: 'medium', done: false, status: 'todo'        },
  { id: 12, title: 'Physics – Thermodynamics problems',    subject: 'Physics',          date: offsetDate(11),  startTime: '09:00', endTime: '11:00', priority: 'high',   done: false, status: 'todo'        },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const TaskCtx = createContext(null);

export function TaskProvider({ children }) {
  const [tasks,       setTasks] = useState(SEED_TASKS);
  const [sprintGoals, setGoals] = useState(DEFAULT_SPRINT_GOALS);

  /** Toggle a task's done state; syncs the kanban status field */
  const toggle = (id) => setTasks(prev => prev.map(t => {
    if (t.id !== id) return t;
    const newDone = !t.done;
    return { ...t, done: newDone, status: newDone ? 'done' : 'todo' };
  }));

  /** Permanently remove a task */
  const remove = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  /** Add a new task — always starts as 'todo' */
  const addTask = (data) => setTasks(prev => [
    ...prev,
    { ...data, id: Date.now(), done: false, status: 'todo' },
  ]);

  /** Move task to a kanban column; syncs the done flag */
  const moveToCol = (id, newStatus) => setTasks(prev => prev.map(t =>
    t.id === id ? { ...t, status: newStatus, done: newStatus === 'done' } : t
  ));

  /** Persist an edited sprint goal string */
  const updateGoal = (num, goal) => setGoals(prev => ({ ...prev, [num]: goal }));

  return (
    <TaskCtx.Provider value={{
      tasks,
      sprintGoals,
      toggle,
      remove,
      addTask,
      moveToCol,
      updateGoal,
    }}>
      {children}
    </TaskCtx.Provider>
  );
}

/** Hook — consume task context from any page or component */
export function useTasks() {
  return useContext(TaskCtx);
}
