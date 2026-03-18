import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Plus, Calendar, Clock, Pill, AlertCircle, CheckCircle2, XCircle,
  Bell, TrendingUp, X, Edit2, Trash2, Search, Download,
  ChevronDown, Heart, Shield, FileText, BarChart2, List, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line
} from "recharts";

// ─── Palette & Tokens ───────────────────────────────────────────────────────
const T = {
  bg:       "#0f1117",
  surface:  "#181c27",
  card:     "#1e2333",
  border:   "#2a3045",
  borderHi: "#3a4560",
  text:     "#e8eaf0",
  muted:    "#7a8099",
  dim:      "#4a5068",
  green:    "#4ade80",
  greenDim: "#166534",
  amber:    "#fbbf24",
  amberDim: "#78350f",
  red:      "#f87171",
  redDim:   "#7f1d1d",
  blue:     "#60a5fa",
  blueDim:  "#1e3a5f",
  teal:     "#2dd4bf",
  pill:     "#a78bfa",
};

// ─── Initial Seed Data ──────────────────────────────────────────────────────
const SEED_MEDS = [
  { id: 1, name: "Sertraline",  dosage: "100mg", form: "tablet",  frequency: "daily",       times: ["09:00"],         purpose: "Depression & Anxiety",  prescribedBy: "Dr. Adeyemi",  startDate: "2024-11-15", endDate: null, active: true,  withFood: true,  sideEffects: ["Nausea","Headache"], notes: "Take with breakfast.",   color: "#4ade80" },
  { id: 2, name: "Lamotrigine", dosage: "200mg", form: "tablet",  frequency: "twice_daily", times: ["09:00","21:00"], purpose: "Bipolar Disorder",      prescribedBy: "Dr. Okonkwo",  startDate: "2024-10-01", endDate: null, active: true,  withFood: false, sideEffects: [],                   notes: "Do not stop abruptly.", color: "#fbbf24" },
  { id: 3, name: "Melatonin",   dosage: "5mg",   form: "tablet",  frequency: "as_needed",   times: ["22:00"],         purpose: "Insomnia",              prescribedBy: "Over-the-counter", startDate: "2025-01-01", endDate: null, active: true, withFood: false, sideEffects: [],                   notes: "30 min before bed.",    color: "#a78bfa" },
];

const buildSeedHistory = () => {
  const history = [];
  let id = 1;
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    SEED_MEDS.filter(m => m.active).forEach(med => {
      med.times.forEach(t => {
        const rand = Math.random();
        const status = i === 0 ? "pending" : rand > 0.18 ? "taken" : "missed";
        if (status !== "pending") {
          history.push({ id: id++, medicationId: med.id, medicationName: med.name, scheduledTime: t, takenTime: status === "taken" ? t : null, date: dateStr, status, notes: "" });
        }
      });
    });
  }
  return history;
};

// ─── Constants ──────────────────────────────────────────────────────────────
const FREQ_OPTS = [
  { value: "daily",             label: "Once Daily",         times: ["09:00"] },
  { value: "twice_daily",       label: "Twice Daily",        times: ["09:00","21:00"] },
  { value: "three_times_daily", label: "Three Times Daily",  times: ["08:00","14:00","20:00"] },
  { value: "four_times_daily",  label: "Four Times Daily",   times: ["08:00","12:00","16:00","20:00"] },
  { value: "every_other_day",   label: "Every Other Day",    times: ["09:00"] },
  { value: "weekly",            label: "Weekly",             times: ["09:00"] },
  { value: "as_needed",         label: "As Needed",          times: ["09:00"] },
];
const FORMS = ["tablet","capsule","liquid","injection","inhaler","patch","cream","drops","spray"];
const SIDE_EFFECTS = ["Nausea","Headache","Dizziness","Drowsiness","Insomnia","Dry mouth","Constipation","Diarrhea","Weight gain","Weight loss","Fatigue","Anxiety","Tremor","Sweating"];
const COLORS = ["#4ade80","#fbbf24","#f87171","#60a5fa","#a78bfa","#2dd4bf","#fb923c","#e879f9","#34d399","#f472b6"];

const freqLabel = v => FREQ_OPTS.find(f => f.value === v)?.label ?? v;
const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmtDate = s => { try { return new Date(s + "T12:00:00").toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }); } catch { return s; } };

// ─── Styled Primitives ──────────────────────────────────────────────────────
const css = {
  card: { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "20px" },
  input: { width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" },
  btn: (variant = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px",
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
    background: variant === "primary" ? T.teal : variant === "danger" ? T.red : T.border,
    color: variant === "primary" ? "#0f1117" : variant === "danger" ? "#0f1117" : T.text,
    transition: "opacity .15s",
  }),
  tag: (active, color) => ({
    display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 99,
    fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
    background: active ? color + "22" : T.surface,
    color: active ? color : T.muted,
    outline: active ? `1.5px solid ${color}` : `1px solid ${T.border}`,
    transition: "all .15s",
  }),
};

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  const color = type === "success" ? T.green : type === "error" ? T.red : T.amber;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:T.card, border:`1px solid ${color}`, borderRadius:12, padding:"12px 18px", color:T.text, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px #0008", maxWidth:320, animation:"fadeUp .25s ease" }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }} />
      {msg}
    </div>
  );
};

// ─── Confirm Modal ───────────────────────────────────────────────────────────
const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:8000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ ...css.card, maxWidth:380, width:"100%", border:`1px solid ${T.borderHi}` }}>
      <p style={{ color:T.text, marginBottom:20, lineHeight:1.6, fontSize:14 }}>{msg}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button style={css.btn("ghost")} onClick={onCancel}>Cancel</button>
        <button style={css.btn("danger")} onClick={onOk}><Trash2 size={14}/> Delete</button>
      </div>
    </div>
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div style={{ ...css.card, position:"relative", overflow:"hidden" }}>
    <div style={{ position:"absolute", right:16, top:16, opacity:.12 }}><Icon size={44} color={color}/></div>
    <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>{label}</p>
    <p style={{ fontSize:30, fontWeight:800, color, letterSpacing:"-1px", lineHeight:1 }}>{value}</p>
    <p style={{ fontSize:12, color:T.muted, marginTop:6 }}>{sub}</p>
  </div>
);

// ─── Dose Row ────────────────────────────────────────────────────────────────
const DoseRow = ({ dose, onLog }) => {
  const statusColor = dose.status === "taken" ? T.green : dose.status === "missed" ? T.red : T.amber;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:T.surface, borderRadius:10, border:`1px solid ${dose.status==="taken"?T.greenDim:dose.status==="missed"?T.redDim:T.border}` }}>
      <div style={{ width:10, height:10, borderRadius:"50%", background:dose.color, flexShrink:0 }}/>
      <Clock size={14} color={T.muted}/>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:14, fontWeight:700, color:T.text, margin:0 }}>{dose.medicationName}</p>
        <p style={{ fontSize:12, color:T.muted, margin:0 }}>
          Scheduled {dose.scheduledTime}{dose.takenTime ? ` · Taken ${dose.takenTime}` : ""}
        </p>
      </div>
      {dose.status === "pending" ? (
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ ...css.btn("primary"), padding:"6px 12px", fontSize:12 }} onClick={() => onLog(dose,"taken")}>
            <CheckCircle2 size={13}/> Taken
          </button>
          <button style={{ ...css.btn("danger"), padding:"6px 12px", fontSize:12 }} onClick={() => onLog(dose,"missed","Forgot")}>
            <XCircle size={13}/> Missed
          </button>
        </div>
      ) : (
        <span style={{ ...css.tag(true, statusColor), fontSize:11 }}>
          {dose.status === "taken" ? <CheckCircle2 size={11}/> : <XCircle size={11}/>}
          {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
        </span>
      )}
    </div>
  );
};

// ─── Med Card ────────────────────────────────────────────────────────────────
const MedCard = ({ med, expanded, onToggle, onEdit, onDelete, onToggleActive }) => {
  return (
    <div style={{ ...css.card, borderLeft:`3px solid ${med.color}`, opacity: med.active ? 1 : 0.55, transition:"opacity .2s" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer" }} onClick={onToggle}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:16, fontWeight:800, color:T.text }}>{med.name} <span style={{ color:T.muted, fontWeight:400 }}>{med.dosage}</span></span>
            <span style={{ ...css.tag(med.active, med.active ? T.green : T.muted), fontSize:11 }}>{med.active ? "Active" : "Inactive"}</span>
          </div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:6 }}>
            <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:4 }}><Pill size={11}/>{freqLabel(med.frequency)}</span>
            <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:4 }}><Clock size={11}/>{med.times.join(", ")}</span>
            {med.purpose && <span style={{ fontSize:12, color:T.muted, display:"flex", alignItems:"center", gap:4 }}><Heart size={11}/>{med.purpose}</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:4, flexShrink:0 }}>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color: med.active ? T.green : T.muted }} title={med.active?"Deactivate":"Activate"} onClick={e=>{e.stopPropagation();onToggleActive();}}>
            <Shield size={15}/>
          </button>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color:T.muted }} onClick={e=>{e.stopPropagation();onEdit();}}>
            <Edit2 size={15}/>
          </button>
          <button style={{ background:"none", border:"none", cursor:"pointer", padding:6, borderRadius:6, color:T.red }} onClick={e=>{e.stopPropagation();onDelete();}}>
            <Trash2 size={15}/>
          </button>
          <div style={{ padding:6, color:T.dim, display:"flex", alignItems:"center" }}>
            <ChevronDown size={15} style={{ transform: expanded?"rotate(180deg)":"rotate(0)", transition:"transform .25s" }}/>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}`, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[["Form", med.form],["Prescribed By", med.prescribedBy],["Start Date", fmtDate(med.startDate)],["End Date", med.endDate ? fmtDate(med.endDate) : "Ongoing"],["Instructions", med.withFood?"Take with food":"Without food"]].map(([k,v])=>(
              <div key={k}>
                <p style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>{k}</p>
                <p style={{ fontSize:13, color:T.text, textTransform:"capitalize" }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {med.sideEffects.length > 0 && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>Side Effects</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {med.sideEffects.map(e=><span key={e} style={{ ...css.tag(true,T.red), fontSize:11 }}>{e}</span>)}
                </div>
              </div>
            )}
            {med.notes && (
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>Notes</p>
                <p style={{ fontSize:13, color:T.text, lineHeight:1.6 }}>{med.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Med Form Modal ──────────────────────────────────────────────────────────
const EMPTY_FORM = { name:"", dosage:"", form:"tablet", frequency:"daily", times:["09:00"], purpose:"", prescribedBy:"", startDate:today(), endDate:"", active:true, withFood:false, sideEffects:[], notes:"", color:COLORS[0] };

const MedFormModal = ({ initial, onSave, onClose }) => {
  const [fd, setFd] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setFd(p => ({ ...p, [k]: v }));

  const handleFreqChange = (val) => {
    const opt = FREQ_OPTS.find(f => f.value === val);
    setFd(p => ({ ...p, frequency: val, times: opt?.times ?? ["09:00"] }));
  };

  const valid = fd.name.trim() && fd.dosage.trim();

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:7000, overflowY:"auto", padding:"24px 16px", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ ...css.card, width:"100%", maxWidth:620, border:`1px solid ${T.borderHi}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:T.text, margin:0 }}>{initial?.id ? "Edit Medication" : "Add Medication"}</h2>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:T.muted }} onClick={onClose}><X size={18}/></button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Name + Dosage */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={css.label}>Medication Name *</label>
              <input style={css.input} value={fd.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Sertraline"/>
            </div>
            <div>
              <label style={css.label}>Dosage *</label>
              <input style={css.input} value={fd.dosage} onChange={e=>set("dosage",e.target.value)} placeholder="e.g. 100mg"/>
            </div>
          </div>

          {/* Form + Frequency */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={css.label}>Form</label>
              <select style={css.input} value={fd.form} onChange={e=>set("form",e.target.value)}>
                {FORMS.map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={css.label}>Frequency</label>
              <select style={css.input} value={fd.frequency} onChange={e=>handleFreqChange(e.target.value)}>
                {FREQ_OPTS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          {/* Times */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <label style={{ ...css.label, marginBottom:0 }}>Scheduled Times</label>
              <button style={{ ...css.btn("ghost"), padding:"4px 10px", fontSize:12 }} onClick={()=>set("times",[...fd.times,"09:00"])}><Plus size={12}/>Add</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {fd.times.map((t,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:6, background:T.surface, borderRadius:8, padding:"4px 8px", border:`1px solid ${T.border}` }}>
                  <input type="time" value={t} onChange={e=>{const nt=[...fd.times];nt[i]=e.target.value;set("times",nt);}} style={{ background:"transparent", border:"none", color:T.text, fontSize:13, outline:"none" }}/>
                  {fd.times.length > 1 && <button style={{ background:"none", border:"none", cursor:"pointer", color:T.red, padding:0, lineHeight:1 }} onClick={()=>set("times",fd.times.filter((_,j)=>j!==i))}><X size={12}/></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Purpose + Prescribed By */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={css.label}>Purpose</label>
              <input style={css.input} value={fd.purpose} onChange={e=>set("purpose",e.target.value)} placeholder="e.g. Depression & Anxiety"/>
            </div>
            <div>
              <label style={css.label}>Prescribed By</label>
              <input style={css.input} value={fd.prescribedBy} onChange={e=>set("prescribedBy",e.target.value)} placeholder="e.g. Dr. Adeyemi"/>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={css.label}>Start Date</label>
              <input type="date" style={css.input} value={fd.startDate} onChange={e=>set("startDate",e.target.value)}/>
            </div>
            <div>
              <label style={css.label}>End Date (optional)</label>
              <input type="date" style={css.input} value={fd.endDate||""} onChange={e=>set("endDate",e.target.value||null)}/>
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[["withFood","Take with food"],["active","Currently taking"]].map(([k,l])=>(
              <label key={k} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:T.text }}>
                <input type="checkbox" checked={!!fd[k]} onChange={e=>set(k,e.target.checked)} style={{ accentColor:T.teal, width:15, height:15 }}/>{l}
              </label>
            ))}
          </div>

          {/* Side Effects */}
          <div>
            <label style={css.label}>Side Effects</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {SIDE_EFFECTS.map(e=>{
                const on = fd.sideEffects.includes(e);
                return <button key={e} onClick={()=>set("sideEffects",on?fd.sideEffects.filter(x=>x!==e):[...fd.sideEffects,e])} style={{ ...css.tag(on,T.red), cursor:"pointer" }}>{e}</button>;
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={css.label}>Color Tag</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>set("color",c)} style={{ width:28, height:28, borderRadius:"50%", background:c, border: fd.color===c ? `3px solid ${T.text}` : `2px solid ${T.border}`, cursor:"pointer", boxShadow: fd.color===c ? "0 0 0 2px #0008" : "none" }}/>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={css.label}>Notes</label>
            <textarea style={{ ...css.input, resize:"vertical", minHeight:70 }} value={fd.notes} onChange={e=>set("notes",e.target.value)} placeholder="Additional instructions..."/>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", paddingTop:4 }}>
            <button style={css.btn("ghost")} onClick={onClose}>Cancel</button>
            <button style={{ ...css.btn("primary"), opacity: valid ? 1 : 0.4, cursor: valid ? "pointer" : "not-allowed" }} disabled={!valid} onClick={()=>onSave(fd)}>
              <CheckCircle2 size={14}/>{initial?.id ? "Update" : "Save Medication"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── History Table ────────────────────────────────────────────────────────────
const HistoryTable = ({ history, medications }) => {
  const [page, setPage] = useState(0);
  const PER = 10;
  const sorted = [...history].sort((a,b)=>b.date.localeCompare(a.date)||b.scheduledTime.localeCompare(a.scheduledTime));
  const pages = Math.ceil(sorted.length / PER);
  const rows = sorted.slice(page*PER, page*PER+PER);
  const getColor = id => medications.find(m=>m.id===id)?.color ?? T.muted;

  if (!history.length) return <p style={{ color:T.muted, fontSize:13, textAlign:"center", padding:"32px 0" }}>No dose history yet.</p>;

  return (
    <div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 4px", fontSize:13 }}>
          <thead>
            <tr>{["Date","Medication","Scheduled","Taken At","Status","Notes"].map(h=>(
              <th key={h} style={{ textAlign:"left", padding:"6px 12px", color:T.dim, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map(d=>{
              const sc = d.status==="taken" ? T.green : d.status==="missed" ? T.red : T.amber;
              return (
                <tr key={d.id} style={{ background:T.surface }}>
                  <td style={{ padding:"10px 12px", borderRadius:"8px 0 0 8px", borderLeft:`2px solid ${getColor(d.medicationId)}`, color:T.muted }}>{fmtDate(d.date)}</td>
                  <td style={{ padding:"10px 12px", color:T.text, fontWeight:600 }}>{d.medicationName}</td>
                  <td style={{ padding:"10px 12px", color:T.muted }}>{d.scheduledTime}</td>
                  <td style={{ padding:"10px 12px", color:T.muted }}>{d.takenTime || "—"}</td>
                  <td style={{ padding:"10px 12px" }}><span style={{ ...css.tag(true,sc), fontSize:11 }}>{d.status}</span></td>
                  <td style={{ padding:"10px 12px", borderRadius:"0 8px 8px 0", color:T.muted, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.notes||"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginTop:12 }}>
          <button style={{ ...css.btn("ghost"), padding:"5px 12px" }} disabled={page===0} onClick={()=>setPage(p=>p-1)}>←</button>
          <span style={{ fontSize:12, color:T.muted }}>Page {page+1} of {pages}</span>
          <button style={{ ...css.btn("ghost"), padding:"5px 12px" }} disabled={page===pages-1} onClick={()=>setPage(p=>p+1)}>→</button>
        </div>
      )}
    </div>
  );
};

// ─── Main App ────────────────────────────────────────────────────────────────
export default function MedicationTracker() {
  // Persistent state via storage API (artifact-safe)
  const [medications, setMedications] = useState(() => {
    try { const s = localStorage.getItem("mt_meds"); return s ? JSON.parse(s) : SEED_MEDS; } catch { return SEED_MEDS; }
  });
  const [doseHistory, setDoseHistory] = useState(() => {
    try { const s = localStorage.getItem("mt_hist"); return s ? JSON.parse(s) : buildSeedHistory(); } catch { return buildSeedHistory(); }
  });

  useEffect(() => { try { localStorage.setItem("mt_meds", JSON.stringify(medications)); } catch {} }, [medications]);
  useEffect(() => { try { localStorage.setItem("mt_hist", JSON.stringify(doseHistory)); } catch {} }, [doseHistory]);

  const [tab, setTab] = useState("today");         // today | medications | charts | history
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedMed, setExpandedMed] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [confirm, setConfirm] = useState(null);     // { msg, onOk }
  const [toast, setToast] = useState(null);         // { msg, type }
  const nextMedId = useRef(Math.max(0,...medications.map(m=>m.id))+1);
  const nextDoseId = useRef(Math.max(0,...doseHistory.map(d=>d.id))+1);

  const pushToast = (msg, type="success") => setToast({ msg, type });

  // ── Derived ──────────────────────────────────────────────────────────────
  const todaysDoses = useMemo(() => {
    const td = today();
    return medications.filter(m=>m.active).flatMap(med=>
      med.times.map(t => {
        const log = doseHistory.find(d=>d.medicationId===med.id&&d.date===td&&d.scheduledTime===t);
        return { medicationId:med.id, medicationName:med.name, scheduledTime:t, date:td, color:med.color, status:log?.status??"pending", takenTime:log?.takenTime??null, notes:log?.notes??"", doseId:log?.id };
      })
    ).sort((a,b)=>a.scheduledTime.localeCompare(b.scheduledTime));
  }, [medications, doseHistory]);

  const stats = useMemo(() => {
    const active = medications.filter(m=>m.active).length;
    const todayTaken = todaysDoses.filter(d=>d.status==="taken").length;
    const todayTotal = todaysDoses.length;
    const last7 = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().split("T")[0];});
    const scheduled = last7.length * medications.filter(m=>m.active).reduce((s,m)=>s+m.times.length,0);
    const taken = doseHistory.filter(d=>last7.includes(d.date)&&d.status==="taken").length;
    const rate = scheduled > 0 ? +((taken/scheduled)*100).toFixed(1) : 0;
    const nextPending = todaysDoses.find(d=>d.status==="pending");
    return { active, total:medications.length, todayTaken, todayTotal, rate, nextPending };
  }, [medications, doseHistory, todaysDoses]);

  const chartData = useMemo(() => {
    return Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i));
      const ds=d.toISOString().split("T")[0];
      const sched=medications.filter(m=>m.active).reduce((s,m)=>s+m.times.length,0);
      const taken=doseHistory.filter(x=>x.date===ds&&x.status==="taken").length;
      const missed=doseHistory.filter(x=>x.date===ds&&x.status==="missed").length;
      return { date:d.toLocaleDateString("en",{month:"short",day:"numeric"}), taken, missed, pending:Math.max(0,sched-taken-missed), pct:sched>0?+((taken/sched)*100).toFixed(0):0 };
    });
  }, [medications, doseHistory]);

  const filteredMeds = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return medications
      .filter(m => (!term || m.name.toLowerCase().includes(term) || m.purpose.toLowerCase().includes(term) || m.prescribedBy.toLowerCase().includes(term)))
      .filter(m => filterStatus==="all" || (filterStatus==="active"&&m.active) || (filterStatus==="inactive"&&!m.active))
      .sort((a,b)=>a.name.localeCompare(b.name));
  }, [medications, searchTerm, filterStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLogDose = useCallback((dose, status, notes="") => {
    const entry = { id:nextDoseId.current++, medicationId:dose.medicationId, medicationName:dose.medicationName, scheduledTime:dose.scheduledTime, takenTime:status==="taken"?nowTime():null, date:dose.date, status, notes };
    setDoseHistory(prev => [...prev.filter(d=>!(d.medicationId===dose.medicationId&&d.date===dose.date&&d.scheduledTime===dose.scheduledTime)), entry]);
    pushToast(status==="taken" ? `✓ ${dose.medicationName} logged as taken` : `${dose.medicationName} marked as missed`, status==="taken"?"success":"error");
  }, []);

  const handleSaveMed = useCallback((fd) => {
    if (editingMed) {
      setMedications(prev => prev.map(m => m.id===editingMed.id ? { ...fd, id:m.id } : m));
      pushToast(`${fd.name} updated`);
    } else {
      setMedications(prev => [{ ...fd, id:nextMedId.current++ }, ...prev]);
      pushToast(`${fd.name} added to your tracker`);
    }
    setShowForm(false); setEditingMed(null);
  }, [editingMed]);

  const handleDeleteMed = useCallback((id, name) => {
    setConfirm({ msg:`Delete "${name}"? This will also remove all its dose history and cannot be undone.`, onOk:() => {
      setMedications(prev=>prev.filter(m=>m.id!==id));
      setDoseHistory(prev=>prev.filter(d=>d.medicationId!==id));
      setConfirm(null); pushToast(`${name} deleted`,"error");
    }});
  }, []);

  const handleToggleActive = useCallback((id) => {
    setMedications(prev=>prev.map(m=>m.id===id?{...m,active:!m.active}:m));
  }, []);

  // ── Report Download ───────────────────────────────────────────────────────
  const downloadReport = useCallback(() => {
    const sep = "─".repeat(60);
    const lines = [
      "MEDICATION TRACKER — REPORT",
      sep,
      `Generated: ${new Date().toLocaleString()}`,
      `Active Meds: ${stats.active} / ${stats.total}`,
      `7-Day Adherence: ${stats.rate}%`,
      `Today: ${stats.todayTaken}/${stats.todayTotal} doses taken`,
      "", sep, "ACTIVE MEDICATIONS", sep,
      ...medications.filter(m=>m.active).flatMap(m=>[
        `${m.name} ${m.dosage}  (${m.form})`,
        `  Frequency : ${freqLabel(m.frequency)}  |  Times: ${m.times.join(", ")}`,
        `  Purpose   : ${m.purpose || "—"}`,
        `  Prescribed: ${m.prescribedBy || "—"}`,
        `  Started   : ${fmtDate(m.startDate)}`,
        `  With Food : ${m.withFood?"Yes":"No"}`,
        m.sideEffects.length ? `  Side FX   : ${m.sideEffects.join(", ")}` : "",
        m.notes ? `  Notes     : ${m.notes}` : "",
        "",
      ]),
      sep, "DOSE HISTORY — LAST 7 DAYS", sep,
      ...doseHistory
        .filter(d=>{ const wd=new Date(); wd.setDate(wd.getDate()-7); return new Date(d.date)>=wd; })
        .sort((a,b)=>b.date.localeCompare(a.date))
        .map(d=>`${fmtDate(d.date)}  ${d.scheduledTime}  ${d.medicationName.padEnd(16)}  ${d.status.toUpperCase()}${d.takenTime?`  (taken ${d.takenTime})`:""}${d.notes?`  – ${d.notes}`:""}`),
      "", sep, "End of report",
    ];
    const blob = new Blob([lines.join("\n")], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`medication-report-${today()}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    pushToast("Report downloaded");
  }, [medications, doseHistory, stats]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ medications, doseHistory, exportDate:new Date().toISOString() }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`medication-data-${today()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    pushToast("JSON exported");
  }, [medications, doseHistory]);

  const resetData = useCallback(() => {
    setConfirm({ msg:"Reset ALL data back to demo seed data? This cannot be undone.", onOk:() => {
      setMedications(SEED_MEDS); setDoseHistory(buildSeedHistory());
      nextMedId.current = SEED_MEDS.length+1; setConfirm(null);
      pushToast("Data reset to demo","error");
    }});
  }, []);

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const TABS = [
    { key:"today",       label:"Today",       icon:Bell },
    { key:"medications", label:"Medications", icon:Pill },
    { key:"charts",      label:"Analytics",   icon:BarChart2 },
    { key:"history",     label:"History",     icon:List },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans', 'Nunito', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${T.bg}; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        @keyframes fadeUp { from { transform:translateY(10px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        select option { background: ${T.card}; color: ${T.text}; }
        input::placeholder, textarea::placeholder { color: ${T.dim}; }
      `}</style>

      {/* ── Top Nav ── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:0 }}>
        <div style={{ maxWidth:880, margin:"0 auto", padding:"0 16px", display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ padding:"14px 0", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:T.teal+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Pill size={16} color={T.teal}/>
            </div>
            <span style={{ fontSize:16, fontWeight:800, color:T.text, letterSpacing:"-0.5px" }}>MedTracker</span>
          </div>
          <div style={{ display:"flex", gap:2, flex:1, overflowX:"auto" }}>
            {TABS.map(({key,label,icon:Icon})=>(
              <button key={key} onClick={()=>setTab(key)} style={{ display:"flex", alignItems:"center", gap:6, padding:"14px 14px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, color:tab===key?T.teal:T.muted, borderBottom:`2px solid ${tab===key?T.teal:"transparent"}`, transition:"all .2s", whiteSpace:"nowrap" }}>
                <Icon size={14}/>{label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button style={{ ...css.btn("ghost"), padding:"7px 12px", fontSize:12 }} onClick={downloadReport} title="Download report"><FileText size={13}/><span style={{ display:"none" }}>Report</span></button>
            <button style={{ ...css.btn("ghost"), padding:"7px 12px", fontSize:12 }} onClick={exportJSON} title="Export JSON"><Download size={13}/></button>
            <button style={{ ...css.btn("ghost"), padding:"7px 12px", fontSize:12 }} onClick={resetData} title="Reset data"><RefreshCw size={13}/></button>
            <button style={{ ...css.btn("primary"), padding:"7px 14px", fontSize:12 }} onClick={()=>{ setEditingMed(null); setShowForm(true); }}><Plus size={14}/>Add</button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:880, margin:"0 auto", padding:"24px 16px 60px" }}>

        {/* Stat row — always visible */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:24 }}>
          <StatCard label="Active Meds"     value={stats.active}     sub={`of ${stats.total} total`} icon={Pill}       color={T.teal}/>
          <StatCard label="Today's Doses"   value={`${stats.todayTaken}/${stats.todayTotal}`} sub={stats.todayTotal>0?`${((stats.todayTaken/stats.todayTotal)*100).toFixed(0)}% done`:"No doses today"} icon={CheckCircle2} color={T.amber}/>
          <StatCard label="7-Day Adherence" value={`${stats.rate}%`} sub={stats.rate>=80?"Excellent":stats.rate>=60?"Good":"Needs work"} icon={TrendingUp} color={stats.rate>=80?T.green:stats.rate>=60?T.amber:T.red}/>
          <StatCard label="Next Dose"       value={stats.nextPending?.scheduledTime??"All clear"} sub={stats.nextPending?.medicationName??""} icon={Bell} color={T.blue}/>
        </div>

        {/* ── TODAY TAB ── */}
        {tab === "today" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>
              Today · {new Date().toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long"})}
            </h2>
            {todaysDoses.length === 0
              ? <div style={{ ...css.card, textAlign:"center", padding:"48px 24px" }}><Bell size={40} color={T.dim} style={{ marginBottom:12 }}/><p style={{ color:T.muted }}>No active medications scheduled for today.</p></div>
              : todaysDoses.map((dose,i) => <DoseRow key={i} dose={dose} onLog={handleLogDose}/>)
            }
          </div>
        )}

        {/* ── MEDICATIONS TAB ── */}
        {tab === "medications" && (
          <div>
            {/* Search + Filter */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
              <div style={{ position:"relative", flex:1, minWidth:180 }}>
                <Search size={14} color={T.dim} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
                <input style={{ ...css.input, paddingLeft:32 }} placeholder="Search medications…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {["all","active","inactive"].map(s=>(
                  <button key={s} style={{ ...css.tag(filterStatus===s,T.teal), textTransform:"capitalize" }} onClick={()=>setFilterStatus(s)}>{s}</button>
                ))}
              </div>
            </div>

            {filteredMeds.length === 0
              ? <div style={{ ...css.card, textAlign:"center", padding:"40px" }}><Pill size={36} color={T.dim} style={{ marginBottom:10 }}/><p style={{ color:T.muted }}>{searchTerm?"No results found":"No medications yet — add one above."}</p></div>
              : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredMeds.map(med=>(
                    <MedCard
                      key={med.id} med={med}
                      expanded={expandedMed===med.id}
                      onToggle={()=>setExpandedMed(e=>e===med.id?null:med.id)}
                      onEdit={()=>{ setEditingMed(med); setShowForm(true); }}
                      onDelete={()=>handleDeleteMed(med.id, med.name)}
                      onToggleActive={()=>handleToggleActive(med.id)}
                    />
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── CHARTS TAB ── */}
        {tab === "charts" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={css.card}>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:16 }}>7-Day Dose Log</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top:4, right:8, left:-20, bottom:0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} stroke={T.border}/>
                  <YAxis tick={{ fill:T.muted, fontSize:11 }} stroke={T.border}/>
                  <Tooltip contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontSize:12, color:T.muted }}/>
                  <Bar dataKey="taken"   name="Taken"   fill={T.green}   stackId="a" radius={[0,0,0,0]}/>
                  <Bar dataKey="missed"  name="Missed"  fill={T.red}     stackId="a"/>
                  <Bar dataKey="pending" name="Pending" fill={T.dim}     stackId="a" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={css.card}>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:16 }}>Adherence % Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top:4, right:8, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:T.muted, fontSize:11 }} stroke={T.border}/>
                  <YAxis domain={[0,100]} tick={{ fill:T.muted, fontSize:11 }} stroke={T.border} tickFormatter={v=>`${v}%`}/>
                  <Tooltip formatter={v=>`${v}%`} contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:12 }}/>
                  <Line type="monotone" dataKey="pct" name="Adherence" stroke={T.teal} strokeWidth={2.5} dot={{ fill:T.teal, r:4 }} activeDot={{ r:6 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-medication adherence */}
            <div style={css.card}>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:16 }}>Per-Medication (7-Day)</h3>
              {medications.filter(m=>m.active).map(med=>{
                const last7 = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().split("T")[0];});
                const sched = last7.length * med.times.length;
                const taken = doseHistory.filter(d=>last7.includes(d.date)&&d.medicationId===med.id&&d.status==="taken").length;
                const pct = sched > 0 ? Math.round((taken/sched)*100) : 0;
                return (
                  <div key={med.id} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{med.name} <span style={{ color:T.muted, fontWeight:400 }}>{med.dosage}</span></span>
                      <span style={{ fontSize:13, fontWeight:700, color: pct>=80?T.green:pct>=60?T.amber:T.red }}>{pct}%</span>
                    </div>
                    <div style={{ height:6, background:T.border, borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:med.color, borderRadius:99, transition:"width .5s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={css.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontSize:14, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".06em" }}>Full Dose History ({doseHistory.length} records)</h2>
              <button style={{ ...css.btn("danger"), padding:"6px 12px", fontSize:12 }} onClick={()=>setConfirm({ msg:"Clear all dose history? This cannot be undone.", onOk:()=>{ setDoseHistory([]); setConfirm(null); pushToast("History cleared","error"); } })}>
                <Trash2 size={13}/> Clear
              </button>
            </div>
            <HistoryTable history={doseHistory} medications={medications}/>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showForm && <MedFormModal initial={editingMed} onSave={handleSaveMed} onClose={()=>{ setShowForm(false); setEditingMed(null); }}/>}
      {confirm && <Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}