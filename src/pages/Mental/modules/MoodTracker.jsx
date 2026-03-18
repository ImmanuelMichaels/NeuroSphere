import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Calendar, Clock, Smile, Frown, AlertCircle,
  TrendingUp, TrendingDown, BarChart3, Edit2, Trash2, Search,
  Download, ChevronDown, Cloud, Sun, CloudRain, Wind, Activity,
  X, Upload, Brain, Zap, Moon, Heart, CheckCircle2, RefreshCw,
  FileText, Sparkles, Filter
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, Legend
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#080b12",
  surface:  "#0c1018",
  card:     "#111520",
  cardHi:   "#141929",
  border:   "#1c2639",
  borderHi: "#263350",
  text:     "#e2e8f5",
  muted:    "#5a6a85",
  dim:      "#2d3a50",
  // Mood spectrum
  elated:   "#a78bfa",
  happy:    "#34d399",
  neutral:  "#60a5fa",
  sad:      "#f59e0b",
  low:      "#f87171",
  // Accents
  violet:   "#8b5cf6",
  teal:     "#2dd4bf",
  amber:    "#fbbf24",
  rose:     "#fb7185",
  blue:     "#60a5fa",
  cyan:     "#22d3ee",
  green:    "#4ade80",
};

// ─── Mood scale config ────────────────────────────────────────────────────────
const MOODS = [
  { score:1,  label:"Devastated",  emoji:"😭", color:"#ef4444", glow:"#ef444433" },
  { score:2,  label:"Very Low",    emoji:"😢", color:"#f97316", glow:"#f9731633" },
  { score:3,  label:"Low",         emoji:"😔", color:"#f59e0b", glow:"#f59e0b33" },
  { score:4,  label:"Down",        emoji:"😕", color:"#eab308", glow:"#eab30833" },
  { score:5,  label:"Neutral",     emoji:"😐", color:"#60a5fa", glow:"#60a5fa33" },
  { score:6,  label:"Okay",        emoji:"🙂", color:"#34d399", glow:"#34d39933" },
  { score:7,  label:"Good",        emoji:"😊", color:"#10b981", glow:"#10b98133" },
  { score:8,  label:"Happy",       emoji:"😄", color:"#a78bfa", glow:"#a78bfa33" },
  { score:9,  label:"Great",       emoji:"😁", color:"#8b5cf6", glow:"#8b5cf633" },
  { score:10, label:"Elated",      emoji:"🤩", color:"#ec4899", glow:"#ec489933" },
];

const getMood = s => MOODS.find(m => m.score === Math.round(s)) || MOODS[4];

const WEATHER = [
  { value:"sunny",   label:"Sunny",   Icon:Sun },
  { value:"cloudy",  label:"Cloudy",  Icon:Cloud },
  { value:"rainy",   label:"Rainy",   Icon:CloudRain },
  { value:"windy",   label:"Windy",   Icon:Wind },
];

const ACTIVITIES_LIST = [
  "Exercise","Meditation","Reading","Socializing","Work","Outdoor Walk",
  "Creative Arts","Music","Cooking","Gaming","Rest","Journaling"
];

const TRIGGERS_LIST = [
  "Poor sleep","Work stress","Conflict","Isolation","Caffeine","Alcohol",
  "Bad news","Weather","Physical pain","Overwhelm","Financial stress"
];

const SYMPTOMS_LIST = [
  "Anxiety","Fatigue","Brain fog","Irritability","Mood swings",
  "Difficulty concentrating","Low motivation","Appetite changes","Insomnia"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp  = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
const todayS = () => new Date().toISOString().split("T")[0];
const nowT   = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtD   = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const fmtFull= s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"}); } catch { return s; } };

// ─── Seed data: 14 days ───────────────────────────────────────────────────────
const buildSeed = () => {
  const base = [6,7,5,4,3,5,7,8,7,6,5,6,7,8];
  const today = new Date();
  return base.map((b, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().split("T")[0];
    const score = clamp(b + Math.round((Math.random()-.5)*1.5), 1, 10);
    const mood  = getMood(score);
    return {
      id: i+1,
      date: ds,
      time: ["08:30","10:00","14:00","20:00"][Math.floor(Math.random()*4)],
      moodScore: score,
      moodLabel: mood.label,
      moodEmoji: mood.emoji,
      energy: clamp(score + Math.round((Math.random()-.4)*2), 1, 10),
      stress: clamp(11-score + Math.round((Math.random()-.5)*2), 1, 10),
      sleep:  +(4 + Math.random()*5).toFixed(1),
      weather: ["sunny","cloudy","rainy","windy"][Math.floor(Math.random()*4)],
      activities: ACTIVITIES_LIST.filter(()=>Math.random()>.6).slice(0,3),
      triggers: score<=4 ? TRIGGERS_LIST.filter(()=>Math.random()>.65).slice(0,2) : [],
      symptoms: score<=4 ? SYMPTOMS_LIST.filter(()=>Math.random()>.7).slice(0,2) : [],
      notes: score>=7 ? "Feeling good today, productive and energized." : score<=4 ? "Rough day. Struggling to stay focused and motivated." : "Average day, manageable overall.",
      medications: ["Sertraline 100mg"],
    };
  });
};

const BLANK_FORM = {
  date: todayS(), time: nowT(),
  moodScore:5, moodLabel:"Neutral", moodEmoji:"😐",
  energy:5, stress:5, sleep:7,
  weather:"sunny",
  activities:[], triggers:[], symptoms:[],
  notes:"", medications:[],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// Stepper with hold-to-repeat
const Stepper = ({ value, onChange, min=1, max=10, step=1, color=C.teal, unit="", size="md" }) => {
  const hold = useRef(null);
  const go = dir => {
    onChange(v => clamp(+(v+dir*step).toFixed(1), min, max));
    hold.current = setTimeout(() => {
      hold.current = setInterval(() => onChange(v => clamp(+(v+dir*step).toFixed(1), min, max)), 70);
    }, 350);
  };
  const stop = () => { clearTimeout(hold.current); clearInterval(hold.current); };
  useEffect(() => () => stop(), []);
  const h = size==="sm" ? 38 : 50;
  return (
    <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"100%"}}>
      <button onMouseDown={()=>go(-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(-1)} onTouchEnd={stop}
        disabled={value<=min}
        style={{width:h,height:h,background:"none",border:"none",color:value<=min?C.dim:color,cursor:value<=min?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Minus size={size==="sm"?12:15}/>
      </button>
      <div style={{flex:1,textAlign:"center"}}>
        <span style={{fontSize:size==="sm"?17:26,fontWeight:800,color:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:"-1px"}}>
          {Number.isInteger(value)?value:value.toFixed(1)}
        </span>
        {unit && <span style={{fontSize:11,color:C.muted,marginLeft:3}}>{unit}</span>}
      </div>
      <button onMouseDown={()=>go(1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(1)} onTouchEnd={stop}
        disabled={value>=max}
        style={{width:h,height:h,background:"none",border:"none",color:value>=max?C.dim:color,cursor:value>=max?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Plus size={size==="sm"?12:15}/>
      </button>
    </div>
  );
};

// Mood orb with glow ring
const MoodOrb = ({ score, size=90 }) => {
  const m = getMood(score);
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <div style={{position:"absolute",inset:-6,borderRadius:"50%",border:`1.5px solid ${m.color}`,opacity:.25,animation:"orbPulse 2s ease-in-out infinite alternate"}}/>
      <div style={{position:"absolute",inset:0,borderRadius:"50%",background:m.glow,border:`2px solid ${m.color}`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
        <span style={{fontSize:size>70?28:18}}>{m.emoji}</span>
        <span style={{fontSize:9,color:m.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginTop:1}}>{score}/10</span>
      </div>
    </div>
  );
};

// Metric mini-card
const MetricBadge = ({ label, value, unit, color }) => (
  <div style={{background:C.cardHi,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",flex:1,minWidth:80}}>
    <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",margin:"0 0 4px"}}>{label}</p>
    <p style={{fontSize:20,fontWeight:800,color,margin:0,letterSpacing:"-0.5px"}}>
      {value}<span style={{fontSize:11,color:C.muted,fontWeight:500,marginLeft:2}}>{unit}</span>
    </p>
  </div>
);

// Tag pill (toggleable)
const TagPill = ({ label, active, color=C.teal, onClick }) => (
  <button onClick={onClick} style={{
    padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${active?color:C.border}`,
    background:active?`${color}18`:C.surface,color:active?color:C.muted,transition:"all .13s"
  }}>{label}</button>
);

// Toast notification
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return ()=>clearTimeout(t); }, []);
  const col = type==="success"?C.teal:type==="error"?C.rose:C.amber;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.cardHi,border:`1px solid ${col}`,borderRadius:12,padding:"12px 18px",color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 24px ${col}33`,animation:"slideUp .2s ease",maxWidth:320}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:col}}/>
      {msg}
    </div>
  );
};

// Confirm modal
const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{position:"fixed",inset:0,background:"#000b",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:24,maxWidth:360,width:"100%"}}>
      <p style={{color:C.text,fontSize:14,lineHeight:1.7,marginBottom:20}}>{msg}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:8,background:C.border,border:"none",color:C.text,fontSize:13,cursor:"pointer"}}>Cancel</button>
        <button onClick={onOk} style={{padding:"8px 16px",borderRadius:8,background:C.rose,border:"none",color:"#080b12",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Trash2 size={13}/> Confirm
        </button>
      </div>
    </div>
  </div>
);

// Custom recharts tooltip
const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:C.cardHi,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <p style={{color:C.muted,marginBottom:4,fontWeight:600}}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color||C.text,margin:"2px 0",fontWeight:600}}>{p.name}: <b>{p.value}</b></p>)}
    </div>
  );
};

// ─── AI Insights Panel ────────────────────────────────────────────────────────
const AIInsights = ({ entries }) => {
  const [text,    setText]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true); setText(null);
    const sample = entries.slice(-14).map(e =>
      `${e.date}: mood=${e.moodScore}/10 energy=${e.energy}/10 stress=${e.stress}/10 sleep=${e.sleep}h weather=${e.weather} activities=[${e.activities.join(",")||"none"}] triggers=[${e.triggers.join(",")||"none"}] symptoms=[${e.symptoms.join(",")||"none"}]`
    ).join("\n");

    const prompt = `You are a compassionate mental health AI assistant. Analyze this person's 14-day mood tracking data with warmth and clinical insight. Respond in exactly 4 short paragraphs (2-3 sentences each):
1) Overall mood pattern and emotional cycles observed
2) Key risk factors and concerning patterns (sleep, triggers, stress)
3) Positive protective factors — what's working well
4) Concrete, actionable recommendations for the next 7 days

Be warm but direct. Do NOT diagnose. Always recommend professional support for serious concerns.

Data:
${sample}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:900,
          messages:[{role:"user",content:prompt}]
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      setText(d.content?.find(b=>b.type==="text")?.text ?? "No response.");
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entries]);

  const icons  = [TrendingUp, AlertCircle, Heart, Sparkles];
  const colors = [C.violet, C.rose, C.teal, C.amber];

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <button onClick={open?()=>setOpen(false):run}
        style={{width:"100%",padding:"18px 20px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${C.violet}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Brain size={19} color={C.violet}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>AI Mood Insights</p>
          <p style={{fontSize:12,color:C.muted,margin:"2px 0 0"}}>Pattern analysis across your last 14 entries</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!open && <span style={{fontSize:11,fontWeight:700,color:C.violet,background:`${C.violet}18`,padding:"4px 10px",borderRadius:99}}>Analyze</span>}
          {open ? <ChevronDown size={16} color={C.muted} style={{transform:"rotate(180deg)"}}/> : <ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>

      {open && (
        <div style={{padding:"0 20px 20px",borderTop:`1px solid ${C.border}`}}>
          {loading && (
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 0"}}>
              <div style={{width:18,height:18,border:`2px solid ${C.violet}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              <span style={{fontSize:13,color:C.muted}}>Analyzing your mood patterns…</span>
            </div>
          )}
          {error && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:14,background:`${C.rose}15`,borderRadius:10,marginTop:14}}>
              <AlertCircle size={15} color={C.rose}/>
              <p style={{fontSize:13,color:C.rose,margin:0,flex:1}}>{error}</p>
              <button onClick={run} style={{background:`${C.violet}22`,border:"none",color:C.violet,fontSize:12,padding:"5px 10px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><RefreshCw size={11}/>Retry</button>
            </div>
          )}
          {text && !loading && (
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
              {text.split("\n\n").filter(Boolean).map((para,i) => {
                const Icon = icons[i]||Brain;
                const col  = colors[i]||C.muted;
                return (
                  <div key={i} style={{display:"flex",gap:10,padding:"12px 14px",background:`${col}0c`,borderRadius:10,borderLeft:`2px solid ${col}`}}>
                    <Icon size={14} color={col} style={{flexShrink:0,marginTop:2}}/>
                    <p style={{fontSize:13,color:i===0?C.text:C.muted,lineHeight:1.75,margin:0}}>{para}</p>
                  </div>
                );
              })}
              <button onClick={run} style={{marginTop:4,alignSelf:"flex-start",background:`${C.violet}15`,border:`1px solid ${C.violet}44`,color:C.violet,fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                <RefreshCw size={12}/>Re-analyze
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Log / Edit Modal ─────────────────────────────────────────────────────────
const EntryModal = ({ initial, onSave, onClose }) => {
  const [fd, setFd] = useState(initial || {...BLANK_FORM});
  const set = (k,v) => setFd(p=>({...p,[k]:v}));
  const toggleArr = (k,v) => set(k, fd[k].includes(v) ? fd[k].filter(x=>x!==v) : [...fd[k],v]);

  const mood = getMood(fd.moodScore);
  const inp  = {width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl  = {display:"block",fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5};

  // Sync label/emoji when score changes
  useEffect(() => {
    const m = getMood(fd.moodScore);
    setFd(p => ({...p, moodLabel:m.label, moodEmoji:m.emoji}));
  }, [fd.moodScore]);

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:8000,overflowY:"auto",padding:"20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:20,width:"100%",maxWidth:580,padding:28}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <MoodOrb score={fd.moodScore} size={68}/>
            <div>
              <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{initial ? "Edit Entry" : "Log Your Mood"}</p>
              <p style={{fontSize:13,color:mood.color,fontWeight:600,margin:"3px 0 0"}}>{mood.label}</p>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>

          {/* Mood stepper — hero */}
          <div>
            <label style={lbl}>Mood Score (1–10)</label>
            <Stepper value={fd.moodScore} onChange={fn=>set("moodScore",typeof fn==="function"?fn(fd.moodScore):fn)} min={1} max={10} step={1} color={mood.color}/>
            {/* Quick presets */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
              {MOODS.map(m => (
                <button key={m.score} onClick={()=>set("moodScore",m.score)}
                  style={{padding:"3px 9px",borderRadius:99,fontSize:11,fontWeight:700,cursor:"pointer",background:fd.moodScore===m.score?`${m.color}22`:C.surface,border:`1px solid ${fd.moodScore===m.score?m.color:C.border}`,color:fd.moodScore===m.score?m.color:C.muted,transition:"all .12s"}}>
                  {m.score}
                </button>
              ))}
            </div>
          </div>

          {/* Energy / Stress / Sleep */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              {label:"Energy",    key:"energy",  min:1,max:10,step:1,  color:C.amber},
              {label:"Stress",    key:"stress",  min:1,max:10,step:1,  color:C.rose},
              {label:"Sleep (h)", key:"sleep",   min:0,max:12,step:.5, color:C.violet},
            ].map(({label:l,key,min,max,step,color})=>(
              <div key={key}>
                <label style={{...lbl,marginBottom:4}}>{l}</label>
                <Stepper value={fd[key]} onChange={fn=>set(key,typeof fn==="function"?fn(fd[key]):fn)} min={min} max={max} step={step} color={color} size="sm"/>
              </div>
            ))}
          </div>

          {/* Weather */}
          <div>
            <label style={lbl}>Weather</label>
            <div style={{display:"flex",gap:8}}>
              {WEATHER.map(({value,label,Icon}) => (
                <button key={value} onClick={()=>set("weather",value)}
                  style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 6px",borderRadius:10,cursor:"pointer",background:fd.weather===value?`${C.cyan}15`:C.surface,border:`1.5px solid ${fd.weather===value?C.cyan:C.border}`,color:fd.weather===value?C.cyan:C.muted,transition:"all .15s",fontSize:11,fontWeight:600}}>
                  <Icon size={16}/>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label style={lbl}>Activities</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ACTIVITIES_LIST.map(a => (
                <TagPill key={a} label={a} active={fd.activities.includes(a)} color={C.teal} onClick={()=>toggleArr("activities",a)}/>
              ))}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label style={lbl}>Triggers</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TRIGGERS_LIST.map(t => (
                <TagPill key={t} label={t} active={fd.triggers.includes(t)} color={C.rose} onClick={()=>toggleArr("triggers",t)}/>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label style={lbl}>Symptoms</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {SYMPTOMS_LIST.map(s => (
                <TagPill key={s} label={s} active={fd.symptoms.includes(s)} color={C.amber} onClick={()=>toggleArr("symptoms",s)}/>
              ))}
            </div>
          </div>

          {/* Date + Time */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={fd.date} onChange={e=>set("date",e.target.value)}/></div>
            <div><label style={lbl}>Time</label><input type="time" style={inp} value={fd.time} onChange={e=>set("time",e.target.value)}/></div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{...inp,resize:"vertical",minHeight:72}} placeholder="How are you feeling? What's on your mind?" value={fd.notes} onChange={e=>set("notes",e.target.value)}/>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,paddingTop:4}}>
            <button onClick={()=>onSave(fd)}
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:10,background:mood.color,border:"none",color:"#080b12",fontSize:14,fontWeight:800,cursor:"pointer"}}>
              <CheckCircle2 size={15}/>{initial?"Update Entry":"Save Entry"}
            </button>
            <button onClick={onClose} style={{padding:"12px 20px",borderRadius:10,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function MoodTracker() {
  const fileRef = useRef(null);
  const nextId  = useRef(null);

  const [entries, setEntries] = useState(() => {
    try {
      const s = localStorage.getItem("mt2_entries");
      const parsed = s ? JSON.parse(s) : null;
      if (Array.isArray(parsed) && parsed.length) {
        nextId.current = Math.max(...parsed.map(e=>e.id)) + 1;
        return parsed;
      }
    } catch {}
    const seed = buildSeed();
    nextId.current = seed.length + 1;
    return seed;
  });

  useEffect(() => { try { localStorage.setItem("mt2_entries", JSON.stringify(entries)); } catch {} }, [entries]);

  const [tab,       setTab]       = useState("overview");   // overview | trends | log | ai
  const [search,    setSearch]    = useState("");
  const [period,    setPeriod]    = useState("all");        // all | week | month
  const [expanded,  setExpanded]  = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [toast,     setToast]     = useState(null);

  const push = (msg, type="success") => setToast({msg,type});

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return entries
      .filter(e => {
        if (search) {
          const t = search.toLowerCase();
          return e.notes.toLowerCase().includes(t) || e.moodLabel.toLowerCase().includes(t) ||
                 e.activities.some(a=>a.toLowerCase().includes(t)) || e.triggers.some(x=>x.toLowerCase().includes(t));
        }
        return true;
      })
      .filter(e => {
        if (period === "week")  return new Date(e.date) >= new Date(now.getTime() - 7*864e5);
        if (period === "month") return new Date(e.date) >= new Date(now.getTime() - 30*864e5);
        return true;
      })
      .sort((a,b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
  }, [entries, search, period]);

  const stats = useMemo(() => {
    if (!filtered.length) return {avgMood:0,avgEnergy:0,avgStress:0,avgSleep:0,trend:"stable"};
    const avg = key => +(filtered.reduce((s,e)=>s+e[key],0)/filtered.length).toFixed(1);
    let trend = "stable";
    if (filtered.length >= 6) {
      const r = filtered.slice(0,3).reduce((s,e)=>s+e.moodScore,0)/3;
      const p = filtered.slice(3,6).reduce((s,e)=>s+e.moodScore,0)/3;
      if (r > p+0.5) trend="improving"; else if (r < p-0.5) trend="declining";
    }
    return {avgMood:avg("moodScore"),avgEnergy:avg("energy"),avgStress:avg("stress"),avgSleep:avg("sleep"),trend};
  }, [filtered]);

  // Chart: 14-day timeline (chronological)
  const chartData = useMemo(() =>
    [...filtered].reverse().slice(-14).map(e => ({
      date:   fmtD(e.date),
      mood:   e.moodScore,
      energy: e.energy,
      stress: e.stress,
      sleep:  e.sleep,
    })), [filtered]);

  // Radar: weekly averages
  const radarData = useMemo(() => {
    const last7 = filtered.slice(-7);
    if (!last7.length) return [];
    const avg = key => +(last7.reduce((s,e)=>s+(typeof e[key]==="number"?e[key]:0),0)/last7.length).toFixed(1);
    return [
      {subject:"Mood",   A:avg("moodScore")},
      {subject:"Energy", A:avg("energy")},
      {subject:"Calm",   A:+(last7.reduce((s,e)=>s+(11-e.stress),0)/last7.length).toFixed(1)},
      {subject:"Sleep",  A:+(avg("sleep")/1.2).toFixed(1)},
    ];
  }, [filtered]);

  // Top activities
  const topActivities = useMemo(() => {
    const c = {};
    filtered.forEach(e => e.activities.forEach(a => { c[a]=(c[a]||0)+1; }));
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,6);
  }, [filtered]);

  // Top triggers
  const topTriggers = useMemo(() => {
    const c = {};
    filtered.forEach(e => e.triggers.forEach(t => { c[t]=(c[t]||0)+1; }));
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [filtered]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveEntry = useCallback(form => {
    const m = getMood(form.moodScore);
    const full = {...form, moodLabel:m.label, moodEmoji:m.emoji};
    if (editEntry) {
      setEntries(prev=>prev.map(e=>e.id===editEntry.id?{...e,...full}:e));
      push("Entry updated");
    } else {
      setEntries(prev=>[{...full,id:nextId.current++},...prev]);
      push(`Mood ${form.moodScore}/10 — ${m.label} logged`);
    }
    setShowModal(false); setEditEntry(null);
  }, [editEntry]);

  const delEntry = useCallback((id, score) => {
    setConfirm({msg:`Delete this mood entry (${score}/10)?`,onOk:()=>{
      setEntries(prev=>prev.filter(e=>e.id!==id));
      if (expanded===id) setExpanded(null);
      setConfirm(null); push("Entry deleted","error");
    }});
  }, [expanded]);

  const clearAll = useCallback(() => {
    setConfirm({msg:"Clear ALL mood entries? This cannot be undone. Export your data first if needed.",onOk:()=>{
      setEntries([]); localStorage.removeItem("mt2_entries");
      setExpanded(null); setSearch(""); setPeriod("all");
      setConfirm(null); push("All data cleared","error");
    }});
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries,null,2)],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=`mood-entries-${todayS()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Data exported as JSON");
  }, [entries]);

  const downloadReport = useCallback(() => {
    const lines = [
      "MOOD TRACKER REPORT", "=".repeat(60),
      `Generated: ${new Date().toLocaleString()}`,
      `Period: ${period==="week"?"Last 7 days":period==="month"?"Last 30 days":"All time"}`,
      `Total entries: ${filtered.length}`, "",
      "STATISTICS", "-".repeat(60),
      `Avg Mood: ${stats.avgMood}/10  Energy: ${stats.avgEnergy}/10  Stress: ${stats.avgStress}/10  Sleep: ${stats.avgSleep}h`,
      `Trend: ${stats.trend}`, "",
      "TOP ACTIVITIES", "-".repeat(60),
      ...topActivities.map(([a,c])=>`  ${a}: ${c}x`), "",
      "TOP TRIGGERS","-".repeat(60),
      ...topTriggers.map(([t,c])=>`  ${t}: ${c}x`), "",
      "ENTRIES", "=".repeat(60),
      ...filtered.map(e=>[
        `\n${fmtFull(e.date)} ${e.time}  —  ${e.moodLabel} ${e.moodEmoji} (${e.moodScore}/10)`,
        `  Energy: ${e.energy}  Stress: ${e.stress}  Sleep: ${e.sleep}h  Weather: ${e.weather}`,
        e.activities.length?`  Activities: ${e.activities.join(", ")}`:"",
        e.triggers.length?`  Triggers: ${e.triggers.join(", ")}`:"",
        e.symptoms.length?`  Symptoms: ${e.symptoms.join(", ")}`:"",
        e.notes?`  Notes: ${e.notes}`:"",
      ].filter(Boolean).join("\n"))
    ];
    const blob = new Blob([lines.join("\n")],{type:"text/plain"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=`mood-report-${todayS()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Report downloaded");
  }, [filtered, period, stats, topActivities, topTriggers]);

  const importJSON = useCallback(e => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        const existing = new Set(entries.map(x=>x.id));
        const news = parsed.filter(p=>p?.id && !existing.has(p.id));
        if (!news.length) { push("No new entries found","error"); return; }
        setEntries(prev=>[...prev,...news]);
        nextId.current = Math.max(nextId.current, ...news.map(x=>x.id)) + 1;
        push(`Imported ${news.length} entries`);
      } catch { push("Invalid file format","error"); }
    };
    reader.readAsText(file);
    e.target.value="";
  }, [entries]);

  const TABS = [
    {k:"overview",label:"Overview",  icon:Activity},
    {k:"trends",  label:"Trends",    icon:BarChart3},
    {k:"log",     label:"Journal",   icon:Calendar},
    {k:"ai",      label:"AI Insights",icon:Brain},
  ];

  const trendIcon = stats.trend==="improving" ? TrendingUp : stats.trend==="declining" ? TrendingDown : BarChart3;
  const trendCol  = stats.trend==="improving" ? C.green : stats.trend==="declining" ? C.rose : C.blue;
  const TI = trendIcon;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.5);cursor:pointer;}
        select option{background:${C.card};color:${C.text};}
        input::placeholder,textarea::placeholder{color:${C.dim};}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes orbPulse{from{opacity:.15;}to{opacity:.4;}}
        .tabBtn:hover{background:${C.cardHi}!important;}
        .rowHov:hover{background:${C.cardHi}!important;}
        .cardHov:hover{border-color:${C.borderHi}!important;}
      `}</style>

      {/* ── Sticky Nav ── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:0}}>
        <div style={{maxWidth:940,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{padding:"13px 0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${C.violet}1a`,border:`1px solid ${C.violet}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Smile size={17} color={C.violet}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:800,color:C.text,letterSpacing:"-0.4px",lineHeight:1}}>MoodTracker</p>
              <p style={{fontSize:9,color:C.muted,letterSpacing:".06em"}}>MENTAL WELLNESS</p>
            </div>
          </div>

          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {TABS.map(({k,label,icon:Icon}) => (
              <button key={k} className="tabBtn" onClick={()=>setTab(k)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.violet:C.muted,borderBottom:`2px solid ${tab===k?C.violet:"transparent"}`,transition:"all .18s",whiteSpace:"nowrap",borderRadius:"4px 4px 0 0"}}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>

          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={downloadReport} title="Download report" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
              <FileText size={13}/>
            </button>
            <button onClick={exportJSON} title="Export JSON" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
              <Download size={13}/>
            </button>
            <input ref={fileRef} type="file" accept="application/json" style={{display:"none"}} onChange={importJSON}/>
            <button onClick={()=>fileRef.current?.click()} title="Import JSON" style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:8,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
              <Upload size={13}/>
            </button>
            <button onClick={()=>{setEditEntry(null);setShowModal(true);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:9,background:C.violet,border:"none",color:"#080b12",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              <Plus size={14}/>Log Mood
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{maxWidth:940,margin:"0 auto",padding:"24px 16px 72px"}}>

        {/* KPI strip — always visible */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:22}}>
          {[
            {label:"Avg Mood",   value:stats.avgMood,  unit:"/10", color:getMood(+stats.avgMood||5).color, icon:Smile},
            {label:"Avg Energy", value:stats.avgEnergy,unit:"/10", color:C.amber,                          icon:Zap},
            {label:"Avg Stress", value:stats.avgStress, unit:"/10",color:C.rose,                           icon:AlertCircle},
            {label:"Avg Sleep",  value:stats.avgSleep, unit:"h",   color:C.violet,                         icon:Moon},
            {label:"Trend",      value:stats.trend,    unit:"",    color:trendCol,                         icon:trendIcon, isText:true},
          ].map(({label,value,unit,color,icon:Icon,isText})=>(
            <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:10,top:10,opacity:.07}}><Icon size={38}/></div>
              <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</p>
              <p style={{fontSize:isText?15:24,fontWeight:800,color,margin:0,letterSpacing:"-0.5px",textTransform:isText?"capitalize":"none"}}>
                {value}{!isText&&<span style={{fontSize:11,color:C.muted,marginLeft:2}}>{unit}</span>}
              </p>
              <p style={{fontSize:10,color:C.dim,marginTop:4}}>{filtered.length} entries</p>
            </div>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab==="overview" && (
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>

            {/* Latest entry hero */}
            {filtered[0] && (() => {
              const e = filtered[0];
              const m = getMood(e.moodScore);
              return (
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
                  <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Latest Entry — {fmtFull(e.date)} {e.time}</p>
                  <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
                    <MoodOrb score={e.moodScore} size={100}/>
                    <div style={{flex:1,minWidth:200}}>
                      <p style={{fontSize:22,fontWeight:800,color:m.color,marginBottom:8,letterSpacing:"-0.5px"}}>{m.label}</p>
                      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                        <MetricBadge label="Energy" value={e.energy} unit="/10" color={C.amber}/>
                        <MetricBadge label="Stress" value={e.stress} unit="/10" color={C.rose}/>
                        <MetricBadge label="Sleep"  value={e.sleep}  unit="h"   color={C.violet}/>
                      </div>
                      {e.notes && <p style={{fontSize:13,color:C.muted,marginTop:10,lineHeight:1.6,fontStyle:"italic"}}>"{e.notes}"</p>}
                    </div>
                  </div>
                  {e.activities.length>0 && (
                    <div style={{marginTop:14,display:"flex",flexWrap:"wrap",gap:6}}>
                      {e.activities.map(a=><span key={a} style={{fontSize:12,padding:"4px 10px",borderRadius:99,background:`${C.teal}15`,color:C.teal,fontWeight:600,border:`1px solid ${C.teal}30`}}>{a}</span>)}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mini trend chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Mood · Energy · Stress — 14 days</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={5} stroke={C.dim} strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="mood"   name="Mood"   stroke={C.violet} strokeWidth={2.5} dot={{fill:C.violet,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="energy" name="Energy" stroke={C.amber}  strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
                  <Line type="monotone" dataKey="stress" name="Stress" stroke={C.rose}   strokeWidth={1.5} dot={false} strokeDasharray="2 3"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Activities + Triggers */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Activity size={14} color={C.teal}/>Top Activities</p>
                {topActivities.length===0 ? <p style={{color:C.muted,fontSize:13}}>No activities logged yet.</p> :
                  topActivities.map(([a,c])=>(
                    <div key={a} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.muted}}>{a}</span>
                        <span style={{fontSize:12,fontWeight:700,color:C.teal}}>{c}×</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(c/filtered.length)*100}%`,background:C.teal,borderRadius:99}}/>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><AlertCircle size={14} color={C.rose}/>Top Triggers</p>
                {topTriggers.length===0 ? <p style={{color:C.muted,fontSize:13}}>No triggers logged yet.</p> :
                  topTriggers.map(([t,c])=>(
                    <div key={t} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.muted}}>{t}</span>
                        <span style={{fontSize:12,fontWeight:700,color:C.rose}}>{c}×</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(c/filtered.length)*100}%`,background:C.rose,borderRadius:99}}/>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRENDS ═══ */}
        {tab==="trends" && (
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>

            {/* Area chart — mood */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Mood Trend — 14-Day Area</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Reference lines: 3 (low) · 7 (good)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{top:6,right:6,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.violet} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={C.violet} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={3} stroke={C.rose}   strokeDasharray="4 3" strokeOpacity={.5}/>
                  <ReferenceLine y={7} stroke={C.green}  strokeDasharray="4 3" strokeOpacity={.5}/>
                  <Area type="monotone" dataKey="mood" name="Mood" stroke={C.violet} strokeWidth={2.5} fill="url(#mGrad)" dot={{fill:C.violet,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sleep + stress bar charts */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {key:"sleep",name:"Sleep (h)",color:C.violet,ref:7},
                {key:"stress",name:"Stress",  color:C.rose,  ref:5},
              ].map(({key,name,color,ref})=>(
                <div key={key} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 14px 12px"}}>
                  <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>{name}</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={chartData} margin={{top:4,right:4,left:-28,bottom:0}} barSize={11}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                      <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                      <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                      <Tooltip content={<VTooltip/>}/>
                      <ReferenceLine y={ref} stroke={C.teal} strokeDasharray="3 2" strokeOpacity={.6}/>
                      <Bar dataKey={key} name={name} fill={color} radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            {/* Radar */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Wellness Radar — 7-Day Avg</p>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData} margin={{top:10,right:20,left:20,bottom:10}}>
                  <PolarGrid stroke={C.border}/>
                  <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:12,fontWeight:600}}/>
                  <PolarRadiusAxis domain={[0,10]} tick={{fill:C.dim,fontSize:9}} tickCount={6}/>
                  <Radar name="You" dataKey="A" stroke={C.violet} fill={C.violet} fillOpacity={0.2} strokeWidth={2}/>
                  <Tooltip content={<VTooltip/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ JOURNAL ═══ */}
        {tab==="log" && (
          <div style={{animation:"fadeIn .3s ease"}}>
            {/* Search + filters */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:180}}>
                <Search size={14} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
                <input style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px 9px 32px",color:C.text,fontSize:13,outline:"none"}} placeholder="Search entries…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{display:"flex",gap:6}}>
                {[["all","All"],["week","7 days"],["month","30 days"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setPeriod(k)} style={{padding:"7px 14px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",border:`1.5px solid ${period===k?C.violet:C.border}`,background:period===k?`${C.violet}14`:C.card,color:period===k?C.violet:C.muted,transition:"all .15s"}}>{l}</button>
                ))}
              </div>
              <button onClick={clearAll} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 13px",borderRadius:9,background:`${C.rose}15`,border:`1px solid ${C.rose}44`,color:C.rose,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                <Trash2 size={12}/>Clear All
              </button>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.length===0 ? (
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"56px 24px",textAlign:"center"}}>
                  <Smile size={44} color={C.dim} style={{marginBottom:12}}/>
                  <p style={{color:C.muted,fontSize:14,fontWeight:600}}>{search?"No entries match your search":"No entries yet — log your first mood!"}</p>
                  {!search && <button onClick={()=>{setEditEntry(null);setShowModal(true);}} style={{marginTop:16,padding:"10px 22px",borderRadius:10,background:C.violet,border:"none",color:"#080b12",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Log First Entry</button>}
                </div>
              ) : filtered.map(entry => {
                const m = getMood(entry.moodScore);
                const isExp = expanded===entry.id;
                return (
                  <div key={entry.id} className="cardHov" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden",transition:"border-color .15s"}}>
                    <div onClick={()=>setExpanded(isExp?null:entry.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",cursor:"pointer"}}>
                      <MoodOrb score={entry.moodScore} size={56}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:15,fontWeight:800,color:m.color}}>{m.label}</span>
                          <span style={{fontSize:11,color:C.muted}}>· {fmtFull(entry.date)} {entry.time}</span>
                        </div>
                        <div style={{display:"flex",gap:12,marginTop:5,flexWrap:"wrap"}}>
                          {[["Energy",entry.energy,C.amber],[entry.sleep+"h sleep","","",C.violet],["Stress",entry.stress,C.rose]].map(([lbl,val,col])=>
                            val!==""&&<span key={lbl} style={{fontSize:12,color:col||C.violet,fontWeight:600}}>{lbl}{val?`: ${val}`:" sleep"}</span>
                          )}
                        </div>
                        {entry.notes && !isExp && <p style={{fontSize:12,color:C.muted,marginTop:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:360,fontStyle:"italic"}}>"{entry.notes}"</p>}
                      </div>
                      <div style={{display:"flex",gap:4,flexShrink:0}}>
                        <button onClick={e=>{e.stopPropagation();setEditEntry(entry);setShowModal(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:"6px",borderRadius:6}}>
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={e=>{e.stopPropagation();delEntry(entry.id,entry.moodScore);}} style={{background:"none",border:"none",cursor:"pointer",color:C.rose,padding:"6px",borderRadius:6}}>
                          <Trash2 size={14}/>
                        </button>
                        <div style={{padding:"6px",color:C.dim,display:"flex",alignItems:"center"}}>
                          <ChevronDown size={14} style={{transform:isExp?"rotate(180deg)":"rotate(0)",transition:"transform .22s"}}/>
                        </div>
                      </div>
                    </div>

                    {isExp && (
                      <div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.border}`}}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginTop:16}}>
                          {/* Metrics */}
                          <div>
                            <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>Metrics</p>
                            <div style={{display:"flex",flexDirection:"column",gap:6}}>
                              {[["Mood",entry.moodScore+"/10",m.color],["Energy",entry.energy+"/10",C.amber],["Stress",entry.stress+"/10",C.rose],["Sleep",entry.sleep+"h",C.violet]].map(([l,v,c])=>(
                                <div key={l} style={{display:"flex",justifyContent:"space-between"}}>
                                  <span style={{fontSize:12,color:C.muted}}>{l}</span>
                                  <span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Weather + Activities */}
                          <div>
                            {(() => {
                              const w = WEATHER.find(x=>x.value===entry.weather)||WEATHER[0];
                              const W = w.Icon;
                              return <><p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Weather</p>
                              <span style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.muted,marginBottom:12}}><W size={14}/>{w.label}</span></>;
                            })()}
                            {entry.activities.length>0 && <>
                              <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Activities</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {entry.activities.map(a=><span key={a} style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:`${C.teal}15`,color:C.teal,fontWeight:600}}>{a}</span>)}
                              </div>
                            </>}
                          </div>

                          {/* Triggers + Symptoms */}
                          <div>
                            {entry.triggers.length>0 && <>
                              <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Triggers</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                                {entry.triggers.map(t=><span key={t} style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:`${C.rose}15`,color:C.rose,fontWeight:600}}>{t}</span>)}
                              </div>
                            </>}
                            {entry.symptoms.length>0 && <>
                              <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Symptoms</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {entry.symptoms.map(s=><span key={s} style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:`${C.amber}15`,color:C.amber,fontWeight:600}}>{s}</span>)}
                              </div>
                            </>}
                          </div>
                        </div>

                        {entry.notes && (
                          <div style={{marginTop:14,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                            <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Notes</p>
                            <p style={{fontSize:13,color:C.muted,lineHeight:1.7}}>{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI INSIGHTS ═══ */}
        {tab==="ai" && (
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>
            {/* Mood distribution bar */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Mood Distribution ({filtered.length} entries)</p>
              <div style={{display:"flex",gap:4,height:40,borderRadius:8,overflow:"hidden"}}>
                {[
                  {range:[1,3],label:"Low",    color:C.rose},
                  {range:[4,5],label:"Below avg",color:C.amber},
                  {range:[6,7],label:"Good",   color:C.teal},
                  {range:[8,10],label:"High",  color:C.violet},
                ].map(({range,label,color})=>{
                  const count = filtered.filter(e=>e.moodScore>=range[0]&&e.moodScore<=range[1]).length;
                  const pct   = filtered.length ? (count/filtered.length)*100 : 0;
                  return pct>0 ? (
                    <div key={label} title={`${label}: ${count} entries (${Math.round(pct)}%)`}
                      style={{flex:pct,background:color,display:"flex",alignItems:"center",justifyContent:"center",minWidth:30,transition:"flex .5s ease"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"rgba(0,0,0,.7)"}}>{Math.round(pct)}%</span>
                    </div>
                  ) : null;
                })}
              </div>
              <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
                {[{c:C.rose,l:"Low (1–3)"},{c:C.amber,l:"Below avg (4–5)"},{c:C.teal,l:"Good (6–7)"},{c:C.violet,l:"High (8–10)"}].map(({c,l})=>(
                  <span key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}>
                    <span style={{width:8,height:8,borderRadius:2,background:c,display:"inline-block"}}/>{l}
                  </span>
                ))}
              </div>
            </div>

            <AIInsights entries={filtered}/>

            {/* Correlations */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Observed Correlations</p>
              {(() => {
                const avgMoodOnActivity = {};
                filtered.forEach(e => e.activities.forEach(a => {
                  if (!avgMoodOnActivity[a]) avgMoodOnActivity[a]={sum:0,count:0};
                  avgMoodOnActivity[a].sum+=e.moodScore; avgMoodOnActivity[a].count++;
                }));
                const sorted = Object.entries(avgMoodOnActivity)
                  .filter(([,v])=>v.count>=2)
                  .map(([a,v])=>({activity:a,avg:+(v.sum/v.count).toFixed(1)}))
                  .sort((a,b)=>b.avg-a.avg).slice(0,5);
                if (!sorted.length) return <p style={{color:C.muted,fontSize:13}}>Log more entries to see correlations.</p>;
                return sorted.map(({activity,avg})=>{
                  const col = avg>=7?C.green:avg>=5?C.teal:C.rose;
                  return (
                    <div key={activity} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <span style={{fontSize:13,color:C.muted,flex:1}}>{activity}</span>
                      <div style={{flex:2,height:6,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${avg*10}%`,background:col,borderRadius:99}}/>
                      </div>
                      <span style={{fontSize:13,fontWeight:700,color:col,minWidth:36,textAlign:"right"}}>{avg}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>{setEditEntry(null);setShowModal(true);}}
        style={{position:"fixed",bottom:28,right:24,width:52,height:52,borderRadius:"50%",background:C.violet,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${C.violet}66`,zIndex:40,transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Plus size={22} color="#080b12" strokeWidth={2.5}/>
      </button>

      {showModal  && <EntryModal initial={editEntry} onSave={saveEntry} onClose={()=>{setShowModal(false);setEditEntry(null);}}/>}
      {confirm    && <Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      {toast      && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}