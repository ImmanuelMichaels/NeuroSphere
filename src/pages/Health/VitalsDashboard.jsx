import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Activity, Droplet, Heart, TrendingUp, TrendingDown,
  AlertCircle, Plus, X, Minus, Brain, Clock, Trash2,
  ChevronDown, ChevronUp, Zap, RefreshCw, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from "recharts";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg:        "#080c10",
  panel:     "#0d1117",
  card:      "#111827",
  cardHi:    "#161f2e",
  border:    "#1e2d3d",
  borderHi:  "#2a3f56",
  text:      "#e2e8f0",
  muted:     "#64748b",
  dim:       "#374151",
  cyan:      "#22d3ee",
  cyanDim:   "#0e7490",
  green:     "#4ade80",
  greenDim:  "#166534",
  amber:     "#fbbf24",
  amberDim:  "#78350f",
  orange:    "#fb923c",
  red:       "#f87171",
  redDim:    "#7f1d1d",
  rose:      "#fb7185",
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const now = new Date();
const buildSeed = () => {
  const glucose = [], bp = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    // 1–3 readings per day
    const readings = i < 3 ? 3 : 2;
    const times = readings === 3 ? ["07:30","13:00","20:00"] : ["08:00","20:00"];
    times.forEach(t => {
      const base = 95 + Math.sin(i * 0.7) * 20 + Math.random() * 30;
      glucose.push({ id: `g-${ds}-${t}`, date: ds, time: t, value: Math.round(base), meal: t < "12:00" ? "fasting" : "post-meal", notes: "" });
      const sys = 118 + Math.sin(i * 0.5) * 10 + Math.random() * 18;
      const dia = 74 + Math.sin(i * 0.4) * 6 + Math.random() * 12;
      bp.push({ id: `b-${ds}-${t}`, date: ds, time: t, systolic: Math.round(sys), diastolic: Math.round(dia), notes: "" });
    });
  }
  return { glucose, bp };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const glucoseStatus = v => {
  if (v < 70)  return { label:"Low",      color: C.amber,  bg: C.amberDim + "44",  ring: C.amber };
  if (v <= 100) return { label:"Normal",   color: C.green,  bg: C.greenDim + "44",  ring: C.green };
  if (v <= 140) return { label:"Elevated", color: C.orange, bg: C.amberDim + "44",  ring: C.orange };
  return            { label:"High",      color: C.red,    bg: C.redDim + "44",    ring: C.red };
};
const bpStatus = (s, d) => {
  if (s < 120 && d < 80)  return { label:"Normal",   color: C.green,  bg: C.greenDim + "44" };
  if (s < 130 && d < 80)  return { label:"Elevated",  color: C.amber,  bg: C.amberDim + "44" };
  if (s < 140 || d < 90)  return { label:"Stage 1",   color: C.orange, bg: C.amberDim + "44" };
  return                   { label:"Stage 2",   color: C.red,    bg: C.redDim + "44" };
};

const fmtTime = t => { try { const [h,m]=t.split(":"); const hh=parseInt(h); return `${hh%12||12}:${m}${hh>=12?"PM":"AM"}`; } catch { return t; } };
const fmtDate = ds => { try { return new Date(ds+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return ds; } };
const todayStr = () => new Date().toISOString().split("T")[0];
const nowTimeStr = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const clamp = (v, mn, mx) => Math.min(mx, Math.max(mn, v));

// ─── Stepper Control ──────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min, max, step = 1, color = C.cyan, unit = "" }) => {
  const holdRef = useRef(null);
  const startHold = (dir) => {
    onChange(v => clamp(v + dir * step, min, max));
    holdRef.current = setTimeout(() => {
      holdRef.current = setInterval(() => onChange(v => clamp(v + dir * step, min, max)), 60);
    }, 400);
  };
  const stopHold = () => { clearTimeout(holdRef.current); clearInterval(holdRef.current); };
  useEffect(() => () => stopHold(), []);

  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, background: C.panel, border:`1.5px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
      <button onMouseDown={()=>startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={()=>startHold(-1)} onTouchEnd={stopHold}
        style={{ width:48, height:56, background:"none", border:"none", cursor:value<=min?"not-allowed":"pointer", color:value<=min?C.dim:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:300, transition:"background .12s" }}
        disabled={value <= min}>
        <Minus size={16}/>
      </button>
      <div style={{ flex:1, textAlign:"center", minWidth:80 }}>
        <span style={{ fontSize:28, fontWeight:800, color:C.text, fontVariantNumeric:"tabular-nums", letterSpacing:"-1px" }}>{value}</span>
        {unit && <span style={{ fontSize:12, color:C.muted, marginLeft:4 }}>{unit}</span>}
      </div>
      <button onMouseDown={()=>startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={()=>startHold(1)} onTouchEnd={stopHold}
        style={{ width:48, height:56, background:"none", border:"none", cursor:value>=max?"not-allowed":"pointer", color:value>=max?C.dim:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:300, transition:"background .12s" }}
        disabled={value >= max}>
        <Plus size={16}/>
      </button>
    </div>
  );
};

// ─── Gauge Arc ────────────────────────────────────────────────────────────────
const GaugeArc = ({ value, min, max, color, size = 120 }) => {
  const pct = clamp((value - min) / (max - min), 0, 1);
  const r = 44, cx = 60, cy = 60;
  const startAngle = -210, sweep = 240;
  const toRad = a => (a * Math.PI) / 180;
  const arcPt = a => ({ x: cx + r * Math.cos(toRad(a)), y: cy + r * Math.sin(toRad(a)) });
  const end = startAngle + sweep * pct;
  const s = arcPt(startAngle), e = arcPt(end), full = arcPt(startAngle + sweep);
  const largeArc = sweep * pct > 180 ? 1 : 0;
  const largeFull = sweep > 180 ? 1 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeFull} 1 ${full.x} ${full.y}`} fill="none" stroke={C.border} strokeWidth={8} strokeLinecap="round"/>
      {pct > 0 && <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" style={{ filter:`drop-shadow(0 0 6px ${color}88)` }}/>}
    </svg>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const VTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.cardHi, border:`1px solid ${C.borderHi}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
      <p style={{ color: C.muted, marginBottom:4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight:700, margin:"2px 0" }}>{p.name}: {p.value}{unit || ""}</p>
      ))}
    </div>
  );
};

// ─── AI Insights Panel ────────────────────────────────────────────────────────
const AIInsights = ({ glucoseData, bpData }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true);
    const recentG = glucoseData.slice(-14).map(r => `${r.date} ${r.time}: ${r.value} mg/dL (${r.meal})`).join("\n");
    const recentB = bpData.slice(-10).map(r => `${r.date} ${r.time}: ${r.systolic}/${r.diastolic} mmHg`).join("\n");
    const prompt = `You are a clinical health AI assistant. Analyze this patient's vitals data and give concise, actionable insights in 3-4 short paragraphs. Focus on patterns, risks, and practical recommendations. Be empathetic but direct. Do NOT give a diagnosis.

Blood Glucose readings (mg/dL):
${recentG}

Blood Pressure readings (mmHg):
${recentB}

Provide: 1) A brief pattern summary, 2) Key concerns if any, 3) Practical lifestyle tips, 4) When to consult a doctor.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text ?? "No insight returned.";
      setInsight(text);
    } catch (e) {
      setError(e.message || "Failed to fetch insight. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [glucoseData, bpData]);

  return (
    <div style={{ background: C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
      <button onClick={open ? ()=>setOpen(false) : fetchInsight}
        style={{ width:"100%", padding:"16px 20px", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`${C.cyan}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Brain size={18} color={C.cyan}/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:0 }}>AI Health Insights</p>
          <p style={{ fontSize:12, color:C.muted, margin:"2px 0 0" }}>Pattern analysis across your vitals history</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {!open && <span style={{ fontSize:11, fontWeight:700, color:C.cyan, background:`${C.cyan}18`, padding:"4px 10px", borderRadius:99 }}>Analyze</span>}
          {open ? <ChevronUp size={16} color={C.muted}/> : <ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>

      {open && (
        <div style={{ padding:"0 20px 20px", borderTop:`1px solid ${C.border}` }}>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"20px 0" }}>
              <div style={{ width:20, height:20, border:`2px solid ${C.cyan}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
              <span style={{ fontSize:13, color:C.muted }}>Analyzing your vitals with AI…</span>
            </div>
          )}
          {error && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px", background:`${C.red}18`, borderRadius:10, marginTop:14 }}>
              <AlertCircle size={16} color={C.red}/>
              <p style={{ fontSize:13, color:C.red, margin:0 }}>{error}</p>
              <button onClick={fetchInsight} style={{ marginLeft:"auto", background:`${C.cyan}22`, border:"none", color:C.cyan, fontSize:12, padding:"5px 10px", borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><RefreshCw size={12}/>Retry</button>
            </div>
          )}
          {insight && !loading && (
            <div style={{ marginTop:14 }}>
              {insight.split("\n\n").filter(Boolean).map((para, i) => (
                <p key={i} style={{ fontSize:13, color: i===0 ? C.text : C.muted, lineHeight:1.75, marginBottom:10, padding: i===0?"12px 14px":"0", background:i===0?`${C.cyan}0a`:"transparent", borderRadius:i===0?8:0, borderLeft:i===0?`2px solid ${C.cyan}`:"none", paddingLeft:i===0?14:0 }}>{para}</p>
              ))}
              <button onClick={fetchInsight} style={{ marginTop:8, background:`${C.cyan}15`, border:`1px solid ${C.cyanDim}`, color:C.cyan, fontSize:12, fontWeight:600, padding:"7px 14px", borderRadius:8, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={12}/>Refresh Analysis</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Stat Chip ────────────────────────────────────────────────────────────────
const StatChip = ({ label, value, unit, color, sub }) => (
  <div style={{ background:C.cardHi, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", flex:1, minWidth:100 }}>
    <p style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 6px" }}>{label}</p>
    <p style={{ fontSize:22, fontWeight:800, color, letterSpacing:"-0.5px", margin:0 }}>{value}<span style={{ fontSize:12, fontWeight:500, color:C.muted, marginLeft:3 }}>{unit}</span></p>
    {sub && <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>{sub}</p>}
  </div>
);

// ─── Delete Confirm ───────────────────────────────────────────────────────────
const DeleteConfirm = ({ onOk, onCancel, label }) => (
  <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:16, padding:24, maxWidth:340, width:"100%" }}>
      <p style={{ color:C.text, fontSize:14, marginBottom:20 }}>Delete reading <b style={{ color:C.rose }}>{label}</b>? This cannot be undone.</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ padding:"8px 16px", borderRadius:8, background:C.dim, border:"none", color:C.text, fontSize:13, cursor:"pointer" }}>Cancel</button>
        <button onClick={onOk} style={{ padding:"8px 16px", borderRadius:8, background:C.red, border:"none", color:"#0f0f0f", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><Trash2 size={13}/>Delete</button>
      </div>
    </div>
  </div>
);

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  const color = type === "success" ? C.green : type === "error" ? C.red : C.amber;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:C.cardHi, border:`1px solid ${color}`, borderRadius:12, padding:"12px 18px", color:C.text, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:`0 0 24px ${color}44`, animation:"slideUp .2s ease", maxWidth:300 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:color }}/>
      {msg}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function VitalsDashboard() {
  const seed = useMemo(() => buildSeed(), []);

  const [glucoseData, setGlucoseData] = useState(() => {
    try { const s = localStorage.getItem("vd_glucose"); return s ? JSON.parse(s) : seed.glucose; } catch { return seed.glucose; }
  });
  const [bpData, setBpData] = useState(() => {
    try { const s = localStorage.getItem("vd_bp"); return s ? JSON.parse(s) : seed.bp; } catch { return seed.bp; }
  });

  useEffect(() => { try { localStorage.setItem("vd_glucose", JSON.stringify(glucoseData)); } catch {} }, [glucoseData]);
  useEffect(() => { try { localStorage.setItem("vd_bp", JSON.stringify(bpData)); } catch {} }, [bpData]);

  // Form state
  const [panel, setPanel] = useState("overview");   // overview | log | history
  const [logTab, setLogTab] = useState("glucose");

  // Glucose form
  const [gVal, setGVal] = useState(100);
  const [gMeal, setGMeal] = useState("fasting");
  const [gNotes, setGNotes] = useState("");
  const [gTime, setGTime] = useState(nowTimeStr);
  const [gDate, setGDate] = useState(todayStr);

  // BP form
  const [bpSys, setBpSys] = useState(120);
  const [bpDia, setBpDia] = useState(80);
  const [bpNotes, setBpNotes] = useState("");
  const [bpTime, setBpTime] = useState(nowTimeStr);
  const [bpDate, setBpDate] = useState(todayStr);

  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [histFilter, setHistFilter] = useState("all"); // all | glucose | bp

  const pushToast = (msg, type = "success") => setToast({ msg, type });

  // ── Computed ─────────────────────────────────────────────────────────────
  const latestG = glucoseData[glucoseData.length - 1];
  const latestB = bpData[bpData.length - 1];
  const gStat = glucoseStatus(latestG?.value ?? 100);
  const bStat = bpStatus(latestB?.systolic ?? 120, latestB?.diastolic ?? 80);

  // Chart data: last 14 days averaged per day
  const glucoseChart = useMemo(() => {
    const byDay = {};
    glucoseData.forEach(r => {
      if (!byDay[r.date]) byDay[r.date] = [];
      byDay[r.date].push(r.value);
    });
    return Object.entries(byDay).slice(-14).map(([date, vals]) => ({
      date: fmtDate(date),
      avg: Math.round(vals.reduce((a,b)=>a+b,0)/vals.length),
      min: Math.min(...vals),
      max: Math.max(...vals),
    }));
  }, [glucoseData]);

  const bpChart = useMemo(() => {
    const byDay = {};
    bpData.forEach(r => {
      if (!byDay[r.date]) byDay[r.date] = [];
      byDay[r.date].push(r);
    });
    return Object.entries(byDay).slice(-14).map(([date, recs]) => ({
      date: fmtDate(date),
      systolic: Math.round(recs.reduce((a,b)=>a+b.systolic,0)/recs.length),
      diastolic: Math.round(recs.reduce((a,b)=>a+b.diastolic,0)/recs.length),
    }));
  }, [bpData]);

  // 7-day averages
  const last7G = glucoseData.slice(-21).map(r=>r.value);
  const avgG = last7G.length ? Math.round(last7G.reduce((a,b)=>a+b,0)/last7G.length) : 0;
  const last7B = bpData.slice(-14);
  const avgSys = last7B.length ? Math.round(last7B.reduce((a,b)=>a+b.systolic,0)/last7B.length) : 0;
  const avgDia = last7B.length ? Math.round(last7B.reduce((a,b)=>a+b.diastolic,0)/last7B.length) : 0;

  // History (combined, sorted desc)
  const historyRows = useMemo(() => {
    const rows = [];
    if (histFilter !== "bp") glucoseData.forEach(r => rows.push({ ...r, type:"glucose" }));
    if (histFilter !== "glucose") bpData.forEach(r => rows.push({ ...r, type:"bp" }));
    return rows.sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time)).slice(0,60);
  }, [glucoseData, bpData, histFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveGlucose = () => {
    if (gVal < 20 || gVal > 600) return pushToast("Value out of range (20–600)", "error");
    const id = `g-${gDate}-${gTime}-${Date.now()}`;
    setGlucoseData(prev => [...prev, { id, date:gDate, time:gTime, value:gVal, meal:gMeal, notes:gNotes }]);
    pushToast(`Glucose ${gVal} mg/dL saved`);
    setGNotes(""); setGTime(nowTimeStr()); setGDate(todayStr());
  };

  const saveBP = () => {
    if (bpSys < 60 || bpSys > 250 || bpDia < 40 || bpDia > 150) return pushToast("Values out of physiologic range", "error");
    const id = `b-${bpDate}-${bpTime}-${Date.now()}`;
    setBpData(prev => [...prev, { id, date:bpDate, time:bpTime, systolic:bpSys, diastolic:bpDia, notes:bpNotes }]);
    pushToast(`BP ${bpSys}/${bpDia} mmHg saved`);
    setBpNotes(""); setBpTime(nowTimeStr()); setBpDate(todayStr());
  };

  const confirmDelete = (row) => setDeleteTarget(row);
  const doDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "glucose") setGlucoseData(prev => prev.filter(r=>r.id!==deleteTarget.id));
    else setBpData(prev => prev.filter(r=>r.id!==deleteTarget.id));
    setDeleteTarget(null);
    pushToast("Reading deleted", "error");
  };

  // ─── Input field style ────────────────────────────────────────────────────
  const inputSt = { width:"100%", background:C.panel, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" };
  const labelSt = { display:"block", fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 };
  const btnPrimary = (color=C.cyan) => ({ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:"none", background:color, color:"#030712", transition:"opacity .15s" });
  const btnGhost = { display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:`1px solid ${C.border}`, background:"none", color:C.muted };

  const TABS = [{ k:"overview",label:"Overview",icon:Activity },{ k:"log",label:"Log Reading",icon:Plus },{ k:"history",label:"History",icon:Clock }];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans','Nunito',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:${C.bg}; } ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
        input[type=date]::-webkit-calendar-picker-indicator, input[type=time]::-webkit-calendar-picker-indicator { filter:invert(.5); cursor:pointer; }
        select option { background:${C.card}; color:${C.text}; }
        input::placeholder, textarea::placeholder { color:${C.dim}; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { transform:translateY(12px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .tab-btn:hover { background:${C.cardHi} !important; }
        .row-del:hover .del-btn { opacity:1 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:C.panel, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:0 }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ padding:"14px 0", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${C.cyan}1a`, border:`1px solid ${C.cyanDim}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={17} color={C.cyan}/>
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:C.text, letterSpacing:"-0.4px", lineHeight:1 }}>Vitals</p>
              <p style={{ fontSize:10, color:C.muted, letterSpacing:".04em" }}>HEALTH DASHBOARD</p>
            </div>
          </div>

          <div style={{ display:"flex", gap:2, overflowX:"auto", flex:1 }}>
            {TABS.map(({ k, label, icon:Icon }) => (
              <button key={k} className="tab-btn" onClick={()=>setPanel(k)} style={{ display:"flex", alignItems:"center", gap:7, padding:"15px 16px", background:panel===k?`${C.cyan}12`:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:panel===k?C.cyan:C.muted, borderBottom:`2px solid ${panel===k?C.cyan:"transparent"}`, transition:"all .18s", whiteSpace:"nowrap", borderRadius:"4px 4px 0 0" }}>
                <Icon size={14}/>{label}
              </button>
            ))}
          </div>

          {/* Live clock */}
          <LiveClock />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 16px 64px" }}>

        {/* ═══ OVERVIEW ═══ */}
        {panel === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20, animation:"fadeIn .3s ease" }}>

            {/* Status hero row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {/* Glucose hero */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:-10, top:-10, opacity:.04 }}><Droplet size={120}/></div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${C.green}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Droplet size={16} color={C.green}/></div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Blood Glucose</p>
                    <p style={{ fontSize:11, color:C.muted }}>{latestG ? `${fmtDate(latestG.date)} ${fmtTime(latestG.time)}` : "No data"}</p>
                  </div>
                  <div style={{ marginLeft:"auto" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:gStat.color, background:gStat.bg, padding:"4px 10px", borderRadius:99, border:`1px solid ${gStat.color}44` }}>{gStat.label}</span>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <GaugeArc value={latestG?.value ?? 100} min={60} max={300} color={gStat.color} size={110}/>
                  <div>
                    <p style={{ fontSize:42, fontWeight:800, color:gStat.color, letterSpacing:"-2px", lineHeight:1, filter:`drop-shadow(0 0 12px ${gStat.color}66)` }}>{latestG?.value ?? "—"}</p>
                    <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>mg/dL</p>
                    <p style={{ fontSize:11, color:C.muted, marginTop:6 }}>Target: 70–140</p>
                  </div>
                </div>
              </div>

              {/* BP hero */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:-10, top:-10, opacity:.04 }}><Heart size={120}/></div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${C.rose}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Heart size={16} color={C.rose}/></div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Blood Pressure</p>
                    <p style={{ fontSize:11, color:C.muted }}>{latestB ? `${fmtDate(latestB.date)} ${fmtTime(latestB.time)}` : "No data"}</p>
                  </div>
                  <div style={{ marginLeft:"auto" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:bStat.color, background:bStat.bg, padding:"4px 10px", borderRadius:99, border:`1px solid ${bStat.color}44` }}>{bStat.label}</span>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <GaugeArc value={latestB?.systolic ?? 120} min={90} max={200} color={bStat.color} size={110}/>
                  <div>
                    <p style={{ fontSize:36, fontWeight:800, color:bStat.color, letterSpacing:"-1.5px", lineHeight:1, filter:`drop-shadow(0 0 12px ${bStat.color}66)` }}>{latestB ? `${latestB.systolic}/${latestB.diastolic}` : "—"}</p>
                    <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>mmHg</p>
                    <p style={{ fontSize:11, color:C.muted, marginTop:6 }}>Target: &lt;120/80</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <StatChip label="7-Day Avg Glucose" value={avgG} unit="mg/dL" color={glucoseStatus(avgG).color} sub={glucoseStatus(avgG).label}/>
              <StatChip label="Avg Systolic" value={avgSys} unit="mmHg" color={bpStatus(avgSys,avgDia).color} sub="7-day mean"/>
              <StatChip label="Avg Diastolic" value={avgDia} unit="mmHg" color={bpStatus(avgSys,avgDia).color} sub="7-day mean"/>
              <StatChip label="Total Readings" value={glucoseData.length + bpData.length} unit="" color={C.cyan} sub={`${glucoseData.length}G / ${bpData.length}BP`}/>
            </div>

            {/* Glucose Chart */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 16px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, paddingRight:8 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:C.text }}>Blood Glucose — 14-Day Trend</p>
                  <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>Daily averages with min/max range</p>
                </div>
                <div style={{ display:"flex", gap:12, fontSize:11 }}>
                  <span style={{ color:C.green, display:"flex", alignItems:"center", gap:4 }}>● Avg</span>
                  <span style={{ color:C.cyanDim, display:"flex", alignItems:"center", gap:4 }}>▲ Range</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={glucoseChart} margin={{ top:6, right:6, left:-20, bottom:0 }}>
                  <defs>
                    <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gRange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.cyanDim} stopOpacity={0.18}/>
                      <stop offset="95%" stopColor={C.cyanDim} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false} domain={[60,220]}/>
                  <Tooltip content={<VTooltip unit=" mg/dL"/>}/>
                  <ReferenceLine y={70}  stroke={C.amber} strokeDasharray="4 3" strokeOpacity={.5}/>
                  <ReferenceLine y={140} stroke={C.orange} strokeDasharray="4 3" strokeOpacity={.5}/>
                  <Area type="monotone" dataKey="max" name="Max" stroke="none" fill="url(#gRange)" fillOpacity={1}/>
                  <Area type="monotone" dataKey="avg" name="Avg" stroke={C.green} strokeWidth={2.5} fill="url(#gGrad)" dot={{ fill:C.green, r:3, strokeWidth:0 }} activeDot={{ r:5 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* BP Chart */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 16px 12px" }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>Blood Pressure — 14-Day Trend</p>
              <p style={{ fontSize:11, color:C.muted, marginBottom:16 }}>Daily averages — systolic & diastolic</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bpChart} margin={{ top:6, right:6, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} stroke={C.border} tickLine={false} domain={[60,180]}/>
                  <Tooltip content={<VTooltip unit=" mmHg"/>}/>
                  <Legend wrapperStyle={{ fontSize:11, color:C.muted }}/>
                  <ReferenceLine y={120} stroke={C.amber} strokeDasharray="4 3" strokeOpacity={.5}/>
                  <ReferenceLine y={80}  stroke={C.cyanDim} strokeDasharray="4 3" strokeOpacity={.4}/>
                  <Line type="monotone" dataKey="systolic" name="Systolic" stroke={C.rose} strokeWidth={2.5} dot={{ fill:C.rose, r:3, strokeWidth:0 }} activeDot={{ r:5 }}/>
                  <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke={C.cyan} strokeWidth={2} dot={{ fill:C.cyan, r:3, strokeWidth:0 }} activeDot={{ r:5 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insights */}
            <AIInsights glucoseData={glucoseData} bpData={bpData}/>
          </div>
        )}

        {/* ═══ LOG READING ═══ */}
        {panel === "log" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            {/* Tabs */}
            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              {[{ k:"glucose", label:"Blood Glucose", icon:Droplet, color:C.green },{ k:"bp", label:"Blood Pressure", icon:Heart, color:C.rose }].map(({ k, label, icon:Icon, color }) => (
                <button key={k} onClick={()=>setLogTab(k)} style={{ flex:1, padding:"13px", borderRadius:12, background:logTab===k?`${color}14`:C.card, border:`1.5px solid ${logTab===k?color:C.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13, fontWeight:700, color:logTab===k?color:C.muted, transition:"all .18s" }}>
                  <Icon size={15}/>{label}
                </button>
              ))}
            </div>

            {/* Glucose form */}
            {logTab === "glucose" && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${C.green}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Droplet size={18} color={C.green}/></div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:800, color:C.text }}>Log Blood Glucose</p>
                    <p style={{ fontSize:12, color:C.muted }}>Use stepper or type directly</p>
                  </div>
                  {/* Live preview badge */}
                  <div style={{ marginLeft:"auto" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:glucoseStatus(gVal).color, background:glucoseStatus(gVal).bg, padding:"5px 12px", borderRadius:99, border:`1px solid ${glucoseStatus(gVal).color}44` }}>{glucoseStatus(gVal).label}</span>
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Glucose Value (mg/dL)</label>
                  <Stepper value={gVal} onChange={fn=>setGVal(v=>clamp(typeof fn==="function"?fn(v):fn,20,600))} min={20} max={600} step={1} color={glucoseStatus(gVal).color} unit="mg/dL"/>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[70,90,100,120,140,180].map(v=>(
                      <button key={v} onClick={()=>setGVal(v)} style={{ padding:"5px 12px", borderRadius:8, background:gVal===v?`${C.green}22`:C.panel, border:`1px solid ${gVal===v?C.green:C.border}`, color:gVal===v?C.green:C.muted, fontSize:12, cursor:"pointer", fontWeight:600 }}>{v}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={labelSt}>Date</label>
                    <input type="date" style={inputSt} value={gDate} onChange={e=>setGDate(e.target.value)}/>
                  </div>
                  <div>
                    <label style={labelSt}>Time</label>
                    <input type="time" style={inputSt} value={gTime} onChange={e=>setGTime(e.target.value)}/>
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Meal Context</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["fasting","pre-meal","post-meal","bedtime"].map(m=>(
                      <button key={m} onClick={()=>setGMeal(m)} style={{ flex:1, padding:"9px 6px", borderRadius:9, background:gMeal===m?`${C.cyan}18`:C.panel, border:`1px solid ${gMeal===m?C.cyan:C.border}`, color:gMeal===m?C.cyan:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"capitalize", transition:"all .15s" }}>{m}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Notes (optional)</label>
                  <textarea style={{ ...inputSt, resize:"vertical", minHeight:60 }} placeholder="e.g. after exercise, skipped lunch…" value={gNotes} onChange={e=>setGNotes(e.target.value)}/>
                </div>

                {/* Reference box */}
                <div style={{ display:"flex", gap:10, background:`${C.green}0a`, border:`1px solid ${C.green}22`, borderRadius:10, padding:"12px 14px" }}>
                  <AlertCircle size={15} color={C.green} style={{ flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12, color:C.muted, lineHeight:1.65 }}>Fasting normal: <b style={{ color:C.text }}>70–100 mg/dL</b> · Post-meal normal: <b style={{ color:C.text }}>&lt;140 mg/dL</b> · Elevated: <b style={{ color:C.amber }}>140–199</b> · High: <b style={{ color:C.red }}>&gt;200</b></p>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button style={btnPrimary(C.green)} onClick={saveGlucose}><CheckCircle2 size={14}/>Save Reading</button>
                  <button style={btnGhost} onClick={()=>setPanel("overview")}>Cancel</button>
                </div>
              </div>
            )}

            {/* BP form */}
            {logTab === "bp" && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${C.rose}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Heart size={18} color={C.rose}/></div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:800, color:C.text }}>Log Blood Pressure</p>
                    <p style={{ fontSize:12, color:C.muted }}>Systolic over diastolic</p>
                  </div>
                  <div style={{ marginLeft:"auto" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:bpStatus(bpSys,bpDia).color, background:bpStatus(bpSys,bpDia).bg, padding:"5px 12px", borderRadius:99, border:`1px solid ${bpStatus(bpSys,bpDia).color}44` }}>{bpStatus(bpSys,bpDia).label}</span>
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Systolic (mmHg) — top number</label>
                  <Stepper value={bpSys} onChange={fn=>setBpSys(v=>clamp(typeof fn==="function"?fn(v):fn,60,250))} min={60} max={250} step={1} color={bpStatus(bpSys,bpDia).color} unit="mmHg"/>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[100,110,120,130,140,160].map(v=>(
                      <button key={v} onClick={()=>setBpSys(v)} style={{ padding:"5px 12px", borderRadius:8, background:bpSys===v?`${C.rose}22`:C.panel, border:`1px solid ${bpSys===v?C.rose:C.border}`, color:bpSys===v?C.rose:C.muted, fontSize:12, cursor:"pointer", fontWeight:600 }}>{v}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Diastolic (mmHg) — bottom number</label>
                  <Stepper value={bpDia} onChange={fn=>setBpDia(v=>clamp(typeof fn==="function"?fn(v):fn,40,150))} min={40} max={150} step={1} color={C.cyan} unit="mmHg"/>
                  <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[60,70,75,80,85,90].map(v=>(
                      <button key={v} onClick={()=>setBpDia(v)} style={{ padding:"5px 12px", borderRadius:8, background:bpDia===v?`${C.cyan}22`:C.panel, border:`1px solid ${bpDia===v?C.cyan:C.border}`, color:bpDia===v?C.cyan:C.muted, fontSize:12, cursor:"pointer", fontWeight:600 }}>{v}</button>
                    ))}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label style={labelSt}>Date</label>
                    <input type="date" style={inputSt} value={bpDate} onChange={e=>setBpDate(e.target.value)}/>
                  </div>
                  <div>
                    <label style={labelSt}>Time</label>
                    <input type="time" style={inputSt} value={bpTime} onChange={e=>setBpTime(e.target.value)}/>
                  </div>
                </div>

                <div>
                  <label style={labelSt}>Notes (optional)</label>
                  <textarea style={{ ...inputSt, resize:"vertical", minHeight:60 }} placeholder="e.g. after exercise, feeling stressed…" value={bpNotes} onChange={e=>setBpNotes(e.target.value)}/>
                </div>

                <div style={{ display:"flex", gap:10, background:`${C.rose}0a`, border:`1px solid ${C.rose}22`, borderRadius:10, padding:"12px 14px" }}>
                  <AlertCircle size={15} color={C.rose} style={{ flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12, color:C.muted, lineHeight:1.65 }}>Normal: <b style={{ color:C.text }}>&lt;120/80</b> · Elevated: <b style={{ color:C.amber }}>120–129/&lt;80</b> · Stage 1: <b style={{ color:C.orange }}>130–139/80–89</b> · Stage 2: <b style={{ color:C.red }}>&gt;140/90</b></p>
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button style={btnPrimary(C.rose)} onClick={saveBP}><CheckCircle2 size={14}/>Save Reading</button>
                  <button style={btnGhost} onClick={()=>setPanel("overview")}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {panel === "history" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.muted, marginRight:4 }}>Filter:</p>
              {[["all","All"],["glucose","Glucose"],["bp","Blood Pressure"]].map(([k,l])=>(
                <button key={k} onClick={()=>setHistFilter(k)} style={{ padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:700, cursor:"pointer", border:`1.5px solid ${histFilter===k?C.cyan:C.border}`, background:histFilter===k?`${C.cyan}14`:C.card, color:histFilter===k?C.cyan:C.muted, transition:"all .15s" }}>{l}</button>
              ))}
              <span style={{ marginLeft:"auto", fontSize:12, color:C.dim }}>{historyRows.length} records shown</span>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
              {historyRows.length === 0 ? (
                <p style={{ textAlign:"center", color:C.muted, padding:40, fontSize:14 }}>No readings yet — log your first reading above.</p>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 2px", fontSize:13 }}>
                    <thead>
                      <tr>{["Type","Date","Time","Value","Status","Notes",""].map(h=>(
                        <th key={h} style={{ textAlign:"left", padding:"12px 16px", color:C.dim, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:".06em", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {historyRows.map(row => {
                        const isG = row.type === "glucose";
                        const st = isG ? glucoseStatus(row.value) : bpStatus(row.systolic, row.diastolic);
                        const valDisplay = isG ? `${row.value} mg/dL` : `${row.systolic}/${row.diastolic} mmHg`;
                        return (
                          <tr key={row.id} className="row-del" style={{ background:C.panel, transition:"background .12s" }}>
                            <td style={{ padding:"11px 16px", borderLeft:`2px solid ${isG?C.green:C.rose}`, borderRadius:"6px 0 0 6px" }}>
                              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, color:isG?C.green:C.rose }}>
                                {isG ? <Droplet size={12}/> : <Heart size={12}/>}
                                {isG ? "Glucose" : "BP"}
                              </span>
                            </td>
                            <td style={{ padding:"11px 16px", color:C.muted }}>{fmtDate(row.date)}</td>
                            <td style={{ padding:"11px 16px", color:C.muted }}>{fmtTime(row.time)}</td>
                            <td style={{ padding:"11px 16px", fontWeight:800, color:C.text, fontVariantNumeric:"tabular-nums" }}>{valDisplay}</td>
                            <td style={{ padding:"11px 16px" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, padding:"3px 9px", borderRadius:99 }}>{st.label}</span>
                            </td>
                            <td style={{ padding:"11px 16px", color:C.dim, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.notes||"—"}</td>
                            <td style={{ padding:"11px 16px", borderRadius:"0 6px 6px 0" }}>
                              <button className="del-btn" onClick={()=>confirmDelete(row)} style={{ opacity:0, background:"none", border:"none", cursor:"pointer", color:C.red, transition:"opacity .15s", padding:"4px 6px", borderRadius:6 }}>
                                <Trash2 size={13}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button onClick={()=>setPanel("log")} style={{ position:"fixed", bottom:28, right:24, width:52, height:52, borderRadius:"50%", background:C.cyan, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 24px ${C.cyan}66`, zIndex:40, transition:"transform .15s" }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Plus size={22} color="#030712" strokeWidth={2.5}/>
      </button>

      {deleteTarget && <DeleteConfirm label={deleteTarget.type==="glucose"?`${deleteTarget.value} mg/dL`:`${deleteTarget.systolic}/${deleteTarget.diastolic} mmHg`} onOk={doDelete} onCancel={()=>setDeleteTarget(null)}/>}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => { const t = setInterval(()=>setTime(new Date()), 1000); return ()=>clearInterval(t); }, []);
  return (
    <div style={{ textAlign:"right", flexShrink:0, display:"none", padding:"10px 0" }} className="clock">
      <p style={{ fontSize:13, fontWeight:700, color:C.cyan, fontVariantNumeric:"tabular-nums" }}>{time.toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</p>
      <p style={{ fontSize:10, color:C.muted }}>{time.toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}</p>
      <style>{`.clock { display: block !important; }`}</style>
    </div>
  );
}