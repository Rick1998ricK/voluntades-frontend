"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  CalendarDays, MapPin, Clock, TrendingUp, FileCheck, CheckCircle, AlertCircle, X,
} from "lucide-react";
import DownloadCards from "@/components/DownloadCard";

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

const MONTHS_ES: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

function formatMonth(ym: string) {
  const [, m] = ym.split("-");
  return MONTHS_ES[m] ?? ym;
}

function getGreeting() {
  const h = new Date(new Date().getTime() - 5 * 60 * 60 * 1000).getUTCHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function getFirstName(fullName?: string) {
  return fullName?.split(" ")[0] ?? "";
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0d1424",
      border: "1px solid rgba(255,255,255,0.10)",
      borderRadius: "12px",
      padding: "10px 14px",
      fontSize: "12px",
      color: "#f1f5f9",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function VolunteerDashboard() {
  const { user } = useAuth();

  const [volunteer,   setVolunteer]   = useState<any>(null);
  const [sessions,    setSessions]    = useState<any[]>([]);
  const [chartData,   setChartData]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [anticipatedModal,   setAnticipatedModal]   = useState<any>(null);
  const [anticipatedReason,  setAnticipatedReason]  = useState("");
  const [anticipatedFile,    setAnticipatedFile]     = useState<File | null>(null);
  const [anticipatedSending, setAnticipatedSending] = useState(false);
  const [anticipatedType, setAnticipatedType] = useState<"falta" | "tardanza" | "">("");
  const [anticipatedMsg,     setAnticipatedMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    load();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const volRes = await api.get(`/volunteers/by-user/${user!.id}`);
      const vol = volRes.data;
      setVolunteer(vol);

      const sesRes = await api.get(`/sessions/upcoming${vol.module?.id ? `?moduleId=${vol.module.id}` : ''}`);
      console.log('Sesiones próximas:', sesRes.data);
      setSessions(sesRes.data ?? []);

      const attRes = await api.get(`/attendance/volunteer/${vol.id}/by-month`);
      setChartData(
        (attRes.data ?? []).map((r: any) => ({
          ...r,
          label: formatMonth(r.month),
        }))
      );
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }

  async function submitAnticipated() {
    if (!anticipatedType) return setAnticipatedMsg({ type: "err", text: "Selecciona si es falta o tardanza" });
    if (!anticipatedReason.trim()) return setAnticipatedMsg({ type: "err", text: "El motivo es obligatorio" });
    setAnticipatedSending(true); setAnticipatedMsg(null);
    try {
      const form = new FormData();
      form.append("sessionId", String(anticipatedModal.id));
      form.append("reason", anticipatedReason);
      form.append("anticipatedType", anticipatedType);
      if (anticipatedFile) form.append("file", anticipatedFile);
      await api.post("/justifications/anticipated", form, { headers: { "Content-Type": "multipart/form-data" } });
      setAnticipatedMsg({ type: "ok", text: "Justificación anticipada enviada correctamente" });
      setAnticipatedReason(""); setAnticipatedFile(null);
      setTimeout(() => { setAnticipatedModal(null); setAnticipatedMsg(null); }, 1500);
    } catch (e: any) {
      setAnticipatedMsg({ type: "err", text: e?.response?.data?.message ?? "Error al enviar" });
    } finally { setAnticipatedSending(false); }
  }

  const totalPuntuales = chartData.reduce((s, r) => s + r.puntuales, 0);
  const totalTardes    = chartData.reduce((s, r) => s + r.tardes,    0);
  const totalFaltas    = chartData.reduce((s, r) => s + r.faltas,    0);
  const total          = totalPuntuales + totalTardes + totalFaltas;
  const pct            = total === 0 ? 0 : Math.round(((totalPuntuales + totalTardes) / total) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full mx-auto animate-spin"
            style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* ══ BIENVENIDA ══ */}
      <div className="relative overflow-hidden p-6 md:p-8" style={glass(BLUE)}>
        {/* Barra superior */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,${BLUE},${ORANGE},transparent)` }} />
        {/* Fondo decorativo */}
        <div style={{
          position: "absolute", right: -40, top: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, ${BLUE}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* ── DESCARGAS ── */}
        {/* <DownloadCards /> */}

        <div className="relative flex items-center gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, boxShadow: `0 4px 20px ${BLUE}55` }}>
            {volunteer?.photoUrl ? (
              <img
                src={volunteer.photoUrl?.startsWith("http") ? volunteer.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${volunteer.photoUrl}`}
                className="w-full h-full object-cover rounded-2xl"
                alt="foto"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {getFirstName(user?.name)?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {getGreeting()}, 👋
            </p>
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {getFirstName(user?.name)}
            </h1>
            {volunteer && (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {volunteer.module?.name && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                    <MapPin size={10} /> {volunteer.module.name}
                  </span>
                )}
                {volunteer.sede?.name && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                    · {volunteer.sede.name}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                  Voluntario activo
                </span>
              </div>
            )}
          </div>

          {/* Porcentaje asistencia */}
          {total > 0 && (
            <div className="hidden md:flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={pct >= 80 ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171"}
                    strokeWidth="3"
                    strokeDasharray={`${pct} ${100 - pct}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: "#f1f5f9" }}>{pct}%</span>
                </div>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Asistencia</p>
            </div>
          )}
        </div>

        {/* Mini stats */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Puntuales", value: totalPuntuales, color: "#4ade80" },
              { label: "Tardanzas", value: totalTardes,    color: "#facc15" },
              { label: "Faltas",    value: totalFaltas,    color: "#f87171" },
            ].map((c) => (
              <div key={c.label} className="text-center py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{c.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ GRID: SESIONES + GRÁFICA ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* PRÓXIMAS SESIONES */}
        <div className="relative overflow-hidden" style={glass(ORANGE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg,${ORANGE},transparent)` }} />

          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <CalendarDays size={14} color={ORANGE} />
            <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              Próximas sesiones
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3">
              <CalendarDays size={28} color="rgba(232,114,42,0.25)" />
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
                No hay sesiones próximas programadas
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {sessions.map((s, i) => {
                const [, mm, dd] = (s.date ?? "").split("-");
                const dayNum = dd ? parseInt(dd) : "?";
                const monthLabel = mm ? (MONTHS_ES[mm] ?? mm) : "";
                return (
                  <div key={s.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-all duration-150"
                    style={{ borderBottom: i < sessions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    <div className="w-11 h-11 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
                      style={{ background: "rgba(232,114,42,0.12)", border: "1px solid rgba(232,114,42,0.20)" }}>
                      <span className="text-base font-bold leading-none" style={{ color: ORANGE }}>{dayNum}</span>
                      <span className="text-xs leading-none mt-0.5" style={{ color: "rgba(232,114,42,0.70)" }}>{monthLabel}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {s.startTime && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                            <Clock size={9} /> {s.startTime.substring(0, 5)}
                            {s.endTime ? ` – ${s.endTime.substring(0, 5)}` : ""}
                          </span>
                        )}
                        {s.modules?.[0]?.sede?.name && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <MapPin size={9} /> {s.modules[0].sede.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {s.isActive && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                          En curso
                        </span>
                      )}
                      {(
                        <button
                          onClick={() => { setAnticipatedModal(s); setAnticipatedReason(""); setAnticipatedFile(null); setAnticipatedMsg(null); setAnticipatedType(""); }}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                          style={{ background: "rgba(155,109,255,0.15)", color: "#9b6dff", border: "1px solid rgba(155,109,255,0.25)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,109,255,0.25)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,109,255,0.15)")}>
                          Justificar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GRÁFICA ASISTENCIA POR MES */}
        <div className="relative overflow-hidden" style={glass(BLUE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg,${BLUE},transparent)` }} />

          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <TrendingUp size={14} color={BLUE_L} />
            <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
              Asistencia por mes
            </h2>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 gap-3">
              <TrendingUp size={28} color="rgba(46,111,168,0.25)" />
              <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.30)" }}>
                Aún no hay datos de asistencia registrados
              </p>
            </div>
          ) : (
            <div className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={10} barGap={3}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                    axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                    axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                    formatter={(val) => <span style={{ color: "rgba(255,255,255,0.50)" }}>{val}</span>}
                  />
                  <Bar dataKey="puntuales" name="Puntuales" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tardes"    name="Tardanzas"  fill="#facc15" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faltas"    name="Faltas"     fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      {anticipatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setAnticipatedModal(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass("#9b6dff"), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#9b6dff,transparent)" }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(155,109,255,0.15)" }}>
                  <FileCheck size={15} color="#9b6dff" />
                </div>
                <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Justificación anticipada</span>
              </div>
              <button onClick={() => setAnticipatedModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl text-xs space-y-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Sesión: <span style={{ color: "#f1f5f9" }}>{anticipatedModal.name}</span></p>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Fecha: <span style={{ color: "#f1f5f9" }}>{anticipatedModal.date}</span></p>
              </div>
              {anticipatedMsg && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                  style={anticipatedMsg.type === "ok"
                    ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" }
                    : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
                  {anticipatedMsg.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {anticipatedMsg.text}
                </div>
              )}
              <div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>
                    Tipo de justificación *
                  </label>
                  <div className="flex gap-2">
                    <button onClick={() => setAnticipatedType("falta")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: anticipatedType === "falta" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)",
                        color: anticipatedType === "falta" ? "#f87171" : "rgba(255,255,255,0.50)",
                        border: anticipatedType === "falta" ? "1px solid rgba(248,113,113,0.30)" : "1px solid rgba(255,255,255,0.09)",
                      }}>
                      Falta
                    </button>
                    <button onClick={() => setAnticipatedType("tardanza")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: anticipatedType === "tardanza" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)",
                        color: anticipatedType === "tardanza" ? "#facc15" : "rgba(255,255,255,0.50)",
                        border: anticipatedType === "tardanza" ? "1px solid rgba(250,204,21,0.30)" : "1px solid rgba(255,255,255,0.09)",
                      }}>
                      Tardanza
                    </button>
                  </div>
                </div>
                <textarea rows={3} placeholder="Explica por qué faltarás o llegarás tarde..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "12px", padding: "10px 14px", color: "#f1f5f9", fontSize: "14px", outline: "none", resize: "none" }}
                  value={anticipatedReason}
                  onChange={e => setAnticipatedReason(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAnticipatedModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitAnticipated} disabled={anticipatedSending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: anticipatedSending ? "rgba(155,109,255,0.30)" : "linear-gradient(135deg,#9b6dff,#b48aff)", color: "#fff", cursor: anticipatedSending ? "not-allowed" : "pointer" }}>
                  {anticipatedSending
                    ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    : <FileCheck size={14} />}
                  {anticipatedSending ? "Enviando..." : "Enviar justificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}