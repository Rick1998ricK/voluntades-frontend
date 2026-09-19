'use client';

import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import {
  QrCode, Download, CheckCircle, AlertCircle,
  ClipboardList, FileCheck,
  Clock, XCircle, X, Search, UserCheck, CreditCard, ScanLine, Filter,
  ChevronRight, ChevronLeft, BarChart2, RotateCcw, CheckCircle2,
} from "lucide-react";
import DownloadCards from "@/components/DownloadCard";

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

const dropdownStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 9999,
  background: "#0f1c2e", border: "1px solid rgba(46,111,168,0.40)", borderRadius: "12px",
  maxHeight: 220, overflowY: "auto", boxShadow: "0 24px 56px rgba(0,0,0,0.80)",
};

const IS: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px", padding: "9px 12px", color: "#f1f5f9", fontSize: "13px",
  outline: "none", transition: "all 0.2s", colorScheme: "dark" as const,
};
const fi = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(46,111,168,0.60)"; e.target.style.boxShadow="0 0 0 3px rgba(46,111,168,0.12)"; e.target.style.background="rgba(255,255,255,0.07)"; };
const fo = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(255,255,255,0.10)"; e.target.style.boxShadow="none"; e.target.style.background="rgba(255,255,255,0.05)"; };

// Opciones de revertir según el estado actual
function getRevertOptions(currentStatus: string): ("puntual" | "tarde" | "falta")[] {
  const s = currentStatus?.toLowerCase();
  if (s === "puntual") return ["tarde", "falta"];
  if (s === "tarde")   return ["puntual", "falta"];
  if (s === "falta")   return ["puntual", "tarde"];
  return ["puntual", "tarde"];
}

function Autocomplete({ placeholder, fetchUrl, value, onSelect, mapItems }: {
  placeholder: string; fetchUrl: string; value: string;
  onSelect: (opt: { id: number; label: string } | null) => void;
  mapItems?: (item: any) => { id: number; label: string };
}) {
  const [query, setQuery]     = useState(value);
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!query.trim()) { setOptions([]); setShow(false); return; }
      search(query.trim());
    }, 300);
    return () => clearTimeout(delay);
  }, [query]);

  const defaultMap = (item: any) => ({ id: item.id, label: item.fullName || item.name || item.user?.name || 'Sin nombre' });

  const search = async (val: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${fetchUrl}?search=${encodeURIComponent(val)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!Array.isArray(data)) { setOptions([]); return; }
      setOptions(data.map(mapItems ?? defaultMap));
      setShow(true);
    } catch { setOptions([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: "relative", zIndex: 50 }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)", pointerEvents: "none" }} />
        <input ref={inputRef} type="text" value={query}
          onChange={e => { setQuery(e.target.value); onSelect(null); }}
          placeholder={placeholder} style={{ ...IS, paddingLeft: 30 }}
          onFocus={fi} onBlur={e => { fo(e); setTimeout(() => setShow(false), 150); }}
          autoComplete="off" />
      </div>
      {show && (
        <div style={dropdownStyle}>
          {loading && <div className="px-3 py-2.5 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>Buscando...</div>}
          {!loading && options.length === 0 && <div className="px-3 py-2.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Sin resultados</div>}
          {!loading && options.map(opt => (
            <div key={opt.id} onMouseDown={e => { e.preventDefault(); onSelect(opt); setQuery(opt.label); setShow(false); }}
              className="px-3 py-2.5 text-xs cursor-pointer"
              style={{ color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.25)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'puntual') return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.14)", color: "#4ade80" }}><CheckCircle size={10} /> Puntual</span>;
  if (s === 'tarde')   return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(250,204,21,0.14)", color: "#facc15" }}><Clock size={10} /> Tarde</span>;
  if (s === 'falta')   return <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.14)", color: "#f87171" }}><XCircle size={10} /> Falta</span>;
  return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
}

function JustBadge({ just }: { just: { status: string; reason: string } | null }) {
  if (!just) return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
  const cfg = just.status === 'aprobado'  ? { bg: "rgba(74,222,128,0.14)",  color: "#4ade80",  label: "✓ Aprobado"  } :
              just.status === 'rechazado' ? { bg: "rgba(248,113,113,0.14)", color: "#f87171",  label: "✗ Rechazado" } :
                                            { bg: "rgba(250,204,21,0.14)",  color: "#facc15",  label: "⏳ Pendiente" };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
      {just.reason && <span className="text-xs italic max-w-[160px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{just.reason}</span>}
    </div>
  );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]             = useState<'dni' | 'qr'>('dni');
  const [sessions, setSessions]     = useState<any[]>([]);
  const [sessionId, setSessionId]   = useState<number | null>(null);
  const [dni, setDni]               = useState('');
  const [volunteer, setVolunteer]   = useState<any>(null);
  const [searching, setSearching]   = useState(false);
  const [registering, setRegistering] = useState(false);
  const [result, setResult]         = useState<{ type: 'ok' | 'err'; text: string; status?: string } | null>(null);
  const [scanning, setScanning]     = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    
    api.get('/sessions').then(res => {
      const active = (res.data ?? []).filter((s: any) => s.isActive);
      setSessions(active);
      if (active.length === 1) setSessionId(active[0].id);
    }).catch(() => {});
    
    return () => stopCamera();
  }, []);

  async function searchByDni() {
    if (!dni.trim() || dni.length < 6) return;
    setSearching(true); setVolunteer(null); setResult(null);
    try { const res = await api.get(`/volunteers/by-dni/${dni.trim()}`); setVolunteer(res.data); }
    catch { setResult({ type: 'err', text: 'No se encontró ningún voluntario con ese DNI' }); }
    finally { setSearching(false); }
  }

  async function registerDni() {
    if (!sessionId) return setResult({ type: 'err', text: 'Selecciona una sesión activa' });
    if (!volunteer) return setResult({ type: 'err', text: 'Busca un voluntario primero' });
    setRegistering(true); setResult(null);
    try {
      const res = await api.post('/attendance/dni', { dni: volunteer.dni, sessionId });
      setResult({ type: 'ok', text: '✓ Asistencia registrada correctamente', status: res.data?.status });
      setDni(''); setVolunteer(null);
    } catch (e: any) { setResult({ type: 'err', text: e?.response?.data?.message ?? 'Error al registrar' }); }
    finally { setRegistering(false); }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true); scanQR();
    } catch { setResult({ type: 'err', text: 'No se pudo acceder a la cámara' }); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setScanning(false);
  }

  async function scanQR() {
    if (!sessionId) { setResult({ type: 'err', text: 'Selecciona una sesión primero' }); return; }
    // @ts-ignore
    if (!('BarcodeDetector' in window)) { setResult({ type: 'err', text: 'Tu navegador no soporta escaneo QR.' }); stopCamera(); return; }
    // @ts-ignore
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const interval = setInterval(async () => {
      if (!videoRef.current || !streamRef.current) { clearInterval(interval); return; }
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          clearInterval(interval); stopCamera();
          setRegistering(true); setResult(null);
          try {
            const res = await api.post('/attendance/scan', { qrToken: codes[0].rawValue, sessionId });
            setResult({ type: 'ok', text: '✓ Asistencia registrada correctamente', status: res.data?.status });
          } catch (e: any) { setResult({ type: 'err', text: e?.response?.data?.message ?? 'Error al registrar' }); }
          finally { setRegistering(false); }
        }
      } catch {}
    }, 500);
  }

  const photoUrl = volunteer?.photoUrl
    ? volunteer.photoUrl.startsWith("http") ? volunteer.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${volunteer.photoUrl}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="w-full max-w-lg relative overflow-hidden"
        style={{ ...glass(BLUE), borderRadius: "22px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${GREEN},transparent)` }} />
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(46,111,168,0.15)" }}><UserCheck size={16} color={BLUE_L} /></div>
            <div><p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Registrar asistencia</p><p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Sesión activa</p></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}><X size={14} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Sesión activa *</label>
            {sessions.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}>
                <AlertCircle size={13} /> No hay sesiones activas
              </div>
            ) : (
              <select value={sessionId ?? ''} onChange={e => setSessionId(+e.target.value)} style={{ ...IS, cursor: "pointer" }} onFocus={fi} onBlur={fo}>
                <option value="" disabled>Selecciona una sesión...</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name} — {s.date}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            {[{ key: 'dni', icon: <CreditCard size={13} />, label: 'Por DNI' }, { key: 'qr', icon: <QrCode size={13} />, label: 'Escanear QR' }].map(tab => (
              <button key={tab.key} onClick={() => { setMode(tab.key as any); setResult(null); setVolunteer(null); setDni(''); stopCamera(); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: mode === tab.key ? `linear-gradient(135deg,${BLUE},${BLUE_L})` : "rgba(255,255,255,0.05)", color: mode === tab.key ? "#fff" : "rgba(255,255,255,0.45)", border: mode === tab.key ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          {mode === 'dni' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input type="text" placeholder="Ej: 12345678" maxLength={8} style={IS} value={dni}
                  onChange={e => { setDni(e.target.value.replace(/\D/g, '')); setVolunteer(null); setResult(null); }}
                  onFocus={fi} onBlur={fo} onKeyDown={e => e.key === 'Enter' && searchByDni()} />
                <button onClick={searchByDni} disabled={searching || dni.length < 6}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                  style={{ background: searching || dni.length < 6 ? "rgba(46,111,168,0.25)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", cursor: searching || dni.length < 6 ? "not-allowed" : "pointer" }}>
                  {searching ? <div className="w-3.5 h-3.5 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <Search size={13} />} Buscar
                </button>
              </div>
              {volunteer && (
                <div className="rounded-2xl p-4" style={{ background: "rgba(46,111,168,0.08)", border: "1px solid rgba(46,111,168,0.25)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: `${BLUE}20` }}>
                      {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-xl font-bold" style={{ color: BLUE_L }}>{volunteer.fullName?.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{volunteer.fullName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>DNI: {volunteer.dni}</p>
                      {volunteer.module?.name && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{volunteer.module.name}{volunteer.sede?.name ? ` · ${volunteer.sede.name}` : ''}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {mode === 'qr' && (
            <div className="space-y-3">
              {!scanning ? (
                <button onClick={startCamera} disabled={!sessionId}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold"
                  style={{ background: !sessionId ? "rgba(255,255,255,0.04)" : "rgba(46,111,168,0.12)", color: !sessionId ? "rgba(255,255,255,0.25)" : BLUE_L, border: `1px dashed ${!sessionId ? "rgba(255,255,255,0.10)" : "rgba(46,111,168,0.40)"}`, cursor: !sessionId ? "not-allowed" : "pointer" }}>
                  <ScanLine size={18} /> Abrir cámara para escanear QR
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden" style={{ background: "#000", aspectRatio: "4/3" }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div style={{ width: 180, height: 180, border: `2px solid ${GREEN}`, borderRadius: 12, boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)` }} />
                    </div>
                  </div>
                  <button onClick={stopCamera} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>Cancelar escaneo</button>
                </div>
              )}
            </div>
          )}
          {result && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
              style={result.type === 'ok' ? { background: "rgba(74,222,128,0.12)", color: GREEN, border: "1px solid rgba(74,222,128,0.25)" } : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>
              {result.type === 'ok' ? <CheckCircle size={14} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />}
              <div><p>{result.text}</p>{result.status && <p className="mt-1 font-bold" style={{ color: result.status === 'puntual' ? GREEN : "#facc15" }}>Estado: {result.status === 'puntual' ? '✓ Puntual' : '⏰ Tarde'}</p>}</div>
            </div>
          )}
          {mode === 'dni' && (
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>Cerrar</button>
              <button onClick={registerDni} disabled={registering || !volunteer || !sessionId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: registering || !volunteer || !sessionId ? "rgba(46,111,168,0.25)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", cursor: registering || !volunteer || !sessionId ? "not-allowed" : "pointer" }}>
                {registering ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <UserCheck size={14} />}
                {registering ? 'Registrando...' : 'Registrar asistencia'}
              </button>
            </div>
          )}
          {mode === 'qr' && !scanning && (
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>Cerrar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// VISTA VOLUNTARIO
// ══════════════════════════════════════════════════════════════
function VolunteerAttendanceView() {
  const { user } = useAuth();
  const [rows, setRows]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [justModal, setJustModal] = useState<any>(null);
  const [reason, setReason]     = useState("");
  const [file, setFile]         = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    if (!user?.id) return;
    try {
      setLoading(true);
      const volRes = await api.get(`/volunteers/by-user/${user.id}`);
      const res = await api.get(`/attendance/volunteer/${volRes.data.id}/history`);
      setRows(res.data ?? []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }

  async function submitJustification() {
    if (!reason.trim()) return setMsg({ type: "err", text: "El motivo es obligatorio" });
    setSaving(true); setMsg(null);
    try {
      const form = new FormData();
      form.append("attendanceId", String(justModal.id));
      form.append("reason", reason);
      if (file) form.append("file", file);
      await api.post("/justifications", form, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg({ type: "ok", text: "Justificación enviada correctamente" });
      setReason(""); setFile(null);
      setTimeout(() => { setJustModal(null); setMsg(null); loadHistory(); }, 1500);
    } catch (e: any) { setMsg({ type: "err", text: e?.response?.data?.message ?? "Error al enviar" }); }
    finally { setSaving(false); }
  }

  const justBadge = (row: any) => {
    if (!row.justification) return <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>—</span>;
    const cfg = row.justification.status === "aprobado"  ? { bg: "rgba(74,222,128,0.14)",  color: "#4ade80",  label: "✓ Aprobado"  } :
                row.justification.status === "rechazado" ? { bg: "rgba(248,113,113,0.14)", color: "#f87171",  label: "✗ Rechazado" } :
                                                           { bg: "rgba(250,204,21,0.14)",  color: "#facc15",  label: "⏳ Pendiente" };
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
  };

  const canJustify = (row: any) => {
    const s = row.status?.toLowerCase();
    if (s !== "falta" && s !== "tarde") return false;
    return !row.justification || row.justification.status === "rechazado";
  };

  const puntuales = rows.filter(r => r.status?.toLowerCase() === "puntual").length;
  const tardes    = rows.filter(r => r.status?.toLowerCase() === "tarde").length;
  const faltas    = rows.filter(r => r.status?.toLowerCase() === "falta").length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Mi asistencia</h1>
        <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Historial de tus registros de asistencia</p>
      </div>
      <DownloadCards />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{ label: "Total", value: rows.length, color: "rgba(255,255,255,0.80)", accent: BLUE }, { label: "Puntuales", value: puntuales, color: "#4ade80", accent: "#4ade80" }, { label: "Tardanzas", value: tardes, color: "#facc15", accent: "#facc15" }, { label: "Faltas", value: faltas, color: "#f87171", accent: "#f87171" }].map((c, i) => (
          <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(c.accent)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${c.accent},transparent)` }} />
            <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{c.label}</p>
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden" style={glass(BLUE)}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        {loading ? (
          <div className="flex items-center justify-center p-16"><div className="text-center space-y-3"><div className="w-10 h-10 rounded-full mx-auto animate-spin" style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} /><p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando asistencias...</p></div></div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3"><ClipboardList size={32} color="rgba(46,111,168,0.25)" /><p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No tienes registros de asistencia aún</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  {["Sesión", "Fecha", "Estado", "Justificación", "Acción"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3 font-semibold" style={{ color: "#f1f5f9" }}>{row.sessionName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{row.date ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3">{justBadge(row)}</td>
                    <td className="px-4 py-3">
                      {canJustify(row) && (
                        <button onClick={() => { setJustModal(row); setReason(""); setFile(null); setMsg(null); }}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                          style={{ background: "rgba(232,114,42,0.12)", color: ORANGE, border: "1px solid rgba(232,114,42,0.22)" }}>
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
      {justModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }} onClick={() => setJustModal(null)}>
          <div className="w-full max-w-md relative overflow-hidden" style={{ ...glass(ORANGE), borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ORANGE},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Justificar {justModal.status?.toLowerCase()}</span>
              <button onClick={() => setJustModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}><X size={14} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Sesión: <span style={{ color: "#f1f5f9" }}>{justModal.sessionName}</span></p>
                <p style={{ color: "rgba(255,255,255,0.40)" }}>Fecha: <span style={{ color: "#f1f5f9" }}>{justModal.date}</span></p>
              </div>
              {msg && <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={msg.type === "ok" ? { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.22)" } : { background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.22)" }}>{msg.type === "ok" ? <CheckCircle size={13} /> : <AlertCircle size={13} />} {msg.text}</div>}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Motivo *</label>
                <textarea rows={3} placeholder="Explica el motivo..." style={{ ...IS, resize: "none" }} value={reason} onChange={e => setReason(e.target.value)} onFocus={fi} onBlur={fo} />
              </div>
              <div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileRef.current?.click()} className="w-full py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: file ? "#4ade80" : "rgba(255,255,255,0.45)", border: `1px solid ${file ? "rgba(74,222,128,0.30)" : "rgba(255,255,255,0.10)"}` }}>
                  {file ? `📎 ${file.name}` : "Seleccionar archivo (opcional)"}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setJustModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>Cancelar</button>
                <button onClick={submitJustification} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: saving ? "rgba(232,114,42,0.30)" : `linear-gradient(135deg,${ORANGE},#f5a35a)`, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <FileCheck size={14} />}
                  {saving ? "Enviando..." : "Enviar justificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Filters { volunteerId?: number; moduleId?: number; sedeId?: number; sessionId?: number; startDate?: string; endDate?: string; }
interface Stats { total: number; presentes: number; tarde: number; faltas: number; porcentaje: number; }
interface Pagination { total: number; page: number; limit: number; totalPages: number; }
interface Row { id: number; volunteer: string; dni: string; module: string; sede: string; session: string; sessionDate: string; status: string; registeredBy: string; createdAt: string; justification: { status: string; reason: string } | null; }

export default function AttendancePage() {
  const { user: me } = useAuth();
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const isReadOnly  = me?.role === "admin";
  const canRegister = me?.role === "super_admin" || me?.role === "registrador";
  const canRevert   = me?.role === "super_admin" || me?.role === "registrador";

  if (me?.role === "voluntario" || me?.role === "xpress") return <VolunteerAttendanceView />;

  const [filters,      setFilters]      = useState<Filters>({});
  const [rows,         setRows]         = useState<Row[]>([]);
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [pagination,   setPagination]   = useState<Pagination | null>(null);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [applied,      setApplied]      = useState(false);
  const [periods,      setPeriods]      = useState<any[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("");
  const [labels,       setLabels]       = useState({ volunteer: '', module: '', sede: '', session: '' });
  const [revertModal,  setRevertModal]  = useState<Row | null>(null);
  const [revertStatus, setRevertStatus] = useState<"puntual" | "tarde" | "falta">("puntual");
  const [revertSaving, setRevertSaving] = useState(false);
  const LIMIT = 50;

  const fetchReport = async (f: Filters, page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const clean = Object.fromEntries(Object.entries(f).filter(([_, v]) => v !== undefined && v !== ''));
      const query = new URLSearchParams({ ...clean as any, page: String(page), limit: String(LIMIT) }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/report?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRows(data.rows || []); setStats(data.stats || null); setPagination(data.pagination || null);
      setCurrentPage(page); setApplied(true);
    } catch { setRows([]); setStats(null); setPagination(null); }
    finally { setLoading(false); }
  };

  async function submitRevert() {
    if (!revertModal) return;
    setRevertSaving(true);
    try {
      await api.patch(`/attendance/${revertModal.id}/revert`, { status: revertStatus });
      setRevertModal(null);
      fetchReport(filters, currentPage);
    } catch (e: any) { alert(e?.response?.data?.message ?? "Error al revertir"); }
    finally { setRevertSaving(false); }
  }

  useEffect(() => {
    api.get("/periods").then(r => {
      setPeriods(r.data);
      if (r.data.length > 0) {
        const last = r.data.reduce((prev: any, curr: any) => curr.id > prev.id ? curr : prev, r.data[0]);
        setFilterPeriod(String(last.id));
        setFilters(p => ({ ...p, startDate: last.startDate, endDate: last.endDate }));
      }
    }).catch(() => {});
  }, []);

  const handleApply      = () => { setCurrentPage(1); fetchReport(filters, 1); };
  const handlePageChange = (page: number) => { fetchReport(filters, page); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleClear      = () => { setFilters({}); setLabels({ volunteer: '', module: '', sede: '', session: '' }); setRows([]); setStats(null); setPagination(null); setApplied(false); setCurrentPage(1); };
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const clean = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== undefined && v !== ""));
      const query = new URLSearchParams({ ...clean as any, page: "1", limit: "9999" }).toString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/report?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const allRows: Row[] = data.rows || [];

      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];

      // Título
      wsData.push(["REPORTE DE ASISTENCIA - VOLUNTADES+"]);
      wsData.push([`Generado: ${new Date().toLocaleDateString("es-PE")}`]);
      wsData.push([]);

      // Encabezados
      wsData.push(["N°", "NOMBRE COMPLETO", "DNI", "MÓDULO", "SEDE", "SESIÓN", "FECHA", "ESTADO", "JUSTIFICACIÓN", "REGISTRADO POR"]);

      // Agrupar por módulo
      const byModule: Record<string, Row[]> = {};
      allRows.forEach(row => {
        const mod = row.module || "Sin módulo";
        if (!byModule[mod]) byModule[mod] = [];
        byModule[mod].push(row);
      });

      let n = 1;
      Object.entries(byModule).forEach(([mod, rows]) => {
        // Fila de módulo
        wsData.push([`MÓDULO: ${mod.toUpperCase()}`]);
        rows.forEach(row => {
          const estado = row.status === "puntual" ? "P" : row.status === "tarde" ? "T" : "F";
          const just = row.justification
            ? `${row.justification.status?.toUpperCase()} — ${row.justification.reason}`
            : "—";
          wsData.push([
            n++,
            row.volunteer,
            row.dni || "—",
            row.module,
            row.sede,
            row.session,
            row.sessionDate,
            estado,
            just,
            row.registeredBy || "—",
          ]);
        });
        wsData.push([]); // espacio entre módulos
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Anchos de columna
      ws["!cols"] = [
        { wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 20 },
        { wch: 22 }, { wch: 25 }, { wch: 14 }, { wch: 8 },
        { wch: 35 }, { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Asistencia");

      // Hoja resumen
      const resumen: any[][] = [];
      resumen.push(["RESUMEN POR MÓDULO"]);
      resumen.push([]);
      resumen.push(["MÓDULO", "TOTAL", "PUNTUALES", "TARDANZAS", "FALTAS", "% ASISTENCIA"]);

      Object.entries(byModule).forEach(([mod, rows]) => {
        const total     = rows.length;
        const puntuales = rows.filter(r => r.status === "puntual").length;
        const tardanzas = rows.filter(r => r.status === "tarde").length;
        const faltas    = rows.filter(r => r.status === "falta").length;
        const pct       = total > 0 ? `${Math.round(((puntuales + tardanzas) / total) * 100)}%` : "0%";
        resumen.push([mod, total, puntuales, tardanzas, faltas, pct]);
      });

      // Total general
      resumen.push([]);
      resumen.push([
        "TOTAL GENERAL",
        allRows.length,
        allRows.filter(r => r.status === "puntual").length,
        allRows.filter(r => r.status === "tarde").length,
        allRows.filter(r => r.status === "falta").length,
        `${Math.round(((allRows.filter(r => r.status === "puntual").length + allRows.filter(r => r.status === "tarde").length) / allRows.length) * 100)}%`,
      ]);

      const wsRes = XLSX.utils.aoa_to_sheet(resumen);
      wsRes["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRes, "Resumen");

      XLSX.writeFile(wb, `reporte-asistencia-${new Date().toLocaleDateString("es-PE").replace(/\//g, "-")}.xlsx`);
    } catch { alert("Error al exportar"); }
  };

  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  // Colores para cada opción de revertir
  const revertOptionStyle = (opt: string, selected: boolean) => {
    if (!selected) return { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", borderColor: "rgba(255,255,255,0.09)" };
    if (opt === "puntual") return { background: "rgba(74,222,128,0.18)",  color: GREEN,  borderColor: "rgba(74,222,128,0.45)"  };
    if (opt === "tarde")   return { background: "rgba(250,204,21,0.18)",  color: "#facc15", borderColor: "rgba(250,204,21,0.45)"  };
    if (opt === "falta")   return { background: "rgba(248,113,113,0.18)", color: "#f87171", borderColor: "rgba(248,113,113,0.45)" };
    return {};
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      {showRegisterModal && <RegisterModal onClose={() => setShowRegisterModal(false)} />}

      {/* ── MODAL REVERTIR ── */}
      {revertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }} onClick={() => setRevertModal(null)}>
          <div className="w-full max-w-sm relative overflow-hidden" style={{ ...glass("#4ade80"), borderRadius: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GREEN},transparent)` }} />
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: "#f1f5f9" }}><RotateCcw size={14} color={GREEN} /> Cambiar estado</h2>
              <button onClick={() => setRevertModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.50)" }}><X size={14} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl space-y-1.5 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Voluntario:</span> <b style={{ color: "#f1f5f9" }}>{revertModal.volunteer}</b></p>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Sesión:</span> <span style={{ color: "rgba(255,255,255,0.65)" }}>{revertModal.session}</span></p>
                <p><span style={{ color: "rgba(255,255,255,0.35)" }}>Estado actual:</span> <StatusBadge status={revertModal.status} /></p>
              </div>
              <div>
                <label className="text-xs font-medium mb-2 uppercase tracking-widest block" style={{ color: "rgba(255,255,255,0.40)" }}>Cambiar a</label>
                <div className="flex gap-2">
                  {getRevertOptions(revertModal.status).map(opt => (
                    <button key={opt} onClick={() => setRevertStatus(opt)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border"
                      style={revertOptionStyle(opt, revertStatus === opt)}>
                      {opt === "puntual" && <><CheckCircle2 size={13} /> Puntual</>}
                      {opt === "tarde"   && <><Clock size={13} /> Tarde</>}
                      {opt === "falta"   && <><XCircle size={13} /> Falta</>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRevertModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}>Cancelar</button>
                <button onClick={submitRevert} disabled={revertSaving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: revertSaving ? "rgba(74,222,128,0.25)" : "rgba(74,222,128,0.20)", color: GREEN, border: "1px solid rgba(74,222,128,0.35)", cursor: revertSaving ? "not-allowed" : "pointer" }}>
                  {revertSaving && <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(74,222,128,0.3)", borderTopColor: GREEN }} />}
                  {revertSaving ? "Guardando..." : "Confirmar cambio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Reporte de Asistencia</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Aplica filtros para consultar el historial</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canRegister && (
            <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 4px 16px rgba(46,111,168,0.35)" }}>
              <UserCheck size={15} /> Registrar asistencia
            </button>
          )}
          {!isReadOnly && applied && rows.length > 0 && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}>
              <Download size={15} /> Exportar Excel
            </button>
          )}
        </div>
      </div>

      <DownloadCards />

      {/* Filtros */}
      <div className="relative p-5" style={{ ...glass(BLUE), overflow: "visible", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "16px 16px 0 0", background: `linear-gradient(90deg,${BLUE},transparent)` }} />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Filter size={13} color={BLUE_L} /><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Filtros</span></div>
          {hasFilters && <button onClick={handleClear} className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }} onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}><X size={11} /> Limpiar filtros</button>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
          <div style={{ position: "relative", zIndex: 44 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Voluntario</label><Autocomplete placeholder="Buscar voluntario..." fetchUrl="/volunteers" value={labels.volunteer} onSelect={opt => { setFilters(p => ({ ...p, volunteerId: opt?.id })); setLabels(p => ({ ...p, volunteer: opt?.label ?? '' })); }} /></div>
          <div style={{ position: "relative", zIndex: 43 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Módulo</label><Autocomplete placeholder="Buscar módulo..." fetchUrl="/modules" value={labels.module} onSelect={opt => { setFilters(p => ({ ...p, moduleId: opt?.id })); setLabels(p => ({ ...p, module: opt?.label ?? '' })); }} /></div>
          <div style={{ position: "relative", zIndex: 42 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Sede</label><Autocomplete placeholder="Buscar sede..." fetchUrl="/sedes" value={labels.sede} onSelect={opt => { setFilters(p => ({ ...p, sedeId: opt?.id })); setLabels(p => ({ ...p, sede: opt?.label ?? '' })); }} /></div>
          <div style={{ position: "relative", zIndex: 41 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Sesión</label><Autocomplete placeholder="Buscar sesión..." fetchUrl="/sessions" value={labels.session} mapItems={(item: any) => ({ id: item.id, label: item.name || `Sesión ${item.id}` })} onSelect={opt => { setFilters(p => ({ ...p, sessionId: opt?.id })); setLabels(p => ({ ...p, session: opt?.label ?? '' })); }} /></div>
          <div style={{ position: "relative", zIndex: 2 }}>
          <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Período</label>
          <select style={IS} value={filterPeriod} onChange={e => {
            setFilterPeriod(e.target.value);
            const period = periods.find((p: any) => p.id === parseInt(e.target.value));
            if (period) setFilters(p => ({ ...p, startDate: period.startDate, endDate: period.endDate }));
            else setFilters(p => ({ ...p, startDate: undefined, endDate: undefined }));
          }}>
            <option value="" style={{ background: "#0d1424" }}>Todos los períodos</option>
            {periods.map((p: any) => (
              <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>
            ))}
          </select>
        </div>
          <div style={{ position: "relative", zIndex: 1 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Desde</label><input type="date" style={IS} value={filters.startDate || ''} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value || undefined }))} onFocus={fi} onBlur={fo} /></div>
          <div style={{ position: "relative", zIndex: 1 }}><label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.35)" }}>Hasta</label><input type="date" style={IS} value={filters.endDate || ''} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value || undefined }))} onFocus={fi} onBlur={fo} /></div>
        </div>
        <button onClick={handleApply} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: loading ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : <Filter size={14} />}
          {loading ? 'Cargando...' : 'Aplicar filtros'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[{ label: "Total registros", value: stats.total, color: "rgba(255,255,255,0.80)", accent: BLUE }, { label: "Puntuales", value: stats.presentes, color: "#4ade80", accent: "#4ade80" }, { label: "Tarde", value: stats.tarde, color: "#facc15", accent: "#facc15" }, { label: "Faltas", value: stats.faltas, color: "#f87171", accent: "#f87171" }, { label: "% Asistencia", value: `${stats.porcentaje ?? 0}%`, color: BLUE_L, accent: BLUE }].map((card, i) => (
            <div key={i} className="relative overflow-hidden p-4 text-center" style={glass(card.accent)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${card.accent},transparent)` }} />
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {applied && (
        <div className="relative overflow-hidden" style={glass(BLUE)}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.80)" }}><ClipboardList size={14} color={BLUE_L} /> Registros de asistencia</h2>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{pagination ? `${pagination.total} resultado(s) · página ${pagination.page} de ${pagination.totalPages}` : `${rows.length} resultado(s)`}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-16"><div className="text-center space-y-3"><div className="w-10 h-10 rounded-full mx-auto animate-spin" style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} /><p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando registros...</p></div></div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3"><ClipboardList size={32} color="rgba(46,111,168,0.25)" /><p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No se encontraron registros</p></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Voluntario","Módulo","Sede","Sesión","Fecha","Estado","Justificación","Registrado por","Hora",""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "#f1f5f9" }}>{row.volunteer}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.55)" }}>{row.module}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.55)" }}>{row.sede}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.55)" }}>{row.session}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.45)" }}>{row.sessionDate}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3"><JustBadge just={row.justification} /></td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.50)" }}>{row.registeredBy || '—'}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.40)" }}>{row.createdAt ? new Date(row.createdAt).toLocaleString('es-PE') : '—'}</td>
                        <td className="px-4 py-3">
                          {/* ── Botón revertir para cualquier estado ── */}
                          {canRevert && (
                            <button onClick={() => {
                              setRevertModal(row);
                              setRevertStatus(getRevertOptions(row.status)[0]);
                            }}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                              style={{ background: "rgba(74,222,128,0.10)", color: GREEN, border: "1px solid rgba(74,222,128,0.22)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                              <RotateCcw size={11} /> Cambiar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.09)" }}><ChevronLeft size={14} /> Anterior</button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1).reduce<(number | string)[]>((acc, p, idx, arr) => { if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...'); acc.push(p); return acc; }, []).map((p, i) => p === '...' ? <span key={`e-${i}`} className="px-2 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>...</span> : <button key={p} onClick={() => handlePageChange(p as number)} disabled={loading} className="w-8 h-8 rounded-lg text-xs font-semibold" style={{ background: currentPage === p ? `linear-gradient(135deg,${BLUE},${BLUE_L})` : "rgba(255,255,255,0.05)", color: currentPage === p ? "#fff" : "rgba(255,255,255,0.55)" }}>{p}</button>)}
                  </div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.09)" }}>Siguiente <ChevronRight size={14} /></button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!applied && !loading && (
        <div className="relative overflow-hidden flex flex-col items-center justify-center p-16 space-y-4" style={glass()}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(46,111,168,0.06), transparent 70%)" }} />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(46,111,168,0.10)", border: "1px solid rgba(46,111,168,0.18)" }}><BarChart2 size={30} color={BLUE_L} /></div>
          <div className="text-center">
            <p className="font-semibold" style={{ color: "rgba(255,255,255,0.60)" }}>Aplica los filtros para ver el reporte</p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Puedes filtrar por voluntario, módulo, sede, sesión o fecha</p>
          </div>
        </div>
      )}
    </div>
  );
}