import { useState } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { useTasks, TODAY } from '../components/TaskContext';
import { Sun, Activity, Flame, Zap, Brain, Star, CheckSquare, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getLevelInfo(xp) {
  const names = ['Novice','Apprentice','Student','Learner','Scholar','Adept','Expert','Sage','Master','Champion'];
  const level    = Math.max(1, Math.floor(xp / 200) + 1);
  const levelXP  = (level - 1) * 200;
  const nextXP   = level * 200;
  const progress = Math.round(((xp - levelXP) / 200) * 100);
  const name     = names[Math.min(level - 1, names.length - 1)];
  return { level, name, xp, levelXP, nextXP, progress };
}

// ─── Dummy data ───────────────────────────────────────────────────────────────
const DEMO_XP     = 2340;
const DEMO_STREAK = 12;

const SUBJECT_COLORS = {
  Mathematics: '#6366f1', Physics: '#22c55e', Chemistry: '#f97316',
  Biology: '#8b5cf6', English: '#06b6d4', History: '#fbbf24',
};

const recentBadges = [
  { name: 'Early Bird',   icon: <Sun      className="w-4 h-4" style={{ color: '#fbbf24' }} />, desc: 'Studied before 8 AM', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', iconBg: 'rgba(251,191,36,0.2)' },
  { name: 'Week Warrior', icon: <Zap      className="w-4 h-4" style={{ color: '#818cf8' }} />, desc: '7-day streak',         color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', iconBg: 'rgba(99,102,241,0.2)' },
  { name: 'Marathon',     icon: <Activity className="w-4 h-4" style={{ color: '#4ade80' }} />, desc: '4+ hours in a day',   color: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)',  iconBg: 'rgba(34,197,94,0.2)'  },
];

const fallbackSubjectData = [
  { subject: 'Math', hours: 12.5 }, { subject: 'Physics', hours: 8.3 },
  { subject: 'Chem',  hours: 6.7  }, { subject: 'Biology', hours: 9.1 }, { subject: 'Eng', hours: 4.2 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  const { colors, accent } = useAppearance();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 10, padding: '8px 14px' }}>
      <p style={{ color: colors.textSub, fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: accent.main, fontSize: 15, fontWeight: 700 }}>{payload[0].value} hrs</p>
    </div>
  );
}

function StatCard({ icon, label, value, sub, iconBg, colors }) {
  return (
    <div className="p-4 rounded-2xl flex flex-col gap-2.5 transition-all duration-200 hover:scale-[1.02]"
      style={{ background: colors.card, border: `1px solid ${colors.border}`, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: colors.textSub }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontWeight: 700, letterSpacing: '-0.5px', color: colors.text, fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)' }}>{value}</div>
        <div className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export function Dashboard() {
  // Live task data from shared context — same state as the Tasks page
  const { tasks, toggle } = useTasks();
  const [chartPeriod, setChartPeriod] = useState('W');
  const { accent, colors, showStreak, showXPBar, compactMode } = useAppearance();

  const lvl = getLevelInfo(DEMO_XP);

  // ── Today's tasks (for Today's Schedule widget) ──────────────────────────
  const todayTasks = tasks
    .filter(t => t.date === TODAY)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // ── Overall productivity: uses ALL tasks so every Kanban move / toggle
  //    instantly updates the score, not only changes to today's tasks ──────
  const allCompleted      = tasks.filter(t => t.done).length;
  const allTotal          = tasks.length;
  const productivityScore = allTotal === 0 ? 0 : Math.round((allCompleted / allTotal) * 100);

  // ── Today-specific counts for the stat card sub-text ─────────────────────
  const todayDone    = todayTasks.filter(t => t.done).length;
  const todayTotal   = todayTasks.length;

  // Weekly data
  const weeklyData = [
    { day: 'Mon', hours: 3.5 }, { day: 'Tue', hours: 4.2 },
    { day: 'Wed', hours: 2.8 }, { day: 'Thu', hours: 5.1 },
    { day: 'Fri', hours: 3.9 }, { day: 'Sat', hours: 6.2 }, { day: 'Sun', hours: 1.5 },
  ];

  // Monthly data (last 4 weeks)
  const monthlyData = [
    { day: '4w ago', hours: 18.4 }, { day: '3w ago', hours: 22.1 },
    { day: '2w ago', hours: 25.7 }, { day: 'This wk', hours: weeklyData.reduce((s, d) => s + d.hours, 0) },
  ];

  // Yearly data (last 12 months)
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearlyData = [52,48,61,55,70,65,80,74,88,79,92,97].map((hours, i) => ({
    day: monthNames[i], hours,
  }));

  const chartData    = chartPeriod === 'W' ? weeklyData : chartPeriod === 'M' ? monthlyData : yearlyData;
  const periodTotal  = chartData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);
  const periodLabel  = chartPeriod === 'W' ? 'this week' : chartPeriod === 'M' ? 'this month' : 'this year';
  const weeklyTotal  = weeklyData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);

  return (
    <div className="min-h-full" style={{ background: colors.bg, padding: compactMode ? '0.75rem' : '1rem' }}>

      {/* Header */}
      <div style={{ marginBottom: compactMode ? '0.75rem' : '1rem' }}>
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(1rem, 4vw, 1.25rem)', letterSpacing: '-0.4px', lineHeight: 1.2, color: colors.text }}>
            Good morning, Moran
          </h1>
          <div className="hidden sm:flex items-center gap-3">
            {showStreak && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: `rgba(${accent.rgb},0.15)`, border: `1px solid rgba(${accent.rgb},0.3)`, color: accent.light }}>
                <Flame className="w-4 h-4 text-orange-400" />
                <span style={{ fontWeight: 600 }}>{DEMO_STREAK} Day Streak</span>
              </div>
            )}
            {showXPBar && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
                <Zap className="w-4 h-4" />
                <span style={{ fontWeight: 600 }}>{DEMO_XP.toLocaleString()} XP</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Dynamic Date */}
        <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Your progress starts here.
        </p>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: compactMode ? '0.75rem' : '1rem' }}>
        <StatCard colors={colors} icon={<Clock       className="w-4 h-4 text-indigo-400" />} label="Today's Study Time"  value="2h 45m"                        sub="3 sessions today"                iconBg="rgba(99,102,241,0.15)"  />
        <StatCard
          colors={colors}
          icon={<TrendingUp className="w-4 h-4 text-green-400" />}
          label="Productivity Score"
          value={`${productivityScore}%`}
          sub={`${allCompleted} of ${allTotal} tasks done`}
          iconBg="rgba(34,197,94,0.12)"
        />
        <StatCard colors={colors} icon={<Flame       className="w-4 h-4 text-orange-400" />} label="Current Streak"      value={`${DEMO_STREAK} Days`}         sub="Personal best: 18 days"          iconBg="rgba(249,115,22,0.12)"  />
        <StatCard colors={colors} icon={<CheckSquare className="w-4 h-4 text-purple-400" />} label="Tasks Completed" value={`${allCompleted}/${allTotal}`} sub={`${allTotal - allCompleted} remaining overall`} iconBg="rgba(139,92,246,0.12)" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Study Hours Chart with W/M/Y toggle */}
        <div className="lg:col-span-2 p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>
                {chartPeriod === 'W' ? 'Weekly' : chartPeriod === 'M' ? 'Monthly' : 'Yearly'} Study Hours
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Total {periodLabel}: {periodTotal} hrs</p>
            </div>
            {/* W / M / Y toggle */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: colors.card2 ?? colors.bg, border: `1px solid ${colors.border}` }}>
              {['W', 'M', 'Y'].map(t => (
                <button key={t} onClick={() => setChartPeriod(t)}
                  className="w-8 h-7 rounded-lg text-xs transition-all duration-200"
                  style={chartPeriod === t
                    ? { background: accent.main, color: '#fff', fontWeight: 700, boxShadow: `0 2px 8px rgba(${accent.rgb},0.4)`, cursor: 'pointer' }
                    : { color: colors.textSub, fontWeight: 500, background: 'transparent', cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: accent.main, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="hours" stroke={accent.main} strokeWidth={2.5}
                fill={accent.main} fillOpacity={0.12}
                dot={{ fill: accent.main, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: accent.light, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Breakdown */}
        <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-4" style={{ fontWeight: 600, color: colors.text }}>Subject Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fallbackSubjectData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="subject" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
              <Bar dataKey="hours" fill={accent.main} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Tasks */}
        <div className="lg:col-span-2 p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>Today's Schedule</h3>
              {todayTotal > 0 && (
                <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                  {todayDone} of {todayTotal} task{todayTotal !== 1 ? 's' : ''} done today
                </p>
              )}
            </div>
            <a href="/app/tasks" className="text-xs flex items-center gap-1 transition-colors" style={{ fontWeight: 500, color: accent.main }}>
              View all <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8" style={{ color: colors.textMuted }}>
                <p className="text-sm">No tasks scheduled for today.</p>
                <a href="/app/tasks" className="text-xs mt-2 block" style={{ color: accent.main, fontWeight: 500 }}>+ Add a task</a>
              </div>
            ) : todayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2.5 p-3 rounded-xl"
                style={{ background: task.done ? `rgba(${accent.rgb},0.03)` : colors.card2, border: `1px solid ${colors.border}`, opacity: task.done ? 0.55 : 1 }}>

                <div onClick={() => toggle(task.id)}
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 transition-all"
                  style={{ background: task.done ? (SUBJECT_COLORS[task.subject] ?? accent.main) : 'transparent', border: `2px solid ${task.done ? (SUBJECT_COLORS[task.subject] ?? accent.main) : colors.border}` }}>
                  {task.done && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>

                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: SUBJECT_COLORS[task.subject] ?? accent.main, opacity: 0.7 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ fontWeight: 500, color: colors.text, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{task.startTime}–{task.endTime}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md flex-shrink-0 hidden sm:block"
                  style={{
                    background: task.priority === 'high' ? 'rgba(239,68,68,0.12)' : task.priority === 'medium' ? 'rgba(249,115,22,0.12)' : 'rgba(100,116,139,0.12)',
                    color: task.priority === 'high' ? '#f87171' : task.priority === 'medium' ? '#fb923c' : '#94a3b8',
                    fontWeight: 500,
                  }}>{task.priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Level progress */}
          <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})` }}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Level {lvl.level}</div>
                  <div className="text-xs" style={{ color: colors.textMuted }}>{lvl.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm" style={{ fontWeight: 700, color: accent.main }}>{DEMO_XP.toLocaleString()} XP</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>/ {lvl.nextXP.toLocaleString()}</div>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: colors.border }}>
              <div className="h-full rounded-full" style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 12px rgba(${accent.rgb},0.6)` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{ color: colors.textMuted }}>{lvl.nextXP - DEMO_XP} XP to Level {lvl.level + 1}</span>
              <span className="text-xs" style={{ color: accent.main }}>{lvl.progress}%</span>
            </div>
          </div>

          {/* Recent Badges */}
          <div className="p-4 rounded-2xl flex-1" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm" style={{ fontWeight: 600, color: colors.text }}>Recent Badges</h3>
              <a href="/app/achievements" className="text-xs flex items-center gap-1" style={{ color: accent.main }}>
                All <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-2.5">
              {recentBadges.map(badge => (
                <div key={badge.name} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: badge.color, border: `1px solid ${badge.border}` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: badge.iconBg }}>{badge.icon}</div>
                  <div>
                    <div className="text-xs" style={{ fontWeight: 600, color: colors.text }}>{badge.name}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>{badge.desc}</div>
                  </div>
                  <Star className="w-3 h-3 text-yellow-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: colors.text }}>This Week</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Hours', value: `${weeklyTotal}h`, color: accent.main },
                { label: 'Sessions',    value: '14',              color: '#22c55e'   },
                { label: 'Avg/Day',     value: `${(parseFloat(weeklyTotal) / 7).toFixed(1)}h`, color: '#f97316' },
                { label: 'Streak',      value: String(DEMO_STREAK), color: '#8b5cf6' },
              ].map(stat => (
                <div key={stat.label} className="p-2.5 rounded-xl text-center" style={{ background: colors.card2 }}>
                  <div style={{ color: stat.color, fontWeight: 700, fontSize: 16 }}>{stat.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}