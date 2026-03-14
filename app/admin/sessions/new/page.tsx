"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, AlignLeft, Calendar, Layers, Save, CheckSquare, Square } from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";

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

function Label({ icon, children, required, sub }: { icon?: React.ReactNode; children: React.ReactNode; required?: boolean; sub?: string }) {
  return (
    <div className="mb-2">
      <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.40)" }}>
        {icon} {children} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {sub && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</p>}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden p-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "16px",
      }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/** Timeline visual de horarios */
function TimelinePreview({ start, tolerance, end }: { start: string; tolerance: string; end: string }) {
  if (!start || !tolerance || !end) return null;
  return (
    <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>{start}</span>
        <div className="flex-1 h-1 rounded-full" style={{ background: "linear-gradient(90deg,rgba(74,222,128,0.40),rgba(250,204,21,0.40))" }} />
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(250,204,21,0.14)", color: "#facc15" }}>{tolerance}</span>
        <div className="flex-1 h-1 rounded-full" style={{ background: "linear-gradient(90deg,rgba(250,204,21,0.40),rgba(248,113,113,0.40))" }} />
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}>{end}</span>
      </div>
      <div className="flex justify-between mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
        <span>✓ Puntual</span>
        <span>⏰ Tarde</span>
        <span>🔒 Cierre</span>
      </div>
    </div>
  );
}

interface Module { id: number; name: string; sede: { id: number; name: string } }

export default function NewSessionPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [mode, setMode] = useState<"single" | "multiple" | "all">("single");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", date: "",
    startTime: "", toleranceTime: "", endTime: "",
    moduleId: "", moduleIds: [] as number[],
  });

  useEffect(() => { api.get("/modules").then(res => setModules(res.data)); }, []);

  const toggleModule = (id: number) =>
    setForm(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(id) ? prev.moduleIds.filter(m => m !== id) : [...prev.moduleIds, id],
    }));

  const submit = async (e: any) => {
    e.preventDefault();

    // Validaciones
  if (!form.name) return alert("El nombre es obligatorio");
  if (!form.date) return alert("La fecha es obligatoria");
  if (!form.startTime) return alert("La hora de inicio es obligatoria");
  if (!form.toleranceTime) return alert("La hora de tolerancia es obligatoria");
  if (!form.endTime) return alert("La hora de cierre es obligatoria");
  if (mode === "single" && !form.moduleId) return alert("Selecciona un módulo");
  if (mode === "multiple" && form.moduleIds.length === 0) return alert("Selecciona al menos un módulo");


    setSaving(true);
    try {
      const payload: any = { name: form.name, description: form.description, date: form.date, startTime: form.startTime, toleranceTime: form.toleranceTime, endTime: form.endTime };
      if (mode === "all")      payload.allModules = true;
      if (mode === "single")   payload.moduleId   = Number(form.moduleId);
      if (mode === "multiple") payload.moduleIds  = form.moduleIds;
      await api.post("/sessions", payload);
      router.push("/admin/sessions");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <div className="max-w-2xl space-y-5">

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
          style={{ color: "rgba(255,255,255,0.40)" }}
          onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.25)" }}>
            <CalendarDays size={18} color={BLUE_L} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Crear Sesión</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Nueva sesión de asistencia</p>
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="relative overflow-hidden p-6 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${BLUE}33`, borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />

          {/* Nombre */}
          <div>
            <Label icon={<CalendarDays size={11} />} required>Nombre de la sesión</Label>
            <input style={IS} placeholder="Ej: Sesión 15 de marzo..." value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} onFocus={fi} onBlur={fo} required />
          </div>

          {/* Descripción */}
          <div>
            <Label icon={<AlignLeft size={11} />} sub="Opcional">Descripción</Label>
            <textarea rows={2} placeholder="Descripción de la sesión..."
              style={{ ...IS, resize: "none" }} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} onFocus={fi} onBlur={fo} />
          </div>

          {/* Fecha */}
          <div>
            <Label icon={<Calendar size={11} />} required>Fecha</Label>
            <input type="date" style={IS} value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} onFocus={fi} onBlur={fo} required />
          </div>

          {/* Horario */}
          <div>
            <Label>Horario</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "startTime",     label: "Hora inicio",     color: "#4ade80", bg: "rgba(74,222,128,0.10)",  desc: "Asistencia puntual" },
                { key: "toleranceTime", label: "Tolerancia",      color: "#facc15", bg: "rgba(250,204,21,0.10)",  desc: "Hasta aquí = tarde" },
                { key: "endTime",       label: "Hora cierre",     color: "#f87171", bg: "rgba(248,113,113,0.10)", desc: "Cierre de sesión"   },
              ].map(({ key, label, color, bg, desc }) => (
                <div key={key}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color }}>{label}</p>
                  <input type="time" required
                    style={{ ...IS, borderColor: `${color}33`, background: bg, colorScheme: "dark" as const }}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    onFocus={fi} onBlur={fo} />
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.30)" }}>{desc}</p>
                </div>
              ))}
            </div>
            <TimelinePreview start={form.startTime} tolerance={form.toleranceTime} end={form.endTime} />
          </div>

          {/* Modo módulos */}
          <div>
            <Label icon={<Layers size={11} />} required>Aplicar a</Label>
            <div className="flex gap-2">
              {[{ value: "single", label: "Un módulo" }, { value: "multiple", label: "Varios módulos" }, { value: "all", label: "Todos" }].map(opt => (
                <button key={opt.value} type="button" onClick={() => setMode(opt.value as any)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: mode === opt.value ? "rgba(46,111,168,0.20)" : "rgba(255,255,255,0.05)",
                    color:      mode === opt.value ? BLUE_L : "rgba(255,255,255,0.50)",
                    border:     mode === opt.value ? `1px solid ${BLUE}44` : "1px solid rgba(255,255,255,0.09)",
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {mode === "single" && (
              <select required className="mt-3" style={{ ...IS, colorScheme: "dark" as const }}
                value={form.moduleId} onChange={e => setForm({ ...form, moduleId: e.target.value })}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar módulo</option>
                {modules.map(m => <option key={m.id} value={m.id} style={{ background: "#0d1424" }}>{m.name} — {m.sede.name}</option>)}
              </select>
            )}

            {mode === "multiple" && (
              <div className="mt-3 rounded-xl max-h-48 overflow-y-auto space-y-1 p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {modules.map(m => (
                  <label key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-150"
                    style={{ background: form.moduleIds.includes(m.id) ? "rgba(46,111,168,0.12)" : "transparent" }}
                    onMouseEnter={e => { if (!form.moduleIds.includes(m.id)) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!form.moduleIds.includes(m.id)) e.currentTarget.style.background = "transparent"; }}>
                    {form.moduleIds.includes(m.id)
                      ? <CheckSquare size={15} color={BLUE_L} />
                      : <Square size={15} color="rgba(255,255,255,0.30)" />}
                    <span className="text-sm" style={{ color: form.moduleIds.includes(m.id) ? "#f1f5f9" : "rgba(255,255,255,0.60)" }}>
                      {m.name} — {m.sede.name}
                    </span>
                    <input type="checkbox" className="sr-only" checked={form.moduleIds.includes(m.id)} onChange={() => toggleModule(m.id)} />
                  </label>
                ))}
              </div>
            )}

            {mode === "all" && (
              <p className="mt-3 text-sm p-3 rounded-xl" style={{ background: "rgba(46,111,168,0.10)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(46,111,168,0.20)" }}>
                La sesión se aplicará a todos los módulos ({modules.length} módulos)
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
              Cancelar
            </button>
            <button type="button" onClick={submit} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: saving ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: saving ? "none" : "0 4px 16px rgba(46,111,168,0.35)", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <Save size={15} />}
              {saving ? "Creando..." : "Crear Sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}