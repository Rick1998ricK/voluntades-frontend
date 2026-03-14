"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Plus } from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "12px",
  padding: "11px 14px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  transition: "all 0.2s",
};

export default function NewSedePage() {
  const router = useRouter();
  const [name, setName]       = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving]   = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("El nombre es obligatorio");
    setSaving(true);
    try {
      await api.post("/sedes", { name, address });
      router.push("/admin/sedes");
    } catch {
      alert("Error al crear la sede");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>
      <div className="max-w-lg">

        {/* VOLVER */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors duration-200"
          style={{ color: "rgba(255,255,255,0.40)" }}
          onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
          <ArrowLeft size={15} /> Volver
        </button>

        {/* TÍTULO */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.25)" }}>
            <Building2 size={18} color={BLUE_L} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Nueva sede</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Completa los datos de la sede</p>
          </div>
        </div>

        {/* FORM CARD */}
        <div className="relative overflow-hidden p-6 space-y-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
          }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />

          {/* Nombre */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.40)" }}>
              <Building2 size={11} />
              Nombre <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              style={inputStyle}
              placeholder="Ej: CAR Ana María Gelicich"
              value={name}
              onChange={e => setName(e.target.value)}
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

          {/* Dirección */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.40)" }}>
              <MapPin size={11} />
              Dirección
            </label>
            <input
              style={inputStyle}
              placeholder="Ej: Av. Principal 123, Huancayo"
              value={address}
              onChange={e => setAddress(e.target.value)}
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

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button onClick={() => router.back()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
              Cancelar
            </button>
            <button onClick={create} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: saving ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`,
                color: "#fff",
                boxShadow: saving ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget.style.boxShadow = "0 6px 24px rgba(46,111,168,0.50)"); }}
              onMouseLeave={e => { if (!saving) (e.currentTarget.style.boxShadow = "0 4px 16px rgba(46,111,168,0.35)"); }}>
              {saving ? (
                <div className="w-4 h-4 rounded-full animate-spin"
                  style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              ) : <Plus size={15} />}
              {saving ? "Creando..." : "Crear sede"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}