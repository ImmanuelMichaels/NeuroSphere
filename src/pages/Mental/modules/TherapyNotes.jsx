import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, Tag, Download, Cloud } from 'lucide-react';
import Button from '../../../components/UI/Button';
import Card from '../../../components/UI/Card';
import "./TherapyNote.css";

const sampleNotes = [
  {
    id: 1,
    date: '2025-01-20',
    therapist: 'Dr. Jennifer Lee',
    sessionType: 'CBT',
    tags: ['anxiety', 'sleep'],
    notes: 'Worked on cognitive restructuring for anxious thoughts. Assigned breathing exercises and sleep hygiene.'
  },
  {
    id: 2,
    date: '2025-01-13',
    therapist: 'Dr. Jennifer Lee',
    sessionType: 'Follow-up',
    tags: ['medication'],
    notes: 'Reviewed medication adherence and side effects. Patient reports mild nausea which is improving.'
  }
];

const TherapyNotes = () => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('therapyNotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('therapyNotes load error', e);
    }
    return sampleNotes;
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ date: '', therapist: '', sessionType: '', tags: '', notes: '' });
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('therapyNotes', JSON.stringify(notes));
    } catch (e) {
      console.warn('therapyNotes save error', e);
    }
  }, [notes]);

  const openNew = () => {
    setEditingId(null);
    setForm({ date: new Date().toISOString().split('T')[0], therapist: '', sessionType: '', tags: '', notes: '' });
    setShowForm(true);
  };

  const saveNote = () => {
    const payload = {
      ...form,
      id: editingId || Date.now(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    if (editingId) {
      setNotes(prev => prev.map(n => n.id === editingId ? payload : n));
    } else {
      setNotes(prev => [payload, ...prev]);
    }
    setShowForm(false);
  };

  const editNote = (n) => {
    setEditingId(n.id);
    setForm({ ...n, tags: (n.tags || []).join(', ') });
    setShowForm(true);
  };

  const deleteNote = (id) => {
    if (!window.confirm('Delete this note?')) return;
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    if (!q) return true;
    return n.notes.toLowerCase().includes(q) || n.therapist.toLowerCase().includes(q) || (n.tags || []).join(' ').toLowerCase().includes(q);
  });

  const exportJSON = () => {
    const data = JSON.stringify(notes, null, 2);
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    a.download = `therapy-notes-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const triggerImport = () => fileRef.current && fileRef.current.click();

  const handleImport = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed)) setNotes(prev => {
          const byId = Object.fromEntries(prev.map(p => [p.id, p]));
          parsed.forEach(p => { if (p && p.id && !byId[p.id]) prev.push(p); });
          return [...prev].sort((a,b)=> new Date(b.date)-new Date(a.date));
        });
      } catch (err) {
        console.warn('therapyNotes import error', err);
      }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const clearAll = () => {
    if (!window.confirm('Clear all therapy notes?')) return;
    setNotes([]);
    localStorage.removeItem('therapyNotes');
  };

  return (
    <div className="app-container">
      <div className="main-layout-container">
        <div className="section-header">
          <h1 className="section-title">Therapy Notes</h1>
          <p className="section-subtitle">Secure session notes for clinical continuity.</p>
        </div>

        <div className="action-toolbar">
          <div className="search-container">
            <Search className="search-icon" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes, therapist, tags..." className="search-input" />
          </div>
          <Button onClick={openNew} variant="primary" className="btn-note"><Plus className="plus" /> New Note</Button>
          <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
          <Button onClick={exportJSON} variant="secondary" className="btn-duty"><Download className="w-4 h-4" /> Export</Button>
          <Button onClick={triggerImport} variant="secondary" className="btn-duty"><Cloud className="w-4 h-4" /> Import</Button>
          <Button onClick={clearAll} variant="danger" className="btn-duty">Clear</Button>
        </div>

        {showForm && (
          <Card className="card">
            <div className="responsive-grid">
              <div>
                <label className="form-label">Date</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="form-label">Therapist</label>
                <input value={form.therapist} onChange={e=>setForm({...form, therapist:e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="form-label">Session Type</label>
                <input value={form.sessionType} onChange={e=>setForm({...form, sessionType:e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="full-width-feature">
                <label className="form-label">Tags (comma separated)</label>
                <input value={form.tags} onChange={e=>setForm({...form, tags:e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="full-width-feature">
                <label className="form-label">Notes</label>
                <textarea rows={6} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>
            <div className="form-actions">
              <Button onClick={saveNote} variant="primary">Save</Button>
              <Button onClick={()=>setShowForm(false)} variant="secondary" className="btn-duty">Cancel</Button>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {filtered.map(n=> (
            <Card key={n.id} className="note-card">
              <div>
                <div className="card-header">
                  <div className="note-date">{n.date}</div>
                  <div className="note-author">{n.therapist}</div>
                  <div className="note-tag">{n.sessionType}</div>
                </div>
                <div className="note-body line-clamp-3">{n.notes}</div>
                <div className="note-body">
                  {(n.tags||[]).map((t,idx)=> <div key={idx} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">{t}</div>)}
                </div>
              </div>
              <div className="note-actions-sidebar">
                <Button onClick={()=>editNote(n)} variant="secondary" className="btn"><Edit2 className="w-4 h-4" /></Button>
                <Button onClick={()=>deleteNote(n.id)} variant="danger" className="btn"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TherapyNotes;
