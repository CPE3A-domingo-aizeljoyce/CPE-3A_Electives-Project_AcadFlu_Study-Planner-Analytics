import { useState, useEffect, useMemo } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { useTasks, TODAY } from '../components/TaskContext';
import { fetchAchievements } from '../api/achievementsApi';
import { fetchAnalyticsData } from '../api/analyticsApi';
import { Flame, Zap, Brain, Star, CheckSquare, Clock, TrendingUp, ChevronRight, Award, AlertCircle, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getLevelInfo(xp) {
  const names = [
    'Novice','Apprentice','Student','Learner','Scholar',
    'Adept','Practitioner','Expert','Sage','Master',
    'Scholar','Expert','Grand Sage','Grand Master','Champion',
    'Elite','Legend','Supreme','Mythic','Legendary',
  ];
  const level    = Math.max(1, Math.floor(xp / 200) + 1);
  const levelXP  = (level - 1) * 200;
  const nextXP   = level * 200;
  const progress = Math.round(((xp - levelXP) / 200) * 100);
  const name     = names[Math.min(level - 1, names.length - 1)];
  return { level, name, xp, levelXP, nextXP, progress };
}

const SUBJECT_COLORS = {
  Mathematics: '#6366f1', Physics: '#22c55e', Chemistry: '#f97316',
  Biology: '#8b5cf6', English: '#06b6d4', History: '#fbbf24', General: '#ec4899'
};

const getBadgeStyle = (index) => {
  const palette = [
    { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', iconBg: 'rgba(251,191,36,0.2)', iconCol: '#fbbf24' },
    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', iconBg: 'rgba(99,102,241,0.2)', iconCol: '#818cf8' },
    { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)',  iconBg: 'rgba(34,197,94,0.2)',  iconCol: '#4ade80' },
  ];
  return palette[index % palette.length];
};

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
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs truncate w-full" style={{ color: colors.textSub }}>{label}</span>
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
 const { tasks, toggle, updateTask, update, editTask, deleteTask, remove } = useTasks();
  const activeDeleteFn = remove || deleteTask;
  const activeUpdateFn = updateTask || update || editTask;
  const { accent, colors, showStreak, showXPBar, compactMode } = useAppearance();

  const [realXP, setRealXP] = useState(0);
  const [realStreak, setRealStreak] = useState(0);
  const [recentBadges, setRecentBadges] = useState([]);
  
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [chartSessions, setChartSessions] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [showOverdueDropdown, setShowOverdueDropdown] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // 1. Fetch Static Data on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const achRes = await fetchAchievements();
        if (achRes && achRes.stats) {
          setRealXP(achRes.stats.totalXP || 0);
          setRealStreak(achRes.stats.streak || 0);
        }
        if (achRes && achRes.achievements) {
          const unlocked = achRes.achievements
            .filter(a => a.unlocked)
            .sort((a,b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
          setRecentBadges(unlocked.slice(0, 3));
        }
        const dData = await fetchAnalyticsData('daily');
        setDailySessions(dData || []);
        const wData = await fetchAnalyticsData('weekly');
        setWeeklySessions(wData || []);
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      }
    };
    initData();
  }, []);

  // 2. Fetch Chart Data Dynamically
  useEffect(() => {
    const loadChart = async () => {
      try {
        const data = await fetchAnalyticsData(chartPeriod);
        setChartSessions(data || []);
      } catch (e) {
        console.error('Error loading chart data:', e);
      }
    };
    loadChart();
  }, [chartPeriod]);

  // ─── COMPUTATIONS ───
  const lvl = getLevelInfo(realXP);
  const d = new Date();
  const REAL_TODAY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const todayTasks = tasks.filter(t => t.date === REAL_TODAY).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const overdueTasks = tasks.filter(t => t.date < REAL_TODAY && !t.done);
  const displayTasks = todayTasks;
  
  const allCompleted = tasks.filter(t => t.done).length;
  const allTotal = tasks.length;
  const productivityScore = allTotal === 0 ? 0 : Math.round((allCompleted / allTotal) * 100);
  const todayDone = displayTasks.filter(t => t.done).length;
  const todayTotal = displayTasks.length;

  // Daily Quick Stats
  const todayMins = dailySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const todayHrs = Math.floor(todayMins / 60);
  const todayRemMins = todayMins % 60;
  const todayDisplay = todayHrs > 0 ? `${todayHrs}h ${todayRemMins}m` : `${todayRemMins}m`;

  // Weekly Quick Stats
  const weekMins = weeklySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weekHrs = (weekMins / 60).toFixed(1);
  const weekAvg = ((weekMins / 60) / 7).toFixed(1);

  // Dynamic Chart Formatting
  const processedChartData = useMemo(() => {
    if (!chartSessions || chartSessions.length === 0) return [];
    let data = [];

    const formatHours = (mins) => {
      if (!mins) return 0;
      const hrs = mins / 60;
      return hrs > 0 && hrs < 0.1 ? 0.1 : Number(hrs.toFixed(1));
    };

    if (chartPeriod === 'weekly') {
      const daysMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      chartSessions.forEach(s => {
        const dayName = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (daysMap[dayName] !== undefined) daysMap[dayName] += s.durationMinutes;
      });
      data = Object.keys(daysMap).map(day => ({ day, hours: formatHours(daysMap[day]) }));
    } else if (chartPeriod === 'monthly') {
      const weeksMap = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 };
      chartSessions.forEach(s => {
        const dayOfMonth = new Date(s.date).getDate();
        const weekStr = dayOfMonth <= 7 ? 'Wk 1' : dayOfMonth <= 14 ? 'Wk 2' : dayOfMonth <= 21 ? 'Wk 3' : 'Wk 4';
        weeksMap[weekStr] += s.durationMinutes;
      });
      data = Object.keys(weeksMap).map(day => ({ day, hours: formatHours(weeksMap[day]) }));
    } else if (chartPeriod === 'daily') {
      const allLabels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
      const hoursMap = {};
      allLabels.forEach(h => hoursMap[h] = 0);
      chartSessions.forEach(s => {
        const hour = new Date(s.date).getHours();
        const blockHour = Math.floor(hour / 2) * 2;
        let label = `${blockHour % 12 || 12}${blockHour >= 12 ? 'PM' : 'AM'}`;
        if (blockHour === 0) label = '12AM';
        if (hoursMap[label] !== undefined) hoursMap[label] += s.durationMinutes;
      });
      data = allLabels.map(day => ({ day, hours: formatHours(hoursMap[day]) }));
    }
    return data;
  }, [chartSessions, chartPeriod]);

  // Subject Breakdown Formatting
  const subjectData = useMemo(() => {
    const subjectMap = {};
    chartSessions.forEach(s => {
       const subj = s.subject || 'General';
       subjectMap[subj] = (subjectMap[subj] || 0) + s.durationMinutes;
    });
    return Object.keys(subjectMap).map(key => ({
       subject: key.length > 6 ? key.substring(0,6)+'..' : key, // Truncate long names
       hours: Number((subjectMap[key] / 60).toFixed(1))
    })).sort((a,b) => b.hours - a.hours).slice(0, 5); 
  }, [chartSessions]);

  const periodTotal = processedChartData.reduce((sum, d) => sum + (d.hours || 0), 0).toFixed(1);

  return (
    <div className="min-h-full" style={{ background: colors.bg, padding: compactMode ? '0.75rem' : '1rem' }}>

      {/* Header */}
      <div style={{ marginBottom: compactMode ? '0.75rem' : '1rem' }}>
        <div className="flex items-center justify-between mb-1">
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(1rem, 4vw, 1.25rem)', letterSpacing: '-0.4px', lineHeight: 1.2, color: colors.text }}>
            Welcome back to AcadFlu
          </h1>
          
          {/* HEADER WIDGETS */}
          <div className="hidden sm:flex items-center gap-3">
            
            {showStreak && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: `rgba(${accent.rgb},0.15)`, border: `1px solid rgba(${accent.rgb},0.3)`, color: accent.light }}>
                <Flame className="w-4 h-4 text-orange-400" />
               <span style={{ fontWeight: 600 }}>{realStreak} {realStreak <= 1 ? 'Day' : 'Days'} Streak</span>
              </div>
            )}
            
            {showXPBar && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
                <Zap className="w-4 h-4" />
                <span style={{ fontWeight: 600 }}>{realXP.toLocaleString()} XP</span>
              </div>
            )}

           {/* 🌟 FIXED: OVERDUE WIDGET (Laging naka-display para hindi mo akalaing nawawala) */}
            <div className="relative">
              <button 
                onClick={() => overdueTasks.length > 0 && setShowOverdueDropdown(!showOverdueDropdown)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${overdueTasks.length > 0 ? 'hover:scale-105 cursor-pointer' : 'opacity-70 cursor-default'}`} 
                style={overdueTasks.length > 0 
                  ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }
                  : { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textMuted }
                }
              >
                <AlertCircle className="w-4 h-4" />
                <span style={{ fontWeight: 600 }}>{overdueTasks.length} Overdue</span>
              </button>

              {/* REDESIGNED DROPDOWN MENU */}
              {showOverdueDropdown && overdueTasks.length > 0 && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl shadow-xl z-50 overflow-hidden" 
                     style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
                  
                  {/* Header ng Dropdown */}
                  <div className="p-4 flex justify-between items-center border-b" style={{ borderColor: colors.border, background: colors.card2 }}>
                    <h4 className="text-xs uppercase tracking-wider" style={{ fontWeight: 700, color: '#ef4444' }}>Action Needed</h4>
                    <button onClick={() => setShowOverdueDropdown(false)} className="text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: colors.textSub }}>Close</button>
                  </div>
                  
                  {/* Listahan ng Overdue */}
                  <div className="max-h-72 overflow-y-auto p-3 space-y-3">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="p-4 rounded-2xl flex flex-col gap-3 transition-all" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                        
                        <div>
                          <div className="text-sm truncate mb-1" style={{ fontWeight: 600, color: colors.text }}>{task.title}</div>
                          <div className="text-xs" style={{ color: colors.textMuted }}>Missed on: {task.date}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = task._id || task.id;
                              

                              if (targetId && activeUpdateFn) {
                                activeUpdateFn(targetId, { date: REAL_TODAY });
                              }
                              
                              if (overdueTasks.length <= 1) setShowOverdueDropdown(false);
                            }} 
                            className="flex-1 py-2 px-3 rounded-xl text-xs transition-all hover:scale-[1.02]" 
                            style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, color: '#fff', fontWeight: 600, boxShadow: `0 4px 12px rgba(${accent.rgb}, 0.2)` }}>
                            Move to Today
                          </button>

                          {/* Aesthetic Delete Button */}
                          <button 
                            onClick={() => setTaskToDelete(task)} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-red-500/10 text-slate-400 hover:text-red-500" 
                            style={{ border: `1px solid ${colors.border}` }}
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
        
        <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Your progress starts here.
        </p>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: compactMode ? '0.75rem' : '1rem' }}>
        <StatCard colors={colors} icon={<Clock       className="w-4 h-4 text-indigo-400" />} label="Today's Study Time"  value={todayDisplay}                  sub={`${dailySessions.length} sessions today`}        iconBg="rgba(99,102,241,0.15)"  />
        <StatCard colors={colors} icon={<TrendingUp  className="w-4 h-4 text-green-400" />}  label="Productivity Score"  value={`${productivityScore}%`}       sub={`${allCompleted} of ${allTotal} tasks done`}     iconBg="rgba(34,197,94,0.12)" />
        <StatCard colors={colors} icon={<Flame className="w-4 h-4 text-orange-400" />} label="Current Streak" value={`${realStreak} ${realStreak <= 1 ? 'Day' : 'Days'}`} sub="Keep the fire burning!" iconBg="rgba(249,115,22,0.12)" />
        <StatCard colors={colors} icon={<CheckSquare className="w-4 h-4 text-purple-400" />} label="Tasks Completed"     value={`${allCompleted}/${allTotal}`} sub={`${allTotal - allCompleted} remaining overall`}  iconBg="rgba(139,92,246,0.12)" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Study Hours Chart */}
        <div className="lg:col-span-2 p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base capitalize" style={{ fontWeight: 600, color: colors.text }}>
                {chartPeriod} Study Hours
              </h3>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Total logs: {periodTotal} hrs</p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: colors.card2 ?? colors.bg, border: `1px solid ${colors.border}` }}>
              {['daily', 'weekly', 'monthly'].map(t => (
                <button key={t} onClick={() => setChartPeriod(t)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200 capitalize"
                  style={chartPeriod === t
                    ? { background: accent.main, color: '#fff', fontWeight: 700, boxShadow: `0 2px 8px rgba(${accent.rgb},0.4)`, cursor: 'pointer' }
                    : { color: colors.textSub, fontWeight: 500, background: 'transparent', cursor: 'pointer' }}>
                  {t === 'daily' ? 'Day' : t === 'weekly' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            {processedChartData.length > 0 ? (
              <AreaChart data={processedChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: accent.main, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="hours" stroke={accent.main} strokeWidth={2.5}
                  fill={accent.main} fillOpacity={0.12}
                  dot={{ fill: accent.main, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: accent.light, strokeWidth: 0 }} />
              </AreaChart>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: colors.textMuted }}>No data for this period</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Subject Breakdown */}
        <div className="p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-4" style={{ fontWeight: 600, color: colors.text }}>Subject Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            {subjectData.length > 0 ? (
              <BarChart data={subjectData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
                <Bar dataKey="hours" fill={accent.main} radius={[5, 5, 0, 0]} />
              </BarChart>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: colors.textMuted }}>No subject data</div>
            )}
          </ResponsiveContainer>
        </div>

        {/* Today's Tasks */}
        <div className="lg:col-span-2 p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>

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
                <div className="text-sm" style={{ fontWeight: 700, color: accent.main }}>{realXP.toLocaleString()} XP</div>
                <div className="text-xs" style={{ color: colors.textMuted }}>/ {lvl.nextXP.toLocaleString()}</div>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: colors.border }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${lvl.progress}%`, background: `linear-gradient(90deg, ${accent.main}, ${accent.light})`, boxShadow: `0 0 12px rgba(${accent.rgb},0.6)` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs" style={{ color: colors.textMuted }}>{lvl.nextXP - realXP} XP to Level {lvl.level + 1}</span>
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
              {recentBadges.length > 0 ? recentBadges.map((badge, index) => {
                const style = getBadgeStyle(index);
                return (
                  <div key={badge.id || index} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.iconBg }}>
                      <Award className="w-4 h-4" style={{ color: style.iconCol }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ fontWeight: 600, color: colors.text }}>{badge.name}</div>
                      <div className="text-xs" style={{ color: colors.textMuted }}>{badge.description || 'Badge Unlocked!'}</div>
                    </div>
                    <Star className="w-3 h-3 text-yellow-500 ml-auto" />
                  </div>
                );
              }) : (
                <div className="text-center py-4 text-xs" style={{ color: colors.textMuted }}>
                  No badges earned yet. Start studying!
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: colors.text }}>This Week</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Hours', value: `${weekHrs}h`, color: accent.main },
                { label: 'Sessions',    value: String(weeklySessions.length), color: '#22c55e'   },
                { label: 'Avg/Day',     value: `${weekAvg}h`, color: '#f97316' },
                { label: 'Streak',      value: String(realStreak), color: '#8b5cf6' },
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
      {/* 🌟 CUSTOM DELETE MODAL 🌟 */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-[24px] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200"
               style={{ background: colors.card, border: `1px solid ${colors.border}` }}>

            {/* Red Trash Icon Circle */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                 style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>

            {/* Modal Text */}
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Delete Task?</h3>
            <p className="text-sm mb-8" style={{ color: colors.textMuted, lineHeight: 1.6 }}>
              Are you sure you want to delete <span className="font-semibold" style={{ color: colors.text }}>"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>

            {/* Cancel & Delete Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const targetId = taskToDelete._id || taskToDelete.id;
                  
                  if (targetId && activeDeleteFn) {
                    activeDeleteFn(targetId); 
                  }
                  
                  setTaskToDelete(null);
                  if (overdueTasks.length <= 1) setShowOverdueDropdown(false);
                }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#ef4444', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)' }}
              >
                Delete
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}