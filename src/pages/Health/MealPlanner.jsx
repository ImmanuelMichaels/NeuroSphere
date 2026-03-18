import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UtensilsCrossed, Clock, Leaf, Heart, ChevronDown, ChevronUp,
  CheckCircle2, Info, Plus, Minus, Trash2, BookOpen, X,
  TrendingUp, Search, ShoppingCart, Sparkles, BarChart3, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend,
} from 'recharts';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseFraction = (str) => {
  if (!str) return null;
  str = str.trim();
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)(.*)/);
  if (mixed) return { value: +mixed[1] + +mixed[2] / +mixed[3], rest: mixed[4] };
  const frac = str.match(/^(\d+)\/(\d+)(.*)/);
  if (frac)  return { value: +frac[1] / +frac[2], rest: frac[3] };
  const num  = str.match(/^(\d+\.?\d*)(.*)/);
  if (num)   return { value: +num[1], rest: num[2] };
  return null;
};

const fmtFrac = (v) => {
  const FRACS = [[3/4,'¾'],[2/3,'⅔'],[1/2,'½'],[1/3,'⅓'],[1/4,'¼']];
  const whole = Math.floor(v), dec = v - whole;
  for (const [f, sym] of FRACS) if (Math.abs(dec - f) < 0.04) return whole ? `${whole} ${sym}` : sym;
  return v % 1 === 0 ? String(v) : v.toFixed(1).replace(/\.0$/, '');
};

const scaleIngredient = (s, factor) => {
  if (factor === 1) return s;
  const p = parseFraction(s);
  if (!p) return s;
  return `${fmtFrac(p.value * factor)}${p.rest}`;
};

const parseNum = (str) => {
  if (!str) return null;
  const m = str.match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : null;
};

const load = (k, fb) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ─── Diet Profiles ────────────────────────────────────────────────────────────
const DIETS = {
  dash: {
    key: 'dash',
    name: 'DASH Diet',
    desc: 'Dietary Approaches to Stop Hypertension',
    focus: 'Low sodium, rich in potassium, calcium & magnesium',
    Icon: Heart,
    hex: '#d4956a',
    bg: 'rgba(212,149,106,.12)',
    border: 'rgba(212,149,106,.3)',
    goals: { calories: 2000, protein: 80, carbs: 250, fat: 65 },
  },
  lowGlycemic: {
    key: 'lowGlycemic',
    name: 'Low-Glycemic',
    desc: 'Blood sugar management',
    focus: 'Slow-release carbohydrates, high fiber, controlled portions',
    Icon: Leaf,
    hex: '#5aab8f',
    bg: 'rgba(90,171,143,.12)',
    border: 'rgba(90,171,143,.3)',
    goals: { calories: 1800, protein: 90, carbs: 180, fat: 60 },
  },
};

// ─── Meal Data ────────────────────────────────────────────────────────────────
const MEALS = {
  dash: {
    breakfast: [
      { id:1,  name:'Oatmeal Power Bowl',        desc:'Steel-cut oats with berries and almonds',     base:1, unit:'bowl',       prep:10, cal:320, protein:'8g',  carbs:'52g', fat:'9g',  sodium:'50mg',  potassium:'450mg', highlight:'High fiber, low sodium, potassium-rich',         ingredients:['½ cup steel-cut oats','1 cup unsweetened almond milk','¼ cup fresh blueberries','1 tbsp sliced almonds','½ banana, sliced','Cinnamon to taste'] },
      { id:2,  name:'Veggie Egg White Scramble', desc:'Spinach, tomatoes, and bell peppers',         base:1, unit:'plate',      prep:15, cal:210, protein:'22g', carbs:'18g', fat:'3g',  sodium:'120mg', potassium:'520mg', highlight:'High protein, low fat, vegetable-rich',          ingredients:['3 egg whites','1 cup fresh spinach','½ cup cherry tomatoes','¼ cup bell peppers, diced','1 slice whole grain toast','Black pepper and herbs'] },
    ],
    lunch: [
      { id:3,  name:'Quinoa Buddha Bowl',         desc:'Colorful vegetables with tahini dressing',   base:1, unit:'large bowl', prep:20, cal:480, protein:'18g', carbs:'62g', fat:'16g', sodium:'180mg', potassium:'680mg', highlight:'Complete protein, high fiber, heart-healthy fats', ingredients:['¾ cup cooked quinoa','1 cup roasted vegetables (carrots, broccoli, bell peppers)','½ cup chickpeas','2 tbsp tahini dressing','Fresh herbs and lemon','¼ avocado, sliced'] },
      { id:4,  name:'Grilled Salmon Salad',       desc:'Omega-3 rich fish with mixed greens',        base:1, unit:'large plate',prep:25, cal:390, protein:'34g', carbs:'12g', fat:'22g', sodium:'150mg', potassium:'750mg', highlight:'Omega-3 fatty acids, low sodium, anti-inflammatory',ingredients:['4 oz grilled salmon','2 cups mixed greens','½ cup cucumber, sliced','¼ cup red onion','1 tbsp olive oil','Lemon juice and herbs'] },
    ],
    dinner: [
      { id:5,  name:'Herb-Roasted Chicken',       desc:'Skinless chicken with roasted vegetables',   base:1, unit:'plate',      prep:35, cal:420, protein:'42g', carbs:'28g', fat:'12g', sodium:'140mg', potassium:'620mg', highlight:'Lean protein, potassium-rich, low sodium',        ingredients:['4 oz skinless chicken breast','1 cup roasted Brussels sprouts','½ cup roasted sweet potato','Fresh rosemary and thyme','1 tsp olive oil','Garlic and black pepper'] },
      { id:10, name:'Turkey & Veggie Stir-Fry',   desc:'Lean ground turkey with seasonal vegetables',base:1, unit:'plate',      prep:25, cal:380, protein:'38g', carbs:'24g', fat:'14g', sodium:'200mg', potassium:'580mg', highlight:'High lean protein, colorful vegetables, heart-healthy',ingredients:['4 oz lean ground turkey','1 cup broccoli florets','½ cup snap peas','¼ cup bell peppers','1 tsp sesame oil','Low-sodium soy sauce & ginger'] },
    ],
  },
  lowGlycemic: {
    breakfast: [
      { id:6,  name:'Greek Yogurt Parfait',       desc:'Unsweetened yogurt with nuts and berries',   base:1, unit:'bowl',       prep:5,  cal:280, protein:'20g', carbs:'22g', fat:'11g', gi:'Low (GI: 35)',      fiber:'6g',  highlight:'High protein, low sugar, sustained energy',     ingredients:['1 cup plain Greek yogurt (unsweetened)','¼ cup mixed berries (strawberries, raspberries)','2 tbsp chopped walnuts','1 tbsp chia seeds','½ tsp vanilla extract','Optional: stevia to taste'] },
      { id:7,  name:'Almond Butter Toast',        desc:'Whole grain bread with healthy fats',        base:2, unit:'slices',     prep:5,  cal:340, protein:'12g', carbs:'38g', fat:'16g', gi:'Low (GI: 42)',      fiber:'8g',  highlight:'Balanced macros, slow-release energy',          ingredients:['2 slices whole grain bread','2 tbsp natural almond butter','½ apple, sliced thin','Cinnamon sprinkle','Optional: hemp seeds'] },
    ],
    lunch: [
      { id:8,  name:'Lentil & Veggie Soup',       desc:'Protein-rich legumes with vegetables',       base:2, unit:'cups',       prep:30, cal:310, protein:'18g', carbs:'48g', fat:'4g',  gi:'Low (GI: 32)',      fiber:'12g', highlight:'High fiber, plant protein, filling',            ingredients:['1 cup cooked green lentils','1 cup diced tomatoes','½ cup carrots, diced','½ cup celery','2 cups low-sodium vegetable broth','Cumin, turmeric, and bay leaf'] },
      { id:11, name:'Chickpea Avocado Bowl',       desc:'Fiber-rich legumes with healthy fats',       base:1, unit:'bowl',       prep:10, cal:420, protein:'16g', carbs:'44g', fat:'22g', gi:'Low (GI: 28)',      fiber:'14g', highlight:'Very high fiber, slow digestion, satisfying',    ingredients:['¾ cup canned chickpeas, drained','½ avocado, cubed','1 cup baby spinach','¼ cup cherry tomatoes','1 tbsp olive oil','Lemon, cumin & paprika'] },
    ],
    dinner: [
      { id:9,  name:'Cauliflower Rice Stir-Fry',  desc:'Low-carb alternative with lean protein',     base:1, unit:'large bowl', prep:20, cal:360, protein:'28g', carbs:'22g', fat:'16g', gi:'Very Low (GI: 15)', fiber:'5g',  highlight:'Very low glycemic, high volume, nutrient-dense', ingredients:['2 cups riced cauliflower','4 oz tofu or chicken','1 cup mixed vegetables (broccoli, snap peas, carrots)','1 tbsp sesame oil','2 tbsp low-sodium soy sauce','Ginger and garlic'] },
      { id:12, name:'Baked Cod & Roasted Veg',    desc:'Lean white fish with Mediterranean vegetables',base:1,unit:'plate',     prep:30, cal:310, protein:'32g', carbs:'18g', fat:'10g', gi:'Low (GI: 30)',      fiber:'6g',  highlight:'Lean protein, anti-inflammatory, low GI',       ingredients:['5 oz cod fillet','1 cup zucchini, sliced','½ cup cherry tomatoes','¼ cup olives','2 tbsp olive oil','Lemon, oregano & garlic'] },
    ],
  },
};

const ALL_MEALS_FLAT = Object.values(MEALS).flatMap(d => Object.values(d).flat());
const findDiet = (mealId) =>
  Object.keys(MEALS).find(dk => Object.values(MEALS[dk]).flat().some(m => m.id === mealId)) ?? 'dash';

// ─── Shared styles (tokens) ───────────────────────────────────────────────────
const T = {
  bg:      '#06070d', bg2: '#0b0d18', bg3: '#0f1220', bg4: '#141728',
  border:  '#1a1f35', border2: '#222840', border3: '#2a3050',
  text:    '#dde6f5', text2: '#8898b8', text3: '#4a5878', text4: '#2a3248',
  green: '#2ecc8f', greenBg: 'rgba(46,204,143,.12)', greenBorder: 'rgba(46,204,143,.3)',
  red:   '#e85060', redBg:   'rgba(232,80,96,.12)',   redBorder:   'rgba(232,80,96,.3)',
  blue:  '#5b7ef5', blueBg:  'rgba(91,126,245,.12)',  blueBorder:  'rgba(91,126,245,.3)',
};

// ─── ServingsControl ──────────────────────────────────────────────────────────
function ServingsControl({ servings, onDec, onInc, hex, bg }) {
  const btnBase = {
    width: 30, height: 30, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    transition: 'all .15s', border: `1.5px solid ${hex}`, flexShrink: 0,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      <button
        onClick={e => { e.stopPropagation(); onDec(); }}
        disabled={servings <= 1}
        style={{ ...btnBase, background: servings <= 1 ? T.bg4 : bg, borderColor: servings <= 1 ? T.border3 : hex, color: servings <= 1 ? T.text3 : hex }}
      >
        <Minus size={12} />
      </button>
      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800, fontSize: 16, color: hex, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
        {servings}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onInc(); }}
        disabled={servings >= 12}
        style={{ ...btnBase, background: servings >= 12 ? T.bg4 : bg, borderColor: servings >= 12 ? T.border3 : hex, color: servings >= 12 ? T.text3 : hex }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

// ─── NutritionBar ─────────────────────────────────────────────────────────────
function NutritionBar({ label, value, max, color, unit = '' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: T.text2 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, fontFamily: 'monospace' }}>{value}{unit}</span>
      </div>
      <div style={{ height: 5, background: T.bg4, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const colors = { success: [T.greenBg, T.greenBorder, T.green], error: [T.redBg, T.redBorder, T.red], info: [T.blueBg, T.blueBorder, T.blue] };
  const [bg, border, color] = colors[toast.type] ?? colors.info;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: bg, border: `1px solid ${border}`, color, padding: '11px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,.4)', animation: 'toastIn .2s ease' }}>
      {toast.type === 'success' ? <CheckCircle2 size={14} /> : toast.type === 'error' ? <X size={14} /> : <Info size={14} />}
      {toast.msg}
    </div>
  );
}

// ─── MealCard ─────────────────────────────────────────────────────────────────
function MealCard({ meal, diet, servings, saved, expanded, onToggleExpand, onServInc, onServDec, onToggleSave }) {
  const factor     = servings / meal.base;
  const scaledCal  = Math.round((meal.cal || 0) * factor);

  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${saved ? diet.border : T.border}`, marginBottom: 12, overflow: 'hidden', boxShadow: saved ? `0 0 0 3px ${diet.hex}14` : 'none', transition: 'border-color .2s, box-shadow .2s' }}>

      {/* Header */}
      <button onClick={() => onToggleExpand(meal.id)} style={{ width: '100%', background: 'none', border: 'none', padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: diet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UtensilsCrossed size={22} color={diet.hex} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{meal.name}</span>
            {saved && <CheckCircle2 size={14} color={diet.hex} />}
          </div>
          <p style={{ color: T.text2, fontSize: 12, margin: '0 0 8px', lineHeight: 1.4 }}>{meal.desc}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: `${meal.prep} min`, icon: <Clock size={10} /> },
              { label: `${scaledCal} kcal`, bg: diet.bg, color: diet.hex, bold: true },
              { label: `${servings} ${servings === 1 ? meal.unit : meal.unit + 's'}` },
            ].map(({ label, icon, bg, color, bold }, i) => (
              <span key={i} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 99, background: bg ?? T.bg4, color: color ?? T.text2, border: `1px solid ${bg ? diet.border : T.border2}`, fontWeight: bold ? 700 : 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                {icon}{label}
              </span>
            ))}
          </div>
        </div>
        {expanded ? <ChevronUp size={17} color={T.text3} /> : <ChevronDown size={17} color={T.text3} />}
      </button>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 16px 18px', borderTop: `1px solid ${T.border}` }}>

          {/* Servings adjuster */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Adjust Servings</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Ingredients scale automatically</div>
            </div>
            <ServingsControl servings={servings} onDec={onServDec} onInc={onServInc} hex={diet.hex} bg={diet.bg} />
          </div>

          {/* Macros */}
          <div style={{ background: T.bg2, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <TrendingUp size={13} color={diet.hex} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Nutrition · {servings} serving{servings > 1 ? 's' : ''}
              </span>
            </div>
            <NutritionBar label="Calories" value={scaledCal}                                                         max={900}  color={diet.hex}  unit=" kcal" />
            <NutritionBar label="Protein"  value={Math.round((parseNum(meal.protein) || 0) * factor)}                max={60}   color="#5aab8f"  unit="g"     />
            <NutritionBar label="Carbs"    value={Math.round((parseNum(meal.carbs)   || 0) * factor)}                max={100}  color="#9b7cf0"  unit="g"     />
            <NutritionBar label="Fat"      value={Math.round((parseNum(meal.fat)     || 0) * factor)}                max={60}   color="#f0a830"  unit="g"     />

            {diet.key === 'dash' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {[['Sodium', meal.sodium, '#e85060'], ['Potassium', meal.potassium, '#2ecc8f']].map(([lbl, val, clr]) => (
                  <div key={lbl} style={{ textAlign: 'center', background: T.bg3, borderRadius: 8, padding: '8px 6px' }}>
                    <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: clr, fontFamily: 'monospace' }}>
                      {val ? `${Math.round((parseNum(val) || 0) * factor)}mg` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {diet.key === 'lowGlycemic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                {[['Glycemic Index', meal.gi ?? '—'], ['Fiber', meal.fiber ? `${Math.round((parseNum(meal.fiber) || 0) * factor)}g` : '—']].map(([lbl, val]) => (
                  <div key={lbl} style={{ textAlign: 'center', background: T.bg3, borderRadius: 8, padding: '8px 6px' }}>
                    <div style={{ fontSize: 10, color: T.text3, marginBottom: 2 }}>{lbl}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highlight */}
          <div style={{ display: 'flex', gap: 8, background: diet.bg, border: `1px solid ${diet.border}`, borderRadius: 8, padding: 12, marginBottom: 14 }}>
            <Info size={13} color={diet.hex} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>{meal.highlight}</span>
          </div>

          {/* Ingredients */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              Ingredients
              {factor !== 1 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: diet.hex, background: diet.bg, border: `1px solid ${diet.border}`, borderRadius: 99, padding: '2px 8px' }}>
                  ×{factor % 1 === 0 ? factor : factor.toFixed(1)} scaled
                </span>
              )}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {meal.ingredients.map((ing, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.text2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: diet.hex, flexShrink: 0 }} />
                  {scaleIngredient(ing, factor)}
                </li>
              ))}
            </ul>
          </div>

          {/* Save button */}
          <button
            onClick={() => onToggleSave(meal)}
            style={{ width: '100%', padding: 12, borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s', background: saved ? T.redBg : 'transparent', color: saved ? T.red : diet.hex, border: `2px solid ${saved ? T.red : diet.hex}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saved ? <><Trash2 size={15} /> Remove from Meal Plan</> : <><Plus size={15} /> Add to Meal Plan</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── BrowsePanel ──────────────────────────────────────────────────────────────
function BrowsePanel({ diet, setDiet, mealTime, setMealTime, savedMeals, servings, expanded, onToggleExpand, onServInc, onServDec, onToggleSave, search, setSearch }) {
  const d = DIETS[diet];
  const meals = MEALS[diet][mealTime] ?? [];
  const filtered = search.trim()
    ? meals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.desc.toLowerCase().includes(search.toLowerCase()))
    : meals;

  return (
    <div>
      {/* Diet selector */}
      <p style={sectionLabel}>Diet Profile</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {Object.values(DIETS).map(dp => {
          const active = diet === dp.key;
          const Icon = dp.Icon;
          return (
            <button key={dp.key} onClick={() => setDiet(dp.key)} style={{ background: active ? dp.bg : T.bg3, border: `2px solid ${active ? dp.hex : T.border}`, borderRadius: 16, padding: 16, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', boxShadow: active ? `0 0 0 3px ${dp.hex}18` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: active ? `${dp.hex}25` : T.bg4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={dp.hex} />
                </div>
                {active && <CheckCircle2 size={15} color={dp.hex} style={{ marginLeft: 'auto' }} />}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{dp.name}</div>
              <div style={{ fontSize: 11, color: T.text2 }}>{dp.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Meal time tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['breakfast', 'lunch', 'dinner'].map(t => (
          <button key={t} onClick={() => { setMealTime(t); }} style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all .15s', background: mealTime === t ? d.bg : T.bg3, color: mealTime === t ? d.hex : T.text2, border: `1.5px solid ${mealTime === t ? d.hex : T.border}` }}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={14} color={T.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search meals…"
          style={{ width: '100%', paddingLeft: 36, padding: '10px 14px 10px 36px', background: T.bg2, border: `1px solid ${T.border2}`, borderRadius: 8, color: T.text, fontSize: 14, outline: 'none' }}
        />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.text3, cursor: 'pointer', display: 'flex' }}><X size={14} /></button>}
      </div>

      {/* Cards */}
      {filtered.length === 0
        ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: T.bg3, borderRadius: 16, border: `1px dashed ${T.border2}` }}>
            <Search size={28} color={T.text4} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: T.text2 }}>No meals match "{search}"</div>
          </div>
        )
        : filtered.map(m => (
          <MealCard
            key={m.id} meal={m} diet={d}
            servings={servings[m.id] ?? m.base}
            saved={!!savedMeals[m.id]}
            expanded={expanded === m.id}
            onToggleExpand={onToggleExpand}
            onServInc={() => onServInc(m)}
            onServDec={() => onServDec(m)}
            onToggleSave={() => onToggleSave(m)}
          />
        ))
      }
    </div>
  );
}

// ─── PlanPanel ────────────────────────────────────────────────────────────────
function PlanPanel({ savedMeals, onRemove, onServInc, onServDec, onClearAll, onBrowse, dailyTotals }) {
  const entries = Object.values(savedMeals);
  const goals = { calories: 2000, protein: 80, carbs: 230, fat: 65 };

  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bg3, borderRadius: 20, border: `1px dashed ${T.border2}` }}>
      <BookOpen size={40} color={T.text4} style={{ marginBottom: 12 }} />
      <h3 style={{ color: T.text2, fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>No meals saved yet</h3>
      <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Browse meals and tap "Add to Meal Plan" to build your day.</p>
      <button onClick={onBrowse} style={primaryBtn('#5b7ef5', T.blueBg, T.blueBorder)}>Browse Meals</button>
    </div>
  );

  return (
    <div>
      {/* Macro totals */}
      <div style={{ background: 'linear-gradient(135deg, #07091a, #0d1530)', border: `1px solid ${T.blueBorder}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <TrendingUp size={14} color={T.blue} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '.06em' }}>Daily Totals</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Calories', val: dailyTotals.calories, unit: 'kcal', color: '#d4956a', goal: goals.calories },
            { label: 'Protein',  val: dailyTotals.protein,  unit: 'g',    color: '#5aab8f', goal: goals.protein  },
            { label: 'Carbs',    val: dailyTotals.carbs,    unit: 'g',    color: '#9b7cf0', goal: goals.carbs    },
            { label: 'Fat',      val: dailyTotals.fat,      unit: 'g',    color: '#f0a830', goal: goals.fat      },
          ].map(({ label, val, unit, color, goal }) => (
            <div key={label} style={{ background: T.bg3, borderRadius: 12, padding: '12px 8px', textAlign: 'center', border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace', letterSpacing: '-.5px' }}>{val}</div>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 3 }}>{label} / {goal}{unit}</div>
            </div>
          ))}
        </div>
        {[
          { label: 'Calories', val: dailyTotals.calories, max: 2000, color: '#d4956a', unit: ' kcal' },
          { label: 'Protein',  val: dailyTotals.protein,  max: 80,   color: '#5aab8f', unit: 'g'    },
          { label: 'Carbs',    val: dailyTotals.carbs,    max: 230,  color: '#9b7cf0', unit: 'g'    },
          { label: 'Fat',      val: dailyTotals.fat,      max: 65,   color: '#f0a830', unit: 'g'    },
        ].map(n => <NutritionBar key={n.label} {...n} />)}
      </div>

      {/* Saved list */}
      <p style={sectionLabel}>Saved Meals ({entries.length})</p>
      {entries.map(({ meal, servings }) => {
        const dietKey = findDiet(meal.id);
        const d = DIETS[dietKey];
        const factor = servings / meal.base;
        const scaledCal = Math.round((meal.cal || 0) * factor);
        return (
          <div key={meal.id} style={{ background: T.bg3, borderRadius: 12, padding: '14px 16px', marginBottom: 10, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UtensilsCrossed size={20} color={d.hex} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
              <div style={{ fontSize: 12, color: T.text2, marginTop: 2 }}>{scaledCal} kcal · {meal.prep} min</div>
            </div>
            <ServingsControl servings={servings} onDec={() => onServDec(meal.id)} onInc={() => onServInc(meal.id)} hex={d.hex} bg={d.bg} />
            <button onClick={() => onRemove(meal.id)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border3}`, background: T.bg2, color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      <button onClick={onClearAll} style={{ width: '100%', padding: 12, borderRadius: 12, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}`, fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Trash2 size={14} /> Clear All Meals
      </button>
    </div>
  );
}

// ─── AnalyticsPanel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ savedMeals, dailyTotals }) {
  const entries = Object.values(savedMeals);
  const goals = { calories: 2000, protein: 80, carbs: 230, fat: 65 };

  const radarData = [
    { subject: 'Calories', value: Math.min((dailyTotals.calories / goals.calories) * 100, 100), fullMark: 100 },
    { subject: 'Protein',  value: Math.min((dailyTotals.protein  / goals.protein)  * 100, 100), fullMark: 100 },
    { subject: 'Carbs',    value: Math.min((dailyTotals.carbs    / goals.carbs)    * 100, 100), fullMark: 100 },
    { subject: 'Fat',      value: Math.min((dailyTotals.fat      / goals.fat)      * 100, 100), fullMark: 100 },
  ];

  const barData = entries.map(({ meal, servings }) => {
    const f = servings / meal.base;
    return {
      name:     meal.name.split(' ').slice(0, 2).join(' '),
      Calories: Math.round((meal.cal || 0) * f),
      Protein:  Math.round((parseNum(meal.protein) || 0) * f),
      Carbs:    Math.round((parseNum(meal.carbs)   || 0) * f),
      Fat:      Math.round((parseNum(meal.fat)     || 0) * f),
    };
  });

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#0d1220', border: `1px solid ${T.border2}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <p style={{ color: T.text, fontWeight: 700, marginBottom: 6 }}>{label}</p>
        {payload.map(p => <p key={p.dataKey} style={{ color: p.fill, margin: '2px 0' }}>{p.dataKey}: {p.value}</p>)}
      </div>
    );
  };

  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bg3, borderRadius: 16, border: `1px dashed ${T.border2}` }}>
      <BarChart3 size={36} color={T.text4} style={{ marginBottom: 12 }} />
      <h3 style={{ color: T.text2, fontWeight: 700, margin: '0 0 6px' }}>No data yet</h3>
      <p style={{ color: T.text3, fontSize: 13 }}>Add meals to your plan to see analytics.</p>
    </div>
  );

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Calories', val: dailyTotals.calories, unit: 'kcal', color: '#d4956a' },
          { label: 'Protein',  val: dailyTotals.protein,  unit: 'g',    color: '#5aab8f' },
          { label: 'Carbs',    val: dailyTotals.carbs,    unit: 'g',    color: '#9b7cf0' },
          { label: 'Fat',      val: dailyTotals.fat,      unit: 'g',    color: '#f0a830' },
        ].map(s => (
          <div key={s.label} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'monospace', letterSpacing: '-.5px' }}>{s.val}<span style={{ fontSize: 13, fontWeight: 400, color: T.text2, marginLeft: 2 }}>{s.unit}</span></div>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <p style={sectionLabel}>Macros Per Meal</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: T.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.text3, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: T.text2 }} />
              <Bar dataKey="Calories" fill="#d4956a" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Protein"  fill="#5aab8f" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Carbs"    fill="#9b7cf0" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Fat"      fill="#f0a830" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar */}
      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <p style={sectionLabel}>Goal Completion (%)</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: T.text2, fontSize: 12 }} />
              <Radar name="% of Goal" dataKey="value" stroke="#5b7ef5" fill="#5b7ef5" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── ShoppingPanel ────────────────────────────────────────────────────────────
function ShoppingPanel({ savedMeals, checked, setChecked }) {
  const entries = Object.values(savedMeals);

  const items = useMemo(() => {
    const map = {};
    entries.forEach(({ meal, servings }) => {
      const factor = servings / meal.base;
      meal.ingredients.forEach(ing => {
        const key = ing.replace(/^[\d\s½¼¾⅓⅔\/\.]+/, '').trim().toLowerCase().split(',')[0].split('(')[0].trim();
        if (!map[key]) map[key] = { display: scaleIngredient(ing, factor), key };
      });
    });
    return Object.values(map);
  }, [savedMeals]);

  if (entries.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bg3, borderRadius: 16, border: `1px dashed ${T.border2}` }}>
      <ShoppingCart size={36} color={T.text4} style={{ marginBottom: 12 }} />
      <h3 style={{ color: T.text2, fontWeight: 700, margin: '0 0 6px' }}>No items yet</h3>
      <p style={{ color: T.text3, fontSize: 13 }}>Save meals to auto-generate your shopping list.</p>
    </div>
  );

  const done = items.filter(i => checked[i.key]).length;

  const exportList = () => {
    const text = items.map(i => `${checked[i.key] ? '✓' : '□'} ${i.display}`).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('NeuroPulse Shopping List\n\n' + text);
    a.download = 'shopping-list.txt';
    a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={sectionLabel}>Shopping List</p>
          <div style={{ fontSize: 12, color: T.text3 }}>{done} / {items.length} items checked</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done > 0 && (
            <button onClick={() => setChecked({})} style={ghostBtn}>
              <RefreshCw size={12} /> Reset
            </button>
          )}
          <button onClick={exportList} style={ghostBtn}>
            <BookOpen size={12} /> Export
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: T.bg4, borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((done / items.length) * 100)}%`, background: T.green, borderRadius: 99, transition: 'width .4s ease' }} />
      </div>

      {items.map(item => (
        <div
          key={item.key}
          onClick={() => setChecked(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg2, marginBottom: 8, fontSize: 13, color: T.text2, cursor: 'pointer', opacity: checked[item.key] ? 0.6 : 1, textDecoration: checked[item.key] ? 'line-through' : 'none', transition: 'opacity .15s' }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${checked[item.key] ? T.green : T.border3}`, background: checked[item.key] ? T.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
            {checked[item.key] && <CheckCircle2 size={11} color="#fff" />}
          </div>
          {item.display}
        </div>
      ))}
    </div>
  );
}

// ─── AIInsightsPanel ──────────────────────────────────────────────────────────
function AIInsightsPanel({ savedMeals, dailyTotals, diet }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode]       = useState('nutrition');
  const [error, setError]     = useState('');

  const entries    = Object.values(savedMeals);
  const d          = DIETS[diet];
  const mealSummary = entries.map(({ meal, servings }) => {
    const f = servings / meal.base;
    return `${meal.name} (${servings} serving${servings > 1 ? 's' : ''}, ${Math.round((meal.cal || 0) * f)} kcal, ${Math.round((parseNum(meal.protein) || 0) * f)}g protein)`;
  }).join('; ') || '(no meals planned yet)';

  const PROMPTS = {
    nutrition: `You are a clinical nutritionist specializing in the ${d.name} diet. The patient has planned today's meals: ${mealSummary}. Total: ${dailyTotals.calories} kcal, ${dailyTotals.protein}g protein, ${dailyTotals.carbs}g carbs, ${dailyTotals.fat}g fat. Provide a concise evidence-based nutritional analysis in 3-4 sentences. Comment on balance, any notable gaps, and one specific optimization tip. Be warm and specific. No bullet points or headers.`,
    timing:    `You are a sports dietitian. Based on these meals: ${mealSummary}. Provide specific meal timing and spacing recommendations for optimal energy, blood sugar stability, and metabolic health throughout the day. Focus on when to eat these specific meals. 3-4 sentences, practical and specific. No bullet points.`,
    suggest:   `You are a ${d.name} specialist. Current plan: ${mealSummary}. Macros: ${dailyTotals.calories} kcal, ${dailyTotals.protein}g protein, ${dailyTotals.carbs}g carbs. Identify what the plan is missing and suggest 2 specific additional foods or meals that would complement it perfectly. Be concrete and actionable. 3-4 sentences. No bullet points.`,
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
          system: 'You are an expert clinical dietitian. Keep responses to 3-4 sentences. Be specific, warm, and actionable. Never use bullet points or headers.',
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
    { key: 'nutrition', label: 'Nutritional Analysis', Icon: TrendingUp },
    { key: 'timing',    label: 'Meal Timing',          Icon: Clock       },
    { key: 'suggest',   label: 'What to Add',          Icon: Sparkles    },
  ];

  return (
    <div>
      {/* AI surface */}
      <div style={{ background: 'linear-gradient(135deg, #07091a 0%, #0d1230 100%)', border: `1px solid ${T.blueBorder}`, borderRadius: 16, padding: 24, marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(91,126,245,.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(91,126,245,.15)', border: `1px solid ${T.blueBorder}`, color: '#8cb4ff', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
          <Sparkles size={11} /> AI Nutrition Analyst
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {MODES.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setMode(key)} style={{ padding: '6px 14px', borderRadius: 99, border: `1px solid ${mode === key ? 'rgba(91,126,245,.6)' : 'rgba(91,126,245,.2)'}`, background: mode === key ? 'rgba(91,126,245,.2)' : 'transparent', color: mode === key ? '#a8c8ff' : '#6080a0', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all .15s' }}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>

        {/* Generate */}
        <button onClick={generate} disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${T.blueBorder}`, background: 'rgba(91,126,245,.15)', color: '#a8c8ff', fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 16, transition: 'all .15s' }}>
          {loading
            ? (<><span style={{ display: 'flex', gap: 5 }}>{[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b7ef5', display: 'inline-block', animation: 'pulse 1.4s infinite', animationDelay: `${i * 0.2}s` }} />)}</span> Analyzing your plan…</>)
            : (<><Sparkles size={14} /> ✦ Generate AI Insight</>)
          }
        </button>

        {error   && <div style={{ color: '#f88', fontSize: 13, padding: '10px 14px', background: 'rgba(232,80,96,.1)', borderRadius: 8, border: '1px solid rgba(232,80,96,.3)' }}>{error}</div>}
        {insight && <p style={{ fontSize: 14, lineHeight: 1.75, color: '#a8b8d8', margin: 0 }}>{insight}</p>}
        {!insight && !loading && !error && (
          <div style={{ color: T.text3, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
            {entries.length === 0 ? 'Add meals to your plan first, then generate personalized AI insights.' : 'Select a topic above and click Generate AI Insight for personalized guidance.'}
          </div>
        )}
      </div>

      {/* Context summary */}
      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
        <p style={sectionLabel}>Current Plan Summary</p>
        {entries.length === 0
          ? <p style={{ color: T.text3, fontSize: 13 }}>No meals saved yet.</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(({ meal, servings }) => {
                const dp = DIETS[findDiet(meal.id)];
                const cal = Math.round((meal.cal || 0) * (servings / meal.base));
                return (
                  <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dp.hex, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: T.text2 }}>{meal.name}</span>
                    <span style={{ fontSize: 12, color: dp.hex, fontFamily: 'monospace', fontWeight: 600 }}>{cal} kcal</span>
                  </div>
                );
              })}
              <div style={{ height: 1, background: T.border, margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#d4956a', fontFamily: 'monospace' }}>{dailyTotals.calories} kcal</span>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const sectionLabel = { fontSize: 11, fontWeight: 700, color: '#4a5878', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 };
const primaryBtn   = (color, bg, border) => ({ padding: '10px 24px', borderRadius: 99, background: bg, color, border: `1px solid ${border}`, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 });
const ghostBtn     = { padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border2}`, background: T.bg4, color: T.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 };

// ─── Root component ───────────────────────────────────────────────────────────
const MealPlanner = () => {
  const [panel,     setPanel]     = useState('browse');
  const [diet,      setDiet]      = useState(() => load('mp_diet', 'dash'));
  const [mealTime,  setMealTime]  = useState('breakfast');
  const [expanded,  setExpanded]  = useState(null);
  const [search,    setSearch]    = useState('');

  // savedMeals: { [id]: { meal, servings } }
  const [savedMeals,  setSavedMeals]  = useState(() => load('mp_saved', {}));
  const [servings,    setServings]    = useState(() => load('mp_servings', {}));
  const [toast,       setToast]       = useState(null);
  const [checked,     setChecked]     = useState({});

  // Persist
  useEffect(() => save('mp_diet',     diet),      [diet]);
  useEffect(() => save('mp_saved',    savedMeals),[savedMeals]);
  useEffect(() => save('mp_servings', servings),  [servings]);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  // Daily totals
  const dailyTotals = useMemo(() => {
    let cal = 0, pro = 0, car = 0, fat = 0;
    Object.values(savedMeals).forEach(({ meal, servings: sv }) => {
      const f = sv / meal.base;
      cal += (meal.cal || 0) * f;
      pro += (parseNum(meal.protein) || 0) * f;
      car += (parseNum(meal.carbs)   || 0) * f;
      fat += (parseNum(meal.fat)     || 0) * f;
    });
    return { calories: Math.round(cal), protein: Math.round(pro), carbs: Math.round(car), fat: Math.round(fat) };
  }, [savedMeals]);

  // Servings handlers
  const onServInc = useCallback((meal) => {
    setServings(prev => {
      const next = Math.min((prev[meal.id] ?? meal.base) + 1, 12);
      if (savedMeals[meal.id]) setSavedMeals(sm => ({ ...sm, [meal.id]: { ...sm[meal.id], servings: next } }));
      return { ...prev, [meal.id]: next };
    });
  }, [savedMeals]);

  const onServDec = useCallback((meal) => {
    setServings(prev => {
      const next = Math.max((prev[meal.id] ?? meal.base) - 1, 1);
      if (savedMeals[meal.id]) setSavedMeals(sm => ({ ...sm, [meal.id]: { ...sm[meal.id], servings: next } }));
      return { ...prev, [meal.id]: next };
    });
  }, [savedMeals]);

  const onPlanServInc = useCallback((id) => {
    setSavedMeals(prev => {
      const e = prev[id]; if (!e) return prev;
      const next = Math.min(e.servings + 1, 12);
      setServings(s => ({ ...s, [id]: next }));
      return { ...prev, [id]: { ...e, servings: next } };
    });
  }, []);

  const onPlanServDec = useCallback((id) => {
    setSavedMeals(prev => {
      const e = prev[id]; if (!e) return prev;
      const next = Math.max(e.servings - 1, 1);
      setServings(s => ({ ...s, [id]: next }));
      return { ...prev, [id]: { ...e, servings: next } };
    });
  }, []);

  const onToggleSave = useCallback((meal) => {
    const sv = servings[meal.id] ?? meal.base;
    if (savedMeals[meal.id]) {
      setSavedMeals(prev => { const n = { ...prev }; delete n[meal.id]; return n; });
      showToast(`"${meal.name}" removed from plan`, 'error');
    } else {
      setSavedMeals(prev => ({ ...prev, [meal.id]: { meal, servings: sv } }));
      showToast(`"${meal.name}" added to plan`, 'success');
    }
  }, [savedMeals, servings, showToast]);

  const onRemove = useCallback((id) => {
    setSavedMeals(prev => { const n = { ...prev }; delete n[id]; return n; });
    showToast('Meal removed', 'error');
  }, [showToast]);

  const savedCount = Object.keys(savedMeals).length;

  const PANELS = [
    { key: 'browse',    label: 'Browse',                                  Icon: UtensilsCrossed },
    { key: 'plan',      label: `My Plan${savedCount ? ` (${savedCount})` : ''}`, Icon: BookOpen },
    { key: 'analytics', label: 'Analytics',                               Icon: BarChart3       },
    { key: 'shopping',  label: 'Shopping',                                Icon: ShoppingCart    },
    { key: 'ai',        label: 'AI Insights',                             Icon: Sparkles        },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'DM Sans', system-ui, sans-serif", padding: '0 16px 80px' }}>
      <Toast toast={toast} />

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 0 20px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.5px', margin: 0 }}>
              Meal Planner
            </h1>
            <p style={{ color: T.text2, fontSize: 13, marginTop: 4 }}>
              {DIETS[diet].name} · {dailyTotals.calories} kcal planned today
            </p>
          </div>

          {/* Panel tabs */}
          <div style={{ display: 'flex', gap: 4, background: T.bg3, border: `1px solid ${T.border2}`, borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
            {PANELS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setPanel(key)}
                style={{ padding: '8px 14px', borderRadius: 8, border: panel === key ? `1px solid ${T.blueBorder}` : 'none', background: panel === key ? T.blueBg : 'transparent', color: panel === key ? '#8cb4ff' : T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', whiteSpace: 'nowrap' }}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Panels */}
        {panel === 'browse' && (
          <BrowsePanel
            diet={diet} setDiet={k => { setDiet(k); setExpanded(null); setSearch(''); }}
            mealTime={mealTime} setMealTime={t => { setMealTime(t); setExpanded(null); setSearch(''); }}
            savedMeals={savedMeals} servings={servings}
            expanded={expanded} onToggleExpand={id => setExpanded(prev => prev === id ? null : id)}
            onServInc={onServInc} onServDec={onServDec}
            onToggleSave={onToggleSave}
            search={search} setSearch={setSearch}
          />
        )}
        {panel === 'plan' && (
          <PlanPanel
            savedMeals={savedMeals} dailyTotals={dailyTotals}
            onRemove={onRemove}
            onServInc={onPlanServInc} onServDec={onPlanServDec}
            onClearAll={() => { setSavedMeals({}); showToast('Plan cleared', 'error'); }}
            onBrowse={() => setPanel('browse')}
          />
        )}
        {panel === 'analytics' && <AnalyticsPanel savedMeals={savedMeals} dailyTotals={dailyTotals} />}
        {panel === 'shopping'  && <ShoppingPanel  savedMeals={savedMeals} checked={checked} setChecked={setChecked} />}
        {panel === 'ai'        && <AIInsightsPanel savedMeals={savedMeals} dailyTotals={dailyTotals} diet={diet} />}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { -webkit-font-smoothing: antialiased; box-sizing: border-box; }
        button { cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; }
        input  { outline: none; }
        input::placeholder { color: #4a5878; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 80%, 100% { opacity: .3; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
        @media (max-width: 600px) {
          .mp-panel-tabs { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
};

export default MealPlanner;
