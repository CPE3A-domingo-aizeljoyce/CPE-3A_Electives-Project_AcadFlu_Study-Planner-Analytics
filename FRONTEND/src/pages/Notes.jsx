import { useState, useEffect } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { Plus, Search, Trash2, BookOpen, Clock, Tag, FileText, ArrowLeft } from 'lucide-react';

const subjectColors = {
  Mathematics: '#6366f1', Physics: '#22c55e', Chemistry: '#f97316',
  Biology: '#8b5cf6', English: '#06b6d4', History: '#fbbf24', General: '#94a3b8',
};

const initialNotes = [
  {
    id: 1, title: 'Calculus – Integration by Parts', subject: 'Mathematics',
    content: '**Integration by Parts Formula:**\n∫u dv = uv − ∫v du\n\nKey rule: LIATE (Logarithmic, Inverse trig, Algebraic, Trig, Exponential)\n\nExample: ∫x·eˣ dx = x·eˣ − eˣ + C\n\nAlways choose u as the function whose derivative simplifies the integral.',
    tags: ['calculus','integration','formula'], createdAt: '2026-03-25 09:30', color: '#6366f1',
  },
  {
    id: 2, title: "Newton's Laws Summary", subject: 'Physics',
    content: "**1st Law (Inertia):** An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.\n\n**2nd Law (F=ma):** The acceleration of an object is directly proportional to the net force acting on it.\n\n**3rd Law:** For every action, there is an equal and opposite reaction.",
    tags: ['mechanics','laws','newton'], createdAt: '2026-03-24 14:15', color: '#22c55e',
  },
  {
    id: 3, title: 'Organic Chemistry – Functional Groups', subject: 'Chemistry',
    content: '**Key Functional Groups:**\n• Alkyl halides: –X (F, Cl, Br, I)\n• Alcohols: –OH\n• Aldehydes: –CHO\n• Ketones: C=O (internal)\n• Carboxylic acids: –COOH\n• Amines: –NH₂\n\nFunctional groups determine chemical reactivity.',
    tags: ['organic','functional groups','reactions'], createdAt: '2026-03-23 11:00', color: '#f97316',
  },
  {
    id: 4, title: 'Essay Structure Tips', subject: 'English',
    content: '**PEEL Structure:**\n• **Point:** State your argument clearly\n• **Evidence:** Provide supporting evidence\n• **Explain:** Explain how evidence supports your point\n• **Link:** Connect back to the question\n\nIntroduction: hook, context, thesis.\nConclusion: restate, summarize, broader implications.',
    tags: ['writing','essay','structure'], createdAt: '2026-03-22 16:45', color: '#06b6d4',
  },
];

const subjects = ['General','Mathematics','Physics','Chemistry','Biology','English','History'];

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

export function Notes() {
  const [notes, setNotes]       = useState(initialNotes);
  const [selected, setSelected] = useState(initialNotes[0]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newNote, setNewNote]   = useState({ title: '', content: '', subject: 'General', tags: '' });
  const [mobilePanel, setMobilePanel] = useState('list'); // 'list' | 'detail'

  const { colors, accent } = useAppearance();
  const isMobile = useIsMobile(640);
  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  const addNote = () => {
    if (!newNote.title.trim()) return;
    const note = {
      id: Date.now(), title: newNote.title, content: newNote.content,
      subject: newNote.subject,
      tags: newNote.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      color: subjectColors[newNote.subject] || '#94a3b8',
    };
    setNotes(prev => [note, ...prev]);
    setSelected(note);
    setNewNote({ title: '', content: '', subject: 'General', tags: '' });
    setShowForm(false);
    if (isMobile) setMobilePanel('detail');
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected?.id === id) { setSelected(null); setMobilePanel('list'); }
  };

  const saveEdit = () => {
    if (!selected) return;
    setNotes(prev => prev.map(n => n.id === selected.id ? { ...n, content: editContent } : n));
    setSelected(prev => prev ? { ...prev, content: editContent } : null);
    setEditing(false);
  };

  const openNote = (note) => {
    setSelected(note);
    if (isMobile) setMobilePanel('detail');
  };

  // Determine what to show
  const showList   = !isMobile || mobilePanel === 'list';
  const showDetail = !isMobile || mobilePanel === 'detail';

  return (
    <div className="flex flex-1 min-h-0" style={{ background: colors.bg }}>

      {/* Sidebar – notes list */}
      {showList && (
        <div style={{
          width: isMobile ? '100%' : 288,
          minWidth: isMobile ? 0 : 288,
          maxWidth: isMobile ? '100%' : 288,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: colors.card2,
          borderRight: `1px solid ${colors.border}`,
        }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base" style={{ fontWeight: 700, color: colors.text }}>Notes</h2>
              <button onClick={() => { setShowForm(!showForm); if (isMobile) setMobilePanel('detail'); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})` }}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
              <Search className="w-4 h-4" style={{ color: colors.textMuted }} />
              <input className="bg-transparent text-sm outline-none flex-1" style={{ color: colors.text }}
                placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <p className="text-xs" style={{ color: colors.textMuted }}>{filtered.length} notes</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {filtered.map(note => (
              <div key={note.id} onClick={() => openNote(note)}
                className="p-3 rounded-xl cursor-pointer group transition-all duration-150 relative"
                style={{ background: selected?.id === note.id ? `rgba(${accent.rgb},0.12)` : colors.card, border: `1px solid ${selected?.id === note.id ? `rgba(${accent.rgb},0.35)` : colors.border}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: note.color }} />
                      <span className="text-xs truncate" style={{ fontWeight: 600, color: colors.text }}>{note.title}</span>
                    </div>
                    <p className="text-xs line-clamp-2 leading-4" style={{ color: colors.textMuted }}>
                      {note.content.replace(/\*\*/g, '').substring(0, 80)}...
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs" style={{ color: note.color, fontWeight: 500 }}>{note.subject}</span>
                      <span className="text-xs" style={{ color: colors.textMuted }}>{note.createdAt.split(' ')[0]}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-400 transition-all flex-shrink-0"
                    style={{ color: colors.textMuted }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8" style={{ color: colors.textMuted }}>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No notes found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main note content */}
      {showDetail && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: colors.bg }}>

          {/* Mobile: back button */}
          {isMobile && (
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ background: colors.card2, borderBottom: `1px solid ${colors.border}` }}>
              <button onClick={() => setMobilePanel('list')} className="flex items-center gap-2 text-sm" style={{ color: accent.main, fontWeight: 500 }}>
                <ArrowLeft className="w-4 h-4" /> All Notes
              </button>
              {selected && (
                <span className="ml-2 text-sm truncate" style={{ color: colors.textSub, fontWeight: 500 }}>{selected.title}</span>
              )}
            </div>
          )}

          {/* Add Note Form */}
          {showForm && (
            <div className="p-4 border-b flex-shrink-0" style={{ borderColor: colors.border, background: colors.card }}>
              <h3 className="text-sm mb-3" style={{ fontWeight: 600, color: colors.text }}>Create New Note</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                    placeholder="Note title..."
                    value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} />
                  <select className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                    value={newNote.subject} onChange={e => setNewNote({ ...newNote, subject: e.target.value })}>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                  placeholder="Tags (comma separated: calculus, formula, exam)"
                  value={newNote.tags} onChange={e => setNewNote({ ...newNote, tags: e.target.value })} />
                <textarea className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...inputStyle, minHeight: 100 }}
                  placeholder="Write your notes here... (supports **bold** text)"
                  value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={addNote} className="px-5 py-2 rounded-xl text-white text-sm hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
                    Save Note
                  </button>
                  <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm"
                    style={{ background: colors.card2, border: `1px solid ${colors.border}`, color: colors.textSub }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {selected ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                    <h1 className="text-xl" style={{ fontWeight: 700, letterSpacing: '-0.3px', color: colors.text }}>{selected.title}</h1>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: `${selected.color}20`, color: selected.color, fontWeight: 500 }}>{selected.subject}</span>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: colors.textMuted }}>
                      <Clock className="w-3 h-3" /><span>{selected.createdAt}</span>
                    </div>
                    {selected.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="w-3 h-3" style={{ color: colors.textMuted }} />
                        {selected.tags.map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ color: colors.textMuted, background: colors.border }}>#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {editing ? (
                    <>
                      <button onClick={saveEdit} className="px-4 py-2 rounded-xl text-white text-sm" style={{ background: '#22c55e', fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm" style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.textSub }}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => { setEditContent(selected.content); setEditing(true); }} className="px-4 py-2 rounded-xl text-sm" style={{ background: colors.card, border: `1px solid ${colors.border}`, fontWeight: 500, color: colors.textSub }}>Edit</button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: colors.card, border: `1px solid ${colors.border}` }}>
                {editing ? (
                  <textarea className="w-full bg-transparent text-sm outline-none resize-none leading-7"
                    style={{ minHeight: 300, color: colors.text }}
                    value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus />
                ) : (
                  <div className="text-sm leading-7 whitespace-pre-wrap" style={{ color: colors.textSub }}>
                    {selected.content.split('\n').map((line, i) => {
                      const rendered = line.replace(/\*\*(.+?)\*\*/g, `<strong style="color:${colors.text}">$1</strong>`);
                      return <div key={i} dangerouslySetInnerHTML={{ __html: rendered || '&nbsp;' }} />;
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `rgba(${accent.rgb},0.12)` }}>
                <BookOpen className="w-8 h-8 opacity-60" style={{ color: accent.main }} />
              </div>
              <p className="text-sm mb-1" style={{ fontWeight: 500, color: colors.textSub }}>Select a note to read</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Or create a new one with the + button</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
