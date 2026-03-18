import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Volume2, Users, Zap, Battery, Shield, Heart, ChevronRight,
  Brain, Plus, Minus, X, RefreshCw, AlertCircle, Wind,
  Sun, Moon, Droplets, Activity, Sparkles, TrendingUp,
  CheckCircle2, Clock, BarChart3, MessageSquare, Settings,
  ChevronDown, ChevronUp, Save, Lightbulb, Edit2
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Warm earthy dark — grounded, calm, sensory-safe
const C = {
  bg:       "#09080d",
  surface:  "#0e0c14",
  card:     "#141018",
  cardHi:   "#191420",
  border:   "#231e2e",
  borderHi: "#352c44",
  text:     "#e8e0f0",
  muted:    "#685e7a",
  dim:      "#2e2840",
  // Sensory channel colors
  sound:    "#d4a86a",   // warm amber
  social:   "#6db89a",   // sage green
  physical: "#c47a6a",   // terracotta
  energy:   "#7a84d4",   // soft indigo
  visual:   "#d46a9a",   // rose
  touch:    "#6ab8c4",   // teal
  // Accents
  lavender: "#a892f0",
  mint:     "#5ecfaa",
  amber:    "#f0b85a",
  coral:    "#f07a6a",
  sky:      "#5aaaf0",
  rose:     "#f07aaa",
};

// ─── Config ──────────────────────────────────────────────────────────────────
const SENSORY_CHANNELS = [
  { key:"sound",    label:"Sound",    Icon:Volume2,   color:C.sound,    desc:"Auditory load",      unit:"" },
  { key:"social",   label:"Social",   Icon:Users,     color:C.social,   desc:"Social energy",      unit:"" },
  { key:"physical", label:"Physical", Icon:Zap,       color:C.physical, desc:"Bodily sensation",   unit:"" },
  { key:"energy",   label:"Energy",   Icon:Battery,   color:C.energy,   desc:"Overall battery",    unit:"%" },
  { key:"visual",   label:"Visual",   Icon:Sun,       color:C.visual,   desc:"Light & visual load",unit:"" },
  { key:"touch",    label:"Touch",    Icon:Droplets,  color:C.touch,    desc:"Tactile sensitivity",unit:"" },
];

const LOAD_LABELS = ["None","Low","Mild","Moderate","High","Very High","Intense","Severe","Critical","Overwhelming","Max"];

const COMM_CARDS = [
  { text:"I need quiet",    emoji:"🤫", color:"#1a1f2e" },
  { text:"Too bright",      emoji:"💡", color:"#221a10" },
  { text:"I need space",    emoji:"🌿", color:"#121f1a" },
  { text:"Feeling good",    emoji:"😊", color:"#1a1428" },
  { text:"Need help",       emoji:"🤝", color:"#221810" },
  { text:"Break time",      emoji:"⏸️", color:"#181428" },
  { text:"Overwhelmed",     emoji:"🌊", color:"#0e1a22" },
  { text:"Feeling safe",    emoji:"🛡️", color:"#121e16" },
];

const CALMING_STRATEGIES = [
  { id:"pressure", name:"Deep Pressure",   desc:"Weighted blanket for 15 minutes", icon:"🛏️", duration:900,  color:C.lavender },
  { id:"quiet",    name:"Quiet Space",      desc:"Noise-canceling + dim lighting",  icon:"🎧", duration:600,  color:C.sound    },
  { id:"water",    name:"Sensory Reset",    desc:"Cold water on wrists, deep breaths",icon:"💧",duration:300, color:C.touch    },
  { id:"ground",   name:"Grounding 5-4-3", desc:"5-4-3-2-1 senses technique",      icon:"🌱", duration:300,  color:C.mint     },
  { id:"breath",   name:"Box Breathing",   desc:"4 seconds in, hold, out, hold",   icon:"💨", duration:240,  color:C.sky      },
  { id:"move",     name:"Gentle Movement", desc:"Slow rocking or swaying",          icon:"🌊", duration:300,  color:C.social   },
];

const MOODS = ["😔","😕","😐","🙂","😊","😄"];
const MOOD_LABELS = ["Distressed","Low","Neutral","Okay","Good","Great"];
const MOOD_COLORS = [C.coral,C.sound,"#a0a0b8",C.mint,C.social,C.lavender];

const ENVIRONMENTS = ["Home","School","Work","Outside","Transport","Social event","Healthcare","Shopping"];
const TRIGGERS = ["Loud noises","Crowds","Bright lights","Strong smells","Unexpected changes","Too many demands","Sensory overload","Hunger","Fatigue","Conflict"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const nowTime   = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtShort  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const fmtDay    = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{weekday:"short"}); } catch { return s; } };
const clamp     = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const getLoad   = v => LOAD_LABELS[clamp(Math.round(v),0,10)] || "—";
const fmtSecs   = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

// ─── Seed data ────────────────────────────────────────────────────────────────
const buildSeed = () => {
  const logs = []; let id=1;
  const today = new Date();
  const patt = [
    {s:6,so:4,p:5,e:65,v:5,t:4},
    {s:4,so:6,p:3,e:75,v:3,t:3},
    {s:8,so:3,p:6,e:45,v:7,t:6},
    {s:5,so:5,p:4,e:60,v:5,t:4},
    {s:7,so:2,p:7,e:40,v:8,t:7},
    {s:3,so:7,p:3,e:80,v:2,t:2},
    {s:6,so:4,p:5,e:65,v:6,t:5},
    {s:9,so:1,p:8,e:30,v:9,t:8},
    {s:4,so:6,p:4,e:70,v:4,t:3},
    {s:5,so:5,p:5,e:55,v:5,t:5},
    {s:7,so:3,p:6,e:50,v:6,t:6},
    {s:3,so:8,p:2,e:85,v:2,t:2},
    {s:6,so:4,p:5,e:60,v:5,t:4},
    {s:8,so:2,p:7,e:35,v:8,t:7},
  ];
  patt.forEach((p,i)=>{
    const d=new Date(today); d.setDate(d.getDate()-(13-i));
    const ds=d.toISOString().split("T")[0];
    const avgLoad=(p.s+p.so+p.p+(10-p.e/10)+p.v+p.t)/6;
    const mood=clamp(Math.round(5-(avgLoad/2))+(Math.random()>.5?1:0),0,5);
    logs.push({
      id:id++, date:ds, time:"14:00",
      sensory:{sound:p.s,social:p.so,physical:p.p,energy:p.e,visual:p.v,touch:p.t},
      mood, environment:ENVIRONMENTS[Math.floor(Math.random()*ENVIRONMENTS.length)],
      triggers:TRIGGERS.filter(()=>Math.random()>.75).slice(0,2),
      strategies:[], notes:"",
    });
  });
  return logs;
};

// ─── Components ───────────────────────────────────────────────────────────────

// Arc gauge for sensory channel
const SensoryArc = ({ value, color, size=80 }) => {
  const pct=clamp(value/10,0,1);
  const r=32, cx=40, cy=40;
  const toRad=a=>(a*Math.PI)/180;
  const start=-200, sweep=220;
  const pt=a=>({ x:cx+r*Math.cos(toRad(a)), y:cy+r*Math.sin(toRad(a)) });
  const s=pt(start), ef=pt(start+sweep);
  const end=start+sweep*pct;
  const ep=pt(end);
  const lg=sweep*pct>180?1:0;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${ef.x} ${ef.y}`} fill="none" stroke={C.border} strokeWidth={6} strokeLinecap="round"/>
      {pct>0.01&&<path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${ep.x} ${ep.y}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${color}99)`}}/>}
      <text x={cx} y={cy+5} textAnchor="middle" style={{fontSize:14,fontWeight:900,fill:color,fontFamily:"inherit",letterSpacing:"-0.5px"}}>{value}</text>
    </svg>
  );
};

// Stepper
const Stepper = ({ value, onChange, min=0, max=10, step=1, color=C.lavender, size="md" }) => {
  const hold=useRef(null);
  const go=dir=>{
    onChange(v=>clamp(+(v+dir*step).toFixed(1),min,max));
    hold.current=setTimeout(()=>{ hold.current=setInterval(()=>onChange(v=>clamp(+(v+dir*step).toFixed(1),min,max)),70); },350);
  };
  const stop=()=>{ clearTimeout(hold.current); clearInterval(hold.current); };
  useEffect(()=>()=>stop(),[]);
  const h=size==="sm"?36:46;
  return (
    <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"100%"}}>
      <button onMouseDown={()=>go(-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(-1)} onTouchEnd={stop}
        disabled={value<=min} style={{width:h,height:h,background:"none",border:"none",color:value<=min?C.dim:color,cursor:value<=min?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Minus size={size==="sm"?11:13}/>
      </button>
      <div style={{flex:1,textAlign:"center"}}>
        <span style={{fontSize:size==="sm"?16:22,fontWeight:800,color:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:"-0.5px"}}>{Number.isInteger(value)?value:value.toFixed(1)}</span>
      </div>
      <button onMouseDown={()=>go(1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(1)} onTouchEnd={stop}
        disabled={value>=max} style={{width:h,height:h,background:"none",border:"none",color:value>=max?C.dim:color,cursor:value>=max?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Plus size={size==="sm"?11:13}/>
      </button>
    </div>
  );
};

// Big energy slider
const EnergySlider = ({ value, onChange }) => {
  const col = value<30?C.coral:value<60?C.amber:C.mint;
  const label = value<30?"Low — Rest needed":value<60?"Moderate — Pace yourself":value<80?"Good — Feeling balanced":"High — Feeling great";
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
        <div style={{width:52,height:52,borderRadius:14,background:`${col}18`,border:`1px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Battery size={24} color={col}/>
        </div>
        <div>
          <p style={{fontSize:16,fontWeight:800,color:C.text,margin:0}}>Energy Level</p>
          <p style={{fontSize:13,color:col,margin:"3px 0 0",fontWeight:600}}>{label}</p>
        </div>
        <span style={{marginLeft:"auto",fontSize:36,fontWeight:900,color:col,letterSpacing:"-2px",fontVariantNumeric:"tabular-nums"}}>{value}%</span>
      </div>
      {/* Progress bar */}
      <div style={{height:14,background:C.border,borderRadius:99,overflow:"hidden",marginBottom:14}}>
        <div style={{height:"100%",width:`${value}%`,background:`linear-gradient(90deg,${col}99,${col})`,borderRadius:99,transition:"width .3s ease",boxShadow:`0 0 8px ${col}66`}}/>
      </div>
      {/* Slider */}
      <input type="range" min={0} max={100} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{width:"100%",accentColor:col,height:6,cursor:"pointer"}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        {[0,25,50,75,100].map(v=>(
          <button key={v} onClick={()=>onChange(v)} style={{padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",background:Math.abs(value-v)<8?`${col}22`:C.surface,border:`1px solid ${Math.abs(value-v)<8?col:C.border}`,color:Math.abs(value-v)<8?col:C.muted}}>{v}%</button>
        ))}
      </div>
    </div>
  );
};

// Strategy timer card
const StrategyCard = ({ strategy, isActive, onStart, onStop, timeLeft }) => {
  const pct = isActive ? (timeLeft / strategy.duration) * 100 : 0;
  return (
    <button onClick={isActive?onStop:onStart} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:isActive?`${strategy.color}12`:C.surface,border:`1.5px solid ${isActive?strategy.color:C.border}`,cursor:"pointer",textAlign:"left",width:"100%",transition:"all .18s",position:"relative",overflow:"hidden"}}>
      {isActive&&<div style={{position:"absolute",bottom:0,left:0,height:3,width:`${100-pct}%`,background:strategy.color,borderRadius:99,transition:"width 1s linear"}}/>}
      <span style={{fontSize:26,flexShrink:0}}>{strategy.icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:700,color:isActive?strategy.color:C.text,margin:0}}>{strategy.name}</p>
        <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{isActive?`${fmtSecs(timeLeft)} remaining`:strategy.desc}</p>
      </div>
      {isActive?(
        <div style={{width:36,height:36,borderRadius:"50%",background:`${strategy.color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <X size={14} color={strategy.color}/>
        </div>
      ):(
        <ChevronRight size={16} color={C.muted}/>
      )}
    </button>
  );
};

// Toast
const Toast = ({ msg, type, onDone }) => {
  useEffect(()=>{ const t=setTimeout(onDone,2700); return()=>clearTimeout(t); },[]);
  const col=type==="success"?C.mint:type==="error"?C.coral:C.amber;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.cardHi,border:`1px solid ${col}`,borderRadius:12,padding:"11px 17px",color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px #0009`,animation:"slideUp .2s ease",maxWidth:300}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:col,flexShrink:0}}/>
      {msg}
    </div>
  );
};

// Custom chart tooltip
const VTooltip = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:C.cardHi,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <p style={{color:C.muted,marginBottom:4,fontWeight:600}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color||C.text,margin:"2px 0",fontWeight:700}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// AI Insights
const AIInsights = ({ logs, currentState }) => {
  const [text,setText]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [open,setOpen]=useState(false);

  const run=useCallback(async()=>{
    setLoading(true); setError(null); setOpen(true); setText(null);
    const sample=logs.slice(-14).map(l=>
      `${l.date}: sound=${l.sensory.sound}/10 social=${l.sensory.social}/10 physical=${l.sensory.physical}/10 energy=${l.sensory.energy}% visual=${l.sensory.visual}/10 touch=${l.sensory.touch}/10 mood=${l.mood}/5 env=${l.environment||"?"} triggers=[${(l.triggers||[]).join(",")||"none"}]`
    ).join("\n");
    const cur=`Current: sound=${currentState.sound} social=${currentState.social} physical=${currentState.physical} energy=${currentState.energy}% visual=${currentState.visual} touch=${currentState.touch}`;

    const prompt=`You are a warm, neurodiversity-affirming sensory regulation AI. Analyse 14 days of sensory tracking data for an autistic person. Respond in exactly 4 focused paragraphs (2-3 sentences each):
1) Sensory load patterns — when and which channels peak, correlations with mood
2) Protective factors — what environments or conditions consistently support regulation
3) Notable patterns to be aware of — any high-risk time periods or combinations
4) Personalised regulation suggestions — practical, sensory-specific strategies based on their data

Be warm, validating, and practical. Never suggest masking or suppressing needs. Frame all sensory experiences as valid. This is for self-understanding and support, not clinical diagnosis.

${cur}

14-DAY HISTORY:
${sample}`;

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:900,messages:[{role:"user",content:prompt}]})
      });
      if(!res.ok) throw new Error(`API ${res.status}`);
      const d=await res.json();
      setText(d.content?.find(b=>b.type==="text")?.text??"No response.");
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  },[logs,currentState]);

  const ICONS=[TrendingUp,Lightbulb,AlertCircle,Sparkles];
  const COLORS=[C.lavender,C.mint,C.coral,C.amber];
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <button onClick={open?()=>setOpen(false):run} style={{width:"100%",padding:"18px 22px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${C.lavender}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Brain size={19} color={C.lavender}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>AI Sensory Insights</p>
          <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Pattern analysis across {logs.length} log entries</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!open&&<span style={{fontSize:11,fontWeight:700,color:C.lavender,background:`${C.lavender}18`,padding:"4px 12px",borderRadius:99}}>Analyse</span>}
          {open?<ChevronUp size={16} color={C.muted}/>:<ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 22px 22px",borderTop:`1px solid ${C.border}`}}>
          {loading&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"20px 0"}}><div style={{width:18,height:18,border:`2px solid ${C.lavender}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/><span style={{fontSize:13,color:C.muted}}>Reviewing your sensory patterns…</span></div>}
          {error&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:14,background:`${C.coral}15`,borderRadius:10,marginTop:14}}>
              <AlertCircle size={15} color={C.coral}/>
              <p style={{fontSize:13,color:C.coral,margin:0,flex:1}}>{error}</p>
              <button onClick={run} style={{background:`${C.lavender}22`,border:"none",color:C.lavender,fontSize:12,padding:"5px 10px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><RefreshCw size={11}/>Retry</button>
            </div>
          )}
          {text&&!loading&&(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
              {text.split("\n\n").filter(Boolean).map((para,i)=>{
                const Icon=ICONS[i]||Brain,col=COLORS[i]||C.muted;
                return(
                  <div key={i} style={{display:"flex",gap:12,padding:"13px 15px",background:`${col}0a`,borderRadius:10,borderLeft:`2px solid ${col}`}}>
                    <Icon size={14} color={col} style={{flexShrink:0,marginTop:3}}/>
                    <p style={{fontSize:13,color:i===0?C.text:C.muted,lineHeight:1.8,margin:0}}>{para}</p>
                  </div>
                );
              })}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <p style={{fontSize:11,color:C.muted,fontStyle:"italic",margin:0}}>For self-understanding only — not a clinical assessment.</p>
                <button onClick={run} style={{background:`${C.lavender}15`,border:`1px solid ${C.lavender}44`,color:C.lavender,fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={12}/>Re-analyse</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Log Modal
const LogModal = ({ initial, onSave, onClose }) => {
  const [sensory, setSensory] = useState(initial?.sensory||{sound:5,social:5,physical:5,energy:60,visual:5,touch:5});
  const [mood,    setMood]    = useState(initial?.mood??3);
  const [env,     setEnv]     = useState(initial?.environment||"Home");
  const [trigs,   setTrigs]   = useState(initial?.triggers||[]);
  const [notes,   setNotes]   = useState(initial?.notes||"");
  const [date,    setDate]    = useState(initial?.date||todayStr());
  const [time,    setTime]    = useState(initial?.time||nowTime());

  const setSens=(k,v)=>setSensory(p=>({...p,[k]:v}));
  const inp={width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:8000,overflowY:"auto",padding:"20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:20,width:"100%",maxWidth:600,padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{initial?"Edit Log":"Log Sensory State"}</p>
            <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Record how you're feeling right now</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {/* Sensory channels */}
          <div>
            <label style={lbl}>Sensory Load (0–10)</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {SENSORY_CHANNELS.filter(c=>c.key!=="energy").map(({key,label,color,Icon})=>(
                <div key={key}>
                  <p style={{fontSize:11,color,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:4}}><Icon size={11}/>{label} — <span style={{color:C.muted}}>{getLoad(sensory[key]||0)}</span></p>
                  <Stepper value={sensory[key]||0} onChange={fn=>setSens(key,typeof fn==="function"?fn(sensory[key]||0):fn)} min={0} max={10} color={color} size="sm"/>
                </div>
              ))}
            </div>
          </div>
          {/* Energy */}
          <div>
            <label style={lbl}>Energy Level</label>
            <EnergySlider value={sensory.energy||60} onChange={v=>setSens("energy",v)}/>
          </div>
          {/* Mood */}
          <div>
            <label style={lbl}>Mood</label>
            <div style={{display:"flex",gap:8}}>
              {MOODS.map((em,i)=>(
                <button key={i} onClick={()=>setMood(i)} style={{flex:1,padding:"10px 4px",borderRadius:10,background:mood===i?`${MOOD_COLORS[i]}22`:C.surface,border:`1.5px solid ${mood===i?MOOD_COLORS[i]:C.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .13s"}}>
                  <span style={{fontSize:20}}>{em}</span>
                  <span style={{fontSize:9,color:mood===i?MOOD_COLORS[i]:C.muted,fontWeight:700}}>{MOOD_LABELS[i]}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Environment */}
          <div>
            <label style={lbl}>Environment</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ENVIRONMENTS.map(e=><button key={e} onClick={()=>setEnv(e)} style={{padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:env===e?`${C.lavender}18`:C.surface,border:`1px solid ${env===e?C.lavender:C.border}`,color:env===e?C.lavender:C.muted,transition:"all .12s"}}>{e}</button>)}
            </div>
          </div>
          {/* Triggers */}
          <div>
            <label style={lbl}>Triggers</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TRIGGERS.map(t=>{const on=trigs.includes(t); return<button key={t} onClick={()=>setTrigs(p=>on?p.filter(x=>x!==t):[...p,t])} style={{padding:"5px 11px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:on?`${C.coral}18`:C.surface,border:`1px solid ${on?C.coral:C.border}`,color:on?C.coral:C.muted,transition:"all .12s"}}>{t}</button>;})}
            </div>
          </div>
          {/* Date/Time */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label style={lbl}>Time</label><input type="time" style={inp} value={time} onChange={e=>setTime(e.target.value)}/></div>
          </div>
          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{...inp,resize:"vertical",minHeight:70,lineHeight:1.7}} placeholder="How are you feeling? Any context to capture…" value={notes} onChange={e=>setNotes(e.target.value)}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>onSave({sensory,mood,environment:env,triggers:trigs,notes,date,time})} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:10,background:C.lavender,border:"none",color:"#09080d",fontSize:14,fontWeight:800,cursor:"pointer"}}>
              <Save size={14}/>{initial?"Update Log":"Save Log"}
            </button>
            <button onClick={onClose} style={{padding:"12px 20px",borderRadius:10,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Crisis Modal
const CrisisModal = ({ onClose }) => (
  <div style={{position:"fixed",inset:0,background:"#000e",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`2px solid ${C.coral}`,borderRadius:20,width:"100%",maxWidth:440,padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Shield size={20} color={C.coral}/><p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>I Need Help Now</p></div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
      </div>
      <div style={{padding:"12px 14px",background:`${C.coral}10`,border:`1px solid ${C.coral}40`,borderRadius:10,marginBottom:18}}>
        <p style={{fontSize:13,color:C.coral,fontWeight:600,margin:0}}>Take a slow breath. You are safe. Help is available.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
        <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>Quick Actions</p>
        {[
          {emoji:"💨",label:"Start Box Breathing",action:"breath"},
          {emoji:"🌱",label:"Grounding Technique (5-4-3-2-1)",action:"ground"},
          {emoji:"🛏️",label:"Deep Pressure Reset",action:"pressure"},
        ].map(({emoji,label})=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>
            <span style={{fontSize:22}}>{emoji}</span>
            <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{label}</p>
          </div>
        ))}
      </div>
      <div style={{paddingTop:14,borderTop:`1px solid ${C.border}`}}>
        <p style={{fontSize:12,color:C.muted,margin:"0 0 10px"}}>If you need to reach someone:</p>
        <p style={{fontSize:13,color:C.text,margin:"0 0 4px"}}>• Samaritans: <strong style={{color:C.lavender}}>116 123</strong></p>
        <p style={{fontSize:13,color:C.text,margin:"0 0 4px"}}>• Crisis Text Line: <strong style={{color:C.lavender}}>Text HOME to 85258</strong></p>
        <p style={{fontSize:13,color:C.text,margin:0}}>• Emergency: <strong style={{color:C.coral}}>999 / 112</strong></p>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function Autism() {
  const nextId = useRef(null);

  // Live sensory state (today)
  const [live, setLive] = useState({ sound:5, social:3, physical:5, energy:65, visual:5, touch:4 });
  const setL = (k,v) => setLive(p=>({...p,[k]:v}));

  // Historical logs
  const [logs, setLogs] = useState(()=>{
    try{ const s=localStorage.getItem("au2_logs"); const p=s?JSON.parse(s):null;
      if(Array.isArray(p)&&p.length){ nextId.current=Math.max(...p.map(l=>l.id))+1; return p; }
    }catch{}
    const seed=buildSeed(); nextId.current=seed.length+1; return seed;
  });
  useEffect(()=>{ try{localStorage.setItem("au2_logs",JSON.stringify(logs));}catch{} },[logs]);

  // Persist live state
  useEffect(()=>{ try{localStorage.setItem("au2_live",JSON.stringify(live));}catch{} },[live]);
  useEffect(()=>{
    try{ const s=localStorage.getItem("au2_live"); if(s) setLive(JSON.parse(s)); }catch{}
  },[]);

  const [tab,         setTab]         = useState("dashboard");
  const [showLog,     setShowLog]     = useState(false);
  const [editLog,     setEditLog]     = useState(null);
  const [showCrisis,  setShowCrisis]  = useState(false);
  const [activeStrat, setActiveStrat] = useState(null); // strategy id
  const [stratTime,   setStratTime]   = useState(0);
  const [toast,       setToast]       = useState(null);
  const timerRef = useRef(null);

  const push = (msg,type="success") => setToast({msg,type});

  // Strategy timer
  const startStrategy = useCallback(strat=>{
    clearInterval(timerRef.current);
    setActiveStrat(strat.id);
    setStratTime(strat.duration);
    timerRef.current = setInterval(()=>{
      setStratTime(t=>{ if(t<=1){ clearInterval(timerRef.current); setActiveStrat(null); push("Strategy complete! 🌟"); return 0; } return t-1; });
    },1000);
  },[]);
  const stopStrategy = useCallback(()=>{ clearInterval(timerRef.current); setActiveStrat(null); setStratTime(0); },[]);
  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  // Derived
  const chartData = useMemo(()=>
    logs.slice(-14).map(l=>({
      date:fmtShort(l.date),
      day:fmtDay(l.date),
      sound:l.sensory.sound, social:l.sensory.social, physical:l.sensory.physical,
      energy:Math.round(l.sensory.energy/10),
      visual:l.sensory.visual, touch:l.sensory.touch,
      mood:l.mood,
      overallLoad:+(([l.sensory.sound,l.sensory.social,l.sensory.physical,l.sensory.visual,l.sensory.touch].reduce((a,b)=>a+b,0)/5).toFixed(1)),
    })),[logs]);

  const avgSens = useMemo(()=>{
    const last7=logs.slice(-7);
    if(!last7.length) return {};
    const avg=key=>+(last7.reduce((s,l)=>s+l.sensory[key],0)/last7.length).toFixed(1);
    return {sound:avg("sound"),social:avg("social"),physical:avg("physical"),energy:avg("energy"),visual:avg("visual"),touch:avg("touch")};
  },[logs]);

  const saveLog = useCallback(fd=>{
    if(editLog){ setLogs(prev=>prev.map(l=>l.id===editLog.id?{...fd,id:editLog.id}:l)); push("Log updated"); }
    else{ setLogs(prev=>[{...fd,id:nextId.current++},...prev]); push("Sensory state logged ✓"); }
    setShowLog(false); setEditLog(null);
  },[editLog]);

  const delLog = useCallback((id)=>{ setLogs(prev=>prev.filter(l=>l.id!==id)); push("Entry removed","error"); },[]);

  const exportJSON = ()=>{
    const blob=new Blob([JSON.stringify({logs,live},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`sensory-data-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Data exported");
  };

  // Overall load score for live state
  const overallLoad = +([live.sound,live.social,live.physical,live.visual/10*10,live.touch].reduce((a,b)=>a+b,0)/5).toFixed(1);
  const loadColor = overallLoad>=7?C.coral:overallLoad>=5?C.amber:C.mint;

  const TABS=[
    {k:"dashboard",label:"Dashboard",icon:Activity},
    {k:"log",      label:"Log History",icon:BarChart3},
    {k:"calming",  label:"Strategies",icon:Heart},
    {k:"insights", label:"AI Insights",icon:Brain},
  ];

  const btnSt=(active=false,col=C.lavender)=>({
    display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,
    fontSize:12,fontWeight:700,cursor:"pointer",
    background:active?col:"none",border:active?"none":`1px solid ${C.border}`,
    color:active?"#09080d":C.muted,transition:"all .15s",
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(.4);cursor:pointer;}
        input[type=range]{accent-color:${C.lavender};}
        select option{background:${C.card};color:${C.text};}
        input::placeholder,textarea::placeholder{color:${C.dim};}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slideUp{from{transform:translateY(10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes pulse{from{opacity:.3;}to{opacity:.8;}}
        .tabBtn:hover{background:${C.cardHi}!important;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
      `}</style>

      {/* ── Crisis Button — always visible ── */}
      <button onClick={()=>setShowCrisis(true)}
        style={{position:"fixed",top:16,right:16,zIndex:60,display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:99,background:`${C.coral}18`,border:`1.5px solid ${C.coral}66`,color:C.coral,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 0 12px ${C.coral}33`}}>
        <Shield size={13}/> I Need Help Now
      </button>

      {/* ── Nav ── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:0}}>
        <div style={{maxWidth:920,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{padding:"13px 0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${C.lavender}18`,border:`1px solid ${C.lavender}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={17} color={C.lavender}/>
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:800,color:C.text,letterSpacing:"-0.4px",lineHeight:1}}>SensorySupport</p>
              <p style={{fontSize:9,color:C.muted,letterSpacing:".06em"}}>AUTISM MANAGEMENT</p>
            </div>
          </div>
          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {TABS.map(({k,label,icon:Icon})=>(
              <button key={k} className="tabBtn" onClick={()=>setTab(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.lavender:C.muted,borderBottom:`2px solid ${tab===k?C.lavender:"transparent"}`,transition:"all .18s",whiteSpace:"nowrap"}}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={exportJSON} style={btnSt()}><Plus size={12}/></button>
            <button onClick={()=>{setEditLog(null);setShowLog(true);}} style={btnSt(true,C.lavender)}><Plus size={14}/>Log State</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{maxWidth:920,margin:"0 auto",padding:"24px 16px 80px"}}>

        {/* ═══ DASHBOARD ═══ */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeIn .3s ease"}}>

            {/* Overall load banner */}
            <div style={{background:C.card,border:`1px solid ${overallLoad>=7?C.coral:overallLoad>=5?C.amber:C.border}`,borderRadius:18,padding:"18px 22px",display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:56,height:56,borderRadius:14,background:`${loadColor}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Activity size={26} color={loadColor}/>
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>Current Sensory Load</p>
                <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>
                  {overallLoad>=7?"High load — regulation support recommended":overallLoad>=5?"Moderate load — monitor and pace":"Low load — feeling regulated"}
                </p>
              </div>
              <span style={{fontSize:42,fontWeight:900,color:loadColor,letterSpacing:"-2px",fontVariantNumeric:"tabular-nums"}}>{overallLoad}<span style={{fontSize:16,fontWeight:500,color:C.muted}}>/10</span></span>
            </div>

            {/* Energy slider (prominent) */}
            <EnergySlider value={live.energy} onChange={v=>setL("energy",v)}/>

            {/* Sensory channel grid */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <p style={{fontSize:14,fontWeight:700,color:C.text}}>Live Sensory Channels</p>
                <p style={{fontSize:11,color:C.muted}}>Tap stepper to adjust · Values update in real-time</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
                {SENSORY_CHANNELS.filter(c=>c.key!=="energy").map(({key,label,color,Icon,desc})=>(
                  <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.surface,borderRadius:12,border:`1px solid ${C.border}`}}>
                    <SensoryArc value={live[key]||0} color={color} size={72}/>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:700,color,margin:"0 0 2px",display:"flex",alignItems:"center",gap:4}}><Icon size={11}/>{label}</p>
                      <p style={{fontSize:10,color:C.muted,margin:"0 0 8px"}}>{getLoad(live[key]||0)}</p>
                      <Stepper value={live[key]||0} onChange={fn=>setL(key,typeof fn==="function"?fn(live[key]||0):fn)} min={0} max={10} color={color} size="sm"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Communication */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Quick Communication</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:14}}>Tap a card to communicate your needs</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {COMM_CARDS.map((card,i)=>(
                  <button key={i} onClick={()=>push(`"${card.text}" communicated`)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 8px",borderRadius:12,background:card.color,border:`1px solid ${C.border}`,cursor:"pointer",transition:"transform .1s",fontSize:11,fontWeight:700,color:C.text}}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    <span style={{fontSize:24}}>{card.emoji}</span>
                    {card.text}
                  </button>
                ))}
              </div>
            </div>

            {/* 7-day average summary */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>7-Day Averages</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {SENSORY_CHANNELS.filter(c=>c.key!=="energy").map(({key,label,color,Icon})=>(
                  <div key={key} style={{padding:"10px 12px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,fontWeight:700,color,margin:"0 0 4px",display:"flex",alignItems:"center",gap:3}}><Icon size={10}/>{label}</p>
                    <p style={{fontSize:20,fontWeight:800,color,margin:0,letterSpacing:"-0.5px"}}>{avgSens[key]||0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ LOG HISTORY ═══ */}
        {tab==="log"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            {/* Chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px",marginBottom:18}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Sensory Load Over Time</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Overall average load vs mood</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={5} stroke={C.dim} strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="overallLoad" name="Sensory load" stroke={C.coral}   strokeWidth={2.5} dot={{fill:C.coral,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="mood"        name="Mood"         stroke={C.lavender} strokeWidth={2}   dot={{fill:C.lavender,r:3,strokeWidth:0}} strokeDasharray="5 2"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-channel area */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px",marginBottom:18}}>
              <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:14}}>Sound & Social Load</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.sound} stopOpacity={0.3}/><stop offset="95%" stopColor={C.sound} stopOpacity={0}/></linearGradient>
                    <linearGradient id="socg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.social} stopOpacity={0.25}/><stop offset="95%" stopColor={C.social} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Area type="monotone" dataKey="sound"  name="Sound"  stroke={C.sound}  fill="url(#sg)"   strokeWidth={2} dot={false}/>
                  <Area type="monotone" dataKey="social" name="Social" stroke={C.social} fill="url(#socg)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Log entries */}
            <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
              <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",flex:1}}>Log Entries ({logs.length})</p>
              <button onClick={()=>{setEditLog(null);setShowLog(true);}} style={btnSt(true,C.lavender)}><Plus size={13}/>New Log</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {logs.slice().reverse().slice(0,20).map(log=>{
                const avgL=+([log.sensory.sound,log.sensory.social,log.sensory.physical,log.sensory.visual,log.sensory.touch].reduce((a,b)=>a+b,0)/5).toFixed(1);
                const lc=avgL>=7?C.coral:avgL>=5?C.amber:C.mint;
                return(
                  <div key={log.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flexShrink:0,textAlign:"center",minWidth:44}}>
                      <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",margin:0}}>{fmtDay(log.date)}</p>
                      <p style={{fontSize:14,fontWeight:800,color:C.text,margin:0,letterSpacing:"-0.3px",lineHeight:1.3}}>{fmtShort(log.date)}</p>
                      <p style={{fontSize:10,color:C.muted,margin:0}}>{log.time}</p>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:700,color:lc}}>{avgL}/10 load</span>
                        <span style={{fontSize:16}}>{MOODS[log.mood]||"😐"}</span>
                        {log.environment&&<span style={{fontSize:11,color:C.muted}}>· {log.environment}</span>}
                        <span style={{fontSize:11,color:C.muted}}>· {log.sensory.energy}% energy</span>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {SENSORY_CHANNELS.filter(c=>c.key!=="energy").map(({key,color})=>(
                          <span key={key} style={{fontSize:10,color,fontWeight:700}}>{log.sensory[key]}</span>
                        ))}
                        {(log.triggers||[]).slice(0,2).map(t=><span key={t} style={{fontSize:10,padding:"1px 6px",borderRadius:99,background:`${C.coral}15`,color:C.coral,fontWeight:600}}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:3,flexShrink:0}}>
                      <button onClick={()=>{setEditLog(log);setShowLog(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:"4px"}}><Edit2 size={13}/></button>
                      <button onClick={()=>delLog(log.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.coral,padding:"4px"}}><X size={13}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CALMING STRATEGIES ═══ */}
        {tab==="calming"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            {activeStrat&&(
              <div style={{background:`${C.lavender}12`,border:`1px solid ${C.lavender}44`,borderRadius:14,padding:"14px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:C.lavender,animation:"pulse 1s ease-in-out infinite alternate"}}/>
                <p style={{fontSize:13,fontWeight:600,color:C.lavender,margin:0}}>Strategy in progress — {fmtSecs(stratTime)} remaining</p>
                <button onClick={stopStrategy} style={{marginLeft:"auto",background:`${C.coral}18`,border:`1px solid ${C.coral}44`,color:C.coral,fontSize:12,padding:"5px 12px",borderRadius:6,cursor:"pointer"}}>Stop</button>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
              {CALMING_STRATEGIES.map(strat=>(
                <StrategyCard key={strat.id} strategy={strat}
                  isActive={activeStrat===strat.id} timeLeft={stratTime}
                  onStart={()=>startStrategy(strat)} onStop={stopStrategy}/>
              ))}
            </div>

            {/* Sensory toolkit */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Lightbulb size={15} color={C.amber}/>Sensory Toolkit</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  {icon:"🎧",label:"Noise-canceling headphones",sub:"Reduces auditory load"},
                  {icon:"😎",label:"Sunglasses / dim lighting",sub:"Reduces visual load"},
                  {icon:"🧸",label:"Fidget or comfort object",sub:"Tactile regulation"},
                  {icon:"🌬️",label:"Fan or white noise",sub:"Auditory masking"},
                  {icon:"🫂",label:"Compression clothing",sub:"Deep pressure input"},
                  {icon:"🌿",label:"Nature or quiet outdoors",sub:"Sensory reset"},
                ].map(({icon,label,sub})=>(
                  <div key={label} style={{display:"flex",gap:10,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <span style={{fontSize:22,flexShrink:0}}>{icon}</span>
                    <div>
                      <p style={{fontSize:12,fontWeight:700,color:C.text,margin:0}}>{label}</p>
                      <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ AI INSIGHTS ═══ */}
        {tab==="insights"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>About This Analysis</p>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.75}}>
                Insights are <strong style={{color:C.text}}>neurodiversity-affirming</strong> — your sensory experiences are valid and understood as natural variations, not problems to fix. Suggestions focus on environmental support and regulation, not masking.
              </p>
            </div>
            <AIInsights logs={logs} currentState={live}/>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Current vs Historical</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {SENSORY_CHANNELS.filter(c=>c.key!=="energy").map(({key,label,color,Icon})=>{
                  const hist=avgSens[key]||0;
                  const curr=live[key]||0;
                  const diff=+(curr-hist).toFixed(1);
                  return(
                    <div key={key} style={{padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,fontWeight:700,color,margin:"0 0 6px",display:"flex",alignItems:"center",gap:3}}><Icon size={10}/>{label}</p>
                      <p style={{fontSize:22,fontWeight:800,color,margin:0}}>{curr}</p>
                      <p style={{fontSize:10,color:diff>0?C.coral:diff<0?C.mint:C.muted,margin:"3px 0 0"}}>
                        {diff>0?`+${diff}`:diff<0?`${diff}`:"—"} vs 7d avg
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>{setEditLog(null);setShowLog(true);}}
        style={{position:"fixed",bottom:28,right:24,width:52,height:52,borderRadius:"50%",background:C.lavender,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${C.lavender}55`,zIndex:40,transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Plus size={22} color="#09080d" strokeWidth={2.5}/>
      </button>

      {showLog   && <LogModal initial={editLog} onSave={saveLog} onClose={()=>{setShowLog(false);setEditLog(null);}}/>}
      {showCrisis&& <CrisisModal onClose={()=>setShowCrisis(false)}/>}
      {toast     && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}