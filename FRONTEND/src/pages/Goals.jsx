import { useState } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { Plus, Target, Trash2, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

const initialGoals = [
  { id: 1, title: 'Study 20 hours this week',     subject: 'General',     current: 14.5, target: 20,  unit: 'hours',    period: 'weekly',  color: '#6366f1', deadline: '2026-03-29' },
  { id: 2, title: 'Complete 50 Math sessions',    subject: 'Mathematics', current: 32,   target: 50,  unit: 'sessions', period: 'monthly', color: '#22c55e', deadline: '2026-03-31' },
  { id: 3, title: 'Finish Physics textbook',       subject: 'Physics',     current: 7,    target: 12,  unit: 'chapters', period: 'monthly', color: '#f97316', deadline: '2026-03-31' },
  { id: 4, title: '30-min daily reading streak',  subject: 'English',     current: 12,   target: 30,  unit: 'days',     period: 'monthly', color: '#8b5cf6', deadline: '2026-04-01' },
  { id: 5, title: 'Solve 100 chemistry problems', subject: 'Chemistry',   current: 67,   target: 100, unit: 'problems', period: 'monthly', color: '#06b6d4', deadline: '2026-03-31' },
];

const goalColors = ['#6366f1','#22c55e','#f97316','#8b5cf6','#06b6d4','#fbbf24','#ec4899'];
// Added 'Others' to the subjects array
const subjects   = ['General','Mathematics','Physics','Chemistry','Biology','English','History','Computer Science', 'Others'];

export function Goals() {
  const [goals, setGoals]       = useState(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [filterPeriod, setFilter] = useState('all');
  
  // New state for the custom subject text input
  const [customSubject, setCustomSubject] = useState('');

  const [newGoal, setNewGoal]   = useState({
    title: '', subject: 'General', current: 0, target: 10,
    unit: 'hours', period: 'weekly', color: '#6366f1', deadline: '2026-03-31',
  });

  const { colors, accent } = useAppearance();
  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme };

  const filtered       = goals.filter(g => filterPeriod === 'all' || g.period === filterPeriod);
  const completedGoals = goals.filter(g => g.current >= g.target).length;

  // Get today's date in YYYY-MM-DD format for the date picker minimum limit
  const today = new Date().toISOString().split('T')[0];

  const addGoal = () => { 
    // Logic to check if 'Others' is selected, save the custom subject instead
    const finalSubject = newGoal.subject === 'Others' && customSubject.trim() !== '' 
      ? customSubject 
      : newGoal.subject;

    setGoals([...goals, { ...newGoal, subject: finalSubject, id: Date.now() }]); 
    setShowForm(false); 
    setCustomSubject(''); // Reset custom subject input
  };
  
  const removeGoal     = (id) => setGoals(goals.filter(g => g.id !== id));
  const updateProgress = (id, change) =>
    setGoals(goals.map(g => g.id === id ? { ...g, current: Math.max(0, g.current + change) } : g));

  return (
    <div className="p-4 min-h-full" style={{ background: colors.bg }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Goals</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>{completedGoals}/{goals.length} goals achieved</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90 hover:scale-105 transition-transform"
          style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 20px rgba(${accent.rgb},0.35)` }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Active Goals', value: goals.length,              icon: <Target       className="w-4 h-4 text-indigo-400" />, bg: 'rgba(99,102,241,0.12)',  color: accent.main },
          { label: 'Completed',    value: completedGoals,            icon: <CheckCircle2 className="w-4 h-4 text-green-400"  />, bg: 'rgba(34,197,94,0.12)',   color: '#22c55e'   },
          { label: 'In Progress',  value: goals.length - completedGoals, icon: <TrendingUp className="w-4 h-4 text-orange-400" />, bg: 'rgba(249,115,22,0.12)', color: '#f97316'   },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl flex items-center gap-3" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: s.color, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: colors.textSub }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-2xl transition-all" style={{ background: colors.card, border: `1px solid rgba(${accent.rgb},0.3)`, boxShadow: `0 0 20px rgba(${accent.rgb},0.08)` }}>
          <h3 className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>Create New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="col-span-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
              placeholder="Goal title (e.g. Study 20 hours this week)"
              value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
            
            {/* Subject Dropdown & Conditional Custom Input */}
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                value={newGoal.subject} onChange={e => setNewGoal({ ...newGoal, subject: e.target.value })}>
                {subjects.map(s => (
                  <option key={s} value={s}>{s === 'Others' ? 'Others (Please specify)' : s}</option>
                ))}
              </select>
              {newGoal.subject === 'Others' && (
                <input type="text" className="px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                  placeholder="Type specific subject..."
                  value={customSubject} onChange={e => setCustomSubject(e.target.value)} />
              )}
            </div>

            <select className="px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
              value={newGoal.period} onChange={e => setNewGoal({ ...newGoal, period: e.target.value })}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="flex gap-2">
              <input type="number" className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                placeholder="Target" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: Number(e.target.value) })} />
              <input className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                placeholder="Unit (hrs, sessions...)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} />
            </div>
            
            {/* Date Input with min validation added */}
            <input type="date" min={today} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
              value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
            
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: colors.textSub }}>Color:</span>
              {goalColors.map(c => (
                <button key={c} onClick={() => setNewGoal({ ...newGoal, color: c })}
                  className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                  style={{ background: c, boxShadow: newGoal.color === c ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${c}` : 'none' }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addGoal} className="px-5 py-2 rounded-xl text-white text-sm hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
              Create Goal
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm"
              style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','weekly','monthly'].map(p => (
          <button key={p} onClick={() => setFilter(p)} className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
            style={filterPeriod === p
              ? { background: `rgba(${accent.rgb},0.2)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.35)`, fontWeight: 600 }
              : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            {p === 'all' ? 'All Goals' : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {filtered.map(goal => {
          const pct  = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const done = goal.current >= goal.target;
          return (
            <div key={goal.id} className="p-4 rounded-2xl group transition-all duration-200"
              style={{ background: colors.card, border: `1px solid ${done ? goal.color + '40' : colors.border}`, boxShadow: done ? `0 0 20px ${goal.color}15` : 'none' }}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${goal.color}20` }}>
                    {done ? <CheckCircle2 className="w-5 h-5" style={{ color: goal.color }} /> : <Target className="w-5 h-5" style={{ color: goal.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ fontWeight: 600, color: done ? colors.textMuted : colors.text, textDecoration: done ? 'line-through' : 'none' }}>
                      {goal.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: `${goal.color}20`, color: goal.color, fontWeight: 500 }}>{goal.subject}</span>
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.textMuted }}>
                        <Calendar className="w-3 h-3" />
                        <span>{goal.period} · {goal.deadline}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    <div className="text-sm" style={{ fontWeight: 700, color: colors.text }}>
                      {goal.current}<span className="text-xs" style={{ fontWeight: 400, color: colors.textMuted }}>/{goal.target} {goal.unit}</span>
                    </div>
                    <div className="text-xs" style={{ color: goal.color, fontWeight: 600 }}>{pct}%</div>
                  </div>
                  <button onClick={() => removeGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:text-red-400 hover:bg-red-400/10 transition-all"
                    style={{ color: colors.textMuted }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="h-2.5 rounded-full mb-3" style={{ background: colors.border }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: goal.color, boxShadow: `0 0 10px ${goal.color}50` }} />
              </div>

              {!done ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: colors.textMuted }}>{goal.target - goal.current} {goal.unit} remaining</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateProgress(goal.id, -1)} className="w-7 h-7 rounded-lg text-sm transition-colors hover:bg-white/5"
                      style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>−</button>
                    <span className="text-xs" style={{ color: colors.textMuted }}>Update</span>
                    <button onClick={() => updateProgress(goal.id, 1)} className="w-7 h-7 rounded-lg text-sm transition-colors hover:bg-white/5"
                      style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>+</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs" style={{ fontWeight: 600 }}>Goal Achieved!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}