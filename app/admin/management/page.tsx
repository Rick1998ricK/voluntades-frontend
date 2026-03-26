"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  Plus, Users2, Trash2, CheckSquare, Square, Award, AlignLeft, Save,
  X, ChevronDown,
} from "lucide-react";

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
  colorScheme: "dark" as const,
};
const fi = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(46,111,168,0.60)"; e.target.style.boxShadow="0 0 0 3px rgba(46,111,168,0.12)"; e.target.style.background="rgba(255,255,255,0.07)"; };
const fo = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(255,255,255,0.10)"; e.target.style.boxShadow="none"; e.target.style.background="rgba(255,255,255,0.05)"; };

function Label({ icon, children, required }: { icon?: React.ReactNode; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
      style={{ color: "rgba(255,255,255,0.40)" }}>
      {icon} {children} {required && <span style={{ color: "#f87171" }}>*</span>}
    </label>
  );
}

export default function ManagementPage() {
  const { user }   = useAuth();
  const isReadOnly = user?.role === "admin";

  const [members, setMembers]       = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [periods, setPeriods]       = useState<any[]>([]);
  const [positions, setPositions]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visible, setVisible]       = useState(PAGE_SIZE);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState<any>(null);
  const [saving, setSaving]         = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [form, setForm] = useState({
    volunteerId: "", periodId: "", positionIds: [] as number[], isActive: true, notes: "",
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [membersRes, volRes, periodsRes, posRes] = await Promise.all([
        api.get("/management"),
        api.get("/volunteers"),
        api.get("/periods"),
        api.get("/positions"),
      ]);
      setMembers(membersRes.data);
      setVolunteers(volRes.data.filter((v: any) => v.status === "activo"));
      setPeriods(periodsRes.data);
      setPositions(posRes.data.filter((p: any) => p.isActive));
    } finally { setLoading(false); }
  }

  function openNew() {
    setEditing(null);
    setForm({ volunteerId: "", periodId: "", positionIds: [], isActive: true, notes: "" });
    setModal(true);
  }

  function openEdit(m: any) {
    setEditing(m);
    setForm({
      volunteerId: String(m.volunteer?.id ?? ""),
      periodId: String(m.period?.id ?? ""),
      positionIds: m.positions?.map((p: any) => p.id) ?? [],
      isActive: m.isActive,
      notes: m.notes ?? "",
    });
    setModal(true);
  }

  const togglePosition = (id: number) =>
    setForm(prev => ({
      ...prev,
      positionIds: prev.positionIds.includes(id) ? prev.positionIds.filter(p => p !== id) : [...prev.positionIds, id],
    }));

  async function save() {
    if (!form.volunteerId) return alert("Selecciona un voluntario");
    setSaving(true);
    try {
      const payload = {
        volunteerId: Number(form.volunteerId),
        periodId:    form.periodId ? Number(form.periodId) : null,
        positionIds: form.positionIds,
        isActive:    form.isActive,
        notes:       form.notes,
      };
      if (editing) await api.patch(`/management/${editing.id}`, payload);
      else         await api.post("/management", payload);
      setModal(false);
      setLoading(true);
      await loadAll();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  }

  async function remove(id: number, name: string) {
    if (!confirm(`¿Quitar a "${name}" de gestión?`)) return;
    await api.delete(`/management/${id}`);
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  const filtered = filterPeriod ? members.filter(m => String(m.period?.id) === filterPeriod) : members;
  const shown    = filtered.slice(0, visible);
  const hasMore  = visible < filtered.length;

  const today = new Date().toISOString().split("T")[0];
  const activePeriods = periods.filter(p => p.startDate <= today && today <= p.endDate);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Gestión</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            {isReadOnly ? "Vista del equipo de gestión (solo lectura)" : "Equipo de gestión de Voluntades+"}
          </p>
        </div>

        {/* Agregar miembro — solo no-admin */}
        {!isReadOnly && (
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: `linear-gradient(135deg,${VIOLET},#b48aff)`, color: "#fff", boxShadow: "0 4px 16px rgba(155,109,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(155,109,255,0.50)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(155,109,255,0.35)")}>
            <Plus size={15} />
            <span className="hidden sm:inline">Agregar miembro</span>
            <span className="sm:hidden">Agregar</span>
          </button>
        )}
      </div>

      {/* FILTRO PERIODO */}
      <div className="flex items-center gap-2 flex-wrap">
        <select style={IS as any} className="w-auto"
          value={filterPeriod} onChange={e => { setFilterPeriod(e.target.value); setVisible(PAGE_SIZE); }}>
          <option value="" style={{ background: "#0d1424" }}>Todos los periodos</option>
          {periods.map(p => <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>)}
        </select>
        {filterPeriod && (
          <button onClick={() => { setFilterPeriod(""); setVisible(PAGE_SIZE); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200"
            style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}>
            <X size={11} /> Limpiar
          </button>
        )}
        <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{filtered.length} miembro(s)</span>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(155,109,255,0.2)`, borderTopColor: VIOLET }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando gestión...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(155,109,255,0.12)" }}>
            <Users2 size={26} color={VIOLET} />
          </div>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>No hay miembros de gestión</p>
          {!isReadOnly && (
            <button onClick={openNew} className="text-sm font-medium" style={{ color: VIOLET }}>
              Agregar el primer miembro →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden" style={glass(VIOLET)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${VIOLET},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Voluntario","Módulo","Periodo","Cargos","Estado","Notas", ...(!isReadOnly ? ["Acciones"] : [])].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m, i) => (
                    <tr key={m.id}
                      style={{
                        borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        opacity: m.isActive ? 1 : 0.50,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {m.volunteer?.photoUrl ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL}/${m.volunteer.photoUrl}`}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              style={{ border: `1px solid ${VIOLET}44` }} alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(155,109,255,0.18)", color: VIOLET, border: `1px solid ${VIOLET}33` }}>
                              {(m.volunteer?.user?.name ?? m.volunteer?.fullName ?? "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold whitespace-nowrap" style={{ color: "#f1f5f9" }}>
                            {m.volunteer?.user?.name ?? m.volunteer?.fullName ?? "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {m.volunteer?.module?.name ?? <span style={{ color: "rgba(255,255,255,0.20)" }}>Sin módulo</span>}
                      </td>

                      <td className="px-4 py-3">
                        {m.period ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                            {m.period.name}
                          </span>
                        ) : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.positions?.length > 0
                            ? m.positions.map((p: any) => (
                                <span key={p.id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: "rgba(155,109,255,0.15)", color: VIOLET }}>
                                  {p.name}
                                </span>
                              ))
                            : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sin cargo</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={m.isActive
                            ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                          {m.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="text-xs truncate block italic" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {m.notes || "—"}
                        </span>
                      </td>

                      {/* Acciones — solo no-admin */}
                      {!isReadOnly && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => openEdit(m)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                              Editar
                            </button>
                            <button onClick={() => remove(m.id, m.volunteer?.user?.name ?? "?")}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                              <Trash2 size={11} /> Quitar
                            </button>
                          </div>
                        </td>
                      )}
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
        </>
      )}

      {/* ═══ MODAL (solo visible para no-admin) ═══ */}
      {modal && !isReadOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setModal(false)}>
          <div className="w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ ...glass(editing ? ORANGE : VIOLET), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: editing
                ? `linear-gradient(90deg,${ORANGE},#f5a35a,transparent)`
                : `linear-gradient(90deg,${VIOLET},#b48aff,transparent)` }} />

            <div className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,13,20,0.95)", backdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: editing ? "rgba(232,114,42,0.12)" : "rgba(155,109,255,0.15)" }}>
                  <Users2 size={15} color={editing ? ORANGE : VIOLET} />
                </div>
                <div>
                  <h2 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>
                    {editing ? "Editar miembro de gestión" : "Agregar a gestión"}
                  </h2>
                  {editing && <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{editing.volunteer?.user?.name}</p>}
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

            <div className="p-6 space-y-5">
              <div>
                <Label required>Voluntario</Label>
                <select style={IS} value={form.volunteerId}
                  onChange={e => setForm({ ...form, volunteerId: e.target.value })}
                  disabled={!!editing} onFocus={fi} onBlur={fo}>
                  <option value="" style={{ background: "#0d1424" }}>Seleccionar voluntario...</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id} style={{ background: "#0d1424" }}>
                      {v.user?.name ?? v.fullName} {v.module?.name ? `— ${v.module.name}` : "— Sin módulo"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Periodo</Label>
                {activePeriods.length === 0 ? (
                  <p className="text-xs p-3 rounded-xl" style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}>
                    No hay periodos activos. Crea uno primero.
                  </p>
                ) : (
                  <select style={IS} value={form.periodId}
                    onChange={e => setForm({ ...form, periodId: e.target.value })} onFocus={fi} onBlur={fo}>
                    <option value="" style={{ background: "#0d1424" }}>Sin periodo</option>
                    {activePeriods.map(p => (
                      <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label icon={<Award size={11} />}>Cargos</Label>
                {positions.length === 0 ? (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No hay cargos disponibles.</p>
                ) : (
                  <div className="rounded-xl max-h-40 overflow-y-auto space-y-1 p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {positions.map(p => (
                      <label key={p.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-150"
                        style={{ background: form.positionIds.includes(p.id) ? "rgba(155,109,255,0.12)" : "transparent" }}
                        onMouseEnter={e => { if (!form.positionIds.includes(p.id)) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (!form.positionIds.includes(p.id)) e.currentTarget.style.background = "transparent"; }}>
                        {form.positionIds.includes(p.id)
                          ? <CheckSquare size={15} color={VIOLET} />
                          : <Square size={15} color="rgba(255,255,255,0.30)" />}
                        <span className="text-sm" style={{ color: form.positionIds.includes(p.id) ? "#f1f5f9" : "rgba(255,255,255,0.60)" }}>
                          {p.name}
                        </span>
                        {p.description && <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>— {p.description}</span>}
                        <input type="checkbox" className="sr-only" checked={form.positionIds.includes(p.id)} onChange={() => togglePosition(p.id)} />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label icon={<AlignLeft size={11} />}>Notas</Label>
                <textarea rows={2} placeholder="Observaciones opcionales..."
                  style={{ ...IS, resize: "none" }} value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} onFocus={fi} onBlur={fo} />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative w-9 h-5 flex-shrink-0" onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}>
                  <div className="w-9 h-5 rounded-full transition-all duration-200"
                    style={{ background: form.isActive ? VIOLET : "rgba(255,255,255,0.12)" }}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-200"
                      style={{ left: form.isActive ? "19px" : "3px", top: "3px" }} />
                  </div>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>Miembro activo en gestión</span>
              </label>

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
                  {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <Save size={15} />}
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