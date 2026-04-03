import { useState } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';
import { TrendingUp, Clock, Zap, BookOpen, Award } from 'lucide-react';

// ─── Dummy data ───────────────────────────────────────────────────────────────
const weeklyData = [
  { day: 'Mon', hours: 3.5, target: 4 }, { day: 'Tue', hours: 4.2, target: 4 },
  { day: 'Wed', hours: 2.8, target: 4 }, { day: 'Thu', hours: 5.1, target: 4 },
  { day: 'Fri', hours: 3.9, target: 4 }, { day: 'Sat', hours: 6.2, target: 4 },
  { day: 'Sun', hours: 1.5, target: 4 },
];

const monthlyData = [
  { week: 'Wk 1', hours: 22.4 }, { week: 'Wk 2', hours: 28.1 },
  { week: 'Wk 3', hours: 19.7 }, { week: 'Wk 4', hours: 27.2 },
];

const subjectPie = [
  { name: 'Mathematics', value: 12.5, color: '#6366f1' },
  { name: 'Physics',     value: 8.3,  color: '#22c55e' },
  { name: 'Chemistry',   value: 6.7,  color: '#f97316' },
  { name: 'Biology',     value: 9.1,  color: '#8b5cf6' },
  { name: 'English',     value: 4.2,  color: '#06b6d4' },
];

const hourlyData = [
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
  const [tab, setTab] = useState('Weekly');
  const { colors, accent } = useAppearance();

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>Detailed insights into your study habits</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          {['Weekly','Monthly'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-lg text-sm transition-all"
              style={tab === t ? { background: accent.main, color: '#fff', fontWeight: 600 } : { color: colors.textMuted }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: <Clock      className="w-4 h-4 text-indigo-400" />, label: 'Total Study Time', value: '97.4h',    sub: 'This month',           bg: 'rgba(99,102,241,0.12)'  },
          { icon: <Zap        className="w-4 h-4 text-green-400"  />, label: 'Avg Daily Hours',  value: '3.9h',     sub: '↑ 12% vs last month',  bg: 'rgba(34,197,94,0.12)'   },
          { icon: <TrendingUp className="w-4 h-4 text-orange-400" />, label: 'Best Day',         value: 'Saturday', sub: '6.2 hrs average',       bg: 'rgba(249,115,22,0.12)'  },
          { icon: <Award      className="w-4 h-4 text-purple-400" />, label: 'Productivity',     value: '87%',      sub: '↑ 5% this week',        bg: 'rgba(139,92,246,0.12)'  },
        ].map(k => (
          <div key={k.label} className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: colors.textSub }}>{k.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: k.bg }}>{k.icon}</div>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700, color: colors.text }}>{k.value}</div>
            <div className="text-xs mt-1" style={{ color: colors.textMuted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="mb-5">
            <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>{tab} Study Hours</h3>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              {tab === 'Weekly' ? 'Total: 27.2 hrs · Target: 28 hrs' : 'Total: 97.4 hrs · Target: 80 hrs'}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            {tab === 'Weekly' ? (
              <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.border, strokeWidth: 1 }} />
                <Area type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 4"
                  fill="#22c55e" fillOpacity={0.08} name="target" dot={false} />
                <Area type="monotone" dataKey="hours" stroke={accent.main} strokeWidth={2.5}
                  fill={accent.main} fillOpacity={0.15} name="hours"
                  dot={{ fill: accent.main, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: accent.light }} />
              </AreaChart>
            ) : (
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
                <Bar dataKey="hours" fill={accent.main} radius={[6,6,0,0]} name="hours" />
              </BarChart>
            )}
          </ResponsiveContainer>
          {tab === 'Weekly' && (
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
        <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-4" style={{ fontWeight: 600, color: colors.text }}>Time by Subject</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={subjectPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {subjectPie.map((entry, index) => <Cell key={`pie-cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {subjectPie.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs" style={{ color: colors.textSub }}>{s.name}</span>
                </div>
                <span className="text-xs" style={{ fontWeight: 600, color: colors.text }}>{s.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="mb-5">
            <h3 className="text-base" style={{ fontWeight: 600, color: colors.text }}>Peak Productivity Hours</h3>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Average sessions per time block</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid stroke={colors.chartGrid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<HeatmapTooltip />} cursor={{ fill: `rgba(${accent.rgb},0.06)` }} />
              <Bar dataKey="sessions" radius={[4,4,0,0]}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`hourly-cell-${index}`} fill={entry.sessions >= 6 ? accent.main : entry.sessions >= 4 ? accent.light : colors.border} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            {[{ label: 'Peak (6+)', color: accent.main }, { label: 'Active (4–5)', color: accent.light }, { label: 'Low (<4)', color: colors.border }].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <h3 className="text-base mb-5" style={{ fontWeight: 600, color: colors.text }}>Subject Performance</h3>
          <div className="space-y-4">
            {subjectPie.map(s => {
              const max = Math.max(...subjectPie.map(x => x.value));
              const pct = Math.round((s.value / max) * 100);
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
            <p className="text-xs" style={{ color: colors.textSub }}>Mathematics is your strongest subject this week. Consider balancing with English for 1+ more hour.</p>
          </div>
        </div>
      </div>
    </div>
  );
}