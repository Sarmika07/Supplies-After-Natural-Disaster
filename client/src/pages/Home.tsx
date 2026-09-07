import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  CloudRain,
  Fuel,
  HeartHandshake,
  Layers3,
  MapPin,
  Menu,
  MoreHorizontal,
  PackageCheck,
  PanelLeftClose,
  Play,
  RefreshCw,
  Route as RouteIcon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { calculateRecoveryTime } from "@/lib/replanner";

type NavKey = "overview" | "live" | "plan" | "disruptions" | "reports";
type DisruptionType = "Road disruption" | "Vehicle unavailable" | "Urgent request" | "Delivery cancelled";

type RouteRecord = {
  id: string;
  vehicle: string;
  driver: string;
  lane: string;
  stops: string;
  progress: number;
  eta: string;
  load: string;
  status: "On route" | "At risk" | "Recovering";
  accent: string;
};

type Disruption = {
  id: string;
  type: DisruptionType;
  title: string;
  detail: string;
  severity: "Critical" | "Urgent" | "Watch";
  age: string;
  resolved?: boolean;
};

const navItems: { key: NavKey; label: string; icon: typeof Activity; badge?: string }[] = [
  { key: "overview", label: "Overview", icon: Layers3 },
  { key: "live", label: "Live operations", icon: Activity, badge: "12" },
  { key: "plan", label: "Dispatch plan", icon: RouteIcon },
  { key: "disruptions", label: "Disruptions", icon: AlertCircle, badge: "3" },
  { key: "reports", label: "Reports & KPIs", icon: Sparkles },
];

const initialRoutes: RouteRecord[] = [
  { id: "R-104", vehicle: "V-12", driver: "Amara Okafor", lane: "North ridge → Hope Valley", stops: "4 / 7 stops", progress: 64, eta: "12:42", load: "82% loaded", status: "On route", accent: "coral" },
  { id: "R-110", vehicle: "V-07", driver: "Maya Patel", lane: "Central hub → Eastbank", stops: "2 / 5 stops", progress: 38, eta: "13:18", load: "56% loaded", status: "At risk", accent: "plum" },
  { id: "R-098", vehicle: "V-03", driver: "Nia Thompson", lane: "South clinic → Harbor line", stops: "5 / 5 stops", progress: 100, eta: "Complete", load: "100% delivered", status: "Recovering", accent: "mint" },
  { id: "R-117", vehicle: "V-18", driver: "Sofia Reyes", lane: "West depot → Riverbend", stops: "1 / 6 stops", progress: 22, eta: "14:05", load: "44% loaded", status: "On route", accent: "gold" },
];

const initialDisruptions: Disruption[] = [
  { id: "D-328", type: "Road disruption", title: "Bridge closure on North ridge", detail: "A12 checkpoint · affects 2 routes", severity: "Critical", age: "6 min ago" },
  { id: "D-326", type: "Vehicle unavailable", title: "V-07 fuel system fault", detail: "Eastbank route · 3 deliveries at risk", severity: "Urgent", age: "14 min ago" },
  { id: "D-324", type: "Urgent request", title: "Mobile clinic supply request", detail: "Hope Valley · 420 kg · due 14:30", severity: "Urgent", age: "21 min ago" },
];

const typeCopy: Record<DisruptionType, { title: string; detail: string; severity: Disruption["severity"] }> = {
  "Road disruption": { title: "Floodwater crossing reported", detail: "B7 detour · affects 1 route", severity: "Critical" },
  "Vehicle unavailable": { title: "V-18 needs to stand down", detail: "Riverbend route · 4 deliveries at risk", severity: "Urgent" },
  "Urgent request": { title: "Water purification tablets requested", detail: "Harbor line · 260 kg · due 15:10", severity: "Urgent" },
  "Delivery cancelled": { title: "Community kitchen cancelled", detail: "South clinic · 180 kg released", severity: "Watch" },
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "critical" | "urgent" | "success" | "plum" }) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

function StatCard({ label, value, helper, change, icon: Icon, tone }: { label: string; value: string; helper: string; change?: string; icon: typeof Activity; tone: string }) {
  return (
    <div className={cn("stat-card", `stat-${tone}`)}>
      <div className="stat-topline"><span>{label}</span><span className="stat-icon"><Icon size={16} /></span></div>
      <div className="stat-value">{value}</div>
      <div className="stat-helper">{change && <span className={change.startsWith("+") ? "change-up" : "change-down"}>{change.startsWith("+") ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}</span>} {helper}</div>
    </div>
  );
}

function RouteMap({ routes, selectedRoute, onSelect }: { routes: RouteRecord[]; selectedRoute: string; onSelect: (id: string) => void }) {
  return (
    <div className="map-wrap">
      <div className="map-toolbar"><div className="map-legend"><span><i className="legend-dot live-dot" />On route</span><span><i className="legend-dot warn-dot" />At risk</span><span><i className="legend-dot done-dot" />Completed</span></div><button className="map-control"><MapPin size={14} /> Live position</button></div>
      <svg className="route-map" viewBox="0 0 800 420" role="img" aria-label="Stylized live route map">
        <defs>
          <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M 44 0 L 0 0 0 44" fill="none" stroke="#e6d8d8" strokeWidth="1" opacity=".55" /></pattern>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="800" height="420" fill="#f7eee9" rx="18" />
        <rect width="800" height="420" fill="url(#grid)" rx="18" />
        <path d="M-20 338 C104 281 124 334 218 261 S336 163 411 218 515 312 618 218 719 154 824 78" fill="none" stroke="#dac6c9" strokeWidth="36" opacity=".65" />
        <path d="M-20 338 C104 281 124 334 218 261 S336 163 411 218 515 312 618 218 719 154 824 78" fill="none" stroke="#fff8f4" strokeWidth="24" opacity=".95" />
        <path d="M54 82 C142 139 182 82 268 116 S371 206 434 166 555 92 642 148 714 293 832 326" fill="none" stroke="#d9c7ca" strokeWidth="18" opacity=".7" />
        <path d="M54 82 C142 139 182 82 268 116 S371 206 434 166 555 92 642 148 714 293 832 326" fill="none" stroke="#fff8f4" strokeWidth="11" />
        <path d="M130 386 C184 316 207 281 230 231 S264 99 340 66 453 108 485 165 513 260 599 285 705 252 790 258" fill="none" stroke="#d5c1c7" strokeWidth="10" strokeDasharray="8 10" />
        <path d="M130 386 C184 316 207 281 230 231 S264 99 340 66 453 108 485 165 513 260 599 285 705 252 790 258" fill="none" stroke="#fff8f4" strokeWidth="5" strokeDasharray="8 10" />
        <path d="M98 302 C156 267 170 215 250 190 S362 210 414 291 553 338 638 292 720 180 762 132" fill="none" stroke="#e66d67" strokeWidth={selectedRoute === "R-104" ? 7 : 4} strokeLinecap="round" opacity=".95" />
        <path d="M142 342 C222 337 260 294 307 243 S405 148 501 140 607 168 679 230" fill="none" stroke="#6b3e63" strokeWidth={selectedRoute === "R-110" ? 7 : 4} strokeLinecap="round" opacity=".92" />
        <path d="M210 74 C282 110 331 129 390 196 S476 273 559 289 660 321 746 360" fill="none" stroke="#e4b96c" strokeWidth={selectedRoute === "R-117" ? 7 : 4} strokeLinecap="round" opacity=".9" />
        <path d="M183 373 C268 344 312 334 356 301 S425 231 477 221 565 237 604 198" fill="none" stroke="#85bca5" strokeWidth="4" strokeLinecap="round" opacity=".9" />
        {[[98,302,"#e66d67"],[142,342,"#6b3e63"],[210,74,"#e4b96c"],[183,373,"#85bca5"]].map(([x,y,c], i) => <g key={i} filter="url(#glow)"><circle cx={x as number} cy={y as number} r="9" fill="#fff8f4" stroke={c as string} strokeWidth="4" /><circle cx={x as number} cy={y as number} r="3" fill={c as string} /></g>)}
        {[[762,132,"CR-01"],[679,230,"EV-17"],[746,360,"RB-04"],[604,198,"SC-06"]].map(([x,y,label], i) => <g key={i}><circle cx={x as number} cy={y as number} r="5" fill="#6b3e63" /><text x={(x as number) - 15} y={(y as number) - 12} className="map-label">{label}</text></g>)}
        <g transform="translate(46 44)"><rect width="116" height="28" rx="14" fill="#fff8f4" opacity=".92" /><text x="14" y="18" className="map-label">Central hub</text><circle cx="97" cy="14" r="4" fill="#e66d67" /></g>
        <g transform="translate(612 56)"><rect width="120" height="28" rx="14" fill="#fff8f4" opacity=".92" /><text x="14" y="18" className="map-label">North ridge</text><circle cx="101" cy="14" r="4" fill="#e4b96c" /></g>
      </svg>
      <div className="map-bottom"><div><span className="small-label">Coverage area</span><strong>North District · 38 active drops</strong></div><div className="map-note"><ShieldCheck size={15} /> Completed stops are protected from replanning</div></div>
    </div>
  );
}

function RouteRow({ route, selected, onClick }: { route: RouteRecord; selected: boolean; onClick: () => void }) {
  return <button className={cn("route-row", selected && "route-row-selected")} onClick={onClick}>
    <div className={cn("route-avatar", `avatar-${route.accent}`)}><Truck size={17} /></div>
    <div className="route-main"><div className="route-title"><strong>{route.id}</strong><Badge tone={route.status === "At risk" ? "critical" : route.status === "Recovering" ? "success" : "neutral"}>{route.status}</Badge></div><span>{route.vehicle} · {route.driver}</span><span className="route-lane">{route.lane}</span></div>
    <div className="route-meta"><strong>{route.eta}</strong><span>{route.stops}</span><div className="mini-progress"><i style={{ width: `${route.progress}%` }} /></div></div>
  </button>;
}

function AppHeader({ onMenu }: { onMenu: () => void }) {
  return <header className="app-header"><div className="header-title"><button className="mobile-menu" onClick={onMenu}><Menu size={18} /></button><div><p className="eyebrow">Tuesday · 17 September 2024</p><h1>Good afternoon, Amina <span>✦</span></h1></div></div><div className="header-actions"><div className="live-indicator"><span className="pulse" /> Live operations</div><button className="icon-button" aria-label="Search"><Search size={18} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button><div className="profile"><div className="profile-avatar">AS</div><div><strong>Amina Saleh</strong><span>Dispatcher</span></div><ChevronDown size={14} /></div></div></header>;
}

function Overview({ routes, selectedRoute, setSelectedRoute, disruptions, onOpenDisruption, planState, recoveryTime, onRunReplan }: { routes: RouteRecord[]; selectedRoute: string; setSelectedRoute: (id: string) => void; disruptions: Disruption[]; onOpenDisruption: () => void; planState: "ready" | "running" | "proposed" | "applied"; recoveryTime: number | null; onRunReplan: () => void }) {
  const visibleDisruptions = disruptions.filter((d) => !d.resolved).slice(0, 3);
  return <>
    <section className="hero-grid">
      <div className="hero-copy"><div className="hero-kicker"><span className="sparkle-dot"><Sparkles size={12} /></span> North District command centre</div><h2>Keep every essential delivery moving.</h2><p>ReliefRoute watches the plan, catches disruption early, and finds the gentlest recovery path for your team.</p><div className="hero-actions"><button className="primary-button" onClick={onOpenDisruption}><Zap size={16} /> Inject disruption</button><button className="secondary-button" onClick={onRunReplan}><RefreshCw size={16} /> {planState === "running" ? "Replanning…" : "Run replanning"}</button></div><div className="hero-footnote"><Check size={14} /> Last plan validated 2 minutes ago <span>·</span> <strong>92% service confidence</strong></div></div>
      <div className="hero-orbit"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit-center"><HeartHandshake size={26} /><strong>32</strong><span>lives supported<br />this shift</span></div><span className="orbit-chip chip-one"><Truck size={13} /> 12 moving</span><span className="orbit-chip chip-two"><PackageCheck size={13} /> 38 drops</span><span className="orbit-chip chip-three"><Fuel size={13} /> 214L saved</span></div>
    </section>
    <section className="stats-grid"><StatCard label="Plan recovery time" value={recoveryTime ? `${recoveryTime}s` : "—"} helper={recoveryTime ? "measured this run" : "run a disruption test"} change={recoveryTime ? "−72%" : undefined} icon={Clock3} tone="coral" /><StatCard label="On-time commitments" value="94.6%" helper="of 86 promised drops" change="+4.8%" icon={ShieldCheck} tone="mint" /><StatCard label="Fleet utilization" value="78%" helper="16 of 20 vehicles active" change="+9.2%" icon={Truck} tone="plum" /><StatCard label="Avoided distance" value="18.4 km" helper="vs simple baseline" change="−12.6%" icon={RouteIcon} tone="gold" /></section>
    <section className="workspace-grid"><div className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">Live route network</p><h3>Where the fleet is now</h3></div><div className="heading-actions"><button className="soft-button"><Settings2 size={15} /> Layers</button><button className="more-button"><MoreHorizontal size={18} /></button></div></div><RouteMap routes={routes} selectedRoute={selectedRoute} onSelect={setSelectedRoute} /></div><div className="panel plan-panel"><div className="panel-heading"><div><p className="eyebrow">Dispatch health</p><h3>Routes to watch</h3></div><button className="text-button">View plan <ArrowUpRight size={14} /></button></div><div className="route-list">{routes.slice(0, 4).map((route) => <RouteRow key={route.id} route={route} selected={selectedRoute === route.id} onClick={() => setSelectedRoute(route.id)} />)}</div><div className="panel-footer"><span><CircleDot size={14} className="live-icon" /> 12 vehicles reporting</span><button className="footer-link">Open live operations <ArrowUpRight size={13} /></button></div></div></section>
    <section className="bottom-grid"><div className="panel disruption-panel"><div className="panel-heading"><div><p className="eyebrow">Needs attention</p><h3>Active disruptions <span className="heading-count">{visibleDisruptions.length}</span></h3></div><button className="soft-button" onClick={onOpenDisruption}><Zap size={14} /> Add event</button></div><div className="disruption-list">{visibleDisruptions.map((d) => <div className="disruption-row" key={d.id}><div className={cn("severity-marker", `severity-${d.severity.toLowerCase()}`)} /><div className="disruption-copy"><div><strong>{d.title}</strong><Badge tone={d.severity === "Critical" ? "critical" : d.severity === "Urgent" ? "urgent" : "neutral"}>{d.severity}</Badge></div><span>{d.detail}</span></div><span className="age">{d.age}</span><button className="more-button"><MoreHorizontal size={16} /></button></div>)}</div></div><div className="panel recovery-panel"><div className="panel-heading"><div><p className="eyebrow">This shift</p><h3>Recovery score</h3></div><div className="score-ring"><span>86</span><small>/100</small></div></div><div className="score-bar"><i style={{ width: "86%" }} /></div><div className="score-lines"><div><span><i className="score-dot mint" />Service</span><strong>92</strong></div><div><span><i className="score-dot coral" />Stability</span><strong>84</strong></div><div><span><i className="score-dot gold" />Efficiency</span><strong>81</strong></div></div><div className="recovery-message"><Sparkles size={15} /><span>Healthy buffer for the next wave of requests.</span></div></div></section>
  </>;
}

function MetricsView({ routes, recoveryTime, disruptions }: { routes: RouteRecord[]; recoveryTime: number | null; disruptions: Disruption[] }) {
  const resolved = disruptions.filter((d) => d.resolved).length;
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Reports & KPIs</p><h2>Evidence that recovery is working.</h2><p>Compare the adaptive plan to a simple baseline across service, cost, emissions, and stability.</p></div><button className="secondary-button"><RefreshCw size={15} /> Export snapshot</button></div><div className="report-grid"><div className="report-card report-big"><div className="report-card-top"><span>Plan recovery time</span><Badge tone="success">Live experiment</Badge></div><div className="report-number">{recoveryTime ? `${recoveryTime}s` : "—"}</div><div className="comparison"><div><span>ReliefRoute</span><strong>{recoveryTime || 0}s</strong></div><div><span>Simple baseline</span><strong>8m 00s</strong></div></div><div className="comparison-bar"><i style={{ width: `${Math.max(8, Math.min(88, recoveryTime ? 100 - recoveryTime / 2 : 12))}%` }} /><b /></div><p className="report-note"><Sparkles size={14} /> Measured from disruption injection to a valid revised plan.</p></div><div className="report-card"><span>Commitments protected</span><strong className="report-side-number">94.6%</strong><div className="bar-list"><div><span>Critical</span><i><b style={{ width: "100%" }} /></i><em>100%</em></div><div><span>Urgent</span><i><b style={{ width: "96%" }} /></i><em>96%</em></div><div><span>Normal</span><i><b style={{ width: "91%" }} /></i><em>91%</em></div></div></div><div className="report-card"><span>Emissions avoided</span><strong className="report-side-number">−12.6%</strong><div className="soft-chart"><div className="chart-y"><span>1.0</span><span>.5</span><span>0</span></div><svg viewBox="0 0 250 100" preserveAspectRatio="none"><path d="M0 72 C28 70 32 44 58 53 S90 74 116 46 147 22 170 41 206 39 250 12" fill="none" stroke="#e66d67" strokeWidth="3" /><path d="M0 87 C32 86 47 75 76 79 S112 87 136 70 182 68 205 73 229 67 250 56" fill="none" stroke="#6b3e63" strokeWidth="3" strokeDasharray="5 5" /></svg><div className="chart-legend"><span><i className="coral-line" />Adaptive</span><span><i className="plum-line" />Baseline</span></div></div></div></div><div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Fleet detail</p><h3>Route performance</h3></div><button className="soft-button"><Search size={14} /> Filter</button></div><div className="table-scroll"><table><thead><tr><th>Route</th><th>Owner</th><th>Progress</th><th>Load</th><th>Outcome</th></tr></thead><tbody>{routes.map((r) => <tr key={r.id}><td><strong>{r.id}</strong><span>{r.lane}</span></td><td>{r.driver}</td><td><div className="table-progress"><i style={{ width: `${r.progress}%` }} /></div><small>{r.progress}%</small></td><td>{r.load}</td><td><Badge tone={r.status === "At risk" ? "critical" : r.status === "Recovering" ? "success" : "neutral"}>{r.status}</Badge></td></tr>)}</tbody></table></div><div className="panel-footer"><span><Check size={14} /> {resolved} disruptions resolved in this session</span><span>Generated just now</span></div></div></div>;
}

function LiveView({ routes, onSelect }: { routes: RouteRecord[]; onSelect: (id: string) => void }) {
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Live operations</p><h2>Every driver, every commitment.</h2><p>Stay ahead of route progress and help teams make the next best move.</p></div><div className="live-summary"><span className="pulse" /> Fleet synced <strong>12:38:24</strong></div></div><div className="live-grid"><div className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">Live route network</p><h3>North District</h3></div><button className="soft-button"><MapPin size={14} /> Recenter</button></div><RouteMap routes={routes} selectedRoute={routes[0].id} onSelect={onSelect} /></div><div className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Driver pulse</p><h3>Field updates</h3></div><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="activity-feed"><div><span className="activity-icon mint-bg"><Truck size={15} /></span><p><strong>V-12</strong> cleared Ridge checkpoint<small>Amara · 2 min ago</small></p></div><div><span className="activity-icon coral-bg"><CloudRain size={15} /></span><p><strong>Road alert</strong> received at A12<small>System · 6 min ago</small></p></div><div><span className="activity-icon plum-bg"><PackageCheck size={15} /></span><p><strong>Hope Valley clinic</strong> received 240 kg<small>Nia · 11 min ago</small></p></div><div><span className="activity-icon gold-bg"><UserRound size={15} /></span><p><strong>Maya</strong> requested a route check-in<small>V-07 · 14 min ago</small></p></div></div><div className="panel-footer"><span><CircleDot size={14} className="live-icon" /> Updates arrive every 30 seconds</span></div></div></div></div>;
}

function DispatchPlan({ routes, selectedRoute, onSelect, planState, onRunReplan }: { routes: RouteRecord[]; selectedRoute: string; onSelect: (id: string) => void; planState: string; onRunReplan: () => void }) {
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Dispatch plan</p><h2>A plan your team can trust.</h2><p>Stable where it should be, flexible where it needs to be. Completed stops stay protected.</p></div><button className="primary-button" onClick={onRunReplan}><RefreshCw size={15} /> {planState === "running" ? "Replanning…" : "Replan current plan"}</button></div><div className="panel plan-detail-panel"><div className="plan-detail-head"><div className="plan-tabs"><button className="active">Proposed plan <span>v4</span></button><button>Current plan</button><button>Baseline</button></div><Badge tone={planState === "proposed" ? "success" : "neutral"}>{planState === "proposed" ? "Ready to apply" : "Validated"}</Badge></div><div className="plan-detail-body"><div className="plan-route-list">{routes.map((r) => <RouteRow key={r.id} route={r} selected={selectedRoute === r.id} onClick={() => onSelect(r.id)} />)}</div><div className="plan-explanation"><div className="explanation-icon"><Sparkles size={17} /></div><p className="eyebrow">Why this plan</p><h3>Protect progress, move the risk.</h3><p>ReliefRoute keeps 8 completed stops and 3 in-progress commitments intact, then inserts the Hope Valley request into V-12's remaining capacity.</p><div className="decision-list"><div><Check size={14} /><span>Critical deliveries protected</span><strong>6 / 6</strong></div><div><Check size={14} /><span>Capacity violations</span><strong>0</strong></div><div><Check size={14} /><span>Route changes</span><strong>2 only</strong></div><div><Check size={14} /><span>Driver handoffs</span><strong>0</strong></div></div><button className="secondary-button full-button"><Check size={15} /> Apply proposed plan</button></div></div></div></div>;
}

function DisruptionDrawer({ open, onClose, type, setType, onInject, isRunning }: { open: boolean; onClose: () => void; type: DisruptionType; setType: (type: DisruptionType) => void; onInject: () => void; isRunning: boolean }) {
  if (!open) return null;
  const copy = typeCopy[type];
  return <div className="drawer-layer" onClick={onClose}><aside className="drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Simulation lab</p><h2>Inject a disruption</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><p className="drawer-intro">Test the plan with a realistic last-minute event. ReliefRoute will preserve work already in motion and find the best feasible recovery.</p><label className="field-label">Disruption type</label><div className="type-grid">{(Object.keys(typeCopy) as DisruptionType[]).map((option) => <button key={option} className={cn("type-option", option === type && "type-option-active")} onClick={() => setType(option)}><span className={cn("type-option-icon", option === "Road disruption" ? "coral-bg" : option === "Vehicle unavailable" ? "plum-bg" : option === "Urgent request" ? "gold-bg" : "mint-bg")}>{option === "Road disruption" ? <CloudRain size={16} /> : option === "Vehicle unavailable" ? <Truck size={16} /> : option === "Urgent request" ? <PackageCheck size={16} /> : <X size={16} />}</span><span>{option}</span>{option === type && <Check size={14} className="type-check" />}</button>)}</div><div className="field-group"><label className="field-label">Affected area</label><button className="select-field"><MapPin size={15} /> {type === "Urgent request" ? "Hope Valley clinic" : type === "Vehicle unavailable" ? "Vehicle V-18 · Riverbend" : type === "Delivery cancelled" ? "South clinic" : "North ridge · A12 checkpoint"}<ChevronDown size={15} /></button></div><div className="preview-card"><div className="preview-label"><span className="preview-pulse" /> Preview impact</div><strong>{copy.title}</strong><p>{copy.detail}</p><div className="preview-meta"><span>Priority <Badge tone={copy.severity === "Critical" ? "critical" : copy.severity === "Urgent" ? "urgent" : "neutral"}>{copy.severity}</Badge></span><span>Auto-recovery <strong>On</strong></span></div></div><button className="primary-button drawer-cta" onClick={onInject} disabled={isRunning}><Zap size={16} /> {isRunning ? "Replanning routes…" : "Inject & replan"}</button><p className="drawer-footnote"><ShieldCheck size={13} /> Simulation only · no field routes will be changed</p></aside></div>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [routes, setRoutes] = useState<RouteRecord[]>(initialRoutes);
  const [disruptions, setDisruptions] = useState<Disruption[]>(initialDisruptions);
  const [selectedRoute, setSelectedRoute] = useState("R-104");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [disruptionType, setDisruptionType] = useState<DisruptionType>("Road disruption");
  const [planState, setPlanState] = useState<"ready" | "running" | "proposed" | "applied">("ready");
  const [recoveryTime, setRecoveryTime] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [experimentStartedAt, setExperimentStartedAt] = useState<number | null>(null);

  const currentTitle = useMemo(() => navItems.find((item) => item.key === activeNav)?.label || "Overview", [activeNav]);

  const runReplan = () => {
    if (planState === "running") return;
    const startedAt = Date.now();
    setExperimentStartedAt(startedAt);
    setPlanState("running");
    window.setTimeout(() => {
      const measured = calculateRecoveryTime(startedAt, Date.now());
      setRecoveryTime(measured);
      setPlanState("proposed");
      setRoutes((current) => current.map((route) => route.id === "R-110" ? { ...route, status: "On route", eta: "13:24", progress: Math.min(100, route.progress + 4) } : route));
    }, 1350);
  };

  const injectDisruption = () => {
    const copy = typeCopy[disruptionType];
    const newDisruption: Disruption = { id: `D-${330 + disruptions.length}`, type: disruptionType, title: copy.title, detail: copy.detail, severity: copy.severity, age: "just now" };
    setDisruptions((current) => [newDisruption, ...current]);
    setDrawerOpen(false);
    runReplan();
  };

  const selectNav = (key: NavKey) => { setActiveNav(key); setMobileOpen(false); };

  return <div className="app-shell"><aside className={cn("sidebar", mobileOpen && "sidebar-open")}><div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>ReliefRoute</strong><small>recovery intelligence</small></div><button className="sidebar-close" onClick={() => setMobileOpen(false)}><PanelLeftClose size={17} /></button></div><div className="workspace-switcher"><div className="workspace-symbol">N</div><div><span>North District</span><small>Emergency response</small></div><ChevronDown size={14} /></div><nav className="main-nav"><p className="nav-label">Workspace</p>{navItems.map(({ key, label, icon: Icon, badge }) => <button key={key} className={cn("nav-item", activeNav === key && "nav-item-active")} onClick={() => selectNav(key)}><Icon size={17} /><span>{label}</span>{badge && <em>{badge}</em>}</button>)}</nav><div className="sidebar-callout"><div className="callout-spark"><Sparkles size={15} /></div><strong>Recovery mode</strong><p>Scenario testing is active. Make your next move with confidence.</p><button onClick={() => { setDrawerOpen(true); setMobileOpen(false); }}>Open simulation <ArrowUpRight size={13} /></button></div><div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17} /><span>Workspace settings</span></button><div className="status-line"><span className="status-check"><Check size={11} /></span><span>All systems operational</span></div></div></aside><main className="main-content"><AppHeader onMenu={() => setMobileOpen(true)} /><div className="content-inner"><div className="page-context"><div><span className="breadcrumb">Workspace <span>/</span> {currentTitle}</span></div><div className="context-actions"><button className="soft-button"><Clock3 size={14} /> Shift ends in 04:22</button><button className="primary-button compact" onClick={() => setDrawerOpen(true)}><Zap size={15} /> New disruption</button></div></div>{activeNav === "overview" && <Overview routes={routes} selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute} disruptions={disruptions} onOpenDisruption={() => setDrawerOpen(true)} planState={planState} recoveryTime={recoveryTime} onRunReplan={runReplan} />}{activeNav === "live" && <LiveView routes={routes} onSelect={setSelectedRoute} />}{activeNav === "plan" && <DispatchPlan routes={routes} selectedRoute={selectedRoute} onSelect={setSelectedRoute} planState={planState} onRunReplan={runReplan} />}{activeNav === "disruptions" && <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Disruption centre</p><h2>See the edge cases before they become delays.</h2><p>Inject, monitor, and resolve scenario events without losing sight of commitments.</p></div><button className="primary-button" onClick={() => setDrawerOpen(true)}><Zap size={15} /> Inject disruption</button></div><div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Event log</p><h3>All disruption events</h3></div><Badge tone="plum">{disruptions.length} scenarios</Badge></div><div className="disruption-list full-list">{disruptions.map((d) => <div className={cn("disruption-row", d.resolved && "disruption-resolved")} key={d.id}><div className={cn("severity-marker", `severity-${d.severity.toLowerCase()}`)} /><div className="disruption-copy"><div><strong>{d.title}</strong><Badge tone={d.resolved ? "success" : d.severity === "Critical" ? "critical" : d.severity === "Urgent" ? "urgent" : "neutral"}>{d.resolved ? "Resolved" : d.severity}</Badge></div><span>{d.detail}</span></div><span className="age">{d.age}</span><button className="soft-button">Review <ArrowUpRight size={13} /></button></div>)}</div></div></div>}{activeNav === "reports" && <MetricsView routes={routes} recoveryTime={recoveryTime} disruptions={disruptions} />}</div></main><DisruptionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} type={disruptionType} setType={setDisruptionType} onInject={injectDisruption} isRunning={planState === "running"} /></div>;
}

export { Home };
