"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Building2, MapPin, Users, Boxes, ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from "lucide-react";

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

export default function SedeDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const [sede, setSede]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get(`/sedes/${id}`);
      setSede(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    if (sede.isActive) {
      await api.patch(`/sedes/${id}/disable`);
    } else {
      await api.patch(`/sedes/${id}/activate`);
    }
    load();
  }

  async function remove() {
    const modulesCount = sede.modules?.length ?? 0;
    const msg = modulesCount > 0
      ? `¿Eliminar "${sede.name}"? Se eliminarán también sus ${modulesCount} módulo(s). Esta acción no se puede deshacer.`
      : `¿Eliminar "${sede.name}"? Esta acción no se puede deshacer.`;
    if (!confirm(msg)) return;
    try {
      await api.delete(`/sedes/${id}`);
      router.push("/admin/sedes");
    } catch {
      alert("Error al eliminar la sede");
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando sede...</p>
      </div>
    </div>
  );

  const totalVolunteers = sede.modules?.reduce((acc: number, m: any) => acc + (m.volunteers?.length ?? 0), 0) ?? 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen max-w-3xl" style={{ background: "#070d14", color: "#e2e8f0" }}>

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
            style={{ background: sede.isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Building2 size={22} color={sede.isActive ? "#4ade80" : "rgba(255,255,255,0.30)"} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {sede.name}
            </h1>
            {sede.address && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={12} style={{ color: "rgba(255,255,255,0.30)", flexShrink: 0 }} />
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{sede.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones header */}
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/admin/sedes/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
            <Pencil size={13} /> Editar
          </Link>
          <button onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={sede.isActive
              ? { background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }
              : { background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.20)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.80")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            {sede.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
            {sede.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* INFO STATS */}
      <div className="relative overflow-hidden p-5" style={glass(sede.isActive ? "#4ade80" : undefined)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: sede.isActive ? "linear-gradient(90deg,#4ade80,transparent)" : "linear-gradient(90deg,rgba(255,255,255,0.12),transparent)" }} />
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>Información general</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Estado</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={sede.isActive
                ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
              {sede.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Módulos</p>
            <div className="flex items-center justify-center gap-1.5">
              <Boxes size={14} color={BLUE_L} />
              <p className="text-lg font-bold" style={{ color: BLUE_L }}>{sede.modules?.length ?? 0}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Voluntarios</p>
            <div className="flex items-center justify-center gap-1.5">
              <Users size={14} color={ORANGE} />
              <p className="text-lg font-bold" style={{ color: ORANGE }}>{totalVolunteers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MÓDULOS */}
      <div className="relative overflow-hidden p-5" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
          <Boxes size={15} color={BLUE_L} />
          Módulos de esta sede
        </h2>
        {sede.modules?.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.25)" }}>Sin módulos registrados</p>
        ) : (
          <div className="space-y-2">
            {sede.modules?.map((m: any) => (
              <div key={m.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.80)" }}>{m.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {m.volunteers?.length ?? 0} voluntarios
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={m.isActive
                    ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)" }}>
                  {m.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ZONA PELIGROSA */}
      {user?.role === "super_admin" && (
        <div className="relative overflow-hidden p-5" style={{ ...glass("#f87171"), borderColor: "rgba(248,113,113,0.25)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#f87171,transparent)" }} />
          <h2 className="font-semibold text-sm mb-1 flex items-center gap-2" style={{ color: "#f87171" }}>
            <AlertTriangle size={15} />
            Zona peligrosa
          </h2>
          <p className="text-xs mb-4" style={{ color: "rgba(248,113,113,0.70)" }}>
            Eliminar esta sede borrará permanentemente todos sus módulos relacionados. Esta acción no se puede deshacer.
          </p>
          <button onClick={remove}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.30)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.28)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}>
            <Trash2 size={14} />
            Eliminar sede permanentemente
          </button>
        </div>
      )}

    </div>
  );
}