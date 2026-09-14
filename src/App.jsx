import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-shadow.png";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  LayoutDashboard, Map as MapIcon, Users, Bell, BarChart3, FileText, Cpu, Settings as SettingsIcon,
  Search, ChevronDown, Wifi, Database, Server, Activity, Battery, Signal, Thermometer, Wind,
  MapPin, X, ZoomIn, ZoomOut, Locate, AlertTriangle, AlertOctagon, CheckCircle2, Clock, Phone,
  ChevronRight, ChevronLeft, ArrowUpDown, Download, RefreshCw, Power, Radio, ShieldCheck,
  TrendingUp, TrendingDown, User, Droplets, Gauge as GaugeIcon, Layers, Calendar, ChevronsUpDown,
  CircleAlert, PlugZap, HardDrive, Router
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ============================================================================
   SAFETYWATCH PRO — Industrial Worker Safety Monitoring Platform
   Design tokens follow the brief exactly: enterprise IoT (Honeywell Forge /
   Siemens Insights Hub) register. Signature element: instrument-panel radial
   gauges + a live factory schematic (not literal map tiles) that reads like a
   SCADA floor plan, which is how real industrial platforms plot assets.
   ========================================================================== */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
const COLORS = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#EFF4FF",
  text: "#0F172A",
  secondary: "#64748B",
  border: "#E5E7EB",
  safe: "#10B981",
  safeSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  critical: "#DC2626",
  criticalSoft: "#FEF2F2",
  offline: "#94A3B8",
  offlineSoft: "#F1F5F9",
};

/* ---------------------------------- DATA --------------------------------- */

const DEPARTMENTS = ["Assembly", "Welding", "Paint Shop", "Warehouse", "Maintenance", "Quality Control"];
const ZONES = [
  { id: "Z-A", name: "Zone A · Assembly Floor", kind: "safe", rect: { left: 4, top: 7, width: 40, height: 38 } },
  { id: "Z-B", name: "Zone B · Welding Bay", kind: "restricted", rect: { left: 47, top: 7, width: 29, height: 27 } },
  { id: "Z-C", name: "Zone C · Paint Booth", kind: "danger", rect: { left: 47, top: 38, width: 29, height: 25 } },
  { id: "Z-D", name: "Zone D · Warehouse", kind: "safe", rect: { left: 4, top: 48, width: 40, height: 30 } },
  { id: "Z-E", name: "Zone E · Loading Dock", kind: "restricted", rect: { left: 79, top: 7, width: 17, height: 66 } },
];

const FIRST = ["Arun", "Priya", "Karthik", "Divya", "Suresh", "Meena", "Vignesh", "Lakshmi", "Rahul", "Anitha", "Bala", "Kavya", "Manoj", "Sindhu"];
const LAST = ["Kumar", "Raj", "Iyer", "Nair", "Pillai", "Reddy", "Menon", "Rao", "Sharma", "Gupta", "Venkat", "Das", "Mohan", "Krishnan"];
const DESIGNATIONS = { Assembly: "Line Technician", Welding: "Welding Operator", "Paint Shop": "Spray Technician", Warehouse: "Logistics Associate", Maintenance: "Maintenance Engineer", "Quality Control": "QC Inspector" };

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rnd = seededRandom(42);
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function round1(n) { return Math.round(n * 10) / 10; }

function computeStatus(gas, aqi, temp) {
  if (gas > 420 || aqi > 150 || temp > 44) return "critical";
  if (gas > 250 || aqi > 100 || temp > 37) return "warning";
  return "safe";
}

const WORKERS = Array.from({ length: 14 }).map((_, i) => {
  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const zone = ZONES[i % ZONES.length];
  const offline = i === 6 || i === 11;
  const gas = zone.kind === "danger" ? 180 + rnd() * 320 : zone.kind === "restricted" ? 90 + rnd() * 220 : 40 + rnd() * 130;
  const aqi = zone.kind === "danger" ? 70 + rnd() * 110 : zone.kind === "restricted" ? 40 + rnd() * 70 : 20 + rnd() * 45;
  const temp = zone.kind === "danger" ? 34 + rnd() * 14 : 26 + rnd() * 9;
  const humidity = 38 + rnd() * 30;
  const status = offline ? "offline" : computeStatus(gas, aqi, temp);
  const rx = zone.rect.left + 10 + rnd() * (zone.rect.width - 20);
  const ry = zone.rect.top + 10 + rnd() * (zone.rect.height - 20);
  return {
    id: `WK-${String(1000 + i)}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    department: dept,
    designation: DESIGNATIONS[dept],
    zone: zone.name,
    zoneId: zone.id,
    status,
    speed: offline ? 0 : round1(rnd() * 4.2),
    temp: round1(temp),
    humidity: round1(humidity),
    gas: Math.round(gas),
    aqi: Math.round(aqi),
    battery: offline ? Math.round(5 + rnd() * 10) : Math.round(28 + rnd() * 70),
    signal: offline ? 0 : Math.round(55 + rnd() * 45),
    device: `ESP-${8266000 + i}`,
    mqtt: offline ? "disconnected" : "connected",
    lastUpdate: offline ? `${8 + Math.floor(rnd() * 40)} min ago` : `${1 + Math.floor(rnd() * 12)} sec ago`,
    sos: false,
    emergencyContact: `+91 98${Math.floor(10000000 + rnd() * 89999999)}`,
    x: round1(rx),
    y: round1(ry),
    safetyScore: offline ? 0 : Math.max(38, Math.round(100 - (gas / 6) - (aqi / 3) - Math.max(0, temp - 30) * 1.4)),
  };
});
WORKERS[3].status = "critical";
WORKERS[3].gas = 468;
WORKERS[3].sos = true;
WORKERS[9].status = "warning";

const ALERTS = [
  { id: "AL-3081", severity: "critical", title: "Gas concentration exceeded safe threshold", worker: WORKERS[3].name, workerId: WORKERS[3].id, zone: "Zone C · Paint Booth", time: "2 min ago", status: "open", desc: "MQ2 sensor reported 468 ppm, above the 420 ppm critical threshold. SOS was triggered automatically." },
  { id: "AL-3080", severity: "warning", title: "Ambient temperature trending high", worker: WORKERS[9].name, workerId: WORKERS[9].id, zone: "Zone B · Welding Bay", time: "11 min ago", status: "acknowledged", desc: "DHT22 reading sustained above 37°C for 6 consecutive minutes." },
  { id: "AL-3079", severity: "warning", title: "Air quality index degraded", worker: WORKERS[2].name, workerId: WORKERS[2].id, zone: "Zone B · Welding Bay", time: "26 min ago", status: "acknowledged", desc: "MQ135 AQI reading crossed 100, ventilation check recommended." },
  { id: "AL-3078", severity: "info", title: "Device reconnected to MQTT broker", worker: WORKERS[6].name, workerId: WORKERS[6].id, zone: "Zone E · Loading Dock", time: "34 min ago", status: "resolved", desc: "ESP8266 wearable re-established broker connection after signal loss." },
  { id: "AL-3077", severity: "critical", title: "Wearable offline beyond timeout", worker: WORKERS[11].name, workerId: WORKERS[11].id, zone: "Zone D · Warehouse", time: "41 min ago", status: "resolved", desc: "No heartbeat received for over 8 minutes. Supervisor dispatched for visual check." },
  { id: "AL-3076", severity: "info", title: "Shift zone reassignment", worker: WORKERS[7].name, workerId: WORKERS[7].id, zone: "Zone A · Assembly Floor", time: "58 min ago", status: "resolved", desc: "Worker moved from Zone D to Zone A per shift roster." },
];

const GAS_TREND = Array.from({ length: 12 }).map((_, i) => ({ t: `${(6 + i) % 24}:00`, gas: Math.round(120 + Math.sin(i / 2) * 60 + rnd() * 50), threshold: 420 }));
const TEMP_TREND = Array.from({ length: 12 }).map((_, i) => ({ t: `${(6 + i) % 24}:00`, temp: round1(28 + Math.sin(i / 2.4) * 4 + rnd() * 2) }));
const AQI_TREND = Array.from({ length: 12 }).map((_, i) => ({ t: `${(6 + i) % 24}:00`, aqi: Math.round(45 + Math.cos(i / 2.2) * 20 + rnd() * 15) }));
const ZONE_OCC = ZONES.map((z) => ({ name: z.id, value: WORKERS.filter((w) => w.zoneId === z.id).length }));
const SAFETY_TREND = Array.from({ length: 7 }).map((_, i) => ({ d: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i], score: Math.round(84 + rnd() * 10) }));

const DEVICES = WORKERS.map((w, i) => ({
  id: w.device, worker: w.name, firmware: `v2.${1 + (i % 4)}.${i % 9}`, mqtt: w.mqtt, ip: `10.14.${i}.${20 + i}`,
  mac: `A4:CF:12:${(10 + i).toString(16).toUpperCase()}:B3:5${i % 10}`, wifi: w.status === "offline" ? 0 : Math.round(60 + rnd() * 40),
  sensors: w.status === "offline" ? "no data" : "nominal", battery: w.battery, restart: `${1 + (i % 6)}d ${2 + i}h ago`,
}));

/* ------------------------------ STATUS HELPERS ---------------------------- */

function statusColor(s) {
  return { safe: COLORS.safe, warning: COLORS.warning, critical: COLORS.critical, offline: COLORS.offline }[s];
}
function statusSoft(s) {
  return { safe: COLORS.safeSoft, warning: COLORS.warningSoft, critical: COLORS.criticalSoft, offline: COLORS.offlineSoft }[s];
}
function statusLabel(s) {
  return { safe: "Safe", warning: "Warning", critical: "Critical", offline: "Offline" }[s];
}

function StatusChip({ status, dot = true }) {
  return (
    <span className="chip" style={{ color: statusColor(status), background: statusSoft(status) }}>
      {dot && <span className="chip-dot" style={{ background: statusColor(status) }} />}
      {statusLabel(status)}
    </span>
  );
}

function Avatar({ name, size = 34 }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const hues = ["#2563EB", "#0EA5E9", "#7C3AED", "#0D9488", "#DB2777", "#CA8A04"];
  let hash = 0;
  for (const c of name) hash += c.charCodeAt(0);
  const bg = hues[hash % hues.length];
  return (
    <div className="avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

/* --------------------------------- GAUGE ---------------------------------- */

function RadialGauge({ value, max = 100, label, sub, size = 168, accent = COLORS.primary, unit = "" }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const startAngle = 140, sweep = 260;
  const pct = Math.max(0, Math.min(1, value / max));
  const toRad = (deg) => (deg * Math.PI) / 180;
  const polar = (angleDeg) => {
    const a = toRad(angleDeg);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcPath = (a0, a1) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const ticks = Array.from({ length: 11 });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arcPath(startAngle, startAngle + sweep)} stroke={COLORS.border} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      <path d={arcPath(startAngle, startAngle + sweep * pct)} stroke={accent} strokeWidth={stroke} fill="none" strokeLinecap="round" style={{ transition: "all 0.8s cubic-bezier(.4,0,.2,1)" }} />
      {ticks.map((_, i) => {
        const a = startAngle + (sweep / 10) * i;
        const [x1, y1] = polar(a);
        const inner = r - stroke;
        const [x2, y2] = [cx + inner * Math.cos(toRad(a)), cy + inner * Math.sin(toRad(a))];
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#CBD5E1" strokeWidth={1} />;
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.2} fontWeight="700" fill={COLORS.text} fontFamily="Inter">{value}{unit}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={11} fontWeight="600" fill={COLORS.secondary} fontFamily="Inter" letterSpacing="0.03em">{label}</text>
      {sub && <text x={cx} y={cy + 36} textAnchor="middle" fontSize={10} fill={COLORS.secondary} fontFamily="Inter">{sub}</text>}
    </svg>
  );
}

/* --------------------------------- KPI CARD -------------------------------- */

function KpiCard({ icon: Icon, label, value, delta, deltaGood, unit = "", accent = COLORS.primary }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ background: `${accent}14`, color: accent }}><Icon size={17} /></div>
        {delta !== undefined && (
          <span className="kpi-delta" style={{ color: deltaGood ? COLORS.safe : COLORS.critical }}>
            {deltaGood ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {delta}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}<span className="kpi-unit">{unit}</span></div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function SystemPill({ icon: Icon, label, ok, sub }) {
  return (
    <div className="sys-pill">
      <div className="sys-pill-icon" style={{ color: ok ? COLORS.safe : COLORS.critical }}><Icon size={15} /></div>
      <div>
        <div className="sys-pill-label">{label}</div>
        <div className="sys-pill-sub" style={{ color: ok ? COLORS.safe : COLORS.critical }}>{sub}</div>
      </div>
    </div>
  );
}

/* ================================ NAVIGATION =============================== */

const NAV_TOP = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Live Map", icon: MapIcon },
  { id: "workers", label: "Workers", icon: Users },
  { id: "alerts", label: "Alerts", icon: Bell, badge: ALERTS.filter((a) => a.status === "open").length },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "devices", label: "Devices", icon: Cpu },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

const SIDEBAR_GROUPS = [
  { title: "Operations", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "map", label: "Live Tracking", icon: MapIcon },
    { id: "workers", label: "Workers", icon: Users },
    { id: "devices", label: "Devices", icon: Cpu },
    { id: "zones", label: "Zones", icon: Layers },
  ]},
  { title: "Monitoring", items: [
    { id: "alerts", label: "Alerts", icon: Bell, badge: ALERTS.filter((a) => a.status === "open").length },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "history", label: "History", icon: Clock },
  ]},
  { title: "System", items: [
    { id: "health", label: "System Health", icon: Activity },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]},
];

function calculateSafetyScore({ temperature, mq5, mq135 }) {
  let score = 100;

  if (typeof temperature === "number") {
    if (temperature > 38) score -= 30;
    else if (temperature >= 35) score -= 15;
  }

  if (typeof mq5 === "number") {
    if (mq5 > 600) score -= 35;
    else if (mq5 > 300) score -= 20;
  }

  if (mq135 !== null && mq135 !== undefined && mq135 !== "") {
    if (Number(mq135) === 0) score -= 35;
  }

  return Math.max(0, Math.min(100, score));
}

/* ================================ APP SHELL ================================ */

export default function SafetyWatchPro() {
  const [workerData, setWorkerData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isKiosk, setIsKiosk] = useState(false);
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [sensorLastUpdated, setSensorLastUpdated] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {

    async function getData(){

        try{

            const res = await fetch("http://localhost:5000/api/worker");

            const data = await res.json();

            setWorkerData(data);
            setBackendOnline(true);
            setSensorLastUpdated(new Date());

        }catch(err){

            console.log(err);
            setBackendOnline(false);
            setWorkerData(null);

        }

    }

    getData();

    const timer = setInterval(getData,2000);

    return ()=>clearInterval(timer);

},[]);

  const resolvedPage = ["zones", "history", "health"].includes(page) ? "dashboard" : page;
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleKiosk = () => {
    setIsKiosk((v) => !v);
  };

  return (
    <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", background: COLORS.bg, color: COLORS.text, minHeight: "100vh", width: "100%", ...(isKiosk ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 } : {}) }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        button { font-family: inherit; cursor: pointer; }
        input, select { font-family: inherit; }

        .chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 5px; font-size: 12px; font-weight: 600; }
        .chip-dot { width: 6px; height: 6px; border-radius: 50%; }

        .avatar { border-radius: 8px; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }

        .kpi-card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 16px 18px; transition: box-shadow .18s ease, transform .18s ease; }
        .kpi-card:hover { box-shadow: 0 4px 18px rgba(15,23,42,0.07); transform: translateY(-1px); }
        .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .kpi-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .kpi-delta { font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
        .kpi-value { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
        .kpi-unit { font-size: 14px; font-weight: 600; color: ${COLORS.secondary}; margin-left: 2px; }
        .kpi-label { font-size: 12.5px; color: ${COLORS.secondary}; margin-top: 6px; font-weight: 500; }

        .sys-pill { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; }
        .sys-pill-icon { width: 30px; height: 30px; border-radius: 8px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; }
        .sys-pill-label { font-size: 12px; font-weight: 600; color: ${COLORS.text}; }
        .sys-pill-sub { font-size: 11px; font-weight: 600; margin-top: 1px; }

        .card { background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 10px; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid ${COLORS.border}; }
        .card-title { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
        .card-subtitle { font-size: 12px; color: ${COLORS.secondary}; margin-top: 2px; font-weight: 500; }

        .btn { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 7px 13px; border-radius: 7px; border: 1px solid ${COLORS.border}; background: white; color: ${COLORS.text}; transition: all .15s ease; }
        .btn:hover { border-color: #CBD5E1; background: #F8FAFC; }
        .btn-primary { background: ${COLORS.primary}; border-color: ${COLORS.primary}; color: white; }
        .btn-primary:hover { background: ${COLORS.primaryDark}; border-color: ${COLORS.primaryDark}; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }

        .live-feed { padding: 0; overflow: hidden; background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%); }
        .live-feed-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 18px 10px; border-bottom: 1px solid ${COLORS.border}; }
        .live-feed-title { font-size: 14px; font-weight: 800; letter-spacing: 0.08em; color: ${COLORS.text}; }
        .live-feed-live { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: ${COLORS.critical}; }
        .live-feed-dot { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.critical}; box-shadow: 0 0 0 0 rgba(220, 38, 38, .45); animation: pulseLive 1.8s infinite; }
        .live-feed-time { font-size: 11px; color: ${COLORS.secondary}; font-weight: 600; }
        .live-feed-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding: 14px 18px 18px; }
        .live-feed-card { background: #F8FAFC; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 16px 14px 12px; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8); }
        .live-feed-label { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; color: ${COLORS.secondary}; text-transform: uppercase; }
        .live-feed-value { font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: ${COLORS.text}; }
        .live-feed-meta { font-size: 12px; color: ${COLORS.secondary}; font-weight: 600; }
        .live-status-strip { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 16px; border: 1px solid ${COLORS.border}; border-radius: 12px; background: #F8FAFC; }
        .live-status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; }
        .live-status-dot { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.safe}; box-shadow: 0 0 0 0 rgba(16,185,129,0.45); animation: pulseLiveGreen 1.8s infinite; }
        @keyframes pulseLive { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0.45); } 70% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(220,38,38,0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220,38,38,0); } }
        @keyframes pulseLiveGreen { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0.45); } 70% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(16,185,129,0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

        .side-link { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 7px; font-size: 13px; font-weight: 500; color: #475569; transition: all .12s ease; position: relative; }
        .side-link:hover { background: #F1F5F9; color: ${COLORS.text}; }
        .side-link.active { background: ${COLORS.primarySoft}; color: ${COLORS.primary}; font-weight: 600; }
        .side-link.active::before { content: ""; position: absolute; left: -12px; top: 6px; bottom: 6px; width: 3px; background: ${COLORS.primary}; border-radius: 2px; }

        .top-link { padding: 6px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; color: #475569; }
        .top-link:hover { background: #F1F5F9; }
        .top-link.active { color: ${COLORS.primary}; background: ${COLORS.primarySoft}; font-weight: 600; }

        table.grid { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.grid thead th { text-align: left; font-size: 11px; font-weight: 700; color: ${COLORS.secondary}; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 14px; border-bottom: 1px solid ${COLORS.border}; background: #FAFBFC; white-space: nowrap; }
        table.grid tbody td { padding: 11px 14px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        table.grid tbody tr:hover { background: #FAFBFC; }
        .th-sort { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; user-select: none; }
        .th-sort:hover { color: ${COLORS.text}; }

        .fade-in { animation: fadeIn .35s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseRing { 0% { transform: scale(0.6); opacity: .55; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

        input.search-input { border: 1px solid ${COLORS.border}; border-radius: 7px; padding: 7px 10px 7px 32px; font-size: 13px; outline: none; width: 100%; background: white; }
        input.search-input:focus { border-color: ${COLORS.primary}; box-shadow: 0 0 0 3px ${COLORS.primarySoft}; }
        select.filter-select { border: 1px solid ${COLORS.border}; border-radius: 7px; padding: 7px 26px 7px 10px; font-size: 12.5px; font-weight: 500; outline: none; background: white; appearance: none; }
      `}</style>

      {!(isFullscreen || isKiosk) && (
        <TopBar page={page} setPage={setPage} now={now} notifOpen={notifOpen} setNotifOpen={setNotifOpen} userOpen={userOpen} setUserOpen={setUserOpen} toggleFullScreen={toggleFullScreen} isFullscreen={isFullscreen} toggleKiosk={toggleKiosk} isKiosk={isKiosk} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <SideBar page={page} setPage={setPage} isFullscreen={isFullscreen || isKiosk} />
        <main style={{ flex: 1, minWidth: 0, padding: (isFullscreen || isKiosk) ? 0 : "22px 26px 60px", maxWidth: "100%", height: (isFullscreen || isKiosk) ? "100vh" : undefined }}>
          {isFullscreen && (
            <div style={{ position: "fixed", top: 12, right: 12, zIndex: 70 }}>
              <button onClick={toggleFullScreen} className="btn btn-sm">Exit fullscreen</button>
            </div>
          )}
          {isKiosk && (
            <div style={{ position: "fixed", top: 12, right: 12, zIndex: 70 }}>
              <button onClick={toggleKiosk} className="btn btn-sm">Exit kiosk</button>
            </div>
          )}
          <div className="fade-in" key={resolvedPage}>
            {resolvedPage === "dashboard" && <Dashboard setPage={setPage} workerData={workerData} sensorLastUpdated={sensorLastUpdated} backendOnline={backendOnline} />}
            {resolvedPage === "map" && <LiveMap workerData={workerData} />}
            {resolvedPage === "workers" && <WorkersPage />}
            {resolvedPage === "alerts" && <AlertsPage />}
            {resolvedPage === "analytics" && <AnalyticsPage />}
            {resolvedPage === "reports" && <ReportsPage />}
            {resolvedPage === "devices" && <DevicesPage />}
            {resolvedPage === "settings" && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ================================== TOP BAR ================================= */

function TopBar({ page, setPage, now, notifOpen, setNotifOpen, userOpen, setUserOpen, toggleFullScreen, isFullscreen, toggleKiosk, isKiosk }) {
  return (
    <header style={{ height: 58, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.card, display: "flex", alignItems: "center", padding: "0 20px", position: "sticky", top: 0, zIndex: 40, gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 210 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={17} color="white" strokeWidth={2.4} />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em" }}>SafetyWatch <span style={{ color: COLORS.primary }}>Pro</span></div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: COLORS.secondary, letterSpacing: "0.05em" }}>INDUSTRIAL SAFETY PLATFORM</div>
        </div>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto" }}>
        {NAV_TOP.map((n) => (
          <button key={n.id} onClick={() => setPage(n.id)} className={`top-link ${page === n.id ? "active" : ""}`} style={{ border: "none", background: page === n.id ? undefined : "transparent", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            {n.label}
            {n.badge ? <span style={{ background: COLORS.critical, color: "white", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 5px", lineHeight: 1.4 }}>{n.badge}</span> : null}
          </button>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={() => toggleFullScreen()} className="btn btn-sm" title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} style={{ padding: 6 }}>
          <ChevronsUpDown size={14} />
        </button>
        <button onClick={() => toggleKiosk()} className="btn btn-sm" title={isKiosk ? "Exit kiosk" : "Kiosk mode"} style={{ padding: 6 }}>
          {isKiosk ? "Kiosk On" : "Kiosk"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: COLORS.safe, background: COLORS.safeSoft, padding: "5px 10px", borderRadius: 7 }}>
          <Radio size={13} style={{ animation: "blink 2s infinite" }} /> MQTT Live
        </div>

        <div style={{ position: "relative" }}>
          <button onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }} className="btn btn-sm" style={{ position: "relative", padding: 7 }}>
            <Bell size={16} />
            <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: "50%", background: COLORS.critical, border: "2px solid white" }} />
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: 40, width: 320, background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(15,23,42,0.14)", zIndex: 50 }}>
              <div style={{ padding: "11px 14px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, fontWeight: 700 }}>Notification Center</div>
              {ALERTS.slice(0, 4).map((a) => (
                <div key={a.id} style={{ padding: "10px 14px", borderBottom: `1px solid #F1F5F9`, display: "flex", gap: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: statusColor(a.severity === "info" ? "offline" : a.severity) }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: COLORS.secondary, marginTop: 2 }}>{a.worker} · {a.time}</div>
                  </div>
                </div>
              ))}
              <button className="btn" style={{ width: "100%", border: "none", borderRadius: 0, borderTop: `1px solid ${COLORS.border}`, justifyContent: "center", color: COLORS.primary }} onClick={() => { setPage("alerts"); setNotifOpen(false); }}>View all alerts</button>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 22, background: COLORS.border }} />

        <div style={{ position: "relative" }}>
          <button onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none" }}>
            <Avatar name="Ravi Menon" size={30} />
            <div style={{ textAlign: "left", lineHeight: 1.15 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Ravi Menon</div>
              <div style={{ fontSize: 10.5, color: COLORS.secondary }}>Safety Supervisor</div>
            </div>
            <ChevronDown size={14} color={COLORS.secondary} />
          </button>
          {userOpen && (
            <div style={{ position: "absolute", right: 0, top: 44, width: 190, background: "white", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(15,23,42,0.14)", zIndex: 50, padding: 6 }}>
              {["Profile", "Preferences", "Sign out"].map((it) => (
                <div key={it} style={{ padding: "8px 10px", fontSize: 13, borderRadius: 6, fontWeight: 500 }} className="side-link">{it}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* =================================== SIDEBAR ================================= */

function SideBar({ page, setPage, isFullscreen }) {
  if (isFullscreen) return null;
  return (
    <aside style={{ width: 218, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, background: COLORS.card, minHeight: "calc(100vh - 58px)", padding: "18px 12px", position: "sticky", top: 58, alignSelf: "flex-start" }}>
      {SIDEBAR_GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px 8px" }}>{g.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {g.items.map((it) => (
              <button key={it.id} onClick={() => setPage(it.id)} className={`side-link ${page === it.id ? "active" : ""}`} style={{ background: "transparent", border: "none", width: "100%", justifyContent: "flex-start" }}>
                <it.icon size={16} />
                <span style={{ flex: 1, textAlign: "left" }}>{it.label}</span>
                {it.badge ? <span style={{ background: COLORS.critical, color: "white", fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{it.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: 12, borderRadius: 9, background: "#F8FAFC", border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Plant Status</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.safe }}>Operational</div>
        <div style={{ fontSize: 10.5, color: COLORS.secondary, marginTop: 3 }}>Chennai Manufacturing Unit 3</div>
      </div>
    </aside>
  );
}

/* ================================= DASHBOARD ================================= */

function Dashboard({ setPage, workerData, sensorLastUpdated, backendOnline }) {
  const sensorData = workerData || {};
  const mq5Value = sensorData.mq5 != null ? Number(sensorData.mq5) : null;
  const mq135Value = sensorData.mq135 != null ? Number(sensorData.mq135) : null;
  const temperatureValue = sensorData.temperature != null ? Number(sensorData.temperature) : null;
  const humidityValue = sensorData.humidity != null ? Number(sensorData.humidity) : null;
  const primaryWorkerId = String(sensorData.workerId || sensorData.id || "").toUpperCase();
  const isPrimaryWorkerOnline = backendOnline && primaryWorkerId === "W001";
  const workersOnline = isPrimaryWorkerOnline ? 1 : 0;
  const workersOffline = isPrimaryWorkerOnline ? 12 : 13;
  const safetyScore = backendOnline ? calculateSafetyScore({ temperature: temperatureValue, mq5: mq5Value, mq135: mq135Value }) : 0;
  const connectedWorkerLabel = backendOnline ? "W001" : "W001";
  const liveStatusText = backendOnline ? "LIVE SENSOR FEED ● LIVE" : "BACKEND OFFLINE";
  const liveStatusColor = backendOnline ? COLORS.critical : COLORS.offline;

  const online = WORKERS.filter((w) => w.status !== "offline").length;
  const offline = WORKERS.length - online;
  const critical = WORKERS.filter((w) => w.status === "critical").length;
  const avgTemp = round1(WORKERS.reduce((a, w) => a + w.temp, 0) / WORKERS.length);
  const avgAqi = Math.round(WORKERS.reduce((a, w) => a + w.aqi, 0) / WORKERS.length);
  const gasAlerts = WORKERS.filter((w) => w.gas > 250).length;

  const mq135Text = mq135Value === 1 ? "Normal" : mq135Value === 0 ? "Detected" : "Awaiting latest reading";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Plant overview</h1>
          <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>Unit 3 · Chennai · Shift B, 14 workers on roster</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn"><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setPage("reports")}><Download size={14} /> Export report</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        <KpiCard icon={Users} label="Workers online" value={workersOnline} accent={COLORS.primary} />
        <KpiCard icon={User} label="Workers offline" value={workersOffline} accent={COLORS.offline} />
        <KpiCard icon={AlertOctagon} label="Critical alerts" value={critical} delta={critical > 0 ? "Action needed" : "0.0%"} deltaGood={critical === 0} accent={COLORS.critical} />
        <KpiCard icon={Thermometer} label="Avg. temperature" value={avgTemp} unit="°C" accent={COLORS.warning} />
        <KpiCard icon={Wind} label="Avg. AQI" value={avgAqi} accent={COLORS.primary} />
        <KpiCard icon={CircleAlert} label="Gas alerts (24h)" value={gasAlerts} delta="1 new" deltaGood={false} accent={COLORS.critical} />
      </div>

      <div className="live-status-strip">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: COLORS.secondary, textTransform: "uppercase" }}>Worker status</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isPrimaryWorkerOnline ? COLORS.safeSoft : COLORS.offlineSoft, color: isPrimaryWorkerOnline ? COLORS.safe : COLORS.offline, padding: "4px 8px", borderRadius: 999 }}>
              <span className="live-status-dot" style={{ background: isPrimaryWorkerOnline ? COLORS.safe : COLORS.offline, boxShadow: isPrimaryWorkerOnline ? "0 0 0 0 rgba(16,185,129,0.45)" : "0 0 0 0 rgba(148,163,184,0.45)" }} />
              {connectedWorkerLabel}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.secondary, fontWeight: 600 }}>
          <span>{workersOnline} Connected Worker</span>
          <span style={{ color: COLORS.border }}>•</span>
          <span>{workersOffline} Disconnected Workers</span>
        </div>
      </div>

      <div className="card live-feed">
        <div className="live-feed-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="live-feed-title">{liveStatusText}</div>
            {backendOnline && <div className="live-feed-live"><span className="live-feed-dot" /> LIVE</div>}
          </div>
          {sensorLastUpdated && <div className="live-feed-time">Last Updated {sensorLastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>}
        </div>
        <div className="live-feed-grid">
          <div className="live-feed-card">
            <div className="live-feed-label"><span style={{ color: COLORS.critical }}>🔥</span> MQ-5 Gas Level</div>
            <div className="live-feed-value">{mq5Value != null ? mq5Value : "—"}</div>
            <div className="live-feed-meta">{backendOnline ? "Live value" : "Backend offline"}</div>
          </div>
          <div className="live-feed-card">
            <div className="live-feed-label"><span style={{ color: COLORS.primary }}>🌬</span> MQ-135 Air Quality</div>
            <div className="live-feed-value" style={{ fontSize: mq135Value != null ? 26 : 30 }}>{mq135Text}</div>
            <div className="live-feed-meta">{mq135Value === 1 ? "Normal" : mq135Value === 0 ? "Detected" : "Awaiting latest reading"}</div>
          </div>
          <div className="live-feed-card">
            <div className="live-feed-label"><span style={{ color: COLORS.warning }}>🌡</span> Temperature</div>
            <div className="live-feed-value" style={{ fontSize: temperatureValue != null ? 26 : 30 }}>{temperatureValue != null ? `${temperatureValue.toFixed(1)} °C` : "—"}</div>
            <div className="live-feed-meta">Live sensor value</div>
          </div>
          <div className="live-feed-card">
            <div className="live-feed-label"><span style={{ color: COLORS.primary }}>💧</span> Humidity</div>
            <div className="live-feed-value" style={{ fontSize: humidityValue != null ? 26 : 30 }}>{humidityValue != null ? `${humidityValue.toFixed(1)} %` : "—"}</div>
            <div className="live-feed-meta">Live ambient value</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: 16 }}>
        <div className="card" style={{ padding: "18px 8px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, alignSelf: "flex-start", marginLeft: 18, marginBottom: 4 }}>Plant safety score</div>
          <RadialGauge value={safetyScore} label="SAFETY SCORE" sub="Live sensor based" accent={safetyScore > 80 ? COLORS.safe : safetyScore > 60 ? COLORS.warning : COLORS.critical} size={190} />
          <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: safetyScore > 80 ? COLORS.safe : safetyScore > 60 ? COLORS.warning : COLORS.critical }}>{safetyScore}</div>
              <div style={{ fontSize: 10.5, color: COLORS.secondary }}>current score</div>
            </div>
            <div style={{ width: 1, background: COLORS.border }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{backendOnline ? "LIVE" : "OFFLINE"}</div>
              <div style={{ fontSize: 10.5, color: COLORS.secondary }}>{backendOnline ? "sensor stream" : "backend offline"}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Gas concentration trend</div>
              <div className="card-subtitle">MQ2 sensor · plant average · last 12 hours</div>
            </div>
            <StatusChip status={gasAlerts > 0 ? "warning" : "safe"} />
          </div>
          <div style={{ padding: "14px 18px 6px", height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GAS_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 11, fill: COLORS.secondary }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.secondary }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                <Area type="monotone" dataKey="gas" stroke={COLORS.primary} strokeWidth={2} fill="url(#gasFill)" name="ppm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <SystemPill icon={Wifi} label="MQTT Connection" ok sub="Connected · 3ms" />
        <SystemPill icon={Database} label="Database Status" ok sub="Healthy" />
        <SystemPill icon={Server} label="API Status" ok sub="200 OK · 42ms" />
        <SystemPill icon={Activity} label="Network Health" sub="1 device degraded" ok={false} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent alerts</div>
              <div className="card-subtitle">Latest events across all zones</div>
            </div>
            <button className="btn btn-sm" onClick={() => setPage("alerts")}>View all <ChevronRight size={13} /></button>
          </div>
          <div>
            {ALERTS.slice(0, 5).map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: `1px solid #F1F5F9` }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: statusSoft(a.severity === "info" ? "offline" : a.severity), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={14} color={statusColor(a.severity === "info" ? "offline" : a.severity)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: COLORS.secondary, marginTop: 1 }}>{a.worker} · {a.zone}</div>
                </div>
                <div style={{ fontSize: 11.5, color: COLORS.secondary, flexShrink: 0 }}>{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Zone occupancy</div>
          </div>
          <div style={{ padding: "10px 18px" }}>
            {ZONES.map((z) => {
              const count = WORKERS.filter((w) => w.zoneId === z.id).length;
              const pct = Math.round((count / WORKERS.length) * 100);
              return (
                <div key={z.id} style={{ marginBottom: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{z.name}</span>
                    <span style={{ color: COLORS.secondary }}>{count} workers</span>
                  </div>
                  <div style={{ height: 6, background: "#F1F5F9", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: z.kind === "danger" ? COLORS.critical : z.kind === "restricted" ? COLORS.warning : COLORS.primary, transition: "width .6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "10px 18px", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: COLORS.secondary }}>
        <span>Latest sync: {new Date().toLocaleTimeString()}</span>
        <span>GPS refresh 5s · Sensor refresh 3s · Socket.IO channel stable</span>
      </div>
    </div>
  );
}

/* ================================= LIVE MAP =================================== */

function LiveMap({ workerData }) {
  const [mapMode, setMapMode] = useState("normal");
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    if (!workerData || workerData.latitude == null || workerData.longitude == null) {
      setLocationName("");
      return;
    }

    let cancelled = false;
    const lat = Number(workerData.latitude);
    const lng = Number(workerData.longitude);
    const fallback = `Lat: ${lat} Lng: ${lng}`;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const place = data?.address
          ? data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.neighbourhood || data.address.hamlet
          : null;
        setLocationName(place || fallback);
      })
      .catch(() => {
        if (!cancelled) setLocationName(fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [workerData]);

  if (!workerData) {
    return <h2>Loading GPS...</h2>;
  }

  const lat = Number(workerData.latitude);
  const lng = Number(workerData.longitude);
  const fallbackLocation = `Lat: ${lat} Lng: ${lng}`;
  const mapUrl = mapMode === "normal"
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>W001</span>
          <span style={{ color: COLORS.secondary, fontWeight: 600, fontSize: 12 }}>{locationName || fallbackLocation}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: COLORS.safe, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.safe, display: "inline-block", boxShadow: "0 0 0 0 rgba(16,185,129,0.45)", animation: "pulseLiveGreen 1.8s infinite" }} /> LIVE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setMapMode("normal")} style={{ background: mapMode === "normal" ? COLORS.primary : "white", color: mapMode === "normal" ? "white" : COLORS.text, borderColor: mapMode === "normal" ? COLORS.primary : COLORS.border }}>Normal</button>
          <button className="btn btn-sm" onClick={() => setMapMode("satellite")} style={{ background: mapMode === "satellite" ? COLORS.primary : "white", color: mapMode === "satellite" ? "white" : COLORS.text, borderColor: mapMode === "satellite" ? COLORS.primary : COLORS.border }}>Satellite</button>
        </div>
      </div>

      <div style={{ height: "calc(100vh - 220px)", minHeight: 360, borderRadius: 10, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
        <MapContainer center={[lat, lng]} zoom={18} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url={mapUrl}
            attribution={mapMode === "normal" ? "&copy; OpenStreetMap contributors" : "Tiles © Esri"}
          />
          <Marker position={[lat, lng]}>
            <Popup>
              <div><b>W001</b></div>
              <div>{locationName || fallbackLocation}</div>
              <div style={{ marginTop: 6, color: COLORS.safe, fontWeight: 700 }}>● LIVE</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

function WorkerPopup({ worker, onClose }) {
  return (
    <div style={{ position: "absolute", top: 14, right: 14, width: 296, background: "white", borderRadius: 12, boxShadow: "0 18px 44px rgba(0,0,0,0.35)", overflow: "hidden", zIndex: 20 }} className="fade-in">
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 11, borderBottom: `1px solid ${COLORS.border}`, background: statusSoft(worker.status) }}>
        <Avatar name={worker.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{worker.name}</div>
          <div style={{ fontSize: 11.5, color: COLORS.secondary }}>{worker.id} · {worker.designation}</div>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", padding: 4 }}><X size={16} /></button>
      </div>

      {worker.sos && (
        <div style={{ background: COLORS.critical, color: "white", fontSize: 12, fontWeight: 700, padding: "7px 16px", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertOctagon size={13} /> SOS TRIGGERED — immediate response required
        </div>
      )}

      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
        <InfoRow icon={Layers} label="Zone" value={worker.zone.split(" · ")[1]} />
        <InfoRow icon={GaugeIcon} label="Speed" value={`${worker.speed} m/s`} />
        <InfoRow icon={Thermometer} label="Temp" value={`${worker.temp}°C`} />
        <InfoRow icon={Droplets} label="Humidity" value={`${worker.humidity}%`} />
        <InfoRow icon={Wind} label="Gas (MQ2)" value={`${worker.gas} ppm`} warn={worker.gas > 250} />
        <InfoRow icon={Activity} label="AQI" value={worker.aqi} warn={worker.aqi > 100} />
        <InfoRow icon={Battery} label="Battery" value={`${worker.battery}%`} />
        <InfoRow icon={Signal} label="Signal" value={worker.signal ? `${worker.signal}%` : "No signal"} />
      </div>

      <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: COLORS.secondary }}>
        <span>Device: {worker.device}</span>
        <span style={{ color: worker.mqtt === "connected" ? COLORS.safe : COLORS.critical, fontWeight: 700 }}>{worker.mqtt === "connected" ? "MQTT connected" : "MQTT lost"}</span>
      </div>

      <div style={{ padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: COLORS.secondary }}>Updated {worker.lastUpdate}</div>
        <StatusChip status={worker.status} />
      </div>

      <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
        <button className="btn btn-sm" style={{ flex: 1, justifyContent: "center" }}><Phone size={13} /> {worker.emergencyContact}</button>
        <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: "center" }}>View history</button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, warn }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: warn ? COLORS.criticalSoft : "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color={warn ? COLORS.critical : COLORS.secondary} />
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: COLORS.secondary, fontWeight: 500 }}>{label}</div>
        <div style={{ fontWeight: 700, color: warn ? COLORS.critical : COLORS.text }}>{value}</div>
      </div>
    </div>
  );
}

/* ================================ WORKERS PAGE ================================= */

function WorkersPage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);
  const [page, setPageNum] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let rows = WORKERS.filter((w) => (dept === "All" || w.department === dept) && (w.name.toLowerCase().includes(q.toLowerCase()) || w.id.toLowerCase().includes(q.toLowerCase())));
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return av.localeCompare(bv) * sortDir;
      return (av - bv) * sortDir;
    });
    return rows;
  }, [q, dept, sortKey, sortDir]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => -d);
    else { setSortKey(key); setSortDir(1); }
  }

  const cols = [
    ["name", "Worker"], ["department", "Department"], ["zone", "Current zone"], ["temp", "Temp"], ["gas", "Gas"], ["aqi", "AQI"], ["battery", "Battery"], ["signal", "Signal"], ["lastUpdate", "Last seen"], ["status", "Status"],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Workers</h1>
          <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>{WORKERS.length} registered · {WORKERS.filter((w) => w.status !== "offline").length} currently active</div>
        </div>
        <button className="btn btn-primary"><Download size={14} /> Export list</button>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, flexWrap: "wrap" }}>
          <div style={{ position: "relative", width: 260 }}>
            <Search size={14} color={COLORS.secondary} style={{ position: "absolute", left: 10, top: 9 }} />
            <input className="search-input" placeholder="Search by name or ID…" value={q} onChange={(e) => { setQ(e.target.value); setPageNum(1); }} />
          </div>
          <select className="filter-select" value={dept} onChange={(e) => { setDept(e.target.value); setPageNum(1); }}>
            <option>All</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {["safe", "warning", "critical", "offline"].map((s) => (
              <div key={s} style={{ fontSize: 11.5, fontWeight: 600, color: statusColor(s), display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(s) }} /> {WORKERS.filter((w) => w.status === s).length}
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="grid">
            <thead>
              <tr>
                {cols.map(([key, label]) => (
                  <th key={key}><span className="th-sort" onClick={() => toggleSort(key)}>{label} <ArrowUpDown size={11} /></span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={w.name} size={30} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.secondary }}>{w.id} · {w.designation}</div>
                      </div>
                      {w.status !== "offline" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.safe, marginLeft: 4, animation: "blink 1.6s infinite" }} title="Live" />}
                    </div>
                  </td>
                  <td>{w.department}</td>
                  <td style={{ color: COLORS.secondary }}>{w.zone.split(" · ")[1]}</td>
                  <td style={{ fontWeight: 600, color: w.temp > 37 ? COLORS.critical : COLORS.text }}>{w.temp}°C</td>
                  <td style={{ fontWeight: 600, color: w.gas > 250 ? COLORS.critical : COLORS.text }}>{w.gas} ppm</td>
                  <td style={{ fontWeight: 600, color: w.aqi > 100 ? COLORS.warning : COLORS.text }}>{w.aqi}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Battery size={13} color={w.battery < 20 ? COLORS.critical : COLORS.secondary} /> {w.battery}%
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Signal size={13} color={w.signal === 0 ? COLORS.offline : COLORS.secondary} /> {w.signal}%
                    </div>
                  </td>
                  <td style={{ color: COLORS.secondary }}>{w.lastUpdate}</td>
                  <td><StatusChip status={w.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, color: COLORS.secondary }}>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" disabled={page === 1} onClick={() => setPageNum((p) => Math.max(1, p - 1))} style={{ opacity: page === 1 ? 0.5 : 1 }}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 8px" }}>{page} / {totalPages}</span>
            <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))} style={{ opacity: page === totalPages ? 0.5 : 1 }}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================= ALERTS PAGE ================================== */

function AlertsPage() {
  const [filter, setFilter] = useState("all");
  const [statuses, setStatuses] = useState(() => Object.fromEntries(ALERTS.map((a) => [a.id, a.status])));

  const rows = ALERTS.filter((a) => filter === "all" || a.severity === filter);
  const counts = { critical: ALERTS.filter((a) => a.severity === "critical").length, warning: ALERTS.filter((a) => a.severity === "warning").length, info: ALERTS.filter((a) => a.severity === "info").length };

  function advance(id) {
    setStatuses((s) => ({ ...s, [id]: s[id] === "open" ? "acknowledged" : s[id] === "acknowledged" ? "resolved" : "resolved" }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Alerts</h1>
        <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>Acknowledge, assign, and resolve safety events</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KpiCard icon={AlertOctagon} label="Critical" value={counts.critical} accent={COLORS.critical} />
        <KpiCard icon={AlertTriangle} label="Warning" value={counts.warning} accent={COLORS.warning} />
        <KpiCard icon={CheckCircle2} label="Informational" value={counts.info} accent={COLORS.primary} />
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 8, padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}` }}>
          {["all", "critical", "warning", "info"].map((f) => (
            <button key={f} className="btn btn-sm" onClick={() => setFilter(f)} style={{ background: filter === f ? COLORS.text : "white", color: filter === f ? "white" : COLORS.text, borderColor: filter === f ? COLORS.text : COLORS.border, textTransform: "capitalize" }}>{f}</button>
          ))}
        </div>

        <div>
          {rows.map((a) => {
            const st = statuses[a.id];
            return (
              <div key={a.id} style={{ display: "flex", gap: 14, padding: "16px 18px", borderBottom: `1px solid #F1F5F9` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: statusSoft(a.severity === "info" ? "offline" : a.severity), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle size={16} color={statusColor(a.severity === "info" ? "offline" : a.severity)} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>{a.title}</span>
                    <span style={{ fontSize: 11, color: COLORS.secondary }}>{a.id}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: COLORS.secondary, marginTop: 3, lineHeight: 1.5 }}>{a.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8, fontSize: 11.5, color: COLORS.secondary }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={12} /> {a.worker}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {a.zone}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {a.time}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                  <span className="chip" style={{
                    color: st === "resolved" ? COLORS.safe : st === "acknowledged" ? COLORS.primary : COLORS.critical,
                    background: st === "resolved" ? COLORS.safeSoft : st === "acknowledged" ? COLORS.primarySoft : COLORS.criticalSoft,
                    textTransform: "capitalize",
                  }}>{st}</span>
                  {st !== "resolved" && <button className="btn btn-sm" onClick={() => advance(a.id)}>{st === "open" ? "Acknowledge" : "Resolve"}</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =============================== ANALYTICS PAGE ================================= */

function AnalyticsPage() {
  const pieColors = [COLORS.primary, "#0EA5E9", COLORS.warning, COLORS.safe, "#7C3AED"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Analytics</h1>
        <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>Trends and historical patterns across sensors and zones</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Gas trend" sub="ppm · last 12 hours">
          <LineChart data={GAS_TREND} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={{ stroke: COLORS.border }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Line type="monotone" dataKey="gas" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Gas (ppm)" />
            <Line type="monotone" dataKey="threshold" stroke={COLORS.critical} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Critical threshold" />
          </LineChart>
        </ChartCard>

        <ChartCard title="Temperature trend" sub="°C · plant average">
          <AreaChart data={TEMP_TREND} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.warning} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLORS.warning} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={{ stroke: COLORS.border }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={false} domain={[20, 45]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Area type="monotone" dataKey="temp" stroke={COLORS.warning} fill="url(#tempFill)" strokeWidth={2} name="°C" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Air quality index" sub="MQ135 · last 12 hours">
          <BarChart data={AQI_TREND} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={{ stroke: COLORS.border }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="aqi" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="AQI" />
          </BarChart>
        </ChartCard>

        <ChartCard title="Zone occupancy" sub="Active workers by zone">
          <PieChart>
            <Pie data={ZONE_OCC} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
              {ZONE_OCC.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ChartCard>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">7-day safety score</div>
          <span className="chip" style={{ color: COLORS.safe, background: COLORS.safeSoft }}>Trending up</span>
        </div>
        <div style={{ padding: "14px 18px", height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAFETY_TREND} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={{ stroke: COLORS.border }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.secondary }} tickLine={false} axisLine={false} domain={[70, 100]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke={COLORS.safe} strokeWidth={2.5} dot={{ r: 3.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Top alerts by zone (30 days)</div></div>
        <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
          {ZONES.map((z) => (
            <div key={z.id} style={{ padding: 14, borderRadius: 9, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.secondary }}>{z.id}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{Math.round(rnd() * 12) + (z.kind === "danger" ? 8 : 2)}</div>
              <div style={{ fontSize: 11, color: COLORS.secondary, marginTop: 2 }}>events logged</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="card-subtitle">{sub}</div>
        </div>
      </div>
      <div style={{ padding: "14px 14px 8px", height: 236 }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================= REPORTS PAGE ================================= */

function ReportsPage() {
  const reports = [
    { name: "Daily Safety Summary", period: "Aug 6, 2026", size: "412 KB", type: "PDF" },
    { name: "Weekly Zone Compliance", period: "Jul 28 – Aug 3, 2026", size: "1.1 MB", type: "Excel" },
    { name: "Monthly Incident Report", period: "July 2026", size: "2.4 MB", type: "PDF" },
    { name: "Sensor Calibration Log", period: "Jul 2026", size: "268 KB", type: "CSV" },
    { name: "Weekly Zone Compliance", period: "Jul 21 – Jul 27, 2026", size: "1.0 MB", type: "Excel" },
    { name: "Daily Safety Summary", period: "Aug 5, 2026", size: "398 KB", type: "PDF" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Reports</h1>
        <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>Generate and download compliance documentation</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[["Daily report", "Auto-generated at 23:59 for the current shift cycle", Calendar], ["Weekly report", "Rolled up every Monday covering the prior 7 days", FileText], ["Monthly report", "Full compliance archive with signed sign-off", HardDrive]].map(([t, d, Icon]) => (
          <div key={t} className="card" style={{ padding: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: COLORS.primarySoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon size={16} color={COLORS.primary} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{t}</div>
            <div style={{ fontSize: 12, color: COLORS.secondary, marginTop: 5, lineHeight: 1.5 }}>{d}</div>
            <button className="btn btn-sm" style={{ marginTop: 14 }}>Generate now</button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Recent exports</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm"><Download size={13} /> CSV</button>
            <button className="btn btn-sm"><Download size={13} /> Excel</button>
            <button className="btn btn-sm"><Download size={13} /> PDF</button>
          </div>
        </div>
        <table className="grid">
          <thead><tr><th>Report</th><th>Period</th><th>Format</th><th>Size</th><th></th></tr></thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ color: COLORS.secondary }}>{r.period}</td>
                <td><span className="chip" style={{ color: COLORS.primary, background: COLORS.primarySoft }}>{r.type}</span></td>
                <td style={{ color: COLORS.secondary }}>{r.size}</td>
                <td><button className="btn btn-sm"><Download size={12} /> Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================= DEVICES PAGE ================================= */

function DevicesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Devices</h1>
          <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>{DEVICES.length} ESP8266 wearables provisioned · fleet firmware management</div>
        </div>
        <button className="btn btn-primary"><PlugZap size={14} /> Provision device</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiCard icon={Router} label="Connected" value={DEVICES.filter((d) => d.mqtt === "connected").length} accent={COLORS.safe} />
        <KpiCard icon={PlugZap} label="Disconnected" value={DEVICES.filter((d) => d.mqtt !== "connected").length} accent={COLORS.critical} />
        <KpiCard icon={HardDrive} label="Firmware up to date" value={`${Math.round((DEVICES.filter((d) => d.firmware.endsWith(".3")).length / DEVICES.length) * 100)}%`} accent={COLORS.primary} />
        <KpiCard icon={Battery} label="Avg. battery" value={Math.round(DEVICES.reduce((a, d) => a + d.battery, 0) / DEVICES.length)} unit="%" accent={COLORS.warning} />
      </div>

      <div className="card">
        <table className="grid">
          <thead>
            <tr><th>Device</th><th>Assigned worker</th><th>Firmware</th><th>MQTT</th><th>IP address</th><th>WiFi</th><th>Sensors</th><th>Battery</th><th>Last restart</th><th></th></tr>
          </thead>
          <tbody>
            {DEVICES.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 700 }}>{d.id}</td>
                <td>{d.worker}</td>
                <td style={{ color: COLORS.secondary }}>{d.firmware}</td>
                <td><StatusChip status={d.mqtt === "connected" ? "safe" : "critical"} /></td>
                <td style={{ color: COLORS.secondary, fontFamily: "monospace", fontSize: 12 }}>{d.ip}</td>
                <td>{d.wifi}%</td>
                <td style={{ color: d.sensors === "nominal" ? COLORS.safe : COLORS.critical, fontWeight: 600, textTransform: "capitalize" }}>{d.sensors}</td>
                <td>{d.battery}%</td>
                <td style={{ color: COLORS.secondary }}>{d.restart}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-sm"><RefreshCw size={12} /> OTA</button>
                    <button className="btn btn-sm"><Power size={12} /> Restart</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================= SETTINGS PAGE ================================= */

function SettingsPage() {
  const groups = [
    { title: "Factory information", fields: [["Facility name", "Chennai Manufacturing Unit 3"], ["Address", "SIPCOT Industrial Estate, Sriperumbudur"], ["Timezone", "Asia/Kolkata (UTC+5:30)"], ["Shift pattern", "3 × 8-hour rotating shifts"]] },
    { title: "MQTT broker", fields: [["Broker host", "mqtt.safetywatch.internal"], ["Port", "8883 (TLS)"], ["Client ID prefix", "swp-esp8266-"], ["QoS level", "1 — at least once"]] },
    { title: "Notification settings", fields: [["Critical alert channel", "Push + SMS + Email"], ["Warning alert channel", "Push + Email"], ["Escalation delay", "3 minutes unacknowledged"], ["Quiet hours", "Disabled for critical severity"]] },
    { title: "Emergency contacts", fields: [["Primary responder", "Ravi Menon — Safety Supervisor"], ["Site medical", "Unit 3 Occupational Health, Ext. 4410"], ["External emergency", "108 — Ambulance"], ["Fire & hazmat", "101 — Fire Services"]] },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Settings</h1>
        <div style={{ fontSize: 13, color: COLORS.secondary, marginTop: 3 }}>Platform, connectivity, and escalation configuration</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {groups.map((g) => (
          <div className="card" key={g.title}>
            <div className="card-head"><div className="card-title">{g.title}</div></div>
            <div style={{ padding: "6px 18px" }}>
              {g.fields.map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span style={{ fontSize: 12.5, color: COLORS.secondary, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 18px" }}><button className="btn btn-sm">Edit</button></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">API keys</div></div>
        <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Production key</div>
            <div style={{ fontFamily: "monospace", fontSize: 12.5, color: COLORS.secondary, marginTop: 4 }}>swp_live_••••••••••••7f3a</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm">Regenerate</button>
            <button className="btn btn-sm">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}