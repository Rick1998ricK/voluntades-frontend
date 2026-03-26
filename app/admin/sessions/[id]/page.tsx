"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "puntual") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
      <CheckCircle2 size={10} /> Puntual
    </span>
  );
  if (s === "tarde") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(250,204,21,0.14)", color: "#facc15" }}>
      <Clock size={10} /> Tarde
    </span>
  );
  if (s === "falta") return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}>
      <XCircle size={10} /> Falta
    </span>
  );
  return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
}

function JustBadge({ just }: { just: any }) {
  if (!just) return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
  const styles =
    just.status === "aprobado"  ? { bg: "rgba(74,222,128,0.14)",  color: "#4ade80",  label: "✓ Aprobado"   } :
    just.status === "rechazado" ? { bg: "rgba(248,113,113,0.14)", color: "#f87171",  label: "✗ Rechazado"  } :
                                  { bg: "rgba(250,204,21,0.14)",  color: "#facc15",  label: "⏳ Pendiente"  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
        style={{ background: styles.bg, color: styles.color }}>{styles.label}</span>
      {just.reason && <span className="text-xs italic max-w-[180px] truncate" style={{ color: "rgba(255,255,255,0.35)" }} title={just.reason}>{just.reason}</span>}
    </div>
  );
}

function AttendanceTable({ rows, title, external = false }: { rows: any[]; title: string; external?: boolean }) {
  const accent = external ? "#818cf8" : BLUE;
  return (
    <div className="relative overflow-hidden" style={glass(accent)}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent},transparent)` }} />
      <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>{title}</h2>
        {external && (
          <>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}>
              {rows.length} visitante{rows.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Voluntarios de otros módulos</span>
          </>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Voluntario","Módulo","Sede","Estado","Justificación","Registrado por","Hora"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin registros</td></tr>
            ) : rows.map((row: any, i: number) => (
              <tr key={i}
                style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "#f1f5f9" }}>{row.volunteerName}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>{row.module ?? "—"}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>{row.sede ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={row.status} /></td>
                <td className="px-4 py-3"><JustBadge just={row.justification} /></td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>{row.registeredBy ?? "—"}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>
                  {row.date ? new Date(row.date).toLocaleTimeString("es-PE") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SessionDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const id       = params.id as string;

  // ── Permisos ──────────────────────────────────────────────
  const isReadOnly = user?.role === "admin";
  // ─────────────────────────────────────────────────────────

  const [session,   setSession]   = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { if (id) loadData(); }, [id]);

  async function loadData() {
    try {
      const [sessionRes, dashboardRes] = await Promise.all([
        api.get(`/sessions/${id}`),
        api.get(`/attendance/dashboard/${id}`),
      ]);
      setSession(sessionRes.data);
      setDashboard(dashboardRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando sesión...</p>
      </div>
    </div>
  );

  const externalRows = dashboard?.externalRows ?? [];
  const stats        = dashboard?.stats ?? {};

  const statCards = [
    { label: "Total voluntarios", value: stats.totalVolunteers ?? 0, color: "rgba(255,255,255,0.80)", accent: BLUE     },
    { label: "Puntuales",         value: stats.presentes ?? 0,       color: "#4ade80",                accent: "#4ade80" },
    { label: "Tarde",             value: stats.tarde ?? 0,           color: "#facc15",                accent: "#facc15" },
    { label: "Faltas",            value: stats.faltas ?? 0,          color: "#f87171",                accent: "#f87171" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
        style={{ color: "rgba(255,255,255,0.40)" }}
        onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
        <ArrowLeft size={15} /> Volver
      </button>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.25)" }}>
            <CalendarDays size={22} color={BLUE_L} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>{session?.name}</h1>
            {session?.description && <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{session.description}</p>}
            <div className="mt-1.5">
              {session?.isActive ? (
                <span className="flex items-center gap-1.5 w-fit text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Activa
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>Cerrada</span>
              )}
            </div>
          </div>
        </div>

        {/* Editar sesión — solo no-admin */}
        {!isReadOnly && (
          <button onClick={() => router.push(`/admin/sessions/${id}/edit`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0"
            style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
            Editar sesión
          </button>
        )}
      </div>

      {/* INFO HORARIO */}
      <div className="relative overflow-hidden p-5" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>Información de la sesión</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Fecha</p>
            <p className="font-semibold" style={{ color: "#f1f5f9" }}>{session?.date}</p>
          </div>
          {[
            { label: "Inicio",     val: session?.startTime,     color: "#4ade80", bg: "rgba(74,222,128,0.14)"  },
            { label: "Tolerancia", val: session?.toleranceTime, color: "#facc15", bg: "rgba(250,204,21,0.14)"  },
            { label: "Fin",        val: session?.endTime,       color: "#f87171", bg: "rgba(248,113,113,0.14)" },
          ].map(({ label, val, color, bg }) => (
            <div key={label}>
              <p className="text-xs mb-1 font-semibold" style={{ color }}>{label}</p>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: bg, color }}>{val || "—"}</span>
            </div>
          ))}
          <div>
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Módulos</p>
            <div className="flex flex-wrap gap-1">
              {session?.modules?.length === 0
                ? <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>
                : session?.modules?.map((m: any) => (
                    <span key={m.id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                      {m.name}
                    </span>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((card, i) => (
            <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(card.accent)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${card.accent},transparent)` }} />
              <p className="text-2xl md:text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {dashboard && <AttendanceTable rows={dashboard.rows ?? []} title="Registro de asistencia" />}
      {externalRows.length > 0 && <AttendanceTable rows={externalRows} title="Visitas de otros módulos" external />}
    </div>
  );
}