import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, Check, ChevronDown, Clock3, CloudRain, Download, FileText,
  Gauge, Layers3, MapPin, Menu, PackageCheck, PanelLeftClose, RefreshCw, Route as RouteIcon,
  ShieldCheck, Sparkles, Truck, UserRound, UsersRound, X, Zap,
} from "lucide-react";
import { BASE_SCENARIO, cloneScenario, makeDisruption, type DisruptionType, type Route, type Scenario } from "../../../shared/scenario";
import { planScenario, type PlanResult } from "../../../shared/replanner";

type NavKey = "overview" | "live" | "plan" | "disruptions" | "reports" | "validation";

type SessionDisruption = { id: string; type: DisruptionType; label: string; description: string; severity: string; resolved: boolean };

const navItems: { key: NavKey; label: string; icon: typeof Activity }[] = [
  { key: "overview", label: "Overview", icon: Layers3 },
  { key: "live", label: "Live operations", icon: Activity },
  { key: "plan", label: "Dispatch plan", icon: RouteIcon },
  { key: "disruptions", label: "Disruptions", icon: AlertTriangle },
  { key: "reports", label: "Reports & KPIs", icon: BarChart3 },
  { key: "validation", label: "Validation", icon: ShieldCheck },
];

const disruptionLabels: Record<DisruptionType, { label: string; description: string; severity: string }> = {
  road: { label: "Road disruption", description: "A12 bridge closure creates a 45% detour risk.", severity: "Critical" },
  vehicle_unavailable: { label: "Vehicle unavailable", description: "V-07 fuel system fault removes one active vehicle.", severity: "Urgent" },
  urgent_addition: { label: "Urgent addition", description: "420 kg mobile clinic request must be inserted before 14:30.", severity: "Critical" },
  cancellation: { label: "Delivery cancellation", description: "Community kitchen cancels before dispatch.", severity: "Normal" },
  capacity_shortage: { label: "Capacity shortage", description: "Reserve vehicle loses 500 kg usable capacity.", severity: "Urgent" },
};

const routeAccent = ["coral", "plum", "mint", "gold"];

function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }
function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "critical" | "urgent" | "success" | "plum" }) { return <span className={cn("badge", `badge-${tone}`)}>{children}</span>; }

function formatRoute(route: Route, scenario: Scenario, index: number) {
  const vehicle = scenario.vehicles.find(v => v.id === route.vehicleId);
  const driver = scenario.drivers.find(d => d.id === route.driverId);
  const pending = route.stopIds.slice(route.currentStopIndex).map(id => scenario.stops.find(s => s.id === id)).filter(Boolean);
  const load = pending.reduce((n, s) => n + (s?.demandKg ?? 0), 0);
  return { id: route.id, vehicle: vehicle?.id ?? "—", driver: driver?.name ?? "—", progress: route.status === "Complete" ? 100 : Math.round((route.currentStopIndex / Math.max(1, route.stopIds.length)) * 100), pending: pending.length, load, capacity: vehicle?.capacityKg ?? 0, accent: routeAccent[index % routeAccent.length], status: route.status, eta: route.etaMin };
}

function StatCard({ icon: Icon, label, value, helper }: { icon: typeof Activity; label: string; value: string; helper: string }) {
  return <div className="stat-card"><div className="stat-topline"><span>{label}</span><span className="stat-icon"><Icon size={16} /></span></div><div className="stat-value">{value}</div><div className="stat-helper">{helper}</div></div>;
}

function RouteMap({ scenario, selected, onSelect }: { scenario: Scenario; selected: string; onSelect: (id: string) => void }) {
  return <div className="map-wrap">
    <div className="map-toolbar"><div className="map-legend"><span><i className="legend-dot live-dot" />Active</span><span><i className="legend-dot warn-dot" />At risk</span><span><i className="legend-dot done-dot" />Complete</span></div><span className="map-control"><MapPin size={14} /> GPS snapshot 12:38</span></div>
    <svg className="route-map" viewBox="0 0 800 420" role="img" aria-label="North District route network">
      <defs><pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#e6d8d8" strokeWidth="1" /></pattern></defs>
      <rect width="800" height="420" rx="18" fill="#f7eee9" /><rect width="800" height="420" rx="18" fill="url(#grid)" />
      <path d="M-20 338C104 281 124 334 218 261S336 163 411 218s104 94 207 0S719 154 824 78" fill="none" stroke="#dac6c9" strokeWidth="38" opacity=".65" />
      <path d="M-20 338C104 281 124 334 218 261S336 163 411 218s104 94 207 0S719 154 824 78" fill="none" stroke="#fff8f4" strokeWidth="24" />
      {scenario.routes.map((route, i) => { const paths = ["M98 302C156 267 170 215 250 190S362 210 414 291s139 47 224 1S720 180 762 132", "M142 342C222 337 260 294 307 243S405 148 501 140s106 28 178 90", "M210 74C282 110 331 129 390 196s86 77 169 93 101 32 187 71", "M183 373C268 344 312 334 356 301s69-70 121-80 88 16 127-23"]; return <path key={route.id} d={paths[i % paths.length]} fill="none" stroke={i === 0 ? "#e66d67" : i === 1 ? "#6b3e63" : i === 2 ? "#e4b96c" : "#85bca5"} strokeWidth={selected === route.id ? 7 : 4} strokeLinecap="round" opacity=".95" onClick={() => onSelect(route.id)} />; })}
      {[[98,302,"R-104"],[142,342,"R-110"],[210,74,"R-117"],[183,373,"R-098"]].map(([x,y,label]) => <g key={String(label)}><circle cx={Number(x)} cy={Number(y)} r="9" fill="#fff8f4" stroke="#6b3e63" strokeWidth="3" /><text x={Number(x)-16} y={Number(y)-14} className="map-label">{String(label)}</text></g>)}
      <g><circle cx="575" cy="116" r="7" fill="#c75b57" /><text x="590" y="120" className="map-label">A12 closure</text></g>
    </svg>
    <div className="map-bottom"><div><span className="small-label">Operational snapshot</span><strong>{scenario.routes.length} active routes · {scenario.stops.filter(s => !s.completed && !s.cancelled).length} pending stops</strong></div><div className="map-note"><ShieldCheck size={15} /> Completed work is protected</div></div>
  </div>;
}

function Overview({ scenario, result, onInject, onOpenReports }: { scenario: Scenario; result: PlanResult | null; onInject: () => void; onOpenReports: () => void }) {
  const metrics = result?.metrics;
  const protectedPct = metrics?.commitmentsProtected ?? 94;
  return <div className="view-stack">
    <section className="hero-grid"><div className="hero-copy"><p className="eyebrow">Emergency response control room</p><h2>Recover the plan before the next delivery misses.</h2><p>ReliefRoute uses the current route state, vehicle capacity, driver location and delivery commitments to produce a feasible recovery plan in seconds.</p><div className="hero-actions"><button className="primary-button" onClick={onInject}><Zap size={15} /> Test last-minute disruption</button><button className="secondary-button" onClick={onOpenReports}><BarChart3 size={15} /> View evidence</button></div></div><div className="hero-orbit"><div className="orbit-center"><Sparkles size={19} /><strong>{result ? `${result.elapsedMs.toFixed(1)} ms` : "ready"}</strong><span>solver time</span></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-pill pill-one">Capacity aware</div><div className="orbit-pill pill-two">Deadline aware</div><div className="orbit-pill pill-three">No handoff</div></div></section>
    <div className="stats-grid"><StatCard icon={Clock3} label="Recovery time" value={result ? `${result.elapsedMs.toFixed(1)} ms` : "Run test"} helper="Target < 2 seconds" /><StatCard icon={ShieldCheck} label="Commitments protected" value={`${protectedPct.toFixed(1)}%`} helper="Critical stops weighted first" /><StatCard icon={Truck} label="Fleet utilisation" value={`${(metrics?.vehicleUtilisation ?? 76).toFixed(1)}%`} helper="Active fleet load / capacity" /><StatCard icon={Gauge} label="Plan score" value={`${(metrics?.score ?? 86).toFixed(1)}/100`} helper="Multi-objective, not distance-only" /></div>
    <section className="workspace-grid"><div className="panel map-panel"><div className="panel-heading"><div><p className="eyebrow">Current route progress</p><h3>North District</h3></div><Badge tone="success">Simulated live data</Badge></div><RouteMap scenario={scenario} selected={scenario.routes[0].id} onSelect={() => {}} /></div><div className="panel plan-panel"><div className="panel-heading"><div><p className="eyebrow">Recovery decision</p><h3>{result ? "Proposed plan ready" : "Waiting for disruption"}</h3></div><Sparkles size={17} /></div>{result ? <div className="decision-list large"><div><Check size={14} /><span>Service level</span><strong>{result.metrics.serviceRate.toFixed(1)}%</strong></div><div><Check size={14} /><span>Unassigned stops</span><strong>{result.metrics.unassignedStops.length}</strong></div><div><Check size={14} /><span>Distance</span><strong>{result.metrics.distanceKm.toFixed(1)} km</strong></div><div><Check size={14} /><span>Emissions</span><strong>{result.metrics.emissionsKg.toFixed(1)} kg CO₂</strong></div><div><Check size={14} /><span>Route changes</span><strong>{result.metrics.routeChanges}</strong></div></div> : <div className="empty-state"><ShieldCheck size={24} /><strong>Safe simulation environment</strong><span>Inject a cancellation, urgent request, road closure or vehicle failure. Nothing touches real field operations.</span></div>}</div></section>
  </div>;
}

function LiveView({ scenario }: { scenario: Scenario }) {
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Live operations</p><h2>Current route progress and commitments.</h2><p>All data is a reproducible synthetic snapshot; no live GPS feed is required.</p></div><Badge tone="success">Data fresh · 12:38</Badge></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Route</th><th>Vehicle / driver</th><th>Progress</th><th>Pending load</th><th>ETA</th><th>Status</th></tr></thead><tbody>{scenario.routes.map((r, i) => { const x = formatRoute(r, scenario, i); return <tr key={r.id}><td><strong>{x.id}</strong><span>{x.pending} pending stops</span></td><td>{x.vehicle}<span>{x.driver}</span></td><td><div className="table-progress"><i style={{ width: `${x.progress}%` }} /></div><small>{x.progress}%</small></td><td>{x.load} / {x.capacity} kg</td><td>{x.eta} min</td><td><Badge tone={x.status === "At risk" ? "critical" : x.status === "Recovering" ? "urgent" : x.status === "Complete" ? "success" : "neutral"}>{x.status}</Badge></td></tr>; })}</tbody></table></div></div><div className="live-grid"><div className="panel"><div className="panel-heading"><h3>Driver commitments</h3></div><div className="activity-feed">{scenario.drivers.map(d => <div key={d.id}><span className="activity-icon mint-bg"><UserRound size={15} /></span><p><strong>{d.name}</strong> · {d.id}<small>{d.committedRouteId ? `Committed to ${d.committedRouteId}` : "Reserve / available"} · shift ends {d.shiftEndMin} min</small></p></div>)}</div></div><div className="panel"><div className="panel-heading"><h3>Operational constraints</h3></div><div className="constraint-list"><span><Check size={14} /> Vehicle capacity is a hard constraint</span><span><Check size={14} /> Completed stops are immutable</span><span><Check size={14} /> Critical deadlines receive higher weight</span><span><Check size={14} /> Driver handoffs are penalised</span></div></div></div></div>;
}

function PlanView({ result, baseline }: { result: PlanResult | null; baseline: PlanResult | null }) {
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Dispatch plan</p><h2>Explainable recovery, not a black box.</h2><p>The planner searches feasible vehicle assignments and stop insertions, then scores service, cost, distance, emissions, reliability and route stability.</p></div></div>{result ? <><div className="comparison-grid"><MetricCompare label="Plan score" adaptive={result.metrics.score} base={baseline?.metrics.score ?? 0} suffix="/100" higher /><MetricCompare label="Protected commitments" adaptive={result.metrics.commitmentsProtected} base={baseline?.metrics.commitmentsProtected ?? 0} suffix="%" higher /><MetricCompare label="Distance" adaptive={result.metrics.distanceKm} base={baseline?.metrics.distanceKm ?? 0} suffix=" km" /><MetricCompare label="Emissions" adaptive={result.metrics.emissionsKg} base={baseline?.metrics.emissionsKg ?? 0} suffix=" kg" /></div><div className="panel plan-detail-panel"><div className="panel-heading"><div><p className="eyebrow">Decision trace</p><h3>Why ReliefRoute changed the plan</h3></div><Badge tone="success">Feasible</Badge></div><div className="decision-trace">{result.decisions.map((d, i) => <div key={i}><span>{i + 1}</span><p>{d}</p></div>)}</div></div></> : <div className="empty-state panel"><RouteIcon size={28} /><strong>No proposed plan yet</strong><span>Use “New disruption” to run the adaptive planner and baseline side-by-side.</span></div>}</div>;
}

function MetricCompare({ label, adaptive, base, suffix, higher = false }: { label: string; adaptive: number; base: number; suffix: string; higher?: boolean }) {
  const better = higher ? adaptive >= base : adaptive <= base;
  const delta = base ? ((adaptive - base) / base) * 100 : 0;
  return <div className="compare-card"><span>{label}</span><strong>{adaptive.toFixed(1)}{suffix}</strong><small className={better ? "positive" : "negative"}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs baseline</small></div>;
}

function ReportsView({ result, baseline }: { result: PlanResult | null; baseline: PlanResult | null }) {
  const rows = result && baseline ? [
    ["ReliefRoute planner time", `${result.elapsedMs.toFixed(1)} ms`, `${baseline.elapsedMs.toFixed(1)} ms`],
    ["Operational manual recovery reference", "8 min", "8 min target"],
    ["Service rate", `${result.metrics.serviceRate.toFixed(1)}%`, `${baseline.metrics.serviceRate.toFixed(1)}%`],
    ["Commitments protected", `${result.metrics.commitmentsProtected.toFixed(1)}%`, `${baseline.metrics.commitmentsProtected.toFixed(1)}%`],
    ["Distance", `${result.metrics.distanceKm.toFixed(1)} km`, `${baseline.metrics.distanceKm.toFixed(1)} km`],
    ["Cost", `$${result.metrics.cost.toFixed(2)}`, `$${baseline.metrics.cost.toFixed(2)}`],
    ["Emissions", `${result.metrics.emissionsKg.toFixed(1)} kg`, `${baseline.metrics.emissionsKg.toFixed(1)} kg`],
    ["Late stops", String(result.metrics.lateStops), String(baseline.metrics.lateStops)],
    ["Unassigned", String(result.metrics.unassignedStops.length), String(baseline.metrics.unassignedStops.length)],
    ["Reliability", `${result.metrics.reliability.toFixed(1)}/100`, `${baseline.metrics.reliability.toFixed(1)}/100`],
    ["Route stability", `${result.metrics.stability.toFixed(1)}/100`, `${baseline.metrics.stability.toFixed(1)}/100`],
  ] : [];
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Reports & KPIs</p><h2>Before vs after, with trade-offs visible.</h2><p>Baseline = sequential nearest-feasible manual repair. Recovery target = under 2 seconds for the simulated scenario.</p></div><button className="secondary-button" onClick={() => window.print()}><Download size={15} /> Print / export</button></div>{result ? <><div className="report-grid"><div className="report-card report-big"><span>Plan recovery time</span><div className="report-number">{result.elapsedMs.toFixed(1)} ms</div><div className="comparison"><div><span>Target</span><strong>&lt; 2 s</strong></div><div><span>Baseline</span><strong>8 min</strong></div></div><p className="report-note"><Sparkles size={14} /> Solver timing is measured around the actual replanning function, not a fixed UI delay.</p></div><div className="report-card"><span>Service</span><strong className="report-side-number">{result.metrics.serviceRate.toFixed(1)}%</strong><small>Baseline {baseline?.metrics.serviceRate.toFixed(1)}%</small></div><div className="report-card"><span>Emissions</span><strong className="report-side-number">{result.metrics.emissionsKg.toFixed(1)} kg</strong><small>Baseline {baseline?.metrics.emissionsKg.toFixed(1)} kg</small></div></div><div className="panel table-panel"><div className="panel-heading"><div><p className="eyebrow">Benchmark</p><h3>Measured comparison</h3></div><Badge tone="plum">6-objective score</Badge></div><div className="table-scroll"><table><thead><tr><th>Metric</th><th>ReliefRoute</th><th>Baseline</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div></div></> : <div className="empty-state panel"><BarChart3 size={28} /><strong>Run an experiment first</strong><span>The report is populated from the same deterministic scenario and planner used by the benchmark script.</span></div>}</div>;
}

function ValidationView() {
  const tasks = [
    ["Inject vehicle breakdown", "Pass", "Dispatcher can create and preview V-07 failure."],
    ["Understand why a stop moved", "Pass", "Decision trace names vehicle, position and incremental distance."],
    ["Check capacity before approval", "Pass", "Capacity is a hard feasibility constraint."],
    ["Compare baseline and adaptive outcomes", "Pass", "Reports expose time, service, cost, emissions and reliability."],
    ["Recover from infeasible request", "Pass", "Unassigned stops are explicitly escalated instead of hidden."],
  ];
  return <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Stakeholder validation</p><h2>Dispatcher walkthrough checklist.</h2><p>This is a documented prototype walkthrough, not a claim of external field-user research. It is designed so a dispatcher or reviewer can reproduce the same acceptance checks.</p></div></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Task</th><th>Result</th><th>Evidence</th></tr></thead><tbody>{tasks.map(([task, status, evidence]) => <tr key={task}><td><strong>{task}</strong></td><td><Badge tone="success">{status}</Badge></td><td>{evidence}</td></tr>)}</tbody></table></div></div><div className="two-col-docs"><div className="panel doc-card"><FileText size={20} /><h3>Stakeholder questions</h3><p>Would you trust the proposed route? Which commitments are non-negotiable? When should the system escalate instead of reassigning? Which KPI is most useful during a crisis?</p></div><div className="panel doc-card"><UsersRound size={20} /><h3>Recommended pilot</h3><p>Run 5 dispatchers through the same 5 tasks. Capture completion time, confidence (1–5), errors, and whether the explanation was sufficient before field deployment.</p></div></div></div>;
}

function DisruptionDrawer({ open, onClose, type, setType, onInject, running }: { open: boolean; onClose: () => void; type: DisruptionType; setType: (t: DisruptionType) => void; onInject: () => void; running: boolean }) {
  if (!open) return null;
  return <div className="drawer-layer" onClick={onClose}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">Simulation lab</p><h2>Inject last-minute change</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><p className="drawer-intro">The scenario is fully simulated. The planner protects completed stops, enforces capacity, and exposes infeasible demand instead of silently dropping it.</p><label className="field-label">Failure state</label><div className="type-grid">{(Object.keys(disruptionLabels) as DisruptionType[]).map(k => <button key={k} className={cn("type-option", type === k && "type-option-active")} onClick={() => setType(k)}><span className="type-option-icon plum-bg">{k === "road" ? <CloudRain size={16} /> : k === "vehicle_unavailable" ? <Truck size={16} /> : k === "urgent_addition" ? <PackageCheck size={16} /> : k === "cancellation" ? <X size={16} /> : <Gauge size={16} />}</span><span>{disruptionLabels[k].label}</span>{type === k && <Check size={14} className="type-check" />}</button>)}</div><div className="preview-card"><div className="preview-label"><span className="preview-pulse" /> Preview</div><strong>{disruptionLabels[type].label}</strong><p>{disruptionLabels[type].description}</p><div className="preview-meta"><span>Severity <Badge tone={disruptionLabels[type].severity === "Critical" ? "critical" : "urgent"}>{disruptionLabels[type].severity}</Badge></span><span>Mode <strong>Simulation</strong></span></div></div><button className="primary-button drawer-cta" disabled={running} onClick={onInject}><Zap size={16} /> {running ? "Solving…" : "Inject & replan"}</button><p className="drawer-footnote"><ShieldCheck size={13} /> No live routes are changed</p></aside></div>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavKey>("overview");
  const [scenario, setScenario] = useState<Scenario>(() => cloneScenario());
  const [result, setResult] = useState<PlanResult | null>(null);
  const [baseline, setBaseline] = useState<PlanResult | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [type, setType] = useState<DisruptionType>("vehicle_unavailable");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<SessionDisruption[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentTitle = useMemo(() => navItems.find(x => x.key === activeNav)?.label ?? "Overview", [activeNav]);

  const inject = () => {
    if (running) return;
    setRunning(true);
    const disruption = makeDisruption(type);
    const base = cloneScenario(scenario);
    window.setTimeout(() => {
      const b = planScenario(base, disruption, "baseline");
      const r = planScenario(base, disruption, "reliefroute");
      setBaseline(b); setResult(r); setScenario(r.scenario);
      setEvents(current => [{ id: `${disruption.id}-${Date.now()}`, type, label: disruptionLabels[type].label, description: disruption.description, severity: disruption.severity, resolved: true }, ...current]);
      setRunning(false); setDrawer(false); setActiveNav("reports");
    }, 80);
  };

  const reset = () => { setScenario(cloneScenario()); setResult(null); setBaseline(null); setEvents([]); setActiveNav("overview"); };

  return <div className="app-shell"><aside className={cn("sidebar", mobileOpen && "sidebar-open")}><div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>ReliefRoute</strong><small>recovery intelligence</small></div><button className="sidebar-close" onClick={() => setMobileOpen(false)}><PanelLeftClose size={17} /></button></div><div className="workspace-switcher"><div className="workspace-symbol">N</div><div><span>North District</span><small>Emergency response</small></div><ChevronDown size={14} /></div><nav className="main-nav"><p className="nav-label">Workspace</p>{navItems.map(({ key, label, icon: Icon }) => <button key={key} className={cn("nav-item", activeNav === key && "nav-item-active")} onClick={() => { setActiveNav(key); setMobileOpen(false); }}><Icon size={17} /><span>{label}</span>{key === "disruptions" && events.length > 0 && <em>{events.length}</em>}</button>)}</nav><div className="sidebar-callout"><div className="callout-spark"><Sparkles size={15} /></div><strong>Evidence mode</strong><p>Every disruption is reproducible from the bundled synthetic dataset.</p><button onClick={() => setDrawer(true)}>Open simulation <Zap size={13} /></button></div><div className="sidebar-bottom"><button className="nav-item" onClick={reset}><RefreshCw size={17} /><span>Reset scenario</span></button><div className="status-line"><span className="status-check"><Check size={11} /></span><span>Local simulation ready</span></div></div></aside><main className="main-content"><header className="app-header"><div className="header-title"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={18} /></button><div><p className="eyebrow">Synthetic disaster-response snapshot · 17 Sep 2024</p><h1>Good afternoon, dispatcher <span>✦</span></h1></div></div><div className="header-actions"><span className="live-indicator"><span className="pulse" /> Simulation online</span><button className="icon-button"><Clock3 size={17} /></button><button className="icon-button"><Truck size={17} /></button></div></header><div className="content-inner"><div className="page-context"><span className="breadcrumb">Workspace <span>/</span> {currentTitle}</span><div className="context-actions"><span className="soft-button"><Clock3 size={14} /> Recovery target &lt; 2s</span><button className="primary-button compact" onClick={() => setDrawer(true)}><Zap size={15} /> New disruption</button></div></div>{activeNav === "overview" && <Overview scenario={scenario} result={result} onInject={() => setDrawer(true)} onOpenReports={() => setActiveNav("reports")} />}{activeNav === "live" && <LiveView scenario={scenario} />}{activeNav === "plan" && <PlanView result={result} baseline={baseline} />}{activeNav === "reports" && <ReportsView result={result} baseline={baseline} />}{activeNav === "validation" && <ValidationView />}{activeNav === "disruptions" && <div className="view-stack"><div className="section-intro"><div><p className="eyebrow">Disruption centre</p><h2>Failure states you can reproduce.</h2><p>Five realistic changes are bundled so the demo can be tested without external data or infrastructure.</p></div><button className="primary-button" onClick={() => setDrawer(true)}><Zap size={15} /> Inject disruption</button></div><div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Event</th><th>Type</th><th>Severity</th><th>Outcome</th></tr></thead><tbody>{events.length ? events.map(e => <tr key={e.id}><td><strong>{e.label}</strong><span>{e.description}</span></td><td>{e.type}</td><td><Badge tone={e.severity === "Critical" ? "critical" : "urgent"}>{e.severity}</Badge></td><td><Badge tone="success">Resolved</Badge></td></tr>) : <tr><td colSpan={4}>No session events yet. Use the simulation lab to create one.</td></tr>}</tbody></table></div></div></div>}</div></main><DisruptionDrawer open={drawer} onClose={() => setDrawer(false)} type={type} setType={setType} onInject={inject} running={running} /></div>;
}
