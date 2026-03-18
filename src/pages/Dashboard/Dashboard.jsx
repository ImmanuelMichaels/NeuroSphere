import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send, Calendar, Activity, Shield, Bell, CheckCircle2,
  ChevronDown, ChevronUp, Brain, Heart, Pill, BarChart3,
  TrendingUp, TrendingDown, Zap, Moon, Sun, Wind,
  RefreshCw, Plus, X, Clock, Video, Phone, AlertCircle,
  Sparkles, BookOpen, Dna, Volume2, Smile, Star,
  ChevronRight, Check, Edit2, Trash2
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       "#060709",
  surface:  "#0b0d12",
  card:     "#0f1218",
  cardHi:   "#131720",
  border:   "#1a2030",
  borderHi: "#243048",
  text:     "#e4ecf4",
  muted:    "#526070",
  dim:      "#202a38",
  // Brand palette
  sage:     "#4db89a",
  sageDim:  "#0d3328",
  amber:    "#e8a84a",
  amberDim: "#3a2808",
  violet:   "#9b7cf0",
  violetDim:"#22155a",
  rose:     "#e86070",
  roseDim:  "#3a1018",
  sky:      "#4898e8",
  skyDim:   "#0c2448",
  mint:     "#40d4b0",
  gold:     "#f0c040",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const fmtShort  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const nowHour   = () => new Date().getHours();
const clamp     = (v,mn,mx) => Math.min(mx, Math.max(mn, v));

// ─── Seed / static data ───────────────────────────────────────────────────────
const SEED_MOOD = (() => {
  const today = new Date();
  return Array.from({length:14},(_,i)=>{
    const d = new Date(today); d.setDate(d.getDate()-(13-i));
    const base = 3 + Math.sin(i*0.6)*1.2;
    return {
      date: fmtShort(d.toISOString().split("T")[0]),
      mood: +clamp(base + (Math.random()-.4)*.8, 1, 5).toFixed(1),
      energy: +clamp(3+Math.sin(i*0.4)*1.5+(Math.random()-.5), 1, 5).toFixed(1),
      sleep: +clamp(6.5+Math.sin(i*0.5)*.9+(Math.random()-.4)*.6, 4, 9).toFixed(1),
    };
  });
})();

const MEDICATIONS = [
  { id:1, name:"Lithium Carbonate", dose:"300mg",  times:["09:00","21:00"], taken:{am:false, pm:false}, color:C.sage   },
  { id:2, name:"Quetiapine",        dose:"50mg",   times:["21:00"],         taken:{pm:false},            color:C.violet },
  { id:3, name:"Lamotrigine",       dose:"200mg",  times:["09:00"],         taken:{am:false},            color:C.amber  },
];

const MODULES = [
  { key:"mood",    title:"Mood Tracker",    desc:"Log and visualize patterns",     icon:Smile,    color:C.sage,   bg:C.sageDim   },
  { key:"journal", title:"Journal",         desc:"Private thoughts & CBT tools",   icon:BookOpen, color:C.violet, bg:C.violetDim },
  { key:"sensory", title:"Sensory Support", desc:"Regulation tools & timers",      icon:Volume2,  color:C.amber,  bg:C.amberDim  },
  { key:"therapy", title:"Therapy Notes",   desc:"Session notes & insights",       icon:Brain,    color:C.sky,    bg:C.skyDim    },
  { key:"genes",   title:"Genetics",        desc:"Medication optimization",        icon:Dna,      color:C.mint,   bg:C.sageDim   },
  { key:"crisis",  title:"Crisis Plan",     desc:"Safety & support resources",     icon:Shield,   color:C.rose,   bg:C.roseDim   },
];

const APPOINTMENTS = [
  { id:1, provider:"Dr. Sarah Jennings",  role:"Psychiatrist",      date:"Tomorrow",           time:"10:00 AM", type:"video",  duration:45  },
  { id:2, provider:"Amara Cole, LCSW",    role:"Therapist",          date:"Thu, Mar 20",        time:"2:00 PM",  type:"video",  duration:60  },
  { id:3, provider:"Dr. Kwame Asante",    role:"GP",                 date:"Fri, Mar 28",        time:"11:30 AM", type:"in-person",duration:30},
];

const WELLNESS_METRICS = [
  { label:"Mood",         val:3.8, max:5,   color:C.sage,   icon:Smile    },
  { label:"Sleep",        val:7.2, max:9,   color:C.violet, icon:Moon     },
  { label:"Energy",       val:3.5, max:5,   color:C.amber,  icon:Zap      },
  { label:"Anxiety",      val:2.9, max:5,   color:C.rose,   icon:Wind     },
  { label:"Medication",   val:86,  max:100, color:C.mint,   icon:Pill, pct:true },
];

const RECENT_CHECKINS = [
  { day:"Mon", mood:4, energy:4, anxiety:2, sleep:7.5 },
  { day:"Tue", mood:3, energy:3, anxiety:3, sleep:6.8 },
  { day:"Wed", mood:4, energy:4, anxiety:2, sleep:8.0 },
  { day:"Thu", mood:3, energy:2, anxiety:4, sleep:6.0 },
  { day:"Fri", mood:4, energy:3, anxiety:2, sleep:7.2 },
  { day:"Sat", mood:5, energy:4, anxiety:1, sleep:8.5 },
  { day:"Sun", mood:4, energy:4, anxiety:2, sleep:7.8 },
];

const RADAR_DATA = [
  { subject:"Mood",    A:76 },
  { subject:"Sleep",   A:80 },
  { subject:"Energy",  A:70 },
  { subject:"Focus",   A:65 },
  { subject:"Social",  A:72 },
  { subject:"Calm",    A:68 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toast = ({ msg, type, onDone }) => {
  useEffect(()=>{ const t=setTimeout(onDone,2700); return()=>clearTimeout(t); },[]);
  const col = type==="success"?C.sage:type==="error"?C.rose:C.amber;
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:C.cardHi,border:`1px solid ${col}`,borderRadius:12,padding:"12px 20px",color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 20px #000a`,animation:"slideUp .2s ease",whiteSpace:"nowrap"}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:col}}/>
      {msg}
    </div>
  );
};

const VTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:C.cardHi,border:`1px solid ${C.borderHi}`,borderRadius:10,padding:"10px 14px",fontSize:12}}>
      <p style={{color:C.muted,marginBottom:4,fontWeight:600}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{color:p.color||C.text,margin:"2px 0",fontWeight:700}}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// Mood ring orb
const MoodOrb = ({ value, size=56 }) => {
  const pct = clamp(value/5,0,1);
  const col = value>=4?C.sage:value>=3?C.amber:C.rose;
  const emoji = value>=4.5?"😄":value>=3.5?"😊":value>=2.5?"😐":value>=1.5?"😕":"😔";
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:`${col}18`,border:`2px solid ${col}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
      <span style={{fontSize:size*0.45}}>{emoji}</span>
      <div style={{position:"absolute",bottom:-2,right:-2,width:14,height:14,borderRadius:"50%",background:col,border:`2px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:7,color:"#060709",fontWeight:900}}>{value}</span>
      </div>
    </div>
  );
};

// Stat card
const StatCard = ({ label, val, pct, color, Icon, sub, trend }) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",position:"relative",overflow:"hidden",flex:1,minWidth:110}}>
    <div style={{position:"absolute",right:12,top:12,opacity:.07}}><Icon size={38}/></div>
    <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{label}</p>
    <p style={{fontSize:24,fontWeight:900,color,letterSpacing:"-1px",margin:0}}>{pct?`${val}%`:val}</p>
    {sub&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</p>}
    {trend!==undefined&&<div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>{trend>0?<TrendingUp size={11} color={C.sage}/>:<TrendingDown size={11} color={C.rose}/>}<span style={{fontSize:10,color:trend>0?C.sage:C.rose,fontWeight:600}}>{Math.abs(trend)}% this week</span></div>}
  </div>
);

// Medication row
const MedRow = ({ med, onToggle }) => {
  const takenCount = Object.values(med.taken).filter(Boolean).length;
  const total = Object.values(med.taken).length;
  const allTaken = takenCount === total;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.surface,borderRadius:12,border:`1px solid ${allTaken?med.color+"44":C.border}`,transition:"border-color .15s"}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:med.color,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{med.name}</p>
        <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{med.dose} · {med.times.join(", ")}</p>
      </div>
      <div style={{display:"flex",gap:6}}>
        {Object.entries(med.taken).map(([slot,taken])=>(
          <button key={slot} onClick={()=>onToggle(med.id,slot)} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${taken?med.color:C.border}`,background:taken?`${med.color}18`:C.card,color:taken?med.color:C.muted,fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}>
            {taken?<Check size={13}/>:<span style={{fontSize:9,textTransform:"uppercase"}}>{slot}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

// Crisis modal
const CrisisModal = ({ onClose }) => (
  <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`2px solid ${C.rose}`,borderRadius:20,width:"100%",maxWidth:460,padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Shield size={20} color={C.rose}/><p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>I Need Help Now</p></div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
      </div>
      <div style={{padding:"12px 14px",background:`${C.rose}10`,border:`1px solid ${C.rose}40`,borderRadius:10,marginBottom:18}}>
        <p style={{fontSize:13,color:C.rose,fontWeight:600,margin:0}}>You are not alone. Support is available right now.</p>
      </div>
      {[
        {label:"Samaritans",            contact:"116 123",          icon:"📞"},
        {label:"Crisis Text Line",      contact:"Text HOME to 85258",icon:"💬"},
        {label:"Emergency Services",    contact:"999 / 112",        icon:"🚨"},
        {label:"Mind Infoline",         contact:"0300 123 3393",    icon:"🧠"},
      ].map(({label,contact,icon})=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,marginBottom:8}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div style={{flex:1}}><p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{label}</p></div>
          <p style={{fontSize:13,fontWeight:700,color:C.sage,margin:0}}>{contact}</p>
        </div>
      ))}
      <p style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:14}}>If you're in immediate danger, please call 999</p>
    </div>
  </div>
);

// AI Triage
const AITriage = ({ onClose }) => {
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const send = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { role:"user", content:text };
    setMessages(prev=>[...prev, userMsg]);
    setInput(""); setLoading(true); setError(null);

    const history = [...messages, userMsg].map(m=>({ role:m.role, content:m.content }));
    const systemPrompt = `You are a warm, compassionate mental health support companion for a mental health management app. The user may be sharing how they're feeling or asking for support.

Your role:
- Respond with genuine warmth and empathy
- Validate their feelings without judgment  
- Suggest relevant app features when appropriate (Mood Tracker, Journal, Sensory Support, Therapy Notes, Medications)
- Gently remind them about crisis resources if they express distress
- Keep responses concise (2-3 sentences max unless more is genuinely needed)
- Never diagnose or provide clinical advice
- Always be affirming and neurodiversity-positive

If they seem to be in crisis, prioritize directing them to the "I Need Help Now" button.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:systemPrompt,
          messages:history,
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const d = await res.json();
      const reply = d.content?.find(b=>b.type==="text")?.text ?? "I'm here with you.";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setError("Couldn't reach the AI right now. Please try again.");
    } finally {
      setLoading(false);
    }
  },[messages]);

  const suggestions = ["I'm feeling anxious today","Having trouble sleeping","Feeling pretty good actually","I need to vent"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:400}}>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"0 4px",display:"flex",flexDirection:"column",gap:12,marginBottom:16,maxHeight:320}}>
        {messages.length===0&&(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:`${C.violet}18`,border:`2px solid ${C.violet}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
              <Sparkles size={24} color={C.violet}/>
            </div>
            <p style={{fontSize:13,color:C.muted}}>Share how you're feeling. I'm here to listen.</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:14}}>
              {suggestions.map(s=>(
                <button key={s} onClick={()=>send(s)} style={{padding:"6px 12px",borderRadius:99,fontSize:12,fontWeight:600,background:C.surface,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer"}}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"82%",padding:"11px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?`${C.violet}28`:C.cardHi,border:`1px solid ${m.role==="user"?C.violet+"44":C.border}`,fontSize:13,color:C.text,lineHeight:1.65}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{padding:"11px 14px",borderRadius:"16px 16px 16px 4px",background:C.cardHi,border:`1px solid ${C.border}`,display:"flex",gap:4,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce .9s ease-in-out ${i*.15}s infinite`}}/>)}
            </div>
          </div>
        )}
        {error&&<p style={{fontSize:12,color:C.rose,textAlign:"center"}}>{error}</p>}
        <div ref={endRef}/>
      </div>
      {/* Input */}
      <div style={{display:"flex",gap:8}}>
        <input
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send(input)}
          placeholder="Share what's on your mind…"
          style={{flex:1,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}
        />
        <button onClick={()=>send(input)} disabled={!input.trim()||loading}
          style={{width:44,height:44,borderRadius:12,background:input.trim()&&!loading?C.violet:C.dim,border:"none",color:input.trim()&&!loading?"#060709":C.muted,cursor:input.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s",flexShrink:0}}>
          <Send size={16}/>
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  // State
  const [meds,         setMeds]         = useState(MEDICATIONS);
  const [appointments, setAppointments] = useState(APPOINTMENTS);
  const [streakDays,   setStreakDays]   = useState(12);
  const [checkedIn,    setCheckedIn]    = useState(false);
  const [todayMood,    setTodayMood]    = useState(null);
  const [expandMods,   setExpandMods]   = useState(true);
  const [expandWell,   setExpandWell]   = useState(true);
  const [expandAppts,  setExpandAppts]  = useState(true);
  const [showCrisis,   setShowCrisis]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [activeTab,    setActiveTab]    = useState("home"); // home | chart | meds

  const push = (msg, type="success") => setToast({msg,type});

  // Persist meds taken state
  useEffect(()=>{ try{localStorage.setItem("db2_meds",JSON.stringify(meds));}catch{} },[meds]);
  useEffect(()=>{
    try{const s=localStorage.getItem("db2_meds");if(s){const p=JSON.parse(s);if(Array.isArray(p))setMeds(p);}}catch{}
  },[]);

  // Greeting based on time
  const greeting = useMemo(()=>{
    const h = nowHour();
    if (h<12) return "Good morning";
    if (h<18) return "Good afternoon";
    return "Good evening";
  },[]);

  // Med toggle
  const toggleMed = useCallback((id, slot)=>{
    setMeds(prev=>prev.map(m=>m.id===id?{...m,taken:{...m.taken,[slot]:!m.taken[slot]}}:m));
    push("Medication updated ✓");
  },[]);

  // Today's medication adherence
  const medAdherence = useMemo(()=>{
    const total = meds.reduce((s,m)=>s+Object.keys(m.taken).length,0);
    const done  = meds.reduce((s,m)=>s+Object.values(m.taken).filter(Boolean).length,0);
    return total>0 ? Math.round((done/total)*100) : 0;
  },[meds]);

  // Next appointment
  const nextAppt = appointments[0];

  // Average this-week mood
  const avgMood = useMemo(()=>+(RECENT_CHECKINS.reduce((s,d)=>s+d.mood,0)/RECENT_CHECKINS.length).toFixed(1),[]);

  const TABS = [{k:"home",label:"Home"},{k:"charts",label:"Charts"},{k:"meds",label:"Medications"}];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Nunito',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:${C.bg};}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.4);}
        input::placeholder{color:${C.dim};}
        @keyframes slideUp{from{transform:translateY(8px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}
        @keyframes pulse{0%,100%{opacity:.4;}50%{opacity:1;}}
        .mod-btn:hover{transform:translateY(-2px);border-color:var(--mc)!important;}
        .nav-tab:hover{background:${C.cardHi}!important;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important;}}
      `}</style>

      {/* ── Crisis Button ── */}
      <button onClick={()=>setShowCrisis(true)}
        style={{position:"fixed",top:20,right:20,zIndex:60,display:"flex",alignItems:"center",gap:7,padding:"10px 18px",borderRadius:99,background:`${C.rose}18`,border:`1.5px solid ${C.rose}66`,color:C.rose,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 0 12px ${C.rose}28`,backdropFilter:"blur(8px)"}}>
        <Shield size={13}/> Need Help Now
      </button>

      {/* ── Header ── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 0"}}>
        <div style={{maxWidth:1040,margin:"0 auto",padding:"16px 20px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{flex:1}}>
            <p style={{fontSize:11,color:C.muted,letterSpacing:".06em",textTransform:"uppercase",margin:0}}>{dateStr}</p>
            <h1 style={{fontSize:22,fontWeight:900,color:C.text,margin:"2px 0 0",letterSpacing:"-0.6px"}}>{greeting}, <span style={{color:C.sage}}>Michael</span></h1>
          </div>
          {/* Tab nav */}
          <div style={{display:"flex",gap:2}}>
            {TABS.map(({k,label})=>(
              <button key={k} className="nav-tab" onClick={()=>setActiveTab(k)} style={{padding:"8px 16px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",background:activeTab===k?C.violet:"none",border:"none",color:activeTab===k?"#060709":C.muted,transition:"all .15s"}}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{maxWidth:1040,margin:"0 auto",padding:"24px 20px 80px"}}>

        {/* ═══ HOME ═══ */}
        {activeTab==="home"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            {/* KPI strip */}
            <div style={{display:"flex",gap:12,marginBottom:22,flexWrap:"wrap"}}>
              <StatCard label="Streak" val={`${streakDays}d`} pct={false} color={C.gold} Icon={Star} sub="Med adherence" trend={8}/>
              <StatCard label="Adherence" val={medAdherence} pct color={medAdherence>=80?C.sage:medAdherence>=60?C.amber:C.rose} Icon={Pill} sub="Today's meds"/>
              <StatCard label="Avg Mood" val={avgMood} pct={false} color={C.violet} Icon={Smile} sub="This week" trend={4}/>
              <StatCard label="Avg Sleep" val={"7.4h"} pct={false} color={C.sky} Icon={Moon} sub="Last 7 nights" trend={2}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              {/* Left column */}
              <div style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* AI companion */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${C.violet}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={16} color={C.violet}/></div>
                    <div>
                      <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>How are you feeling?</p>
                      <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>Your personal support companion</p>
                    </div>
                  </div>
                  <AITriage/>
                </div>

                {/* Medication reminder */}
                <div style={{background:C.card,border:`1px solid ${medAdherence===100?C.sage+"55":C.border}`,borderRadius:18,padding:20,transition:"border-color .3s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${C.amber}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Bell size={16} color={C.amber}/></div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>Today's Medications</p>
                      <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{medAdherence}% taken today</p>
                    </div>
                    <button onClick={()=>setActiveTab("meds")} style={{fontSize:11,fontWeight:700,color:C.sage,background:`${C.sage}15`,border:`1px solid ${C.sage}44`,padding:"5px 10px",borderRadius:6,cursor:"pointer"}}>View All</button>
                  </div>
                  {/* Progress bar */}
                  <div style={{height:6,background:C.border,borderRadius:99,overflow:"hidden",marginBottom:14}}>
                    <div style={{height:"100%",width:`${medAdherence}%`,background:medAdherence===100?C.sage:medAdherence>=60?C.amber:C.rose,borderRadius:99,transition:"width .5s ease"}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {meds.map(m=><MedRow key={m.id} med={m} onToggle={toggleMed}/>)}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* Next appointment */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${C.sky}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Calendar size={16} color={C.sky}/></div>
                    <p style={{fontSize:14,fontWeight:700,color:C.text}}>Upcoming Sessions</p>
                    <button onClick={()=>setExpandAppts(e=>!e)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.muted}}>
                      {expandAppts?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
                    </button>
                  </div>
                  {expandAppts&&(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {appointments.map((a,i)=>(
                        <div key={a.id} style={{display:"flex",gap:12,padding:"12px 14px",background:i===0?`${C.sky}0a`:C.surface,borderRadius:12,border:`1px solid ${i===0?C.sky+"44":C.border}`}}>
                          <div style={{width:44,height:44,borderRadius:10,background:`${C.sky}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {a.type==="video"?<Video size={18} color={C.sky}/>:<Phone size={18} color={C.sky}/>}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{a.provider}</p>
                            <p style={{fontSize:11,color:C.muted,margin:"2px 0 0"}}>{a.role}</p>
                            <div style={{display:"flex",gap:8,marginTop:4}}>
                              <span style={{fontSize:11,color:i===0?C.sky:C.muted,fontWeight:600}}>{a.date}</span>
                              <span style={{fontSize:11,color:C.muted}}>· {a.time} · {a.duration}min</span>
                            </div>
                          </div>
                          {i===0&&<button onClick={()=>push("Joining waiting room…")} style={{padding:"6px 12px",borderRadius:8,background:C.sky,border:"none",color:"#060709",fontSize:11,fontWeight:700,cursor:"pointer",alignSelf:"center",flexShrink:0}}>Join</button>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Wellness summary */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${C.sage}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Activity size={16} color={C.sage}/></div>
                    <p style={{fontSize:14,fontWeight:700,color:C.text}}>This Week's Wellness</p>
                    <button onClick={()=>setExpandWell(e=>!e)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.muted}}>
                      {expandWell?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
                    </button>
                  </div>
                  {expandWell&&(
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      {WELLNESS_METRICS.map(({label,val,max,color,icon:Icon,pct})=>(
                        <div key={label}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                            <span style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}><Icon size={11} color={color}/>{label}</span>
                            <span style={{fontSize:12,fontWeight:700,color}}>{pct?`${val}%`:val}</span>
                          </div>
                          <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(val/max)*100}%`,background:color,borderRadius:99,transition:"width .5s ease"}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Care modules */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${C.violet}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={16} color={C.violet}/></div>
                    <p style={{fontSize:14,fontWeight:700,color:C.text}}>Care Modules</p>
                    <button onClick={()=>setExpandMods(e=>!e)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:C.muted}}>
                      {expandMods?<ChevronUp size={16}/>:<ChevronDown size={16}/>}
                    </button>
                  </div>
                  {expandMods&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      {MODULES.map(({key,title,desc,icon:Icon,color,bg})=>(
                        <button key={key} className="mod-btn" style={{"--mc":color,display:"flex",alignItems:"center",gap:10,padding:"12px 13px",borderRadius:12,background:C.surface,border:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                          <div style={{width:32,height:32,borderRadius:9,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <Icon size={14} color={color}/>
                          </div>
                          <div style={{minWidth:0}}>
                            <p style={{fontSize:12,fontWeight:700,color:C.text,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{title}</p>
                            <p style={{fontSize:10,color:C.muted,margin:"1px 0 0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHARTS ═══ */}
        {activeTab==="charts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>
            {/* Mood + energy area */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 18px 14px"}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Mood & Energy — 14 days</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:18}}>Daily mood score and energy levels</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={SEED_MOOD} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.sage} stopOpacity={0.3}/><stop offset="95%" stopColor={C.sage} stopOpacity={0}/></linearGradient>
                    <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.violet} stopOpacity={0.2}/><stop offset="95%" stopColor={C.violet} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false} domain={[0,5]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={3} stroke={C.dim} strokeDasharray="4 3"/>
                  <Area type="monotone" dataKey="mood"   name="Mood"   stroke={C.sage}   strokeWidth={2.5} fill="url(#mg)" dot={false} activeDot={{r:4,fill:C.sage}}/>
                  <Area type="monotone" dataKey="energy" name="Energy" stroke={C.violet} strokeWidth={2}   fill="url(#eg)" dot={false} activeDot={{r:4,fill:C.violet}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Sleep bar */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 14px 12px"}}>
                <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:14}}>Sleep (hours)</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={SEED_MOOD.slice(-7)} margin={{top:4,right:4,left:-28,bottom:0}} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false}/>
                    <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                    <Tooltip content={<VTooltip/>}/>
                    <ReferenceLine y={7} stroke={C.sky} strokeDasharray="3 2" strokeOpacity={.7}/>
                    <Bar dataKey="sleep" name="Sleep" fill={C.sky} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Wellness radar */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 14px 12px"}}>
                <p style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Wellness Radar</p>
                <ResponsiveContainer width="100%" height={175}>
                  <RadarChart data={RADAR_DATA} margin={{top:0,right:20,left:20,bottom:0}}>
                    <PolarGrid stroke={C.border}/>
                    <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:10,fontWeight:600}}/>
                    <Radar name="This week" dataKey="A" stroke={C.sage} fill={C.sage} fillOpacity={0.18} strokeWidth={2}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly check-in grid */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:16}}>Weekly Check-in Breakdown</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
                {RECENT_CHECKINS.map(d=>{
                  const col=d.mood>=4?C.sage:d.mood>=3?C.amber:C.rose;
                  return(
                    <div key={d.day} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase"}}>{d.day}</p>
                      <div style={{width:40,height:40,borderRadius:"50%",background:`${col}18`,border:`2px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:18}}>{d.mood>=4.5?"😄":d.mood>=3.5?"😊":d.mood>=2.5?"😐":"😕"}</span>
                      </div>
                      <p style={{fontSize:10,color:col,fontWeight:700}}>{d.mood}</p>
                      <p style={{fontSize:9,color:C.muted}}>{d.sleep}h</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ MEDICATIONS ═══ */}
        {activeTab==="meds"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            {/* Adherence hero */}
            <div style={{background:C.card,border:`1px solid ${medAdherence===100?C.sage+"55":C.border}`,borderRadius:18,padding:22,marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:`${medAdherence>=80?C.sage:medAdherence>=60?C.amber:C.rose}18`,border:`3px solid ${medAdherence>=80?C.sage:medAdherence>=60?C.amber:C.rose}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:22,fontWeight:900,color:medAdherence>=80?C.sage:medAdherence>=60?C.amber:C.rose,fontVariantNumeric:"tabular-nums"}}>{medAdherence}%</span>
                </div>
                <div>
                  <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>Today's Adherence</p>
                  <p style={{fontSize:13,color:C.muted,margin:"4px 0 0"}}>{medAdherence===100?"All medications taken ✓":medAdherence>=60?"On track — keep going":"Some medications pending"}</p>
                </div>
                <div style={{marginLeft:"auto",textAlign:"right"}}>
                  <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em"}}>Streak</p>
                  <p style={{fontSize:28,fontWeight:900,color:C.gold,letterSpacing:"-1px"}}>{streakDays}<span style={{fontSize:13,color:C.muted,fontWeight:500}}> days</span></p>
                </div>
              </div>
              <div style={{height:8,background:C.border,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${medAdherence}%`,background:`linear-gradient(90deg,${medAdherence>=80?C.sage:medAdherence>=60?C.amber:C.rose},${medAdherence>=80?C.mint:C.amber})`,borderRadius:99,transition:"width .6s ease"}}/>
              </div>
            </div>

            {/* Med list — full detail */}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {meds.map(m=>{
                const allTaken = Object.values(m.taken).every(Boolean);
                return(
                  <div key={m.id} style={{background:C.card,border:`1.5px solid ${allTaken?m.color+"44":C.border}`,borderRadius:16,padding:"18px 20px",transition:"border-color .2s"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
                      <div style={{width:46,height:46,borderRadius:12,background:`${m.color}18`,border:`1px solid ${m.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Pill size={20} color={m.color}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <p style={{fontSize:15,fontWeight:800,color:C.text,margin:0}}>{m.name}</p>
                          <span style={{fontSize:11,fontWeight:700,color:m.color,background:`${m.color}18`,padding:"2px 8px",borderRadius:99}}>{m.dose}</span>
                          {allTaken&&<span style={{fontSize:11,fontWeight:700,color:C.sage,background:`${C.sage}18`,padding:"2px 8px",borderRadius:99}}>✓ Complete</span>}
                        </div>
                        <p style={{fontSize:12,color:C.muted,margin:"4px 0 12px"}}>Scheduled: {m.times.join(" and ")}</p>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {Object.entries(m.taken).map(([slot,taken])=>(
                            <button key={slot} onClick={()=>toggleMed(m.id,slot)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:`1.5px solid ${taken?m.color:C.border}`,background:taken?`${m.color}14`:C.surface,color:taken?m.color:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                              {taken?<Check size={13}/>:<Clock size={13}/>}
                              {slot==="am"?"Morning":slot==="pm"?"Evening":"Night"}
                              {taken?" ✓":" — Pending"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adherence 7-day chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px",marginTop:18}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>7-Day Adherence History</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Percentage of daily medications taken</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[{d:"Mon",pct:100},{d:"Tue",pct:67},{d:"Wed",pct:100},{d:"Thu",pct:100},{d:"Fri",pct:83},{d:"Sat",pct:100},{d:"Sun",pct:medAdherence}]} margin={{top:4,right:6,left:-24,bottom:0}} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="d" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<VTooltip/>} formatter={v=>`${v}%`}/>
                  <ReferenceLine y={80} stroke={C.sage} strokeDasharray="3 2" strokeOpacity={.6}/>
                  <Bar dataKey="pct" name="Adherence" fill={C.sage} radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button onClick={()=>setActiveTab("home")}
        style={{position:"fixed",bottom:28,right:24,width:50,height:50,borderRadius:"50%",background:C.violet,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 20px ${C.violet}55`,zIndex:40,transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Plus size={20} color="#060709" strokeWidth={2.5}/>
      </button>

      {showCrisis && <CrisisModal onClose={()=>setShowCrisis(false)}/>}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}