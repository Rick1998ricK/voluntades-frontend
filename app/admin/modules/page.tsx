"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { 
  Pencil, ToggleLeft, ToggleRight, AlertTriangle,
  Building2, Boxes, Plus, ChevronDown, ChevronRight, ChevronLeft,
  QrCode, Download, Key, CheckCircle, AlertCircle, User, Phone,
  MapPin, Droplets, BookOpen, Calendar, ClipboardList, FileCheck,
  Clock, XCircle, X, Search, UserCheck, CreditCard, ScanLine, Filter,
  BarChart2, Award, CheckSquare, Square, Save, Trash2, Users2, AlignLeft, UserMinus,
} from "lucide-react";

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

const selectStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "8px 12px",
  color: "#e2e8f0",
  fontSize: "13px",
  outline: "none",
};

/* ══════════════════════════════════
   MODAL COORDINADORES
══════════════════════════════════ */
function CoordinatorsModal({ module, onClose, onUpdate }: {
  module: any;
  onClose: () => void;
  onUpdate: (moduleId: number, coordinators: any[]) => void;
}) {
  const [coordinators, setCoordinators] = useState<any[]>(module.coordinators ?? []);
  const [search, setSearch]             = useState("");
  const [results, setResults]           = useState<any[]>([]);
  const [searching, setSearching]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { if (search.trim()) doSearch(search.trim()); else setResults([]); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function doSearch(q: string) {
    setSearching(true);
    try {
      const res = await api.get(`/modules/management-members?search=${q}`);
      setResults(res.data ?? []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }

  async function add(member: any) {
    if (coordinators.some(c => c.id === member.id)) return;
    try {
      const res = await api.post(`/modules/${module.id}/coordinators`, { managementMemberId: member.id });
      setCoordinators(res.data);
      onUpdate(module.id, res.data);
      setSearch(""); setResults([]);
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al agregar"); }
  }

  async function remove(memberId: number) {
    if (!confirm("¿Quitar este coordinador?")) return;
    try {
      const res = await api.delete(`/modules/${module.id}/coordinators/${memberId}`);
      setCoordinators(res.data);
      onUpdate(module.id, res.data);
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al quitar"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg relative overflow-hidden"
        style={{ ...glass(BLUE_L), borderRadius: "20px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* Accent top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: "#f1f5f9" }}>
              <User size={16} color={BLUE_L} /> Coordinadores
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{module.name}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Buscador */}
          <div>
            <label className="text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: "rgba(255,255,255,0.35)" }}>
              Agregar coordinador (solo miembros de gestión)
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)", borderRadius: "10px",
                  padding: "9px 12px 9px 34px", color: "#f1f5f9", fontSize: "13px", outline: "none",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(46,111,168,0.60)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,111,168,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
              />
              {(searching || results.length > 0 || (search.trim() && !searching)) && (
                <div className="absolute w-full mt-1 z-50 overflow-y-auto max-h-52"
                  style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px", boxShadow: "0 16px 40px rgba(0,0,0,0.50)" }}>
                  {searching && <div className="p-3 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Buscando...</div>}
                  {!searching && results.length === 0 && search.trim() && (
                    <div className="p-3 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin resultados en gestión</div>
                  )}
                  {!searching && results.map(m => {
                    const alreadyIn = coordinators.some(c => c.id === m.id);
                    const positions = m.positions?.map((p: any) => p.name).join(", ") || "Sin cargo";
                    return (
                      <div key={m.id} onClick={() => !alreadyIn && add(m)}
                        className="px-4 py-3 text-sm transition-all duration-150"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          cursor: alreadyIn ? "not-allowed" : "pointer",
                          opacity: alreadyIn ? 0.5 : 1,
                        }}
                        onMouseEnter={e => { if (!alreadyIn) (e.currentTarget as HTMLElement).style.background = "rgba(46,111,168,0.12)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <p className="font-semibold" style={{ color: "#f1f5f9" }}>{m.volunteer?.fullName}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9b6dff" }}>
                          <Award size={10} className="inline mr-1" />{positions}
                        </p>
                        {alreadyIn && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>Ya es coordinador</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lista actual */}
          <div>
            <label className="text-xs font-medium uppercase tracking-widest mb-2 block" style={{ color: "rgba(255,255,255,0.35)" }}>
              Coordinadores actuales ({coordinators.length})
            </label>
            {coordinators.length === 0 ? (
              <div className="py-8 text-center rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.12)" }}>
                <User size={22} className="mx-auto mb-2" style={{ color: "rgba(255,255,255,0.20)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Sin coordinadores asignados</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {coordinators.map(c => {
                  const positions = c.positions?.map((p: any) => p.name).join(", ") || "Sin cargo";
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "rgba(155,109,255,0.08)", border: "1px solid rgba(155,109,255,0.18)" }}>
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
                      <button onClick={() => remove(c.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg ml-3 flex-shrink-0 transition-all duration-200"
                        style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.22)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                        <UserMinus size={12} /> Quitar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.09)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════ */
export default function ModulesPage() {
  const [modules, setModules]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterSede, setFilterSede] = useState("");
  const [sedes, setSedes]           = useState<any[]>([]);
  const [visible, setVisible]       = useState(PAGE_SIZE);
  const [coordModal, setCoordModal] = useState<any | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [modRes, sedeRes] = await Promise.all([api.get("/modules"), api.get("/sedes")]);
      setModules([...modRes.data].sort((a, b) => b.id - a.id));
      setSedes(sedeRes.data);
    } finally { setLoading(false); }
  }

  async function deactivate(id: number) {
    await api.patch(`/modules/${id}/deactivate`);
    setModules(prev => prev.map(m => m.id === id ? { ...m, isActive: false } : m));
  }

  async function activate(id: number) {
    await api.patch(`/modules/${id}/activate`);
    setModules(prev => prev.map(m => m.id === id ? { ...m, isActive: true } : m));
  }

  function handleCoordUpdate(moduleId: number, coordinators: any[]) {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, coordinators } : m));
    setCoordModal((prev: any) => prev?.id === moduleId ? { ...prev, coordinators } : prev);
  }

  const filtered = filterSede ? modules.filter(m => String(m.sede?.id) === filterSede) : modules;
  const shown    = filtered.slice(0, visible);
  const hasMore  = visible < filtered.length;
  const handleFilterSede = (val: string) => { setFilterSede(val); setVisible(PAGE_SIZE); };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Módulos</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Gestión de módulos del sistema</p>
        </div>
        <Link href="/admin/modules/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: `0 4px 16px rgba(46,111,168,0.35)` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}>
          <Plus size={15} />
          <span className="hidden sm:inline">Nuevo módulo</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {/* FILTROS */}
      <div className="flex items-center gap-3 flex-wrap">
        <select style={selectStyle} value={filterSede} onChange={e => handleFilterSede(e.target.value)}>
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {filterSede && (
          <button onClick={() => handleFilterSede("")}
            className="flex items-center gap-1 text-xs font-medium transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
            <X size={12} /> Limpiar filtro
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{filtered.length} módulo(s)</span>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando módulos...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.12)" }}>
            <Boxes size={26} color={BLUE_L} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay módulos registrados</p>
          <Link href="/admin/modules/new" className="text-sm font-medium" style={{ color: BLUE_L }}>
            Crear el primer módulo →
          </Link>
        </div>
      ) : (
        <>
          {/* TABLA */}
          <div className="relative overflow-hidden" style={glass()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Módulo", "Sede", "Voluntarios", "Coordinadores", "Estado", "Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((mod, i) => (
                    <tr key={mod.id}
                      style={{
                        borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        opacity: mod.isActive ? 1 : 0.55,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Módulo */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: mod.isActive ? "rgba(74,222,128,0.10)" : "rgba(255,255,255,0.05)" }}>
                            <Boxes size={13} color={mod.isActive ? "#4ade80" : "rgba(255,255,255,0.25)"} />
                          </div>
                          <span className="font-semibold" style={{ color: "#f1f5f9" }}>{mod.name}</span>
                        </div>
                      </td>

                      {/* Sede */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                          {mod.sede?.name ?? "—"}
                        </span>
                      </td>

                      {/* Voluntarios */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User size={13} color={ORANGE} />
                          <span style={{ color: "rgba(255,255,255,0.70)" }}>
                            {mod.volunteers?.filter((v: any) => v.status === "activo").length ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Coordinadores */}
                      <td className="px-4 py-3">
                        {(mod.coordinators?.length ?? 0) === 0 ? (
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sin asignar</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {mod.coordinators.slice(0, 2).map((c: any) => (
                              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(155,109,255,0.15)", color: "#9b6dff" }}>
                                {c.volunteer?.fullName?.split(" ")[0]} {c.volunteer?.fullName?.split(" ")[2] ?? ""}
                              </span>
                            ))}
                            {mod.coordinators.length > 2 && (
                              <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                                +{mod.coordinators.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={mod.isActive
                            ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {mod.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setCoordModal(mod)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                            style={{ background: "rgba(155,109,255,0.12)", color: "#9b6dff", border: "1px solid rgba(155,109,255,0.20)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,109,255,0.22)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,109,255,0.12)")}>
                            Coords
                          </button>
                          <Link href={`/admin/modules/${mod.id}`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                            Ver
                          </Link>
                          <Link href={`/admin/modules/${mod.id}/edit`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                            style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                            Editar
                          </Link>
                          {mod.isActive ? (
                            <button onClick={() => deactivate(mod.id)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                              Desactivar
                            </button>
                          ) : (
                            <button onClick={() => activate(mod.id)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARGAR MÁS */}
          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                <ChevronDown size={15} />
                Cargar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}

      {coordModal && (
        <CoordinatorsModal
          module={coordModal}
          onClose={() => setCoordModal(null)}
          onUpdate={handleCoordUpdate}
        />
      )}
    </div>
  );
}