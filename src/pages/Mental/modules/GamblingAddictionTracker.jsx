import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Plus, Minus, Calendar, Clock, DollarSign, TrendingDown, TrendingUp,
  AlertTriangle, Shield, Target, Award, X, Edit2, Trash2, Search,
  Download, ChevronDown, ChevronUp, Zap, Phone, BookOpen, Heart,
  Brain, CheckCircle2, Activity, RefreshCw, Sparkles, FileText,
  BarChart3, List, AlertCircle, Star, Flame, Wind
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, ReferenceLine
} from "recharts";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Deep navy-obsidian — serious, clinical, hopeful
const C = {
  bg:        "#060810",
  surface:   "#0a0d14",
  card:      "#0f1320",
  cardHi:    "#131829",
  border:    "#1c2436",
  borderHi:  "#263354",
  text:      "#dde4f0",
  muted:     "#566278",
  dim:       "#2a3448",
  // Status palette
  victory:   "#2dd4bf",   // resisted urge — teal
  victoryDim:"#0d3d38",
  warning:   "#f59e0b",   // close call — amber
  warningDim:"#3d2800",
  relapse:   "#f87171",   // relapse — red
  relapseDim:"#3d1010",
  // Recovery accents
  gold:      "#fbbf24",
  sapphire:  "#60a5fa",
  violet:    "#a78bfa",
  sage:      "#34d399",
  rose:      "#fb7185",
};

// ─── Config ─────────────────────────────────────────────────────────────────
const ENTRY_TYPES = [
  { value:"urge_resisted", label:"Urge Resisted",  Icon:Shield,        color:C.victory, dim:C.victoryDim },
  { value:"close_call",    label:"Close Call",     Icon:Zap,           color:C.warning, dim:C.warningDim },
  { value:"relapse",       label:"Relapse",        Icon:AlertTriangle, color:C.relapse, dim:C.relapseDim },
];
const getTypeConfig = v => ENTRY_TYPES.find(t => t.value === v) || ENTRY_TYPES[0];

const TRIGGERS = [
  "Boredom","Stress from work","Financial pressure","Saw betting ad",
  "Friend mentioned gambling","Payday","Passed betting shop","Online ads",
  "Loneliness","Celebration mood","Depression","Relationship issues",
  "Free time","Alcohol use","Sports event",
];
const COPING = [
  "Called accountability partner","Went for a walk","Exercise",
  "Meditation","Called helpline","Distraction technique",
  "Journaling","Prayer","Talked to family","Read recovery material",
  "Attended support group","Left the situation","Deep breathing",
  "Cold shower","5-minute rule",
];
const MOODS = ["happy","neutral","anxious","stressed","depressed","excited","bored","angry","confident","ashamed","hopeful","calm"];

const HOTLINES = [
  { name:"Gamblers Anonymous Nigeria",   number:"08012345678",  type:"local"         },
  { name:"National Gambling Helpline",   number:"0800-GAMBLER", type:"national"      },
  { name:"Crisis Helpline",              number:"112",          type:"emergency"     },
  { name:"Mentally Aware Nigeria",       number:"09010000000",  type:"mental_health" },
];

const MILESTONES = [1,3,7,14,21,30,60,90,180,365];

// ─── Helpers ────────────────────────────────────────────────────────────────
const todayStr  = () => new Date().toISOString().split("T")[0];
const nowTime   = () => { const d=new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtDate   = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en-NG",{weekday:"short",month:"short",day:"numeric"}); } catch { return s; } };
const fmtShort  = s => { try { return new Date(s+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric"}); } catch { return s; } };
const fmtMoney  = n => `₦${Number(n||0).toLocaleString()}`;
const clamp     = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const daysBetween = (a,b) => Math.floor((b-a)/(1000*60*60*24));

// ─── Seed data ───────────────────────────────────────────────────────────────
const buildSeed = () => {
  const today = new Date();
  const entries = [];
  let id = 1;
  const pattern = [
    { daysAgo:0,  type:"urge_resisted", urge:6, resist:8, money:3000,  mood:"anxious",  triggers:["Boredom","Saw betting ad"],         coping:["Called accountability partner","Deep breathing"], notes:"Resisted the urge to check betting apps. Called my partner and went for a walk instead." },
    { daysAgo:2,  type:"urge_resisted", urge:8, resist:7, money:5000,  mood:"stressed", triggers:["Stress from work","Payday"],          coping:["Exercise","Meditation"],                          notes:"Payday is always hard. Did 30 min jog and felt much better." },
    { daysAgo:4,  type:"close_call",    urge:9, resist:5, money:0,     mood:"depressed",triggers:["Loneliness","Online ads"],            coping:["Called helpline"],                                notes:"Almost opened the app. Helpline counsellor talked me through it for 20 mins." },
    { daysAgo:7,  type:"urge_resisted", urge:5, resist:9, money:8000,  mood:"confident",triggers:["Boredom"],                           coping:["Journaling","Read recovery material"],            notes:"Strong day. Journaling really helped me see my patterns clearly." },
    { daysAgo:10, type:"relapse",       urge:10,resist:0, money:0,     mood:"depressed",triggers:["Relationship issues","Alcohol use"], coping:[],                                                 amountLost:12000, amountWon:0, duration:90, notes:"Terrible night. Argument at home. Ended up on virtual games. Reset counter." },
    { daysAgo:14, type:"urge_resisted", urge:7, resist:8, money:4000,  mood:"anxious",  triggers:["Sports event","Friend mentioned gambling"],coping:["Called accountability partner","Prayer"],   notes:"Big match day. My mates were at the betting shop. I stayed home and prayed." },
    { daysAgo:17, type:"urge_resisted", urge:6, resist:9, money:6000,  mood:"calm",     triggers:["Financial pressure"],                 coping:["Distraction technique","Talked to family"],      notes:"Bills due. Thought about a quick win. Talked to my sister instead." },
    { daysAgo:20, type:"close_call",    urge:8, resist:4, money:0,     mood:"bored",    triggers:["Free time","Online ads"],             coping:["Left the situation"],                             notes:"Saw a promo popup. Got up and left the room." },
    { daysAgo:25, type:"urge_resisted", urge:4, resist:10,money:2000,  mood:"hopeful",  triggers:["Boredom"],                           coping:["Deep breathing","5-minute rule"],                 notes:"Did the 5-minute rule three times today. Each time the urge passed." },
    { daysAgo:30, type:"urge_resisted", urge:7, resist:7, money:10000, mood:"neutral",  triggers:["Payday","Passed betting shop"],       coping:["Went for a walk","Attended support group"],      notes:"Walked past the shop on payday. Kept walking. Support group tonight helped." },
  ];
  pattern.forEach(p => {
    const d = new Date(today); d.setDate(d.getDate() - p.daysAgo);
    const ds = d.toISOString().split("T")[0];
    entries.push({ id:id++, date:ds, time:"10:00", ...p, daysAgo:undefined });
  });
  return entries;
};

const BLANK = {
  date:todayStr(), time:nowTime(), type:"urge_resisted",
  urgeIntensity:5, resistanceStrength:5,
  amountLost:0, amountWon:0, duration:0,
  triggers:[], coping:[], mood:"neutral",
  notes:"", moneyNotSpent:0,
};

// ─── Stepper ─────────────────────────────────────────────────────────────────
const Stepper = ({ value, onChange, min=0, max=10, step=1, color=C.victory, label="", size="md" }) => {
  const hold = useRef(null);
  const go = dir => {
    onChange(v => clamp(+(v+dir*step).toFixed(1), min, max));
    hold.current = setTimeout(() => {
      hold.current = setInterval(() => onChange(v => clamp(+(v+dir*step).toFixed(1), min, max)), 75);
    }, 360);
  };
  const stop = () => { clearTimeout(hold.current); clearInterval(hold.current); };
  useEffect(() => () => stop(), []);
  const h = size==="sm"?38:50;
  return (
    <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden",width:"100%"}}>
      <button onMouseDown={()=>go(-1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(-1)} onTouchEnd={stop}
        disabled={value<=min} style={{width:h,height:h,background:"none",border:"none",color:value<=min?C.dim:color,cursor:value<=min?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Minus size={size==="sm"?12:15}/>
      </button>
      <div style={{flex:1,textAlign:"center"}}>
        <span style={{fontSize:size==="sm"?17:26,fontWeight:800,color:C.text,fontVariantNumeric:"tabular-nums",letterSpacing:"-1px"}}>
          {Number.isInteger(value)?value:value.toFixed(1)}
        </span>
        {label&&<span style={{fontSize:11,color:C.muted,marginLeft:3}}>{label}</span>}
      </div>
      <button onMouseDown={()=>go(1)} onMouseUp={stop} onMouseLeave={stop} onTouchStart={()=>go(1)} onTouchEnd={stop}
        disabled={value>=max} style={{width:h,height:h,background:"none",border:"none",color:value>=max?C.dim:color,cursor:value>=max?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Plus size={size==="sm"?12:15}/>
      </button>
    </div>
  );
};

// ─── Streak ring ─────────────────────────────────────────────────────────────
const StreakRing = ({ days, size=120 }) => {
  const max = 30, pct = Math.min(days/max,1);
  const r=48, cx=60, cy=60;
  const toRad = a => (a*Math.PI)/180;
  const start = -90, sweep = 360*pct;
  const end = start+sweep;
  const pt = a => ({ x: cx+r*Math.cos(toRad(a)), y: cy+r*Math.sin(toRad(a)) });
  const s = pt(start), e = pt(end), large = sweep>180?1:0;
  const col = days>=30?C.gold:days>=7?C.victory:days>=1?C.sapphire:C.muted;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={10}/>
      {pct>0&&<path d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`} fill="none" stroke={col} strokeWidth={10} strokeLinecap="round" style={{filter:`drop-shadow(0 0 8px ${col}88)`}}/>}
      <text x={cx} y={cy-8} textAnchor="middle" style={{fontSize:24,fontWeight:900,fill:col,fontFamily:"inherit",letterSpacing:"-1px"}}>{days}</text>
      <text x={cx} y={cy+10} textAnchor="middle" style={{fontSize:9,fill:C.muted,fontFamily:"inherit",textTransform:"uppercase",letterSpacing:".06em"}}>days</text>
      <text x={cx} y={cy+22} textAnchor="middle" style={{fontSize:8,fill:C.dim,fontFamily:"inherit"}}>clean</text>
    </svg>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t=setTimeout(onDone,2800); return ()=>clearTimeout(t); }, []);
  const col = type==="success"?C.victory:type==="error"?C.relapse:C.warning;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:C.cardHi,border:`1px solid ${col}`,borderRadius:12,padding:"12px 18px",color:C.text,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8,boxShadow:`0 4px 24px #0009`,animation:"slideUp .2s ease",maxWidth:320}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:col}}/>
      {msg}
    </div>
  );
};

// ─── Confirm dialog ───────────────────────────────────────────────────────────
const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{position:"fixed",inset:0,background:"#000c",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:16,padding:26,maxWidth:380,width:"100%"}}>
      <p style={{color:C.text,fontSize:14,lineHeight:1.75,marginBottom:22}}>{msg}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"8px 18px",borderRadius:8,background:C.border,border:"none",color:C.text,fontSize:13,cursor:"pointer"}}>Cancel</button>
        <button onClick={onOk} style={{padding:"8px 18px",borderRadius:8,background:C.relapse,border:"none",color:"#060810",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <Trash2 size={13}/>Delete
        </button>
      </div>
    </div>
  </div>
);

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
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
const AIInsights = ({ entries }) => {
  const [text,    setText]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setError(null); setOpen(true); setText(null);
    const sample = entries.slice(0,14).map(e =>
      `${e.date}: type=${e.type} urge=${e.urgeIntensity||0}/10 resistance=${e.resistanceStrength||0}/10 mood=${e.mood} triggers=[${(e.triggers||[]).join(",")||"none"}] coping=[${(e.coping||e.copingStrategies||[]).join(",")||"none"}] lost=${e.amountLost||0} saved=${e.moneyNotSpent||0}`
    ).join("\n");

    const prompt = `You are a compassionate addiction recovery coach specialising in gambling disorder. Analyse this person's recovery tracking data with warmth and evidence-based insight. Respond in exactly 4 paragraphs (2-3 sentences each):
1) Pattern analysis — urge patterns, timing, recovery progress trends
2) Key risk factors identified — triggers, high-risk situations, warning signs
3) Strengths and what's working well — effective coping strategies, resilience moments
4) Specific, actionable next steps for the coming week to strengthen recovery

Be warm, non-judgmental, and hopeful. Acknowledge the courage it takes to track this data. Do NOT shame or judge relapses — frame them as learning opportunities. Always recommend professional support for clinical needs.

RECOVERY DATA (last 14 entries):
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
  },[entries]);

  const ICONS  = [TrendingUp, AlertCircle, Heart, Sparkles];
  const COLORS = [C.victory, C.warning, C.sapphire, C.violet];

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <button onClick={open?()=>setOpen(false):run}
        style={{width:"100%",padding:"18px 22px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${C.violet}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Brain size={19} color={C.violet}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>AI Recovery Coach Insights</p>
          <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Pattern analysis across {entries.length} tracked entr{entries.length===1?"y":"ies"}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!open&&<span style={{fontSize:11,fontWeight:700,color:C.violet,background:`${C.violet}18`,padding:"4px 12px",borderRadius:99}}>Analyse</span>}
          {open?<ChevronUp size={16} color={C.muted}/>:<ChevronDown size={16} color={C.muted}/>}
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 22px 22px",borderTop:`1px solid ${C.border}`}}>
          {loading&&(
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"22px 0"}}>
              <div style={{width:18,height:18,border:`2px solid ${C.violet}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
              <span style={{fontSize:13,color:C.muted}}>Reviewing your recovery journey…</span>
            </div>
          )}
          {error&&(
            <div style={{display:"flex",alignItems:"center",gap:10,padding:14,background:`${C.relapse}15`,borderRadius:10,marginTop:14}}>
              <AlertCircle size={15} color={C.relapse}/>
              <p style={{fontSize:13,color:C.relapse,margin:0,flex:1}}>{error}</p>
              <button onClick={run} style={{background:`${C.violet}22`,border:"none",color:C.violet,fontSize:12,padding:"5px 10px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><RefreshCw size={11}/>Retry</button>
            </div>
          )}
          {text&&!loading&&(
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:12}}>
              {text.split("\n\n").filter(Boolean).map((para,i)=>{
                const Icon=ICONS[i]||Brain, col=COLORS[i]||C.muted;
                return (
                  <div key={i} style={{display:"flex",gap:12,padding:"14px 16px",background:`${col}0a`,borderRadius:10,borderLeft:`2px solid ${col}`}}>
                    <Icon size={14} color={col} style={{flexShrink:0,marginTop:3}}/>
                    <p style={{fontSize:13,color:i===0?C.text:C.muted,lineHeight:1.8,margin:0}}>{para}</p>
                  </div>
                );
              })}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <p style={{fontSize:11,color:C.muted,fontStyle:"italic",margin:0}}>These insights support—not replace—professional addiction counselling.</p>
                <button onClick={run} style={{background:`${C.violet}15`,border:`1px solid ${C.violet}44`,color:C.violet,fontSize:12,fontWeight:600,padding:"7px 14px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><RefreshCw size={12}/>Re-analyse</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Entry Log Modal ──────────────────────────────────────────────────────────
const EntryModal = ({ initial, daysClean, onSave, onClose }) => {
  const [fd, setFd] = useState(initial||{...BLANK});
  const set = (k,v) => setFd(p=>({...p,[k]:v}));
  const toggleArr = (k,v) => set(k, fd[k].includes(v)?fd[k].filter(x=>x!==v):[...fd[k],v]);

  const tc = getTypeConfig(fd.type);
  const inp = {width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5};
  const copingKey = "coping";

  return (
    <div style={{position:"fixed",inset:0,background:"#000d",zIndex:8000,overflowY:"auto",padding:"20px 16px",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
      <div style={{background:C.card,border:`1px solid ${C.borderHi}`,borderRadius:20,width:"100%",maxWidth:600,padding:28}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:tc.dim,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <tc.Icon size={20} color={tc.color}/>
            </div>
            <div>
              <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>{initial?"Edit Entry":"Log Recovery Entry"}</p>
              <p style={{fontSize:12,color:C.muted,margin:"3px 0 0"}}>Every entry helps your recovery</p>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {/* Entry type */}
          <div>
            <label style={lbl}>Entry Type</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {ENTRY_TYPES.map(t=>(
                <button key={t.value} onClick={()=>set("type",t.value)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",borderRadius:12,cursor:"pointer",background:fd.type===t.value?t.dim:C.surface,border:`1.5px solid ${fd.type===t.value?t.color:C.border}`,color:fd.type===t.value?t.color:C.muted,transition:"all .13s",fontSize:12,fontWeight:700}}>
                  <t.Icon size={18}/>{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urge + Resistance steppers */}
          {fd.type!=="relapse"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <label style={lbl}>Urge Intensity (1–10)</label>
                <Stepper value={fd.urgeIntensity} onChange={fn=>set("urgeIntensity",typeof fn==="function"?fn(fd.urgeIntensity):fn)} min={1} max={10} color={C.relapse}/>
              </div>
              <div>
                <label style={lbl}>Resistance Strength (1–10)</label>
                <Stepper value={fd.resistanceStrength} onChange={fn=>set("resistanceStrength",typeof fn==="function"?fn(fd.resistanceStrength):fn)} min={1} max={10} color={C.victory}/>
              </div>
            </div>
          )}

          {/* Money not spent */}
          {fd.type!=="relapse"&&(
            <div>
              <label style={lbl}>Money Not Spent (₦)</label>
              <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                <button onClick={()=>set("moneyNotSpent",Math.max(0,(fd.moneyNotSpent||0)-500))} style={{width:46,height:46,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>−</button>
                <input type="number" value={fd.moneyNotSpent||0} onChange={e=>set("moneyNotSpent",parseInt(e.target.value)||0)} style={{flex:1,background:"none",border:"none",color:C.text,fontSize:16,fontWeight:700,textAlign:"center",outline:"none"}}/>
                <button onClick={()=>set("moneyNotSpent",(fd.moneyNotSpent||0)+500)} style={{width:46,height:46,background:"none",border:"none",color:C.victory,cursor:"pointer",fontSize:18}}>+</button>
              </div>
              <div style={{display:"flex",gap:6,marginTop:7,flexWrap:"wrap"}}>
                {[1000,2000,5000,10000,20000].map(v=>(
                  <button key={v} onClick={()=>set("moneyNotSpent",v)} style={{padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",background:fd.moneyNotSpent===v?`${C.victory}18`:C.surface,border:`1px solid ${fd.moneyNotSpent===v?C.victory:C.border}`,color:fd.moneyNotSpent===v?C.victory:C.muted}}>₦{(v/1000)}k</button>
                ))}
              </div>
            </div>
          )}

          {/* Relapse fields */}
          {fd.type==="relapse"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[{k:"amountLost",l:"Amount Lost (₦)",col:C.relapse},{k:"amountWon",l:"Amount Won (₦)",col:C.victory},{k:"duration",l:"Duration (mins)",col:C.warning}].map(({k,l,col})=>(
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  <div style={{display:"flex",alignItems:"center",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                    <button onClick={()=>set(k,Math.max(0,(fd[k]||0)-(k==="duration"?5:1000)))} style={{width:36,height:40,background:"none",border:"none",color:C.muted,cursor:"pointer"}}>−</button>
                    <input type="number" value={fd[k]||0} onChange={e=>set(k,parseInt(e.target.value)||0)} style={{flex:1,background:"none",border:"none",color:col,fontSize:14,fontWeight:700,textAlign:"center",outline:"none"}}/>
                    <button onClick={()=>set(k,(fd[k]||0)+(k==="duration"?5:1000))} style={{width:36,height:40,background:"none",border:"none",color:col,cursor:"pointer"}}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Triggers */}
          <div>
            <label style={lbl}>What Triggered This?</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {TRIGGERS.map(t=>{
                const on=fd.triggers.includes(t);
                return <button key={t} onClick={()=>toggleArr("triggers",t)} style={{padding:"5px 11px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:on?`${C.relapse}18`:C.surface,border:`1px solid ${on?C.relapse:C.border}`,color:on?C.relapse:C.muted,transition:"all .12s"}}>{t}</button>;
              })}
            </div>
          </div>

          {/* Coping */}
          {fd.type!=="relapse"&&(
            <div>
              <label style={lbl}>How Did You Cope?</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {COPING.map(s=>{
                  const on=fd[copingKey].includes(s);
                  return <button key={s} onClick={()=>toggleArr(copingKey,s)} style={{padding:"5px 11px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",background:on?`${C.victory}18`:C.surface,border:`1px solid ${on?C.victory:C.border}`,color:on?C.victory:C.muted,transition:"all .12s"}}>{s}</button>;
                })}
              </div>
            </div>
          )}

          {/* Mood + Date/Time */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <label style={lbl}>Mood</label>
              <select style={{...inp,cursor:"pointer",textTransform:"capitalize"}} value={fd.mood} onChange={e=>set("mood",e.target.value)}>
                {MOODS.map(m=><option key={m} value={m} style={{textTransform:"capitalize"}}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={fd.date} onChange={e=>set("date",e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Time</label>
              <input type="time" style={inp} value={fd.time} onChange={e=>set("time",e.target.value)}/>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{...inp,resize:"vertical",minHeight:80,lineHeight:1.7}} placeholder="What happened? How did you feel? What helped?" value={fd.notes} onChange={e=>set("notes",e.target.value)}/>
          </div>

          <div style={{display:"flex",gap:10,paddingTop:4}}>
            <button onClick={()=>onSave(fd)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"13px",borderRadius:10,background:tc.color,border:"none",color:"#060810",fontSize:14,fontWeight:800,cursor:"pointer"}}>
              <CheckCircle2 size={15}/>{initial?"Update Entry":"Save Entry"}
            </button>
            <button onClick={onClose} style={{padding:"13px 20px",borderRadius:10,background:"none",border:`1px solid ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>Discard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Emergency Help Modal ─────────────────────────────────────────────────────
const EmergencyModal = ({ onClose }) => (
  <div style={{position:"fixed",inset:0,background:"#000d",zIndex:9500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:C.card,border:`2px solid ${C.relapse}`,borderRadius:20,width:"100%",maxWidth:480,padding:28}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Phone size={20} color={C.relapse}/>
          <p style={{fontSize:18,fontWeight:800,color:C.text,margin:0}}>Emergency Support</p>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><X size={18}/></button>
      </div>
      <div style={{padding:"12px 14px",background:`${C.relapse}12`,border:`1px solid ${C.relapse}44`,borderRadius:10,marginBottom:16}}>
        <p style={{fontSize:13,color:C.relapse,fontWeight:600,margin:0}}>If you're in crisis right now — help is available. You are not alone.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {HOTLINES.map((h,i)=>(
          <a key={i} href={`tel:${h.number}`} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,textDecoration:"none",transition:"border-color .15s"}}>
            <div style={{width:36,height:36,borderRadius:9,background:`${C.victory}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Phone size={16} color={C.victory}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>{h.name}</p>
              <p style={{fontSize:11,color:C.muted,margin:"2px 0 0",textTransform:"capitalize"}}>{h.type.replace("_"," ")}</p>
            </div>
            <p style={{fontSize:15,fontWeight:800,color:C.victory,margin:0,fontVariantNumeric:"tabular-nums"}}>{h.number}</p>
          </a>
        ))}
      </div>
      <p style={{fontSize:11,color:C.muted,textAlign:"center",marginTop:16}}>Recovery is possible. Every moment you reach out instead of gambling is a victory.</p>
    </div>
  </div>
);

// ─── Entry Card ───────────────────────────────────────────────────────────────
const EntryCard = ({ entry, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const tc = getTypeConfig(entry.type);
  const coping = entry.coping||entry.copingStrategies||[];
  const triggers = entry.triggers||[];
  return (
    <div style={{background:C.card,border:`1px solid ${expanded?C.borderHi:C.border}`,borderRadius:16,overflow:"hidden",transition:"border-color .15s",borderLeft:`3px solid ${tc.color}`}}>
      <div onClick={()=>setExpanded(e=>!e)} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"16px 18px",cursor:"pointer"}}>
        <div style={{width:44,height:44,borderRadius:12,background:tc.dim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <tc.Icon size={20} color={tc.color}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:5}}>
            <span style={{fontSize:14,fontWeight:800,color:tc.color}}>{tc.label}</span>
            <span style={{fontSize:11,color:C.muted}}>· {fmtDate(entry.date)} {entry.time}</span>
            <span style={{fontSize:11,color:C.muted,textTransform:"capitalize"}}>· {entry.mood}</span>
            {entry.daysClean>0&&<span style={{fontSize:11,fontWeight:700,color:C.gold,background:`${C.gold}15`,padding:"2px 8px",borderRadius:99,display:"flex",alignItems:"center",gap:3}}><Award size={10}/>{entry.daysClean}d clean</span>}
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:entry.notes?6:0}}>
            {entry.urgeIntensity>0&&<span style={{fontSize:12,color:C.muted}}>Urge: <b style={{color:C.relapse}}>{entry.urgeIntensity}/10</b></span>}
            {entry.resistanceStrength>0&&<span style={{fontSize:12,color:C.muted}}>Resist: <b style={{color:C.victory}}>{entry.resistanceStrength}/10</b></span>}
            {entry.moneyNotSpent>0&&<span style={{fontSize:12,color:C.muted}}>Saved: <b style={{color:C.sage}}>{fmtMoney(entry.moneyNotSpent)}</b></span>}
            {entry.amountLost>0&&<span style={{fontSize:12,color:C.muted}}>Lost: <b style={{color:C.relapse}}>{fmtMoney(entry.amountLost)}</b></span>}
          </div>
          {entry.notes&&!expanded&&<p style={{fontSize:12,color:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:400,fontStyle:"italic"}}>"{entry.notes}"</p>}
        </div>
        <div style={{display:"flex",gap:4,flexShrink:0}}>
          <button onClick={e=>{e.stopPropagation();onEdit();}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:"5px",borderRadius:6}}><Edit2 size={14}/></button>
          <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",cursor:"pointer",color:C.relapse,padding:"5px",borderRadius:6}}><Trash2 size={14}/></button>
          <div style={{padding:"5px",color:C.dim,display:"flex",alignItems:"center"}}>{expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
        </div>
      </div>
      {expanded&&(
        <div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:14}}>
            {triggers.length>0&&(
              <div>
                <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Triggers</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {triggers.map(t=><span key={t} style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:`${C.relapse}15`,color:C.relapse,fontWeight:600}}>{t}</span>)}
                </div>
              </div>
            )}
            {coping.length>0&&(
              <div>
                <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Coping Used</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {coping.map(s=><span key={s} style={{fontSize:11,padding:"3px 9px",borderRadius:99,background:`${C.victory}15`,color:C.victory,fontWeight:600}}>{s}</span>)}
                </div>
              </div>
            )}
            {entry.type==="relapse"&&(
              <div>
                <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:7}}>Relapse Details</p>
                <p style={{fontSize:12,color:C.muted}}>Lost: <b style={{color:C.relapse}}>{fmtMoney(entry.amountLost)}</b> · Won: <b style={{color:C.victory}}>{fmtMoney(entry.amountWon)}</b> · Duration: <b style={{color:C.warning}}>{entry.duration}min</b></p>
              </div>
            )}
          </div>
          {entry.notes&&(
            <div style={{marginTop:14,padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
              <p style={{fontSize:10,fontWeight:700,color:C.dim,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5}}>Notes</p>
              <p style={{fontSize:13,color:C.muted,lineHeight:1.75,margin:0}}>{entry.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function GamblingAddictionTracker() {
  const nextId = useRef(null);

  const [entries, setEntries] = useState(() => {
    try {
      const s=localStorage.getItem("gat2_entries");
      const p=s?JSON.parse(s):null;
      if (Array.isArray(p)&&p.length) { nextId.current=Math.max(...p.map(e=>e.id))+1; return p; }
    } catch {}
    const seed=buildSeed(); nextId.current=seed.length+1; return seed;
  });
  useEffect(()=>{ try { localStorage.setItem("gat2_entries",JSON.stringify(entries)); } catch {} },[entries]);

  const [tab,         setTab]         = useState("overview");
  const [search,      setSearch]      = useState("");
  const [period,      setPeriod]      = useState("all");
  const [showModal,   setShowModal]   = useState(false);
  const [editEntry,   setEditEntry]   = useState(null);
  const [showEmerg,   setShowEmerg]   = useState(false);
  const [confirm,     setConfirm]     = useState(null);
  const [toast,       setToast]       = useState(null);

  const push = (msg,type="success") => setToast({msg,type});

  // ── Derived ─────────────────────────────────────────────────────────────
  const daysClean = useMemo(() => {
    const sorted = [...entries].sort((a,b)=>new Date(`${b.date} ${b.time}`)-new Date(`${a.date} ${a.time}`));
    const lastR = sorted.find(e=>e.type==="relapse");
    if (!lastR) {
      const first = sorted[sorted.length-1];
      return first ? daysBetween(new Date(first.date),new Date()) : 0;
    }
    return daysBetween(new Date(lastR.date),new Date());
  }, [entries]);

  const filtered = useMemo(() => {
    const now = new Date();
    return entries
      .filter(e => {
        if (period==="week")  return new Date(e.date)>=new Date(now.getTime()-7*864e5);
        if (period==="month") return new Date(e.date)>=new Date(now.getTime()-30*864e5);
        return true;
      })
      .filter(e => {
        if (!search) return true;
        const q=search.toLowerCase();
        return e.notes?.toLowerCase().includes(q)||(e.triggers||[]).some(t=>t.toLowerCase().includes(q))||(e.coping||e.copingStrategies||[]).some(c=>c.toLowerCase().includes(q));
      })
      .sort((a,b)=>new Date(`${b.date} ${b.time}`)-new Date(`${a.date} ${a.time}`));
  }, [entries, search, period]);

  const stats = useMemo(() => {
    const resisted  = filtered.filter(e=>e.type==="urge_resisted").length;
    const relapses  = filtered.filter(e=>e.type==="relapse").length;
    const closeCalls= filtered.filter(e=>e.type==="close_call").length;
    const moneySaved= filtered.reduce((s,e)=>s+(e.moneyNotSpent||0),0);
    const moneyLost = filtered.reduce((s,e)=>s+(e.amountLost||0),0);
    const withUrge  = filtered.filter(e=>e.urgeIntensity);
    const avgUrge   = withUrge.length ? +(withUrge.reduce((s,e)=>s+e.urgeIntensity,0)/withUrge.length).toFixed(1) : 0;
    const rate      = resisted+relapses>0 ? +((resisted/(resisted+relapses))*100).toFixed(1) : 100;
    return { resisted, relapses, closeCalls, moneySaved, moneyLost, avgUrge, rate, netSavings:moneySaved-moneyLost };
  }, [filtered]);

  // Chart data
  const chartData = useMemo(() =>
    [...filtered].reverse().slice(-14).map(e=>({
      date:fmtShort(e.date),
      urge:e.urgeIntensity||0,
      resist:e.resistanceStrength||0,
      type:e.type,
    })), [filtered]);

  const moneyData = useMemo(() =>
    [...filtered].reverse().filter(e=>e.moneyNotSpent||e.amountLost).slice(-12).map(e=>({
      date:fmtShort(e.date),
      saved:e.moneyNotSpent||0,
      lost:e.amountLost||0,
    })), [filtered]);

  const triggerFreq = useMemo(() => {
    const c={};
    filtered.forEach(e=>(e.triggers||[]).forEach(t=>{c[t]=(c[t]||0)+1;}));
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8);
  }, [filtered]);

  const copingFreq = useMemo(() => {
    const c={};
    filtered.filter(e=>e.type!=="relapse").forEach(e=>{
      (e.coping||e.copingStrategies||[]).forEach(s=>{c[s]=(c[s]||0)+1;});
    });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,6);
  }, [filtered]);

  const nextMilestone = MILESTONES.find(m=>m>daysClean)||365;
  const milestoneProgress = Math.round((daysClean/nextMilestone)*100);

  // ── Handlers ────────────────────────────────────────────────────────────
  const saveEntry = useCallback(fd => {
    const coping = fd.coping||fd.copingStrategies||[];
    const payload = { ...fd, coping, copingStrategies:coping, daysClean:fd.type==="relapse"?0:daysClean };
    if (editEntry) {
      setEntries(prev=>prev.map(e=>e.id===editEntry.id?{...payload,id:editEntry.id}:e));
      push("Entry updated");
    } else {
      setEntries(prev=>[{...payload,id:nextId.current++},...prev]);
      push(fd.type==="urge_resisted"?"🛡 Urge resisted! Logged.":fd.type==="close_call"?"⚡ Close call logged.":"Entry saved");
    }
    setShowModal(false); setEditEntry(null);
  }, [editEntry, daysClean]);

  const delEntry = useCallback((id,date) => {
    setConfirm({msg:`Delete the entry from ${fmtDate(date)}?`,onOk:()=>{
      setEntries(prev=>prev.filter(e=>e.id!==id));
      setConfirm(null); push("Entry deleted","error");
    }});
  }, []);

  const exportJSON = () => {
    const blob=new Blob([JSON.stringify(entries,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`recovery-data-${todayStr()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Data exported");
  };

  const downloadReport = () => {
    const sep="─".repeat(60);
    const lines=[
      "GAMBLING RECOVERY TRACKER — PROGRESS REPORT",sep,
      `Generated: ${new Date().toLocaleString()}`,
      `Days Clean: ${daysClean} | Resistance Rate: ${stats.rate}%`,
      `Urges Resisted: ${stats.resisted} | Relapses: ${stats.relapses}`,
      `Money Saved: ${fmtMoney(stats.moneySaved)} | Net: ${fmtMoney(stats.netSavings)}`,
      "",sep,"TOP TRIGGERS",sep,
      ...triggerFreq.map(([t,c])=>`  ${t}: ${c}×`),
      "",sep,"MOST EFFECTIVE COPING",sep,
      ...copingFreq.map(([s,c])=>`  ${s}: ${c}×`),
      "",sep,"ENTRIES",sep,
      ...filtered.map(e=>[
        `\n${fmtDate(e.date)} ${e.time}  [${e.type.replace("_"," ").toUpperCase()}]  mood: ${e.mood}`,
        e.urgeIntensity?`  Urge: ${e.urgeIntensity}/10  Resistance: ${(e.resistanceStrength||0)}/10`:"",
        e.moneyNotSpent?`  Saved: ${fmtMoney(e.moneyNotSpent)}`:"",
        e.amountLost?`  Lost: ${fmtMoney(e.amountLost)}`:"",
        (e.triggers||[]).length?`  Triggers: ${(e.triggers||[]).join(", ")}`:"",
        e.notes?`  Notes: ${e.notes}`:"",
      ].filter(Boolean).join("\n"))
    ];
    const blob=new Blob([lines.join("\n")],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`recovery-report-${todayStr()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    push("Report downloaded");
  };

  const TABS = [
    {k:"overview", label:"Overview", icon:Activity},
    {k:"trends",   label:"Trends",   icon:BarChart3},
    {k:"journal",  label:"Journal",  icon:List},
    {k:"insights", label:"AI Insights",icon:Brain},
  ];

  const fmtBtn = (active=false, col=C.victory) => ({
    display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,
    fontSize:12,fontWeight:700,cursor:"pointer",
    background:active?col:"none",border:active?"none":`1px solid ${C.border}`,
    color:active?"#060810":C.muted,transition:"all .15s",
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
        .cardHov:hover{border-color:${C.borderHi}!important;}
      `}</style>

      {/* ── Nav ── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:0}}>
        <div style={{maxWidth:940,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{padding:"13px 0",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${C.victory}18`,border:`1px solid ${C.victory}44`,display:"flex",alignItems:"center",justifyContent:"center"}}><Shield size={17} color={C.victory}/></div>
            <div>
              <p style={{fontSize:14,fontWeight:800,color:C.text,letterSpacing:"-0.4px",lineHeight:1}}>RecoveryTrack</p>
              <p style={{fontSize:9,color:C.muted,letterSpacing:".06em"}}>GAMBLING RECOVERY</p>
            </div>
          </div>
          <div style={{display:"flex",gap:2,flex:1,overflowX:"auto"}}>
            {TABS.map(({k,label,icon:Icon})=>(
              <button key={k} className="tabBtn" onClick={()=>setTab(k)} style={{display:"flex",alignItems:"center",gap:6,padding:"13px 14px",background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===k?C.victory:C.muted,borderBottom:`2px solid ${tab===k?C.victory:"transparent"}`,transition:"all .18s",whiteSpace:"nowrap"}}>
                <Icon size={13}/>{label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={downloadReport} style={fmtBtn()}><FileText size={13}/></button>
            <button onClick={exportJSON} style={fmtBtn()}><Download size={13}/></button>
            <button onClick={()=>setShowEmerg(true)} style={{...fmtBtn(false),color:C.relapse,borderColor:`${C.relapse}44`,background:`${C.relapse}0c`}}><Phone size={13}/>SOS</button>
            <button onClick={()=>{setEditEntry(null);setShowModal(true);}} style={fmtBtn(true,C.victory)}><Plus size={14}/>Log Entry</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{maxWidth:940,margin:"0 auto",padding:"24px 16px 80px"}}>

        {/* KPI strip — always visible */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:22}}>
          {/* Streak ring card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"16px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,gridRow:"1/3"}}>
            <StreakRing days={daysClean}/>
            <p style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",textAlign:"center"}}>Next: {nextMilestone}d</p>
            <div style={{width:"100%",height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${milestoneProgress}%`,background:C.gold,borderRadius:99,transition:"width .6s ease"}}/>
            </div>
          </div>
          {[
            {label:"Resistance Rate", value:`${stats.rate}%`,    sub:`${stats.resisted} urges beaten`, color:C.victory, Icon:Shield},
            {label:"Money Saved",     value:fmtMoney(stats.moneySaved), sub:"by not gambling",         color:C.sage,    Icon:DollarSign},
            {label:"Net Savings",     value:fmtMoney(Math.abs(stats.netSavings)), sub:stats.netSavings>=0?"ahead":"lost in relapses", color:stats.netSavings>=0?C.sage:C.relapse, Icon:stats.netSavings>=0?TrendingUp:TrendingDown},
            {label:"Avg Urge",        value:`${stats.avgUrge}/10`, sub:"urge intensity",                color:C.warning, Icon:Flame},
            {label:"Relapses",        value:stats.relapses,       sub:`${stats.closeCalls} close calls`,color:stats.relapses===0?C.victory:C.relapse, Icon:AlertTriangle},
          ].map(({label,value,sub,color,Icon})=>(
            <div key={label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",right:10,top:10,opacity:.07}}><Icon size={36}/></div>
              <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{label}</p>
              <p style={{fontSize:22,fontWeight:800,color,letterSpacing:"-0.5px",margin:0}}>{value}</p>
              <p style={{fontSize:10,color:C.dim,marginTop:4}}>{sub}</p>
            </div>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab==="overview"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>
            {/* Mini urge/resistance chart */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Urge vs Resistance — 14 entries</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:14}}>Higher resistance than urge = stronger recovery</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{top:4,right:6,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <ReferenceLine y={5} stroke={C.dim} strokeDasharray="4 3"/>
                  <Line type="monotone" dataKey="urge"   name="Urge"       stroke={C.relapse} strokeWidth={2} dot={{fill:C.relapse,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="resist" name="Resistance" stroke={C.victory} strokeWidth={2.5} dot={{fill:C.victory,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top triggers + top coping */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={14} color={C.warning}/>Top Triggers</p>
                {triggerFreq.length===0?<p style={{color:C.muted,fontSize:13}}>No triggers logged yet.</p>:
                  triggerFreq.map(([t,c])=>(
                    <div key={t} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.muted}}>{t}</span>
                        <span style={{fontSize:12,fontWeight:700,color:C.warning}}>{c}×</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(c/filtered.length)*100}%`,background:C.warning,borderRadius:99}}/>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
                <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={14} color={C.victory}/>Effective Coping</p>
                {copingFreq.length===0?<p style={{color:C.muted,fontSize:13}}>No coping strategies logged yet.</p>:
                  copingFreq.map(([s,c])=>(
                    <div key={s} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,color:C.muted}}>{s}</span>
                        <span style={{fontSize:12,fontWeight:700,color:C.victory}}>{c}×</span>
                      </div>
                      <div style={{height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min((c/stats.resisted)*100,100)}%`,background:C.victory,borderRadius:99}}/>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Milestones */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><Star size={14} color={C.gold}/>Recovery Milestones</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {MILESTONES.map(m=>{
                  const achieved=daysClean>=m;
                  return (
                    <div key={m} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 14px",borderRadius:10,background:achieved?`${C.gold}18`:C.surface,border:`1px solid ${achieved?C.gold:C.border}`,transition:"all .2s",minWidth:56}}>
                      <span style={{fontSize:20}}>{achieved?"🏆":"🔒"}</span>
                      <span style={{fontSize:11,fontWeight:700,color:achieved?C.gold:C.dim}}>{m}d</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRENDS ═══ */}
        {tab==="trends"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Urge vs Resistance Trend</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>Goal: resistance consistently above urge intensity</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{top:6,right:6,left:-24,bottom:0}}>
                  <defs>
                    <linearGradient id="urgeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.relapse} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.relapse} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.victory} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={C.victory} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false} domain={[0,10]}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:C.muted}}/>
                  <Area type="monotone" dataKey="urge"   name="Urge"       stroke={C.relapse} strokeWidth={2} fill="url(#urgeGrad)" dot={{fill:C.relapse,r:3,strokeWidth:0}}/>
                  <Area type="monotone" dataKey="resist" name="Resistance" stroke={C.victory} strokeWidth={2} fill="url(#resGrad)"  dot={{fill:C.victory,r:3,strokeWidth:0}}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 16px 12px"}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Financial Impact</p>
              <p style={{fontSize:11,color:C.muted,marginBottom:16}}>₦ saved by resisting vs ₦ lost in relapses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moneyData} margin={{top:4,right:6,left:-20,bottom:0}} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{fill:C.muted,fontSize:10}} stroke={C.border} tickLine={false}/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} stroke={C.border} tickLine={false} tickFormatter={v=>v>=1000?`₦${v/1000}k`:`₦${v}`}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Legend wrapperStyle={{fontSize:11,color:C.muted}}/>
                  <Bar dataKey="saved" name="Saved (₦)" fill={C.victory} radius={[3,3,0,0]}/>
                  <Bar dataKey="lost"  name="Lost (₦)"  fill={C.relapse} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ JOURNAL ═══ */}
        {tab==="journal"&&(
          <div style={{animation:"fadeIn .3s ease"}}>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:200}}>
                <Search size={14} color={C.muted} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}/>
                <input style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 12px 9px 32px",color:C.text,fontSize:13,outline:"none"}} placeholder="Search entries…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div style={{display:"flex",gap:6}}>
                {[["all","All Time"],["week","7 Days"],["month","30 Days"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setPeriod(k)} style={{padding:"8px 14px",borderRadius:99,fontSize:12,fontWeight:700,cursor:"pointer",border:`1.5px solid ${period===k?C.victory:C.border}`,background:period===k?`${C.victory}14`:C.card,color:period===k?C.victory:C.muted}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtered.length===0?(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"52px 24px",textAlign:"center"}}>
                  <Shield size={44} color={C.dim} style={{marginBottom:14}}/>
                  <p style={{color:C.muted,fontSize:14}}>{search?"No entries match your search.":"No entries yet — start tracking your recovery."}</p>
                  {!search&&<button onClick={()=>{setEditEntry(null);setShowModal(true);}} style={{marginTop:18,padding:"10px 24px",borderRadius:10,background:C.victory,border:"none",color:"#060810",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ Log First Entry</button>}
                </div>
              ):filtered.map(e=>(
                <EntryCard key={e.id} entry={e} onEdit={()=>{setEditEntry(e);setShowModal(true);}} onDelete={()=>delEntry(e.id,e.date)}/>
              ))}
            </div>
          </div>
        )}

        {/* ═══ AI INSIGHTS ═══ */}
        {tab==="insights"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn .3s ease"}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <p style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Recovery Summary</p>
              <p style={{fontSize:12,color:C.muted,marginBottom:16}}>Key metrics feeding the AI analysis</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
                {[
                  {l:"Days Clean",        v:daysClean,          c:C.gold},
                  {l:"Resistance Rate",   v:`${stats.rate}%`,   c:C.victory},
                  {l:"Urges Resisted",    v:stats.resisted,     c:C.sapphire},
                  {l:"Net Saved",         v:fmtMoney(stats.netSavings), c:stats.netSavings>=0?C.sage:C.relapse},
                ].map(({l,v,c})=>(
                  <div key={l} style={{background:C.cardHi,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px"}}>
                    <p style={{fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5}}>{l}</p>
                    <p style={{fontSize:20,fontWeight:800,color:c,margin:0,letterSpacing:"-0.5px"}}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <AIInsights entries={entries}/>
            {/* Resources */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:36,height:36,borderRadius:10,background:`${C.sapphire}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><BookOpen size={16} color={C.sapphire}/></div>
                <p style={{fontSize:14,fontWeight:700,color:C.text}}>Recovery Resources & Affirmations</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[
                  "Every day clean is a victory worth celebrating.",
                  "A relapse is not the end — it's information for your recovery.",
                  "The urge will pass. It always does. Wait it out.",
                  "You are more than your addiction. Your recovery defines you.",
                  "Each time you resist, you rewire your brain for strength.",
                  "Reach out before you act — that call could change everything.",
                ].map((q,i)=>(
                  <div key={i} style={{padding:"12px 14px",background:C.surface,borderRadius:10,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:12,color:C.muted,lineHeight:1.65,margin:0,fontStyle:"italic"}}>"{q}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={()=>{setEditEntry(null);setShowModal(true);}}
        style={{position:"fixed",bottom:28,right:24,width:52,height:52,borderRadius:"50%",background:C.victory,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${C.victory}55`,zIndex:40,transition:"transform .15s"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <Plus size={22} color="#060810" strokeWidth={2.5}/>
      </button>

      {showModal&&<EntryModal initial={editEntry} daysClean={daysClean} onSave={saveEntry} onClose={()=>{setShowModal(false);setEditEntry(null);}}/>}
      {showEmerg&&<EmergencyModal onClose={()=>setShowEmerg(false)}/>}
      {confirm&&<Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}