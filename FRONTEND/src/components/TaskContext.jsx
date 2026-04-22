import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as taskApi from '../api/taskApi.js';

function getWeekStart(dateStr) {
  const d    = new Date(dateStr + 'T12:00:00');
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export const TODAY       = new Date().toISOString().split('T')[0];
export const WEEK1_START = getWeekStart(TODAY);

export function getTaskSprintNum(dateStr) {
  const start    = new Date(WEEK1_START + 'T12:00:00');
  const date     = new Date(dateStr     + 'T12:00:00');
  const diffDays = Math.round((date - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  return Math.floor(diffDays / 7) + 1;
}

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

function normalizeTask(task) {
  return {
    ...task,
    id:     task._id,
    date:   task.date.split('T')[0],
    done:   task.done || task.status === 'done',
    status: task.status || 'todo',
  };
}

// ── Read hasGoogleCalendar from stored user (safe parse) ──────────────────────
function readHasGoogleCalendar() {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    const user = JSON.parse(stored);
    return !!user.hasGoogleCalendar;
  } catch {
    return false;
  }
}

const TaskCtx = createContext(null);

export function TaskProvider({ children }) {
  const [tasks,            setTasks]   = useState([]);
  const [sprintGoals,      setGoals]   = useState(DEFAULT_SPRINT_GOALS);
  const [loading,          setLoading] = useState(true);
  const [error,            setError]   = useState(null);

  // ✅ FIX: hasGoogleCalendar is React state, not stale localStorage read
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(readHasGoogleCalendar);

  // Re-read whenever localStorage.user changes (e.g., after AuthCallback saves it)
  // Uses a storage event listener + a polling fallback for same-tab changes
  useEffect(() => {
    const sync = () => setHasGoogleCalendar(readHasGoogleCalendar());

    // Cross-tab sync
    window.addEventListener('storage', sync);

    // Same-tab: poll every 2 seconds for up to 10 seconds after mount
    // (covers the case where AuthCallback runs in the same tab)
    let count = 0;
    const timer = setInterval(() => {
      sync();
      count++;
      if (count >= 5) clearInterval(timer);
    }, 2000);

    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await taskApi.fetchTasks();
        setTasks(data.map(normalizeTask));
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError(err.message);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const toggle = async (id) => {
    try {
      const updated = await taskApi.toggleTaskDone(id);
      setTasks(prev => prev.map(t => t.id === id ? normalizeTask(updated) : t));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const remove = async (id) => {
    try {
      await taskApi.deleteExistingTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // ✅ FIX: syncToCalendar now comes from data (form checkbox), not hardcoded true
  const addTask = async (data) => {
    try {
      const payload = {
        title:          data.title,
        subject:        data.subject,
        date:           data.date,
        startTime:      data.startTime,
        endTime:        data.endTime,
        priority:       data.priority,
        description:    data.description || '',
        // Only sync if user has Google Calendar AND form checkbox is on
        syncToCalendar: hasGoogleCalendar && data.syncToCalendar === true,
      };

      console.log('[TaskContext] Creating task, syncToCalendar:', payload.syncToCalendar);
      const newTask = await taskApi.createNewTask(payload);
      setTasks(prev => [...prev, normalizeTask(newTask)]);
      return normalizeTask(newTask);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message);
      throw err;
    }
  };

  // ✅ NEW: editTask with calendar sync support
  const editTask = async (id, data) => {
    try {
      const payload = {
        title:          data.title,
        subject:        data.subject,
        date:           data.date,
        startTime:      data.startTime,
        endTime:        data.endTime,
        priority:       data.priority,
        description:    data.description || '',
        syncToCalendar: hasGoogleCalendar ? data.syncToCalendar : false,
      };

      console.log('[TaskContext] Updating task', id, 'syncToCalendar:', payload.syncToCalendar);
      const updated = await taskApi.updateExistingTask(id, payload);
      setTasks(prev => prev.map(t => t.id === id ? normalizeTask(updated) : t));
      return normalizeTask(updated);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message);
      throw err;
    }
  };

  const moveToCol = async (id, newStatus) => {
    try {
      const updated = await taskApi.updateStatusTask(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? normalizeTask(updated) : t));
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const updateGoal = (num, goal) => setGoals(prev => ({ ...prev, [num]: goal }));

  return (
    <TaskCtx.Provider value={{
      tasks,
      sprintGoals,
      hasGoogleCalendar,   // ✅ exposed so Tasks.jsx reads LIVE state
      toggle,
      remove,
      addTask,
      editTask,
      moveToCol,
      updateGoal,
      loading,
      error,
    }}>
      {children}
    </TaskCtx.Provider>
  );
}

export function useTasks() {
  return useContext(TaskCtx);
}