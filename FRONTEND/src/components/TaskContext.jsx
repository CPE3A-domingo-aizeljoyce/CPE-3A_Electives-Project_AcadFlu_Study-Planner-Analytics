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

function readHasGoogleCalendar() {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    return !!JSON.parse(stored).hasGoogleCalendar;
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

  // ── Google Calendar connection state ──────────────────────────────────────
  const [hasGoogleCalendar, setHasGoogleCalendar] = useState(readHasGoogleCalendar);

  // ── 2-way sync state ──────────────────────────────────────────────────────
  // 'idle' | 'syncing' | 'done'
  const [calendarSyncStatus,  setSyncStatus]  = useState('idle');
  // Set when remote deletions are found — shown as a banner in Tasks.jsx
  const [calendarSyncMessage, setSyncMessage] = useState('');

  // Re-read hasGoogleCalendar if localStorage changes (e.g. after AuthCallback)
  useEffect(() => {
    const sync = () => setHasGoogleCalendar(readHasGoogleCalendar());
    window.addEventListener('storage', sync);
    // Poll briefly on mount to catch same-tab updates from AuthCallback
    let count = 0;
    const timer = setInterval(() => {
      sync();
      if (++count >= 5) clearInterval(timer);
    }, 2000);
    return () => {
      window.removeEventListener('storage', sync);
      clearInterval(timer);
    };
  }, []);

  // ── Load tasks from backend ───────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── 2-way calendar sync — runs after tasks load ───────────────────────────
  // Silently checks Google Calendar for events deleted remotely.
  // Only runs if user has Google Calendar connected.
  // If remote deletions found: removes those tasks from local state + shows banner.
  useEffect(() => {
    // Wait for tasks to finish loading before syncing
    if (loading) return;
    // Only sync if Google Calendar is connected
    if (!readHasGoogleCalendar()) return;

    const runSync = async () => {
      setSyncStatus('syncing');
      console.log('[TaskContext] Running 2-way calendar sync…');

      try {
        const result = await taskApi.triggerCalendarSync();
        console.log('[TaskContext] Sync result:', result);

        if (result.deletedCount > 0 && result.deletedTasks?.length > 0) {
          // Remove deleted tasks from local state
          const deletedIds = new Set(result.deletedTasks.map(t => String(t.id)));
          setTasks(prev => prev.filter(t => !deletedIds.has(String(t._id || t.id))));
          setSyncMessage(result.message);
          console.log(`[TaskContext] Removed ${result.deletedCount} task(s) deleted from Google Calendar`);
        }

        if (result.tokenReset) {
          // Token expired — next load will do full re-sync
          console.warn('[TaskContext] Sync token was reset — next load will re-baseline');
        }
      } catch (err) {
        // Non-fatal: sync failure should never break the app
        console.warn('[TaskContext] Calendar sync failed silently:', err.message);
      } finally {
        setSyncStatus('done');
      }
    };

    runSync();
  }, [loading]); // runs once after initial load completes

  // ── CRUD actions ──────────────────────────────────────────────────────────

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

  const addTask = async (data) => {
    try {
      const newTask = await taskApi.createNewTask({
        title:          data.title,
        subject:        data.subject,
        date:           data.date,
        startTime:      data.startTime,
        endTime:        data.endTime,
        priority:       data.priority,
        description:    data.description || '',
        syncToCalendar: hasGoogleCalendar && data.syncToCalendar === true,
      });
      setTasks(prev => [...prev, normalizeTask(newTask)]);
      return normalizeTask(newTask);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message);
      throw err;
    }
  };

  const editTask = async (id, data) => {
    try {
      const updated = await taskApi.updateExistingTask(id, {
        title:          data.title,
        subject:        data.subject,
        date:           data.date,
        startTime:      data.startTime,
        endTime:        data.endTime,
        priority:       data.priority,
        description:    data.description || '',
        syncToCalendar: hasGoogleCalendar ? data.syncToCalendar : false,
      });
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

  // Dismiss the sync notification banner
  const dismissSyncMessage = () => setSyncMessage('');

  return (
    <TaskCtx.Provider value={{
      tasks,
      sprintGoals,
      hasGoogleCalendar,
      calendarSyncStatus,
      calendarSyncMessage,
      dismissSyncMessage,
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
