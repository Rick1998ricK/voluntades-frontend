"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
// @ts-ignore
import QRCode from "qrcode";
import { ArrowLeft, Printer, Eye, Boxes, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";

const glass = () => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
});

const selectStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "9px 12px",
  color: "#e2e8f0",
  fontSize: "13px",
  outline: "none",
  width: "100%",
};

interface Volunteer {
  id: number; fullName: string; dni: string;
  photoUrl?: string; module?: { id: number; name: string };
  status: string; management?: any[];
}

interface CardData {
  fullName: string; module: string; qrDataUrl: string; position: string | null;
}

export default function PrintQrPage() {
  const [volunteers, setVolunteers]     = useState<Volunteer[]>([]);
  const [modules, setModules]           = useState<any[]>([]);
  const [filterModule, setFilterModule] = useState("");
  const [filterStatus, setFilterStatus] = useState("activo");
  const [cards, setCards]               = useState<CardData[]>([]);
  const [generating, setGenerating]     = useState(false);
  const [previewing, setPreviewing]     = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.get("/volunteers").then(async res => {
      const vols = [...res.data].sort((a: Volunteer, b: Volunteer) => b.id - a.id);
      const enriched = await Promise.all(vols.map(async (v: Volunteer) => {
        try {
          const m = await api.get(`/management/volunteer/${v.id}`);
          return { ...v, management: (m.data ?? []).filter((x: any) => x.isActive) };
        } catch { return { ...v, management: [] }; }
      }));
      setVolunteers(enriched);
    });
    api.get("/modules").then(res => setModules(res.data ?? []));
  }, []);

  const filtered = volunteers.filter(v => {
    const matchModule = !filterModule || String(v.module?.id) === filterModule;
    const matchStatus = !filterStatus || v.status === filterStatus;
    return matchModule && matchStatus;
  });

  async function generateCards() {
    if (filtered.length === 0) return;
    setGenerating(true);
    try {
      const result: CardData[] = await Promise.all(
        filtered.map(async (v) => {
          const qrValue   = JSON.stringify({ id: v.id, name: v.fullName, dni: v.dni });
          const qrDataUrl = await QRCode.toDataURL(qrValue, { width: 200, margin: 1, color: { dark: "#1a1a2e", light: "#ffffff" } });
          const mgmt = v.management ?? [];
          const positions = mgmt.flatMap((m: any) => m.positions?.map((p: any) => p.name) ?? []);
          return { fullName: v.fullName, module: v.module?.name ?? "—", qrDataUrl, position: positions[0] ?? null };
        })
      );
      setCards(result);
      setPreviewing(true);
    } finally { setGenerating(false); }
  }

  return (
    <>
      {/* ── UI (no imprime) ── */}
      <div className="no-print min-h-screen p-4 md:p-6 space-y-5" style={{ background: "#070d14", color: "#e2e8f0" }}>

        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <button
              onClick={() => router.push("/admin/volunteers")}
              className="flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors duration-200 w-fit"
              style={{ color: "rgba(255,255,255,0.40)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = BLUE_L)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
              <ArrowLeft size={14} /> Volver a voluntarios
            </button>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>
              Impresión masiva de QR
            </h1>
            <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Genera tarjetas QR listas para imprimir en A4
            </p>
          </div>
        </div>

        {/* CONFIGURACIÓN */}
        <div className="relative overflow-hidden p-5 space-y-5" style={glass()}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},${BLUE_L},transparent)` }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>Configuración</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
                <Boxes size={11} /> Módulo
              </label>
              <select style={selectStyle} value={filterModule}
                onChange={e => { setFilterModule(e.target.value); setPreviewing(false); }}>
                <option value="" style={{ background: "#0d1424" }}>Todos los módulos</option>
                {modules.map(m => <option key={m.id} value={String(m.id)} style={{ background: "#0d1424" }}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>
                <Users size={11} /> Estado
              </label>
              <select style={selectStyle} value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPreviewing(false); }}>
                <option value="" style={{ background: "#0d1424" }}>Todos</option>
                <option value="activo" style={{ background: "#0d1424" }}>Solo activos</option>
                <option value="inactivo" style={{ background: "#0d1424" }}>Solo inactivos</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold"
                style={{ background: "rgba(46,111,168,0.15)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.25)" }}>
                {filtered.length} voluntario(s)
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1 flex-wrap">
            <button onClick={generateCards} disabled={generating || filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: generating ? "rgba(46,111,168,0.35)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`,
                color: "#fff", boxShadow: generating ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
                cursor: generating || filtered.length === 0 ? "not-allowed" : "pointer", opacity: filtered.length === 0 ? 0.5 : 1,
              }}>
              {generating
                ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <Eye size={15} />}
              {generating ? "Generando QRs..." : "Generar vista previa"}
            </button>
            {previewing && (
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.25)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.15)")}>
                <Printer size={15} /> Imprimir / Guardar PDF
              </button>
            )}
          </div>
        </div>

        {/* INFO PÁGINAS */}
        {previewing && cards.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.60)" }}>
                <strong style={{ color: "#f1f5f9" }}>{cards.length}</strong> tarjetas ·{" "}
                <strong style={{ color: "#f1f5f9" }}>{Math.ceil(cards.length / 24)}</strong> página(s) A4
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>4 col × 6 filas · ~46×43 mm c/u</span>
            </div>

            {/* PREVIEW */}
            <div className="relative overflow-hidden p-5" style={glass()}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.30)" }}>
                Vista previa (primeras 8 tarjetas)
              </p>
              <div className="grid grid-cols-4 gap-3">
                {cards.slice(0, 8).map((c, i) => (
                  <div key={i} className="overflow-hidden rounded-xl"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <div className="text-center py-1.5" style={{ background: "#1a1a2e" }}>
                      <span style={{ color: "#fb923c", fontSize: "9px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>Voluntades</span>
                    </div>
                    <div className="flex flex-col items-center p-2 gap-1">
                      <img src={c.qrDataUrl} alt="QR" className="w-20 h-20 rounded" />
                      <p className="text-xs font-bold text-center leading-tight" style={{ color: "#f1f5f9" }}>{c.fullName}</p>
                      <p className="text-xs text-center leading-tight" style={{ color: BLUE_L, fontSize: "10px" }}>
                        {c.module !== "—"
                          ? c.module + (c.position ? ` / ⭐ ${c.position}` : "")
                          : c.position ? `⭐ ${c.position}` : "—"}
                      </p>
                    </div>
                  </div>
                ))}
                {cards.length > 8 && (
                  <div className="rounded-xl flex items-center justify-center text-sm"
                    style={{ border: "1px dashed rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.30)" }}>
                    +{cards.length - 8} más
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── HOJA DE IMPRESIÓN (idéntica al original para no romper el layout) ── */}
      {previewing && cards.length > 0 && (
        <div className="print-only">
          {Array.from({ length: Math.ceil(cards.length / 24) }).map((_, pageIdx) => (
            <div key={pageIdx} className="print-page">
              <div className="print-grid">
                {cards.slice(pageIdx * 24, pageIdx * 24 + 24).map((c, i) => (
                  <div key={i} className="qr-card">
                    <div className="qr-header"><span className="qr-org">Voluntades</span></div>
                    <img src={c.qrDataUrl} alt="QR" className="qr-img" />
                    <div className="qr-info">
                      <p className="qr-name">{c.fullName}</p>
                      <p className="qr-module">
                        {c.module !== "—"
                          ? c.module + (c.position ? ` / ⭐ ${c.position}` : "")
                          : c.position ? `⭐ ${c.position}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @media screen { .print-only { display: none; } }
        @page { size: A4 portrait; margin: 0; }
        .print-page { width: 210mm; min-height: 297mm; padding: 8mm 7mm; box-sizing: border-box; page-break-after: always; background: #fff; }
        .print-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3.5mm; }
        .qr-card { border: 0.3mm solid #c7d2e0; border-radius: 2mm; overflow: hidden; background: #fff; display: flex; flex-direction: column; align-items: center; page-break-inside: avoid; padding-bottom: 2mm; }
        .qr-header { width: 100%; background: #1a1a2e; text-align: center; padding: 1mm 0; }
        .qr-org { color: #fb923c; font-size: 5.5pt; font-weight: 900; letter-spacing: 0.4mm; font-family: Arial, sans-serif; text-transform: uppercase; }
        .qr-img { width: 21mm; height: 21mm; display: block; margin: 1.5mm auto 1mm; }
        .qr-info { width: 100%; text-align: center; padding: 0 1.5mm; }
        .qr-name { font-size: 5.5pt; font-weight: 700; color: #1a1a2e; font-family: Arial, sans-serif; line-height: 1.3; margin: 0 0 0.5mm; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .qr-module { font-size: 5pt; color: #2563eb; font-family: Arial, sans-serif; font-weight: 600; margin: 0; line-height: 1.3; word-break: break-word; }
      `}</style>
    </>
  );
}