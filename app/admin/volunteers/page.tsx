"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Users, Search, X, ChevronDown, Download, QrCode, Plus, FileCheck, FileClock } from "lucide-react";

const PAGE_SIZE = 15;
const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";

const glass = () => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
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

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getRequiredDocs(birthDate: string): string[] {
  const age = calcAge(birthDate);
  if (age !== null && age < 18)
    return ["carta_compromiso", "ficha_beneficencia", "autorizacion_menor"];
  return ["carta_compromiso", "ficha_beneficencia", "certificado_unico_laboral"];
}

function getFichaStatus(vol: any) {
  const required = getRequiredDocs(vol.birthDate);
  const uploaded = (vol.documents ?? []).map((d: any) => d.type);
  const allDocs  = required.every(r => uploaded.includes(r));
  return allDocs
    ? { label: "Completa",  color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.25)" }
    : { label: "Pendiente", color: ORANGE,    bg: "rgba(232,114,42,0.12)", border: "rgba(232,114,42,0.25)" };
}

export default function VolunteersPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === "admin";

  const [volunteers, setVolunteers]     = useState<any[]>([]);
  const [modules, setModules]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [periods,      setPeriods]      = useState<any[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterFicha, setFilterFicha]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [visible, setVisible]           = useState(PAGE_SIZE);

  useEffect(() => { 
    load(); 
    loadModules();
    api.get("/periods").then(r => {
      setPeriods(r.data);
    }).catch(() => {});
  }, []);

  async function load() {
    try {
      const res = await api.get("/volunteers");
      setVolunteers([...res.data].sort((a, b) => b.id - a.id));
    } finally { setLoading(false); }
  }

  async function loadModules() {
    try { const res = await api.get("/modules"); setModules(res.data ?? []); } catch {}
  }

  async function deactivate(id: number) {
    if (!confirm("¿Desactivar este voluntario?")) return;
    try {
      await api.patch(`/volunteers/${id}/deactivate`);
      setVolunteers(vs => vs.map(v => v.id === id ? { ...v, status: "inactivo" } : v));
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al desactivar"); }
  }

  async function activate(id: number) {
    try {
      await api.post(`/volunteers/${id}/activate`);
      setVolunteers(vs => vs.map(v => v.id === id ? { ...v, status: "activo" } : v));
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al activar"); }
  }

  const filtered = volunteers.filter(v => {
    if (filterPeriod && v.joinPeriod !== filterPeriod) return false;
    const matchSearch = !search || v.fullName?.toLowerCase().includes(search.toLowerCase()) || v.dni?.includes(search);
    const ficha = getFichaStatus(v).label.toLowerCase();
    return matchSearch
      && (!filterFicha  || ficha === filterFicha)
      && (!filterStatus || v.status === filterStatus)
      && (!filterModule || String(v.module?.id) === filterModule);
  });

  const shown   = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const resetVisible = () => setVisible(PAGE_SIZE);

  const handleExport = () => {
    const excelData = filtered.map(v => ({
      "Nombre completo": v.fullName,
      "DNI": v.dni || "—",
      "Teléfono": v.phone || "—",
      "Módulo": v.module?.name || "—",
      "Sede": v.sede?.name || "—",
      "Estado": v.status,
      "Ficha": getFichaStatus(v).label,
      "Periodo ingreso": v.joinPeriod || "—",
      "Género": v.gender || "—",
      "Es estudiante": v.isStudent ? "Sí" : "No",
      "Institución": v.institution || "—",
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws["!cols"] = [{ wch: 28 },{ wch: 12 },{ wch: 14 },{ wch: 22 },{ wch: 24 },{ wch: 10 },{ wch: 12 },{ wch: 14 },{ wch: 10 },{ wch: 14 },{ wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voluntarios");
    XLSX.writeFile(wb, `voluntarios-${new Date().toLocaleDateString("es-PE").replace(/\//g, "-")}.xlsx`);
  };

  const hasFilters = search || filterFicha || filterStatus || filterModule;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Voluntarios</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isReadOnly ? "Vista de voluntarios (solo lectura)" : "Gestión de voluntarios del sistema"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Exportar Excel — visible para todos */}
          {filtered.length > 0 && (
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.20)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.12)")}>
              <Download size={13} /> <span className="hidden sm:inline">Exportar Excel</span>
            </button>
          )}

          {/* Solo no-admin */}
          {!isReadOnly && (
            <>
              <Link href="/admin/volunteers/print-qr"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                <QrCode size={13} /> <span className="hidden sm:inline">Imprimir QR</span>
              </Link>
              <Link href="/admin/volunteers/new"
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200"
                style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: `0 4px 16px rgba(46,111,168,0.35)` }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}>
                <Plus size={14} /> <span className="hidden sm:inline">Nuevo voluntario</span><span className="sm:hidden">Nuevo</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
          <input
            style={{ ...selectStyle, paddingLeft: "32px", minWidth: "200px" }}
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={e => { setSearch(e.target.value); resetVisible(); }}
            onFocus={e => { e.target.style.borderColor = "rgba(46,111,168,0.60)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,111,168,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}>
          <option value="" style={{ background: "#0d1424" }}>Todos los períodos</option>
          {periods.map((p: any) => (
            <option key={p.id} value={p.name} style={{ background: "#0d1424" }}>{p.name}</option>
          ))}
        </select>
        <select style={selectStyle} value={filterModule} onChange={e => { setFilterModule(e.target.value); resetVisible(); }}>
          <option value="" style={{ background: "#0d1424" }}>Todos los módulos</option>
          {modules.map(m => <option key={m.id} value={String(m.id)} style={{ background: "#0d1424" }}>{m.name}</option>)}
        </select>
        <select style={selectStyle} value={filterFicha} onChange={e => { setFilterFicha(e.target.value); resetVisible(); }}>
          <option value="" style={{ background: "#0d1424" }}>Todas las fichas</option>
          <option value="completa" style={{ background: "#0d1424" }}>Completa</option>
          <option value="pendiente" style={{ background: "#0d1424" }}>Pendiente</option>
        </select>
        <select style={selectStyle} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); resetVisible(); }}>
          <option value="" style={{ background: "#0d1424" }}>Todos los estados</option>
          <option value="activo" style={{ background: "#0d1424" }}>Activo</option>
          <option value="inactivo" style={{ background: "#0d1424" }}>Inactivo</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(""); setFilterFicha(""); setFilterStatus(""); setFilterModule(""); resetVisible(); }}
            className="flex items-center gap-1 text-xs transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
            <X size={12} /> Limpiar
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{filtered.length} voluntario(s)</span>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando voluntarios...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(46,111,168,0.12)" }}>
            <Users size={26} color={BLUE_L} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay voluntarios</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden" style={glass()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Voluntario","DNI","Teléfono","Módulo","Sede","Ficha","Estado","Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((vol, i) => {
                    const ficha = getFichaStatus(vol);
                    const isActive = vol.status !== "inactivo";
                    const isMinor = (calcAge(vol.birthDate) ?? 99) < 18;
                    return (
                      <tr key={vol.id}
                        style={{
                          borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          opacity: isActive ? 1 : 0.50,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {vol.photoUrl ? (
                              <img src={vol.photoUrl?.startsWith("http") ? vol.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${vol.photoUrl}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                style={{ border: "1px solid rgba(255,255,255,0.12)" }} alt=""
                                onError={e => { (e.target as any).style.display = "none"; }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: "rgba(46,111,168,0.20)", color: BLUE_L }}>
                                {vol.fullName?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold" style={{ color: "#f1f5f9" }}>{vol.fullName}</span>
                              {isMinor && (
                                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                                  style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>menor</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{vol.dni || "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{vol.phone || "—"}</td>

                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                            {vol.module?.name || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{vol.sede?.name || "—"}</td>

                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: ficha.bg, color: ficha.color, border: `1px solid ${ficha.border}` }}>
                            {ficha.label === "Completa" ? <FileCheck size={10} /> : <FileClock size={10} />}
                            {ficha.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={isActive
                              ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                            {isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {/* Ver — siempre visible */}
                            <Link href={`/admin/volunteers/${vol.id}`}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                              Ver
                            </Link>

                            {/* Editar / Activar / Desactivar — solo no-admin */}
                            {!isReadOnly && (
                              <>
                                <Link href={`/admin/volunteers/${vol.id}/edit`}
                                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                  style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                                  Editar
                                </Link>
                                {isActive ? (
                                  <button onClick={() => deactivate(vol.id)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                    style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                                    Desactivar
                                  </button>
                                ) : (
                                  <button onClick={() => activate(vol.id)}
                                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                    style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.18)" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                                    Activar
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                <ChevronDown size={15} /> Cargar más ({filtered.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}