"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Award, Plus, ChevronDown, X, AlignLeft, Save } from "lucide-react";

const PAGE_SIZE = 15;
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

const IS: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s",
};

const fi = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(46,111,168,0.60)"; e.target.style.boxShadow="0 0 0 3px rgba(46,111,168,0.12)"; e.target.style.background="rgba(255,255,255,0.07)"; };
const fo = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(255,255,255,0.10)"; e.target.style.boxShadow="none"; e.target.style.background="rgba(255,255,255,0.05)"; };

export default function PositionsPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [visible, setVisible]     = useState(PAGE_SIZE);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ name: "", description: "", isActive: true });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get("/positions");
      const data = res.data;
      setPositions(data);

      // Detectar ?edit=id
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        const position = data.find((p: any) => p.id === Number(editId));
        if (position) openEdit(position);
        window.history.replaceState({}, "", "/admin/positions");
      }
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", description: "", isActive: true });
    setModal(true);
  }

  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", isActive: p.isActive });
    setModal(true);
  }

  async function save() {
    if (!form.name) return alert("El nombre es obligatorio");
    setSaving(true);
    try {
      if (editing) await api.patch(`/positions/${editing.id}`, form);
      else         await api.post("/positions", form);
      setModal(false);
      setLoading(true);
      await load();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`¿Eliminar el cargo "${name}"?`)) return;
    await api.delete(`/positions/${id}`);
    setPositions(prev => prev.filter(p => p.id !== id));
  }

  const shown   = positions.slice(0, visible);
  const hasMore = visible < positions.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Cargos</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Gestión de cargos de la organización</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: `linear-gradient(135deg,${VIOLET},#b48aff)`, color: "#fff", boxShadow: "0 4px 16px rgba(155,109,255,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(155,109,255,0.50)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(155,109,255,0.35)")}>
          <Plus size={15} />
          <span className="hidden sm:inline">Nuevo cargo</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(155,109,255,0.2)`, borderTopColor: VIOLET }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando cargos...</p>
          </div>
        </div>
      ) : positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(155,109,255,0.12)" }}>
            <Award size={26} color={VIOLET} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay cargos registrados</p>
          <button onClick={openNew} className="text-sm font-medium" style={{ color: VIOLET }}>
            Crear el primer cargo →
          </button>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden" style={glass(VIOLET)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${VIOLET},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Cargo","Descripción","Estado","Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p, i) => (
                    <tr key={p.id}
                      style={{
                        borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        opacity: p.isActive ? 1 : 0.50,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(155,109,255,0.15)" }}>
                            <Award size={13} color={VIOLET} />
                          </div>
                          <span className="font-bold" style={{ color: "#f1f5f9" }}>{p.name}</span>
                        </div>
                      </td>

                      {/* Descripción */}
                      <td className="px-4 py-3 max-w-xs">
                        <span className="truncate block text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                          {p.description || "—"}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={p.isActive
                            ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {p.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Link href={`/admin/positions/${p.id}`}
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
                <ChevronDown size={15} /> Cargar más ({positions.length - visible} restantes)
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
            style={{ ...glass(editing ? ORANGE : VIOLET), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: editing
                ? `linear-gradient(90deg,${ORANGE},#f5a35a,transparent)`
                : `linear-gradient(90deg,${VIOLET},#b48aff,transparent)` }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: editing ? "rgba(232,114,42,0.12)" : "rgba(155,109,255,0.15)" }}>
                  <Award size={15} color={editing ? ORANGE : VIOLET} />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>
                    {editing ? "Editar cargo" : "Nuevo cargo"}
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

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.40)" }}>
                  <Award size={11} /> Nombre <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input style={IS} placeholder="ej: Presidenta"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={fi} onBlur={fo} />
              </div>

              {/* Descripción */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.40)" }}>
                  <AlignLeft size={11} /> Descripción
                </label>
                <textarea rows={2} placeholder="Descripción del cargo"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  onFocus={fi} onBlur={fo}
                  style={{ ...IS, resize: "none" }} />
              </div>

              {/* Toggle activo */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative w-9 h-5 flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                  <div className="w-9 h-5 rounded-full transition-all duration-200"
                    style={{ background: form.isActive ? VIOLET : "rgba(255,255,255,0.12)" }}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-200"
                      style={{ left: form.isActive ? "19px" : "3px", top: "3px" }} />
                  </div>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Cargo activo</span>
              </label>

              {/* Botones */}
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
                    background: saving ? "rgba(155,109,255,0.35)" : `linear-gradient(135deg,${VIOLET},#b48aff)`,
                    color: "#fff",
                    boxShadow: saving ? "none" : "0 4px 16px rgba(155,109,255,0.35)",
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