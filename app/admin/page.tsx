"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Users, CalendarDays, ClipboardCheck, AlertCircle,
  TrendingUp, BarChart2, Trophy, Clock, AlertTriangle,
  Cake, ListChecks, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import DownloadCards from "@/components/DownloadCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";

const glass = (accent?: string) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${accent ? accent + "33" : "rgba(255,255,255,0.08)"}`,
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
});

const MONTHS_ES: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function formatMonth(ym: string) {
  const [, m] = ym.split("-");
  return MONTHS_ES[m] ?? ym;
}

function formatSessionDate(raw: string): string {
  if (!raw) return "—";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    if (raw.includes("T")) {
      return d.toLocaleString("es-PE", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/Lima",
      });
    }
    return d.toLocaleDateString("es-PE", {
      day: "2-digit", month: "short", year: "numeric",
      timeZone: "UTC",
    });
  } catch { return raw; }
}

function getGreeting() {
  const h = new Date(new Date().getTime() - 5 * 60 * 60 * 1000).getUTCHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getFirstName(name?: string) {
  return name?.split(" ")[0] ?? "";
}

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0f1a27", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10, padding: "8px 14px", fontSize: 12, color: "#e2e8f0",
    }}>
      <p style={{ marginBottom: 4, color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// DASHBOARD VOLUNTARIO
// ══════════════════════════════════════════════════════════════
function VolunteerDashboard() {
  const { user } = useAuth();
  const [volunteer,  setVolunteer]  = useState<any>(null);
  const [sessions,   setSessions]   = useState<any[]>([]);
  const [chartData,  setChartData]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const volRes = await api.get(`/volunteers/by-user/${user!.id}`);
      const vol = volRes.data;
      setVolunteer(vol);

      const [sesRes, attRes] = await Promise.all([
        api.get(`/sessions/upcoming?moduleId=${vol.module?.id}`),
        api.get(`/attendance/volunteer/${vol.id}/by-month`),
      ]);
      setSessions(sesRes.data ?? []);
      setChartData((attRes.data ?? []).map((r: any) => ({ ...r, label: formatMonth(r.month) })));
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  }

  const totalPuntuales = chartData.reduce((s, r) => s + r.puntuales, 0);
  const totalTardes    = chartData.reduce((s, r) => s + r.tardes,    0);
  const totalFaltas    = chartData.reduce((s, r) => s + r.faltas,    0);
  const total          = totalPuntuales + totalTardes + totalFaltas;
  const pct            = total === 0 ? 0 : Math.round(((totalPuntuales + totalTardes) / total) * 100);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando tu dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* ── BIENVENIDA ── */}
      <div className="relative overflow-hidden p-6 md:p-8" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,${BLUE},${ORANGE},transparent)` }} />
        <div style={{
          position: "absolute", right: -40, top: -40, width: 200, height: 200,
          borderRadius: "50%", background: `radial-gradient(circle,${BLUE}18 0%,transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* ── DESCARGAS ── */}
        <DownloadCards />

        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, boxShadow: `0 4px 20px ${BLUE}55` }}>
            {volunteer?.photoUrl
              ? <img src={volunteer.photoUrl?.startsWith("http") ? volunteer.photoUrl : `${API_URL}/${volunteer.photoUrl}`} className="w-full h-full object-cover" alt="foto" />
              : <span className="text-2xl font-bold text-white">{getFirstName(user?.name)?.charAt(0)?.toUpperCase()}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {getGreeting()}, 👋
            </p>
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {getFirstName(user?.name)}
            </h1>
            {volunteer && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {volunteer.module?.name && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                    <MapPin size={10} /> {volunteer.module.name}
                  </span>
                )}
                {volunteer.sede?.name && (
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>· {volunteer.sede.name}</span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                  Voluntario activo
                </span>
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={pct >= 80 ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171"}
                    strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: "#f1f5f9" }}>{pct}%</span>
                </div>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Asistencia</p>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Puntuales", value: totalPuntuales, color: "#4ade80" },
              { label: "Tardanzas", value: totalTardes,    color: "#facc15" },
              { label: "Faltas",    value: totalFaltas,    color: "#f87171" },
            ].map((c) => (
              <div key={c.label} className="text-center py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SESIONES + GRÁFICA ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="relative overflow-hidden" style={glass(ORANGE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <CalendarDays size={14} color={ORANGE} />
            <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>Próximas sesiones</h2>
          </div>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3">
              <CalendarDays size={28} color="rgba(232,114,42,0.25)" />
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.30)" }}>No hay sesiones próximas</p>
            </div>
          ) : (
            <div>
              {sessions.map((s, i) => {
                const [, mm, dd] = (s.date ?? "").split("-");
                const dayNum     = dd ? parseInt(dd) : "?";
                const monthLabel = mm ? (MONTHS_ES[mm] ?? mm) : "";
                return (
                  <div key={s.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all duration-150"
                    style={{ borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="w-11 h-11 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
                      style={{ background: "rgba(232,114,42,0.12)", border: "1px solid rgba(232,114,42,0.20)" }}>
                      <span className="text-base font-bold leading-none" style={{ color: ORANGE }}>{dayNum}</span>
                      <span className="text-xs leading-none mt-0.5" style={{ color: "rgba(232,114,42,0.70)" }}>{monthLabel}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {s.startTime && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                            <Clock size={9} /> {s.startTime.substring(0, 5)}{s.endTime ? ` – ${s.endTime.substring(0, 5)}` : ""}
                          </span>
                        )}
                        {s.modules?.[0]?.sede?.name && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <MapPin size={9} /> {s.modules[0].sede.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {s.isActive && (
                      <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                        En curso
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden" style={glass(BLUE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg,${BLUE},transparent)` }} />
          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <TrendingUp size={14} color={BLUE_L} />
            <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>Asistencia por mes</h2>
          </div>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3">
              <TrendingUp size={28} color="rgba(46,111,168,0.25)" />
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.30)" }}>Aún no hay datos registrados</p>
            </div>
          ) : (
            <div className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={10} barGap={3}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    formatter={(val) => <span style={{ color: "rgba(255,255,255,0.50)" }}>{val}</span>} />
                  <Bar dataKey="puntuales" name="Puntuales" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tardes"    name="Tardanzas"  fill="#facc15" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faltas"    name="Faltas"     fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD ADMIN / SUPER_ADMIN / REGISTRADOR
// ══════════════════════════════════════════════════════════════
function AdminDashboard() {
  const { user } = useAuth();
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canSeeJustifications =
  user?.role === "super_admin" || user?.role === "registrador";

  useEffect(() => {
    api.get("/attendance/dashboard-stats")
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Cargando dashboard...</p>
      </div>
    </div>
  );

  const statCards = [
    { label: "Voluntarios activos",     value: stats?.totals?.volunteers ?? 0, icon: Users,          color: BLUE_L,    link: "/admin/volunteers" },
    { label: "Total sesiones",          value: stats?.totals?.sessions   ?? 0, icon: CalendarDays,   color: "#9b6dff", link: "/admin/sessions"   },
    { label: "Registros de asistencia", value: stats?.totals?.attendances ?? 0, icon: ClipboardCheck, color: "#4ade80", link: "/admin/attendance" },
    ...(canSeeJustifications ? [{
      label: "Justificaciones pendientes",
      value: stats?.totals?.pendingJustifications ?? 0,
      icon:  AlertCircle,
      color: ORANGE,
      link:  "/admin/justifications",
    }] : []),
  ];

  const rankings = [
    { title: "Top faltones",  icon: AlertTriangle, data: stats?.topFaltones  ?? [], color: "#f87171", bg: "rgba(248,113,113,0.12)" },
    { title: "Top tardones",  icon: Clock,         data: stats?.topTardones  ?? [], color: ORANGE,    bg: "rgba(232,114,42,0.12)"  },
    { title: "Top puntuales", icon: Trophy,        data: stats?.topPuntuales ?? [], color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  ];

  const chartData = (stats?.attendanceLast30 ?? []).map((d: any) => ({
    ...d,
    date: typeof d.date === "string" ? d.date.substring(0, 10) : d.date,
  }));

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <style>{`
        .dash-orb-1{position:fixed;top:-100px;left:-100px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(46,111,168,.12),transparent 70%);pointer-events:none;z-index:0}
        .dash-orb-2{position:fixed;bottom:-100px;right:-100px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(232,114,42,.10),transparent 70%);pointer-events:none;z-index:0}
        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:rgba(255,255,255,0.06)!important}
        .recharts-text{fill:rgba(255,255,255,0.40)!important}
        .recharts-legend-item-text{color:rgba(255,255,255,0.50)!important}
      `}</style>
      <div className="dash-orb-1" /><div className="dash-orb-2" />

      <div className="relative z-10 space-y-4 md:space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {getGreeting()}, {getFirstName(user?.name)} 👋
            </h1>
            <p className="text-xs md:text-sm mt-0.5 capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>
              {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm flex-shrink-0"
            style={{ ...glass(), color: "rgba(255,255,255,0.50)" }}>
            Sistema <span className="font-bold" style={{ color: ORANGE }}>Voluntades+</span>
          </div>
        </div>

        {/* ── DESCARGAS ── */}
        <DownloadCards />

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Link key={i} href={card.link}
                className="relative p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all duration-300 overflow-hidden"
                style={glass(card.color)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px rgba(0,0,0,0.4),0 0 30px ${card.color}18`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,255,255,0.06)"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${card.color},transparent)` }} />
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.color + "1a" }}>
                  <Icon size={18} color={card.color} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold" style={{ color: card.color, letterSpacing: "-0.5px" }}>{card.value}</p>
                  <p className="text-xs mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>{card.label}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* SESIONES ACTIVAS */}
        {stats?.activeSessions?.length > 0 && (
          <div className="p-4 md:p-5 relative overflow-hidden"
            style={{ ...glass("#4ade80"), borderColor: "rgba(74,222,128,0.25)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#4ade80,transparent)" }} />
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm" style={{ color: "#4ade80" }}>
              <span className="w-2 h-2 rounded-full animate-pulse inline-block" style={{ background: "#4ade80" }} />
              Sesiones activas ahora ({stats.activeSessions.length})
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {stats.activeSessions.map((s: any) => (
                <Link key={s.id} href={`/admin/sessions/${s.id}`}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all duration-200"
                  style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <ListChecks size={13} />
                  {s.name} — {s.date}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* GRÁFICAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="p-4 md:p-5 relative overflow-hidden" style={glass(BLUE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              <TrendingUp size={15} color={BLUE_L} /> Asistencia últimos 30 días
            </h2>
            {chartData.length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Sin datos</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 9 }} width={28} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="puntuales" stroke="#4ade80" strokeWidth={2} dot={false} name="Puntuales" />
                    <Line type="monotone" dataKey="tardes"    stroke={ORANGE}   strokeWidth={2} dot={false} name="Tardes" />
                    <Line type="monotone" dataKey="faltas"    stroke="#f87171"  strokeWidth={2} dot={false} name="Faltas" />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div className="p-4 md:p-5 relative overflow-hidden" style={glass(ORANGE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              <BarChart2 size={15} color={ORANGE} /> Voluntarios por módulo
            </h2>
            {(stats?.byModule ?? []).length === 0
              ? <p className="text-center py-8 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Sin datos</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.byModule} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis dataKey="module" type="category" tick={{ fontSize: 9 }} width={100} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="total" fill={BLUE} radius={[0, 6, 6, 0]} name="Voluntarios" />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* RANKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {rankings.map((ranking, ri) => {
            const Icon = ranking.icon;
            return (
              <div key={ri} className="p-4 md:p-5 relative overflow-hidden" style={glass(ranking.color)}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ranking.color},transparent)` }} />
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
                  <Icon size={15} color={ranking.color} /> {ranking.title}
                </h2>
                {ranking.data.length === 0
                  ? <p className="text-center py-4 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Sin datos</p>
                  : (
                    <div className="space-y-2">
                      {ranking.data.map((v: any, i: number) => (
                        <div key={v.id} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={i === 0 ? { background: ranking.bg, color: ranking.color } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium truncate flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{v.name}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: ranking.bg, color: ranking.color }}>{v.total}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            );
          })}
        </div>

        {/* CUMPLEAÑOS + ÚLTIMAS SESIONES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="p-4 md:p-5 relative overflow-hidden" style={glass("#f472b6")}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#f472b6,transparent)" }} />
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              <Cake size={15} color="#f472b6" /> 🎂 Cumpleaños próximos 60 días
            </h2>
            {(stats?.upcomingBirthdays ?? []).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay cumpleaños próximos</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {stats.upcomingBirthdays.map((v: any) => {
                  const birthYear = parseInt(v.birthDate.substring(0, 4));
                  const age       = new Date().getFullYear() - birthYear;
                  return (
                    <div key={v.id} className="flex items-center gap-3">
                      {v.photoUrl
                        ? <img src={v.photoUrl?.startsWith("http") ? v.photoUrl : `${API_URL}/${v.photoUrl}`} className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            style={{ border: "1px solid rgba(244,114,182,0.30)" }} alt="" />
                        : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: "rgba(244,114,182,0.15)", color: "#f472b6" }}>{v.name?.charAt(0)}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>{v.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{v.module} · cumple {age} años</p>
                      </div>
                      <div className="flex-shrink-0">
                        {v.daysUntil === 0
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(244,114,182,0.18)", color: "#f472b6" }}>¡Hoy! 🎂</span>
                          : v.daysUntil === 1
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(232,114,42,0.18)", color: ORANGE }}>Mañana</span>
                          : <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>en {v.daysUntil}d</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 md:p-5 relative overflow-hidden" style={glass(BLUE_L)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE_L},transparent)` }} />
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              <ListChecks size={15} color={BLUE_L} /> Últimas sesiones
            </h2>
            {(stats?.lastSessions ?? []).length === 0
              ? <p className="text-center py-6 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Sin sesiones</p>
              : (
                <div className="space-y-2">
                  {stats.lastSessions.map((s: any) => {
                    const total    = parseInt(s.total) || 0;
                    const pct      = total === 0 ? 0 : Math.round((parseInt(s.puntuales) / total) * 100);
                    const pctColor = pct >= 70 ? "#4ade80" : pct >= 40 ? ORANGE : "#f87171";
                    const dateLabel = formatSessionDate(s.createdAt ?? s.date);
                    return (
                      <Link key={s.id} href={`/admin/sessions/${s.id}`}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.80)" }}>{s.name}</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{dateLabel} · {total} registros</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: pctColor }}>{pct}%</p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>asistencia</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ENTRY POINT
// ══════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "voluntario") return <VolunteerDashboard />;
  return <AdminDashboard />;
}