"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Boxes, Users, Building2, ArrowLeft, Pencil,
  ToggleLeft, ToggleRight, Trash2, AlertTriangle, Award, Calendar,
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

export default function ModuleDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const { user } = useAuth();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [module, setModule]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const res = await api.get(`/modules/${id}`);
      setModule(res.data);
    } finally { setLoading(false); }
  }

  async function toggle() {
    if (module.isActive) await api.patch(`/modules/${id}/deactivate`);
    else await api.patch(`/modules/${id}/activate`);
    load();
  }

  async function remove() {
    const volCount = module.volunteers?.length ?? 0;
    const msg = volCount > 0
      ? `¿Eliminar "${module.name}"? Los ${volCount} voluntario(s) asignados perderán su módulo, pero no serán eliminados. Esta acción no se puede deshacer.`
      : `¿Eliminar "${module.name}"? Esta acción no se puede deshacer.`;
    if (!confirm(msg)) return;
    try {
      await api.delete(`/modules/${id}`);
      router.push("/admin/modules");
    } catch { alert("Error al eliminar el módulo"); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando módulo...</p>
      </div>
    </div>
  );

  if (!module) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <p style={{ color: "rgba(255,255,255,0.30)" }}>Módulo no encontrado</p>
    </div>
  );

  const coordinators   = module.coordinators ?? [];
  const activeVolunteers = module.volunteers?.filter((v: any) => v.status === "activo") ?? [];

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
            style={{ background: module.isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Boxes size={22} color={module.isActive ? "#4ade80" : "rgba(255,255,255,0.30)"} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {module.name}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 size={11} style={{ color: "rgba(255,255,255,0.30)" }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{module.sede?.name ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/admin/modules/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
            <Pencil size={13} /> Editar
          </Link>
          <button onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
            style={module.isActive
              ? { background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }
              : { background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.20)" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.80")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            {module.isActive ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
            {module.isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="relative overflow-hidden p-5" style={glass(module.isActive ? "#4ade80" : undefined)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: module.isActive ? "linear-gradient(90deg,#4ade80,transparent)" : "linear-gradient(90deg,rgba(255,255,255,0.12),transparent)" }} />
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>Información general</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Estado</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={module.isActive
                ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
              {module.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Sede</p>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
              {module.sede?.name ?? "—"}
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Voluntarios activos</p>
            <div className="flex items-center justify-center gap-1.5">
              <Users size={14} color={ORANGE} />
              <p className="text-lg font-bold" style={{ color: ORANGE }}>{activeVolunteers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* COORDINADORES */}
      <div className="relative overflow-hidden p-5" style={glass("#9b6dff")}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#9b6dff,transparent)" }} />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
            <Users size={15} color="#9b6dff" /> Coordinadores / Encargados
          </h2>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{coordinators.length} asignado(s)</span>
        </div>
        {coordinators.length === 0 ? (
          <div className="py-8 text-center rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.10)" }}>
            <Users size={22} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.18)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
              Sin coordinadores — asígnalos desde la lista de módulos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coordinators.map((c: any) => {
              const positions = c.positions?.map((p: any) => p.name).join(", ") || "Sin cargo";
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "rgba(155,109,255,0.08)", border: "1px solid rgba(155,109,255,0.18)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: "rgba(155,109,255,0.20)", color: "#9b6dff" }}>
                    {c.volunteer?.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>{c.volunteer?.fullName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9b6dff" }}>
                      <Award size={10} className="inline mr-1" />{positions}
                    </p>
                    {c.period && (
                      <p className="text-xs mt-0.5" style={{ color: BLUE_L }}>
                        <Calendar size={10} className="inline mr-1" />{c.period?.name}
                      </p>
                    )}
                  </div>
                  {c.volunteer?.id && (
                    <Link href={`/admin/volunteers/${c.volunteer.id}`}
                      className="text-xs font-medium flex-shrink-0 transition-colors duration-200"
                      style={{ color: BLUE_L }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = BLUE_L)}>
                      Ver
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VOLUNTARIOS */}
      <div className="relative overflow-hidden p-5" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
          <Users size={15} color={BLUE_L} /> Voluntarios asignados
        </h2>
        {activeVolunteers.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.25)" }}>Sin voluntarios asignados</p>
        ) : (
          <div className="space-y-2">
            {activeVolunteers.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.80)" }}>{v.fullName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>DNI: {v.dni ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={v.status === "activo"
                      ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                      : v.status === "pendiente"
                        ? { background: "rgba(232,114,42,0.12)", color: ORANGE }
                        : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                    {v.status}
                  </span>
                  <Link href={`/admin/volunteers/${v.id}`}
                    className="text-xs font-medium transition-colors duration-200"
                    style={{ color: BLUE_L }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={e => (e.currentTarget.style.color = BLUE_L)}>
                    Ver
                  </Link>
                </div>
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
            <AlertTriangle size={15} /> Zona peligrosa
          </h2>
          <p className="text-xs mb-4" style={{ color: "rgba(248,113,113,0.70)" }}>
            Eliminar este módulo desvinculará a los voluntarios asignados, pero no los eliminará del sistema.
          </p>
          <button onClick={remove}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.30)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.28)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}>
            <Trash2 size={14} /> Eliminar módulo permanentemente
          </button>
        </div>
      )}
    </div>
  );
}