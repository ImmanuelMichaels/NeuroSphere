import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Upload, Dna, FileText, CheckCircle, AlertTriangle, AlertOctagon,
  Pill, Sparkles, ChevronDown, ChevronUp, RefreshCw, X, Plus,
  TrendingUp, Info, Shield, Zap, Activity, Brain,
  BarChart3, Download, Search,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

// ─── Persistence ──────────────────────────────────────────────────────────────
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#06070d', bg2: '#0b0d18', bg3: '#0f1220', bg4: '#141728',
  border:  '#1a1f35', border2: '#222840', border3: '#2a3050',
  text:    '#dde6f5', text2: '#8898b8', text3: '#4a5878', text4: '#2a3248',
  green:   '#2ecc8f', greenBg: 'rgba(46,204,143,.12)',  greenBd: 'rgba(46,204,143,.3)',
  red:     '#e85060', redBg:   'rgba(232,80,96,.12)',   redBd:   'rgba(232,80,96,.3)',
  amber:   '#f0a830', amberBg: 'rgba(240,168,48,.12)',  amberBd: 'rgba(240,168,48,.3)',
  blue:    '#5b7ef5', blueBg:  'rgba(91,126,245,.12)',  blueBd:  'rgba(91,126,245,.3)',
  teal:    '#3ec4a0', tealBg:  'rgba(62,196,160,.12)',  tealBd:  'rgba(62,196,160,.3)',
  purple:  '#9b7cf0', purpleBg:'rgba(155,124,240,.12)', purpleBd:'rgba(155,124,240,.3)',
};

// ─── Gene database ────────────────────────────────────────────────────────────
const GENE_DB = {
  CYP2D6:  {
    fullName: 'Cytochrome P450 2D6',
    category: 'Metabolism',
    function: 'Metabolises ~25% of all psychiatric and pain medications',
    statuses: {
      'Poor Metabolizer':       { color: T.red,    bg: T.redBg,    bd: T.redBd,    risk: 90, desc: 'Drug levels accumulate — significantly lower doses required. High risk of side effects at standard doses.' },
      'Intermediate Metabolizer':{ color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 55, desc: 'Reduced enzyme activity. Moderate dose reduction may be needed. Monitor closely.' },
      'Normal Metabolizer':     { color: T.green,   bg: T.greenBg,  bd: T.greenBd,  risk: 10, desc: 'Standard dosing appropriate. No genetic adjustment needed.' },
      'Ultrarapid Metabolizer': { color: T.blue,    bg: T.blueBg,   bd: T.blueBd,   risk: 70, desc: 'Drugs cleared too quickly — standard doses may be ineffective. Higher doses or alternative drugs needed.' },
    },
    affectedDrugs: ['Fluoxetine','Paroxetine','Codeine','Tramadol','Risperidone','Haloperidol','Tamoxifen'],
  },
  CYP2C19: {
    fullName: 'Cytochrome P450 2C19',
    category: 'Metabolism',
    function: 'Key enzyme for antidepressants, antiplatelet agents, and PPIs',
    statuses: {
      'Poor Metabolizer':       { color: T.red,    bg: T.redBg,    bd: T.redBd,    risk: 85, desc: 'Severely reduced metabolism. Drugs accumulate to toxic levels. Dose reduction essential.' },
      'Intermediate Metabolizer':{ color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 50, desc: 'Partially reduced activity. Monitor for side effects; consider dose adjustment.' },
      'Normal Metabolizer':     { color: T.green,   bg: T.greenBg,  bd: T.greenBd,  risk: 10, desc: 'Standard dosing appropriate.' },
      'Rapid Metabolizer':      { color: T.blue,    bg: T.blueBg,   bd: T.blueBd,   risk: 60, desc: 'Faster drug clearance. Standard doses may be subtherapeutic; monitor effectiveness.' },
      'Ultrarapid Metabolizer': { color: T.purple,  bg: T.purpleBg, bd: T.purpleBd, risk: 75, desc: 'Very rapid clearance. High doses or alternative agents likely required.' },
    },
    affectedDrugs: ['Escitalopram','Citalopram','Clopidogrel','Omeprazole','Diazepam','Sertraline'],
  },
  COMT: {
    fullName: 'Catechol-O-methyltransferase',
    category: 'Neurotransmitter',
    function: 'Regulates dopamine & norepinephrine breakdown in the prefrontal cortex',
    statuses: {
      'Val/Val (Warrior)': { color: T.teal,   bg: T.tealBg,   bd: T.tealBd,   risk: 25, desc: 'High enzyme activity — faster dopamine clearance. Better stress resilience but lower baseline dopamine in PFC.' },
      'Val/Met':           { color: T.blue,   bg: T.blueBg,   bd: T.blueBd,   risk: 15, desc: 'Intermediate activity. Balanced dopamine regulation. May respond well to stimulant medications.' },
      'Met/Met (Worrier)': { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 40, desc: 'Low enzyme activity — slower dopamine breakdown. Higher baseline PFC dopamine, better cognition but heightened anxiety sensitivity.' },
    },
    affectedDrugs: ['Methylphenidate','Amphetamine','Antipsychotics','L-DOPA'],
  },
  MTHFR: {
    fullName: 'Methylenetetrahydrofolate reductase',
    category: 'Methylation',
    function: 'Critical for folate metabolism, methylation, and neurotransmitter synthesis',
    statuses: {
      'No Variant (Normal)': { color: T.green,  bg: T.greenBg,  bd: T.greenBd,  risk: 5,  desc: 'Normal folate metabolism. Standard supplementation sufficient.' },
      'C677T Heterozygous':  { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 35, desc: '~35% reduced enzyme activity. L-methylfolate supplementation recommended. May affect antidepressant response.' },
      'C677T Homozygous':    { color: T.red,    bg: T.redBg,    bd: T.redBd,    risk: 75, desc: '~70% reduced enzyme activity. L-methylfolate (not folic acid) is essential. Significant impact on mood and medication efficacy.' },
      'A1298C Heterozygous': { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 25, desc: 'Moderate methylation impairment. Monitor homocysteine; supplement with methylated B vitamins.' },
      'Compound Heterozygous':{ color: T.red,   bg: T.redBg,    bd: T.redBd,    risk: 80, desc: 'Two variant alleles — significant methylation dysfunction. Aggressive supplementation and close monitoring required.' },
    },
    affectedDrugs: ['SSRIs','SNRIs','Methotrexate','Antiepileptics'],
  },
  SLC6A4: {
    fullName: 'Serotonin Transporter Gene (5-HTTLPR)',
    category: 'Serotonin',
    function: 'Controls serotonin reuptake efficiency — key predictor of SSRI response',
    statuses: {
      'L/L (High Expression)':   { color: T.green,  bg: T.greenBg,  bd: T.greenBd,  risk: 10, desc: 'High serotonin transporter expression. SSRIs likely to be effective at standard doses.' },
      'L/S (Intermediate)':      { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 40, desc: 'Intermediate transporter expression. Moderate SSRI efficacy. Increased stress sensitivity.' },
      'S/S (Low Expression)':    { color: T.red,    bg: T.redBg,    bd: T.redBd,    risk: 65, desc: 'Low serotonin transporter expression. Reduced SSRI efficacy. Higher anxiety/depression vulnerability under stress.' },
    },
    affectedDrugs: ['All SSRIs','SNRIs','Tramadol'],
  },
  BDNF: {
    fullName: 'Brain-Derived Neurotrophic Factor',
    category: 'Neuroplasticity',
    function: 'Regulates neuronal growth, memory consolidation, and antidepressant response',
    statuses: {
      'Val/Val':  { color: T.green,  bg: T.greenBg,  bd: T.greenBd,  risk: 10, desc: 'Normal BDNF secretion. Good neuroplasticity and antidepressant response expected.' },
      'Val/Met':  { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  risk: 35, desc: 'Reduced activity-dependent BDNF secretion. Moderate impact on memory and treatment response.' },
      'Met/Met':  { color: T.red,    bg: T.redBg,    bd: T.redBd,    risk: 60, desc: 'Significantly reduced BDNF activity. Exercise and lifestyle interventions particularly important. May need higher antidepressant doses.' },
    },
    affectedDrugs: ['SSRIs','SNRIs','Lithium','Antipsychotics','ECT'],
  },
};

// ─── Drug interaction database ────────────────────────────────────────────────
const DRUG_DB = [
  { name: 'Fluoxetine',        gene: 'CYP2D6',  risk: 'high',     category: 'SSRI',           mechanism: 'CYP2D6 substrate + inhibitor. Poor metabolisers accumulate toxic plasma levels.' },
  { name: 'Paroxetine',        gene: 'CYP2D6',  risk: 'high',     category: 'SSRI',           mechanism: 'Strong CYP2D6 inhibitor. Contraindicated in poor metabolisers.' },
  { name: 'Escitalopram',      gene: 'CYP2C19', risk: 'moderate', category: 'SSRI',           mechanism: 'Primary CYP2C19 substrate. Plasma levels double in poor metabolisers.' },
  { name: 'Citalopram',        gene: 'CYP2C19', risk: 'moderate', category: 'SSRI',           mechanism: 'CYP2C19 substrate. QTc prolongation risk in poor metabolisers.' },
  { name: 'Sertraline',        gene: 'CYP2C19', risk: 'low',      category: 'SSRI',           mechanism: 'Multiple pathways — less susceptible to single-gene variation.' },
  { name: 'Venlafaxine',       gene: 'CYP2D6',  risk: 'moderate', category: 'SNRI',           mechanism: 'Active metabolite O-desmethylvenlafaxine depends on CYP2D6.' },
  { name: 'Risperidone',       gene: 'CYP2D6',  risk: 'high',     category: 'Antipsychotic',  mechanism: 'CYP2D6-dependent. EPS and prolactin elevation risk in poor metabolisers.' },
  { name: 'Aripiprazole',      gene: 'CYP2D6',  risk: 'moderate', category: 'Antipsychotic',  mechanism: 'CYP2D6 substrate. FDA recommends 50% dose reduction in poor metabolisers.' },
  { name: 'Haloperidol',       gene: 'CYP2D6',  risk: 'high',     category: 'Antipsychotic',  mechanism: 'Major CYP2D6 substrate. High accumulation risk in poor metabolisers.' },
  { name: 'Codeine',           gene: 'CYP2D6',  risk: 'high',     category: 'Opioid',         mechanism: 'Prodrug — requires CYP2D6 for conversion to morphine. Ineffective in poor, dangerous in ultrarapid metabolisers.' },
  { name: 'Tramadol',          gene: 'CYP2D6',  risk: 'high',     category: 'Opioid',         mechanism: 'CYP2D6 activation required. Seizure risk in poor metabolisers; serotonin syndrome risk in ultrarapid.' },
  { name: 'Lithium Carbonate', gene: 'None',     risk: 'low',      category: 'Mood Stabilizer',mechanism: 'Not metabolised by CYP enzymes. Renal clearance — genetic risk minimal.' },
  { name: 'Lamotrigine',       gene: 'None',     risk: 'low',      category: 'Mood Stabilizer',mechanism: 'Glucuronidation pathway — minimal pharmacogenomic interaction.' },
  { name: 'Valproate',         gene: 'None',     risk: 'low',      category: 'Mood Stabilizer',mechanism: 'Multiple metabolic pathways — limited single-gene impact.' },
  { name: 'Clozapine',         gene: 'CYP2D6',  risk: 'moderate', category: 'Antipsychotic',  mechanism: 'Partial CYP2D6 substrate. Monitor levels in genetically variant patients.' },
  { name: 'Methylphenidate',   gene: 'COMT',    risk: 'variable', category: 'Stimulant',      mechanism: 'COMT genotype predicts response. Val/Val may respond better; Met/Met may over-respond.' },
  { name: 'Atomoxetine',       gene: 'CYP2D6',  risk: 'high',     category: 'ADHD',           mechanism: 'Primary CYP2D6 substrate. Poor metabolisers need 50% dose reduction per FDA label.' },
  { name: 'Amitriptyline',     gene: 'CYP2D6',  risk: 'high',     category: 'TCA',            mechanism: 'High CYP2D6 dependence. Severe cardiac and CNS toxicity risk in poor metabolisers.' },
  { name: 'Clomipramine',      gene: 'CYP2D6',  risk: 'high',     category: 'TCA',            mechanism: 'CYP2D6-dependent demethylation. Poor metabolisers at serious toxicity risk.' },
  { name: 'Tamoxifen',         gene: 'CYP2D6',  risk: 'high',     category: 'Oncology',       mechanism: 'Requires CYP2D6 for active metabolite endoxifen. Poor metabolisers have severely reduced efficacy.' },
];

// ─── Default genetic profile ──────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  CYP2D6:  'Poor Metabolizer',
  CYP2C19: 'Rapid Metabolizer',
  COMT:    'Val/Val (Warrior)',
  MTHFR:   'C677T Heterozygous',
  SLC6A4:  'S/S (Low Expression)',
  BDNF:    'Val/Met',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getRiskLevel = (gene, status, profile) => {
  const g = GENE_DB[gene];
  if (!g) return null;
  return g.statuses[status] ?? null;
};

const evalDrugRisk = (drug, profile) => {
  const d = DRUG_DB.find(x => x.name === drug);
  if (!d) return { level: 'unknown', reason: 'Not in database.' };
  if (d.gene === 'None') return { level: 'low', reason: d.mechanism };

  const geneStatus = profile[d.gene];
  if (!geneStatus) return { level: 'low', reason: d.mechanism };

  const statusInfo = GENE_DB[d.gene]?.statuses[geneStatus];
  const genRisk = statusInfo?.risk ?? 0;

  if (d.risk === 'high' && genRisk >= 70)      return { level: 'high',     reason: `${d.mechanism} Your ${d.gene} genotype (${geneStatus}) significantly increases this risk.` };
  if (d.risk === 'high' && genRisk >= 40)      return { level: 'moderate', reason: `${d.mechanism} Your ${d.gene} status requires dose adjustment.` };
  if (d.risk === 'moderate' && genRisk >= 40)  return { level: 'moderate', reason: `${d.mechanism} Monitor response closely.` };
  return { level: 'low', reason: `${d.mechanism} Your genotype indicates standard dosing is appropriate.` };
};

const riskConfig = {
  high:     { color: T.red,    bg: T.redBg,    bd: T.redBd,    Icon: AlertTriangle, label: 'High Risk'     },
  moderate: { color: T.amber,  bg: T.amberBg,  bd: T.amberBd,  Icon: AlertOctagon,  label: 'Moderate Risk' },
  low:      { color: T.green,  bg: T.greenBg,  bd: T.greenBd,  Icon: CheckCircle,   label: 'Low Risk'      },
  variable: { color: T.blue,   bg: T.blueBg,   bd: T.blueBd,   Icon: Info,          label: 'Variable'      },
  unknown:  { color: T.text3,  bg: T.bg4,      bd: T.border3,  Icon: Info,          label: 'Unknown'       },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const colors = {
    success: [T.greenBg, T.greenBd, T.green],
    error:   [T.redBg,   T.redBd,   T.red  ],
    info:    [T.blueBg,  T.blueBd,  T.blue ],
  };
  const [bg, bd, color] = colors[toast.type] ?? colors.info;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: bg, border: `1px solid ${bd}`, color, padding: '11px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.5)', animation: 'toastIn .2s ease', maxWidth: 360 }}>
      <CheckCircle size={14} />
      {toast.msg}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '.1em', margin: '0 0 14px' }}>
      {children}
    </p>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color, sub }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-.5px', lineHeight: 1 }}>{value}<span style={{ fontSize: 13, fontWeight: 400, color: T.text2, marginLeft: 2 }}>{unit}</span></div>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Risk pill ────────────────────────────────────────────────────────────────
function RiskPill({ level }) {
  const cfg = riskConfig[level] ?? riskConfig.unknown;
  const Icon = cfg.Icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bd}` }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Upload Panel ─────────────────────────────────────────────────────────────
function UploadPanel({ hasProfile, onLoadDemo, onClear, uploadedFile, setUploadedFile, setToast }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'txt', 'xml', 'vcf'].includes(ext)) {
      setToast({ msg: 'Unsupported format. Please use CSV, TXT, XML, or VCF.', type: 'error' });
      return;
    }
    setUploadedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', date: new Date().toLocaleDateString() });
    setToast({ msg: `"${file.name}" uploaded. Loading demo analysis…`, type: 'success' });
    setTimeout(() => onLoadDemo(), 800);
  };

  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 18, padding: 24, marginBottom: 20 }}>
      {!hasProfile ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragging ? T.teal : T.border3}`, borderRadius: 14, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all .2s', background: dragging ? T.tealBg : T.bg2 }}
        >
          <input ref={fileRef} type="file" accept=".csv,.txt,.xml,.vcf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.tealBg, border: `1px solid ${T.tealBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Upload size={28} color={T.teal} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Upload Genetic Data</h3>
          <p style={{ fontSize: 13, color: T.text2, margin: '0 0 16px' }}>23andMe, AncestryDNA, or Clinical Lab Files</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {['CSV', 'TXT', 'XML', 'VCF'].map(f => (
              <span key={f} style={{ padding: '3px 10px', borderRadius: 6, background: T.bg4, border: `1px solid ${T.border2}`, fontSize: 11, fontWeight: 700, color: T.text3 }}>{f}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }} style={btnStyle(T.teal, T.tealBg, T.tealBd)}>
              <Upload size={14} /> Select File
            </button>
            <button onClick={e => { e.stopPropagation(); onLoadDemo(); }} style={btnStyle(T.blue, T.blueBg, T.blueBd)}>
              <Dna size={14} /> Load Demo Profile
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: T.tealBg, border: `1px solid ${T.tealBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dna size={24} color={T.teal} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{uploadedFile ? uploadedFile.name : 'Demo Genetic Profile'}</div>
                <div style={{ fontSize: 12, color: T.text2 }}>{uploadedFile ? `${uploadedFile.size} · ${uploadedFile.date}` : 'Pre-loaded analysis · 6 genes analysed'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fileRef.current?.click()} style={btnStyleSm(T.teal, T.tealBg)}>
                <RefreshCw size={12} /> Replace
              </button>
              <button onClick={onClear} style={btnStyleSm(T.red, T.redBg)}>
                <X size={12} /> Clear
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt,.xml,.vcf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '6 Genes', icon: Dna, color: T.teal },
              { label: 'Analysed', icon: CheckCircle, color: T.green },
              { label: 'Drug Interactions', icon: Pill, color: T.blue },
              { label: 'AI Ready', icon: Sparkles, color: T.purple },
            ].map(({ label, icon: Icon, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, background: T.bg4, border: `1px solid ${T.border2}`, fontSize: 12, color: T.text2, fontWeight: 500 }}>
                <Icon size={12} color={color} /> {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gene Profile Editor ──────────────────────────────────────────────────────
function GenePanel({ profile, setProfile, expanded, setExpanded }) {
  const overallRisk = useMemo(() => {
    const scores = Object.entries(profile).map(([gene, status]) => {
      const info = GENE_DB[gene]?.statuses[status];
      return info?.risk ?? 0;
    });
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [profile]);

  const radarData = Object.entries(profile).map(([gene, status]) => ({
    gene,
    risk: GENE_DB[gene]?.statuses[status]?.risk ?? 0,
    fullMark: 100,
  }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

      {/* Gene list */}
      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Dna size={16} color={T.teal} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Metabolism Status</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>Click to edit</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(GENE_DB).map(([gene, data]) => {
            const status    = profile[gene] ?? Object.keys(data.statuses)[0];
            const info      = data.statuses[status];
            const isOpen    = expanded === gene;

            return (
              <div key={gene} style={{ background: T.bg2, borderRadius: 12, border: `1px solid ${isOpen ? info.bd : T.border}`, overflow: 'hidden', transition: 'border-color .2s' }}>
                <button
                  onClick={() => setExpanded(isOpen ? null : gene)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{gene}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: info.bg, color: info.color, border: `1px solid ${info.bd}`, whiteSpace: 'nowrap' }}>{status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.category} · {data.function.slice(0, 42)}…</div>
                  </div>
                  {isOpen ? <ChevronUp size={14} color={T.text3} /> : <ChevronDown size={14} color={T.text3} />}
                </button>

                {isOpen && (
                  <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, margin: '12px 0 10px' }}>{info.desc}</p>

                    {/* Risk meter */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: T.text3 }}>Pharmacogenomic Risk</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: info.color, fontFamily: 'monospace' }}>{info.risk}%</span>
                      </div>
                      <div style={{ height: 5, background: T.bg4, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${info.risk}%`, background: info.color, borderRadius: 99, transition: 'width .4s ease' }} />
                      </div>
                    </div>

                    {/* Status selector */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Change Status</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {Object.keys(data.statuses).map(s => (
                          <button key={s} onClick={() => setProfile(p => ({ ...p, [gene]: s }))}
                            style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: `1px solid ${status === s ? data.statuses[s].bd : T.border}`, background: status === s ? data.statuses[s].bg : T.bg3, color: status === s ? data.statuses[s].color : T.text2, fontSize: 12, fontWeight: status === s ? 700 : 400, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: data.statuses[s].color, flexShrink: 0 }} />
                            {s}
                            {status === s && <CheckCircle size={11} style={{ marginLeft: 'auto' }} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Affected drugs */}
                    <div>
                      <div style={{ fontSize: 11, color: T.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Key Affected Drugs</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {data.affectedDrugs?.map(d => (
                          <span key={d} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: T.bg4, border: `1px solid ${T.border2}`, color: T.text2 }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Radar chart + stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Risk score */}
        <div style={{ background: 'linear-gradient(135deg, #07091a, #0d1530)', border: `1px solid ${T.blueBd}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Activity size={14} color={T.blue} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Pharmacogenomic Risk Profile</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatCard label="Overall Risk" value={overallRisk} unit="%" color={overallRisk > 60 ? T.red : overallRisk > 35 ? T.amber : T.green} />
            <StatCard label="Genes Tested" value={Object.keys(profile).length} unit="" color={T.teal} />
            <StatCard label="High Risk" value={Object.entries(profile).filter(([g, s]) => (GENE_DB[g]?.statuses[s]?.risk ?? 0) >= 60).length} unit="" color={T.red} />
          </div>

          {/* Radar chart */}
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="gene" tick={{ fill: T.text2, fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: T.text3, fontSize: 9 }} axisLine={false} />
                <Radar name="Risk %" dataKey="risk" stroke="#5b7ef5" fill="#5b7ef5" fillOpacity={0.2} />
                <Tooltip
                  contentStyle={{ background: '#0d1220', border: `1px solid ${T.border2}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: T.text }}
                  formatter={(v) => [`${v}%`, 'Risk Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk bar breakdown */}
        <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
          <SectionLabel>Risk Breakdown by Gene</SectionLabel>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="gene" tick={{ fill: T.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: T.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d1220', border: `1px solid ${T.border2}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Risk']}
                />
                <Bar dataKey="risk" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {radarData.map((entry, i) => (
                    <Cell key={i} fill={entry.risk >= 60 ? T.red : entry.risk >= 35 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Drug Interaction Checker ─────────────────────────────────────────────────
function InteractionPanel({ profile, medications, setMedications }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    if (!search.trim()) { setFiltered([]); return; }
    const q = search.toLowerCase();
    setFiltered(DRUG_DB.filter(d => d.name.toLowerCase().includes(q) && !medications.includes(d.name)).slice(0, 6));
  }, [search, medications]);

  const addMed = (name) => {
    setMedications(prev => [...new Set([...prev, name])]);
    setSearch('');
    setFiltered([]);
  };

  const removeMed = (name) => setMedications(prev => prev.filter(m => m !== name));

  const results = useMemo(() =>
    medications.map(name => {
      const drug = DRUG_DB.find(d => d.name === name);
      const analysis = evalDrugRisk(name, profile);
      return { name, drug, analysis };
    }).sort((a, b) => {
      const order = { high: 0, moderate: 1, variable: 2, low: 3, unknown: 4 };
      return (order[a.analysis.level] ?? 4) - (order[b.analysis.level] ?? 4);
    }), [medications, profile]);

  const highCount   = results.filter(r => r.analysis.level === 'high').length;
  const modCount    = results.filter(r => r.analysis.level === 'moderate').length;

  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Pill size={16} color={T.amber} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Drug Interaction Checker</span>
        {highCount > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: T.redBg, color: T.red, border: `1px solid ${T.redBd}` }}>
            {highCount} High Risk
          </span>
        )}
        {modCount > 0 && highCount === 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: T.amberBg, color: T.amber, border: `1px solid ${T.amberBd}` }}>
            {modCount} Moderate
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: T.text2, marginBottom: 16 }}>Analysis based on your genetic profile + current medication list.</p>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={13} color={T.text3} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search and add a medication…"
          style={{ width: '100%', paddingLeft: 32, padding: '9px 14px 9px 32px', background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none' }}
        />
        {search && (
          <button onClick={() => { setSearch(''); setFiltered([]); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.text3, cursor: 'pointer', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
        {filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: T.bg3, border: `1px solid ${T.border2}`, borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,.4)' }}>
            {filtered.map(d => (
              <button key={d.name} onClick={() => addMed(d.name)} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.border}`, transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg4}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Plus size={12} color={T.teal} />
                <span style={{ fontSize: 13, color: T.text }}>{d.name}</span>
                <span style={{ fontSize: 11, color: T.text3, marginLeft: 'auto' }}>{d.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick add common meds */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {['Lithium Carbonate','Sertraline','Aripiprazole','Lamotrigine','Methylphenidate'].filter(m => !medications.includes(m)).map(m => (
          <button key={m} onClick={() => addMed(m)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: T.bg4, border: `1px solid ${T.border2}`, color: T.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .15s' }}>
            <Plus size={10} /> {m}
          </button>
        ))}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: T.bg2, borderRadius: 12, border: `1px dashed ${T.border2}` }}>
          <Pill size={28} color={T.text4} style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: T.text2 }}>Add medications above to check interactions against your genetic profile.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(({ name, drug, analysis }) => {
            const cfg = riskConfig[analysis.level] ?? riskConfig.unknown;
            const Icon = cfg.Icon;
            return (
              <div key={name} style={{ background: cfg.bg, border: `1px solid ${cfg.bd}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12 }}>
                <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{name}</span>
                    <RiskPill level={analysis.level} />
                    {drug && <span style={{ fontSize: 11, color: T.text3 }}>{drug.category}</span>}
                  </div>
                  <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6, margin: 0 }}>{analysis.reason}</p>
                  {drug && drug.gene !== 'None' && (
                    <div style={{ marginTop: 6, fontSize: 11, color: T.text3 }}>
                      Gene: <span style={{ color: cfg.color, fontWeight: 600 }}>{drug.gene}</span>
                      {' · '}Status: <span style={{ color: T.text2 }}>{profile[drug.gene] ?? 'Unknown'}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => removeMed(name)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', flexShrink: 0, padding: 2 }}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AI Analysis Panel ────────────────────────────────────────────────────────
function AIPanel({ profile, medications, dailyTotals }) {
  const [insight, setInsight]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [mode, setMode]         = useState('overview');
  const [error, setError]       = useState('');

  const profileSummary = Object.entries(profile).map(([g, s]) => `${g}: ${s} (risk ${GENE_DB[g]?.statuses[s]?.risk ?? 0}%)`).join('; ');
  const medList = medications.length ? medications.join(', ') : 'No medications currently listed';

  const interactions = useMemo(() =>
    medications.map(m => ({ name: m, result: evalDrugRisk(m, profile) }))
    , [medications, profile]);

  const interactionSummary = interactions
    .filter(i => i.result.level !== 'low')
    .map(i => `${i.name} (${i.result.level} risk)`)
    .join(', ') || 'No significant interactions detected';

  const PROMPTS = {
    overview: `You are a clinical pharmacogenomicist. A patient has the following genetic profile: ${profileSummary}. Current medications: ${medList}. Key interactions flagged: ${interactionSummary}. Provide a concise 3-4 sentence pharmacogenomic summary: overall risk assessment, the most clinically significant finding, and one priority recommendation for their prescribing clinician. Be precise and clinical. No bullet points or headers.`,
    medications: `You are a clinical pharmacogenomicist. Patient genetic profile: ${profileSummary}. Current medications: ${medList}. Drug interaction analysis: ${interactionSummary}. For each flagged interaction, provide a specific alternative medication recommendation that is genetically safer for this patient's profile. Focus on practical clinical guidance. 3-4 sentences. No bullet points.`,
    supplements: `You are a precision medicine specialist. Patient genetic profile: ${profileSummary}. Based specifically on their MTHFR, COMT, BDNF, and SLC6A4 genotypes, recommend targeted nutritional and supplement interventions to support neurotransmitter function, methylation, and medication efficacy. Be specific about forms (e.g. methylfolate vs folic acid, forms of B12). 3-4 sentences. No bullet points.`,
    lifestyle: `You are a precision medicine specialist focused on lifestyle genomics. Patient genetic profile: ${profileSummary}. Based on their specific genotypes — particularly COMT, BDNF, and SLC6A4 — what are the most evidence-based exercise, stress management, diet, and lifestyle interventions for this specific genetic profile? 3-4 sentences, specific and actionable. No bullet points.`,
  };

  const generate = async () => {
    setLoading(true); setInsight(''); setError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are a board-certified clinical pharmacogenomicist providing precise, evidence-based genetic analysis. Keep responses to 3-4 sentences. Be clinical, specific, and actionable. Never use bullet points, headers, or markdown. Write in clear clinical prose.',
          messages: [{ role: 'user', content: PROMPTS[mode] }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      setInsight(text || 'Unable to generate insight. Please try again.');
    } catch {
      setError('Could not reach the AI service. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const MODES = [
    { key: 'overview',    label: 'Overall Assessment', Icon: Activity  },
    { key: 'medications', label: 'Med Recommendations', Icon: Pill      },
    { key: 'supplements', label: 'Supplements',         Icon: Zap       },
    { key: 'lifestyle',   label: 'Lifestyle Medicine',  Icon: Brain     },
  ];

  return (
    <div style={{ background: 'linear-gradient(135deg, #07091a 0%, #0d1230 100%)', border: `1px solid ${T.blueBd}`, borderRadius: 16, padding: 24, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(91,126,245,.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(91,126,245,.15)', border: `1px solid ${T.blueBd}`, color: '#8cb4ff', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
        <Sparkles size={11} /> AI Pharmacogenomics Analyst
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {MODES.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setMode(key)} style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${mode === key ? 'rgba(91,126,245,.6)' : 'rgba(91,126,245,.2)'}`, background: mode === key ? 'rgba(91,126,245,.2)' : 'transparent', color: mode === key ? '#a8c8ff' : '#6080a0', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all .15s' }}>
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <button onClick={generate} disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${T.blueBd}`, background: 'rgba(91,126,245,.15)', color: '#a8c8ff', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 16, transition: 'all .15s' }}>
        {loading
          ? (<><span style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b7ef5', display: 'inline-block', animation: 'pulse 1.4s infinite', animationDelay: `${i*0.2}s` }} />)}</span> Analysing genetic profile…</>)
          : (<><Sparkles size={14} /> ✦ Generate AI Analysis</>)
        }
      </button>

      {error   && <div style={{ color: '#f88', fontSize: 13, padding: '10px 14px', background: 'rgba(232,80,96,.1)', borderRadius: 8, border: '1px solid rgba(232,80,96,.3)', marginBottom: 12 }}>{error}</div>}
      {insight && <p  style={{ fontSize: 14, lineHeight: 1.8, color: '#a8b8d8', margin: 0 }}>{insight}</p>}
      {!insight && !loading && !error && (
        <div style={{ color: T.text3, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
          Select an analysis mode above and generate personalized pharmacogenomic insights.
        </div>
      )}
    </div>
  );
}

// ─── Recommendations Panel ────────────────────────────────────────────────────
function RecommendationsPanel({ profile, medications }) {
  const recs = useMemo(() => {
    const out = [];

    // CYP2D6 recommendations
    const cyp2d6 = profile.CYP2D6;
    if (cyp2d6 === 'Poor Metabolizer') {
      out.push({ category: 'CYP2D6 Alert', color: T.red, bg: T.redBg, bd: T.redBd, Icon: AlertTriangle, title: 'Avoid CYP2D6-dependent drugs at standard doses', body: 'Fluoxetine, Paroxetine, Risperidone, Codeine, and Amitriptyline accumulate to toxic levels. Use non-CYP2D6 substrates where possible (e.g. Escitalopram, Quetiapine, Acetaminophen for pain).' });
    }
    if (cyp2d6 === 'Ultrarapid Metabolizer') {
      out.push({ category: 'CYP2D6 Alert', color: T.blue, bg: T.blueBg, bd: T.blueBd, Icon: AlertOctagon, title: 'Drugs may be ineffective at standard doses', body: 'Codeine is contraindicated (morphine toxicity risk). SSRIs metabolised by CYP2D6 may fail. Higher doses or alternative pathways required — discuss with prescriber.' });
    }

    // MTHFR recommendations
    const mthfr = profile.MTHFR;
    if (['C677T Homozygous', 'Compound Heterozygous'].includes(mthfr)) {
      out.push({ category: 'MTHFR — Methylation', color: T.amber, bg: T.amberBg, bd: T.amberBd, Icon: Zap, title: 'L-Methylfolate required (not folic acid)', body: 'Standard folic acid cannot be converted efficiently. Supplement with L-methylfolate (5-MTHF) 400–1000 mcg/day. Methylated B12 (methylcobalamin) also recommended. This directly impacts antidepressant efficacy.' });
    } else if (['C677T Heterozygous', 'A1298C Heterozygous'].includes(mthfr)) {
      out.push({ category: 'MTHFR — Methylation', color: T.amber, bg: T.amberBg, bd: T.amberBd, Icon: Zap, title: 'Consider methylated B vitamin supplementation', body: 'Moderate methylation impairment. L-methylfolate 400 mcg/day and methylcobalamin are preferable to standard B vitamins. Monitor homocysteine levels annually.' });
    }

    // SLC6A4 recommendations
    const slc6a4 = profile.SLC6A4;
    if (slc6a4 === 'S/S (Low Expression)') {
      out.push({ category: 'Serotonin Transporter', color: T.red, bg: T.redBg, bd: T.redBd, Icon: Brain, title: 'Reduced SSRI efficacy predicted', body: 'S/S genotype associated with lower SSRI response rates. Consider SNRIs, augmentation strategies, or psychotherapy as primary/adjunct. This genotype also indicates heightened stress-related vulnerability.' });
    }

    // BDNF recommendations
    const bdnf = profile.BDNF;
    if (bdnf === 'Met/Met') {
      out.push({ category: 'BDNF — Neuroplasticity', color: T.purple, bg: T.purpleBg, bd: T.purpleBd, Icon: Brain, title: 'Exercise is critical for treatment response', body: 'Met/Met variant significantly reduces BDNF activity. Aerobic exercise (30 min, 3–5x/week) is essential — it directly upregulates BDNF and potentiates antidepressant response. Omega-3 fatty acids also support BDNF production.' });
    }

    // COMT recommendations
    const comt = profile.COMT;
    if (comt === 'Met/Met (Worrier)') {
      out.push({ category: 'COMT — Dopamine', color: T.amber, bg: T.amberBg, bd: T.amberBd, Icon: Shield, title: 'Stimulants require careful dose titration', body: 'Met/Met has lower COMT activity — dopamine clears slowly in the prefrontal cortex. Stimulant medications may cause anxiety or over-response at standard doses. Start low, titrate slowly. Stress management strategies particularly important.' });
    }

    // Flagged drug interactions
    medications.forEach(med => {
      const analysis = evalDrugRisk(med, profile);
      if (analysis.level === 'high') {
        out.push({ category: 'Drug Interaction', color: T.red, bg: T.redBg, bd: T.redBd, Icon: AlertTriangle, title: `High Risk: ${med}`, body: analysis.reason });
      }
    });

    if (out.length === 0) {
      out.push({ category: 'Overall Assessment', color: T.green, bg: T.greenBg, bd: T.greenBd, Icon: CheckCircle, title: 'No high-risk genetic interactions identified', body: 'Your current genetic profile and medication combination does not show high-risk pharmacogenomic interactions. Continue standard monitoring and regular review with your prescriber.' });
    }

    return out;
  }, [profile, medications]);

  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Shield size={16} color={T.purple} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Clinical Recommendations</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{recs.length} finding{recs.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {recs.map((rec, i) => {
          const Icon = rec.Icon;
          return (
            <div key={i} style={{ background: rec.bg, border: `1px solid ${rec.bd}`, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Icon size={16} color={rec.color} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: rec.color, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{rec.category}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 5 }}>{rec.title}</div>
                  <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.65, margin: 0 }}>{rec.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Report Export ────────────────────────────────────────────────────────────
function exportReport(profile, medications) {
  const lines = [
    'NEUROPULSE PHARMACOGENOMICS REPORT',
    '='.repeat(60),
    `Generated: ${new Date().toLocaleString()}`,
    '',
    'GENETIC PROFILE',
    '-'.repeat(60),
    ...Object.entries(profile).map(([gene, status]) => {
      const info = GENE_DB[gene]?.statuses[status];
      return `${gene}: ${status} (Risk: ${info?.risk ?? '?'}%)\n  ${info?.desc ?? ''}`;
    }),
    '',
    'DRUG INTERACTION ANALYSIS',
    '-'.repeat(60),
    ...(medications.length
      ? medications.map(m => {
          const a = evalDrugRisk(m, profile);
          return `${m}: ${a.level.toUpperCase()}\n  ${a.reason}`;
        })
      : ['No medications listed.']),
    '',
    'DISCLAIMER',
    '-'.repeat(60),
    'This report is for informational purposes only. Always consult a qualified healthcare provider before making any medication changes.',
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `pharmacogenomics-report-${new Date().toISOString().split('T')[0]}.txt`;
  a.click(); URL.revokeObjectURL(a.href);
}

// ─── Style helpers ─────────────────────────────────────────────────────────────
const btnStyle = (color, bg, bd) => ({
  padding: '9px 18px', borderRadius: 8, border: `1px solid ${bd}`, background: bg,
  color, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'all .15s',
});
const btnStyleSm = (color, bg) => ({
  padding: '6px 12px', borderRadius: 8, border: `1px solid ${color}40`, background: bg,
  color, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all .15s',
});

// ─── Root Component ────────────────────────────────────────────────────────────
const Genetics = () => {
  const [profile,      setProfile]      = useState(() => load('genetics_profile', DEFAULT_PROFILE));
  const [medications,  setMedications]  = useState(() => load('genetics_meds',    ['Lithium Carbonate', 'Fluoxetine', 'Aripiprazole']));
  const [hasProfile,   setHasProfile]   = useState(() => !!load('genetics_profile', null));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [expanded,     setExpanded]     = useState(null);
  const [toast,        setToast]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('genes');

  // Persist
  useEffect(() => { if (hasProfile) save('genetics_profile', profile); }, [profile, hasProfile]);
  useEffect(() => save('genetics_meds', medications),    [medications]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  }, []);

  const loadDemo = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setHasProfile(true);
    showToast('Demo genetic profile loaded — 6 genes analysed.', 'success');
  }, [showToast]);

  const clearProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setHasProfile(false);
    setUploadedFile(null);
    localStorage.removeItem('genetics_profile');
    showToast('Profile cleared.', 'info');
  }, [showToast]);

  const TABS = [
    { key: 'genes',    label: 'Gene Profile',        Icon: Dna        },
    { key: 'drugs',    label: 'Drug Interactions',   Icon: Pill       },
    { key: 'recs',     label: 'Recommendations',     Icon: Shield     },
    { key: 'ai',       label: 'AI Analysis',         Icon: Sparkles   },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'DM Sans', system-ui, sans-serif", padding: '0 16px 80px' }}>
      <Toast toast={toast} />

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '28px 0 20px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: T.tealBg, border: `1px solid ${T.tealBd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Dna size={20} color={T.teal} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.5px', margin: 0 }}>Pharmacogenomics & DNA</h1>
            </div>
            <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>Optimise your medication based on your genetic profile.</p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {hasProfile && (
              <button onClick={() => exportReport(profile, medications)} style={btnStyleSm(T.teal, T.tealBg)}>
                <Download size={13} /> Export Report
              </button>
            )}
          </div>
        </div>

        {/* Upload panel */}
        <UploadPanel
          hasProfile={hasProfile} onLoadDemo={loadDemo} onClear={clearProfile}
          uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} setToast={showToast}
        />

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 4, background: T.bg3, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 4, marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, minWidth: 100, padding: '9px 14px', borderRadius: 8, border: activeTab === key ? `1px solid ${T.tealBd}` : 'none', background: activeTab === key ? T.tealBg : 'transparent', color: activeTab === key ? T.teal : T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', whiteSpace: 'nowrap' }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'genes' && (
          <GenePanel profile={profile} setProfile={p => { setProfile(p); setHasProfile(true); }} expanded={expanded} setExpanded={setExpanded} />
        )}
        {activeTab === 'drugs' && (
          <InteractionPanel profile={profile} medications={medications} setMedications={setMedications} />
        )}
        {activeTab === 'recs' && (
          <RecommendationsPanel profile={profile} medications={medications} />
        )}
        {activeTab === 'ai' && (
          <AIPanel profile={profile} medications={medications} />
        )}

        {/* Disclaimer */}
        <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={14} color={T.text3} style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: T.text3, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: T.text2 }}>Medical Disclaimer:</strong> This pharmacogenomics dashboard is for informational and educational purposes only. Results are not diagnostic and should not be used to make medication decisions without consultation with a qualified healthcare provider, clinical pharmacist, or genetic counsellor. Always discuss genetic findings with your treating physician before making any changes to your medication regimen.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        button { cursor: pointer; user-select: none; font-family: inherit; }
        input  { outline: none; font-family: inherit; }
        input::placeholder { color: #4a5878; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 80%, 100% { opacity: .3; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
        @media (max-width: 700px) {
          .gene-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Genetics;
