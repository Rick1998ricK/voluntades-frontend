"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Building2, MapPin, Users, Boxes, Plus, ChevronDown } from "lucide-react";

const PAGE_SIZE = 15;

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

export default function SedesPage() {
  const [sedes, setSedes]     = useState<any[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/sedes");
      const sorted = [...res.data].sort((a, b) => b.id - a.id);
      setSedes(sorted);
    } finally {
      setLoading(false);
    }
  }

  async function disable(id: number) {
    await api.patch(`/sedes/${id}/disable`);
    setSedes(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
  }

  async function activate(id: number) {
    await api.patch(`/sedes/${id}/activate`);
    setSedes(prev => prev.map(s => s.id === id ? { ...s, isActive: true } : s));
  }

  const shown  = sedes.slice(0, visible);
  const hasMore = visible < sedes.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
            Sedes
          </h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Gestión de sedes del sistema
          </p>
        </div>
        <Link
          href="/admin/sedes/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${BLUE}, ${BLUE_L})`,
            color: "#fff",
            boxShadow: `0 4px 16px rgba(46,111,168,0.35)`,
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Nueva sede</span>
          <span className="sm:hidden">Nueva</span>
        </Link>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando sedes...</p>
          </div>
        </div>
      ) : sedes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.12)" }}>
            <Building2 size={26} color={BLUE_L} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay sedes registradas</p>
          <Link href="/admin/sedes/new" className="text-sm font-medium" style={{ color: BLUE_L }}>
            Crear la primera sede →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map(sede => (
              <div
                key={sede.id}
                className="relative overflow-hidden flex flex-col gap-4 p-5 transition-all duration-300"
                style={{
                  ...glass(sede.isActive ? "#4ade80" : undefined),
                  opacity: sede.isActive ? 1 : 0.65,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)";
                }}
              >
                {/* Top accent */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: sede.isActive
                    ? "linear-gradient(90deg, #4ade80, transparent)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.15), transparent)",
                }} />

                {/* Nombre + estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: sede.isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)" }}>
                        <Building2 size={15} color={sede.isActive ? "#4ade80" : "rgba(255,255,255,0.30)"} />
                      </div>
                      <h2 className="font-bold text-sm truncate" style={{ color: "#f1f5f9" }}>{sede.name}</h2>
                    </div>
                    {sede.address && (
                      <div className="flex items-center gap-1 ml-10">
                        <MapPin size={11} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{sede.address}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={sede.isActive
                      ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                    {sede.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Boxes size={14} color={BLUE_L} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: BLUE_L }}>{sede.modules?.length ?? 0}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Módulos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Users size={14} color={ORANGE} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: ORANGE }}>
                        {sede.modules?.reduce((acc: number, m: any) => acc + (m.volunteers?.length ?? 0), 0) ?? 0}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Voluntarios</p>
                    </div>
                  </div>
                </div>

                {/* Módulos pills */}
                {sede.modules?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sede.modules.map((m: any) => (
                      <span key={m.id} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.20)" }}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Link href={`/admin/sedes/${sede.id}`}
                    className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                    Ver detalle
                  </Link>
                  <Link href={`/admin/sedes/${sede.id}/edit`}
                    className="flex-1 text-center text-xs font-semibold py-2 rounded-lg transition-all duration-200"
                    style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.20)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                    Editar
                  </Link>
                  {sede.isActive ? (
                    <button onClick={() => disable(sede.id)}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200"
                      style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                      Desactivar
                    </button>
                  ) : (
                    <button onClick={() => activate(sede.id)}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200"
                      style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.20)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                      Activar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CARGAR MÁS */}
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.60)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              >
                <ChevronDown size={15} />
                Cargar más ({sedes.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}