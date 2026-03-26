"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
// @ts-ignore
import QRCode from "qrcode";
import {
  ArrowLeft, Pencil, ToggleLeft, Users, FileText,
  ClipboardList, QrCode, Download, X, Star,
  Calendar, Award, CheckCircle2, Clock, XCircle, Paperclip,
  RotateCcw,
} from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";
const GREEN  = "#4ade80";

const glass = (accent?: string) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: `1px solid ${accent ? accent + "33" : "rgba(255,255,255,0.08)"}`,
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
});

const IS = {
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

const STATUS_JUST: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: ORANGE,    bg: "rgba(232,114,42,0.12)"  },
  aprobado:  { label: "Aprobado",  color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  rechazado: { label: "Rechazado", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const DOC_LABELS: Record<string, string> = {
  carta_compromiso:          "Carta compromiso",
  ficha_beneficencia:        "Ficha beneficencia",
  certificado_unico_laboral: "Certificado Único Laboral",
  autorizacion_menor:        "Autorización menor",
};

function calcAge(birthDate: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate); const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getRequiredDocs(birthDate: string): string[] {
  const age = calcAge(birthDate);
  if (age === null) return ["carta_compromiso", "ficha_beneficencia", "certificado_unico_laboral"];
  if (age < 18) return ["carta_compromiso", "ficha_beneficencia", "autorizacion_menor"];
  return ["carta_compromiso", "ficha_beneficencia", "certificado_unico_laboral"];
}

function getVolunteerStatus(volunteer: any) {
  if (volunteer.status === "activo")   return { label: "Activo",   color: "#4ade80", bg: "rgba(74,222,128,0.12)",   border: "rgba(74,222,128,0.25)"   };
  if (volunteer.status === "inactivo") return { label: "Inactivo", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.10)" };
  const required = getRequiredDocs(volunteer.birthDate);
  const uploaded = (volunteer.documents ?? []).map((d: any) => d.type);
  if (required.every(r => uploaded.includes(r))) return { label: "Listo para activar", color: BLUE_L, bg: "rgba(74,144,196,0.12)", border: "rgba(74,144,196,0.25)" };
  return { label: "Pendiente docs", color: ORANGE, bg: "rgba(232,114,42,0.12)", border: "rgba(232,114,42,0.25)" };
}

type TabKey = "info" | "docs" | "asistencia";

export default function VolunteerDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Permisos ──────────────────────────────────────────────
  const isReadOnly = user?.role === "admin";
  const canRevert  = user?.role === "super_admin" || user?.role === "registrador";
  const canJustify = user?.role === "super_admin" || user?.role === "registrador";
  // ─────────────────────────────────────────────────────────

  const [volunteer,  setVolunteer]  = useState<any>(null);
  const [management, setManagement] = useState<any[]>([]);
  const [tab,        setTab]        = useState<TabKey>("info");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingAtt, setLoadingAtt] = useState(false);

  const [justModal,  setJustModal]  = useState<any>(null);
  const [justReason, setJustReason] = useState("");
  const [justFile,   setJustFile]   = useState<File | null>(null);
  const [justSaving, setJustSaving] = useState(false);

  const [revertModal,  setRevertModal]  = useState<any>(null);
  const [revertStatus, setRevertStatus] = useState<"puntual" | "tarde" | "falta">("puntual");
  const [revertSaving, setRevertSaving] = useState(false);

  const [docType, setDocType] = useState("carta_compromiso");
  const [docFile, setDocFile] = useState<File | null>(null);

  const generateQR = useCallback(async (vol: any) => {
    if (!canvasRef.current || !vol) return;
    const qrData = JSON.stringify({ id: vol.id, name: vol.fullName, dni: vol.dni });
    await QRCode.toCanvas(canvasRef.current, qrData, { width: 200, margin: 2 });
  }, []);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (tab === "info" && volunteer) setTimeout(() => generateQR(volunteer), 50);
    if (tab === "asistencia") fetchAttendance();
  }, [tab, volunteer]);

  async function fetchAll() {
    const [volRes, mgmtRes] = await Promise.all([
      api.get(`/volunteers/${id}`),
      api.get(`/management/volunteer/${id}`),
    ]);
    setVolunteer(volRes.data);
    setManagement(mgmtRes.data ?? []);
  }

  async function fetchAttendance() {
    setLoadingAtt(true);
    try {
      const [attRes, justRes] = await Promise.all([
        api.get(`/attendance/volunteer/${id}/history`),
        api.get("/justifications", { params: { volunteerId: id } }),
      ]);
      const justs = justRes.data as any[];
      setAttendance((attRes.data ?? []).map((a: any) => ({
        ...a, justification: justs.find(j => j.attendance?.id === a.id) ?? null,
      })));
    } finally { setLoadingAtt(false); }
  }

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas || !volunteer) return;
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d")!;
    tmp.width = 280; tmp.height = 320;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 280, 320);
    ctx.drawImage(canvas, 30, 15, 220, 220);
    ctx.fillStyle = "#000"; ctx.font = "bold 15px Arial"; ctx.textAlign = "center";
    ctx.fillText(volunteer.fullName, 140, 270);
    const link = document.createElement("a");
    link.download = `QR_${volunteer.fullName.replace(/\s+/g, "_")}.png`;
    link.href = tmp.toDataURL("image/png"); link.click();
  }

  async function uploadDocument() {
    if (!docFile) return alert("Selecciona un archivo");
    const form = new FormData();
    form.append("file", docFile); form.append("type", docType);
    await api.post(`/volunteers/${id}/documents/upload`, form);
    setDocFile(null); fetchAll();
  }

  async function downloadDocument(docId: number, type: string) {
    const res = await api.get(`/volunteers/${id}/documents/${docId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = `${type}_${volunteer.fullName.replace(/\s+/g, "_")}`; a.click();
    URL.revokeObjectURL(url);
  }

  async function activateVolunteer() {
    try { await api.post(`/volunteers/${id}/activate`); fetchAll(); }
    catch (e: any) { alert(e?.response?.data?.message ?? "Error al activar"); }
  }

  async function deactivateVolunteer() {
    if (!confirm("¿Desactivar este voluntario?")) return;
    try { await api.patch(`/volunteers/${id}/deactivate`); fetchAll(); }
    catch (e: any) { alert(e?.response?.data?.message ?? "Error al desactivar"); }
  }

  async function submitJustification() {
    if (!justReason.trim()) return alert("Ingresa un motivo");
    setJustSaving(true);
    try {
      const form = new FormData();
      form.append("attendanceId", String(justModal.id));
      form.append("reason", justReason);
      if (justFile) form.append("file", justFile);
      await api.post("/justifications", form);
      setJustModal(null); setJustReason(""); setJustFile(null);
      fetchAttendance();
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al enviar"); }
    finally { setJustSaving(false); }
  }

  async function submitRevert() {
    setRevertSaving(true);
    try {
      await api.patch(`/attendance/${revertModal.id}/revert`, { status: revertStatus });
      setRevertModal(null);
      fetchAttendance();
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al revertir"); }
    finally { setRevertSaving(false); }
  }

  if (!volunteer) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando voluntario...</p>
      </div>
    </div>
  );

  function getRevertOptions(currentStatus: string): ("puntual" | "tarde" | "falta")[] {
    const s = currentStatus?.toLowerCase();
    if (s === "puntual") return ["tarde", "falta"];
    if (s === "tarde")   return ["puntual", "falta"];
    if (s === "falta")   return ["puntual", "tarde"];
    return ["puntual", "tarde"];
  }

  const age           = calcAge(volunteer.birthDate);
  const isMinor       = age !== null && age < 18;
  const st            = getVolunteerStatus(volunteer);
  const photoUrl = volunteer.photoUrl
    ? volunteer.photoUrl.startsWith("http")
      ? volunteer.photoUrl
      : `${process.env.NEXT_PUBLIC_API_URL}/${volunteer.photoUrl}`
    : null;
  const requiredDocs  = getRequiredDocs(volunteer.birthDate);
  const uploadedTypes = (volunteer.documents ?? []).map((d: any) => d.type);
  const missingDocs   = requiredDocs.filter(r => !uploadedTypes.includes(r));
  const activeManagement = management.filter(m => m.isActive);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "info",       label: "Información", icon: <Users size={13} />         },
    { key: "docs",       label: "Documentos",  icon: <FileText size={13} />      },
    { key: "asistencia", label: "Asistencia",  icon: <ClipboardList size={13} /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen max-w-5xl" style={{ background: "#070d14", color: "#e2e8f0" }}>

      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors duration-200"
        style={{ color: "rgba(255,255,255,0.40)" }}
        onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
        <ArrowLeft size={15} /> Volver
      </button>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.15)", border: "2px solid rgba(255,255,255,0.10)" }}>
            {photoUrl
              ? <img src={photoUrl} alt="" className="w-full h-full object-cover"
                  onError={e => { (e.target as any).style.display = "none"; }} />
              : <span className="text-2xl font-bold" style={{ color: BLUE_L }}>
                  {volunteer.fullName?.charAt(0)?.toUpperCase()}
                </span>}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              {volunteer.fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                {st.label}
              </span>
              {isMinor && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24" }}>
                  Menor de edad
                </span>
              )}
              {activeManagement.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(155,109,255,0.15)", color: "#9b6dff" }}>
                  <Star size={10} /> Gestión
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción — solo no-admin */}
        {!isReadOnly && (
          <div className="flex gap-2 flex-shrink-0">
            {volunteer.status === "activo" ? (
              <button onClick={deactivateVolunteer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                <ToggleLeft size={13} /> Desactivar
              </button>
            ) : (
              <button onClick={activateVolunteer}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.20)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                <ToggleLeft size={13} /> Activar
              </button>
            )}
            <button onClick={() => router.push(`/admin/volunteers/${id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.25)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.12)")}>
              <Pencil size={13} /> Editar
            </button>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={tab === t.key
              ? { background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 2px 8px rgba(46,111,168,0.35)" }
              : { color: "rgba(255,255,255,0.40)" }}
            onMouseEnter={e => { if (tab !== t.key) (e.currentTarget.style.color = "rgba(255,255,255,0.70)"); }}
            onMouseLeave={e => { if (tab !== t.key) (e.currentTarget.style.color = "rgba(255,255,255,0.40)"); }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: INFO ── */}
      {tab === "info" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative overflow-hidden p-5 flex flex-col items-center gap-3" style={glass(BLUE)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
              <h2 className="font-semibold text-sm self-start flex items-center gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
                <QrCode size={14} color={BLUE_L} /> Código QR
              </h2>
              <div className="p-2 rounded-xl" style={{ background: "#fff" }}>
                <canvas ref={canvasRef} className="rounded-lg block" />
              </div>
              <button onClick={downloadQR}
                className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 4px 16px rgba(46,111,168,0.30)" }}>
                <Download size={14} /> Descargar QR
              </button>
            </div>

            <div className="md:col-span-2 relative overflow-hidden p-5 space-y-4" style={glass()}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE_L},transparent)` }} />
              <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>Datos personales</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  ["DNI", volunteer.dni],
                  ["Edad", age ? `${age} años` : "—"],
                  ["Teléfono", volunteer.phone],
                  ["Emergencia", volunteer.emergencyContact],
                  ["Sangre", volunteer.bloodType],
                  ["Nacimiento", volunteer.birthDate?.substring(0, 10)],
                  ["Género", volunteer.gender === "M" ? "Masculino" : "Femenino"],
                  ["Módulo", volunteer.module?.name],
                  ["Sede", volunteer.sede?.name],
                  ["Periodo ingreso", volunteer.joinPeriod],
                  ["Estudiante", volunteer.isStudent ? "Sí" : "No"],
                  volunteer.isStudent && ["Institución", volunteer.institution],
                ].filter(Boolean).map(([label, value]: any) => (
                  <div key={label}>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{label}</p>
                    <p className="font-medium text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>{value || "—"}</p>
                  </div>
                ))}
              </div>
              {missingDocs.length > 0 && volunteer.status !== "activo" && (
                <div className="p-3 rounded-xl" style={{ background: "rgba(232,114,42,0.10)", border: "1px solid rgba(232,114,42,0.25)" }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: ORANGE }}>Documentos pendientes:</p>
                  <div className="flex flex-wrap gap-1">
                    {missingDocs.map(d => (
                      <span key={d} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(232,114,42,0.15)", color: ORANGE }}>{DOC_LABELS[d]}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeManagement.length > 0 && (
            <div className="relative overflow-hidden p-5" style={glass("#9b6dff")}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#9b6dff,transparent)" }} />
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
                <Star size={14} color="#9b6dff" /> Equipo de Gestión
              </h2>
              <div className="space-y-3">
                {activeManagement.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl space-y-2"
                    style={{ background: "rgba(155,109,255,0.08)", border: "1px solid rgba(155,109,255,0.18)" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {m.period && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                          style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L }}>
                          <Calendar size={10} /> {m.period.name}
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={m.isActive
                          ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                        {m.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {m.positions?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.positions.map((p: any) => (
                          <span key={p.id} className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: "rgba(155,109,255,0.15)", color: "#9b6dff" }}>
                            <Award size={9} /> {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.notes && <p className="text-xs italic" style={{ color: "rgba(255,255,255,0.40)" }}>{m.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DOCUMENTOS ── */}
      {tab === "docs" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl flex items-center gap-2 text-xs"
            style={{ background: isMinor ? "rgba(251,191,36,0.08)" : "rgba(46,111,168,0.08)", border: `1px solid ${isMinor ? "rgba(251,191,36,0.20)" : "rgba(46,111,168,0.20)"}` }}>
            <span style={{ color: isMinor ? "#fbbf24" : BLUE_L }}>
              {isMinor ? "⚠️ Menor de edad" : "✓ Mayor de edad"} —
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>
              Requiere: {requiredDocs.map(d => DOC_LABELS[d]).join(", ")}
            </span>
          </div>
          <div className="relative overflow-hidden p-5" style={glass(BLUE)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
              <FileText size={14} color={BLUE_L} /> Documentos subidos
            </h2>
            <div className="mb-4 space-y-2">
              {requiredDocs.map(docKey => {
                const uploaded = uploadedTypes.includes(docKey);
                const doc = volunteer.documents?.find((d: any) => d.type === docKey);
                return (
                  <div key={docKey} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: uploaded ? "rgba(74,222,128,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${uploaded ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)"}` }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: uploaded ? "#4ade80" : "#f87171", fontSize: 16 }}>{uploaded ? "✓" : "✗"}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{DOC_LABELS[docKey]}</p>
                        {doc && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>Subido el {new Date(doc.uploadedAt).toLocaleDateString("es-PE")}</p>}
                      </div>
                    </div>
                    {doc && (
                      <button onClick={() => downloadDocument(doc.id, doc.type)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                        <Download size={12} /> Descargar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subir documento — solo no-admin */}
            {!isReadOnly && (
              <div className="pt-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Subir documento</h3>
                <div className="flex gap-2 flex-wrap">
                  <select style={{ ...IS, width: "auto" }} value={docType} onChange={e => setDocType(e.target.value)}>
                    {requiredDocs.map(d => (
                      <option key={d} value={d} style={{ background: "#0d1424" }}>{DOC_LABELS[d]}</option>
                    ))}
                  </select>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.55)" }}
                    onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                  <button onClick={uploadDocument}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff" }}>
                    Subir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ASISTENCIA ── */}
      {tab === "asistencia" && (
        <div className="relative overflow-hidden" style={glass()}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
          <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}>
              <ClipboardList size={14} color={BLUE_L} /> Historial de asistencia
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>
              Las faltas y tardanzas pueden ser justificadas
              {canRevert && " · Las faltas pueden ser revertidas manualmente"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Sesión", "Fecha", "Estado", "Hora registro", "Justificación", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingAtt ? (
                  <tr><td colSpan={6} className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando...</td></tr>
                ) : attendance.length === 0 ? (
                  <tr><td colSpan={6} className="text-center p-8 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin registros</td></tr>
                ) : attendance.map((a: any, index: number) => {
                  const statusUp      = a.status?.toUpperCase();
                  const canJustifyRow = canJustify && (statusUp === "FALTA" || statusUp === "TARDE") && !a.justification;
                  const canRevertRow = canRevert;
                  const just = a.justification;
                  return (
                    <tr key={index}
                      style={{ borderBottom: index < attendance.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td className="px-4 py-3 font-medium text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{a.sessionName ?? a.session?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>{a.date ?? a.session?.date ?? "—"}</td>
                      <td className="px-4 py-3">
                        {statusUp === "PUNTUAL" && <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}><CheckCircle2 size={10} /> Puntual</span>}
                        {statusUp === "TARDE"   && <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(232,114,42,0.12)", color: ORANGE }}><Clock size={10} /> Tarde</span>}
                        {statusUp === "FALTA"   && <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}><XCircle size={10} /> Falta</span>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                        {a.registeredAt ? new Date(a.registeredAt).toLocaleTimeString("es-PE") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {just ? (
                          <div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: STATUS_JUST[just.status]?.bg, color: STATUS_JUST[just.status]?.color }}>
                              {STATUS_JUST[just.status]?.label}
                            </span>
                            {just.reviewNote && <p className="text-xs mt-1 italic" style={{ color: "rgba(255,255,255,0.35)" }}>{just.reviewNote}</p>}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>{statusUp === "PUNTUAL" ? "—" : "Sin justificación"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {canJustifyRow && (
                            <button onClick={() => { setJustModal(a); setJustReason(""); setJustFile(null); }}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200"
                              style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                              Justificar
                            </button>
                          )}
                          {canRevertRow && (
                            <button onClick={() => { setRevertModal(a); setRevertStatus(getRevertOptions(a.status)[0]); }}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all duration-200"
                              style={{ background: "rgba(74,222,128,0.10)", color: GREEN, border: "1px solid rgba(74,222,128,0.22)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                              <RotateCcw size={11} /> Revertir
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
      )}

      {/* ── MODAL JUSTIFICACIÓN ── */}
      {justModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setJustModal(null)}>
          <div className="w-full max-w-md relative overflow-hidden"
            style={{ ...glass(BLUE_L), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Agregar justificación</h2>
              <button onClick={() => setJustModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl space-y-1.5 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Sesión:</span> <b style={{ color: "#f1f5f9" }}>{justModal.sessionName ?? justModal.session?.name}</b></p>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Fecha:</span> <span style={{ color: "rgba(255,255,255,0.65)" }}>{justModal.date ?? justModal.session?.date}</span></p>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 uppercase tracking-widest block" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Motivo <span style={{ color: "#f87171" }}>*</span>
                </label>
                <textarea rows={4} placeholder="Explica el motivo..."
                  value={justReason} onChange={e => setJustReason(e.target.value)}
                  style={{ ...IS, resize: "none" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(46,111,168,0.60)"; e.target.style.boxShadow = "0 0 0 3px rgba(46,111,168,0.12)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-2 uppercase tracking-widest block" style={{ color: "rgba(255,255,255,0.40)" }}>
                  <Paperclip size={11} className="inline mr-1" /> Archivo de sustento (opcional)
                </label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}
                  onChange={e => setJustFile(e.target.files?.[0] ?? null)} />
                {justFile && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#4ade80" }}><Paperclip size={10} /> {justFile.name}</p>}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setJustModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitJustification} disabled={justSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: justSaving ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", cursor: justSaving ? "not-allowed" : "pointer" }}>
                  {justSaving && <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />}
                  {justSaving ? "Enviando..." : "Enviar justificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL REVERTIR ── */}
      {revertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setRevertModal(null)}>
          <div className="w-full max-w-sm relative overflow-hidden"
            style={{ ...glass("#4ade80"), borderRadius: "20px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GREEN},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "#f1f5f9" }}>
                <RotateCcw size={14} color={GREEN} /> Cambiar estado
              </h2>
              <button onClick={() => setRevertModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl space-y-1.5 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Sesión:</span> <b style={{ color: "#f1f5f9" }}>{revertModal.sessionName}</b></p>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Fecha:</span> <span style={{ color: "rgba(255,255,255,0.65)" }}>{revertModal.date}</span></p>
                <p className="flex items-center gap-1.5"><span style={{ color: "rgba(255,255,255,0.35)" }}>Estado actual:</span>
                  {revertModal.status?.toUpperCase() === "PUNTUAL" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}>Puntual</span>}
                  {revertModal.status?.toUpperCase() === "TARDE"   && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(232,114,42,0.12)", color: ORANGE }}>Tarde</span>}
                  {revertModal.status?.toUpperCase() === "FALTA"   && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>Falta</span>}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 uppercase tracking-widest block" style={{ color: "rgba(255,255,255,0.40)" }}>Cambiar a</label>
                <div className="flex gap-2">
                  {getRevertOptions(revertModal.status).map(opt => {
                    const selected = revertStatus === opt;
                    const optStyle = !selected
                      ? { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.09)" }
                      : opt === "puntual"
                        ? { background: "rgba(74,222,128,0.18)",  color: "#4ade80",  borderColor: "rgba(74,222,128,0.45)"  }
                        : opt === "tarde"
                        ? { background: "rgba(250,204,21,0.18)",  color: "#facc15",  borderColor: "rgba(250,204,21,0.45)"  }
                        : { background: "rgba(248,113,113,0.18)", color: "#f87171",  borderColor: "rgba(248,113,113,0.45)" };
                    return (
                      <button key={opt} onClick={() => setRevertStatus(opt)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border"
                        style={optStyle}>
                        {opt === "puntual" && <><CheckCircle2 size={13} /> Puntual</>}
                        {opt === "tarde"   && <><Clock size={13} /> Tarde</>}
                        {opt === "falta"   && <><XCircle size={13} /> Falta</>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRevertModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  Cancelar
                </button>
                <button onClick={submitRevert} disabled={revertSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: revertSaving ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.20)", color: GREEN, border: "1px solid rgba(74,222,128,0.35)", cursor: revertSaving ? "not-allowed" : "pointer" }}>
                  {revertSaving && <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(74,222,128,0.3)", borderTopColor: GREEN }} />}
                  {revertSaving ? "Guardando..." : "Confirmar cambio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}