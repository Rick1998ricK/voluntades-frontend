"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Clock, Plus, ChevronDown, X, CalendarDays, AlignLeft, Save } from "lucide-react";

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

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s",
  colorScheme: "dark" as const,
};

const focusIn  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "rgba(46,111,168,0.60)";
  e.target.style.boxShadow   = "0 0 0 3px rgba(46,111,168,0.12)";
  e.target.style.background  = "rgba(255,255,255,0.07)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.10)";
  e.target.style.boxShadow   = "none";
  e.target.style.background  = "rgba(255,255,255,0.05)";
};

function getStatus(p: any) {
  const today = new Date().toISOString().split("T")[0];
  if (today < p.startDate) return { label: "Próximo",  color: BLUE_L,    bg: "rgba(74,144,196,0.12)",   border: "rgba(74,144,196,0.25)"  };
  if (today > p.endDate)   return { label: "Cerrado",  color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.10)" };
  return                          { label: "Activo",   color: "#4ade80",  bg: "rgba(74,222,128,0.12)",   border: "rgba(74,222,128,0.25)"  };
}

export default function PeriodsPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ name: "", description: "", startDate: "", endDate: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/periods");
      const data = res.data;
      setPeriods(data);

      // Leer ?edit=id desde window.location (sin useSearchParams)
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        const period = data.find((p: any) => p.id === Number(editId));
        if (period) openEdit(period);
        window.history.replaceState({}, "", "/admin/periods");
      }
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", description: "", startDate: "", endDate: "" });
    setModal(true);
  }

  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", startDate: p.startDate, endDate: p.endDate });
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.startDate || !form.endDate) return alert("Completa los campos requeridos");
    setSaving(true);
    try {
      if (editing) await api.patch(`/periods/${editing.id}`, form);
      else         await api.post("/periods", form);
      setModal(false);
      setLoading(true);
      await load();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`¿Eliminar el periodo "${name}"?`)) return;
    await api.delete(`/periods/${id}`);
    setPeriods(prev => prev.filter(p => p.id !== id));
  }

  const shown   = periods.slice(0, visible);
  const hasMore = visible < periods.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Periodos</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Gestión de periodos del sistema</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: `0 4px 16px rgba(46,111,168,0.35)` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}>
          <Plus size={15} />
          <span className="hidden sm:inline">Nuevo periodo</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando periodos...</p>
          </div>
        </div>
      ) : periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.12)" }}>
            <Clock size={26} color={BLUE_L} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay periodos registrados</p>
          <button onClick={openNew} className="text-sm font-medium" style={{ color: BLUE_L }}>
            Crear el primer periodo →
          </button>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden" style={glass()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Periodo", "Descripción", "Inicio", "Fin", "Estado", "Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p, i) => {
                    const st = getStatus(p);
                    return (
                      <tr key={p.id}
                        style={{ borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: "rgba(46,111,168,0.12)" }}>
                              <Clock size={13} color={BLUE_L} />
                            </div>
                            <span className="font-bold" style={{ color: "#f1f5f9" }}>{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="truncate block text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                            {p.description || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{p.startDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{p.endDate}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <Link href={`/admin/periods/${p.id}`}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                              Ver
                            </Link>
                            <button onClick={() => openEdit(p)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                              Editar
                            </button>
                            <button onClick={() => remove(p.id, p.name)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                              Eliminar
                            </button>
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
                <ChevronDown size={15} /> Cargar más ({periods.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL ═══ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setModal(false)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(BLUE_L), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: editing
                ? `linear-gradient(90deg,${ORANGE},#f5a35a,transparent)`
                : `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: editing ? "rgba(232,114,42,0.12)" : "rgba(46,111,168,0.15)" }}>
                  <Clock size={15} color={editing ? ORANGE : BLUE_L} />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>
                    {editing ? "Editar periodo" : "Nuevo periodo"}
                  </h2>
                  {editing && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{editing.name}</p>}
                </div>
              </div>
              <button onClick={() => setModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.40)" }}>
                  <Clock size={11} /> Nombre <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="ej: 2026-I"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={focusIn} onBlur={focusOut} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.40)" }}>
                  <AlignLeft size={11} /> Descripción
                </label>
                <textarea rows={2} placeholder="ej: Primer semestre 2026"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  onFocus={focusIn} onBlur={focusOut}
                  style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.40)" }}>
                    <CalendarDays size={11} /> Inicio <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="date" style={inputStyle}
                    value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.40)" }}>
                    <CalendarDays size={11} /> Fin <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <input type="date" style={inputStyle}
                    value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                  Cancelar
                </button>
                <button onClick={save} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: saving ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`,
                    color: "#fff", boxShadow: saving ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
                    cursor: saving ? "not-allowed" : "pointer",
                  }}>
                  {saving
                    ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    : <Save size={14} />}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}