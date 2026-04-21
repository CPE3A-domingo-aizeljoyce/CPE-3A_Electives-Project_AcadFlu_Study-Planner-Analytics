import { useState, useEffect } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { Plus, Target, Trash2, X, CheckCircle, Circle, Pencil, Save, RotateCcw } from 'lucide-react';
import axios from 'axios'; 

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SUBJECTS = ['General', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Computer Science', 'Other...'];
const GOAL_COLORS = ['#6366f1', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#fbbf24', '#ec4899'];

export function Goals() {
  const { colors, accent } = useAppearance();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Animation State
  const [fadingId, setFadingId] = useState(null);
  
  // Create Form State
  const [newGoal, setNewGoal] = useState({ title: '', subject: 'General', color: GOAL_COLORS[0] });
  const [customSubject, setCustomSubject] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', subject: '', color: '' });
  const [editCustomSubject, setEditCustomSubject] = useState('');

  // Delete Modal State
  const [goalToDelete, setGoalToDelete] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/goals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGoals(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error("Failed to fetch goals", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return alert("Please enter a goal title!");

    const finalSubject = newGoal.subject === 'Other...' 
      ? (customSubject.trim() || 'General') 
      : newGoal.subject;

    try {
      const res = await axios.post(`${API_BASE}/api/goals`, {
        ...newGoal,
        subject: finalSubject
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGoals([res.data, ...goals]);
      setNewGoal({ title: '', subject: 'General', color: GOAL_COLORS[0] });
      setCustomSubject('');
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create goal", err);
      alert("Error saving goal.");
    }
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      await axios.delete(`${API_BASE}/api/goals/${goalToDelete._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGoals(goals.filter(g => g._id !== goalToDelete._id));
      setGoalToDelete(null); 
    } catch (err) {
      console.error("Failed to delete goal", err);
    }
  };

  const cancelDelete = () => {
    setGoalToDelete(null);
  };

  const toggleGoalStatus = async (goal) => {
    const updatedStatus = goal.status === 'completed' ? 'active' : 'completed';
    
    // 1. I-trigger ang fade out animation
    setFadingId(goal._id);

    try {
      // 2. Maghintay ng 300ms para matapos ang fade out bago ilipat
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. I-update sa backend at ilipat ang listahan
      const res = await axios.put(`${API_BASE}/api/goals/${goal._id}`, { status: updatedStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGoals(goals.map(g => g._id === goal._id ? res.data : g));
      
    } catch (err) {
      console.error("Failed to update goal", err);
    } finally {
      // 4. Tanggalin ang animation lock
      setFadingId(null);
    }
  };

  const startEditing = (goal) => {
    setEditingId(goal._id);
    const isStandard = SUBJECTS.includes(goal.subject);
    setEditData({ 
      title: goal.title, 
      subject: isStandard ? goal.subject : 'Other...', 
      color: goal.color 
    });
    setEditCustomSubject(isStandard ? '' : goal.subject);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdateGoal = async (id) => {
    if (!editData.title.trim()) return alert("Title cannot be empty!");

    const finalSubject = editData.subject === 'Other...' 
      ? (editCustomSubject.trim() || 'General') 
      : editData.subject;

    try {
      const res = await axios.put(`${API_BASE}/api/goals/${id}`, {
        title: editData.title,
        subject: finalSubject,
        color: editData.color
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGoals(goals.map(g => g._id === id ? res.data : g));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update goal", err);
      alert("Error updating goal.");
    }
  };

  // --- SEPARATE ACTIVE AND COMPLETED GOALS ---
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed');

  // --- GROUP ONLY ACTIVE GOALS ---
  const activeGroupedGoals = activeGoals.reduce((groups, goal) => {
    const subj = goal.subject || 'General';
    if (!groups[subj]) groups[subj] = [];
    groups[subj].push(goal);
    return groups;
  }, {});

  const activeCount = activeGoals.length;
  const completedCount = completedGoals.length;
  const inputClass = "px-4 py-2.5 rounded-xl text-sm outline-none w-full";

  return (
    <div className="min-h-full flex flex-col gap-5 p-6" style={{ background: colors.bg }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 700, color: colors.text }}>Goals</h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Keep your eyes on the prize.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
          style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `rgba(${accent.rgb}, 0.1)` }}>
            <Target className="w-6 h-6" style={{ color: accent.main }} />
          </div>
          <div>
            <div className="text-2xl" style={{ fontWeight: 700, color: accent.main }}>{activeCount}</div>
            <div className="text-xs" style={{ color: colors.textMuted, fontWeight: 500 }}>Active Goals</div>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
            <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
          </div>
          <div>
            <div className="text-2xl" style={{ fontWeight: 700, color: '#22c55e' }}>{completedCount}</div>
            <div className="text-xs" style={{ color: colors.textMuted, fontWeight: 500 }}>Completed</div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-2 transition-all" style={{ background: colors.card, border: `2px dashed ${accent.main}50` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm" style={{ fontWeight: 700, color: colors.text }}>Create New Goal</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-400"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              className={inputClass} 
              style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
              placeholder="What do you want to achieve?" 
              value={newGoal.title} 
              onChange={e => setNewGoal({...newGoal, title: e.target.value})} 
              onKeyDown={e => { if (e.key === 'Enter') handleCreateGoal(); }}
              autoFocus 
            />
            
            <div className="flex flex-col gap-2">
              <select 
                className={inputClass} 
                style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
                value={newGoal.subject} onChange={e => setNewGoal({...newGoal, subject: e.target.value})}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {newGoal.subject === 'Other...' && (
                <input 
                  className={inputClass} 
                  style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
                  placeholder="Type custom subject here..." 
                  value={customSubject} 
                  onChange={e => setCustomSubject(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateGoal(); }}
                  autoFocus 
                />
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: colors.textMuted }}>Color:</span>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setNewGoal({...newGoal, color: c})}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                    style={{ background: c, border: newGoal.color === c ? `3px solid ${colors.bg}` : 'none', outline: newGoal.color === c ? `2px solid ${c}` : 'none' }}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleCreateGoal} className="w-full md:w-auto px-6 py-2.5 rounded-xl text-white text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: accent.main, fontWeight: 600 }}>Create Goal</button>
          </div>
        </div>
      )}

      {/* --- ACTIVE GOALS --- */}
      {loading ? (
        <div className="text-center py-10" style={{ color: colors.textMuted }}>Loading goals...</div>
      ) : activeGoals.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center opacity-60">
          <Target className="w-12 h-12 mb-3" style={{ color: colors.textMuted }} />
          <p className="text-sm" style={{ color: colors.textMuted }}>No active goals. Dream big and add one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(activeGroupedGoals).map(([subject, subjectGoals]) => (
            <div key={subject} className="flex flex-col gap-3">
              
              {/* Division/Subject Header */}
              <div className="flex items-center gap-3">
                <div className="text-xs tracking-wider" style={{ fontWeight: 700, color: colors.textSub, textTransform: 'uppercase' }}>
                  {subject}
                </div>
                <div className="flex-1 h-px" style={{ background: colors.border }} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectGoals.map(goal => {
                  const isEditing = editingId === goal._id;
                  const isFading = fadingId === goal._id;

                  // EDIT MODE UI
                  if (isEditing) {
                    return (
                      <div key={goal._id} className="rounded-2xl p-4 flex flex-col gap-3"
                        style={{ background: colors.card, border: `1px solid ${accent.main}` }}>
                        <div className="flex flex-col gap-2">
                          <input className={inputClass} style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
                            value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} autoFocus />
                          
                          <select className={inputClass} style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
                            value={editData.subject} onChange={e => setEditData({...editData, subject: e.target.value})}>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          
                          {editData.subject === 'Other...' && (
                            <input className={inputClass} style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text }}
                              placeholder="Custom subject..." value={editCustomSubject} onChange={e => setEditCustomSubject(e.target.value)} />
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-1.5">
                            {GOAL_COLORS.map(c => (
                              <button key={c} onClick={() => setEditData({...editData, color: c})}
                                className="w-5 h-5 rounded-full"
                                style={{ background: c, border: editData.color === c ? `2px solid ${colors.bg}` : 'none', outline: editData.color === c ? `2px solid ${c}` : 'none' }}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateGoal(goal._id)} className="p-2 rounded-lg text-white" style={{ background: '#22c55e' }}><Save className="w-4 h-4"/></button>
                            <button onClick={cancelEditing} className="p-2 rounded-lg" style={{ background: colors.card2, color: colors.textSub }}><X className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // NORMAL VIEW UI
                  return (
                    <div key={goal._id} 
                      className={`rounded-2xl p-4 flex gap-4 transition-all duration-300 group relative ${isFading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                      style={{ background: colors.card, border: `1px solid ${goal.color}40` }}>
                      
                      <button onClick={() => toggleGoalStatus(goal)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                        <Circle className="w-6 h-6" style={{ color: colors.border }} />
                      </button>

                      <div className="flex-1 min-w-0 pr-12">
                        <h3 className="text-sm truncate mb-1.5" style={{ fontWeight: 600, color: colors.text }}>
                          {goal.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
                        </div>
                      </div>

                      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditing(goal)} className="p-1.5 rounded-md hover:bg-gray-500/10" style={{ color: colors.textMuted }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setGoalToDelete(goal)} className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-all" style={{ color: colors.textMuted }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- COMPLETED HISTORY SECTION --- */}
      {!loading && completedGoals.length > 0 && (
        <div className="mt-8 pt-6 transition-all duration-500" style={{ borderTop: `1px dashed ${colors.border}` }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="text-xs tracking-wider" style={{ fontWeight: 700, color: colors.textSub, textTransform: 'uppercase' }}>
              History (Completed)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map(goal => {
              const isFading = fadingId === goal._id;
              
              return (
                <div key={goal._id} 
                  className={`rounded-2xl p-4 flex gap-4 transition-all duration-300 group relative ${isFading ? 'opacity-0 scale-95' : 'opacity-60 scale-100 hover:opacity-100'}`}
                  style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
                  
                  {/* Button to Un-complete */}
                  <button onClick={() => toggleGoalStatus(goal)} className="shrink-0 mt-0.5 hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
                  </button>

                  <div className="flex-1 min-w-0 pr-12">
                    <h3 className="text-sm truncate mb-1.5" style={{ fontWeight: 600, color: colors.text, textDecoration: 'line-through' }}>
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
                      <span className="text-xs" style={{ color: colors.textSub }}>{goal.subject}</span>
                    </div>
                  </div>

                  <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setGoalToDelete(goal)} className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-all" style={{ color: colors.textMuted }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={cancelDelete}>
          
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 text-center transform transition-all"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, boxShadow: '0 32px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}>
            
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <Trash2 className="w-8 h-8" style={{ color: '#ef4444' }} />
            </div>
            
            <div>
              <h3 className="text-lg mb-1.5" style={{ fontWeight: 700, color: colors.text }}>Delete Goal?</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                Are you sure you want to delete <strong style={{ color: colors.text }}>"{goalToDelete.title}"</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button onClick={cancelDelete} className="flex-1 px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: colors.card2, color: colors.textSub, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: '#ef4444', fontWeight: 600, boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}