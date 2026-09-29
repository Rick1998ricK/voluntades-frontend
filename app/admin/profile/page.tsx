"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  QrCode, Download, Key, CheckCircle, AlertCircle, User, Phone,
  MapPin, Droplets, BookOpen, Calendar, ClipboardList, FileCheck,
  Clock, XCircle, X, Shield, Activity, Bell,
} from "lucide-react";
// @ts-ignore
import QRCode from "qrcode";
import DownloadCards from "@/components/DownloadCard";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";
const PURPLE = "#9b6dff";

const glass = (accent?: string) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${accent ? accent + "33" : "rgba(255,255,255,0.08)"}`,
  borderRadius: "20px",
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
  super_admin: { label: "Super Admin",   color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  admin:       { label: "Admin",         color: BLUE_L,    bg: `${BLUE}20`              },
  registrador: { label: "Registrador",   color: "#86efac", bg: "rgba(134,239,172,0.12)" },
  voluntario:  { label: "Voluntario",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  xpress:      { label: "Xpress",        color: ORANGE,    bg: "rgba(232,114,42,0.12)"  },
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

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>{children}</h2>
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [volunteer,   setVolunteer]   = useState<any>(null);
  const [passwords,   setPasswords]   = useState({ newPass: "", confirm: "" });
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [myAlerts,     setMyAlerts]     = useState<{ faltas: number; tardanzas: number } | null>(null);
  const [periods,      setPeriods]      = useState<any[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [attRows,      setAttRows]      = useState<any[]>([]);
  const [justRows,     setJustRows]     = useState<any[]>([]);
  const [attLoading,   setAttLoading]   = useState(false);
  const [justLoading,  setJustLoading]  = useState(false);

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [myAnticipated,    setMyAnticipated]    = useState<any[]>([]);
  const [anticipatedModal,   setAnticipatedModal]   = useState<any>(null);
  const [anticipatedReason,  setAnticipatedReason]  = useState("");
  const [anticipatedFile,    setAnticipatedFile]    = useState<File | null>(null);
  const [anticipatedSending, setAnticipatedSending] = useState(false);
  const [anticipatedType,    setAnticipatedType]    = useState<"falta" | "tardanza" | "">("");
  const [anticipatedMsg,     setAnticipatedMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const anticipatedFileRef = useRef<HTMLInputElement>(null);

  const [justModal, setJustModal] = useState<any>(null);
  const [reason,    setReason]    = useState("");
  const [file,      setFile]      = useState<File | null>(null);
  const [sending,   setSending]   = useState(false);
  const [justMsg,   setJustMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);
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

    api.get(`/attendance/volunteer/${volunteer.id}/alerts`).then(res => setMyAlerts(res.data)).catch(() => {});
    api.get(`/sessions/upcoming${volunteer.module?.id ? `?moduleId=${volunteer.module.id}` : ''}`).then(res => setUpcomingSessions(res.data ?? [])).catch(() => {});
    api.get('/justifications/mine/anticipated').then(res => setMyAnticipated(res.data ?? [])).catch(() => {});
    api.get("/periods").then(r => {
      setPeriods(r.data);
      if (r.data.length > 0) {
        const last = r.data.reduce((prev: any, curr: any) => curr.id > prev.id ? curr : prev, r.data[0]);
        setFilterPeriod(String(last.id));
      }
    }).catch(() => {});
  }, [volunteer]);

  useEffect(() => {
    if (!volunteer?.id) return;
    setJustLoading(true);
    api.get("/justifications/mine").then(res => setJustRows(res.data ?? [])).catch(() => setJustRows([])).finally(() => setJustLoading(false));
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
      setMsg({ type: "ok", text: "Contraseña actualizada" });
      setPasswords({ newPass: "", confirm: "" });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.response?.data?.message ?? "Error al actualizar" });
    } finally { setSaving(false); }
  }

  async function submitJustification() {
    if (!reason.trim()) return setJustMsg({ type: "err", text: "El motivo es obligatorio" });
    if (file) {
      const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(file.type)) return setJustMsg({ type: "err", text: "Solo PDF o Word (.pdf, .doc, .docx)" });
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
      setAnticipatedMsg({ type: "ok", text: "Justificación enviada correctamente" });
      setAnticipatedReason(""); setAnticipatedFile(null);
      setTimeout(() => {
        setAnticipatedModal(null); setAnticipatedMsg(null);
        api.get('/justifications/mine/anticipated').then(res => setMyAnticipated(res.data ?? []));
      }, 1500);
    } catch (e: any) {
      setAnticipatedMsg({ type: "err", text: e?.response?.data?.message ?? "Error al enviar" });
    } finally { setAnticipatedSending(false); }
  }

  const canJustify = (row: any) => {
    const s = row.status?.toLowerCase();
    if (s !== "falta" && s !== "tarde") return false;
    if (!row.justification) return true;
    return row.justification.status === "rechazado";
  };

  const photoUrl   = volunteer?.photoUrl ?? null;
  const roleInfo   = ROLE_CONFIG[authUser?.role as string] ?? { label: authUser?.role ?? "—", color: BLUE_L, bg: `${BLUE}20` };

  const filteredAtt = !filterPeriod ? attRows : attRows.filter((a: any) => {
    const period = periods.find((p: any) => p.id === parseInt(filterPeriod));
    if (!period) return true;
    const d = new Date(a.session?.date ?? a.date);
    return d >= new Date(period.startDate) && d <= new Date(period.endDate);
  });

  const filteredJust = !filterPeriod ? justRows : justRows.filter((j: any) => {
    const period = periods.find((p: any) => p.id === parseInt(filterPeriod));
    if (!period) return true;
    const d = new Date(j.createdAt);
    return d >= new Date(period.startDate) && d <= new Date(period.endDate);
  });

  const puntuales = filteredAtt.filter((a: any) => a.status === "puntual").length;
  const tardes    = filteredAtt.filter((a: any) => a.status === "tarde").length;
  const faltas    = filteredAtt.filter((a: any) => a.status === "falta").length;
  const pct       = filteredAtt.length === 0 ? 0 : Math.round(((puntuales + tardes) / filteredAtt.length) * 100);

  const INFO_ROWS = volunteer ? [
    { label: "DNI",         value: volunteer.dni,                                        icon: <User size={13} />,     color: BLUE_L   },
    { label: "Teléfono",    value: volunteer.phone,                                      icon: <Phone size={13} />,    color: "#4ade80" },
    { label: "Emergencia",  value: volunteer.emergencyContact,                           icon: <Phone size={13} />,    color: "#f87171" },
    { label: "Módulo",      value: volunteer.module?.name,                               icon: <MapPin size={13} />,   color: ORANGE   },
    { label: "Sede",        value: volunteer.sede?.name,                                 icon: <MapPin size={13} />,   color: ORANGE   },
    { label: "Nacimiento",  value: volunteer.birthDate?.substring(0, 10),                icon: <Calendar size={13} />, color: "#facc15" },
    { label: "Sangre",      value: volunteer.bloodType,                                  icon: <Droplets size={13} />, color: "#f87171" },
    { label: "Período",     value: volunteer.joinPeriod,                                 icon: <Calendar size={13} />, color: BLUE_L   },
    { label: "Género",      value: volunteer.gender === "M" ? "Masculino" : "Femenino", icon: <User size={13} />,     color: "#c084fc" },
    { label: "Estudiante",  value: volunteer.isStudent ? "Sí" : "No",                   icon: <BookOpen size={13} />, color: "#86efac" },
    ...(volunteer.isStudent ? [{ label: "Institución", value: volunteer.institution, icon: <BookOpen size={13} />, color: "#86efac" }] : []),
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.5px" }}>Mi perfil</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Tu información personal y actividad</p>
          </div>
          {volunteer?.status === "activo" && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Activo
            </span>
          )}
        </div>

        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8"
          style={{ background: `linear-gradient(135deg, rgba(46,111,168,0.15) 0%, rgba(155,109,255,0.08) 100%)`, border: "1px solid rgba(46,111,168,0.20)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${BLUE},${PURPLE},transparent)` }} />
          <div style={{ position: "absolute", right: -60, top: -60, width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle,${BLUE}10,transparent 70%)`, pointerEvents: "none" }} />

          <div className="relative flex items-center gap-5 md:gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden"
                style={{ border: `2px solid ${BLUE}50`, boxShadow: `0 0 30px ${BLUE}30` }}>
                {photoUrl
                  ? <img src={photoUrl?.startsWith("http") ? photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${photoUrl}`} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})` }}>
                      <span className="text-2xl font-bold text-white">{authUser?.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                }
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: roleInfo.bg, border: `2px solid #070d14`, boxShadow: `0 0 10px ${roleInfo.color}40` }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: roleInfo.color }} />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9" }}>{authUser?.name}</h2>
              <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{authUser?.email}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: roleInfo.bg, color: roleInfo.color, border: `1px solid ${roleInfo.color}30` }}>
                  {roleInfo.label}
                </span>
                {volunteer?.module?.name && (
                  <span className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <MapPin size={10} /> {volunteer.module.name}
                  </span>
                )}
              </div>
            </div>

            {/* Círculo de asistencia */}
            {filteredAtt.length > 0 && (
              <div className="hidden md:flex flex-col items-center gap-2 flex-shrink-0">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={pct >= 80 ? "#4ade80" : pct >= 60 ? "#facc15" : "#f87171"}
                      strokeWidth="2.5" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{pct}%</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Asistencia</p>
              </div>
            )}
          </div>

          {volunteer && (
            <div className="relative mt-6">
              <DownloadCards />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── COLUMNA PRINCIPAL ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* FICHA DE VOLUNTARIO */}
            {volunteer && (
              <div className="relative overflow-hidden" style={glass(BLUE)}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
                <div className="p-5">
                  <SectionTitle icon={<User size={14} color={BLUE_L} />}>Datos personales</SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    {INFO_ROWS.map(({ label, value, icon, color }) => (
                      <div key={label} className="flex items-center gap-3 py-2.5 px-1"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: color + "15" }}>
                          <span style={{ color }}>{icon}</span>
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className="text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</span>
                          <span className="text-xs font-semibold text-right truncate" style={{ color: "#f1f5f9" }}>{value || "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SESIONES PRÓXIMAS */}
            {upcomingSessions.length > 0 && (
              <div className="relative overflow-hidden" style={glass(PURPLE)}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${PURPLE},transparent)` }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={<Calendar size={14} color={PURPLE} />}>Sesiones próximas</SectionTitle>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(155,109,255,0.15)", color: PURPLE }}>
                      {upcomingSessions.length} próxima(s)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {upcomingSessions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl transition-all duration-200"
                        style={{ background: "rgba(155,109,255,0.06)", border: "1px solid rgba(155,109,255,0.15)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,109,255,0.10)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,109,255,0.06)")}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(155,109,255,0.15)", border: "1px solid rgba(155,109,255,0.25)" }}>
                            <span className="text-base font-bold leading-none" style={{ color: PURPLE }}>{s.date?.split("-")[2]}</span>
                            <span className="text-xs leading-none" style={{ color: "rgba(155,109,255,0.70)" }}>
                              {["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(s.date?.split("-")[1])] ?? ""}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{s.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
                              {s.startTime?.substring(0,5)} — {s.endTime?.substring(0,5)}
                            </p>
                          </div>
                        </div>
                        {(() => {
                          const existing = myAnticipated.find((j: any) => j.session?.id === s.id);
                          if (existing) {
                            const cfg =
                              existing.status === 'aprobado'  ? { bg: "rgba(74,222,128,0.12)",  color: "#4ade80",  label: "Aprobado",   icon: <CheckCircle size={10} /> } :
                              existing.status === 'rechazado' ? { bg: "rgba(248,113,113,0.12)", color: "#f87171",  label: "Rechazado",  icon: <XCircle size={10} />     } :
                                                                { bg: "rgba(250,204,21,0.12)",  color: "#facc15",  label: "Pendiente",  icon: <Clock size={10} />       };
                            return (
                              <div className="flex flex-col gap-1 items-end">
                                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                                  {cfg.icon} {cfg.label}
                                </span>
                                {existing.status === 'pendiente' && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm('¿Cancelar esta justificación?')) return;
                                      try {
                                        await api.delete(`/justifications/anticipated/${existing.id}`);
                                        api.get('/justifications/mine/anticipated').then(res => setMyAnticipated(res.data ?? []));
                                      } catch { alert('Error al cancelar'); }
                                    }}
                                    className="text-xs px-2 py-1 rounded-lg"
                                    style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}>
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => { setAnticipatedModal(s); setAnticipatedReason(""); setAnticipatedFile(null); setAnticipatedMsg(null); setAnticipatedType(""); }}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                              style={{ background: "rgba(155,109,255,0.15)", color: PURPLE, border: "1px solid rgba(155,109,255,0.25)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(155,109,255,0.25)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(155,109,255,0.15)")}>
                              <FileCheck size={11} /> Justificar
                            </button>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ALERTAS */}
            {myAlerts && (myAlerts.faltas >= 3 || myAlerts.tardanzas >= 3) && (
              <div className="relative overflow-hidden rounded-2xl p-4"
                style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.20)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(248,113,113,0.15)" }}>
                    <Bell size={16} color="#f87171" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-2" style={{ color: "#f87171" }}>Alertas en el período actual</p>
                    <div className="flex gap-2 flex-wrap">
                      {myAlerts.faltas >= 3 && (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.30)" }}>
                          {myAlerts.faltas} faltas
                        </span>
                      )}
                      {myAlerts.tardanzas >= 3 && (
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ background: "rgba(250,204,21,0.15)", color: "#facc15", border: "1px solid rgba(250,204,21,0.30)" }}>
                          {myAlerts.tardanzas} tardanzas
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Comunícate con tu coordinador para regularizar tu situación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ASISTENCIA */}
            {volunteer && (
              <div className="relative overflow-hidden" style={glass(BLUE)}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
                <div className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <SectionTitle icon={<Activity size={14} color={BLUE_L} />}>Mi asistencia</SectionTitle>
                      <select value={filterPeriod} onChange={e => {
                        const val = e.target.value;
                        setFilterPeriod(val);
                        if (volunteer?.id) {
                          api.get(`/attendance/volunteer/${volunteer.id}/alerts${val ? `?periodId=${val}` : ''}`)
                            .then(res => setMyAlerts(res.data)).catch(() => {});
                        }
                      }}
                      className="text-xs px-3 py-1.5 rounded-xl outline-none font-semibold"
                      style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.40)", color: "#4a9fd4" }}>
                      <option value="" style={{ background: "#0d1424" }}>Todos los períodos</option>
                      {periods.map((p: any) => (
                        <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {[
                      { label: "Total",     value: filteredAtt.length, color: "rgba(255,255,255,0.80)", accent: BLUE      },
                      { label: "Puntuales", value: puntuales,          color: "#4ade80",                accent: "#4ade80" },
                      { label: "Tardanzas", value: tardes,             color: "#facc15",                accent: "#facc15" },
                      { label: "Faltas",    value: faltas,             color: "#f87171",                accent: "#f87171" },
                    ].map((c, i) => (
                      <div key={i} className="relative overflow-hidden p-3 text-center rounded-xl"
                        style={{ background: c.accent + "10", border: `1px solid ${c.accent}25` }}>
                        <p className="text-xl font-bold" style={{ color: c.color }}>{c.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{c.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tabla */}
                  {attLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
                    </div>
                  ) : filteredAtt.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <ClipboardList size={24} color="rgba(46,111,168,0.25)" />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin registros de asistencia</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            {["Sesión", "Fecha", "Estado", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAtt.map((row, i) => (
                            <tr key={row.id}
                              style={{ borderBottom: i < filteredAtt.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                              <td className="px-4 py-3 font-semibold text-xs" style={{ color: "#f1f5f9" }}>{row.sessionName ?? "—"}</td>
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
              </div>
            )}

            {/* JUSTIFICACIONES */}
            {volunteer && (
              <div className="relative overflow-hidden" style={glass(ORANGE)}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <SectionTitle icon={<FileCheck size={14} color={ORANGE} />}>Mis justificaciones</SectionTitle>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{filteredJust.length} registro(s)</span>
                  </div>
                  {justLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `3px solid rgba(232,114,42,0.2)`, borderTopColor: ORANGE }} />
                    </div>
                  ) : filteredJust.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-2 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <FileCheck size={24} color="rgba(232,114,42,0.25)" />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No has enviado justificaciones</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <table className="w-full text-sm min-w-[500px]">
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                            {["Sesión", "Motivo", "Estado", "Nota", "Fecha"].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredJust.map((j, i) => {
                            const cfg =
                              j.status === "aprobado"  ? { bg: "rgba(74,222,128,0.14)",  color: "#4ade80",  label: "Aprobado",  icon: <CheckCircle size={9} />  } :
                              j.status === "rechazado" ? { bg: "rgba(248,113,113,0.14)", color: "#f87171",  label: "Rechazado", icon: <XCircle size={9} />      } :
                                                         { bg: "rgba(250,204,21,0.14)",  color: "#facc15",  label: "Pendiente", icon: <Clock size={9} />        };
                            return (
                              <tr key={j.id}
                                style={{ borderBottom: i < filteredJust.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td className="px-4 py-3 font-semibold text-xs" style={{ color: "#f1f5f9" }}>
                                  {j.attendance?.session?.name ?? j.session?.name ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-xs max-w-[160px]">
                                  <span className="line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>{j.reason}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: cfg.bg, color: cfg.color }}>
                                    {cfg.icon} {cfg.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs max-w-[140px]">
                                  <span className="line-clamp-2 italic" style={{ color: "rgba(255,255,255,0.35)" }}>{j.reviewNote ?? "—"}</span>
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
          </div>

          {/* ── COLUMNA LATERAL ── */}
          <div className="space-y-5">
            {/* QR */}
            <div className="relative overflow-hidden" style={glass(BLUE)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
              <div className="p-5 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 self-start">
                  <QrCode size={13} color={BLUE_L} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Código QR</p>
                </div>
                {volunteer ? (
                  <>
                    <div className="rounded-2xl p-4 bg-white shadow-xl">
                      <canvas ref={canvasRef} className="block" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{volunteer.fullName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>DNI: {volunteer.dni}</p>
                    </div>
                    <button onClick={downloadQR}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 4px 16px rgba(46,111,168,0.35)" }}>
                      <Download size={14} /> Descargar QR
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <QrCode size={32} color="rgba(255,255,255,0.15)" />
                    <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.30)" }}>Sin ficha de voluntario</p>
                  </div>
                )}
              </div>
            </div>

            {/* CAMBIAR CONTRASEÑA */}
            <div className="relative overflow-hidden" style={glass(ORANGE)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
              <div className="p-5 space-y-4">
                <SectionTitle icon={<Shield size={14} color={ORANGE} />}>Seguridad</SectionTitle>
                {msg && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                    style={msg.type === "ok"
                      ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" }
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: saving ? "rgba(232,114,42,0.30)" : `linear-gradient(135deg,${ORANGE},#f5a35a)`, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                    {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <Key size={14} />}
                    {saving ? "Guardando..." : "Actualizar contraseña"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MODAL JUSTIFICAR ═══ */}
      {justModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
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
              <button onClick={() => setJustModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Sesión: <span style={{ color: "#f1f5f9" }}>{justModal.sessionName}</span></p>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Fecha: <span style={{ color: "#f1f5f9" }}>{justModal.date}</span></p>
              </div>
              {justMsg && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                  style={justMsg.type === "ok" ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" } : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
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
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()} className="w-full py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: file ? "#4ade80" : "rgba(255,255,255,0.45)", border: `1px solid ${file ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.10)"}` }}>
                  {file ? `📎 ${file.name}` : "Seleccionar archivo (PDF o Word)"}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setJustModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitJustification} disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: sending ? "rgba(232,114,42,0.30)" : `linear-gradient(135deg,${ORANGE},#f5a35a)`, color: "#fff", cursor: sending ? "not-allowed" : "pointer" }}>
                  {sending ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <FileCheck size={14} />}
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL JUSTIFICACIÓN ANTICIPADA ═══ */}
      {anticipatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setAnticipatedModal(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(PURPLE), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${PURPLE},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(155,109,255,0.15)" }}>
                  <FileCheck size={15} color={PURPLE} />
                </div>
                <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Justificación anticipada</span>
              </div>
              <button onClick={() => setAnticipatedModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Sesión: <span style={{ color: "#f1f5f9" }}>{anticipatedModal.name}</span></p>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Fecha: <span style={{ color: "#f1f5f9" }}>{anticipatedModal.date}</span></p>
              </div>
              {anticipatedMsg && (
                <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                  style={anticipatedMsg.type === "ok" ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" } : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
                  {anticipatedMsg.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {anticipatedMsg.text}
                </div>
              )}
              <div>
                <Label>Tipo de justificación *</Label>
                <div className="flex gap-2">
                  <button onClick={() => setAnticipatedType("falta")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: anticipatedType === "falta" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)", color: anticipatedType === "falta" ? "#f87171" : "rgba(255,255,255,0.50)", border: anticipatedType === "falta" ? "1px solid rgba(248,113,113,0.30)" : "1px solid rgba(255,255,255,0.09)" }}>
                    Falta
                  </button>
                  <button onClick={() => setAnticipatedType("tardanza")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: anticipatedType === "tardanza" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)", color: anticipatedType === "tardanza" ? "#facc15" : "rgba(255,255,255,0.50)", border: anticipatedType === "tardanza" ? "1px solid rgba(250,204,21,0.30)" : "1px solid rgba(255,255,255,0.09)" }}>
                    Tardanza
                  </button>
                </div>
              </div>
              <div>
                <Label>Motivo *</Label>
                <textarea rows={3} placeholder="Explica por qué faltarás o llegarás tarde..."
                  style={{ ...IS, resize: "none" } as any} value={anticipatedReason}
                  onChange={e => setAnticipatedReason(e.target.value)} onFocus={fi} onBlur={fo} />
              </div>
              <div>
                <Label>Archivo adjunto <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textTransform: "none" }}>(opcional)</span></Label>
                <input ref={anticipatedFileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setAnticipatedFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => anticipatedFileRef.current?.click()} className="w-full py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: anticipatedFile ? "#4ade80" : "rgba(255,255,255,0.45)", border: `1px solid ${anticipatedFile ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.10)"}` }}>
                  {anticipatedFile ? `📎 ${anticipatedFile.name}` : "Seleccionar archivo (PDF o Word)"}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAnticipatedModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitAnticipated} disabled={anticipatedSending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: anticipatedSending ? "rgba(155,109,255,0.30)" : `linear-gradient(135deg,${PURPLE},#b48aff)`, color: "#fff", cursor: anticipatedSending ? "not-allowed" : "pointer" }}>
                  {anticipatedSending ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <FileCheck size={14} />}
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