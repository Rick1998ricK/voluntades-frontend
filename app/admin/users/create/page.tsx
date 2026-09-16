"use client";

import { useState } from "react";
import { usersApi } from "@/services/users";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { ArrowLeft, User, Mail, Lock, Shield, Zap, AlertCircle, Plus } from "lucide-react";

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
};

const fi = (e: React.FocusEvent<any>) => {
  e.target.style.borderColor = "rgba(46,111,168,0.60)";
  e.target.style.boxShadow   = "0 0 0 3px rgba(46,111,168,0.12)";
  e.target.style.background  = "rgba(255,255,255,0.07)";
};
const fo = (e: React.FocusEvent<any>) => {
  e.target.style.borderColor = "rgba(255,255,255,0.10)";
  e.target.style.boxShadow   = "none";
  e.target.style.background  = "rgba(255,255,255,0.05)";
};

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

const ROLES = [
  { id: 1, name: "super_admin", label: "Super Admin", color: "#c084fc", desc: "Acceso total al sistema"     },
  { id: 2, name: "admin",       label: "Admin",       color: BLUE_L,   desc: "Gestión completa"             },
  { id: 3, name: "registrador", label: "Registrador", color: "#fb923c", desc: "Registro de asistencia"      },
  { id: 4, name: "voluntario",  label: "Voluntario",  color: "#4ade80", desc: "Acceso básico de voluntario" },
  { id: 5, name: "xpress", label: "Xpress", color: "#fb923c", desc: "Apoyo o reincorporación" },
];

export default function CreateUserPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId]     = useState(3);
  const [saving, setSaving]     = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [emailExists, setEmailExists]       = useState(false);

  const emailSuggestion = (() => {
    const parts = name.trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z\s]/g, "")
      .split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return `${parts[0]}@volun.com`;
    const firstName = parts[0];
    const initials  = parts.slice(-2).map(p => p[0]).join("");
    return `${firstName}.${initials}@volun.com`;
  })();

  function handleNameChange(val: string) {
    setName(val);
    setShowSuggestion(true);
    if (email.endsWith("@volun.com")) { setEmail(""); setEmailExists(false); }
  }

  async function checkEmail(val: string) {
    setEmail(val);
    setShowSuggestion(false);
    if (!val.includes("@")) { setEmailExists(false); return; }
    try {
      const res = await api.get(`/users/check-email?email=${encodeURIComponent(val)}`);
      setEmailExists(res.data.exists);
    } catch { setEmailExists(false); }
  }

  async function applySuggestion() {
    setShowSuggestion(false);
    await checkEmail(emailSuggestion);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim())     return alert("El nombre es obligatorio");
    if (!email.trim())    return alert("El email es obligatorio");
    if (emailExists)      return alert("Este email ya está registrado");
    if (!password.trim()) return alert("La contraseña es obligatoria");
    setSaving(true);
    try {
      await usersApi.create({ name, email, password, roleId });
      router.push("/admin/users");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al crear el usuario");
    } finally { setSaving(false); }
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <div className="max-w-lg space-y-5">

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
            <User size={18} color={BLUE_L} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Nuevo usuario</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Crea una cuenta en el sistema</p>
          </div>
        </div>

        {/* FORM CARD */}
        {/* autocomplete="off" en el form evita que el browser rellene los campos */}
        <form autoComplete="off" onSubmit={create}
          className="relative overflow-hidden p-6 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${BLUE}33`,
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />

          {/* NOMBRE */}
          <div>
            <Label icon={<User size={11} />} required>Nombre completo</Label>
            <input
              style={IS}
              placeholder="Ej: Juan Pérez"
              autoComplete="off"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              onFocus={fi} onBlur={fo}
            />
          </div>

          {/* EMAIL */}
          <div>
            <Label icon={<Mail size={11} />} required>Email</Label>
            <input
              type="text"
              style={{ ...IS, borderColor: emailExists ? "rgba(248,113,113,0.60)" : "rgba(255,255,255,0.10)",
                boxShadow: emailExists ? "0 0 0 3px rgba(248,113,113,0.12)" : "none" }}
              placeholder="correo@volun.com"
              autoComplete="off"
              value={email}
              onChange={e => checkEmail(e.target.value)}
              onFocus={fi} onBlur={fo}
            />

            {/* Sugerencia */}
            {showSuggestion && emailSuggestion && !email && (
              <button type="button" onClick={applySuggestion}
                className="flex items-center gap-1.5 mt-2 text-xs font-medium transition-opacity duration-200"
                style={{ color: BLUE_L }}>
                <Zap size={11} /> Usar:
                <span className="font-mono px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.25)" }}>
                  {emailSuggestion}
                </span>
              </button>
            )}

            {emailExists && (
              <p className="flex items-center gap-1.5 text-xs mt-2" style={{ color: "#f87171" }}>
                <AlertCircle size={11} /> Usuario ya registrado en el sistema
              </p>
            )}
          </div>

          {/* CONTRASEÑA */}
          <div>
            <Label icon={<Lock size={11} />} required sub="Mínimo 6 caracteres">Contraseña</Label>
            <input
              type="password"
              style={IS}
              placeholder="••••••••"
              autoComplete="new-password"  // evita que el browser rellene con la contraseña guardada
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={fi} onBlur={fo}
            />
          </div>

          {/* ROL */}
          <div>
            <Label icon={<Shield size={11} />} required>Rol</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.id} type="button" onClick={() => setRoleId(r.id)}
                  className="flex flex-col items-start p-3 rounded-xl transition-all duration-200 text-left"
                  style={{
                    background: roleId === r.id ? `${r.color}18` : "rgba(255,255,255,0.04)",
                    border: roleId === r.id ? `1px solid ${r.color}40` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: roleId === r.id ? `0 0 0 2px ${r.color}20` : "none",
                  }}>
                  <span className="text-xs font-bold" style={{ color: roleId === r.id ? r.color : "rgba(255,255,255,0.65)" }}>
                    {r.label}
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || emailExists}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: saving || emailExists ? "rgba(46,111,168,0.35)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`,
                color: "#fff",
                boxShadow: saving || emailExists ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
                cursor: saving || emailExists ? "not-allowed" : "pointer",
              }}>
              {saving
                ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <Plus size={15} />}
              {saving ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}