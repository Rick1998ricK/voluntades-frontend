"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
  ArrowLeft, User, CreditCard, Phone, Heart, Calendar, GraduationCap,
  Building2, Boxes, Star, FileText, Camera, Save, Download, Trash2, Upload,
} from "lucide-react";
import { Paperclip } from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

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
  colorScheme: "dark",
};

const fi = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(46,111,168,0.60)"; e.target.style.boxShadow="0 0 0 3px rgba(46,111,168,0.12)"; e.target.style.background="rgba(255,255,255,0.07)"; };
const fo = (e: React.FocusEvent<any>) => { e.target.style.borderColor="rgba(255,255,255,0.10)"; e.target.style.boxShadow="none"; e.target.style.background="rgba(255,255,255,0.05)"; };

function Label({ icon, children, required }: { icon?: React.ReactNode; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-medium mb-2 uppercase tracking-widest"
      style={{ color: "rgba(255,255,255,0.40)" }}>
      {icon} {children} {required && <span style={{ color: "#f87171" }}>*</span>}
    </label>
  );
}

function SectionCard({ title, icon, accent, children }: { title: string; icon: React.ReactNode; accent?: string; children: React.ReactNode }) {
  const ac = accent ?? BLUE;
  return (
    <div className="relative overflow-hidden p-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${ac}33`,
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${ac},transparent)` }} />
      <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "rgba(255,255,255,0.75)" }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

const DOC_LABELS: Record<string, string> = {
  carta_compromiso: "Carta compromiso",
  ficha_beneficencia: "Ficha beneficencia",
  antecedentes: "Antecedentes",
  autorizacion_menor: "Autorización menor",
};

export default function EditVolunteerPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [sedes, setSedes]           = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [modules, setModules]       = useState<any[]>([]);
  const [activePeriods, setActivePeriods] = useState<any[]>([]);
  const [allPeriods, setAllPeriods]       = useState<any[]>([]);
  const [positions, setPositions]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [preview, setPreview]       = useState<string | null>(null);
  const [documents, setDocuments]   = useState<any[]>([]);
  const [docType, setDocType]       = useState("carta_compromiso");
  const [docFile, setDocFile]       = useState<File | null>(null);

  const [form, setForm] = useState({
    fullName: "", dni: "", joinPeriod: "", phone: "",
    emergencyContact: "", bloodType: "", birthDate: "",
    gender: "M", isStudent: false, institution: "",
    sedeId: "", moduleId: "", photoFile: null as File | null,
  });

  const [managementMembers, setManagementMembers] = useState<any[]>([]);
  const [isManagement, setIsManagement]           = useState(false);
  const [mgmtForm, setMgmtForm] = useState({
    periodId: "", positionIds: [] as number[], notes: "", isActive: true,
  });
  const [editingMgmtId, setEditingMgmtId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/volunteers/${id}`),
      api.get("/sedes"),
      api.get("/modules"),
      api.get("/periods/active"),
      api.get("/periods"),
      api.get("/positions"),
      api.get(`/management/volunteer/${id}`),
    ]).then(([volRes, sedesRes, modulesRes, periodsRes, allPeriodsRes, posRes, mgmtRes]) => {
      const v = volRes.data;
      setAllModules(modulesRes.data);
      setSedes(sedesRes.data);
      setActivePeriods(periodsRes.data);
      setAllPeriods(allPeriodsRes.data);
      setPositions(posRes.data.filter((p: any) => p.isActive));
      setDocuments(v.documents ?? []);

      const sedeId   = String(v.sede?.id ?? v.module?.sede?.id ?? "");
      const moduleId = String(v.module?.id ?? "");

      setForm({
        fullName: v.fullName ?? "", dni: v.dni ?? "",
        joinPeriod: v.joinPeriod ?? "", phone: v.phone ?? "",
        emergencyContact: v.emergencyContact ?? "",
        bloodType: v.bloodType ?? "",
        birthDate: v.birthDate?.substring(0, 10) ?? "",
        gender: v.gender ?? "M", isStudent: v.isStudent ?? false,
        institution: v.institution ?? "", sedeId, moduleId, photoFile: null,
      });

      if (sedeId) setModules(modulesRes.data.filter((m: any) => m.sede?.id === Number(sedeId)));
      if (v.photoUrl) setPreview(
        v.photoUrl.startsWith("http") ? v.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${v.photoUrl}`
      );

      const members = mgmtRes.data ?? [];
      setManagementMembers(members);
      if (members.length > 0) {
        const latest = members[0];
        setIsManagement(true);
        setEditingMgmtId(latest.id);
        setMgmtForm({
          periodId: String(latest.period?.id ?? ""),
          positionIds: latest.positions?.map((p: any) => p.id) ?? [],
          notes: latest.notes ?? "",
          isActive: latest.isActive,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  function set(field: string, value: any) { setForm(f => ({ ...f, [field]: value })); }

  function handleSedeChange(sedeId: string) {
    setForm(f => ({ ...f, sedeId, moduleId: "" }));
    setModules(allModules.filter((m: any) => m.sede?.id === Number(sedeId)));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    set("photoFile", file);
    setPreview(URL.createObjectURL(file));
  }

  function handleEmergencyInput(value: string) {
    const parts = value.split(" - ");
    let phone = parts[0].replace(/\D/g, "").substring(0, 9);
    if (phone.length === 9 && parts.length === 1 && value.slice(-1) !== "-") { set("emergencyContact", `${phone} - `); return; }
    if (parts.length === 2 && parts[1].length > 0 && value.slice(-1) === " ") { set("emergencyContact", `${phone} - ${parts[1].trim()} - `); return; }
    set("emergencyContact", value);
  }

  function togglePosition(pid: number) {
    setMgmtForm(prev => ({
      ...prev,
      positionIds: prev.positionIds.includes(pid)
        ? prev.positionIds.filter(p => p !== pid)
        : [...prev.positionIds, pid],
    }));
  }

  const age = (() => {
    if (!form.birthDate) return null;
    const birth = new Date(form.birthDate); const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
  })();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName) return alert("El nombre es obligatorio");
    if (!form.dni)      return alert("El DNI es obligatorio");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== "photoFile") fd.append(k, String(v)); });
      if (form.photoFile) fd.append("photo", form.photoFile);
      await api.patch(`/volunteers/${id}`, fd);

      const mgmtPayload = {
        periodId: mgmtForm.periodId ? Number(mgmtForm.periodId) : null,
        positionIds: mgmtForm.positionIds,
        notes: mgmtForm.notes,
        isActive: mgmtForm.isActive,
      };

      if (isManagement) {
        if (editingMgmtId) await api.patch(`/management/${editingMgmtId}`, mgmtPayload);
        else await api.post("/management", { volunteerId: Number(id), ...mgmtPayload });
      } else if (!isManagement && editingMgmtId) {
        await api.patch(`/management/${editingMgmtId}`, { isActive: false });
      }

      router.push(`/admin/volunteers/${id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al guardar");
    } finally { setSaving(false); }
  }

  async function uploadDocument() {
    if (!docFile) return alert("Selecciona un archivo");
    const fd = new FormData(); fd.append("file", docFile); fd.append("type", docType);
    await api.post(`/volunteers/${id}/documents/upload`, fd);
    setDocFile(null);
    const res = await api.get(`/volunteers/${id}`);
    setDocuments(res.data.documents ?? []);
  }

  async function downloadDocument(docId: number, type: string) {
    const res = await api.get(`/volunteers/${id}/documents/${docId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url; a.download = type; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteDocument(docId: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    await api.delete(`/volunteers/${id}/documents/${docId}`);
    setDocuments(docs => docs.filter(d => d.id !== docId));
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#070d14" }}>
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-full mx-auto animate-spin"
          style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando...</p>
      </div>
    </div>
  );

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
            style={{ background: "rgba(232,114,42,0.12)", border: "1px solid rgba(232,114,42,0.25)" }}>
            <User size={18} color={ORANGE} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Editar voluntario</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{form.fullName}</p>
          </div>
        </div>

        {/* FOTO */}
        <SectionCard title="Foto" icon={<Camera size={14} color={ORANGE} />} accent={ORANGE}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.10)" }}>
              {preview
                ? <img src={preview} className="w-full h-full object-cover" alt="" />
                : <span className="text-2xl font-bold" style={{ color: BLUE_L }}>{form.fullName?.charAt(0)?.toUpperCase()}</span>}
            </div>
            <div>
              <label className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 block mb-1"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}>
                Cambiar foto
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePhoto} />
              </label>
              {age !== null && <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{age} años</p>}
            </div>
          </div>
        </SectionCard>

        {/* DATOS PERSONALES */}
        <SectionCard title="Datos personales" icon={<CreditCard size={14} color={ORANGE} />} accent={ORANGE}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label icon={<User size={11} />} required>Nombre completo</Label>
              <input style={IS} value={form.fullName} onChange={e => set("fullName", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<CreditCard size={11} />} required>DNI</Label>
              <input style={IS} maxLength={8} value={form.dni} onChange={e => set("dni", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<Calendar size={11} />}>Periodo de ingreso</Label>
              <select style={IS} value={form.joinPeriod} onChange={e => set("joinPeriod", e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar periodo</option>
                {allPeriods.map(p => <option key={p.id} value={p.name} style={{ background: "#0d1424" }}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label icon={<Phone size={11} />}>Teléfono</Label>
              <input style={IS} value={form.phone} onChange={e => set("phone", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<Phone size={11} />}>Contacto de emergencia</Label>
              <input style={IS} placeholder="987654321 - Juan Pérez - Padre" maxLength={60}
                value={form.emergencyContact} onChange={e => handleEmergencyInput(e.target.value)} onFocus={fi} onBlur={fo} />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Teléfono - Nombre - Parentesco</p>
            </div>
            <div>
              <Label icon={<Heart size={11} />}>Tipo de sangre</Label>
              <select style={IS} value={form.bloodType} onChange={e => set("bloodType", e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b} style={{ background: "#0d1424" }}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label icon={<Calendar size={11} />}>Fecha de nacimiento</Label>
              <input type="date" style={IS} value={form.birthDate} onChange={e => set("birthDate", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<User size={11} />}>Género</Label>
              <select style={IS} value={form.gender} onChange={e => set("gender", e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="M" style={{ background: "#0d1424" }}>Masculino</option>
                <option value="F" style={{ background: "#0d1424" }}>Femenino</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div className="relative w-9 h-5 flex-shrink-0">
                  <input type="checkbox" className="sr-only" checked={form.isStudent} onChange={e => set("isStudent", e.target.checked)} />
                  <div className="w-9 h-5 rounded-full transition-all duration-200"
                    style={{ background: form.isStudent ? BLUE : "rgba(255,255,255,0.12)" }}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-200"
                      style={{ left: form.isStudent ? "19px" : "3px", top: "3px" }} />
                  </div>
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
                  <GraduationCap size={13} className="inline mr-1" /> Es estudiante
                </span>
              </label>
            </div>
            {form.isStudent && (
              <div className="col-span-2">
                <Label icon={<GraduationCap size={11} />}>Institución</Label>
                <input style={IS} value={form.institution} onChange={e => set("institution", e.target.value)} onFocus={fi} onBlur={fo} />
              </div>
            )}
          </div>
        </SectionCard>

        {/* SEDE Y MÓDULO */}
        <SectionCard title="Sede y módulo" icon={<Building2 size={14} color={ORANGE} />} accent={ORANGE}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label icon={<Building2 size={11} />}>Sede</Label>
              <select style={IS} value={form.sedeId} onChange={e => handleSedeChange(e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar sede</option>
                {sedes.map(s => <option key={s.id} value={s.id} style={{ background: "#0d1424" }}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label icon={<Boxes size={11} />}>Módulo</Label>
              <select style={{ ...IS, opacity: form.sedeId ? 1 : 0.5 }}
                value={form.moduleId} onChange={e => set("moduleId", e.target.value)}
                disabled={!form.sedeId} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Sin módulo</option>
                {modules.map(m => <option key={m.id} value={m.id} style={{ background: "#0d1424" }}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* GESTIÓN */}
        <SectionCard title="Equipo de gestión" icon={<Star size={14} color="#9b6dff" />} accent="#9b6dff">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative w-9 h-5 flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={isManagement} onChange={e => setIsManagement(e.target.checked)} />
              <div className="w-9 h-5 rounded-full transition-all duration-200"
                style={{ background: isManagement ? "#9b6dff" : "rgba(255,255,255,0.12)" }}>
                <div className="w-3.5 h-3.5 bg-white rounded-full absolute transition-all duration-200"
                  style={{ left: isManagement ? "19px" : "3px", top: "3px" }} />
              </div>
            </div>
            <div>
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.80)" }}>Pertenece a gestión</span>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Miembro del equipo de gestión de Voluntades+</p>
            </div>
          </label>

          {isManagement && (
            <div className="space-y-4 p-4 rounded-xl" style={{ background: "rgba(155,109,255,0.07)", border: "1px solid rgba(155,109,255,0.18)" }}>
              <div>
                <Label icon={<Calendar size={11} />}>Periodo</Label>
                {activePeriods.length === 0 ? (
                  <p className="text-xs p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}>No hay periodos activos.</p>
                ) : (
                  <select style={IS} value={mgmtForm.periodId} onChange={e => setMgmtForm(f => ({ ...f, periodId: e.target.value }))} onFocus={fi} onBlur={fo}>
                    <option value="" style={{ background: "#0d1424" }}>Sin periodo</option>
                    {activePeriods.map(p => <option key={p.id} value={p.id} style={{ background: "#0d1424" }}>{p.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <Label icon={<Star size={11} />}>Cargos</Label>
                {positions.length === 0 ? (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>No hay cargos disponibles.</p>
                ) : (
                  <div className="rounded-xl p-3 max-h-40 overflow-y-auto space-y-2"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(155,109,255,0.20)" }}>
                    {positions.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={mgmtForm.positionIds.includes(p.id)}
                          onChange={() => togglePosition(p.id)} style={{ accentColor: "#9b6dff" }} className="w-4 h-4" />
                        <span style={{ color: "rgba(255,255,255,0.75)" }}>{p.name}</span>
                        {p.description && <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>— {p.description}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label icon={<FileText size={11} />}>Notas</Label>
                <textarea rows={2} placeholder="Observaciones opcionales..."
                  value={mgmtForm.notes} onChange={e => setMgmtForm(f => ({ ...f, notes: e.target.value }))}
                  onFocus={fi} onBlur={fo} style={{ ...IS, resize: "none" }} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={mgmtForm.isActive}
                  onChange={e => setMgmtForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ accentColor: "#9b6dff" }} className="w-4 h-4" />
                <span style={{ color: "rgba(255,255,255,0.70)" }}>Activo en gestión</span>
              </label>
            </div>
          )}
        </SectionCard>

        {/* BOTONES GUARDAR */}
        <div className="flex gap-3">
          <button onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)", border: "1px solid rgba(255,255,255,0.09)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: saving ? "rgba(46,111,168,0.40)" : `linear-gradient(135deg,${BLUE},${BLUE_L})`,
              color: "#fff", boxShadow: saving ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
              cursor: saving ? "not-allowed" : "pointer",
            }}>
            {saving
              ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              : <Save size={15} />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* DOCUMENTOS */}
        <SectionCard title="Documentos" icon={<FileText size={14} color={BLUE_L} />}>
          {documents.length === 0 ? (
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Sin documentos</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                      {DOC_LABELS[doc.type] ?? doc.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>
                      {new Date(doc.uploadedAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => downloadDocument(doc.id, doc.type)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1"
                      style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                      <Download size={11} /> Descargar
                    </button>
                    <button onClick={() => deleteDocument(doc.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1"
                      style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                      <Trash2 size={11} /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        <div className="pt-2 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.60)" }}>Subir nuevo documento</h3>
          <select style={IS} value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="carta_compromiso" style={{ background: "#0d1424" }}>Carta Compromiso</option>
            <option value="ficha_beneficencia" style={{ background: "#0d1424" }}>Ficha Beneficencia</option>
            <option value="certificado_unico_laboral" style={{ background: "#0d1424" }}>Certificado Único Laboral</option>
            <option value="autorizacion_menor" style={{ background: "#0d1424" }}>Autorización Menor</option>
          </select>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.60)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
              <Paperclip size={14} />
              <span>{docFile ? docFile.name : "Seleccionar archivo"}</span>
              <input type="file" className="hidden"
                onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={uploadDocument}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap"
              style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: "0 4px 14px rgba(46,111,168,0.30)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(46,111,168,0.45)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(46,111,168,0.30)")}>
              <Upload size={14} /> Subir
            </button>
          </div>
        </div>
        </SectionCard>

        <div className="pb-8" />
      </div>
    </div>
  );
}