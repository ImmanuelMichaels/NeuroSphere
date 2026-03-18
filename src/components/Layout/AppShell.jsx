import {
  useState, useEffect, useRef,
  useCallback, createContext, useContext, useMemo,
} from "react";
import {
  LayoutDashboard, Brain, Activity, Dna, Volume2, Shield,
  Settings as SettingsIcon,
  Bell, Search,
  ChevronLeft, ChevronRight, ChevronDown,
  Menu, X, Moon, Sun,
  User, LogOut, HelpCircle,
  Smile, Sparkles, Repeat, Puzzle, Waves, Tag, FolderOpen,
} from "lucide-react";

// ── Page imports ──────────────────────────────────────────────────────────────
// Rule: if the file doesn't exist yet, comment out BOTH the import AND its
// renderPage() case. A missing file crashes the whole app at module load time.
import Dashboard         from '../../pages/Dashboard/Dashboard';
import VitalsDashboard   from '../../pages/Health/VitalsDashboard';
import MealPlanner       from '../../pages/Health/MealPlanner';
import MoodTracker       from '../../pages/Mental/modules/MoodTracker';
import TherapyNotes      from '../../pages/Mental/modules/TherapyNotes';
import Bipolar           from '../../pages/Mental/modules/Bipolar';
import Genetics          from '../../pages/Health/Genetics';
import Autism            from '../../pages/Autism/Autism';
import MedicationTracker from '../../pages/Health/MedicationTracker';
import StimmingTracker   from '../../pages/Autism/StimmingTracker';
import AddictionTracker  from '../../pages/Mental/modules/GamblingAddictionTracker';
// import SettingsPage   from '../../pages/Settings';  — uncomment when file exists
// import HelpPage       from '../../pages/Help';      — uncomment when file exists

// ─── Design Tokens ────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:        "#07080d",
    surface:   "#0b0d15",
    card:      "#0f1220",
    cardHi:    "#141728",
    border:    "#1c2235",
    borderHi:  "#283050",
    sidebar:   "#090b14",
    topbar:    "#09080ddd",
    text:      "#dde6f5",
    textSub:   "#8898b8",
    muted:     "#4a5878",
    dim:       "#202840",
    accent:    "#5b7ef5",
    accentDim: "#111c4a",
    sage:      "#3ec4a0",
    amber:     "#f0a830",
    rose:      "#e85060",
    violet:    "#9b7cf0",
    sky:       "#40a8f0",
  },
  light: {
    bg:        "#f0f2f8",
    surface:   "#ffffff",
    card:      "#ffffff",
    cardHi:    "#f5f7ff",
    border:    "#e0e4f0",
    borderHi:  "#c8d0e8",
    sidebar:   "#ffffff",
    topbar:    "#ffffffdd",
    text:      "#1a2040",
    textSub:   "#5060a0",
    muted:     "#8090c0",
    dim:       "#c8d4f0",
    accent:    "#4060e8",
    accentDim: "#dce4ff",
    sage:      "#1a9a7a",
    amber:     "#c07810",
    rose:      "#d03040",
    violet:    "#7050d0",
    sky:       "#2080c0",
  },
};

// ─── Theme Context ────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ T: THEMES.dark, mode: "dark", toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { key: "dashboard",   label: "Dashboard",         Icon: LayoutDashboard, badge: null },
    ],
  },
  {
    label: "Clinical Care",
    items: [
      // FIX: "telepsych" removed from nav — it shares the Dashboard component and
      // appeared as a second "Dashboard" entry. Re-add once a dedicated page exists.
      { key: "bipolar",     label: "Bipolar",            Icon: Activity,        badge: null },
      { key: "therapy",     label: "Therapy Notes",      Icon: Tag,             badge: null },
      { key: "genetics",    label: "Genetics",           Icon: Dna,             badge: null },
    ],
  },
  {
    label: "Daily Tracking",
    items: [
      { key: "mood",        label: "Mood Tracker",       Icon: Smile,           badge: "3"  },
      { key: "vitals",      label: "Vitals",             Icon: Waves,           badge: null },
      { key: "medications", label: "Medication Tracker", Icon: Repeat,          badge: "!"  },
      { key: "meals",       label: "Meal Planner",       Icon: FolderOpen,      badge: null },
    ],
  },
  {
    label: "Support & Wellness",
    items: [
      { key: "autism",      label: "Autism / Sensory",   Icon: Puzzle,          badge: null },
      { key: "stimming",    label: "Stimming Tracker",   Icon: Volume2,         badge: null },
      { key: "addiction",   label: "Addiction Tracker",  Icon: Shield,          badge: null },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "settings",    label: "Settings",           Icon: SettingsIcon,    badge: null },
      { key: "help",        label: "Help & Support",     Icon: HelpCircle,      badge: null },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);
const PAGE_META = {
  dashboard:   { title: "Dashboard",          subtitle: "Your health overview and daily summary",              color: "#5b7ef5" },
  telepsych:   { title: "Telepsychiatry",      subtitle: "Virtual consultations and psychiatric care",          color: "#9b7cf0" },
  bipolar:     { title: "Bipolar Management",  subtitle: "Track mood cycles, episodes and stability patterns",  color: "#e85060" },
  therapy:     { title: "Therapy Notes",       subtitle: "Session records and clinical continuity",             color: "#40a8f0" },
  genetics:    { title: "Genetics",            subtitle: "Pharmacogenomics and medication optimisation",        color: "#38d4b0" },
  mood:        { title: "Mood Tracker",        subtitle: "Log emotions and visualise mood patterns",            color: "#9b7cf0" },
  vitals:      { title: "Vitals Dashboard",    subtitle: "Blood pressure, glucose and biometric tracking",      color: "#e85060" },
  medications: { title: "Medication Tracker",  subtitle: "Schedule, reminders and adherence tracking",          color: "#f0a830" },
  meals:       { title: "Meal Planner",        subtitle: "Nutrition planning and dietary management",           color: "#3ec4a0" },
  autism:      { title: "Autism / Sensory",    subtitle: "Sensory regulation tools and calming strategies",     color: "#f0a830" },
  stimming:    { title: "Stimming Tracker",    subtitle: "Log and understand stimming patterns and triggers",   color: "#40a8f0" },
  addiction:   { title: "Addiction Tracker",   subtitle: "Recovery tracking, urge logging and milestones",      color: "#e85060" },
  settings:    { title: "Settings",            subtitle: "Preferences, privacy and account management",         color: "#5b7ef5" },
  help:        { title: "Help & Support",      subtitle: "Documentation, tutorials and contact support",        color: "#3ec4a0" },
};

// ─── Hash Router ──────────────────────────────────────────────────────────────
const HASH_TO_KEY = {
  "":               "dashboard",  
  "#/":             "dashboard",
  "#/telepsych":    "telepsych",
  "#/bipolar":      "bipolar",
  "#/mood-tracker": "mood",
  "#/therapy-notes":"therapy",
  "#/genetics":     "genetics",
  "#/autism":       "autism",
  "#/vitals":       "vitals",
  "#/medications":  "medications",
  "#/meals":        "meals",
  "#/stimtracker":  "stimming",
  "#/addiction":    "addiction",
  "#/settings":     "settings",
  "#/help":         "help",
};

const KEY_TO_HASH = {
  dashboard:   "#/",
  telepsych:   "#/telepsych",
  bipolar:     "#/bipolar",
  mood:        "#/mood-tracker",
  therapy:     "#/therapy-notes",
  genetics:    "#/genetics",
  autism:      "#/autism",
  vitals:      "#/vitals",
  medications: "#/medications",
  meals:       "#/meals",
  stimming:    "#/stimtracker",
  addiction:   "#/addiction",
  settings:    "#/settings",
  help:        "#/help",
};

const resolveHash = h => HASH_TO_KEY[h] ?? "dashboard";

const useHashRoute = () => {
  const [key, setKey] = useState(() => resolveHash(window.location.hash || "#/"));

  useEffect(() => {
    const handler = () => setKey(resolveHash(window.location.hash || "#/"));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []); // legitimately empty — resolveHash is module-level

  const navigate = useCallback(k => {
    const hash = KEY_TO_HASH[k];
    if (!hash) {
      console.warn(`AppShell: no hash mapping for key "${k}". Add it to KEY_TO_HASH.`);
      return;
    }
    window.location.hash = hash;
    // setKey is intentionally NOT called here — the hashchange event above will
    // fire synchronously and call setKey, avoiding a double state update.
  }, []);

  return [key, navigate];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtClock = () =>
  new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const fmtDate = () =>
  new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// ─── Notification Seed ────────────────────────────────────────────────────────
const NOTIF_SEED = [
  { id: 1, type: "warning", icon: "💊", title: "Medication reminder",   body: "Lithium Carbonate due at 9:00 AM",   time: "2 min ago",  read: false },
  { id: 2, type: "success", icon: "✅", title: "Mood logged",            body: "Today's check-in recorded",          time: "1 hr ago",   read: false },
  { id: 3, type: "info",    icon: "📅", title: "Appointment tomorrow",   body: "Dr. Sarah Jennings — 10:00 AM",      time: "3 hrs ago",  read: false },
  { id: 4, type: "success", icon: "🎯", title: "12-day streak!",         body: "Consistent medication adherence",    time: "Yesterday",  read: true  },
  { id: 5, type: "info",    icon: "📊", title: "Weekly report ready",    body: "Your wellness summary is available", time: "2 days ago", read: true  },
];

// ─── Search Data ──────────────────────────────────────────────────────────────
const SEARCH_DATA = ALL_ITEMS.map(item => ({
  key:   item.key,
  label: item.label,
  Icon:  item.Icon,
  group: NAV_GROUPS.find(g => g.items.some(i => i.key === item.key))?.label ?? "",
}));

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Live Clock ────────────────────────────────────────────────────────────────
const LiveClock = () => {
  const { T } = useTheme();
  const [t, setT] = useState(fmtClock);
  const [d, setD] = useState(fmtDate);
  useEffect(() => {
    const id = setInterval(() => { setT(fmtClock()); setD(fmtDate()); }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "right", lineHeight: 1.2 }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: T.accent, fontVariantNumeric: "tabular-nums", margin: 0 }}>{t}</p>
      <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>{d}</p>
    </div>
  );
};

// ── Notification Panel ────────────────────────────────────────────────────────
const NotifPanel = ({ notifs, onRead, onClear, onClose }) => {
  const { T } = useTheme();
  const unread = notifs.filter(n => !n.read).length;
  const typeColor = { warning: T.amber, success: T.sage, info: T.sky, error: T.rose };
  return (
    <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, width: 340, background: T.card, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: "0 20px 60px #0008", zIndex: 200, overflow: "hidden", animation: "dropIn .18s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>Notifications</p>
          {unread > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: T.accent, color: "#fff", borderRadius: 99, padding: "2px 7px" }}>{unread}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && (
            <button onClick={onClear} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex" }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {notifs.map(n => (
          <div key={n.id} onClick={() => onRead(n.id)}
            style={{ display: "flex", gap: 12, padding: "13px 18px", background: n.read ? "transparent" : `${T.accent}06`, cursor: "pointer", borderBottom: `1px solid ${T.border}`, transition: "background .12s" }}>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{n.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: T.text, margin: 0 }}>{n.title}</p>
                {!n.read && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColor[n.type] ?? T.accent, flexShrink: 0, marginTop: 3 }} />
                )}
              </div>
              <p style={{ fontSize: 12, color: T.textSub, margin: "3px 0 0" }}>{n.body}</p>
              <p style={{ fontSize: 10, color: T.muted, margin: "4px 0 0" }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Command Palette ───────────────────────────────────────────────────────────
const CommandPalette = ({ onNavigate, onClose }) => {
  const { T } = useTheme();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const [sel, setSel] = useState(0);

  const results = useMemo(() => {
    if (!q.trim()) return SEARCH_DATA.slice(0, 6);
    const lq = q.toLowerCase();
    return SEARCH_DATA.filter(d =>
      d.label.toLowerCase().includes(lq) || d.group.toLowerCase().includes(lq)
    );
  }, [q]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [results]);

  const handleKey = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[sel]) { onNavigate(results[sel].key); onClose(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 9000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, animation: "fadeIn .15s ease" }}
      onClick={onClose}
    >
      <div
        style={{ background: T.card, border: `1px solid ${T.borderHi}`, borderRadius: 18, width: "100%", maxWidth: 520, boxShadow: "0 30px 80px #000c", overflow: "hidden", animation: "dropIn .18s ease" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
          <Search size={16} color={T.muted} />
          <input
            ref={inputRef} value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages, features…"
            style={{ flex: 1, background: "none", border: "none", color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <kbd style={{ fontSize: 10, fontWeight: 700, color: T.muted, background: T.dim, padding: "3px 7px", borderRadius: 5 }}>ESC</kbd>
        </div>
        <div style={{ padding: "8px 0", maxHeight: 320, overflowY: "auto" }}>
          {results.length === 0
            ? <p style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: "24px 0" }}>No results for "{q}"</p>
            : results.map((r, i) => (
              <div key={r.key}
                onClick={() => { onNavigate(r.key); onClose(); }}
                onMouseEnter={() => setSel(i)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", background: sel === i ? T.accentDim : "transparent", cursor: "pointer", transition: "background .08s" }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: sel === i ? `${T.accent}30` : T.dim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <r.Icon size={15} color={sel === i ? T.accent : T.muted} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{r.group}</p>
                </div>
                <ChevronRight size={13} color={T.dim} style={{ marginLeft: "auto" }} />
              </div>
            ))
          }
        </div>
        <div style={{ padding: "10px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 16 }}>
          {[["↑↓", "Navigate"], ["↵", "Select"], ["ESC", "Dismiss"]].map(([k, v]) => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <kbd style={{ fontSize: 10, color: T.muted, background: T.dim, padding: "2px 6px", borderRadius: 4, fontFamily: "inherit" }}>{k}</kbd>
              <span style={{ fontSize: 10, color: T.muted }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ activePage, onNavigate, collapsed, onToggle }) => {
  const { T } = useTheme();
  const W = collapsed ? 64 : 236;
  return (
    <aside style={{ width: W, minHeight: "100vh", background: T.sidebar, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width .25s ease", overflow: "hidden", position: "relative", zIndex: 10 }}>
      {/* Logo */}
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg,${T.accent},${T.violet})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 16px ${T.accent}44` }}>
          <Sparkles size={17} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontSize: 15, fontWeight: 900, color: T.text, margin: 0, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>NeuroPulse</p>
            <p style={{ fontSize: 9, color: T.muted, margin: 0, textTransform: "uppercase", letterSpacing: ".08em" }}>Health Platform</p>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 8px" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            {!collapsed && (
              <p style={{ fontSize: 9, fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", padding: "8px 10px 4px", margin: 0 }}>
                {group.label}
              </p>
            )}
            {group.items.map(({ key, label, Icon, badge }) => {
              const active = activePage === key;
              return (
                // Each item renders as an <a> so the browser treats it as a real
                // navigation link: right-click → open in new tab, back button, etc.
                <a
                  key={key}
                  href={KEY_TO_HASH[key] ?? "#/"}
                  title={collapsed ? label : undefined}
                  onClick={e => {
                    e.preventDefault();          // let navigate() control hash
                    onNavigate(key);
                  }}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px" : "10px 12px", borderRadius: 10, background: active ? T.accentDim : "none", marginBottom: 2, position: "relative", cursor: "pointer", transition: "background .12s", justifyContent: collapsed ? "center" : "flex-start" }}
                >
                  <Icon size={17} color={active ? T.accent : T.muted} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.text : T.textSub, flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>
                        {label}
                      </span>
                      {badge && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99, background: badge === "!" ? T.rose : T.accentDim, color: badge === "!" ? "#fff" : T.accent, lineHeight: "16px" }}>
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                  {active && (
                    <div style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: 3, background: T.accent, borderRadius: "0 2px 2px 0" }} />
                  )}
                  {collapsed && badge && (
                    <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: badge === "!" ? T.rose : T.accent }} />
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button onClick={onToggle}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: "10px 12px", borderRadius: 10, background: "none", border: `1px solid ${T.border}`, cursor: "pointer", color: T.muted }}>
          {!collapsed && <span style={{ fontSize: 12, fontWeight: 600 }}>Collapse</span>}
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ breadcrumbs, onOpenSearch, onToggleSidebar, notifProps }) => {
  const { T, mode, toggle } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  // Destructure before the effect so deps track the stable useCallback reference,
  // not the whole notifProps object (which rebuilds on every unread-count change).
  const { onClose: closeNotifPanel } = notifProps;

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   closeNotifPanel();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeNotifPanel]);

  return (
    <header style={{ height: 64, background: T.topbar, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(20px)", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 50 }}>
      {/* Breadcrumb */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onToggleSidebar} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, display: "flex", padding: 4, borderRadius: 6 }}>
          <Menu size={18} />
        </button>
        <div style={{ height: 16, width: 1, background: T.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {breadcrumbs.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <ChevronRight size={12} color={T.dim} />}
              <span style={{ fontSize: 13, color: i === breadcrumbs.length - 1 ? T.text : T.muted, fontWeight: i === breadcrumbs.length - 1 ? 700 : 400 }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <button onClick={onOpenSearch}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 10, background: T.dim, border: `1px solid ${T.border}`, cursor: "pointer", color: T.muted }}>
        <Search size={14} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>Search…</span>
        <kbd style={{ fontSize: 10, fontWeight: 700, background: T.card, padding: "2px 6px", borderRadius: 4, color: T.muted, marginLeft: 4 }}>⌘K</kbd>
      </button>

      <LiveClock />

      {/* Theme toggle */}
      <button onClick={toggle}
        style={{ width: 36, height: 36, borderRadius: 10, background: T.dim, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>
        {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button onClick={notifProps.onOpen}
          style={{ width: 36, height: 36, borderRadius: 10, background: T.dim, border: `1px solid ${T.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, position: "relative" }}>
          <Bell size={16} />
          {notifProps.count > 0 && (
            <span style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: T.rose, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.topbar}` }}>
              {notifProps.count > 9 ? "9+" : notifProps.count}
            </span>
          )}
        </button>
        {notifProps.open && (
          <NotifPanel
            notifs={notifProps.items}
            onRead={notifProps.onRead}
            onClear={notifProps.onClear}
            onClose={notifProps.onClose}
          />
        )}
      </div>

      {/* Profile */}
      <div ref={profileRef} style={{ position: "relative" }}>
        <button onClick={() => setProfileOpen(p => !p)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px 5px 5px", borderRadius: 12, background: T.dim, border: `1px solid ${T.border}`, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${T.accent},${T.violet})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>M</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Michael</span>
          <ChevronDown size={12} color={T.muted} />
        </button>
        {profileOpen && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 200, background: T.card, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: "0 16px 40px #0008", overflow: "hidden", animation: "dropIn .15s ease", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Michael Adeyemi</p>
              <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>michael@example.com</p>
            </div>
            {[{ Icon: User, label: "Profile" }, { Icon: SettingsIcon, label: "Settings" }, { Icon: HelpCircle, label: "Help" }].map(({ Icon, label }) => (
              <button key={label}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: T.textSub, fontSize: 13 }}>
                <Icon size={14} />{label}
              </button>
            ))}
            <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
            <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: T.rose, fontSize: 13 }}>
              <LogOut size={14} />Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

// ── Coming Soon — placeholder for pages whose files don't exist yet ────────────
const ComingSoon = ({ pageKey }) => {
  const { T } = useTheme();
  const info = PAGE_META[pageKey] ?? { title: pageKey, subtitle: "", color: T.accent };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, animation: "fadeIn .3s ease", textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>{info.title}</p>
      <p style={{ fontSize: 13, color: T.muted, margin: 0, maxWidth: 320 }}>{info.subtitle}</p>
      <div style={{ padding: "8px 16px", borderRadius: 8, background: T.dim, border: `1px solid ${T.border}`, fontSize: 12, color: T.textSub, fontFamily: "monospace" }}>
        Coming soon — add the import and case in AppShell
      </div>
    </div>
  );
};

// ── Page Not Found ────────────────────────────────────────────────────────────
const PageNotFound = ({ pageKey }) => {
  const { T } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, animation: "fadeIn .3s ease", textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>Page not found</p>
      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
        No route matched <code style={{ background: T.dim, padding: "2px 6px", borderRadius: 4 }}>{pageKey}</code>
      </p>
    </div>
  );
};

// ── renderPage ────────────────────────────────────────────────────────────────
// FIX: "settings" and "help" cases now use <ComingSoon> instead of referencing
// <SettingsPage> / <HelpPage> whose imports are commented out.
// A commented-out import + an active case = ReferenceError at runtime.
// When the files are ready: uncomment the import AND swap ComingSoon for the real component.
const renderPage = key => {
  switch (key) {
    case "dashboard":   return <Dashboard />;
    case "telepsych":   return <Dashboard />;       // same component until dedicated page exists
    case "bipolar":     return <Bipolar />;
    case "mood":        return <MoodTracker />;
    case "therapy":     return <TherapyNotes />;
    case "genetics":    return <Genetics />;
    case "autism":      return <Autism />;
    case "vitals":      return <VitalsDashboard />;
    case "medications": return <MedicationTracker />;
    case "meals":       return <MealPlanner />;
    case "stimming":    return <StimmingTracker />;
    case "addiction":   return <AddictionTracker />;
    case "settings":    return <ComingSoon pageKey="settings" />; // swap → <SettingsPage /> when ready
    case "help":        return <ComingSoon pageKey="help" />;     // swap → <HelpPage /> when ready
    default:            return <PageNotFound pageKey={key} />;
  }
};

const PageContent = ({ page }) => (
  <div style={{ animation: "fadeIn .25s ease" }}>
    {renderPage(page)}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — AppShell
// ══════════════════════════════════════════════════════════════════════════════
export default function AppShell() {
  const [mode, setMode] = useState(() => localStorage.getItem("npl_theme") ?? "dark");
  const T = THEMES[mode] ?? THEMES.dark;

  const toggle = useCallback(() => {
    setMode(m => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem("npl_theme", next);
      return next;
    });
  }, []);

  const [activePage, navigate]  = useHashRoute();
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setCollapsed(c => !c), []);

  const [notifs,    setNotifs]    = useState(NOTIF_SEED);
  const [notifOpen, setNotifOpen] = useState(false);

  const readNotif   = useCallback(id => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n)), []);
  const clearNotifs = useCallback(()  => setNotifs(p => p.map(n => ({ ...n, read: true }))), []);
  const closeNotif  = useCallback(()  => setNotifOpen(false), []);
  const openNotif   = useCallback(()  => setNotifOpen(o => !o), []);
  const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs]);

  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleNavigate = useCallback(key => {
    navigate(key);
    setNotifOpen(false);
    setCmdOpen(false);
  }, [navigate]);

  const breadcrumbs = useMemo(() => {
    const group = NAV_GROUPS.find(g => g.items.some(i => i.key === activePage))?.label ?? "";
    const page  = ALL_ITEMS.find(i => i.key === activePage)?.label ?? "";
    return group ? ["NeuroPulse", group, page] : ["NeuroPulse", page];
  }, [activePage]);

  const notifProps = useMemo(() => ({
    count:   unreadCount,
    open:    notifOpen,
    items:   notifs,
    onOpen:  openNotif,
    onRead:  readNotif,
    onClear: clearNotifs,
    onClose: closeNotif,
  }), [unreadCount, notifOpen, notifs, openNotif, readNotif, clearNotifs, closeNotif]);

  return (
    <ThemeCtx.Provider value={{ T, mode, toggle }}>
      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans','Nunito',system-ui,sans-serif", display: "flex" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 4px; height: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
          input::placeholder { color: ${T.dim}; }
          button { font-family: inherit; }
          a { font-family: inherit; }
          @keyframes fadeIn  { from { opacity: 0 }                                         to { opacity: 1 } }
          @keyframes slideUp { from { transform: translateY(8px);  opacity: 0 }            to { transform: translateY(0);  opacity: 1 } }
          @keyframes dropIn  { from { transform: translateY(-6px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
          @media (prefers-reduced-motion: reduce) { * { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
        `}</style>

        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggle={toggleSidebar}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          <Topbar
            breadcrumbs={breadcrumbs}
            onOpenSearch={() => setCmdOpen(true)}
            onToggleSidebar={toggleSidebar}
            notifProps={notifProps}
          />
          <main style={{ flex: 1, overflowY: "auto", padding: 28, background: T.bg }}>
            <PageContent page={activePage} />
          </main>
        </div>

        {cmdOpen && (
          <CommandPalette onNavigate={handleNavigate} onClose={() => setCmdOpen(false)} />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}