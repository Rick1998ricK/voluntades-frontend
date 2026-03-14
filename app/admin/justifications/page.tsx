"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { FileCheck, ChevronDown, X, CheckCircle2, Clock, XCircle, ExternalLink, MessageSquare, Eye, RotateCcw } from "lucide-react";

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

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#facc15", bg: "rgba(250,204,21,0.14)"  },
  aprobado:  { label: "Aprobado",  color: "#4ade80", bg: "rgba(74,222,128,0.14)"  },
  rechazado: { label: "Rechazado", color: "#f87171", bg: "rgba(248,113,113,0.14)" },
};

const ATT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  FALTA: { label: "Falta", color: "#f87171", bg: "rgba(248,113,113,0.14)" },
  TARDE: { label: "Tarde", color: "#facc15", bg: "rgba(250,204,21,0.14)"  },
};

const TABS = ["", "pendiente", "aprobado", "rechazado"] as const;
const TAB_LABELS: Record<string, string> = { "": "Todas", pendiente: "Pendientes", aprobado: "Aprobadas", rechazado: "Rechazadas" };
const TAB_COLORS: Record<string, string> = { "": BLUE_L, pendiente: "#facc15", aprobado: "#4ade80", rechazado: "#f87171" };

export default function JustificationsPage() {
  const [items, setItems]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("pendiente");
  const [selected, setSelected]     = useState<any>(null);
  const [detail, setDetail]         = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving]         = useState(false);
  const [reverting, setReverting]   = useState(false);
  const [visible, setVisible]       = useState(PAGE_SIZE);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    setVisible(PAGE_SIZE);
    try {
      const res = await api.get("/justifications", { params: { status: filter || undefined } });
      setItems([...res.data].sort((a, b) => b.id - a.id));
    } finally { setLoading(false); }
  }

  async function review(action: "aprobado" | "rechazado") {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/justifications/${selected.id}/review`, { action, reviewNote });
      setSelected(null);
      setReviewNote("");
      load();
    } catch { alert("Error al revisar"); }
    finally { setSaving(false); }
  }

  async function revert(id: number) {
    if (!confirm("¿Revertir esta justificación a pendiente?")) return;
    setReverting(true);
    try {
      await api.patch(`/justifications/${id}/revert`);
      setDetail(null);
      load();
    } catch { alert("Error al revertir"); }
    finally { setReverting(false); }
  }

  const shown   = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Justificaciones</h1>
        <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Revisión de faltas y tardanzas justificadas</p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(s => {
          const active = filter === s;
          const color  = TAB_COLORS[s];
          return (
            <button key={s} onClick={() => setFilter(s)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: active ? `${color}20` : "rgba(255,255,255,0.05)",
                color:      active ? color         : "rgba(255,255,255,0.45)",
                border:     active ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.08)",
                boxShadow:  active ? `0 0 0 2px ${color}18` : "none",
              }}>
              {TAB_LABELS[s]}
            </button>
          );
        })}
        {!loading && (
          <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{items.length} registro(s)</span>
        )}
      </div>

      {/* TABLA */}
      <div className="relative overflow-hidden" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Voluntario","Sesión","Módulo","Tipo","Motivo","Archivo","Estado","Fecha","Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center p-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full mx-auto animate-spin"
                      style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando...</p>
                  </div>
                </td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-12">
                  <div className="flex flex-col items-center gap-3">
                    <FileCheck size={28} color="rgba(46,111,168,0.25)" />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay justificaciones</p>
                  </div>
                </td></tr>
              ) : shown.map((j, i) => {
                const attStatus = (j.attendance?.status ?? "").toUpperCase();
                const att = ATT_STYLES[attStatus];
                const st  = STATUS_STYLES[j.status] ?? { label: j.status, color: "rgba(255,255,255,0.50)", bg: "rgba(255,255,255,0.07)" };

                return (
                  <tr key={j.id}
                    style={{ borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "#f1f5f9" }}>
                      {j.volunteer?.user?.name ?? j.volunteer?.fullName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {j.attendance?.session?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>
                      {j.volunteer?.module?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {att ? (
                        <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: att.bg, color: att.color }}>
                          {attStatus === "FALTA" ? <XCircle size={10} /> : <Clock size={10} />}
                          {att.label}
                        </span>
                      ) : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="text-xs line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>{j.reason}</span>
                    </td>
                    <td className="px-4 py-3">
                      {j.fileUrl ? (
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}/${j.fileUrl}`} target="_blank"
                          className="flex items-center gap-1 text-xs font-medium transition-colors duration-200"
                          style={{ color: BLUE_L }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                          onMouseLeave={e => (e.currentTarget.style.color = BLUE_L)}>
                          <ExternalLink size={11} /> Ver archivo
                        </a>
                      ) : <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Sin archivo</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                      {new Date(j.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => setDetail(j)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                          <Eye size={11} /> Ver
                        </button>
                        {j.status === "pendiente" && (
                          <button onClick={() => { setSelected(j); setReviewNote(""); }}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap"
                            style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                            <FileCheck size={11} /> Revisar
                          </button>
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
            <ChevronDown size={15} /> Cargar más ({items.length - visible} restantes)
          </button>
        </div>
      )}

      {/* ═══ MODAL DETALLE ═══ */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setDetail(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(BLUE_L), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE_L},transparent)` }} />

            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,144,196,0.15)" }}>
                  <Eye size={15} color={BLUE_L} />
                </div>
                <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Detalle de justificación</span>
              </div>
              <button onClick={() => setDetail(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl space-y-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { label: "Voluntario", value: detail.volunteer?.user?.name ?? detail.volunteer?.fullName },
                  { label: "Sesión",     value: detail.attendance?.session?.name },
                  { label: "Módulo",     value: detail.volunteer?.module?.name },
                  { label: "Tipo",       value: (detail.attendance?.status ?? "").toUpperCase() === "FALTA" ? "Falta" : "Tardanza" },
                  { label: "Motivo",     value: detail.reason },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-2 text-sm">
                    <span className="text-xs mt-0.5 min-w-[80px]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}:</span>
                    <span style={{ color: "#f1f5f9" }}>{value ?? "—"}</span>
                  </div>
                ))}
                {detail.fileUrl && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/${detail.fileUrl}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs font-medium mt-1"
                    style={{ color: BLUE_L }}>
                    <ExternalLink size={11} /> Ver archivo adjunto
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl space-y-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Estado:</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: STATUS_STYLES[detail.status]?.bg, color: STATUS_STYLES[detail.status]?.color }}>
                    {STATUS_STYLES[detail.status]?.label ?? detail.status}
                  </span>
                </div>
                {detail.status !== "pendiente" && (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-xs mt-0.5 min-w-[80px]" style={{ color: "rgba(255,255,255,0.35)" }}>Revisado por:</span>
                      <span style={{ color: "#f1f5f9" }}>{detail.reviewedBy?.name ?? "—"}</span>
                    </div>
                    {detail.reviewNote && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-xs mt-0.5 min-w-[80px]" style={{ color: "rgba(255,255,255,0.35)" }}>Nota:</span>
                        <span className="italic" style={{ color: "rgba(255,255,255,0.60)" }}>{detail.reviewNote}</span>
                      </div>
                    )}
                    {detail.reviewedAt && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-xs mt-0.5 min-w-[80px]" style={{ color: "rgba(255,255,255,0.35)" }}>Fecha rev.:</span>
                        <span style={{ color: "rgba(255,255,255,0.50)" }}>{new Date(detail.reviewedAt).toLocaleDateString("es-PE")}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setDetail(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                  Cerrar
                </button>
                {detail.status !== "pendiente" && (
                  <button onClick={() => revert(detail.id)} disabled={reverting}
                    className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: "rgba(232,114,42,0.15)", color: ORANGE, border: `1px solid rgba(232,114,42,0.25)` }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.28)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.15)")}>
                    {reverting
                      ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(232,114,42,0.3)", borderTopColor: ORANGE }} />
                      : <RotateCcw size={14} />}
                    Revertir a pendiente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL REVISAR ═══ */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(BLUE), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />

            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(46,111,168,0.15)" }}>
                  <FileCheck size={15} color={BLUE_L} />
                </div>
                <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Revisar justificación</span>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl space-y-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {[
                  { label: "Voluntario", value: selected.volunteer?.user?.name ?? selected.volunteer?.fullName },
                  { label: "Sesión",     value: selected.attendance?.session?.name },
                  { label: "Tipo",       value: selected.attendance?.status },
                  { label: "Motivo",     value: selected.reason },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-2 text-sm">
                    <span className="text-xs mt-0.5 min-w-[70px]" style={{ color: "rgba(255,255,255,0.35)" }}>{label}:</span>
                    <span style={{ color: "#f1f5f9" }}>{value ?? "—"}</span>
                  </div>
                ))}
                {selected.fileUrl && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/${selected.fileUrl}`} target="_blank"
                    className="flex items-center gap-1.5 text-xs font-medium mt-1"
                    style={{ color: BLUE_L }}>
                    <ExternalLink size={11} /> Ver archivo adjunto
                  </a>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.40)" }}>
                  <MessageSquare size={11} /> Nota de revisión
                  <span className="normal-case ml-1" style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>(opcional)</span>
                </label>
                <textarea rows={3} placeholder="Ej: Documento verificado..."
                  style={{ ...IS, resize: "none" }} value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)} onFocus={fi} onBlur={fo} />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                  Cancelar
                </button>
                <button onClick={() => review("rechazado")} disabled={saving}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.28)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}>
                  <XCircle size={14} /> Rechazar
                </button>
                <button onClick={() => review("aprobado")} disabled={saving}
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.28)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.15)")}>
                  {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(74,222,128,0.3)", borderTopColor: "#4ade80" }} /> : <CheckCircle2 size={14} />}
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}