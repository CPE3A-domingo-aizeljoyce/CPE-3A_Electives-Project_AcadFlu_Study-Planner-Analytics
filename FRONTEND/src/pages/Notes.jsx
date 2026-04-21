import { useState, useEffect } from 'react';
import { useAppearance } from '../components/AppearanceProvider';
import { Plus, Search, Trash2, BookOpen, Clock, Tag, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchNotes, createNote, deleteNoteAPI, updateNoteAPI } from '../api/notesApi';

const subjectColors = {
  Mathematics: '#6366f1', Physics: '#22c55e', Chemistry: '#f97316',
  Biology: '#8b5cf6', English: '#06b6d4', History: '#fbbf24', General: '#94a3b8',
};

const subjects = ['General','Mathematics','Physics','Chemistry','Biology','English','History', 'Other...'];

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function Notes() {
  const [notes, setNotes]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [editContent, setEditContent] = useState('');
  const [newNote, setNewNote]   = useState({ title: '', content: '', subject: 'General', tags: '' });
  
  const [customSubject, setCustomSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');
  
  const [mobilePanel, setMobilePanel] = useState('list');

  const { colors, accent } = useAppearance();
  const isMobile = useIsMobile(640);
  const inputStyle = { background: colors.card2, border: `1px solid ${colors.border}`, color: colors.text };

  useEffect(() => {
    const getRealNotes = async () => {
      try {
        const data = await fetchNotes();
        if (Array.isArray(data)) {
          setNotes(data);
        } else {
          console.warn("Backend did not return an array:", data);
          setNotes([]); 
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
        setNotes([]);
      }
    };
    getRealNotes();
  }, []);

    const safeNotes = Array.isArray(notes) ? notes : [];
  
  const filtered = safeNotes.filter(n =>
    n?.title?.toLowerCase().includes(search.toLowerCase()) ||
    n?.content?.toLowerCase().includes(search.toLowerCase()) ||
    n?.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const addNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      setErrorMsg("Title and Content are required to save a note.");
      setTimeout(() => setErrorMsg(''), 3500);  
      return;
    }

    const finalSubject = newNote.subject === 'Other...' 
      ? (customSubject.trim() || 'General') 
      : newNote.subject;

    setIsSaving(true);
    setErrorMsg(''); 

    try {
      const noteData = {
        title: newNote.title,
        content: newNote.content,
        subject: finalSubject,
        tags: newNote.tags ? newNote.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        color: subjectColors[finalSubject] || '#94a3b8',
      };
      
      const savedNote = await createNote(noteData); 
      setNotes(prev => [savedNote, ...prev]);
      setSelected(savedNote);
      setNewNote({ title: '', content: '', subject: 'General', tags: '' });
      setCustomSubject('');
      setShowForm(false);
      if (isMobile) setMobilePanel('detail');
    } catch (error) {
      console.error("Failed to save note:", error);
      setErrorMsg("Failed to save. Please check your connection or login again.");
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setIsSaving(false); 
    }
  };

  const deleteNote = async (id) => {
    try {
      await deleteNoteAPI(id); 
      setNotes(prev => prev.filter(n => n._id !== id));
      if (selected?._id === id) { setSelected(null); setMobilePanel('list'); }
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const saveEdit = async () => {
  if (!selected) return;
  try {
    const updatedNote = await updateNoteAPI(selected._id, { content: editContent });

    setNotes(prev => prev.map(n => n._id === selected._id ? { ...n, content: updatedNote.content } : n));
    setSelected(prev => prev ? { ...prev, content: updatedNote.content } : null);
    setEditing(false);
  } catch (error) {
    console.error("Failed to update note:", error);
    alert("Failed to save edits.");
  }
};

  const openNote = (note) => {
    setSelected(note);
    if (isMobile) setMobilePanel('detail');
  };

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
              <div key={note._id} onClick={() => openNote(note)}
                className="p-3 rounded-xl cursor-pointer group transition-all duration-150 relative"
                style={{ background: selected?._id === note._id ? `rgba(${accent.rgb},0.12)` : colors.card, border: `1px solid ${selected?._id === note._id ? `rgba(${accent.rgb},0.35)` : colors.border}` }}>
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
                      <span className="text-xs" style={{ color: colors.textMuted }}>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNote(note._id); }}
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
              
              {/* MAGANDANG ERROR ALERT BOX */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm transition-all" 
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span style={{ fontWeight: 500 }}>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                    placeholder="Note title..."
                    value={newNote.title} onChange={e => setNewNote({ ...newNote, title: e.target.value })} />
                  
                  <div className="flex flex-col gap-2">
                    <select className="px-3 py-2.5 rounded-xl text-sm outline-none w-full" style={inputStyle}
                      value={newNote.subject} onChange={e => setNewNote({ ...newNote, subject: e.target.value })}>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {newNote.subject === 'Other...' && (
                      <input className="px-3 py-2.5 rounded-xl text-sm outline-none w-full transition-all" style={inputStyle}
                        placeholder="Type custom subject here..." autoFocus
                        value={customSubject} onChange={e => setCustomSubject(e.target.value)} />
                    )}
                  </div>
                </div>

                <input className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
                  placeholder="Tags (comma separated: calculus, formula, exam)"
                  value={newNote.tags} onChange={e => setNewNote({ ...newNote, tags: e.target.value })} />
                <textarea className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ ...inputStyle, minHeight: 100 }}
                  placeholder="Write your notes here... (supports **bold** text)"
                  value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} />
                <div className="flex gap-2">
                  <button onClick={addNote} disabled={isSaving} className="px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    style={{ background: `linear-gradient(135deg, ${accent.main}, ${accent.light})`, fontWeight: 600 }}>
                    {isSaving ? 'Saving...' : 'Save Note'}
                  </button>
                  <button onClick={() => setShowForm(false)} disabled={isSaving} className="px-5 py-2 rounded-xl text-sm disabled:opacity-50 transition-all"
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
                      <Clock className="w-3 h-3" /><span>{formatDate(selected.createdAt)}</span>
                    </div>
                    {selected.tags && selected.tags.length > 0 && (
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