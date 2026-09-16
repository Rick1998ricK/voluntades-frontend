"use client";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Star, Plus, X, ChevronDown, Users, ClipboardList, Search, MessageSquare } from "lucide-react";

// ── Colores del sistema ──────────────────────────────────────────────
const BLUE       = "#2e6fa8";
const BLUE_L     = "#4a9fd4";
const CARD_BG    = "rgba(255,255,255,0.04)";
const BORDER     = "rgba(255,255,255,0.08)";

const glass = (accent = BLUE) => ({
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
});

const IS: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
  color: "#f1f5f9", outline: "none", transition: "border-color .2s",
};

// ── Tipos de evaluación ───────────────────────────────────────────────
const EVAL_TYPES = [
  { value: "voluntario",  label: "Voluntario / Xpress", color: "#4ade80" },
  { value: "coordinador", label: "Coordinador",          color: "#60a5fa" },
  { value: "gestion",     label: "Gestión",              color: "#9b6dff" },
];

const SCALE: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Regular",    color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  2: { label: "Bueno",      color: "#facc15", bg: "rgba(250,204,21,0.12)"  },
  3: { label: "Excelente",  color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
};

const VARS_VOLUNTARIO = [
  { key: "participacionReunion", label: "Participó en reunión"     },
  { key: "asistenciaDomingo",    label: "Asistencia el domingo"    },
  { key: "cumplioMateriales",    label: "Cumplió con materiales"   },
  { key: "proactividad",         label: "Proactividad en sesión"   },
];

const VARS_COORD_GESTION = [
  { key: "cumplimientoObjetivos", label: "Cumplimiento de objetivos"              },
  { key: "integracionEquipo",     label: "Integración del equipo"                 },
  { key: "comunicacionAsertiva",  label: "Comunicación asertiva"                  },
  { key: "participacionExtra",    label: "Participación en actividades extra"      },
];

function ScaleBadge({ value }: { value: number }) {
  if (!value) return <span style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
  const s = SCALE[value];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ScaleSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3].map(v => (
        <button key={v} onClick={() => onChange(v)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
          style={{
            background: value === v ? SCALE[v].bg : "rgba(255,255,255,0.04)",
            color: value === v ? SCALE[v].color : "rgba(255,255,255,0.40)",
            border: value === v ? `1px solid ${SCALE[v].color}40` : "1px solid rgba(255,255,255,0.08)",
          }}>
          {SCALE[v].label}
        </button>
      ))}
    </div>
  );
}

// ── Modal nueva evaluación ────────────────────────────────────────────
function NewEvaluationModal({ onClose, onSaved, periods }: { onClose: () => void; onSaved: () => void; periods: any[] }) {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<any>(null);
  const [type, setType]             = useState("voluntario");
  const [periodId, setPeriodId]     = useState("");
  const [weekDate, setWeekDate]     = useState(new Date().toISOString().split("T")[0]);
  const [observaciones, setObs]     = useState("");
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<Record<string, number>>({});

  useEffect(() => {
    api.get("/volunteers?status=activo").then(r => setVolunteers(r.data)).catch(() => {});
  }, []);

  const vars = type === "voluntario" ? VARS_VOLUNTARIO : VARS_COORD_GESTION;

  const filtered = volunteers.filter((v: any) =>
    v.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    v.dni?.includes(search)
  );

  async function handleSave() {
    if (!selected) return alert("Selecciona un voluntario");
    if (vars.some(v => !form[v.key])) return alert("Completa todos los campos de evaluación");
    setSaving(true);
    try {
      await api.post("/evaluations", {
        volunteerId: selected.id,
        type, periodId: periodId || null,
        weekDate, observaciones, ...form,
      });
      onSaved();
    } catch { alert("Error al guardar"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.10)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: BORDER }}>
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color: "#f1f5f9" }}>
            <Star size={16} color={BLUE_L} /> Nueva evaluación
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} color="rgba(255,255,255,0.50)" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tipo de evaluación */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>
              Tipo de evaluación
            </p>
            <div className="flex gap-2">
              {EVAL_TYPES.map(t => (
                <button key={t.value} onClick={() => { setType(t.value); setForm({}); }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                  style={{
                    background: type === t.value ? `${t.color}18` : "rgba(255,255,255,0.04)",
                    color: type === t.value ? t.color : "rgba(255,255,255,0.40)",
                    border: type === t.value ? `1px solid ${t.color}40` : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buscar voluntario */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>
              Voluntario a evaluar
            </p>
            {selected ? (
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: `${BLUE}18`, border: `1px solid ${BLUE}40` }}>
                <span className="text-sm font-semibold" style={{ color: BLUE_L }}>{selected.fullName}</span>
                <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
                  <input style={{ ...IS, paddingLeft: 32 }} placeholder="Buscar por nombre o DNI..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {search && (
                  <div className="rounded-xl overflow-hidden max-h-40 overflow-y-auto"
                    style={{ background: "#0a1120", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {filtered.slice(0, 8).map((v: any) => (
                      <button key={v.id} onClick={() => { setSelected(v); setSearch(""); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/05 transition-colors"
                        style={{ color: "#f1f5f9", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {v.fullName} <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>— {v.dni}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-center py-3 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Período y fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>Período</p>
              <select style={IS} value={periodId} onChange={e => setPeriodId(e.target.value)}>
                <option value="" style={{ background: "#0d1424" }}>Sin período</option>
                {periods.map((p: any) => (
                  <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>Semana evaluada</p>
              <input type="date" style={IS} value={weekDate} onChange={e => setWeekDate(e.target.value)} />
            </div>
          </div>

          {/* Variables */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>
              Variables de evaluación
            </p>
            <div className="space-y-4">
              {vars.map(v => (
                <div key={v.key}>
                  <p className="text-xs mb-2 font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>{v.label}</p>
                  <ScaleSelector value={form[v.key]} onChange={val => setForm(f => ({ ...f, [v.key]: val }))} />
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>
              Observaciones (opcional)
            </p>
            <textarea style={{ ...IS, minHeight: 80, resize: "vertical" }}
              placeholder="Notas adicionales sobre el desempeño..."
              value={observaciones} onChange={e => setObs(e.target.value)} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando..." : "Guardar evaluación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────
export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [periods, setPeriods]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [filterType, setFilterType]   = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [search, setSearch]           = useState("");

  async function fetchAll() {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType)   params.type     = filterType;
      if (filterPeriod) params.periodId = filterPeriod;
      const [evRes, pRes] = await Promise.all([
        api.get("/evaluations", { params }),
        api.get("/periods"),
      ]);
      setEvaluations(evRes.data);
      setPeriods(pRes.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, [filterType, filterPeriod]);

  const filtered = evaluations.filter((e: any) =>
    !search || e.volunteer?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const typeInfo = (type: string) => EVAL_TYPES.find(t => t.value === type) ?? { label: type, color: "#fff" };

  const vars = (e: any) => e.type === "voluntario" ? VARS_VOLUNTARIO : VARS_COORD_GESTION;
  const avgScore = (e: any) => {
  const v = e.type === "voluntario" ? VARS_VOLUNTARIO : VARS_COORD_GESTION;
  const vals = v.map((vr: any) => e[vr.key]).filter((x: any) => x != null);
  if (!vals.length) return null;
  return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1);
};

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6" style={{ background: "#070d14" }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.5px" }}>
            Evaluaciones
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Seguimiento del desempeño de voluntarios, coordinadores y gestión
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff" }}>
          <Plus size={15} /> Nueva evaluación
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
          <input style={{ ...IS, width: 220, paddingLeft: 32 }} placeholder="Buscar voluntario..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...IS, width: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="" style={{ background: "#0d1424" }}>Todos los tipos</option>
          {EVAL_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: "#0d1424" }}>{t.label}</option>)}
        </select>
        <select style={{ ...IS, width: 160 }} value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
          <option value="" style={{ background: "#0d1424" }}>Todos los períodos</option>
          {periods.map((p: any) => <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total evaluaciones", value: evaluations.length,                                              color: BLUE_L   },
          { label: "Voluntarios",         value: evaluations.filter(e => e.type === "voluntario").length,        color: "#4ade80" },
          { label: "Coordinadores",       value: evaluations.filter(e => e.type === "coordinador").length,       color: "#60a5fa" },
          { label: "Gestión",             value: evaluations.filter(e => e.type === "gestion").length,           color: "#9b6dff" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={glass()}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={36} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p style={{ color: "rgba(255,255,255,0.30)" }}>No hay evaluaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e: any) => {
            const ti = typeInfo(e.type);
            const v  = vars(e);
            return (
              <div key={e.id} className="p-4 rounded-2xl" style={glass()}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {e.volunteer?.photoUrl
                      ? <img src={e.volunteer.photoUrl?.startsWith("http") ? e.volunteer.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${e.volunteer.photoUrl}`}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          style={{ border: `1px solid ${ti.color}30` }} alt="" />
                      : <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{ background: `${ti.color}18`, color: ti.color }}>
                          {e.volunteer?.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                    }
                    <div>
                      <Link href={`/admin/volunteers/${e.volunteer?.id}`}
                        className="text-sm font-semibold hover:underline" style={{ color: "#f1f5f9" }}>
                        {e.volunteer?.fullName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${ti.color}18`, color: ti.color }}>
                          {ti.label}
                        </span>
                        {(() => {
                            const avg = avgScore(e);
                            if (!avg) return null;
                            const n = parseFloat(avg);
                            const s = n >= 2.5 ? SCALE[3] : n >= 1.5 ? SCALE[2] : SCALE[1];
                            return (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                                style={{ background: s.bg, color: s.color }}>
                                <Star size={11} fill={s.color} /> {avg} / 3 — {s.label}
                                </span>
                            );
                            })()}
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {e.weekDate ? `Semana del ${e.weekDate}` : "Sin fecha"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variables */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {v.map((vr: any) => (
                    <div key={vr.key} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{vr.label}</p>
                      <ScaleBadge value={e[vr.key]} />
                    </div>
                  ))}
                </div>

                {/* Observaciones */}
                {e.observaciones && (
                  <p className="text-xs mt-3 px-3 py-2 rounded-xl italic"
                    style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)" }}>
                    <MessageSquare size={11} className="inline mr-1" /> {e.observaciones}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NewEvaluationModal
          periods={periods}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </div>
  );
}