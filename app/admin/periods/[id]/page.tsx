"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";
import {
  Clock, ArrowLeft, Users, CalendarDays, Star,
  Boxes, Building2, Award,
} from "lucide-react";

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

function getPeriodStatus(period: any) {
  const today = new Date();
  const start = new Date(period.startDate);
  const end   = new Date(period.endDate);
  if (today < start) return { label: "Próximo", color: BLUE_L,   bg: "rgba(74,144,196,0.12)", border: "rgba(74,144,196,0.25)", accent: BLUE_L   };
  if (today > end)   return { label: "Cerrado", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.10)", accent: "rgba(255,255,255,0.20)" };
  return              { label: "Activo",  color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.25)", accent: "#4ade80"  };
}

type TabKey = "voluntarios" | "sesiones" | "gestion";

export default function PeriodDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabKey>("voluntarios");

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const res = await api.get(`/periods/${id}/stats`);
      setData(res.data);
    } finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando periodo...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <p style={{ color: "rgba(255,255,255,0.30)" }}>Periodo no encontrado</p>
    </div>
  );

  const { period, stats, volunteers, sessions, management } = data;
  const st = getPeriodStatus(period);

  const tabs: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "voluntarios", label: "Voluntarios", count: stats.totalVolunteers, icon: <Users size={13} />      },
    { key: "sesiones",    label: "Sesiones",    count: stats.totalSessions,   icon: <CalendarDays size={13} /> },
    { key: "gestion",     label: "Gestión",     count: stats.totalManagement, icon: <Star size={13} />       },
  ];

  const statCards = [
    { value: stats.totalVolunteers,  label: "Voluntarios",       sub: `${stats.activeVolunteers} activos`, color: BLUE_L,    icon: <Users size={18} color={BLUE_L} /> },
    { value: stats.totalSessions,    label: "Sesiones",          sub: null,                                 color: "#a78bfa", icon: <CalendarDays size={18} color="#a78bfa" /> },
    { value: stats.avgAttendance,    label: "Asist. promedio",   sub: "por sesión",                         color: "#4ade80", icon: <Clock size={18} color="#4ade80" /> },
    { value: stats.totalManagement,  label: "Miembros gestión",  sub: null,                                 color: "#9b6dff", icon: <Star size={18} color="#9b6dff" /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen max-w-5xl" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* VOLVER */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
        style={{ color: "rgba(255,255,255,0.40)" }}
        onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
        <ArrowLeft size={15} /> Volver
      </button>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.25)" }}>
            <Clock size={22} color={BLUE_L} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {period.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {new Date(period.startDate).toLocaleDateString("es-PE")} — {new Date(period.endDate).toLocaleDateString("es-PE")}
              </span>
            </div>
            {period.description && (
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{period.description}</p>
            )}
          </div>
        </div>

        <button onClick={() => router.push(`/admin/periods?edit=${id}`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0"
          style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
          Editar
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((sc, i) => (
          <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(sc.color)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${sc.color},transparent)` }} />
            <div className="flex justify-center mb-2">{sc.icon}</div>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: sc.color }}>{sc.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{sc.label}</p>
            {sc.sub && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{sc.sub}</p>}
            {sc.label === "Voluntarios" && stats.pendingVolunteers > 0 && (
              <span className="mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(232,114,42,0.15)", color: ORANGE }}>
                {stats.pendingVolunteers} pend.
              </span>
            )}
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            style={tab === t.key
              ? { background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 2px 8px rgba(46,111,168,0.35)" }
              : { color: "rgba(255,255,255,0.40)", background: "transparent" }}
            onMouseEnter={e => { if (tab !== t.key) (e.currentTarget.style.color = "rgba(255,255,255,0.70)"); }}
            onMouseLeave={e => { if (tab !== t.key) (e.currentTarget.style.color = "rgba(255,255,255,0.40)"); }}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="text-xs opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── TAB: VOLUNTARIOS ── */}
      {tab === "voluntarios" && (
        <div className="relative overflow-hidden" style={glass(BLUE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
          {volunteers.length === 0 ? (
            <p className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay voluntarios en este periodo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Voluntario", "DNI", "Módulo", "Sede", "Estado"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v: any, i: number) => (
                    <tr key={v.id}
                      style={{ borderBottom: i < volunteers.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/volunteers/${v.id}`}
                          className="font-semibold transition-colors duration-200"
                          style={{ color: "#f1f5f9" }}
                          onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
                          onMouseLeave={e => (e.currentTarget.style.color = "#f1f5f9")}>
                          {v.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{v.dni || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                          {v.module?.name || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{v.sede?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={v.status === "activo"
                            ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                            : v.status === "pendiente"
                              ? { background: "rgba(232,114,42,0.12)", color: ORANGE }
                              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SESIONES ── */}
      {tab === "sesiones" && (
        <div className="relative overflow-hidden" style={glass("#a78bfa")}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#a78bfa,transparent)" }} />
          {sessions.length === 0 ? (
            <p className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay sesiones en este periodo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Sesión", "Fecha", "Módulo", "Sede", "Estado"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any, i: number) => (
                    <tr key={s.id}
                      style={{ borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/sessions/${s.id}`}
                          className="font-semibold transition-colors duration-200"
                          style={{ color: "#f1f5f9" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#f1f5f9")}>
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                        {s.date?.substring(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.modules?.length > 0
                            ? s.modules.map((m: any) => (
                                <span key={m.id} className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                                  {m.name}
                                </span>
                              ))
                            : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                        {s.modules?.[0]?.sede?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {s.isActive ? (
                          <span className="flex items-center gap-1 text-xs font-semibold w-fit px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Activa
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                            Cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: GESTIÓN ── */}
      {tab === "gestion" && (
        <div className="relative overflow-hidden" style={glass("#9b6dff")}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#9b6dff,transparent)" }} />
          {management.length === 0 ? (
            <p className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay miembros de gestión en este periodo</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Voluntario", "Cargos", "Estado", "Notas"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {management.map((m: any, i: number) => (
                    <tr key={m.id}
                      style={{ borderBottom: i < management.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/volunteers/${m.volunteer?.id}`}
                          className="font-semibold transition-colors duration-200"
                          style={{ color: "#f1f5f9" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#9b6dff")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#f1f5f9")}>
                          {m.volunteer?.fullName || "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.positions?.length > 0
                            ? m.positions.map((p: any) => (
                                <span key={p.id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(155,109,255,0.15)", color: "#9b6dff" }}>
                                  <Award size={9} className="inline mr-1" />{p.name}
                                </span>
                              ))
                            : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sin cargos</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={m.isActive
                            ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {m.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs italic" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {m.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}