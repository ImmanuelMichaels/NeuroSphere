import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Edit2, Trash2, Search, Tag, Download, Upload,
  Brain, ChevronDown, ChevronUp, X, Save, RefreshCw,
  BookOpen, BarChart3, List, Sparkles, AlertCircle,
  Clock, User, Hash, FileText, CheckCircle2, Filter,
  TrendingUp, Calendar, Mic, Heart
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

// ─── Design System ────────────────────────────────────────────────────────────
// Warm ink-dark: aged manuscript meets clinical precision
const C = {
  bg:       "#0a0806",
  surface:  "#0f0c09",
  card:     "#141008",
  cardHi:   "#1a1510",
  border:   "#2a2218",
  borderHi: "#3d3222",
  text:     "#e8dfc8",
  muted:    "#7a6e58",
  dim:      "#3a3228",
  // Warm accent spectrum
  gold:     "#c9a84c",
  goldDim:  "#5c4a1c",
  amber:    "#d4783a",
  amberDim: "#5a2d12",
  sage:     "#6b8f71",
  sageDim:  "#253428",
  rose:     "#c4606a",
  roseDim:  "#4a1c22",
  blue:     "#5a8fc4",
  blueDim:  "#1c3254",
  lavender: "#9b7fc4",
  lavDim:   "#362552",
  teal:     "#4a9b8c",
  tealDim:  "#162e2a",
};

// ─── Session type config ──────────────────────────────────────────────────────
const SESSION_TYPES = [
  { value: "CBT",           label: "Cognitive Behavioural",  color: C.sage,     short: "CBT"  },
  { value: "DBT",           label: "Dialectical Behaviour",  color: C.blue,     short: "DBT"  },
  { value: "Psychodynamic", label: "Psychodynamic",          color: C.lavender, short: "PD"   },
  { value: "EMDR",          label: "EMDR",                   color: C.amber,    short: "EMDR" },
  { value: "Follow-up",     label: "Follow-up",              color: C.teal,     short: "FU"   },
  { value: "Assessment",    label: "Assessment",             color: C.gold,     short: "ASS"  },
  { value: "Crisis",        label: "Crisis",                 color: C.rose,     short: "CR"   },
  { value: "Other",         label: "Other",                  color: C.muted,    short: "OTH"  },
];

const getSessionConfig = v => SESSION_TYPES.find(s => s.value === v) || SESSION_TYPES[SESSION_TYPES.length - 1];

const MOOD_OPTIONS = ["Very Low","Low","Mixed","Neutral","Calm","Good","Very Good","Energised"];
const GOALS_TEMPLATES = [
  "Reduce avoidance behaviours",
  "Improve sleep hygiene",
  "Practice grounding techniques",
  "Challenge cognitive distortions",
  "Build interpersonal effectiveness",
  "Develop distress tolerance",
  "Increase social engagement",
  "Medication review",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate  = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }); } catch { return s; } };
const fmtShort = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("en-GB", { day:"numeric", month:"short" }); } catch { return s; } };
const fmtMonth = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("en-GB", { month:"short", year:"2-digit" }); } catch { return s; } };
const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length;

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED = [
  {
    id: 1,
    date: "2025-01-20",
    therapist: "Dr Jennifer Lee",
    sessionType: "CBT",
    mood: "Mixed",
    duration: 50,
    tags: ["anxiety", "sleep", "cognitive-restructuring"],
    goals: ["Challenge cognitive distortions", "Improve sleep hygiene"],
    homework: "Daily thought diary; 4-7-8 breathing before bed",
    followUp: "Review sleep diary next session",
    notes: "Explored automatic negative thoughts around work performance. Patient identified the core belief \"I am not good enough\" as an underlying driver. Practised challenging evidence for and against this belief. Introduced sleep hygiene protocol — no screens 1 hour before bed, consistent wake time. Patient expressed relief at naming the pattern.",
    private: false,
  },
  {
    id: 2,
    date: "2025-01-13",
    therapist: "Dr Jennifer Lee",
    sessionType: "Follow-up",
    mood: "Neutral",
    duration: 30,
    tags: ["medication", "sertraline", "side-effects"],
    goals: ["Medication review"],
    homework: "",
    followUp: "Blood panel in 4 weeks",
    notes: "Medication adherence review. Patient reports mild nausea in first two weeks which is now resolving. No discontinuation symptoms noted. Mood is stable at baseline. Discussed importance of consistency and not stopping abruptly. Energy levels still low in mornings — may adjust dose timing.",
    private: false,
  },
  {
    id: 3,
    date: "2025-01-06",
    therapist: "Dr Jennifer Lee",
    sessionType: "CBT",
    mood: "Low",
    duration: 55,
    tags: ["depression", "rumination", "behavioural-activation"],
    goals: ["Reduce avoidance behaviours", "Increase social engagement"],
    homework: "Schedule one pleasurable activity per day; log emotions before and after",
    followUp: "Check activity log",
    notes: "Patient reports significant withdrawal from social activities over past month. Identified pattern of avoidance and low mood cycle. Introduced behavioural activation model — activity affects mood, not the other way round. Created initial activity schedule with patient. They were resistant at first but agreed to try 'micro-activities' (5 minutes).",
    private: false,
  },
  {
    id: 4,
    date: "2024-12-16",
    therapist: "Dr Jennifer Lee",
    sessionType: "Assessment",
    mood: "Very Low",
    duration: 60,
    tags: ["initial-assessment", "PHQ-9", "GAD-7"],
    goals: ["Develop distress tolerance"],
    homework: "",
    followUp: "PHQ-9 score: 14 (moderate). GAD-7 score: 11 (moderate). Begin CBT.",
    notes: "Initial comprehensive assessment. Patient presented with 3-month history of low mood, anhedonia, and disrupted sleep. No suicidal ideation reported. Standardised assessments administered. Full history taken. Formulation shared with patient — stress-vulnerability model discussed. Good therapeutic alliance established. Treatment plan agreed.",
    private: true,
  },
];

// ─── Blank form ───────────────────────────────────────────────────────────────
const BLANK = {
  date: todayStr(),
  therapist: "",
  sessionType: "CBT",
  mood: "Neutral",
  duration: 50,
  tags: "",
  goals: [],
  homework: "",
  followUp: "",
  notes: "",
  private: false,
};

// ─── Micro-components ─────────────────────────────────────────────────────────

const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const col = type === "success" ? C.sage : type === "error" ? C.rose : C.gold;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:C.cardHi, border:`1px solid ${col}`, borderRadius:12, padding:"12px 18px", color:C.text, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:`0 4px 24px #0008`, animation:"slideUp .2s ease", maxWidth:340 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:col }}/>
      {msg}
    </div>
  );
};

const Confirm = ({ msg, danger, onOk, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:16, padding:26, maxWidth:380, width:"100%" }}>
      <p style={{ color:C.text, fontSize:14, lineHeight:1.75, marginBottom:22 }}>{msg}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ padding:"8px 18px", borderRadius:8, background:C.border, border:"none", color:C.text, fontSize:13, cursor:"pointer" }}>Cancel</button>
        <button onClick={onOk} style={{ padding:"8px 18px", borderRadius:8, background:danger?C.rose:C.gold, border:"none", color:"#0a0806", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          {danger ? "Delete" : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.cardHi, border:`1px solid ${C.borderHi}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:C.muted, marginBottom:4, fontWeight:600 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color:p.color||C.text, margin:"2px 0", fontWeight:700 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const StatCard = ({ label, value, sub, color, Icon }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", position:"relative", overflow:"hidden", flex:1, minWidth:120 }}>
    <div style={{ position:"absolute", right:12, top:12, opacity:.07 }}><Icon size={40}/></div>
    <p style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>{label}</p>
    <p style={{ fontSize:26, fontWeight:800, color, letterSpacing:"-1px", lineHeight:1, margin:0 }}>{value}</p>
    {sub && <p style={{ fontSize:11, color:C.muted, marginTop:5 }}>{sub}</p>}
  </div>
);

const TagBadge = ({ label, color = C.gold }) => (
  <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99, background:`${color}18`, color, fontWeight:600, border:`1px solid ${color}30`, whiteSpace:"nowrap" }}>{label}</span>
);

// ─── AI Insights ──────────────────────────────────────────────────────────────
const AIInsights = ({ notes }) => {
  const [text,    setText]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true); setText(null);
    const snippet = notes.slice(0, 12).map(n =>
      `DATE: ${n.date}\nTYPE: ${n.sessionType}\nMOOD: ${n.mood||"—"}\nDURATION: ${n.duration||"—"}min\nTAGS: ${(n.tags||[]).join(", ")||"none"}\nNOTES (excerpt): ${(n.notes||"").slice(0, 300)}`
    ).join("\n\n---\n\n");

    const prompt = `You are a clinical supervisor reviewing therapy session notes for reflective practice. Analyse these notes and respond in exactly 4 focused paragraphs (2-3 sentences each):
1) Therapeutic themes and patterns across sessions — what keeps recurring?
2) Clinical progress indicators — what changes or stagnations are observable?
3) Risk factors and areas requiring clinical attention
4) Reflective practice suggestions for the therapist — concrete techniques or approaches to consider

Be clinically precise, empathetic, and constructive. Do NOT diagnose patients. Always remind that findings should be discussed with a clinical supervisor.

SESSION NOTES:
${snippet}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 900,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const d = await res.json();
      setText(d.content?.find(b => b.type === "text")?.text ?? "No response.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [notes]);

  const ICONS  = [TrendingUp, BarChart3, AlertCircle, Sparkles];
  const COLORS = [C.gold, C.sage, C.rose, C.lavender];

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <button onClick={open ? () => setOpen(false) : run}
        style={{ width:"100%", padding:"18px 22px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
        <div style={{ width:42, height:42, borderRadius:11, background:`${C.lavender}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Brain size={19} color={C.lavender}/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:0, fontFamily:"'Lora', Georgia, serif" }}>Clinical Insight Analysis</p>
          <p style={{ fontSize:12, color:C.muted, margin:"3px 0 0" }}>AI-assisted reflective practice across {notes.length} session{notes.length!==1?"s":""}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!open && <span style={{ fontSize:11, fontWeight:700, color:C.lavender, background:`${C.lavender}18`, padding:"4px 12px", borderRadius:99 }}>Analyse</span>}
          {open ? <ChevronUp size={16} color={C.muted}/> : <ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>

      {open && (
        <div style={{ padding:"0 22px 22px", borderTop:`1px solid ${C.border}` }}>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"22px 0" }}>
              <div style={{ width:18, height:18, border:`2px solid ${C.lavender}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
              <span style={{ fontSize:13, color:C.muted, fontStyle:"italic" }}>Reviewing session notes…</span>
            </div>
          )}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:14, background:`${C.rose}15`, borderRadius:10, marginTop:14 }}>
              <AlertCircle size={15} color={C.rose}/>
              <p style={{ fontSize:13, color:C.rose, margin:0, flex:1 }}>{error}</p>
              <button onClick={run} style={{ background:`${C.lavender}22`, border:"none", color:C.lavender, fontSize:12, padding:"5px 10px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><RefreshCw size={11}/> Retry</button>
            </div>
          )}
          {text && !loading && (
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:12 }}>
              {text.split("\n\n").filter(Boolean).map((para, i) => {
                const Icon  = ICONS[i] || Brain;
                const col   = COLORS[i] || C.muted;
                return (
                  <div key={i} style={{ display:"flex", gap:12, padding:"14px 16px", background:`${col}0a`, borderRadius:10, borderLeft:`2px solid ${col}` }}>
                    <Icon size={14} color={col} style={{ flexShrink:0, marginTop:3 }}/>
                    <p style={{ fontSize:13, color: i===0?C.text:C.muted, lineHeight:1.8, margin:0, fontFamily:i===0?"'Lora',Georgia,serif":"inherit" }}>{para}</p>
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                <p style={{ fontSize:11, color:C.muted, fontStyle:"italic", margin:0 }}>Discuss findings with a clinical supervisor before acting on AI-generated insights.</p>
                <button onClick={run} style={{ background:`${C.lavender}15`, border:`1px solid ${C.lavender}44`, color:C.lavender, fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={12}/> Re-analyse</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Note Form Modal ──────────────────────────────────────────────────────────
const NoteModal = ({ initial, onSave, onClose }) => {
  const [fd, setFd] = useState(initial || { ...BLANK });
  const set = (k, v) => setFd(p => ({ ...p, [k]: v }));
  const toggleGoal = g => set("goals", fd.goals.includes(g) ? fd.goals.filter(x => x !== g) : [...fd.goals, g]);

  const inp = { width:"100%", background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 13px", color:C.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
  const lbl = { display:"block", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:5 };
  const valid = fd.notes.trim().length > 0 && fd.date;
  const wc = wordCount(fd.notes);
  const sc = getSessionConfig(fd.sessionType);

  return (
    <div style={{ position:"fixed", inset:0, background:"#000d", zIndex:8000, overflowY:"auto", padding:"24px 16px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:20, width:"100%", maxWidth:640, padding:30 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:26 }}>
          <div>
            <p style={{ fontSize:20, fontWeight:700, color:C.text, margin:0, fontFamily:"'Lora', Georgia, serif" }}>{initial ? "Edit Session Note" : "New Session Note"}</p>
            <p style={{ fontSize:12, color:C.muted, margin:"3px 0 0" }}>All fields except notes are optional</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted }}><X size={18}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* Date + Therapist */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={fd.date} onChange={e => set("date", e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Therapist</label>
              <input style={inp} placeholder="e.g. Dr Jennifer Lee" value={fd.therapist} onChange={e => set("therapist", e.target.value)}/>
            </div>
          </div>

          {/* Session type pills */}
          <div>
            <label style={lbl}>Session Type</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {SESSION_TYPES.map(s => (
                <button key={s.value} onClick={() => set("sessionType", s.value)} style={{ padding:"6px 13px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", background:fd.sessionType===s.value?`${s.color}22`:C.surface, border:`1px solid ${fd.sessionType===s.value?s.color:C.border}`, color:fd.sessionType===s.value?s.color:C.muted, transition:"all .13s" }}>
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {/* Mood + Duration */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
            <div>
              <label style={lbl}>Patient Mood</label>
              <select style={{ ...inp, cursor:"pointer" }} value={fd.mood} onChange={e => set("mood", e.target.value)}>
                {MOOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Duration (mins)</label>
              <div style={{ display:"flex", alignItems:"center", background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
                <button onClick={() => set("duration", Math.max(10, fd.duration - 5))} style={{ width:40, height:42, background:"none", border:"none", color:C.gold, cursor:"pointer", fontSize:18 }}>−</button>
                <span style={{ flex:1, textAlign:"center", fontSize:18, fontWeight:800, color:C.text, fontVariantNumeric:"tabular-nums" }}>{fd.duration}</span>
                <button onClick={() => set("duration", Math.min(180, fd.duration + 5))} style={{ width:40, height:42, background:"none", border:"none", color:C.gold, cursor:"pointer", fontSize:18 }}>+</button>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label style={lbl}>Session Goals</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {GOALS_TEMPLATES.map(g => {
                const on = fd.goals.includes(g);
                return <button key={g} onClick={() => toggleGoal(g)} style={{ padding:"5px 11px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:on?`${C.sage}18`:C.surface, border:`1px solid ${on?C.sage:C.border}`, color:on?C.sage:C.muted, transition:"all .12s" }}>{g}</button>;
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={lbl}>Tags (comma-separated)</label>
            <input style={inp} placeholder="e.g. anxiety, sleep, CBT-homework" value={fd.tags} onChange={e => set("tags", e.target.value)}/>
          </div>

          {/* Notes — main */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
              <label style={{ ...lbl, marginBottom:0 }}>Session Notes *</label>
              <span style={{ fontSize:11, color:wc>50?C.sage:C.muted }}>{wc} words</span>
            </div>
            <textarea style={{ ...inp, resize:"vertical", minHeight:140, lineHeight:1.75 }} placeholder="Record session observations, interventions, patient responses, and clinical reflections…" value={fd.notes} onChange={e => set("notes", e.target.value)}/>
          </div>

          {/* Homework + Follow-up */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
            <div>
              <label style={lbl}>Homework / Between-session Tasks</label>
              <textarea style={{ ...inp, resize:"vertical", minHeight:70 }} placeholder="Assigned exercises or tasks…" value={fd.homework} onChange={e => set("homework", e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Follow-up / Next Session Focus</label>
              <textarea style={{ ...inp, resize:"vertical", minHeight:70 }} placeholder="Review points for next session…" value={fd.followUp} onChange={e => set("followUp", e.target.value)}/>
            </div>
          </div>

          {/* Flags */}
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:C.text }}>
              <input type="checkbox" checked={fd.private} onChange={e => set("private", e.target.checked)} style={{ accentColor:C.rose, width:15, height:15 }}/>
              <span style={{ color:C.rose, fontWeight:600 }}>Mark as confidential</span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, paddingTop:4 }}>
            <button onClick={() => onSave(fd)} disabled={!valid}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"13px", borderRadius:10, background:valid?C.gold:"#2a2218", border:"none", color:valid?"#0a0806":C.dim, fontSize:14, fontWeight:800, cursor:valid?"pointer":"not-allowed", fontFamily:"'Lora', Georgia, serif", transition:"background .15s" }}>
              <Save size={15}/>{initial ? "Update Note" : "Save Note"}
            </button>
            <button onClick={onClose} style={{ padding:"13px 22px", borderRadius:10, background:"none", border:`1px solid ${C.border}`, color:C.muted, fontSize:13, cursor:"pointer" }}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Note Card ────────────────────────────────────────────────────────────────
const NoteCard = ({ note, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const sc = getSessionConfig(note.sessionType);
  const wc = wordCount(note.notes || "");
  const tags = Array.isArray(note.tags) ? note.tags : (note.tags || "").split(",").map(t => t.trim()).filter(Boolean);

  return (
    <div style={{ background:C.card, border:`1px solid ${expanded?C.borderHi:C.border}`, borderRadius:16, overflow:"hidden", transition:"border-color .15s", borderLeft:`3px solid ${sc.color}` }}>
      {/* Header row */}
      <div onClick={() => setExpanded(e => !e)} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"18px 20px", cursor:"pointer" }}>
        {/* Date block */}
        <div style={{ flexShrink:0, textAlign:"center", background:C.surface, borderRadius:10, padding:"8px 12px", minWidth:56 }}>
          <p style={{ fontSize:18, fontWeight:800, color:C.gold, margin:0, letterSpacing:"-0.5px", lineHeight:1 }}>{new Date(note.date+"T12:00:00").getDate()}</p>
          <p style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", margin:"2px 0 0" }}>{new Date(note.date+"T12:00:00").toLocaleDateString("en-GB",{month:"short"})}</p>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:5 }}>
            <span style={{ fontSize:14, fontWeight:700, color:sc.color }}>{note.sessionType}</span>
            {note.therapist && <span style={{ fontSize:13, color:C.muted }}>· {note.therapist}</span>}
            {note.duration && <span style={{ fontSize:12, color:C.muted, display:"flex", alignItems:"center", gap:3 }}><Clock size={11}/> {note.duration}m</span>}
            {note.mood && <TagBadge label={note.mood} color={C.blue}/>}
            {note.private && <span style={{ fontSize:10, fontWeight:700, color:C.rose, background:`${C.rose}15`, padding:"2px 8px", borderRadius:99, border:`1px solid ${C.rose}30` }}>CONFIDENTIAL</span>}
          </div>

          <p style={{ fontSize:13, color:expanded?C.muted:C.text, lineHeight:1.65, margin:0, display:"-webkit-box", WebkitLineClamp:expanded?999:2, WebkitBoxOrient:"vertical", overflow:"hidden", fontFamily:"'Lora', Georgia, serif" }}>
            {note.notes}
          </p>

          {tags.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
              {tags.map(t => <TagBadge key={t} label={t} color={C.gold}/>)}
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:4, flexShrink:0, alignItems:"center" }}>
          <span style={{ fontSize:10, color:C.dim, marginRight:4 }}>{wc}w</span>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, padding:"5px", borderRadius:6 }}><Edit2 size={14}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.rose, padding:"5px", borderRadius:6 }}><Trash2 size={14}/></button>
          <div style={{ color:C.dim, padding:"5px", display:"flex" }}>{expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${C.border}` }}>
          {/* Full notes */}
          <div style={{ marginTop:16, padding:"14px 16px", background:C.surface, borderRadius:10, border:`1px solid ${C.border}` }}>
            <p style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Session Notes</p>
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.85, margin:0, fontFamily:"'Lora', Georgia, serif", whiteSpace:"pre-wrap" }}>{note.notes}</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:14, marginTop:14 }}>
            {note.goals?.length > 0 && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>Session Goals</p>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {note.goals.map(g => (
                    <div key={g} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:C.muted }}>
                      <CheckCircle2 size={11} color={C.sage}/> {g}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {note.homework && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>Homework</p>
                <p style={{ fontSize:12, color:C.muted, lineHeight:1.65, margin:0 }}>{note.homework}</p>
              </div>
            )}
            {note.followUp && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 }}>Follow-up</p>
                <p style={{ fontSize:12, color:C.muted, lineHeight:1.65, margin:0 }}>{note.followUp}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function TherapyNotes() {
  const fileRef = useRef(null);
  const nextId  = useRef(null);

  const [notes, setNotes] = useState(() => {
    try {
      const s = localStorage.getItem("tn2_notes");
      const p = s ? JSON.parse(s) : null;
      if (Array.isArray(p) && p.length) {
        nextId.current = Math.max(...p.map(n => n.id)) + 1;
        return p;
      }
    } catch {}
    nextId.current = SEED.length + 1;
    return SEED;
  });

  useEffect(() => { try { localStorage.setItem("tn2_notes", JSON.stringify(notes)); } catch {} }, [notes]);

  const [tab,     setTab]     = useState("notes");     // notes | analytics | insights
  const [search,  setSearch]  = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote]   = useState(null);
  const [confirm,  setConfirm]    = useState(null);
  const [toast,    setToast]      = useState(null);

  const push = (msg, type = "success") => setToast({ msg, type });

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notes
      .filter(n => {
        if (typeFilter !== "all" && n.sessionType !== typeFilter) return false;
        if (!q) return true;
        const tags = Array.isArray(n.tags) ? n.tags.join(" ") : n.tags;
        return n.notes?.toLowerCase().includes(q) ||
               n.therapist?.toLowerCase().includes(q) ||
               tags.toLowerCase().includes(q) ||
               n.sessionType?.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [notes, search, typeFilter]);

  // Analytics derived data
  const analyticsData = useMemo(() => {
    // Sessions per month
    const byMonth = {};
    notes.forEach(n => {
      const m = fmtMonth(n.date);
      if (!byMonth[m]) byMonth[m] = 0;
      byMonth[m]++;
    });
    const sessionsByMonth = Object.entries(byMonth).slice(-8).map(([month, count]) => ({ month, count }));

    // By type
    const byType = {};
    notes.forEach(n => { byType[n.sessionType] = (byType[n.sessionType]||0) + 1; });

    // Avg duration trend
    const byMonthDur = {};
    notes.forEach(n => {
      const m = fmtMonth(n.date);
      if (!byMonthDur[m]) byMonthDur[m] = { sum:0, count:0 };
      byMonthDur[m].sum += (n.duration||50);
      byMonthDur[m].count++;
    });
    const durationTrend = Object.entries(byMonthDur).slice(-8).map(([month, d]) => ({ month, avg: Math.round(d.sum/d.count) }));

    // Top tags
    const tagCounts = {};
    notes.forEach(n => {
      const tags = Array.isArray(n.tags) ? n.tags : (n.tags||"").split(",").map(t=>t.trim()).filter(Boolean);
      tags.forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; });
    });
    const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);

    // Total words written
    const totalWords = notes.reduce((s, n) => s + wordCount(n.notes||""), 0);
    const avgDuration = notes.length ? Math.round(notes.reduce((s,n) => s+(n.duration||50),0)/notes.length) : 0;

    return { sessionsByMonth, byType, durationTrend, topTags, totalWords, avgDuration };
  }, [notes]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveNote = useCallback(fd => {
    const tags = typeof fd.tags === "string"
      ? fd.tags.split(",").map(t => t.trim()).filter(Boolean)
      : fd.tags;
    const payload = { ...fd, tags };

    if (editNote) {
      setNotes(prev => prev.map(n => n.id === editNote.id ? { ...payload, id:editNote.id } : n));
      push("Note updated");
    } else {
      setNotes(prev => [{ ...payload, id: nextId.current++ }, ...prev]);
      push("Note saved");
    }
    setShowModal(false); setEditNote(null);
  }, [editNote]);

  const delNote = useCallback((id, date) => {
    setConfirm({ msg:`Delete the session note from ${fmtDate(date)}? This cannot be undone.`, danger:true, onOk:() => {
      setNotes(prev => prev.filter(n => n.id !== id));
      setConfirm(null); push("Note deleted", "error");
    }});
  }, []);

  const clearAll = () => {
    setConfirm({ msg:"Clear ALL therapy notes? Export your data first if needed.", danger:true, onOk:() => {
      setNotes([]); localStorage.removeItem("tn2_notes");
      setConfirm(null); push("All notes cleared", "error");
    }});
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(notes,null,2)], { type:"application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=`therapy-notes-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Notes exported");
  };

  const exportTXT = () => {
    const lines = notes.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n => [
      `${"═".repeat(60)}`,
      `DATE: ${fmtDate(n.date)}  |  TYPE: ${n.sessionType}  |  THERAPIST: ${n.therapist||"—"}`,
      `MOOD: ${n.mood||"—"}  |  DURATION: ${n.duration||"—"}min${n.private?" |  ⚠ CONFIDENTIAL":""}`,
      n.goals?.length ? `GOALS: ${n.goals.join("; ")}` : "",
      ``,
      n.notes,
      ``,
      n.homework ? `HOMEWORK: ${n.homework}` : "",
      n.followUp ? `FOLLOW-UP: ${n.followUp}` : "",
      `TAGS: ${Array.isArray(n.tags)?n.tags.join(", "):n.tags||"none"}`,
    ].filter(l=>l!==null&&l!=="").join("\n")).join("\n\n");
    const blob = new Blob([lines], { type:"text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=`therapy-notes-${todayStr()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Report downloaded");
  };

  const importJSON = useCallback(e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw new Error("bad format");
        const existing = new Set(notes.map(n => n.id));
        const news = parsed.filter(p => p?.id && !existing.has(p.id));
        if (!news.length) { push("No new notes to import", "error"); return; }
        setNotes(prev => [...prev, ...news]);
        nextId.current = Math.max(nextId.current, ...news.map(n=>n.id)) + 1;
        push(`Imported ${news.length} note${news.length!==1?"s":""}`);
      } catch { push("Invalid file format", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [notes]);

  const TABS = [
    { k:"notes",     label:"Notes",     icon:BookOpen },
    { k:"analytics", label:"Analytics", icon:BarChart3 },
    { k:"insights",  label:"AI Insights", icon:Brain },
  ];

  const btnStyle = (active=false, col=C.gold) => ({
    display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:9,
    fontSize:12, fontWeight:700, cursor:"pointer",
    background: active ? col : "none",
    border: active ? "none" : `1px solid ${C.border}`,
    color: active ? "#0a0806" : C.muted,
    transition: "all .15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans', 'Nunito', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4);cursor:pointer;}
        select option{background:${C.card};color:${C.text};}
        input::placeholder,textarea::placeholder{color:${C.dim};}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        .tabBtn:hover{background:${C.cardHi}!important;}
        .cardHov:hover{border-color:${C.borderHi}!important;}
      `}</style>

      {/* ── Navigation ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:0 }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:16 }}>
          {/* Brand */}
          <div style={{ padding:"13px 0", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <BookOpen size={17} color={C.gold}/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:C.text, letterSpacing:"-0.4px", lineHeight:1, fontFamily:"'Lora', Georgia, serif" }}>TherapyNotes</p>
              <p style={{ fontSize:9, color:C.muted, letterSpacing:".06em" }}>CLINICAL JOURNAL</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:2, flex:1, overflowX:"auto" }}>
            {TABS.map(({ k, label, icon:Icon }) => (
              <button key={k} className="tabBtn" onClick={() => setTab(k)} style={{ display:"flex", alignItems:"center", gap:6, padding:"13px 16px", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:tab===k?C.gold:C.muted, borderBottom:`2px solid ${tab===k?C.gold:"transparent"}`, transition:"all .18s", whiteSpace:"nowrap" }}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button onClick={exportTXT} title="Download report" style={btnStyle()}><FileText size={13}/></button>
            <button onClick={exportJSON} title="Export JSON" style={btnStyle()}><Download size={13}/></button>
            <input ref={fileRef} type="file" accept="application/json" style={{ display:"none" }} onChange={importJSON}/>
            <button onClick={() => fileRef.current?.click()} title="Import" style={btnStyle()}><Upload size={13}/></button>
            <button onClick={() => { setEditNote(null); setShowModal(true); }} style={btnStyle(true, C.gold)}>
              <Plus size={14}/>New Note
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:920, margin:"0 auto", padding:"26px 16px 80px" }}>

        {/* ═══ NOTES TAB ═══ */}
        {tab === "notes" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            {/* Stats strip */}
            <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" }}>
              <StatCard label="Total Sessions" value={notes.length}     sub={`${filtered.length} shown`}                     color={C.gold}     Icon={BookOpen}/>
              <StatCard label="Words Written"  value={analyticsData.totalWords.toLocaleString()} sub="across all notes"     color={C.lavender} Icon={FileText}/>
              <StatCard label="Avg Duration"   value={`${analyticsData.avgDuration}m`}           sub="per session"          color={C.sage}     Icon={Clock}/>
              <StatCard label="Session Types"  value={Object.keys(analyticsData.byType).length}  sub="different modalities" color={C.amber}    Icon={Tag}/>
            </div>

            {/* Search + type filter */}
            <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ position:"relative", flex:1, minWidth:200 }}>
                <Search size={14} color={C.muted} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
                <input style={{ width:"100%", background:C.card, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"9px 12px 9px 34px", color:C.text, fontSize:13, outline:"none" }} placeholder="Search notes, therapist, tags…" value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <button onClick={() => setTypeFilter("all")} style={{ ...btnStyle(typeFilter==="all",C.gold), fontSize:11 }}>All</button>
                {SESSION_TYPES.slice(0,5).map(s => (
                  <button key={s.value} onClick={() => setTypeFilter(typeFilter===s.value?"all":s.value)}
                    style={{ ...btnStyle(typeFilter===s.value, s.color), fontSize:11 }}>{s.value}</button>
                ))}
              </div>
              <button onClick={clearAll} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 13px", borderRadius:9, background:`${C.rose}12`, border:`1px solid ${C.rose}30`, color:C.rose, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                <Trash2 size={12}/> Clear All
              </button>
            </div>

            {/* Note cards */}
            {filtered.length === 0 ? (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"52px 24px", textAlign:"center" }}>
                <BookOpen size={44} color={C.dim} style={{ marginBottom:14 }}/>
                <p style={{ color:C.muted, fontSize:14, fontFamily:"'Lora',Georgia,serif" }}>{search ? "No notes match your search." : "No session notes yet. Start your first entry."}</p>
                {!search && <button onClick={() => setShowModal(true)} style={{ marginTop:18, padding:"10px 24px", borderRadius:10, background:C.gold, border:"none", color:"#0a0806", fontWeight:700, fontSize:13, cursor:"pointer" }}>+ New Note</button>}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.map(note => (
                  <NoteCard key={note.id} note={note} onEdit={() => { setEditNote(note); setShowModal(true); }} onDelete={() => delNote(note.id, note.date)}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ ANALYTICS TAB ═══ */}
        {tab === "analytics" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeIn .3s ease" }}>

            {/* Sessions per month */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 16px 14px" }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4, fontFamily:"'Lora',Georgia,serif" }}>Sessions Over Time</p>
              <p style={{ fontSize:11, color:C.muted, marginBottom:18 }}>Monthly session count</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analyticsData.sessionsByMonth} margin={{ top:4, right:4, left:-24, bottom:0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Bar dataKey="count" name="Sessions" fill={C.gold} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Duration trend + type breakdown */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 14px 12px" }}>
                <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:14 }}>Avg Duration (mins)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={analyticsData.durationTrend} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:9 }} stroke={C.border} tickLine={false}/>
                    <YAxis tick={{ fill:C.muted, fontSize:9 }} stroke={C.border} tickLine={false}/>
                    <Tooltip content={<VTooltip/>}/>
                    <Line type="monotone" dataKey="avg" name="Avg mins" stroke={C.sage} strokeWidth={2.5} dot={{ fill:C.sage, r:3, strokeWidth:0 }} activeDot={{ r:5 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 14px" }}>
                <p style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:14 }}>Sessions by Type</p>
                {Object.entries(analyticsData.byType).sort((a,b)=>b[1]-a[1]).map(([type, count]) => {
                  const sc = getSessionConfig(type);
                  const pct = Math.round((count / notes.length) * 100);
                  return (
                    <div key={type} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:12, color:C.muted }}>{type}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:sc.color }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height:5, background:C.border, borderRadius:99, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:sc.color, borderRadius:99 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top tags */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:14, fontFamily:"'Lora',Georgia,serif" }}>Most Used Tags</p>
              {analyticsData.topTags.length === 0
                ? <p style={{ color:C.muted, fontSize:13 }}>No tags recorded yet.</p>
                : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {analyticsData.topTags.map(([tag, count]) => (
                      <div key={tag} style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <span style={{ fontSize:12, color:C.muted, minWidth:140 }}>{tag}</span>
                        <div style={{ flex:1, height:6, background:C.border, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(count/notes.length)*100}%`, background:C.gold, borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:C.gold, minWidth:24, textAlign:"right" }}>{count}×</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ═══ AI INSIGHTS TAB ═══ */}
        {tab === "insights" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .3s ease" }}>

            {/* Context overview */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
              <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4, fontFamily:"'Lora',Georgia,serif" }}>Clinical Overview</p>
              <p style={{ fontSize:12, color:C.muted, marginBottom:16 }}>Summary metrics drawn from your session record</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
                {[
                  { label:"Sessions analysed",  val:notes.length,          color:C.gold },
                  { label:"Modalities used",     val:Object.keys(analyticsData.byType).length, color:C.sage },
                  { label:"Total session time",  val:`${Math.round(notes.reduce((s,n)=>s+(n.duration||50),0)/60)}h`, color:C.blue },
                  { label:"Clinical tags",        val:Object.keys(analyticsData.topTags.reduce((o,[t])=>({...o,[t]:1}),{})).length, color:C.lavender },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:C.cardHi, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>{label}</p>
                    <p style={{ fontSize:22, fontWeight:800, color, margin:0, letterSpacing:"-0.5px" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <AIInsights notes={notes}/>

            {/* Reflective prompts */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${C.sage}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Heart size={16} color={C.sage}/></div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:0, fontFamily:"'Lora',Georgia,serif" }}>Reflective Practice Prompts</p>
                  <p style={{ fontSize:11, color:C.muted, margin:"2px 0 0" }}>Use these between supervision sessions</p>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  "What themes have appeared repeatedly across sessions?",
                  "Where have you felt most uncertain in your clinical work?",
                  "Which interventions have generated the clearest progress?",
                  "What countertransference reactions have you noticed?",
                  "Which sessions drained you most — and why?",
                  "What would you do differently if you could revisit a session?",
                ].map((prompt, i) => (
                  <div key={i} style={{ padding:"12px 14px", background:C.surface, borderRadius:10, border:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:12, color:C.muted, lineHeight:1.65, margin:0, fontFamily:"'Lora',Georgia,serif", fontStyle:"italic" }}>"{prompt}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => { setEditNote(null); setShowModal(true); }}
        style={{ position:"fixed", bottom:28, right:24, width:52, height:52, borderRadius:"50%", background:C.gold, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.gold}44`, zIndex:40, transition:"transform .15s" }}
        onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
        <Plus size={22} color="#0a0806" strokeWidth={2.5}/>
      </button>

      {showModal && <NoteModal initial={editNote} onSave={saveNote} onClose={() => { setShowModal(false); setEditNote(null); }}/>}
      {confirm   && <Confirm msg={confirm.msg} danger={confirm.danger} onOk={confirm.onOk} onCancel={() => setConfirm(null)}/>}
      {toast     && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
    </div>
  );
}