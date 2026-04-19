import { useState, useEffect } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { useNotificationRefresh } from '../components/NotificationRefreshContext';
import { Plus, Target, Trash2, CheckCircle2, TrendingUp, Calendar, Edit, AlertCircle } from 'lucide-react';
import { createNewGoal, fetchGoals, updateGoal, editFullGoal, deleteGoalAPI } from '../api/goalApi';

const goalColors = ['#6366f1','#22c55e','#f97316','#8b5cf6','#06b6d4','#fbbf24','#ec4899'];
const subjects   = ['General','Mathematics','Physics','Chemistry','Biology','English','History','Computer Science', 'Others'];

export function Goals() {
  const [goals, setGoals] = useState([]); 
  const [showForm, setShowForm] = useState(false);
  const [filterPeriod, setFilter] = useState('all');
  const [customSubject, setCustomSubject] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null); 
  const [goalToDelete, setGoalToDelete] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const [newGoal, setNewGoal] = useState({
    title: '',
    subject: 'General',
    period: 'daily', 
    target: '',
    unit: 'hours',
    startDate: today, // Added Start Date
    deadline: '',
    color: '#6366f1'
  });

  const { colors, accent } = useAppearance();
  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, colorScheme: colors.inputScheme };

  const displayAlert = (type, message) => {
    setAlertMsg({ type, message });
    setTimeout(() => {
      setAlertMsg(null);
    }, 3000); 
  };

  useEffect(() => {
    const getMyGoals = async () => {
      try {
        const data = await fetchGoals();
        const formattedGoals = data.map(g => ({
          id: g._id,
          title: g.title,
          subject: g.category,
          current: g.currentAmount,
          target: g.targetAmount,
          unit: g.unit,
          period: g.timeframe,
          color: g.color,
          startDate: g.startDate ? g.startDate.split('T')[0] : '', 
          deadline: g.deadline ? g.deadline.split('T')[0] : ''
        }));
        setGoals(formattedGoals);
      } catch (error) {
        console.error("Error loading goals:", error);
      }
    };
    getMyGoals();
  }, []);

  const filtered       = goals.filter(g => filterPeriod === 'all' || g.period === filterPeriod);
  const completedGoals = goals.filter(g => g.current >= g.target).length;

  const submitHandler = async (e) => {
    if(e) e.preventDefault(); 

    if (!newGoal.title || !newGoal.target) {
       displayAlert('error', 'Please fill in the title and target amount!');
       return;
    }

    const finalSubject = newGoal.subject === 'Others' && customSubject.trim() !== '' 
      ? customSubject 
      : newGoal.subject;

    const existingGoal = editingId ? goals.find(g => g.id === editingId) : null;
    let adjustedCurrent = existingGoal ? existingGoal.current : 0;
    const newTarget = Number(newGoal.target);

    if (adjustedCurrent > newTarget) {
      adjustedCurrent = newTarget; 
    }

    try {
      const goalData = {
        title: newGoal.title,
        category: finalSubject,
        timeframe: newGoal.period,
        targetAmount: newTarget,
        currentAmount: adjustedCurrent,
        unit: newGoal.unit,
        startDate: newGoal.period === 'daily' ? newGoal.startDate : undefined, 
        deadline: newGoal.deadline,
        color: newGoal.color
      };

      if (editingId) {
        const updatedGoal = await editFullGoal(editingId, goalData);
        displayAlert('success', 'Goal Updated Successfully!');

        setGoals(goals.map(g => g.id === editingId ? {
          ...g,
          title: updatedGoal.title,
          subject: updatedGoal.category,
          target: updatedGoal.targetAmount,
          current: updatedGoal.currentAmount, 
          unit: updatedGoal.unit,
          period: updatedGoal.timeframe,
          color: updatedGoal.color,
          startDate: updatedGoal.startDate ? updatedGoal.startDate.split('T')[0] : '',
          deadline: updatedGoal.deadline ? updatedGoal.deadline.split('T')[0] : ''
        } : g));
      } else {
        const savedGoal = await createNewGoal(goalData);
        displayAlert('success', 'Goal Created Successfully!');

        const newFormattedGoal = {
          id: savedGoal._id,
          title: savedGoal.title,
          subject: savedGoal.category,
          current: savedGoal.currentAmount,
          target: savedGoal.targetAmount,
          unit: savedGoal.unit,
          period: savedGoal.timeframe,
          color: savedGoal.color,
          startDate: savedGoal.startDate ? savedGoal.startDate.split('T')[0] : '',
          deadline: savedGoal.deadline ? savedGoal.deadline.split('T')[0] : ''
        };
        setGoals([...goals, newFormattedGoal]);
      }

      setShowForm(false);
      setEditingId(null);
      setCustomSubject('');
      setNewGoal({ title: '', subject: 'General', period: 'daily', target: '', unit: 'hours', startDate: today, deadline: '', color: '#6366f1' });

    } catch (error) {
      console.error(error);
      displayAlert('error', 'Error saving. Make sure your backend is running!');
    }
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoalAPI(goalToDelete);
      setGoals(goals.filter(g => g.id !== goalToDelete));
      displayAlert('success', 'Goal Deleted!');
    } catch (error) {
      console.error("Error deleting goal:", error);
      displayAlert('error', 'Hindi mabura sa database. Make sure backend is running.');
    }
    setGoalToDelete(null); 
  };

  const updateProgress = async (id, change) => {
    const goalToUpdate = goals.find(g => g.id === id);
    if (!goalToUpdate) return;

    const newAmount = Math.max(0, goalToUpdate.current + change);
    setGoals(goals.map(g => g.id === id ? { ...g, current: newAmount } : g));

    try {
      await updateGoal(id, newAmount);
    } catch (error) {
      console.error("Database progress not saved:", error);
      displayAlert('error', 'Progress not saved in backend.');
    }
  };

  const handleEditClick = (goal) => {
    setEditingId(goal.id);
    setNewGoal({
      title: goal.title,
      subject: subjects.includes(goal.subject) ? goal.subject : 'Others',
      period: goal.period,
      target: goal.target,
      unit: goal.unit,
      startDate: goal.startDate || today,
      deadline: goal.deadline,
      color: goal.color
    });
    if (!subjects.includes(goal.subject)) {
      setCustomSubject(goal.subject);
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  return (
    <div className="p-4 min-h-full relative" style={{ background: colors.bg }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, letterSpacing: '-0.4px', color: colors.text }}>Goals</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>{completedGoals}/{goals.length} goals achieved</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setNewGoal({ title: '', subject: 'General', period: 'daily', target: '', unit: 'hours', startDate: today, deadline: '', color: '#6366f1' }); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm hover:opacity-90 hover:scale-105 transition-transform"
          style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600, boxShadow: `0 0 20px rgba(${accent.rgb},0.35)` }}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* INLINE ALERT MESSAGE */}
      {alertMsg && (
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2"
          style={{ 
            background: alertMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
            border: `1px solid ${alertMsg.type === 'error' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
            color: alertMsg.type === 'error' ? '#ef4444' : '#22c55e'
          }}>
          {alertMsg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span className="text-sm" style={{ fontWeight: 600 }}>{alertMsg.message}</span>
        </div>
      )}

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

      {/* Add/Edit Goal Form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-2xl transition-all" style={{ background: colors.card, border: `1px solid rgba(${accent.rgb},0.3)`, boxShadow: `0 0 20px rgba(${accent.rgb},0.08)` }}>
          <h3 className="text-sm mb-4" style={{ fontWeight: 600, color: colors.text }}>
            {editingId ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Title */}
            <input className="col-span-1 sm:col-span-2 px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
              placeholder="Goal title (e.g. Study 20 hours this week)"
              value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} />
            
            {/* Subject Dropdown */}
            <div className="flex flex-col gap-2 w-full">
              <select className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                value={newGoal.subject} onChange={e => setNewGoal({ ...newGoal, subject: e.target.value })}>
                {subjects.map(s => (
                  <option key={s} value={s}>{s === 'Others' ? 'Others (Please specify)' : s}</option>
                ))}
              </select>
              {newGoal.subject === 'Others' && (
                <input type="text" className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                  placeholder="Type specific subject..."
                  value={customSubject} onChange={e => setCustomSubject(e.target.value)} />
              )}
            </div>

            {/* Period Dropdown */}
            <select className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
              value={newGoal.period} onChange={e => setNewGoal({ ...newGoal, period: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            
            {/* Target & Unit */}
            <div className="col-span-1 sm:col-span-2 flex flex-col xs:flex-row gap-2 w-full">
              <input type="number" className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                placeholder="Target Amount" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} />
              <input className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                placeholder="Unit (hrs, sessions...)" value={newGoal.unit} onChange={e => setNewGoal({ ...newGoal, unit: e.target.value })} />
            </div>
            
            {/* --- DYNAMIC DATE AREA (FROM & TO) --- */}
            <div className="col-span-1 sm:col-span-2 p-3 rounded-xl transition-all" style={{ background: `rgba(${accent.rgb}, 0.05)`, border: `1px dashed rgba(${accent.rgb}, 0.4)` }}>
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: accent.main, fontWeight: 700 }}>
                <Calendar className="w-3.5 h-3.5" />
                {newGoal.period === 'daily' ? 'Set Daily Goal Range' : newGoal.period === 'weekly' ? 'Set Weekly Deadline' : 'Set Monthly Deadline'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                {newGoal.period === 'daily' && (
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textSub, fontWeight: 600 }}>From</span>
                    <input type="date" className="px-3 py-2 rounded-lg text-sm w-full outline-none" style={inputStyle}
                      value={newGoal.startDate} onChange={e => setNewGoal({ ...newGoal, startDate: e.target.value })} />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: colors.textSub, fontWeight: 600 }}>
                    {newGoal.period === 'daily' ? 'To' : 'Target Date'}
                  </span>
                  <input type="date" min={newGoal.period === 'daily' ? newGoal.startDate : today} className="px-3 py-2 rounded-lg text-sm w-full outline-none" style={inputStyle}
                    value={newGoal.deadline} onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} />
                </div>
              </div>

              {/* Instruction Text for weekly and monthly */}
              {newGoal.period !== 'daily' && (
                <p className="text-[11px] mt-2 italic" style={{ color: colors.textMuted }}>
                  * Select the target date when your {newGoal.period} cycle ends.
                </p>
              )}
            </div>
            
            {/* Colors */}
            <div className="col-span-1 sm:col-span-2 flex items-center gap-2 flex-wrap w-full mt-1">
              <span className="text-sm" style={{ color: colors.textSub }}>Color:</span>
              <div className="flex gap-1.5 flex-wrap">
                {goalColors.map(c => (
                  <button key={c} onClick={() => setNewGoal({ ...newGoal, color: c })}
                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                    style={{ background: c, boxShadow: newGoal.color === c ? `0 0 0 2px ${colors.bg}, 0 0 0 4px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 mt-5">
            <button onClick={submitHandler} className="px-5 py-2 rounded-xl text-white text-sm hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
              {editingId ? 'Save Changes' : 'Create Goal'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setCustomSubject(''); setNewGoal({ title: '', subject: 'General', period: 'daily', target: '', unit: 'hours', startDate: today, deadline: '', color: '#6366f1' }); }} className="px-5 py-2 rounded-xl text-sm"
              style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all','daily','weekly','monthly'].map(p => (
          <button key={p} onClick={() => setFilter(p)} className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
            style={filterPeriod === p
              ? { background: `rgba(${accent.rgb},0.2)`, color: accent.light, border: `1px solid rgba(${accent.rgb},0.35)`, fontWeight: 600 }
              : { background: colors.card, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            {p === 'all' ? 'All Goals' : p}
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
                        {/* UPDATE: Ipapakita rito yung Range kapag Daily */}
                        <span>{goal.period} · {goal.period === 'daily' && goal.startDate ? `${goal.startDate} to ` : ''}{goal.deadline || 'No target date'}</span>
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
                  
                  <button onClick={() => handleEditClick(goal)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                    style={{ color: colors.textMuted }}>
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button onClick={() => setGoalToDelete(goal.id)}
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

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all animate-in fade-in" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="p-6 w-full max-w-sm rounded-2xl shadow-2xl transition-all animate-in zoom-in-95"
               style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl" style={{ fontWeight: 700, color: colors.text }}>Delete Goal?</h3>
                <p className="text-sm mt-2" style={{ color: colors.textSub }}>
                  Are you sure you want to delete this goal? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => setGoalToDelete(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-colors"
                        style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
                        style={{ background: '#ef4444', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}