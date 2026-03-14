"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, ChevronDown, X, CheckCircle2, Clock, XCircle } from "lucide-react";

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

const selStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "8px 12px",
  color: "#f1f5f9",
  fontSize: "13px",
  outline: "none",
  colorScheme: "dark",
};

interface Session {
  id: number; name: string; date: string;
  startTime: string; toleranceTime: string; endTime: string;
  isActive: boolean;
  modules: { id: number; name: string; sede: { id: number; name: string } }[];
}
interface Module { id: number; name: string; sede: { id: number; name: string } }

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Activa
    </span>
  ) : (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
      Cerrada
    </span>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions]             = useState<Session[]>([]);
  const [modules, setModules]               = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedSede, setSelectedSede]     = useState("");
  const [date, setDate]                     = useState("");
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [visible, setVisible]               = useState(PAGE_SIZE);
  const router = useRouter();

  useEffect(() => { fetchSessions(); fetchModules(); }, []);

  const fetchSessions = async () => {
    const res = await axios.get("/sessions");
    setSessions([...res.data].sort((a: Session, b: Session) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      return d !== 0 ? d : b.id - a.id;
    }));
  };

  const fetchModules = async () => {
    const res = await axios.get("/modules");
    setModules(res.data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta sesión?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { alert("Error al eliminar la sesión"); }
    finally { setDeletingId(null); }
  };

  const sedes = Array.from(new Map(modules.map(m => [m.sede.id, m.sede])).values());
  const filtered = sessions.filter(s => {
    const matchSede   = !selectedSede   || s.modules?.some(m => m.sede?.id === Number(selectedSede));
    const matchModule = !selectedModule || s.modules?.some(m => m.id === Number(selectedModule));
    const matchDate   = !date || s.date === date;
    return matchSede && matchModule && matchDate;
  });
  const shown   = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const resetVisible = () => setVisible(PAGE_SIZE);
  const hasFilters = !!(selectedSede || selectedModule || date);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Sesiones</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Gestión de sesiones de asistencia</p>
        </div>
        <button onClick={() => router.push("/admin/sessions/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: `0 4px 16px rgba(46,111,168,0.35)` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}>
          <Plus size={15} />
          <span className="hidden sm:inline">Crear Sesión</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 flex-wrap items-center p-3 rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <select style={selStyle} value={selectedSede}
          onChange={e => { setSelectedSede(e.target.value); resetVisible(); }}>
          <option value="" style={{ background: "#0d1424" }}>Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id} style={{ background: "#0d1424" }}>{s.name}</option>)}
        </select>
        <select style={selStyle} value={selectedModule}
          onChange={e => { setSelectedModule(e.target.value); resetVisible(); }}>
          <option value="" style={{ background: "#0d1424" }}>Todos los módulos</option>
          {modules.filter(m => !selectedSede || m.sede.id === Number(selectedSede))
            .map(m => <option key={m.id} value={m.id} style={{ background: "#0d1424" }}>{m.name}</option>)}
        </select>
        <input type="date" style={{ ...selStyle, width: "auto" }} value={date}
          onChange={e => { setDate(e.target.value); resetVisible(); }} />
        {hasFilters && (
          <button onClick={() => { setSelectedSede(""); setSelectedModule(""); setDate(""); resetVisible(); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200"
            style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}>
            <X size={11} /> Limpiar
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{filtered.length} sesión(es)</span>
      </div>

      {/* TABLA */}
      <div className="relative overflow-hidden" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Nombre","Módulos","Fecha","Inicio","Tolerancia","Fin","Estado","Acciones"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-12">
                  <div className="flex flex-col items-center gap-3">
                    <CalendarDays size={28} color="rgba(46,111,168,0.30)" />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay sesiones</p>
                  </div>
                </td></tr>
              ) : shown.map((s, i) => (
                <tr key={s.id}
                  style={{ borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                  <td className="px-3 py-3 font-semibold" style={{ color: "#f1f5f9" }}>{s.name}</td>

                  <td className="px-3 py-3">
                    {s.modules?.length > 1 ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                        {s.modules.length} módulos
                      </span>
                    ) : s.modules?.length === 1 ? (
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{s.modules[0].name}</span>
                    ) : <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{s.date}</td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>{s.startTime}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(250,204,21,0.14)", color: "#facc15" }}>{s.toleranceTime || "—"}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}>{s.endTime || "—"}</span>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap"><StatusBadge isActive={s.isActive} /></td>

                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => router.push(`/admin/sessions/${s.id}`)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                        style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                        Ver
                      </button>
                      <button onClick={() => router.push(`/admin/sessions/${s.id}/edit`)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                        style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                        style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)", opacity: deletingId === s.id ? 0.5 : 1 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                        {deletingId === s.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}