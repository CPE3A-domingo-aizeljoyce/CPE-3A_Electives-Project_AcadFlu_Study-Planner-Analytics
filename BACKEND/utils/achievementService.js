import mongoose    from 'mongoose';
import Achievement  from '../models/Achievement.js';
import StudySession from '../models/studySessionModel.js';
import Task         from '../models/Task.js';
import Goal         from '../models/goalModel.js';

// 🌟 THE FIX: "Once-a-day" Consecutive Streak Logic
const calculateRealStreak = (completedSessions) => {
  if (!completedSessions || completedSessions.length === 0) return 0;

  // 1. Kunin lahat ng petsa (YYYY-MM-DD) para literal na 1 entry lang per day
  const uniqueDates = [...new Set(completedSessions.map(session => {
    const date = new Date(session.startTime || session.createdAt);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }))].sort((a, b) => new Date(b) - new Date(a)); // Sort: Latest to Oldest

  if (uniqueDates.length === 0) return 0;

  // 2. Compute Today and Yesterday (YYYY-MM-DD)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

  // 3. Kung di siya nag-log in kahapon o ngayon, putol na ang streak
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  // 4. Bilangin kung magkakasunod
  let currentStreak = 1;
  let dateToCheck = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const expectedPrevDate = new Date(dateToCheck);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);
    const expectedPrevStr = `${expectedPrevDate.getFullYear()}-${String(expectedPrevDate.getMonth() + 1).padStart(2, '0')}-${String(expectedPrevDate.getDate()).padStart(2, '0')}`;

    if (uniqueDates[i] === expectedPrevStr) {
      currentStreak++; 
      dateToCheck = new Date(uniqueDates[i]); // Move pointer backward
    } else {
      break; // Naputol ang araw
    }
  }

  return currentStreak;
};


export const ACHIEVEMENT_DEFS = [
  { id: 'first_steps',       name: 'First Steps',       description: 'Complete your first study session',    category: 'Beginner',    rarity: 'common',    xp: 50,   color: '#22c55e', iconKey: 'Rocket'    },
  { id: 'early_bird',        name: 'Early Bird',        description: 'Study before 8 AM',                    category: 'Habits',      rarity: 'common',    xp: 100,  color: '#fbbf24', iconKey: 'Sunrise'   },
  { id: 'night_owl',         name: 'Night Owl',         description: 'Study after 10 PM',                    category: 'Habits',      rarity: 'common',    xp: 100,  color: '#818cf8', iconKey: 'Moon'      },
  { id: 'streak_starter',    name: 'Streak Starter',    description: 'Achieve a 3-day study streak',         category: 'Streaks',     rarity: 'common',    xp: 150,  color: '#f472b6', iconKey: 'Sparkles'  },
  { id: 'week_warrior',      name: 'Week Warrior',      description: 'Achieve a 7-day study streak',         category: 'Streaks',     rarity: 'rare',      xp: 250,  color: '#6366f1', iconKey: 'Swords'    },
  { id: 'marathon',          name: 'Marathon',          description: 'Study for 4+ hours in a single day',   category: 'Performance', rarity: 'rare',      xp: 200,  color: '#fb923c', iconKey: 'Medal'     },
  { id: 'pomodoro_master',   name: 'Pomodoro Master',   description: 'Complete 10 pomodoro sessions',        category: 'Timer',       rarity: 'rare',      xp: 200,  color: '#34d399', iconKey: 'Timer'     },
  { id: 'note_taker',        name: 'Note Taker',        description: 'Create 10 study notes',                category: 'Study',       rarity: 'common',    xp: 150,  color: '#60a5fa', iconKey: 'PenLine'   },
  { id: 'goal_setter',       name: 'Goal Setter',       description: 'Create and complete 5 goals',          category: 'Goals',       rarity: 'rare',      xp: 300,  color: '#f97316', iconKey: 'Crosshair' },
  { id: 'perfect_week',      name: 'Perfect Week',      description: 'Study every day for an entire week',   category: 'Performance', rarity: 'epic',      xp: 500,  color: '#a78bfa', iconKey: 'Gem'       },
  { id: 'century_club',      name: 'Century Club',      description: 'Accumulate 100 total study hours',     category: 'Performance', rarity: 'epic',      xp: 750,  color: '#38bdf8', iconKey: 'Hourglass' },
  { id: 'subject_master',    name: 'Subject Master',    description: 'Complete 50 sessions in one subject',  category: 'Study',       rarity: 'epic',      xp: 600,  color: '#c084fc', iconKey: 'Brain'     },
  { id: 'consistency_king',  name: 'Consistency King',  description: 'Achieve a 30-day study streak',        category: 'Streaks',     rarity: 'legendary', xp: 1000, color: '#fbbf24', iconKey: 'Crown'     },
  { id: 'scholar_supreme',   name: 'Scholar Supreme',   description: 'Reach Level 20',                       category: 'Progression', rarity: 'legendary', xp: 2000, color: '#f87171', iconKey: 'Shield'    },
  { id: 'knowledge_hoarder', name: 'Knowledge Hoarder', description: 'Create 50 study notes',                category: 'Study',       rarity: 'epic',      xp: 500,  color: '#4ade80', iconKey: 'Library'   },
];

// ─── Safely get a model by name ───────────────────────────────────────────────
const safeGetModel = (modelName) => {
  try {
    const m = mongoose.model(modelName);
    if (m && typeof m.countDocuments === 'function') return m;
    return null;
  } catch {
    return null;
  }
};

// ─── Gather all stats needed in one batch ────────────────────────────────────
async function gatherStats(userId) {
  const NoteModel = safeGetModel('Note');

  const [sessions, taskDoneCount, goalDoneCount, noteCount] = await Promise.all([
    StudySession.find({ user: userId, status: 'completed' }).lean(),
    Task.countDocuments({ user: userId, done: true }),
    Goal.countDocuments({ user: userId, status: 'completed' }),
    NoteModel ? NoteModel.countDocuments({ user: userId }) : Promise.resolve(0),
  ]);

  const sessionCount = sessions.length;
  const totalSeconds = sessions.reduce((sum, s) =>
    sum + Math.max(0, (s.duration || 0) - (s.pausedDuration || 0)), 0);
  const totalHours = totalSeconds / 3600;
  
  // 🌟 THE FIX IS IMPLEMENTED HERE
  const streak = calculateRealStreak(sessions);

  const hasEarlySession = sessions.some(s => new Date(s.startTime).getHours() < 8);
  const hasLateSession  = sessions.some(s => new Date(s.startTime).getHours() >= 22);

  const daySeconds = {};
  sessions.forEach(s => {
    const key = new Date(s.startTime).toDateString();
    daySeconds[key] = (daySeconds[key] || 0)
      + Math.max(0, (s.duration || 0) - (s.pausedDuration || 0));
  });
  const maxDayHours = Object.values(daySeconds).length
    ? Math.max(...Object.values(daySeconds)) / 3600 : 0;

  const subjectCounts = {};
  sessions.forEach(s => {
    if (s.subject) subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
  });
  const maxSubjectSessions = Object.values(subjectCounts).length
    ? Math.max(...Object.values(subjectCounts)) : 0;

  return {
    sessionCount, totalHours, streak, noteCount,
    taskDoneCount, goalDoneCount,
    hasEarlySession, hasLateSession,
    maxDayHours, maxSubjectSessions,
    level: 1,
  };
}

// ─── Evaluate a single achievement ───────────────────────────────────────────
function evalAchievement(id, s) {
  switch (id) {
    case 'first_steps':       return { current: Math.min(s.sessionCount, 1),              total: 1,   unlocked: s.sessionCount >= 1      };
    case 'early_bird':        return { current: s.hasEarlySession ? 1 : 0,                total: 1,   unlocked: s.hasEarlySession         };
    case 'night_owl':         return { current: s.hasLateSession  ? 1 : 0,                total: 1,   unlocked: s.hasLateSession          };
    case 'streak_starter':    return { current: Math.min(s.streak, 3),                    total: 3,   unlocked: s.streak >= 3             };
    case 'week_warrior':      return { current: Math.min(s.streak, 7),                    total: 7,   unlocked: s.streak >= 7             };
    case 'marathon':          return { current: s.maxDayHours >= 4 ? 1 : 0,               total: 1,   unlocked: s.maxDayHours >= 4        };
    case 'pomodoro_master':   return { current: Math.min(s.sessionCount, 10),             total: 10,  unlocked: s.sessionCount >= 10      };
    case 'note_taker':        return { current: Math.min(s.noteCount, 10),                total: 10,  unlocked: s.noteCount >= 10         };
    case 'goal_setter':       return { current: Math.min(s.goalDoneCount, 5),             total: 5,   unlocked: s.goalDoneCount >= 5      };
    case 'perfect_week':      return { current: Math.min(s.streak, 7),                    total: 7,   unlocked: s.streak >= 7             };
    case 'century_club':      return { current: Math.min(Math.floor(s.totalHours), 100),  total: 100, unlocked: s.totalHours >= 100       };
    case 'subject_master':    return { current: Math.min(s.maxSubjectSessions, 50),       total: 50,  unlocked: s.maxSubjectSessions >= 50 };
    case 'consistency_king':  return { current: Math.min(s.streak, 30),                   total: 30,  unlocked: s.streak >= 30            };
    case 'scholar_supreme':   return { current: Math.min(s.level, 20),                    total: 20,  unlocked: s.level >= 20             };
    case 'knowledge_hoarder': return { current: Math.min(s.noteCount, 50),                total: 50,  unlocked: s.noteCount >= 50         };
    default:                  return { current: 0, total: 1, unlocked: false };
  }
}

// ─── PUBLIC: check and award newly earned achievements ────────────────────────
export const checkAndAwardAchievements = async (userId) => {
  try {
    const [stats, alreadyUnlocked] = await Promise.all([
      gatherStats(userId),
      Achievement.find({ user: userId }).lean(),
    ]);

    const alreadyIds = new Set(alreadyUnlocked.map(a => a.achievementId));

    const currentXP = alreadyUnlocked.reduce((s, a) => s + (a.xpAwarded || 0), 0);
    stats.level = Math.max(1, Math.floor(currentXP / 200) + 1);

    const newlyUnlocked = ACHIEVEMENT_DEFS.filter(def =>
      !alreadyIds.has(def.id) && evalAchievement(def.id, stats).unlocked
    );

    if (!newlyUnlocked.length) return [];

    await Achievement.insertMany(
      newlyUnlocked.map(def => ({
        user: userId, achievementId: def.id, xpAwarded: def.xp,
      })),
      { ordered: false }
    );

    console.log(`[Achievements] Unlocked for ${userId}:`, newlyUnlocked.map(d => d.id));
    return newlyUnlocked;
  } catch (err) {
    console.error('[AchievementService] error:', err.message);
    return [];
  }
};

// ─── PUBLIC: full achievements list with progress ─────────────────────────────
export const getAchievementsWithProgress = async (userId) => {
  const [stats, unlocked] = await Promise.all([
    gatherStats(userId),
    Achievement.find({ user: userId }).lean(),
  ]);

  const unlockedMap = Object.fromEntries(unlocked.map(a => [a.achievementId, a]));
  const totalXP     = unlocked.reduce((s, a) => s + (a.xpAwarded || 0), 0);
  stats.level       = Math.max(1, Math.floor(totalXP / 200) + 1);

  const achievements = ACHIEVEMENT_DEFS.map(def => {
    const prog       = evalAchievement(def.id, stats);
    const dbRecord   = unlockedMap[def.id];
    const isUnlocked = prog.unlocked || !!dbRecord;
    return {
      ...def,
      unlocked:   isUnlocked,
      unlockedAt: dbRecord?.unlockedAt ?? null,
      progress:   { current: prog.current, total: prog.total },
    };
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return {
    achievements,
    stats: {
      totalXP,
      level:        stats.level,
      streak:       stats.streak,
      sessionCount: stats.sessionCount,
      totalHours:   Math.round(stats.totalHours * 10) / 10,
      unlockedCount,
      totalCount:   ACHIEVEMENT_DEFS.length,
    },
  };
};