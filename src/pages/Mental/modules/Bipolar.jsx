import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AlertTriangle, TrendingUp, Zap, Calendar, Plus, Minus, X,
  Brain, Moon, Sun, Activity, Shield, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Trash2, RefreshCw, Heart, Wind, Coffee,
  Edit3, Save, AlertCircle, BarChart2, List
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       "#07090f",
  surface:  "#0d1117",
  card:     "#111827",
  cardHi:   "#151e2d",
  border:   "#1e2d3d",
  borderHi: "#2a3f56",
  text:     "#e2e8f0",
  muted:    "#64748b",
  dim:      "#374151",
  // Spectrum — mood colors from depressed→manic
  depressed:"#3b82f6",
  low:      "#8b5cf6",
  stable:   "#10b981",
  elevated: "#f59e0b",
  high:     "#ef4444",
  manic:    "#ff6b6b",
  // Accents
  indigo:   "#818cf8",
  teal:     "#2dd4bf",
  violet:   "#a78bfa",
  amber:    "#fbbf24",
  rose:     "#fb7185",
  cyan:     "#22d3ee",
};

const MOOD_SCALE = [
  { val: 1, label: "Severely Depressed", color: "#1d4ed8", bg: "#1e3a5f44" },
  { val: 2, label: "Depressed",          color: "#3b82f6", bg: "#1e3a5f44" },
  { val: 3, label: "Mildly Depressed",   color: "#8b5cf6", bg: "#3b1f6644" },
  { val: 4, label: "Low",                color: "#a78bfa", bg: "#3b1f6644" },
  { val: 5, label: "Stable",             color: "#10b981", bg: "#06403344" },
  { val: 6, label: "Good",               color: "#34d399", bg: "#06403344" },
  { val: 7, label: "Elevated",           color: "#f59e0b", bg: "#451a0344" },
  { val: 8, label: "Hypomanic",          color: "#fb923c", bg: "#43180344" },
  { val: 9, label: "Manic",              color: "#ef4444", bg: "#7f1d1d44" },
  { val: 10, label: "Severely Manic",    color: "#ff6b6b", bg: "#7f1d1d44" },
];

const getMoodInfo = v => MOOD_SCALE.find(m => m.val === Math.round(clamp(v, 1, 10))) || MOOD_SCALE[4];

const TRIGGERS = [
  { id: "sleep",   label: "Sleep < 6h",       icon: Moon },
  { id: "stress",  label: "High Stress",       icon: Wind },
  { id: "caffeine",label: "Caffeine > 300mg",  icon: Coffee },
  { id: "social",  label: "Social Overload",   icon: Heart },
  { id: "alcohol", label: "Alcohol",           icon: Activity },
  { id: "exercise",label: "No Exercise",       icon: Zap },
];

const MEDICATIONS = [
  { id: 1, name: "Lithium Carbonate", dosage: "300mg", schedule: "2× Daily" },
  { id: 2, name: "Quetiapine",        dosage: "50mg",  schedule: "Bedtime"  },
  { id: 3, name: "Lamotrigine",       dosage: "200mg", schedule: "Morning"  },
];

const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
const todayStr = () => new Date().toISOString().split("T")[0];
const nowTime  = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtDate  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const fmtDay   = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{weekday:"short"}); } catch { return s; } };

// ─── Seed data: 14 days of realistic mood logs ────────────────────────────────
const buildSeed = () => {
  const logs = [];
  let id = 1;
  const pattern = [5,5,6,7,8,7,6,5,4,3,4,5,6,7];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const base = pattern[13 - i];
    const noise = Math.round((Math.random() - 0.5) * 1.5);
    const mood = clamp(base + noise, 1, 10);
    const sleep = +(4 + Math.random() * 5).toFixed(1);
    const energy = clamp(Math.round(mood * 0.8 + Math.random() * 2), 1, 10);
    const anxiety = clamp(Math.round(11 - mood + Math.random() * 2), 1, 10);
    const triggers = TRIGGERS.filter(() => Math.random() > 0.7).map(t => t.id);
    const medsTaken = { 1: Math.random() > 0.15, 2: Math.random() > 0.2, 3: Math.random() > 0.12 };
    logs.push({ id: id++, date: ds, time: "09:00", mood, sleep, energy, anxiety, triggers, medsTaken, notes: "" });
  }
  return logs;
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min = 1, max = 10, step = 1, color = T.teal, label = "", size = "md" }) => {
  const holdRef = useRef(null);
  const start = dir => {
    onChange(v => clamp(+(v + dir * step).toFixed(2), min, max));
    holdRef.current = setTimeout(() => {
      holdRef.current = setInterval(() => onChange(v => clamp(+(v + dir * step).toFixed(2), min, max)), 80);
    }, 380);
  };
  const stop = () => { clearTimeout(holdRef.current); clearInterval(holdRef.current); };
  useEffect(() => () => stop(), []);
  const h = size === "sm" ? 40 : 52;
  const fs = size === "sm" ? 18 : 28;
  return (
    <div style={{ display:"flex", alignItems:"center", background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:12, overflow:"hidden", width:"100%" }}>
      <button onMouseDown={()=>start(-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>start(-1)} onTouchEnd={stop}
        disabled={value <= min}
        style={{ width:h, height:h, background:"none", border:"none", color:value<=min?T.dim:color, cursor:value<=min?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"color .1s" }}>
        <Minus size={size==="sm"?13:16}/>
      </button>
      <div style={{ flex:1, textAlign:"center" }}>
        <span style={{ fontSize:fs, fontWeight:800, color:T.text, fontVariantNumeric:"tabular-nums", letterSpacing:"-1px" }}>{Number.isInteger(value)?value:value.toFixed(1)}</span>
        {label && <span style={{ fontSize:11, color:T.muted, marginLeft:4 }}>{label}</span>}
      </div>
      <button onMouseDown={()=>start(1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>start(1)} onTouchEnd={stop}
        disabled={value >= max}
        style={{ width:h, height:h, background:"none", border:"none", color:value>=max?T.dim:color, cursor:value>=max?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"color .1s" }}>
        <Plus size={size==="sm"?13:16}/>
      </button>
    </div>
  );
};

// ─── MoodOrb ──────────────────────────────────────────────────────────────────
const MoodOrb = ({ value, size = 100 }) => {
  const info = getMoodInfo(value);
  const rings = 3;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {Array.from({length:rings}).map((_,i) => (
        <div key={i} style={{ position:"absolute", inset: -(i*10), borderRadius:"50%", border:`1px solid ${info.color}`, opacity:(0.3 - i*0.08), animation:`pulse ${1.5+i*.4}s ease-in-out infinite alternate` }}/>
      ))}
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:info.bg, border:`2px solid ${info.color}`, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" }}>
        <span style={{ fontSize:size>80?28:20, fontWeight:900, color:info.color, letterSpacing:"-2px", lineHeight:1 }}>{value}</span>
        <span style={{ fontSize:9, color:info.color, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>/ 10</span>
      </div>
    </div>
  );
};

// ─── Risk Meter ───────────────────────────────────────────────────────────────
const RiskMeter = ({ pct, label }) => {
  const color = pct >= 70 ? T.rose : pct >= 45 ? T.amber : T.teal;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>{label}</span>
        <span style={{ fontSize:16, fontWeight:800, color, fontVariantNumeric:"tabular-nums" }}>{pct}%</span>
      </div>
      <div style={{ height:8, background:T.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${color}99, ${color})`, borderRadius:99, transition:"width .6s ease", boxShadow:`0 0 8px ${color}88` }}/>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const c = type==="success"?T.teal:type==="error"?T.rose:T.amber;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:T.cardHi, border:`1px solid ${c}`, borderRadius:12, padding:"12px 18px", color:T.text, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:`0 4px 24px ${c}33`, animation:"slideUp .2s ease", maxWidth:320 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:c }}/>
      {msg}
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:16, padding:24, maxWidth:360, width:"100%" }}>
      <p style={{ color:T.text, fontSize:14, lineHeight:1.7, marginBottom:20 }}>{msg}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:8, background:T.border, border:"none", color:T.text, fontSize:13, cursor:"pointer" }}>Cancel</button>
        <button onClick={onOk} style={{ padding:"8px 16px", borderRadius:8, background:T.rose, border:"none", color:"#0f0f0f", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Trash2 size={13}/>Delete</button>
      </div>
    </div>
  </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:T.cardHi, border:`1px solid ${T.borderHi}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color:T.muted, marginBottom:5, fontWeight:600 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color||T.text, margin:"2px 0", fontWeight:600 }}>{p.name}: <b>{p.value}</b></p>)}
    </div>
  );
};

// ─── AI Insights ──────────────────────────────────────────────────────────────
const AIInsights = ({ logs }) => {
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true); setText(null);
    const recent = logs.slice(-14).map(l =>
      `${l.date}: mood=${l.mood}/10 sleep=${l.sleep}h energy=${l.energy}/10 anxiety=${l.anxiety}/10 triggers=[${l.triggers.join(",")||"none"}] meds=${Object.values(l.medsTaken).filter(Boolean).length}/3`
    ).join("\n");

    const prompt = `You are a compassionate bipolar disorder management AI. Analyze 14 days of patient mood tracking data. Be warm, empathetic, and clinically informed. Give 4 focused paragraphs: 1) Pattern analysis (mood swings, cycles, phase detection), 2) Risk factors identified (sleep, triggers, med adherence), 3) Protective behaviors and what's working, 4) Specific actionable recommendations. Keep each paragraph 2-3 sentences. Do NOT diagnose. Do NOT replace medical advice. Always recommend professional consultation for concerning patterns.

Patient's 14-day data:
${recent}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role:"user", content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const out = data.content?.find(b => b.type==="text")?.text ?? "No response.";
      setText(out);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [logs]);

  const ICONS = [TrendingUp, AlertCircle, Shield, Zap];

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
      <button onClick={open?()=>setOpen(false):analyze}
        style={{ width:"100%", padding:"18px 20px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
        <div style={{ width:42, height:42, borderRadius:11, background:`${T.violet}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Brain size={19} color={T.violet}/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700, color:T.text, margin:0 }}>AI Pattern Analysis</p>
          <p style={{ fontSize:12, color:T.muted, margin:"2px 0 0" }}>14-day mood, sleep & trigger analysis</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!open && <span style={{ fontSize:11, fontWeight:700, color:T.violet, background:`${T.violet}18`, padding:"4px 10px", borderRadius:99 }}>Analyze</span>}
          {open ? <ChevronUp size={16} color={T.muted}/> : <ChevronDown size={16} color={T.muted}/>}
        </div>
      </button>

      {open && (
        <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${T.border}` }}>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"20px 0" }}>
              <div style={{ width:18, height:18, border:`2px solid ${T.violet}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
              <span style={{ fontSize:13, color:T.muted }}>Analyzing mood patterns with AI…</span>
            </div>
          )}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:14, background:`${T.rose}18`, borderRadius:10, marginTop:14 }}>
              <AlertCircle size={15} color={T.rose}/>
              <p style={{ fontSize:13, color:T.rose, margin:0, flex:1 }}>{error}</p>
              <button onClick={analyze} style={{ background:`${T.violet}22`, border:"none", color:T.violet, fontSize:12, padding:"5px 10px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><RefreshCw size={11}/>Retry</button>
            </div>
          )}
          {text && !loading && (
            <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:12 }}>
              {text.split("\n\n").filter(Boolean).map((para, i) => {
                const Icon = ICONS[i] || Brain;
                const colors = [T.violet, T.rose, T.teal, T.amber];
                const c = colors[i] || T.muted;
                return (
                  <div key={i} style={{ display:"flex", gap:10, padding:"12px 14px", background:`${c}0c`, borderRadius:10, borderLeft:`2px solid ${c}` }}>
                    <Icon size={14} color={c} style={{ flexShrink:0, marginTop:2 }}/>
                    <p style={{ fontSize:13, color:i===0?T.text:T.muted, lineHeight:1.75, margin:0 }}>{para}</p>
                  </div>
                );
              })}
              <button onClick={analyze} style={{ marginTop:4, alignSelf:"flex-start", background:`${T.violet}15`, border:`1px solid ${T.violet}44`, color:T.violet, fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={12}/>Re-analyze</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Log Mood Modal ───────────────────────────────────────────────────────────
const LogMoodModal = ({ initial, onSave, onClose }) => {
  const [mood,    setMood]    = useState(initial?.mood    ?? 5);
  const [sleep,   setSleep]   = useState(initial?.sleep   ?? 7);
  const [energy,  setEnergy]  = useState(initial?.energy  ?? 5);
  const [anxiety, setAnxiety] = useState(initial?.anxiety ?? 3);
  const [trigs,   setTrigs]   = useState(initial?.triggers ?? []);
  const [meds,    setMeds]    = useState(initial?.medsTaken ?? { 1:false, 2:false, 3:false });
  const [notes,   setNotes]   = useState(initial?.notes   ?? "");
  const [date,    setDate]    = useState(initial?.date    ?? todayStr());
  const [time,    setTime]    = useState(initial?.time    ?? nowTime());

  const info = getMoodInfo(mood);
  const inp  = { width:"100%", background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:10, padding:"9px 12px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl  = { display:"block", fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:8000, overflowY:"auto", padding:"20px 16px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:20, width:"100%", maxWidth:560, padding:28 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <MoodOrb value={mood} size={60}/>
            <div>
              <p style={{ fontSize:18, fontWeight:800, color:T.text, margin:0 }}>{initial ? "Edit Log" : "Log Mood"}</p>
              <p style={{ fontSize:13, color:info.color, fontWeight:600, margin:"2px 0 0" }}>{info.label}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted }}><X size={18}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* Mood stepper — main */}
          <div>
            <label style={lbl}>Mood Level (1–10)</label>
            <Stepper value={mood} onChange={fn=>setMood(v=>clamp(typeof fn==="function"?fn(v):fn,1,10))} min={1} max={10} color={info.color}/>
            {/* Preset pills */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
              {MOOD_SCALE.map(m => (
                <button key={m.val} onClick={()=>setMood(m.val)} style={{ padding:"4px 10px", borderRadius:99, fontSize:11, fontWeight:700, cursor:"pointer", background:mood===m.val?`${m.color}22`:T.surface, border:`1px solid ${mood===m.val?m.color:T.border}`, color:mood===m.val?m.color:T.muted, transition:"all .12s" }}>{m.val}</button>
              ))}
            </div>
          </div>

          {/* Sleep / Energy / Anxiety row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            {[
              { lbl:"Sleep (hrs)", val:sleep, set:setSleep, min:0, max:12, step:.5, color:T.indigo, unit:"h" },
              { lbl:"Energy",     val:energy, set:setEnergy, min:1, max:10, step:1,  color:T.amber },
              { lbl:"Anxiety",    val:anxiety,set:setAnxiety,min:1, max:10, step:1,  color:T.rose },
            ].map(({ lbl: l, val, set, min, max, step, color, unit }) => (
              <div key={l}>
                <label style={{ ...lbl, marginBottom:4 }}>{l}</label>
                <Stepper value={val} onChange={fn=>set(v=>clamp(typeof fn==="function"?fn(v):fn,min,max))} min={min} max={max} step={step} color={color} label={unit} size="sm"/>
              </div>
            ))}
          </div>

          {/* Triggers */}
          <div>
            <label style={lbl}>Triggers today</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {TRIGGERS.map(t => {
                const on = trigs.includes(t.id);
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={()=>setTrigs(p=>on?p.filter(x=>x!==t.id):[...p,t.id])} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:on?`${T.rose}18`:T.surface, border:`1px solid ${on?T.rose:T.border}`, color:on?T.rose:T.muted, transition:"all .12s" }}>
                    <Icon size={12}/>{t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Medications */}
          <div>
            <label style={lbl}>Medications taken</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {MEDICATIONS.map(m => {
                const on = !!meds[m.id];
                return (
                  <div key={m.id} onClick={()=>setMeds(p=>({...p,[m.id]:!p[m.id]}))} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, cursor:"pointer", background:on?`${T.teal}0e`:T.surface, border:`1px solid ${on?T.teal:T.border}`, transition:"all .15s" }}>
                    <div style={{ width:20, height:20, borderRadius:6, background:on?T.teal:T.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .15s" }}>
                      {on && <CheckCircle2 size={13} color="#030712"/>}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:0 }}>{m.name}</p>
                      <p style={{ fontSize:11, color:T.muted, margin:0 }}>{m.dosage} · {m.schedule}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date / Time */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label style={lbl}>Time</label><input type="time" style={inp} value={time} onChange={e=>setTime(e.target.value)}/></div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, resize:"vertical", minHeight:64 }} placeholder="How are you feeling? Any context…" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>

          {/* Buttons */}
          <div style={{ display:"flex", gap:10, paddingTop:4 }}>
            <button onClick={()=>onSave({ mood, sleep, energy, anxiety, triggers:trigs, medsTaken:meds, notes, date, time })} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"12px", borderRadius:10, background:info.color, border:"none", color:"#030712", fontSize:14, fontWeight:800, cursor:"pointer" }}>
              <Save size={15}/>{initial?"Update Entry":"Save Entry"}
            </button>
            <button onClick={onClose} style={{ padding:"12px 20px", borderRadius:10, background:"none", border:`1px solid ${T.border}`, color:T.muted, fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function Bipolar() {
  const [logs, setLogs] = useState(() => {
    try { const s = localStorage.getItem("bp_logs"); return s ? JSON.parse(s) : buildSeed(); } catch { return buildSeed(); }
  });
  const [medStatus, setMedStatus] = useState(() => {
    try { const s = localStorage.getItem("bp_meds"); return s ? JSON.parse(s) : {1:false,2:false,3:false}; } catch { return {1:false,2:false,3:false}; }
  });

  useEffect(() => { try { localStorage.setItem("bp_logs", JSON.stringify(logs)); } catch {} }, [logs]);
  useEffect(() => { try { localStorage.setItem("bp_meds", JSON.stringify(medStatus)); } catch {} }, [medStatus]);

  const [tab,       setTab]       = useState("overview");   // overview | log | history | analysis
  const [showModal, setShowModal] = useState(false);
  const [editLog,   setEditLog]   = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [toast,     setToast]     = useState(null);
  const nextId = useRef(Math.max(0, ...logs.map(l=>l.id)) + 1);

  const push = (msg, type="success") => setToast({ msg, type });

  // ── Computed ─────────────────────────────────────────────────────────────
  const latest = logs[logs.length - 1];
  const latestInfo = getMoodInfo(latest?.mood ?? 5);

  // Risk computation (simplified heuristic)
  const maniaRisk = useMemo(() => {
    const last5 = logs.slice(-5);
    if (!last5.length) return 0;
    const avgMood = last5.reduce((s,l)=>s+l.mood,0)/last5.length;
    const avgSleep = last5.reduce((s,l)=>s+l.sleep,0)/last5.length;
    const trigCount = last5.reduce((s,l)=>s+l.triggers.length,0);
    const missedMeds = last5.reduce((s,l)=>s+(3-Object.values(l.medsTaken).filter(Boolean).length),0);
    const r = Math.round(clamp(((avgMood-5)/5)*40 + (6-avgSleep)*5 + trigCount*3 + missedMeds*4, 0, 100));
    return r;
  }, [logs]);

  const depressionRisk = useMemo(() => {
    const last5 = logs.slice(-5);
    if (!last5.length) return 0;
    const avgMood = last5.reduce((s,l)=>s+l.mood,0)/last5.length;
    const avgEnergy = last5.reduce((s,l)=>s+l.energy,0)/last5.length;
    const avgAnxiety = last5.reduce((s,l)=>s+l.anxiety,0)/last5.length;
    return Math.round(clamp(((5-avgMood)/5)*35 + (5-avgEnergy)*4 + avgAnxiety*3, 0, 100));
  }, [logs]);

  // Chart data
  const chartData = useMemo(() => logs.slice(-14).map(l => ({
    date:    fmtDate(l.date),
    day:     fmtDay(l.date),
    mood:    l.mood,
    sleep:   l.sleep,
    energy:  l.energy,
    anxiety: l.anxiety,
    meds:    Object.values(l.medsTaken).filter(Boolean).length,
  })), [logs]);

  const radarData = useMemo(() => {
    const last7 = logs.slice(-7);
    if (!last7.length) return [];
    const avg = arr => +(arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(1);
    return [
      { subject:"Mood",    A: avg(last7.map(l=>l.mood)),    fullMark:10 },
      { subject:"Sleep",   A: avg(last7.map(l=>l.sleep)),   fullMark:10 },
      { subject:"Energy",  A: avg(last7.map(l=>l.energy)),  fullMark:10 },
      { subject:"Calm",    A: avg(last7.map(l=>11-l.anxiety)),fullMark:10},
      { subject:"Meds",    A: avg(last7.map(l=>Object.values(l.medsTaken).filter(Boolean).length/3*10)),fullMark:10 },
    ];
  }, [logs]);

  // Most frequent triggers (last 14 days)
  const topTriggers = useMemo(() => {
    const counts = {};
    logs.slice(-14).forEach(l => l.triggers.forEach(t => { counts[t] = (counts[t]||0)+1; }));
    return TRIGGERS.map(t => ({ ...t, count: counts[t.id]||0 })).sort((a,b)=>b.count-a.count).filter(t=>t.count>0).slice(0,4);
  }, [logs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveLog = useCallback(form => {
    if (editLog) {
      setLogs(prev => prev.map(l => l.id===editLog.id ? { ...l, ...form } : l));
      push("Entry updated");
    } else {
      setLogs(prev => [...prev, { ...form, id: nextId.current++ }]);
      push(`Mood ${form.mood}/10 logged`);
    }
    setShowModal(false); setEditLog(null);
  }, [editLog]);

  const deleteLog = useCallback((id, mood) => {
    setConfirm({ msg:`Delete this mood entry (${mood}/10)?`, onOk:() => {
      setLogs(prev => prev.filter(l=>l.id!==id));
      setConfirm(null); push("Entry deleted","error");
    }});
  }, []);

  const toggleMed = id => setMedStatus(p => ({ ...p, [id]: !p[id] }));

  const TABS = [
    { k:"overview", label:"Overview",  icon:Activity },
    { k:"log",      label:"Trends",    icon:BarChart2 },
    { k:"history",  label:"History",   icon:List },
    { k:"analysis", label:"AI Insight",icon:Brain },
  ];

  const btnPrimary = (c=T.violet) => ({ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:"none", background:c, color:"#030712" });
  const btnGhost   = { display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:`1px solid ${T.border}`, background:"none", color:T.muted };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans','Nunito',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${T.bg};}::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.5);cursor:pointer;}
        select option{background:${T.card};color:${T.text};}
        input::placeholder,textarea::placeholder{color:${T.dim};}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(12px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes pulse{from{opacity:.1;}to{opacity:.35;}}
        .tab-btn:hover{background:${T.cardHi}!important;}
        .row-hover:hover{background:${T.cardHi}!important;}
        .med-row:hover{border-color:${T.teal}!important;}
      `}</style>

      {/* ── Nav ── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:0 }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ padding:"13px 0", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${T.violet}1a`, border:`1px solid ${T.violet}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={17} color={T.violet}/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:T.text, letterSpacing:"-0.4px", lineHeight:1 }}>MoodTrack</p>
              <p style={{ fontSize:9, color:T.muted, letterSpacing:".06em" }}>BIPOLAR MANAGEMENT</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:2, flex:1, overflowX:"auto" }}>
            {TABS.map(({ k, label, icon:Icon }) => (
              <button key={k} className="tab-btn" onClick={()=>setTab(k)} style={{ display:"flex", alignItems:"center", gap:6, padding:"13px 14px", background:"none", border:"none", cursor:"pointer", fontSize:12, fontWeight:600, color:tab===k?T.violet:T.muted, borderBottom:`2px solid ${tab===k?T.violet:"transparent"}`, transition:"all .18s", whiteSpace:"nowrap", borderRadius:"4px 4px 0 0" }}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
          <button style={btnPrimary(T.violet)} onClick={()=>{ setEditLog(null); setShowModal(true); }}>
            <Zap size={14}/> Log Mood
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:920, margin:"0 auto", padding:"24px 16px 72px" }}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeIn .3s ease" }}>

            {/* Hero + Risk grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

              {/* Current mood hero */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:18, padding:22, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:12, top:12, opacity:.04 }}><Activity size={110}/></div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${T.violet}1a`, display:"flex", alignItems:"center", justifyContent:"center" }}><Activity size={16} color={T.violet}/></div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:T.text }}>Current Mood</p>
                    <p style={{ fontSize:11, color:T.muted }}>{latest ? `${fmtDate(latest.date)} · ${latest.time}` : "No entries"}</p>
                  </div>
                  <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color:latestInfo.color, background:latestInfo.bg, padding:"4px 10px", borderRadius:99, border:`1px solid ${latestInfo.color}44` }}>{latestInfo.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                  <MoodOrb value={latest?.mood ?? 5} size={100}/>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      { lbl:"Sleep",   val:`${latest?.sleep ?? "—"}h`, color:T.indigo },
                      { lbl:"Energy",  val:`${latest?.energy ?? "—"}/10`, color:T.amber },
                      { lbl:"Anxiety", val:`${latest?.anxiety ?? "—"}/10`, color:T.rose },
                    ].map(({ lbl, val, color }) => (
                      <div key={lbl}>
                        <p style={{ fontSize:10, color:T.dim, textTransform:"uppercase", letterSpacing:".05em", margin:0 }}>{lbl}</p>
                        <p style={{ fontSize:16, fontWeight:800, color, margin:0, letterSpacing:"-0.5px" }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk card */}
              <div style={{ background:T.card, border:`1px solid ${maniaRisk>=65?T.rose+"66":T.border}`, borderRadius:18, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${T.rose}1a`, display:"flex", alignItems:"center", justifyContent:"center" }}><AlertTriangle size={16} color={T.rose}/></div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:T.text }}>Episode Risk</p>
                    <p style={{ fontSize:11, color:T.muted }}>Based on last 5 entries</p>
                  </div>
                </div>
                <RiskMeter pct={maniaRisk} label="Manic episode risk"/>
                <RiskMeter pct={depressionRisk} label="Depressive episode risk"/>
                {maniaRisk >= 60 && (
                  <div style={{ display:"flex", gap:8, padding:"10px 12px", background:`${T.rose}0e`, border:`1px solid ${T.rose}22`, borderRadius:10 }}>
                    <AlertTriangle size={13} color={T.rose} style={{ flexShrink:0, marginTop:1 }}/>
                    <p style={{ fontSize:12, color:T.muted, margin:0 }}>Elevated pattern detected. Consider reviewing your prevention plan with your care team.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mini chart (7-day) */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 16px 12px" }}>
              <p style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>7-Day Mood Overview</p>
              <p style={{ fontSize:11, color:T.muted, marginBottom:16 }}>Mood, energy & anxiety trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData.slice(-7)} margin={{ top:4, right:4, left:-24, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="day" tick={{ fill:T.muted, fontSize:10 }} stroke={T.border} tickLine={false}/>
                  <YAxis tick={{ fill:T.muted, fontSize:10 }} stroke={T.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={5} stroke={T.dim} strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="mood"    name="Mood"    stroke={T.violet} strokeWidth={2.5} dot={{ fill:T.violet,r:3,strokeWidth:0 }} activeDot={{ r:5 }}/>
                  <Line type="monotone" dataKey="energy"  name="Energy"  stroke={T.amber}  strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                  <Line type="monotone" dataKey="anxiety" name="Anxiety" stroke={T.rose}   strokeWidth={1.5} dot={false} strokeDasharray="2 3"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Triggers + Meds row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

              {/* Triggers */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <TrendingUp size={15} color={T.amber}/>
                  <p style={{ fontSize:13, fontWeight:700, color:T.text }}>Top Triggers (14d)</p>
                </div>
                {topTriggers.length === 0
                  ? <p style={{ fontSize:13, color:T.muted }}>No triggers recorded yet.</p>
                  : topTriggers.map(t => {
                      const Icon = t.icon;
                      const pct = Math.round(t.count/14*100);
                      return (
                        <div key={t.id} style={{ marginBottom:12 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:5 }}><Icon size={11}/>{t.label}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:T.amber }}>{t.count}d</span>
                          </div>
                          <div style={{ height:5, background:T.border, borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:T.amber, borderRadius:99 }}/>
                          </div>
                        </div>
                      );
                    })
                }
              </div>

              {/* Today's Meds */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <Calendar size={15} color={T.teal}/>
                  <p style={{ fontSize:13, fontWeight:700, color:T.text }}>Today's Medications</p>
                </div>
                {MEDICATIONS.map(m => {
                  const on = !!medStatus[m.id];
                  return (
                    <div key={m.id} className="med-row" onClick={()=>toggleMed(m.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, cursor:"pointer", background:on?`${T.teal}0a`:T.surface, border:`1px solid ${on?T.teal:T.border}`, marginBottom:8, transition:"all .15s" }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:on?T.teal:T.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background .15s" }}>
                        {on && <CheckCircle2 size={13} color="#030712"/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:0 }}>{m.name}</p>
                        <p style={{ fontSize:11, color:T.muted, margin:0 }}>{m.dosage} · {m.schedule}</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:700, color:on?T.teal:T.muted }}>{on?"TAKEN":"PENDING"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRENDS ═══ */}
        {tab === "log" && (
          <div style={{ display:"flex", flexDirection:"column", gap:18, animation:"fadeIn .3s ease" }}>

            {/* Full mood area chart */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 16px 12px" }}>
              <p style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>Mood Stability — 14-Day</p>
              <p style={{ fontSize:11, color:T.muted, marginBottom:16 }}>Area = mood stability band (3–7 = stable zone)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top:6, right:6, left:-24, bottom:0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.violet} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={T.violet} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:10 }} stroke={T.border} tickLine={false}/>
                  <YAxis tick={{ fill:T.muted, fontSize:10 }} stroke={T.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={3} stroke={T.indigo} strokeDasharray="4 3" strokeOpacity={.5}/>
                  <ReferenceLine y={7} stroke={T.rose}   strokeDasharray="4 3" strokeOpacity={.5}/>
                  <Area type="monotone" dataKey="mood" name="Mood" stroke={T.violet} strokeWidth={2.5} fill="url(#moodGrad)" dot={{ fill:T.violet,r:3,strokeWidth:0 }} activeDot={{ r:5 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sleep + Meds adherence */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"18px 14px 12px" }}>
                <p style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:14 }}>Sleep (hrs)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} margin={{ top:4, right:4, left:-28, bottom:0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="day" tick={{ fill:T.muted, fontSize:9 }} stroke={T.border} tickLine={false}/>
                    <YAxis tick={{ fill:T.muted, fontSize:9 }} stroke={T.border} tickLine={false} domain={[0,12]}/>
                    <Tooltip content={<VTooltip/>}/>
                    <ReferenceLine y={7} stroke={T.teal} strokeDasharray="3 2" strokeOpacity={.6}/>
                    <Bar dataKey="sleep" name="Sleep" fill={T.indigo} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"18px 14px 12px" }}>
                <p style={{ fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:14 }}>Meds Taken / Day</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={chartData} margin={{ top:4, right:4, left:-28, bottom:0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="day" tick={{ fill:T.muted, fontSize:9 }} stroke={T.border} tickLine={false}/>
                    <YAxis tick={{ fill:T.muted, fontSize:9 }} stroke={T.border} tickLine={false} domain={[0,3]}/>
                    <Tooltip content={<VTooltip/>}/>
                    <ReferenceLine y={3} stroke={T.teal} strokeDasharray="3 2" strokeOpacity={.6}/>
                    <Bar dataKey="meds" name="Meds" fill={T.teal} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 16px 16px" }}>
              <p style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>7-Day Wellness Radar</p>
              <p style={{ fontSize:11, color:T.muted, marginBottom:8 }}>Average scores across key indicators</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top:10, right:20, left:20, bottom:10 }}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="subject" tick={{ fill:T.muted, fontSize:12, fontWeight:600 }}/>
                  <PolarRadiusAxis domain={[0,10]} tick={{ fill:T.dim, fontSize:9 }} tickCount={6}/>
                  <Radar name="You" dataKey="A" stroke={T.violet} fill={T.violet} fillOpacity={0.2} strokeWidth={2}/>
                  <Tooltip content={<VTooltip/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab === "history" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>Mood Log ({logs.length} entries)</p>
              <button style={btnPrimary(T.violet)} onClick={()=>{ setEditLog(null); setShowModal(true); }}><Plus size={13}/>New Entry</button>
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
              {logs.length === 0
                ? <p style={{ textAlign:"center", color:T.muted, padding:48, fontSize:14 }}>No entries yet. Log your first mood above.</p>
                : <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 2px", fontSize:13 }}>
                      <thead>
                        <tr>{["Date","Mood","Sleep","Energy","Anxiety","Meds","Triggers",""].map(h=>(
                          <th key={h} style={{ textAlign:"left", padding:"12px 14px", color:T.dim, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:".06em", borderBottom:`1px solid ${T.border}` }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {[...logs].reverse().map(l => {
                          const inf = getMoodInfo(l.mood);
                          const medCount = Object.values(l.medsTaken).filter(Boolean).length;
                          return (
                            <tr key={l.id} className="row-hover" style={{ background:T.surface, transition:"background .1s" }}>
                              <td style={{ padding:"11px 14px", borderLeft:`2px solid ${inf.color}`, borderRadius:"6px 0 0 6px", whiteSpace:"nowrap" }}>
                                <p style={{ fontSize:13, fontWeight:600, color:T.text, margin:0 }}>{fmtDate(l.date)}</p>
                                <p style={{ fontSize:10, color:T.muted, margin:0 }}>{l.time}</p>
                              </td>
                              <td style={{ padding:"11px 14px" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                  <span style={{ fontSize:16, fontWeight:800, color:inf.color, fontVariantNumeric:"tabular-nums" }}>{l.mood}</span>
                                  <span style={{ fontSize:10, color:inf.color, background:inf.bg, padding:"2px 6px", borderRadius:99 }}>{inf.label}</span>
                                </div>
                              </td>
                              <td style={{ padding:"11px 14px", color:T.muted }}>{l.sleep}h</td>
                              <td style={{ padding:"11px 14px", color:T.amber, fontWeight:700 }}>{l.energy}</td>
                              <td style={{ padding:"11px 14px", color:T.rose, fontWeight:700 }}>{l.anxiety}</td>
                              <td style={{ padding:"11px 14px" }}>
                                <span style={{ fontSize:11, fontWeight:700, color:medCount===3?T.teal:medCount===0?T.rose:T.amber }}>{medCount}/3</span>
                              </td>
                              <td style={{ padding:"11px 14px", maxWidth:140 }}>
                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                  {l.triggers.slice(0,2).map(tid => {
                                    const tr = TRIGGERS.find(t=>t.id===tid);
                                    return tr ? <span key={tid} style={{ fontSize:10, background:`${T.rose}18`, color:T.rose, padding:"2px 6px", borderRadius:5, whiteSpace:"nowrap" }}>{tr.label.split(" ")[0]}</span> : null;
                                  })}
                                  {l.triggers.length > 2 && <span style={{ fontSize:10, color:T.muted }}>+{l.triggers.length-2}</span>}
                                </div>
                              </td>
                              <td style={{ padding:"11px 14px", borderRadius:"0 6px 6px 0" }}>
                                <div style={{ display:"flex", gap:4 }}>
                                  <button onClick={()=>{ setEditLog(l); setShowModal(true); }} style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, padding:"4px 5px", borderRadius:5 }}><Edit3 size={12}/></button>
                                  <button onClick={()=>deleteLog(l.id,l.mood)} style={{ background:"none", border:"none", cursor:"pointer", color:T.rose, padding:"4px 5px", borderRadius:5 }}><Trash2 size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </div>
        )}

        {/* ═══ AI ANALYSIS ═══ */}
        {tab === "analysis" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeIn .3s ease" }}>
            {/* Summary stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              {(() => {
                const last14 = logs.slice(-14);
                const avg = arr => last14.length ? +(arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(1) : 0;
                const moodAvg = avg(last14.map(l=>l.mood));
                const sleepAvg = avg(last14.map(l=>l.sleep));
                const moodInfo = getMoodInfo(moodAvg);
                const adherence = last14.length ? Math.round(last14.reduce((s,l)=>s+(Object.values(l.medsTaken).filter(Boolean).length/3*100),0)/last14.length) : 0;
                return [
                  { lbl:"Avg Mood", val:moodAvg, unit:"/10", color:moodInfo.color },
                  { lbl:"Avg Sleep", val:sleepAvg, unit:"h", color:T.indigo },
                  { lbl:"Med Adherence", val:`${adherence}%`, unit:"", color:adherence>=80?T.teal:adherence>=60?T.amber:T.rose },
                  { lbl:"Mania Risk", val:`${maniaRisk}%`, unit:"", color:maniaRisk>=65?T.rose:maniaRisk>=40?T.amber:T.teal },
                ].map(({ lbl, val, unit, color }) => (
                  <div key={lbl} style={{ background:T.cardHi, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
                    <p style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{lbl}</p>
                    <p style={{ fontSize:22, fontWeight:800, color, letterSpacing:"-0.5px", margin:0 }}>{val}<span style={{ fontSize:11, color:T.muted }}>{unit}</span></p>
                  </div>
                ));
              })()}
            </div>

            <AIInsights logs={logs}/>

            {/* Prevention plan */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${T.teal}1a`, display:"flex", alignItems:"center", justifyContent:"center" }}><Shield size={16} color={T.teal}/></div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:T.text }}>Prevention Strategies</p>
                  <p style={{ fontSize:11, color:T.muted }}>Evidence-based bipolar management</p>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[
                  { icon:Moon,      color:T.indigo, title:"Sleep Hygiene",     tip:"Maintain consistent 7–9h sleep. Irregular sleep is the #1 trigger." },
                  { icon:Activity,  color:T.teal,   title:"Exercise Routine",   tip:"30 min daily moderate exercise stabilizes mood long-term." },
                  { icon:Calendar,  color:T.violet, title:"Med Consistency",    tip:"Take medications at the same time every day, even on good days." },
                  { icon:Brain,     color:T.amber,  title:"Therapy Sessions",   tip:"CBT and IPSRT help identify prodromal signs early." },
                ].map(({ icon:Icon, color, title, tip }) => (
                  <div key={title} style={{ display:"flex", gap:10, padding:"12px 14px", background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon size={14} color={color}/></div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:0 }}>{title}</p>
                      <p style={{ fontSize:12, color:T.muted, margin:"3px 0 0", lineHeight:1.5 }}>{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>{ setEditLog(null); setShowModal(true); }}
        style={{ position:"fixed", bottom:28, right:24, width:52, height:52, borderRadius:"50%", background:T.violet, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${T.violet}66`, zIndex:40, transition:"transform .15s" }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Zap size={20} color="#030712" strokeWidth={2.5}/>
      </button>

      {showModal && <LogMoodModal initial={editLog} onSave={saveLog} onClose={()=>{ setShowModal(false); setEditLog(null); }}/>}
      {confirm && <Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}