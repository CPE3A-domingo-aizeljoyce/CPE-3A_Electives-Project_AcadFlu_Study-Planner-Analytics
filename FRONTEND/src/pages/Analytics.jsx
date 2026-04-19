import { useState, useEffect, useMemo } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';
import { TrendingUp, Clock, Zap, BookOpen, Award } from 'lucide-react';
import { fetchAnalyticsData } from '../api/analyticsApi';

// ─── Dummy / Fallback Data  ────
const fallbackWeekly = [
  { day: 'Mon', hours: 3.5, target: 4 }, { day: 'Tue', hours: 4.2, target: 4 },
  { day: 'Wed', hours: 2.8, target: 4 }, { day: 'Thu', hours: 5.1, target: 4 },
  { day: 'Fri', hours: 3.9, target: 4 }, { day: 'Sat', hours: 6.2, target: 4 },
  { day: 'Sun', hours: 1.5, target: 4 },
];

const fallbackMonthly = [
  { week: 'Wk 1', hours: 22.4 }, { week: 'Wk 2', hours: 28.1 },
  { week: 'Wk 3', hours: 19.7 }, { week: 'Wk 4', hours: 27.2 },
];

const fallbackDaily = [
  { day: '8AM', hours: 1.2, target: 2 }, { day: '10AM', hours: 0.8, target: 2 },
  { day: '2PM', hours: 2.1, target: 2 }, { day: '5PM',  hours: 1.5, target: 2 },
];

const fallbackSubjectPie = [
  { name: 'Mathematics', value: 12.5, color: '#6366f1' },
  { name: 'Physics',     value: 8.3,  color: '#22c55e' },
  { name: 'Chemistry',   value: 6.7,  color: '#f97316' },
  { name: 'Biology',     value: 9.1,  color: '#8b5cf6' },
  { name: 'English',     value: 4.2,  color: '#06b6d4' },
];

const fallbackHourlyData = [
  { hour: '6AM',  sessions: 1 }, { hour: '8AM',  sessions: 4 }, { hour: '10AM', sessions: 6 },
  { hour: '12PM', sessions: 3 }, { hour: '2PM',  sessions: 5 }, { hour: '4PM',  sessions: 4 },
  { hour: '6PM',  sessions: 7 }, { hour: '8PM',  sessions: 5 }, { hour: '10PM', sessions: 2 },
];

// ─── Tooltip components ───────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  const { colors } = useAppearance();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 10, padding: '8px 14px' }}>
      <p style={{ color: colors.textSub, fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke || '#6366f1', fontSize: 13, fontWeight: 600 }}>
          {p.name}: {p.value} hrs
        </p>
      ))}
    </div>
  );
}

function HeatmapTooltip({ active, payload, label }) {
  const { colors, accent } = useAppearance();
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 10, padding: '8px 14px' }}>
      <p style={{ color: colors.textSub, fontSize: 11 }}>{label}: <span style={{ color: accent.main, fontWeight: 700 }}>{payload[0].value} sessions</span></p>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  const { colors } = useAppearance();
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: 10, padding: '8px 14px' }}>
      <p style={{ color: d.payload.color, fontSize: 13, fontWeight: 600 }}>{d.name}</p>
      <p style={{ color: colors.textSub, fontSize: 12 }}>{d.value} hrs</p>
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
export function Analytics() {
  const [timeframe, setTimeframe] = useState('weekly');
  const [studyData, setStudyData] = useState([]);
  const { colors, accent } = useAppearance();

  useEffect(() => {
    const getAnalytics = async () => {
      try {
        const data = await fetchAnalyticsData(timeframe);
        setStudyData(data);
      } catch (error) {
        console.error("Failed to load analytics from DB:", error);
      }
    };
    getAnalytics();
  }, [timeframe]);

  // 2. Math Logic & Data Processing
  const { displayTotalHours, displayAvgDaily, displaySubjectPie, displayChartData, displayHourlyData } = useMemo(() => {
    const isDataEmpty = studyData.length === 0;

    if (isDataEmpty) {
      return {
        displayTotalHours: timeframe === 'monthly' ? '97.4' : timeframe === 'weekly' ? '27.2' : '5.6',
        displayAvgDaily: '3.9',
        displaySubjectPie: fallbackSubjectPie,
        displayChartData: timeframe === 'monthly' ? fallbackMonthly : timeframe === 'weekly' ? fallbackWeekly : fallbackDaily,
        displayHourlyData: fallbackHourlyData
      };
    }

    const totalMinutes = studyData.reduce((sum, session) => sum + session.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const daysCount = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
    const avgDaily = (totalHours / daysCount).toFixed(1);

    // Grouping for Subjects (Pie Chart)
    const subjectMap = {};
    studyData.forEach(s => {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.durationMinutes;
    });
    const computedSubjects = Object.keys(subjectMap).map((key, i) => ({
      name: key,
      value: Number((subjectMap[key] / 60).toFixed(1)),
      color: ['#6366f1', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#fbbf24', '#ec4899'][i % 7]
    })).sort((a, b) => b.value - a.value);

    // Grouping for Main Chart (Area/Bar)
    let chartData = [];
    if (timeframe === 'weekly') {
      const daysMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      studyData.forEach(s => {
        const date = new Date(s.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (daysMap[dayName] !== undefined) daysMap[dayName] += s.durationMinutes;
      });
      chartData = Object.keys(daysMap).map(day => ({ day, hours: Number((daysMap[day] / 60).toFixed(1)), target: 4 }));
    } else if (timeframe === 'monthly') {
      const weeksMap = { 'Wk 1': 0, 'Wk 2': 0, 'Wk 3': 0, 'Wk 4': 0 };
      studyData.forEach(s => {
        const dayOfMonth = new Date(s.date).getDate();
        const weekStr = dayOfMonth <= 7 ? 'Wk 1' : dayOfMonth <= 14 ? 'Wk 2' : dayOfMonth <= 21 ? 'Wk 3' : 'Wk 4';
        weeksMap[weekStr] += s.durationMinutes;
      });
      chartData = Object.keys(weeksMap).map(week => ({ week, hours: Number((weeksMap[week] / 60).toFixed(1)) }));
    } else { // daily
      const hoursMap = {};
      studyData.forEach(s => {
        const hour = new Date(s.date).getHours();
        const label = `${hour % 12 || 12}${hour >= 12 ? 'PM' : 'AM'}`;
        hoursMap[label] = (hoursMap[label] || 0) + s.durationMinutes;
      });
      chartData = Object.keys(hoursMap).map(day => ({ day, hours: Number((hoursMap[day] / 60).toFixed(1)), target: 2 }));
    }

    return {
      displayTotalHours: totalHours,
      displayAvgDaily: avgDaily,
      displaySubjectPie: computedSubjects,
      displayChartData: chartData,
      displayHourlyData: fallbackHourlyData // (Requires complex grouping, keeping fallback visual for now)
    };
  }, [studyData, timeframe]);

  const displayTimeframe = timeframe.charAt(0).toUpperCase() + timeframe.slice(1);

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>Detailed insights into your study habits</p>
        </div>
        
        {/* DAILY, WEEKLY, MONTHLY BUTTONS */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          {['daily', 'weekly', 'monthly'].map(t => (
            <button key={t} onClick={() => setTimeframe(t)} className="px-4 py-2 rounded-lg text-sm transition-all capitalize"
              style={timeframe === t ? { background: accent.main, color: '#fff', fontWeight: 600 } : { color: colors.textMuted }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Clock      className="w-4 h-4 text-indigo-400" />, label: 'Total Study Time', value: `${displayTotalHours}h`, sub: `This ${timeframe}`,       bg: 'rgba(99,102,241,0.12)'  },
          { icon: <Zap        className="w-4 h-4 text-green-400"  />, label: 'Avg Daily Hours',  value: `${displayAvgDaily}h`,   sub: 'Active study',              bg: 'rgba(34,197,94,0.12)'   },
          { icon: <TrendingUp className="w-4 h-4 text-orange-400" />, label: 'Best Subject',     value: displaySubjectPie[0]?.name || '-', sub: 'Most hours logged', bg: 'rgba(249,115,22,0.12)'  },
          { icon: <Award      className="w-4 h-4 text-purple-400" />, label: 'Productivity',     value: '87%',                   sub: '↑ 5% this week',            bg: 'rgba(139,92,246,0.12)'  },
        ].map(k => (
          <div key={k.label} className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs truncate mr-1" style={{ color: colors.textSub }}>{k.label}</span>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>{k.icon}</div>
            </div>
            <div style={{ fontWeight: 700, color: colors.text, fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>{k.value}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>{displayTimeframe} Study Hours</h3>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              Total: {displayTotalHours} hrs logs
            </p>
          <ResponsiveContainer width="100%" height={200}>
            {timeframe === 'monthly' ? (
              <BarChart data={displayChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
                <Bar dataKey="hours" fill={accent.main} radius={[6,6,0,0]} name="hours" />
              </BarChart>
            ) : (
              <AreaChart data={displayChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.border, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4" fill="#22c55e" fillOpacity={0.08} name="target" dot={false} />
                <Area type="monotone" dataKey="hours" stroke={accent.main} strokeWidth={2.5} fill={accent.main} fillOpacity={0.15} name="hours" dot={{ fill: accent.main, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: accent.light }} />
              </AreaChart>
            )}
          </ResponsiveContainer>
          {timeframe !== 'monthly' && (
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: accent.main }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ border: '1px dashed #22c55e' }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Target</span>
              </div>
            </div>
          )}
        </div>

        {/* Subject Pie */}
        <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-4" style={{ fontWeight: 600, color: colors.text }}>Time by Subject</h3>
          {displaySubjectPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={displaySubjectPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {displaySubjectPie.map((entry, index) => <Cell key={`pie-cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {displaySubjectPie.map(s => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs truncate max-w-[100px]" style={{ color: colors.textSub }}>{s.name}</span>
                    </div>
                    <span className="text-xs" style={{ fontWeight: 600, color: colors.text }}>{s.value}h</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-xs" style={{ color: colors.textMuted }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="mb-5">
            <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>Peak Productivity Hours</h3>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Average sessions per time block</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={displayHourlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<HeatmapTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
              <Bar dataKey="sessions" radius={[4,4,0,0]}>
                {displayHourlyData.map((entry, index) => (
                  <Cell key={`hourly-cell-${index}`} fill={entry.sessions >= 6 ? accent.main : entry.sessions >= 4 ? accent.light : colors.border} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-3">
            {[{ label: 'Peak (6+)', color: accent.main }, { label: 'Active (4–5)', color: accent.light }, { label: 'Low (<4)', color: colors.border }].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl min-w-0 overflow-hidden" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-5" style={{ fontWeight: 600, color: colors.text }}>Subject Performance</h3>
          <div className="space-y-4">
            {displaySubjectPie.map(s => {
              const max = Math.max(...displaySubjectPie.map(x => x.value));
              const pct = max === 0 ? 0 : Math.round((s.value / max) * 100);
              return (
                <div key={s.name}>
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-sm" style={{ color: colors.textSub }}>{s.name}</span>
                    </div>
                    <span className="text-sm" style={{ color: colors.textSub }}>{s.value}h</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: colors.border }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}60` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 p-3 rounded-xl flex items-center gap-3"
            style={{ background: `rgba(${accent.rgb},0.08)`, border: `1px solid rgba(${accent.rgb},0.2)` }}>
            <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: accent.main }} />
            <p className="text-xs" style={{ color: colors.textSub }}>
              {displaySubjectPie.length > 0 
                ? `${displaySubjectPie[0].name} is your strongest subject this ${timeframe}. Keep it up!` 
                : "No study records yet. Start a session to see insights!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}