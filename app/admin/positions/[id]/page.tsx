"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import Link from "next/link";
import { ArrowLeft, Award, Users, UserCheck, UserMinus } from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";
const VIOLET = "#9b6dff";

const glass = (accent?: string) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${accent ? accent + "33" : "rgba(255,255,255,0.08)"}`,
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
});

export default function PositionDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    try {
      const res = await api.get(`/positions/${id}/stats`);
      setData(res.data);
    } finally { setLoading(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(155,109,255,0.2)`, borderTopColor: VIOLET }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando cargo...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <p style={{ color: "rgba(255,255,255,0.30)" }}>Cargo no encontrado</p>
    </div>
  );

  const { position, stats, members } = data;

  const statCards = [
    { value: stats.totalMembers,    label: "Total miembros", color: VIOLET,    icon: <Users size={18} color={VIOLET} />      },
    { value: stats.activeMembers,   label: "Activos",        color: "#4ade80", icon: <UserCheck size={18} color="#4ade80" /> },
    { value: stats.inactiveMembers, label: "Inactivos",      color: "rgba(255,255,255,0.35)", icon: <UserMinus size={18} color="rgba(255,255,255,0.35)" /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen max-w-4xl" style={{ background: "#070d14", color: "#e2e8f0" }}>

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
            style={{ background: "rgba(155,109,255,0.15)", border: "1px solid rgba(155,109,255,0.25)" }}>
            <Award size={22} color={VIOLET} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {position.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={position.isActive
                  ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                {position.isActive ? "Activo" : "Inactivo"}
              </span>
              {position.description && (
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{position.description}</span>
              )}
            </div>
          </div>
        </div>

        <button onClick={() => router.push(`/admin/positions?edit=${id}`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex-shrink-0"
          style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
          Editar
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((sc, i) => (
          <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(sc.color)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${sc.color},transparent)` }} />
            <div className="flex justify-center mb-2">{sc.icon}</div>
            <p className="text-2xl md:text-3xl font-bold" style={{ color: sc.color }}>{sc.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{sc.label}</p>
          </div>
        ))}
      </div>

      {/* TABLA MIEMBROS */}
      <div className="relative overflow-hidden" style={glass(VIOLET)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${VIOLET},transparent)` }} />

        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
            <Users size={14} color={VIOLET} /> Voluntarios con este cargo
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <Award size={28} color="rgba(155,109,255,0.25)" />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Ningún voluntario tiene este cargo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Voluntario","Periodo","Otros cargos","Estado","Notas"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, i: number) => (
                  <tr key={m.id}
                    style={{ borderBottom: i < members.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    {/* Voluntario */}
                    <td className="px-4 py-3">
                      <Link href={`/admin/volunteers/${m.volunteer?.id}`}
                        className="font-semibold text-sm transition-colors duration-200"
                        style={{ color: "#f1f5f9" }}
                        onMouseEnter={e => (e.currentTarget.style.color = VIOLET)}
                        onMouseLeave={e => (e.currentTarget.style.color = "#f1f5f9")}>
                        {m.volunteer?.fullName || "—"}
                      </Link>
                    </td>

                    {/* Periodo */}
                    <td className="px-4 py-3">
                      {m.period ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                          {m.period.name}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>
                      )}
                    </td>

                    {/* Otros cargos */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.positions?.filter((p: any) => p.id !== Number(id)).length > 0
                          ? m.positions.filter((p: any) => p.id !== Number(id)).map((p: any) => (
                              <span key={p.id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(155,109,255,0.15)", color: VIOLET }}>
                                {p.name}
                              </span>
                            ))
                          : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={m.isActive
                          ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                        {m.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Notas */}
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
    </div>
  );
}