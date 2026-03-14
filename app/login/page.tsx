"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/admin");
    } catch {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen px-4"
      style={{ background: "#070d14", fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Orbs de fondo */}
      <div style={{
        position: "fixed", top: "-120px", left: "-120px",
        width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(46,111,168,0.14), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-100px", right: "-100px",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,114,42,0.11), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Card */}
      <div
        className="w-full max-w-sm relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "24px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Línea accent superior */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, #2E6FA8, #4A90C4, #E8722A)",
        }} />

        <div className="p-8">

          {/* Logo + título */}
          <div className="text-center mb-8">
            <img
              src="/voluntades_plus.png"
              alt="Voluntades Asis"
              className="h-12 w-auto mx-auto mb-5"
            />
            <h2
              className="text-xl font-bold"
              style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}
            >
              Bienvenido de vuelta
            </h2>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
              style={{
                background: "rgba(248,113,113,0.10)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171",
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.50)", letterSpacing: "0.05em" }}
              >
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                placeholder="tu@volun.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-sm outline-none transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "12px",
                  padding: "11px 14px",
                  color: "#f1f5f9",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "rgba(46,111,168,0.60)";
                  e.target.style.boxShadow   = "0 0 0 3px rgba(46,111,168,0.12)";
                  e.target.style.background  = "rgba(255,255,255,0.07)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(255,255,255,0.10)";
                  e.target.style.boxShadow   = "none";
                  e.target.style.background  = "rgba(255,255,255,0.05)";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "rgba(255,255,255,0.50)", letterSpacing: "0.05em" }}
              >
                CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full text-sm outline-none transition-all duration-200 pr-10"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "12px",
                    padding: "11px 14px",
                    color: "#f1f5f9",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "rgba(46,111,168,0.60)";
                    e.target.style.boxShadow   = "0 0 0 3px rgba(46,111,168,0.12)";
                    e.target.style.background  = "rgba(255,255,255,0.07)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.10)";
                    e.target.style.boxShadow   = "none";
                    e.target.style.background  = "rgba(255,255,255,0.05)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2"
              style={{
                background: loading
                  ? "rgba(46,111,168,0.40)"
                  : "linear-gradient(135deg, #2E6FA8, #4A90C4)",
                color: "#ffffff",
                boxShadow: loading ? "none" : "0 4px 20px rgba(46,111,168,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(46,111,168,0.50)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(46,111,168,0.35)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <div
                  className="w-4 h-4 rounded-full animate-spin"
                  style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                />
              ) : (
                <LogIn size={15} />
              )}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.20)" }}>
            Sistema de Asistencia · <span style={{ color: "#4A90C4" }}>Voluntades Huancayo</span>
          </p>

        </div>
      </div>
    </div>
  );
}