import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus, Minus, TrendingUp, Calendar, ChevronDown, ChevronUp,
  Brain, Trash2, Edit2, RefreshCw, X, CheckCircle2, Zap,
  Wind, Volume2, Hand, Activity, Sparkles, AlertCircle,
  Download, BarChart3, List, Eye, Heart, Save, Search
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Soft cosmic dark: sensory-safe, calm, supportive
const C = {
  bg:        "#07080d",
  surface:   "#0c0e16",
  card:      "#11141f",
  cardHi:    "#151928",
  border:    "#1e2438",
  borderHi:  "#2a3352",
  text:      "#dde4f0",
  muted:     "#5a6680",
  dim:       "#2a3048",
  // Stimming category colors
  motor:     "#7c9ef5",  // soft blue
  sensory:   "#a78bfa",  // lavender
  vocal:     "#34d399",  // mint
  tactile:   "#f59e0b",  // amber
  visual:    "#fb7185",  // rose
  custom:    "#22d3ee",  // cyan
  // Intensity heatmap palette
  i0: "#0f111c",
  i1: "#1a2a4a",
  i2: "#2d4a80",
  i3: "#4a6ec4",
  i4: "#7c9ef5",
  // Mood
  mood1: "#f87171",
  mood2: "#fb923c",
  mood3: "#fbbf24",
  mood4: "#34d399",
  mood5: "#7c9ef5",
};

const MOOD_EMOJI  = { 1:"😔", 2:"😕", 3:"😐", 4:"😊", 5:"🤩" };
const MOOD_LABEL  = { 1:"Distressed", 2:"Low", 3:"Neutral", 4:"Good", 5:"Great" };
const MOOD_COLOR  = { 1:C.mood1, 2:C.mood2, 3:C.mood3, 4:C.mood4, 5:C.mood5 };
const INTENSITY_COLOR = [C.i0, C.i1, C.i2, C.i3, C.i4];

// ─── Built-in stim library ────────────────────────────────────────────────────
const STIM_LIBRARY = [
  // Motor
  { id:"s1",  name:"Hand Flapping",   category:"motor",   icon:"🙌", desc:"Rapid flapping or waving of hands" },
  { id:"s2",  name:"Rocking",         category:"motor",   icon:"🌊", desc:"Back-and-forth body rocking" },
  { id:"s3",  name:"Finger Tapping",  category:"motor",   icon:"👆", desc:"Repetitive tapping on surfaces" },
  { id:"s4",  name:"Spinning",        category:"motor",   icon:"🌀", desc:"Spinning objects or self-spinning" },
  { id:"s5",  name:"Jumping / Bouncing", category:"motor",icon:"⬆️", desc:"Repetitive jumping or bouncing" },
  // Sensory
  { id:"s6",  name:"Humming",         category:"sensory", icon:"🎵", desc:"Repetitive humming or tonal sounds" },
  { id:"s7",  name:"Echolalia",       category:"vocal",   icon:"🔁", desc:"Repeating words or phrases" },
  { id:"s8",  name:"Singing / Chanting",category:"vocal", icon:"🎤", desc:"Repetitive singing or chanting" },
  // Tactile
  { id:"s9",  name:"Skin Rubbing",    category:"tactile", icon:"✋", desc:"Rubbing skin repeatedly" },
  { id:"s10", name:"Hair Twirling",   category:"tactile", icon:"💈", desc:"Twirling or touching hair" },
  { id:"s11", name:"Object Squeezing",category:"tactile", icon:"🔸", desc:"Squeezing stress balls or objects" },
  // Sensory seeking
  { id:"s12", name:"Visual Tracking", category:"visual",  icon:"👁️", desc:"Following lights, patterns, or movement" },
  { id:"s13", name:"Watching Fans",   category:"visual",  icon:"🌬️", desc:"Watching spinning or moving objects" },
  { id:"s14", name:"Mouthing Objects",category:"tactile", icon:"🫦", desc:"Chewing or mouthing non-food items" },
];

const CATEGORY_CONFIG = {
  motor:   { label:"Motor",    color:C.motor,   Icon:Activity },
  sensory: { label:"Sensory",  color:C.sensory, Icon:Wind     },
  vocal:   { label:"Vocal",    color:C.vocal,   Icon:Volume2  },
  tactile: { label:"Tactile",  color:C.tactile, Icon:Hand     },
  visual:  { label:"Visual",   color:C.visual,  Icon:Eye      },
  custom:  { label:"Custom",   color:C.custom,  Icon:Sparkles },
};

const ENVIRONMENTS = ["Home","School","Work","Outside","Transport","Social event","Healthcare"];
const TRIGGERS     = ["Sensory overload","Excitement","Anxiety","Boredom","Fatigue","Transition","Crowds","Noise","Hunger","Pain"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const nowTime  = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtDate  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const fmtDay   = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{weekday:"short"}); } catch { return s; } };
const fmtFull  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); } catch { return s; } };
const clamp    = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const last14Days = () => Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); return d.toISOString().split("T")[0]; });

// ─── Seed data ────────────────────────────────────────────────────────────────
const buildSeed = () => {
  const logs = [];
  let id = 1;
  const today = new Date();
  const pattern = [2,1,3,4,2,1,2,3,2,4,3,1,2,3];
  const moods   = [4,4,3,2,4,5,4,3,4,2,3,4,4,3];

  pattern.forEach((intensity, i) => {
    const d = new Date(today); d.setDate(d.getDate()-(13-i));
    const ds = d.toISOString().split("T")[0];
    const numStims = clamp(intensity + Math.floor(Math.random()*2), 1, 5);
    const stims = STIM_LIBRARY.filter(()=>Math.random()>.55).slice(0,numStims);
    if (!stims.length) stims.push(STIM_LIBRARY[0]);
    const trigs = TRIGGERS.filter(()=>Math.random()>.7).slice(0,2);
    logs.push({
      id: id++,
      date: ds,
      time: ["09:00","14:30","18:00","20:30"][Math.floor(Math.random()*4)],
      stimIds: stims.map(s=>s.id),
      intensity,
      mood: moods[i],
      environment: ENVIRONMENTS[Math.floor(Math.random()*ENVIRONMENTS.length)],
      triggers: trigs,
      duration: [5,10,15,20,30][Math.floor(Math.random()*5)],
      notes: intensity>=3 ? "Higher stimming today, sensory environment was challenging." : intensity<=1 ? "Very calm day, felt regulated." : "",
    });
  });
  return logs;
};

// ─── Stepper ──────────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min=1, max=10, step=1, color=C.motor, size="md", label="" }) => {
  const hold = useRef(null);
  const go = dir => {
    onChange(v => clamp(v+dir*step, min, max));
    hold.current = setTimeout(()=>{ hold.current=setInterval(()=>onChange(v=>clamp(v+dir*step,min,max)),70); },350);
  };
  const stop = () => { clearTimeout(hold.current); clearInterval(hold.current); };
  useEffect(()=>()=>stop(),[]);
  const h = size==="sm"?38:48;
  return (
    <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"100%"}}>
      <button onMouseDown={()=>go(-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(-1)} onTouchEnd={stop}
        disabled={value<=min} style={{width:h,height:h,background:"none",border:"none",color:value<=min?C.dim:color,cursor:value<=min?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Minus size={size==="sm"?12:14}/>
      </button>
      <div style={{flex:1,textAlign:"center",lineHeight:1}}>
        <span style={{fontSize:size==="sm"?16:24,fontWeight:800,color:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:"-1px"}}>{value}</span>
        {label&&<span style={{fontSize:10,color:C.muted,marginLeft:3}}>{label}</span>}
      </div>
      <button onMouseDown={()=>go(1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(1)} onTouchEnd={stop}
        disabled={value>=max} style={{width:h,height:h,background:"none",border:"none",color:value>=max?C.dim:color,cursor:value>=max?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Plus size={size==="sm"?12:14}/>
      </button>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(()=>{ const t=setTimeout(onDone,2700); return ()=>clearTimeout(t); },[]);
  const col = type==="success"?C.vocal:type==="error"?C.visual:C.tactile;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.cardHi,border:`1px solid ${col}`,borderRadius:12,padding:"11px 17px",color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px #0009`,animation:"slideUp .2s ease",maxWidth:300}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:col,flexShrink:0}}/>
      {msg}
    </div>
  );
};

// ─── Confirm ──────────────────────────────────────────────────────────────────
const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{position:"fixed",inset:0,background:"#000c",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:24,maxWidth:360,width:"100%"}}>
      <p style={{color:C.text,fontSize:14,lineHeight:1.75,marginBottom:20}}>{msg}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"8px 16px",borderRadius:8,background:C.border,border:"none",color:C.text,fontSize:13,cursor:"pointer"}}>Cancel</button>
        <button onClick={onOk} style={{padding:"8px 16px",borderRadius:8,background:C.visual,border:"none",color:"#07080d",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><Trash2 size={12}/>Delete</button>
      </div>
    </div>
  </div>
);

// ─── Heatmap grid ─────────────────────────────────────────────────────────────
const HeatmapCell = ({ date, intensity, mood, isSelected, onClick, label }) => {
  const ic = INTENSITY_COLOR[clamp(intensity,0,4)];
  const mc = MOOD_COLOR[mood] || C.muted;
  return (
    <button onClick={onClick} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"10px 6px",borderRadius:12,border:`1.5px solid ${isSelected?"#7c9ef5":"transparent"}`,background:ic,cursor:"pointer",transition:"transform .12s, border-color .12s",minHeight:90,gap:4,boxShadow:isSelected?`0 0 0 2px ${C.motor}44`:""}}
      onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.transform="scale(1.06)"; }}
      onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.transform="scale(1)"; }}>
      <span style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</span>
      <span style={{fontSize:18,fontWeight:800,color:intensity>0?C.motor:C.muted,letterSpacing:"-0.5px"}}>{fmtDate(date).split(" ")[1]||""}</span>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        {/* intensity dots */}
        <div style={{display:"flex",gap:2}}>
          {[0,1,2,3,4].map(i=>(
            <div key={i} style={{width:4,height:4,borderRadius:"50%",background:i<intensity?C.motor:C.dim}}/>
          ))}
        </div>
        <span style={{fontSize:13}}>{MOOD_EMOJI[mood]||"😐"}</span>
      </div>
    </button>
  );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const VTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:C.cardHi,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <p style={{color:C.muted,marginBottom:4,fontWeight:600}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color||C.text,margin:"2px 0",fontWeight:700}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// ─── AI Insights ─────────────────────────────────────────────────────────────
const AIInsights = ({ logs, stims }) => {
  const [text,    setText]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true); setText(null);
    const sample = logs.slice(-14).map(l => {
      const names = l.stimIds.map(id=>{
        const found = stims.find(s=>s.id===id)||STIM_LIBRARY.find(s=>s.id===id);
        return found?.name||id;
      }).join(", ");
      return `${l.date}: intensity=${l.intensity}/4 mood=${l.mood}/5 stims=[${names}] env=${l.environment||"?"} triggers=[${(l.triggers||[]).join(",")||"none"}] duration=${l.duration||"?"}min`;
    }).join("\n");

    const prompt = `You are a compassionate neurodiversity-affirming support tool. Analyse this stimming tracking data and provide warm, validating insights. Respond in exactly 4 short paragraphs (2-3 sentences each):
1) Pattern summary — when and how stimming activity peaks, any environmental or mood correlations
2) Self-regulation patterns — what the data suggests about sensory needs and regulation
3) What appears to be working well — positive patterns, effective environments or coping
4) Gentle suggestions — sensory-friendly strategies or environmental adjustments to explore

IMPORTANT: Frame stimming as natural and valid. Never suggest reducing or stopping stimming. Focus on understanding needs and improving wellbeing. Be warm, affirming, and neurodiversity-positive. This tool is for self-understanding, not clinical advice.

TRACKING DATA (last 14 days):
${sample}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:prompt}]})
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      setText(d.content?.find(b=>b.type==="text")?.text??"No response.");
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  },[logs,stims]);

  const ICONS  = [TrendingUp,Activity,Heart,Sparkles];
  const COLORS = [C.motor,C.sensory,C.vocal,C.tactile];

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <button onClick={open?()=>setOpen(false):run}
        style={{width:"100%",padding:"18px 22px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${C.sensory}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Brain size={19} color={C.sensory}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>AI Pattern Insights</p>
          <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Neurodiversity-affirming analysis across {logs.length} log{logs.length!==1?"s":""}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!open&&<span style={{fontSize:11,fontWeight:700,color:C.sensory,background:`${C.sensory}18`,padding:"4px 12px",borderRadius:99}}>Analyse</span>}
          {open?<ChevronUp size={16} color={C.muted}/>:<ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 22px 22px",borderTop:`1px solid ${C.border}`}}>
          {loading&&(
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"22px 0"}}>
              <div style={{width:18,height:18,border:`2px solid ${C.sensory}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              <span style={{fontSize:13,color:C.muted}}>Reviewing your patterns…</span>
            </div>
          )}
          {error&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:14,background:`${C.visual}15`,borderRadius:10,marginTop:14}}>
              <AlertCircle size={15} color={C.visual}/>
              <p style={{fontSize:13,color:C.visual,margin:0,flex:1}}>{error}</p>
              <button onClick={run} style={{background:`${C.sensory}22`,border:"none",color:C.sensory,fontSize:12,padding:"5px 10px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><RefreshCw size={11}/>Retry</button>
            </div>
          )}
          {text&&!loading&&(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
              {text.split("\n\n").filter(Boolean).map((para,i)=>{
                const Icon=ICONS[i]||Brain, col=COLORS[i]||C.muted;
                return (
                  <div key={i} style={{display:"flex",gap:12,padding:"13px 15px",background:`${col}0a`,borderRadius:10,borderLeft:`2px solid ${col}`}}>
                    <Icon size={14} color={col} style={{flexShrink:0,marginTop:3}}/>
                    <p style={{fontSize:13,color:i===0?C.text:C.muted,lineHeight:1.8,margin:0}}>{para}</p>
                  </div>
                );
              })}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <p style={{fontSize:11,color:C.muted,fontStyle:"italic",margin:0}}>For personal self-understanding only — not clinical advice.</p>
                <button onClick={run} style={{background:`${C.sensory}15`,border:`1px solid ${C.sensory}44`,color:C.sensory,fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={12}/>Re-analyse</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Log Entry Modal ──────────────────────────────────────────────────────────
const LogModal = ({ initial, customStims, onSave, onClose }) => {
  const [fd, setFd] = useState(initial || {
    date:todayStr(), time:nowTime(),
    stimIds:[], intensity:2, mood:3,
    environment:"Home", triggers:[], duration:15, notes:"",
  });
  const set = (k,v) => setFd(p=>({...p,[k]:v}));
  const toggleArr = (k,v) => set(k, fd[k].includes(v)?fd[k].filter(x=>x!==v):[...fd[k],v]);

  const allStims = [...STIM_LIBRARY, ...customStims];
  const grouped = {};
  allStims.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s); });

  const inp = {width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:8000,overflowY:"auto",padding:"20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:20,width:"100%",maxWidth:580,padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{initial?"Edit Log Entry":"Log Stimming"}</p>
            <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Track what happened and how you felt</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>

          {/* Stim selector */}
          <div>
            <label style={lbl}>Stimming Behaviors (select all that apply)</label>
            {Object.entries(grouped).map(([cat,stims])=>{
              const cc=CATEGORY_CONFIG[cat]||CATEGORY_CONFIG.custom;
              return (
                <div key={cat} style={{marginBottom:10}}>
                  <p style={{fontSize:10,fontWeight:700,color:cc.color,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                    <cc.Icon size={11}/>{cc.label}
                  </p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {stims.map(s=>{
                      const on=fd.stimIds.includes(s.id);
                      return (
                        <button key={s.id} onClick={()=>toggleArr("stimIds",s.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:on?`${cc.color}18`:C.surface,border:`1px solid ${on?cc.color:C.border}`,color:on?cc.color:C.muted,transition:"all .12s"}}>
                          <span style={{fontSize:13}}>{s.icon}</span>{s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Intensity + Mood steppers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            <div>
              <label style={lbl}>Intensity (1–4)</label>
              <Stepper value={fd.intensity} onChange={fn=>set("intensity",typeof fn==="function"?fn(fd.intensity):fn)} min={1} max={4} color={INTENSITY_COLOR[fd.intensity]||C.motor}/>
              <p style={{fontSize:11,color:INTENSITY_COLOR[fd.intensity]||C.muted,marginTop:4,textAlign:"center"}}>{["","Mild","Moderate","High","Very High"][fd.intensity]}</p>
            </div>
            <div>
              <label style={lbl}>Mood (1–5)</label>
              <Stepper value={fd.mood} onChange={fn=>set("mood",typeof fn==="function"?fn(fd.mood):fn)} min={1} max={5} color={MOOD_COLOR[fd.mood]||C.muted}/>
              <p style={{fontSize:13,textAlign:"center",marginTop:4}}>{MOOD_EMOJI[fd.mood]||"😐"} <span style={{fontSize:11,color:MOOD_COLOR[fd.mood]||C.muted}}>{MOOD_LABEL[fd.mood]}</span></p>
            </div>
          </div>

          {/* Duration stepper */}
          <div>
            <label style={lbl}>Duration (minutes)</label>
            <Stepper value={fd.duration} onChange={fn=>set("duration",typeof fn==="function"?fn(fd.duration):fn)} min={1} max={120} step={5} color={C.tactile} label="min"/>
          </div>

          {/* Environment */}
          <div>
            <label style={lbl}>Environment</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ENVIRONMENTS.map(e=>{
                const on=fd.environment===e;
                return <button key={e} onClick={()=>set("environment",e)} style={{padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:on?`${C.motor}18`:C.surface,border:`1px solid ${on?C.motor:C.border}`,color:on?C.motor:C.muted,transition:"all .12s"}}>{e}</button>;
              })}
            </div>
          </div>

          {/* Triggers */}
          <div>
            <label style={lbl}>Possible Triggers</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TRIGGERS.map(t=>{
                const on=fd.triggers.includes(t);
                return <button key={t} onClick={()=>toggleArr("triggers",t)} style={{padding:"5px 11px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:on?`${C.visual}18`:C.surface,border:`1px solid ${on?C.visual:C.border}`,color:on?C.visual:C.muted,transition:"all .12s"}}>{t}</button>;
              })}
            </div>
          </div>

          {/* Date / Time */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={fd.date} onChange={e=>set("date",e.target.value)}/></div>
            <div><label style={lbl}>Time</label><input type="time" style={inp} value={fd.time} onChange={e=>set("time",e.target.value)}/></div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{...inp,resize:"vertical",minHeight:70,lineHeight:1.7}} placeholder="How did you feel? What was the context? Any observations…" value={fd.notes} onChange={e=>set("notes",e.target.value)}/>
          </div>

          <div style={{display:"flex",gap:10,paddingTop:4}}>
            <button onClick={()=>onSave(fd)} disabled={!fd.stimIds.length}
              style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:10,background:fd.stimIds.length?C.motor:"#1a2030",border:"none",color:fd.stimIds.length?"#07080d":C.dim,fontSize:14,fontWeight:800,cursor:fd.stimIds.length?"pointer":"not-allowed",transition:"background .15s"}}>
              <Save size={14}/>{initial?"Update Log":"Save Log"}
            </button>
            <button onClick={onClose} style={{padding:"12px 20px",borderRadius:10,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Add Custom Stim Modal ────────────────────────────────────────────────────
const AddStimModal = ({ onSave, onClose }) => {
  const [name,     setName]     = useState("");
  const [category, setCategory] = useState("custom");
  const [icon,     setIcon]     = useState("✨");
  const [desc,     setDesc]     = useState("");
  const ICONS_LIST = ["✨","🎯","💫","🌟","🔮","🎪","🎭","🎨","🎲","🌈","🔔","🎸","🥁","🎹","🏃","🤸","💃","🙆","✊","🤲","👐","🙌","👋","🖐️"];
  const inp = {width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};
  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:18,width:"100%",maxWidth:440,padding:26}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <p style={{fontSize:16,fontWeight:800,color:C.text,margin:0}}>Add Custom Stim</p>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={16}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={lbl}>Name *</label><input style={inp} placeholder="e.g. Leg bouncing" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div>
            <label style={lbl}>Category</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(CATEGORY_CONFIG).map(([k,cc])=>(
                <button key={k} onClick={()=>setCategory(k)} style={{padding:"5px 11px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",background:category===k?`${cc.color}18`:C.surface,border:`1px solid ${category===k?cc.color:C.border}`,color:category===k?cc.color:C.muted}}>{cc.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Emoji Icon</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {ICONS_LIST.map(ic=>(
                <button key={ic} onClick={()=>setIcon(ic)} style={{width:34,height:34,borderRadius:8,background:icon===ic?`${C.custom}22`:C.surface,border:`1px solid ${icon===ic?C.custom:C.border}`,fontSize:16,cursor:"pointer"}}>{ic}</button>
              ))}
            </div>
          </div>
          <div><label style={lbl}>Description (optional)</label><input style={inp} placeholder="Brief description…" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{ if(name.trim()) onSave({id:`c-${Date.now()}`,name:name.trim(),category,icon,desc,custom:true}); }} disabled={!name.trim()}
              style={{flex:1,padding:"11px",borderRadius:10,background:name.trim()?C.custom:"#1a2030",border:"none",color:name.trim()?"#07080d":C.dim,fontSize:13,fontWeight:700,cursor:name.trim()?"pointer":"not-allowed"}}>
              Add Stim
            </button>
            <button onClick={onClose} style={{padding:"11px 18px",borderRadius:10,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function StimmingTracker() {
  const nextId = useRef(null);

  const [logs, setLogs] = useState(()=>{
    try {
      const s=localStorage.getItem("st2_logs");
      const p=s?JSON.parse(s):null;
      if(Array.isArray(p)&&p.length){ nextId.current=Math.max(...p.map(l=>l.id))+1; return p; }
    } catch {}
    const seed=buildSeed(); nextId.current=seed.length+1; return seed;
  });

  const [customStims, setCustomStims] = useState(()=>{
    try { const s=localStorage.getItem("st2_custom"); return s?JSON.parse(s):[]; } catch { return []; }
  });

  useEffect(()=>{ try{localStorage.setItem("st2_logs",JSON.stringify(logs));}catch{} },[logs]);
  useEffect(()=>{ try{localStorage.setItem("st2_custom",JSON.stringify(customStims));}catch{} },[customStims]);

  const [tab,          setTab]          = useState("heatmap");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editLog,      setEditLog]      = useState(null);
  const [showAddStim,  setShowAddStim]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [confirm,      setConfirm]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const [expandedCats, setExpandedCats] = useState({motor:true,sensory:true,vocal:false,tactile:false,visual:false,custom:true});

  const push = (msg,type="success") => setToast({msg,type});

  // ── Derived ──────────────────────────────────────────────────────────────
  const allStims = useMemo(()=>[...STIM_LIBRARY,...customStims],[customStims]);

  const days14 = useMemo(()=>last14Days(),[]);

  // Heatmap: one entry per day (latest per day)
  const heatmapData = useMemo(()=>{
    return days14.map(ds=>{
      const dayLogs = logs.filter(l=>l.date===ds);
      if (!dayLogs.length) return { date:ds, intensity:0, mood:3, count:0 };
      const latest = dayLogs.sort((a,b)=>b.time.localeCompare(a.time))[0];
      const maxIntensity = Math.max(...dayLogs.map(l=>l.intensity));
      const avgMood = Math.round(dayLogs.reduce((s,l)=>s+l.mood,0)/dayLogs.length);
      return { date:ds, intensity:maxIntensity, mood:avgMood, count:dayLogs.length, latest };
    });
  },[logs,days14]);

  // Charts
  const chartData = useMemo(()=>
    heatmapData.map(d=>({
      date: fmtShort(d.date),
      intensity: d.intensity,
      mood: d.mood,
      count: d.count,
    })),[heatmapData]);

  function fmtShort(s){ try{ return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); }catch{ return s; } }

  // Stim frequency this week
  const stimFreq = useMemo(()=>{
    const c={};
    logs.forEach(l=>l.stimIds.forEach(id=>{ c[id]=(c[id]||0)+1; }));
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,count])=>({
      stim: allStims.find(s=>s.id===id)||{name:id,icon:"?",category:"custom"},
      count,
    }));
  },[logs,allStims]);

  // Selected day logs
  const selectedDayLogs = useMemo(()=>{
    if (!selectedDate) return [];
    return logs.filter(l=>l.date===selectedDate).sort((a,b)=>a.time.localeCompare(b.time));
  },[logs,selectedDate]);

  const filteredLogs = useMemo(()=>{
    return logs
      .filter(l=>{
        if(!search) return true;
        const q=search.toLowerCase();
        const stimNames = l.stimIds.map(id=>allStims.find(s=>s.id===id)?.name||"").join(" ").toLowerCase();
        return stimNames.includes(q)||(l.notes||"").toLowerCase().includes(q)||(l.environment||"").toLowerCase().includes(q)||(l.triggers||[]).join(" ").toLowerCase().includes(q);
      })
      .sort((a,b)=>b.date.localeCompare(a.date)||b.time.localeCompare(a.time));
  },[logs,search,allStims]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const saveLog = useCallback(fd=>{
    if (editLog) {
      setLogs(prev=>prev.map(l=>l.id===editLog.id?{...fd,id:editLog.id}:l));
      push("Log updated");
    } else {
      setLogs(prev=>[{...fd,id:nextId.current++},...prev]);
      push("Stimming logged ✓");
    }
    setShowLogModal(false); setEditLog(null);
  },[editLog]);

  const delLog = useCallback((id,date)=>{
    setConfirm({msg:`Delete this log entry from ${fmtDate(date)}?`,onOk:()=>{
      setLogs(prev=>prev.filter(l=>l.id!==id));
      setConfirm(null); push("Entry deleted","error");
    }});
  },[]);

  const addCustomStim = useCallback(stim=>{
    setCustomStims(prev=>[...prev,stim]);
    setShowAddStim(false); push(`"${stim.name}" added`);
  },[]);

  const delCustomStim = useCallback(id=>{
    setConfirm({msg:"Remove this custom stim from your library?",onOk:()=>{
      setCustomStims(prev=>prev.filter(s=>s.id!==id));
      setConfirm(null); push("Stim removed","error");
    }});
  },[]);

  const exportJSON = ()=>{
    const blob=new Blob([JSON.stringify({logs,customStims},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`stimming-data-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Data exported");
  };

  const TABS = [
    {k:"heatmap", label:"Heatmap",  icon:Calendar},
    {k:"trends",  label:"Trends",   icon:BarChart3},
    {k:"library", label:"My Stims", icon:List},
    {k:"insights",label:"AI Insights",icon:Brain},
  ];

  const btnSt = (active=false,col=C.motor)=>({
    display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,
    fontSize:12,fontWeight:700,cursor:"pointer",
    background:active?col:"none",border:active?"none":`1px solid ${C.border}`,
    color:active?"#07080d":C.muted,transition:"all .15s",
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.4);cursor:pointer;}
        select option{background:${C.card};color:${C.text};}
        input::placeholder,textarea::placeholder{color:${C.dim};}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        .tabBtn:hover{background:${C.cardHi}!important;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
      `}</style>

      {/* ── Nav ── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:0}}>
        <div style={{maxWidth:920,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{padding:"13px 0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${C.motor}18`,border:`1px solid ${C.motor}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Activity size={17} color={C.motor}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:800,color:C.text,letterSpacing:"-0.4px",lineHeight:1}}>StimmingTrack</p>
              <p style={{fontSize:9,color:C.muted,letterSpacing:".06em"}}>NEURODIVERSITY SUPPORT</p>
            </div>
          </div>
          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {TABS.map(({k,label,icon:Icon})=>(
              <button key={k} className="tabBtn" onClick={()=>setTab(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.motor:C.muted,borderBottom:`2px solid ${tab===k?C.motor:"transparent"}`,transition:"all .18s",whiteSpace:"nowrap"}}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={exportJSON} style={btnSt()}><Download size={13}/></button>
            <button onClick={()=>setShowAddStim(true)} style={btnSt()}>
              <Plus size={13}/>Add Stim
            </button>
            <button onClick={()=>{setEditLog(null);setShowLogModal(true);}} style={btnSt(true,C.motor)}>
              <Zap size={14}/>Quick Log
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{maxWidth:920,margin:"0 auto",padding:"24px 16px 80px"}}>

        {/* Summary strip — always visible */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:22}}>
          {[
            {label:"Total Logs",  val:logs.length,                                                   color:C.motor,   Icon:Activity},
            {label:"Stim Types",  val:allStims.length,                                               color:C.sensory, Icon:List},
            {label:"This Week",   val:logs.filter(l=>new Date(l.date)>=new Date(Date.now()-7*864e5)).length, color:C.vocal,   Icon:Calendar},
            {label:"Avg Mood",    val:`${(logs.slice(-14).reduce((s,l)=>s+l.mood,0)/Math.max(logs.slice(-14).length,1)).toFixed(1)}/5`, color:C.tactile, Icon:Heart},
          ].map(({label,val,color,Icon})=>(
            <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:10,top:10,opacity:.07}}><Icon size={36}/></div>
              <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</p>
              <p style={{fontSize:22,fontWeight:800,color,letterSpacing:"-0.5px",margin:0}}>{val}</p>
            </div>
          ))}
        </div>

        {/* ═══ HEATMAP ═══ */}
        {tab==="heatmap"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <p style={{fontSize:14,fontWeight:700,color:C.text}}>14-Day Pattern</p>
                  <p style={{fontSize:11,color:C.muted,marginTop:2}}>Tap a day to see details · Color = stimming intensity · Emoji = mood</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,color:C.muted}}>Low</span>
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} style={{width:14,height:14,borderRadius:3,background:INTENSITY_COLOR[i],border:`1px solid ${C.border}`}}/>
                  ))}
                  <span style={{fontSize:10,color:C.muted}}>High</span>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:10}}>
                {heatmapData.slice(0,7).map(d=>(
                  <HeatmapCell key={d.date} date={d.date} intensity={d.intensity} mood={d.mood}
                    isSelected={selectedDate===d.date} label={fmtDay(d.date)}
                    onClick={()=>setSelectedDate(selectedDate===d.date?null:d.date)}/>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
                {heatmapData.slice(7).map(d=>(
                  <HeatmapCell key={d.date} date={d.date} intensity={d.intensity} mood={d.mood}
                    isSelected={selectedDate===d.date} label={fmtDay(d.date)}
                    onClick={()=>setSelectedDate(selectedDate===d.date?null:d.date)}/>
                ))}
              </div>
            </div>

            {/* Selected day detail */}
            {selectedDate&&(()=>{
              const dayLogs=selectedDayLogs;
              const hd=heatmapData.find(d=>d.date===selectedDate);
              return (
                <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:22,animation:"fadeIn .2s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <p style={{fontSize:15,fontWeight:800,color:C.text,margin:0}}>{fmtFull(selectedDate)}</p>
                      <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>{dayLogs.length} log{dayLogs.length!==1?"s":""} recorded</p>
                    </div>
                    <button onClick={()=>{setEditLog(null);setShowLogModal(true);}} style={{...btnSt(true,C.motor),padding:"7px 14px",fontSize:12}}>
                      <Plus size={12}/>Log for this day
                    </button>
                  </div>
                  {dayLogs.length===0?(
                    <p style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No logs for this day.</p>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {dayLogs.map(log=>{
                        const names=log.stimIds.map(id=>allStims.find(s=>s.id===id)||{name:id,icon:"?"});
                        return (
                          <div key={log.id} style={{background:C.surface,borderRadius:12,padding:"13px 16px",border:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start",gap:12}}>
                            <div style={{flexShrink:0,textAlign:"center"}}>
                              <p style={{fontSize:18,margin:0}}>{MOOD_EMOJI[log.mood]||"😐"}</p>
                              <p style={{fontSize:10,color:C.muted,margin:0}}>{log.time}</p>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:6}}>
                                {names.map(s=>{
                                  const cc=CATEGORY_CONFIG[s.category]||CATEGORY_CONFIG.custom;
                                  return <span key={s.id||s.name} style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:`${cc.color}15`,color:cc.color,fontWeight:600}}>{s.icon} {s.name}</span>;
                                })}
                              </div>
                              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                                <span style={{fontSize:11,color:C.muted}}>Intensity: <b style={{color:INTENSITY_COLOR[log.intensity]||C.motor}}>{["","Mild","Moderate","High","Very High"][log.intensity]}</b></span>
                                <span style={{fontSize:11,color:C.muted}}>Duration: <b style={{color:C.tactile}}>{log.duration}min</b></span>
                                {log.environment&&<span style={{fontSize:11,color:C.muted}}>Env: <b style={{color:C.motor}}>{log.environment}</b></span>}
                              </div>
                              {log.notes&&<p style={{fontSize:12,color:C.muted,marginTop:5,fontStyle:"italic"}}>"{log.notes}"</p>}
                            </div>
                            <div style={{display:"flex",gap:3,flexShrink:0}}>
                              <button onClick={()=>{setEditLog(log);setShowLogModal(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:"4px"}}><Edit2 size={12}/></button>
                              <button onClick={()=>delLog(log.id,log.date)} style={{background:"none",border:"none",cursor:"pointer",color:C.visual,padding:"4px"}}><Trash2 size={12}/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══ TRENDS ═══ */}
        {tab==="trends"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Intensity & Mood — 14 days</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Stimming intensity vs daily mood</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,5]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:C.muted}}/>
                  <ReferenceLine y={2.5} stroke={C.dim} strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="intensity" name="Stimming intensity" stroke={C.motor}   strokeWidth={2.5} dot={{fill:C.motor,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="mood"      name="Mood"               stroke={C.tactile} strokeWidth={2}   dot={{fill:C.tactile,r:3,strokeWidth:0}} strokeDasharray="5 2"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Logs per Day</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Bar dataKey="count" name="Log entries" fill={C.motor} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stim frequency */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Most Frequent Behaviors</p>
              {stimFreq.length===0?<p style={{color:C.muted,fontSize:13}}>No logs yet.</p>:
                stimFreq.map(({stim,count})=>{
                  const cc=CATEGORY_CONFIG[stim.category]||CATEGORY_CONFIG.custom;
                  return (
                    <div key={stim.id||stim.name} style={{marginBottom:11}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{stim.icon}</span>{stim.name}</span>
                        <span style={{fontSize:12,fontWeight:700,color:cc.color}}>{count}×</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(count/logs.length)*100}%`,background:cc.color,borderRadius:99}}/>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ═══ LIBRARY ═══ */}
        {tab==="library"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{position:"relative",flex:1,minWidth:180}}>
                <Search size={13} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
                <input style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px 9px 32px",color:C.text,fontSize:13,outline:"none"}} placeholder="Search logs…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <button onClick={()=>setShowAddStim(true)} style={btnSt(true,C.custom)}><Plus size={13}/>Custom Stim</button>
            </div>

            {/* Category sections */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
              {Object.entries(CATEGORY_CONFIG).map(([cat,cc])=>{
                const catStims=allStims.filter(s=>s.category===cat);
                if (!catStims.length) return null;
                const open=expandedCats[cat];
                return (
                  <div key={cat} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                    <button onClick={()=>setExpandedCats(p=>({...p,[cat]:!p[cat]}))} style={{width:"100%",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                      <cc.Icon size={14} color={cc.color}/>
                      <span style={{fontSize:13,fontWeight:700,color:cc.color}}>{cc.label}</span>
                      <span style={{fontSize:11,color:C.muted,marginLeft:4}}>{catStims.length} behaviors</span>
                      <div style={{marginLeft:"auto",color:C.muted}}>{open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
                    </button>
                    {open&&(
                      <div style={{padding:"0 18px 14px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                        {catStims.map(s=>{
                          const freq=stimFreq.find(f=>f.stim.id===s.id)?.count||0;
                          return (
                            <div key={s.id} style={{background:C.surface,borderRadius:10,padding:"11px 13px",border:`1px solid ${C.border}`,display:"flex",alignItems:"flex-start",gap:8}}>
                              <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:12,fontWeight:700,color:C.text,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</p>
                                <p style={{fontSize:10,color:C.muted,margin:"2px 0 0"}}>{freq>0?`${freq}× logged`:"Not yet logged"}</p>
                              </div>
                              {s.custom&&<button onClick={()=>delCustomStim(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.visual,padding:"2px",flexShrink:0}}><X size={11}/></button>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Log history */}
            <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:12}}>Log History ({filteredLogs.length})</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filteredLogs.length===0?(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"40px 24px",textAlign:"center"}}>
                  <Activity size={36} color={C.dim} style={{marginBottom:10}}/>
                  <p style={{color:C.muted,fontSize:13}}>{search?"No logs match your search.":"No logs yet — tap Quick Log to start!"}</p>
                </div>
              ):filteredLogs.slice(0,30).map(log=>{
                const names=log.stimIds.map(id=>allStims.find(s=>s.id===id)||{name:id,icon:"?",category:"custom"});
                return (
                  <div key={log.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flexShrink:0,textAlign:"center",minWidth:40}}>
                      <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",margin:0}}>{fmtDay(log.date)}</p>
                      <p style={{fontSize:14,fontWeight:800,color:C.text,margin:0,letterSpacing:"-0.5px"}}>{fmtDate(log.date).split(" ")[1]}</p>
                      <p style={{fontSize:10,color:C.muted,margin:0}}>{log.time}</p>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:5}}>
                        {names.map((s,i)=>{ const cc=CATEGORY_CONFIG[s.category]||CATEGORY_CONFIG.custom; return <span key={i} style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:`${cc.color}15`,color:cc.color,fontWeight:600}}>{s.icon} {s.name}</span>; })}
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:C.muted}}>{MOOD_EMOJI[log.mood]} {MOOD_LABEL[log.mood]}</span>
                        <span style={{fontSize:11,color:C.muted}}>{["","Mild","Mod","High","V.High"][log.intensity]} intensity</span>
                        <span style={{fontSize:11,color:C.muted}}>{log.duration}min</span>
                        {log.environment&&<span style={{fontSize:11,color:C.muted}}>{log.environment}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:3,flexShrink:0}}>
                      <button onClick={()=>{setEditLog(log);setShowLogModal(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:"4px"}}><Edit2 size={13}/></button>
                      <button onClick={()=>delLog(log.id,log.date)} style={{background:"none",border:"none",cursor:"pointer",color:C.visual,padding:"4px"}}><Trash2 size={13}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI INSIGHTS ═══ */}
        {tab==="insights"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>About This Analysis</p>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.75,marginBottom:14}}>
                The AI analysis below is <strong style={{color:C.text}}>neurodiversity-affirming</strong> — stimming is understood as natural and valid self-regulation.
                Insights focus on understanding your sensory needs, not reducing or stopping stimming behaviors.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                {[
                  {l:"Logs Analysed",  v:Math.min(logs.length,14),   c:C.motor},
                  {l:"Stim Types",     v:new Set(logs.flatMap(l=>l.stimIds)).size, c:C.sensory},
                  {l:"Environments",   v:new Set(logs.map(l=>l.environment).filter(Boolean)).size, c:C.vocal},
                  {l:"Days Tracked",   v:new Set(logs.map(l=>l.date)).size, c:C.tactile},
                ].map(({l,v,c})=>(
                  <div key={l} style={{background:C.cardHi,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5}}>{l}</p>
                    <p style={{fontSize:20,fontWeight:800,color:c,margin:0}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <AIInsights logs={logs} stims={allStims}/>

            {/* Sensory toolkit */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${C.vocal}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={16} color={C.vocal}/></div>
                <p style={{fontSize:14,fontWeight:700,color:C.text}}>Sensory Toolkit Reminders</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  "Stimming is a natural way your nervous system self-regulates.",
                  "Understanding your triggers helps you create a supportive environment.",
                  "Mood dips often signal sensory overload rather than emotional issues.",
                  "Certain environments may be draining — it's okay to protect your energy.",
                  "Your stims change over time — tracking helps you honour your current needs.",
                  "Building a sensory diet of preferred inputs can reduce distress.",
                ].map((tip,i)=>(
                  <div key={i} style={{padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:12,color:C.muted,lineHeight:1.65,margin:0}}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>{setEditLog(null);setShowLogModal(true);}}
        style={{position:"fixed",bottom:28,right:24,width:52,height:52,borderRadius:"50%",background:C.motor,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${C.motor}55`,zIndex:40,transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Zap size={22} color="#07080d" strokeWidth={2.5}/>
      </button>

      {showLogModal&&<LogModal initial={editLog} customStims={customStims} onSave={saveLog} onClose={()=>{setShowLogModal(false);setEditLog(null);}}/>}
      {showAddStim&&<AddStimModal onSave={addCustomStim} onClose={()=>setShowAddStim(false)}/>}
      {confirm&&<Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}