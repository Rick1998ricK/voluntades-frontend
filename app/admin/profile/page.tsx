"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  QrCode, Download, Key, CheckCircle, AlertCircle, User, Phone,
  MapPin, Droplets, BookOpen, Calendar, ClipboardList, FileCheck,
  Clock, XCircle, X,
} from "lucide-react";
// @ts-ignore
import QRCode from "qrcode";
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

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Administrador", color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  admin:       { label: "Administrador",        color: BLUE_L,   bg: `${BLUE}20`              },
  registrador: { label: "Registrador",          color: "#86efac", bg: "rgba(134,239,172,0.12)"},
  voluntario:  { label: "Voluntario",           color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-widest block mb-2"
      style={{ color: "rgba(255,255,255,0.38)" }}>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === "puntual") return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}><CheckCircle size={10} /> Puntual</span>;
  if (s === "tarde")   return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(250,204,21,0.14)", color: "#facc15" }}><Clock size={10} /> Tarde</span>;
  if (s === "falta")   return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}><XCircle size={10} /> Falta</span>;
  return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [volunteer,   setVolunteer]   = useState<any>(null);
  const [passwords,   setPasswords]   = useState({ newPass: "", confirm: "" });
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [attRows,     setAttRows]     = useState<any[]>([]);
  const [justRows,    setJustRows]    = useState<any[]>([]);
  const [attLoading,  setAttLoading]  = useState(false);
  const [justLoading, setJustLoading] = useState(false);

  const [justModal,   setJustModal]   = useState<any>(null);
  const [reason,      setReason]      = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [sending,     setSending]     = useState(false);
  const [justMsg,     setJustMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authUser?.id) return;
    api.get(`/volunteers/by-user/${authUser.id}`)
      .then(res => setVolunteer(res.data))
      .catch(() => setVolunteer(null));
  }, [authUser]);

  useEffect(() => {
    if (volunteer && canvasRef.current) {
      const qrData = JSON.stringify({ id: volunteer.id, name: volunteer.fullName, dni: volunteer.dni });
      QRCode.toCanvas(canvasRef.current, qrData, { width: 180, margin: 2, color: { dark: "#0d1424", light: "#ffffff" } });
    }
  }, [volunteer]);

  useEffect(() => {
    if (!volunteer?.id) return;
    setAttLoading(true);
    api.get(`/attendance/volunteer/${volunteer.id}/history`)
      .then(res => setAttRows(res.data ?? []))
      .catch(() => setAttRows([]))
      .finally(() => setAttLoading(false));
  }, [volunteer]);

  useEffect(() => {
    if (!volunteer?.id) return;
    setJustLoading(true);
    api.get("/justifications/mine")
      .then(res => setJustRows(res.data ?? []))
      .catch(() => setJustRows([]))
      .finally(() => setJustLoading(false));
  }, [volunteer]);

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas || !volunteer) return;
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d")!;
    tmp.width = 260; tmp.height = 300;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 260, 300);
    ctx.drawImage(canvas, 30, 15, 200, 200);
    ctx.fillStyle = "#0d1424"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(volunteer.fullName, 130, 250);
    const link = document.createElement("a");
    link.download = `QR_${volunteer.fullName.replace(/\s+/g, "_")}.png`;
    link.href = tmp.toDataURL("image/png"); link.click();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwords.newPass) return setMsg({ type: "err", text: "Ingresa la nueva contraseña" });
    if (passwords.newPass !== passwords.confirm) return setMsg({ type: "err", text: "Las contraseñas no coinciden" });
    if (passwords.newPass.length < 6) return setMsg({ type: "err", text: "Mínimo 6 caracteres" });
    setSaving(true); setMsg(null);
    try {
      await api.patch(`/users/${authUser?.id}`, { password: passwords.newPass });
      setMsg({ type: "ok", text: "Contraseña actualizada correctamente" });
      setPasswords({ newPass: "", confirm: "" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.response?.data?.message ?? "Error al actualizar" });
    } finally { setSaving(false); }
  }

  async function submitJustification() {
    if (!reason.trim()) return setJustMsg({ type: "err", text: "El motivo es obligatorio" });

    // ✅ CAMBIO 1: Validación de tipo de archivo antes de enviar
    if (file) {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowed.includes(file.type)) {
        return setJustMsg({ type: "err", text: "Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)" });
      }
    }

    setSending(true); setJustMsg(null);
    try {
      const form = new FormData();
      form.append("attendanceId", String(justModal.id));
      form.append("reason", reason);
      if (file) form.append("file", file);
      await api.post("/justifications", form, { headers: { "Content-Type": "multipart/form-data" } });
      setJustMsg({ type: "ok", text: "Justificación enviada correctamente" });
      setReason(""); setFile(null);
      setTimeout(() => {
        setJustModal(null); setJustMsg(null);
        api.get(`/attendance/volunteer/${volunteer.id}/history`).then(r => setAttRows(r.data ?? []));
        api.get("/justifications/mine").then(r => setJustRows(r.data ?? []));
      }, 1500);
    } catch (e: any) {
      setJustMsg({ type: "err", text: e?.response?.data?.message ?? "Error al enviar" });
    } finally { setSending(false); }
  }

  const canJustify = (row: any) => {
    const s = row.status?.toLowerCase();
    if (s !== "falta" && s !== "tarde") return false;
    if (!row.justification) return true;
    return row.justification.status === "rechazado";
  };

  const photoUrl = volunteer?.photoUrl ?? null;

  const roleInfo = ROLE_CONFIG[authUser?.role as string] ?? { label: authUser?.role ?? "—", color: BLUE_L, bg: `${BLUE}20` };

  const INFO_ROWS = volunteer ? [
    { label: "DNI",        value: volunteer.dni,                                          icon: <User size={12} /> },
    { label: "Teléfono",   value: volunteer.phone,                                        icon: <Phone size={12} /> },
    { label: "Emergencia", value: volunteer.emergencyContact,                             icon: <Phone size={12} /> },
    { label: "Módulo",     value: volunteer.module?.name,                                 icon: <MapPin size={12} /> },
    { label: "Sede",       value: volunteer.sede?.name,                                   icon: <MapPin size={12} /> },
    { label: "Nacimiento", value: volunteer.birthDate?.substring(0, 10),                  icon: <Calendar size={12} /> },
    { label: "Sangre",     value: volunteer.bloodType,                                    icon: <Droplets size={12} /> },
    { label: "Periodo",    value: volunteer.joinPeriod,                                   icon: <Calendar size={12} /> },
    { label: "Género",     value: volunteer.gender === "M" ? "Masculino" : "Femenino",   icon: <User size={12} /> },
    { label: "Estudiante", value: volunteer.isStudent ? "Sí" : "No",                     icon: <BookOpen size={12} /> },
    ...(volunteer.isStudent ? [{ label: "Institución", value: volunteer.institution, icon: <BookOpen size={12} /> }] : []),
  ] : [];

  const puntuales = attRows.filter(r => r.status?.toLowerCase() === "puntual").length;
  const tardes    = attRows.filter(r => r.status?.toLowerCase() === "tarde").length;
  const faltas    = attRows.filter(r => r.status?.toLowerCase() === "falta").length;

  return (
    <div className="p-4 md:p-6 space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Mi perfil</h1>
        <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Tu información personal y código QR</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="md:col-span-2 space-y-5">

          {/* ── CARD PERFIL PRINCIPAL ── */}
          <div className="relative overflow-hidden p-6" style={glass(BLUE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ border: `2px solid ${BLUE}44`, background: `${BLUE}20` }}>
                  {photoUrl
                    ? <img src={photoUrl} className="w-full h-full object-cover" alt="foto" />
                    : <span className="text-3xl font-bold" style={{ color: BLUE_L }}>{authUser?.name?.charAt(0)?.toUpperCase()}</span>
                  }
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: roleInfo.bg, border: `1px solid ${roleInfo.color}44` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: roleInfo.color }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate" style={{ color: "#f1f5f9" }}>{authUser?.name}</h2>
                <p className="text-sm truncate mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{authUser?.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.color}30` }}>
                    {roleInfo.label}
                  </span>
                  {volunteer?.status === "activo" && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}>
                      Voluntario activo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── DESCARGAS (solo visible si tiene ficha de voluntario) ── */}
            {volunteer && (
              <div className="mt-5">
                <DownloadCards />
              </div>
            )}
          </div>

          {volunteer && (
            <div className="relative overflow-hidden p-6" style={glass(BLUE)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>Ficha de voluntario</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                {INFO_ROWS.map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: "rgba(255,255,255,0.30)" }}>{icon}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</span>
                    </div>
                    <span className="text-sm font-semibold text-right max-w-[60%] truncate" style={{ color: "#f1f5f9" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="relative overflow-hidden p-5 flex flex-col items-center gap-4" style={glass(BLUE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="flex items-center gap-2 self-start">
              <QrCode size={13} color={BLUE_L} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Código QR</p>
            </div>
            {volunteer ? (
              <>
                <div className="rounded-2xl p-4 bg-white shadow-lg">
                  <canvas ref={canvasRef} className="block" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{volunteer.fullName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>DNI: {volunteer.dni}</p>
                </div>
                <button onClick={downloadQR}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 4px 16px rgba(46,111,168,0.35)" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(46,111,168,0.50)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(46,111,168,0.35)")}>
                  <Download size={14} /> Descargar QR
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <QrCode size={22} color="rgba(255,255,255,0.20)" />
                </div>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.30)" }}>No tienes ficha de voluntario asociada</p>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden p-5 space-y-4" style={glass(ORANGE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
            <div className="flex items-center gap-2">
              <Key size={13} color={ORANGE} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Cambiar contraseña</p>
            </div>
            {msg && (
              <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                style={msg.type === "ok"
                  ? { background: "rgba(74,222,128,0.12)", color: "#4ade80",  border: "1px solid rgba(74,222,128,0.22)" }
                  : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
                {msg.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                {msg.text}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <Label>Nueva contraseña</Label>
                <input type="password" placeholder="Mínimo 6 caracteres"
                  style={IS} value={passwords.newPass}
                  onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
                  onFocus={fi} onBlur={fo} />
              </div>
              <div>
                <Label>Confirmar contraseña</Label>
                <input type="password" placeholder="Repite la contraseña"
                  style={IS} value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  onFocus={fi} onBlur={fo} />
              </div>
              <button onClick={changePassword} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: saving ? "rgba(232,114,42,0.30)" : `linear-gradient(135deg,${ORANGE},#f5a35a)`, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                {saving
                  ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <Key size={14} />}
                {saving ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {volunteer && (
        <div className="space-y-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.30)" }}>
              Mi asistencia
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total",     value: attRows.length, color: "rgba(255,255,255,0.80)", accent: BLUE      },
                { label: "Puntuales", value: puntuales,      color: "#4ade80",                accent: "#4ade80" },
                { label: "Tardanzas", value: tardes,         color: "#facc15",                accent: "#facc15" },
                { label: "Faltas",    value: faltas,         color: "#f87171",                accent: "#f87171" },
              ].map((c, i) => (
                <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(c.accent)}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${c.accent},transparent)` }} />
                  <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden" style={glass(BLUE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
                <ClipboardList size={14} color={BLUE_L} /> Historial de asistencias
              </h2>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{attRows.length} registro(s)</span>
            </div>
            {attLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
              </div>
            ) : attRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <ClipboardList size={28} color="rgba(46,111,168,0.25)" />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin registros de asistencia aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Sesión", "Fecha", "Estado", "Acción"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attRows.map((row, i) => (
                      <tr key={row.id}
                        style={{ borderBottom: i < attRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#f1f5f9" }}>{row.sessionName ?? "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{row.date ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3">
                          {canJustify(row) && (
                            <button
                              onClick={() => { setJustModal(row); setReason(""); setFile(null); setJustMsg(null); }}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.22)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
                              <FileCheck size={11} /> Justificar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden" style={glass(ORANGE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
                <FileCheck size={14} color={ORANGE} /> Mis justificaciones
              </h2>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{justRows.length} registro(s)</span>
            </div>
            {justLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid rgba(232,114,42,0.2)`, borderTopColor: ORANGE }} />
              </div>
            ) : justRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <FileCheck size={28} color="rgba(232,114,42,0.25)" />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No has enviado justificaciones aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Sesión", "Motivo", "Estado", "Revisado por", "Nota", "Fecha"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                          style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {justRows.map((j, i) => {
                      const cfg =
                        j.status === "aprobado"  ? { bg: "rgba(74,222,128,0.14)",  color: "#4ade80",  label: "✓ Aprobado"  } :
                        j.status === "rechazado" ? { bg: "rgba(248,113,113,0.14)", color: "#f87171",  label: "✗ Rechazado" } :
                                                   { bg: "rgba(250,204,21,0.14)",  color: "#facc15",  label: "⏳ Pendiente" };
                      return (
                        <tr key={j.id}
                          style={{ borderBottom: i < justRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td className="px-4 py-3 font-semibold text-xs" style={{ color: "#f1f5f9" }}>{j.attendance?.session?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-xs max-w-[180px]">
                            <span className="line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>{j.reason}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                            {j.reviewedBy?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs max-w-[160px]">
                            <span className="line-clamp-2 italic" style={{ color: "rgba(255,255,255,0.35)" }}>
                              {j.reviewNote ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>
                            {new Date(j.createdAt).toLocaleDateString("es-PE")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {justModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setJustModal(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(ORANGE), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />

            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,114,42,0.15)" }}>
                  <FileCheck size={15} color={ORANGE} />
                </div>
                <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Justificar {justModal.status?.toLowerCase()}</span>
              </div>
              <button onClick={() => setJustModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl text-xs space-y-1"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Sesión: <span style={{ color: "#f1f5f9" }}>{justModal.sessionName}</span></p>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Fecha: <span style={{ color: "#f1f5f9" }}>{justModal.date}</span></p>
              </div>

              {justMsg && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                  style={justMsg.type === "ok"
                    ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" }
                    : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
                  {justMsg.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {justMsg.text}
                </div>
              )}

              <div>
                <Label>Motivo *</Label>
                <textarea rows={3} placeholder="Explica el motivo de tu falta o tardanza..."
                  style={{ ...IS, resize: "none" } as any} value={reason}
                  onChange={e => setReason(e.target.value)} onFocus={fi} onBlur={fo} />
              </div>

              <div>
                <Label>Archivo adjunto <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textTransform: "none" }}>(opcional)</span></Label>
                {/* ✅ CAMBIO 2: accept solo PDF y Word */}
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: file ? "#4ade80" : "rgba(255,255,255,0.45)",
                    border: `1px solid ${file ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.10)"}`,
                  }}>
                  {/* ✅ CAMBIO 3: texto actualizado */}
                  {file ? `📎 ${file.name}` : "Seleccionar archivo (PDF o Word)"}
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setJustModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitJustification} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: sending ? "rgba(232,114,42,0.30)" : `linear-gradient(135deg,${ORANGE},#f5a35a)`, color: "#fff", cursor: sending ? "not-allowed" : "pointer" }}>
                  {sending
                    ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    : <FileCheck size={14} />}
                  {sending ? "Enviando..." : "Enviar justificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}