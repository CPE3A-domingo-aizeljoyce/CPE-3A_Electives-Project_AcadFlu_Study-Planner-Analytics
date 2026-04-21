import { createContext, useContext, useState, useEffect } from 'react';
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

const TaskCtx = createContext(null);

export function TaskProvider({ children }) {
  const [tasks,       setTasks]   = useState([]);
  const [sprintGoals, setGoals]   = useState(DEFAULT_SPRINT_GOALS);
  const [loading,     setLoading] = useState(true);
  const [error,       setError]   = useState(null);

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
        syncToCalendar: true,
      });
      setTasks(prev => [...prev, normalizeTask(newTask)]);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.message);
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
      toggle,
      remove,
      addTask,
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