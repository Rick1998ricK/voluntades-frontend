"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, User, CreditCard, Phone, Heart, Calendar, GraduationCap,
  Building2, Boxes, Star, FileText, Camera, Plus,
} from "lucide-react";

const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";
const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

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
  certificado_unico_laboral: "Certificado Único Laboral",
  autorizacion_menor: "Autorización menor",
  seguro_vida: "Seguro de vida / Accidentes (PDF)",
};

export default function NewVolunteerPage() {
  const router    = useRouter();
  const { user }  = useAuth();

  // ── Bloquear acceso al registrador ──────────────────────
  /*useEffect(() => {
    if (user?.role === "registrador") {
      router.replace("/admin/volunteers");
    }
  }, [user]);

  if (user?.role === "registrador") return null;*/
  // ────────────────────────────────────────────────────────

  const [users, setUsers]           = useState<any[]>([]);
  const [sedes, setSedes]           = useState<any[]>([]);
  const [allModules, setAllModules] = useState<any[]>([]);
  const [modules, setModules]       = useState<any[]>([]);
  const [activePeriods, setActivePeriods] = useState<any[]>([]);
  const [allPeriods, setAllPeriods]       = useState<any[]>([]);
  const [positions, setPositions]   = useState<any[]>([]);
  const [saving, setSaving]         = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    userId: "", fullName: "", dni: "", joinPeriod: "",
    phone: "", emergencyContact: "", bloodType: "",
    birthDate: "", gender: "M", isStudent: false,
    institution: "", sedeId: "", moduleId: "",
    photoFile: null as File | null,
    insuranceType: "", insuranceName: "", insuranceNumber: "",
    insuranceHospital: "", insuranceExpiry: "", allergies: "",
    medicalCondition: "", disability: "",
  });

  const [isManagement, setIsManagement] = useState(false);
  const [mgmtForm, setMgmtForm] = useState({ periodId: "", positionIds: [] as number[], notes: "" });

  const [documents, setDocuments] = useState({
    carta_compromiso: null as File | null,
    ficha_beneficencia: null as File | null,
    antecedentes: null as File | null,
    autorizacion_menor: null as File | null,
    seguro_vida: null as File | null,
  });
  useEffect(() => {
    Promise.all([
      api.get("/users/without-volunteer"),
      api.get("/sedes"),
      api.get("/modules"),
      api.get("/periods/active"),
      api.get("/periods"),
      api.get("/positions"),
    ]).then(([usersRes, sedesRes, modulesRes, periodsRes, allPeriodsRes, posRes]) => {
      setUsers(usersRes.data);
      setSedes(sedesRes.data.filter((s: any) => s.isActive));
      setAllModules(modulesRes.data);
      setActivePeriods(periodsRes.data);
      setAllPeriods(allPeriodsRes.data);
      setPositions(posRes.data.filter((p: any) => p.isActive));
    });
  }, []);

  function set(field: string, value: any) { setForm(f => ({ ...f, [field]: value })); }

  function handleUserChange(userId: string) {
    const user = users.find(u => String(u.id) === userId);
    setForm(f => ({ ...f, userId, fullName: user?.name ?? f.fullName, dni: user?.dni ?? f.dni }));
  }

  function handleSedeChange(sedeId: string) {
    setForm(f => ({ ...f, sedeId, moduleId: "" }));
    setModules(allModules.filter((m: any) => m.sede?.id === Number(sedeId)));
  }

  function handlePhoto(file: File | null) {
    set("photoFile", file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
    else setPhotoPreview(null);
  }

  function handleEmergencyInput(value: string, setter: (v: string) => void) {
    const parts = value.split(" - ");
    let phone = parts[0].replace(/\D/g, "").substring(0, 9);
    if (phone.length === 9 && parts.length === 1 && value.slice(-1) !== "-") { setter(`${phone} - `); return; }
    if (parts.length === 2 && parts[1].length > 0 && value.slice(-1) === " ") { setter(`${phone} - ${parts[1].trim()} - `); return; }
    setter(value);
  }

  function togglePosition(id: number) {
    setMgmtForm(prev => ({
      ...prev,
      positionIds: prev.positionIds.includes(id)
        ? prev.positionIds.filter(p => p !== id)
        : [...prev.positionIds, id],
    }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId)   return alert("Selecciona un usuario");
    if (!form.fullName) return alert("El nombre completo es obligatorio");
    if (!form.dni)      return alert("El DNI es obligatorio");
    setSaving(true);
    try {
      const body = { ...form, photoFile: undefined };
      const res  = await api.post("/volunteers", body);
      const volunteer = res.data;

      if (form.photoFile) {
        const fd = new FormData(); fd.append("photo", form.photoFile);
        await api.patch(`/volunteers/${volunteer.id}`, fd);
      }

      for (const [type, file] of Object.entries(documents)) {
        if (!file) continue;
        const fd = new FormData(); fd.append("file", file); fd.append("type", type);
        await api.post(`/volunteers/${volunteer.id}/documents/upload`, fd);
      }

      if (isManagement) {
        await api.post("/management", {
          volunteerId: volunteer.id,
          periodId: mgmtForm.periodId ? Number(mgmtForm.periodId) : null,
          positionIds: mgmtForm.positionIds,
          notes: mgmtForm.notes,
          isActive: true,
        });
      }

      router.push("/admin/volunteers");
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Error al crear voluntario");
    } finally { setSaving(false); }
  }

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
            style={{ background: "rgba(46,111,168,0.15)", border: "1px solid rgba(46,111,168,0.25)" }}>
            <User size={18} color={BLUE_L} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Nuevo voluntario</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Completa los datos del voluntario</p>
          </div>
        </div>

        {/* FOTO */}
        <SectionCard title="Foto" icon={<Camera size={14} color={BLUE_L} />}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(255,255,255,0.10)" }}>
              {photoPreview
                ? <img src={photoPreview} className="w-full h-full object-cover" alt="" />
                : <Camera size={24} style={{ color: "rgba(255,255,255,0.25)" }} />}
            </div>
            <div>
              <label className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200 block mb-1"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.10)" }}>
                Subir foto
                <input type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={e => handlePhoto(e.target.files?.[0] ?? null)} />
              </label>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>JPG o PNG, opcional</p>
            </div>
          </div>
        </SectionCard>

        {/* USUARIO */}
        <SectionCard title="Usuario del sistema" icon={<User size={14} color={BLUE_L} />}>
          <div>
            <Label icon={<User size={11} />} required>Usuario</Label>
            <select style={IS} value={form.userId} onChange={e => handleUserChange(e.target.value)} onFocus={fi} onBlur={fo}>
              <option value="" style={{ background: "#0d1424" }}>Seleccionar usuario</option>
              {users.map(u => <option key={u.id} value={u.id} style={{ background: "#0d1424" }}>{u.name} — {u.email}</option>)}
            </select>
          </div>
        </SectionCard>

        {/* DATOS PERSONALES */}
        <SectionCard title="Datos personales" icon={<CreditCard size={14} color={BLUE_L} />}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label icon={<User size={11} />} required>Nombre completo</Label>
              <input style={IS} placeholder="Se autocompleta al seleccionar usuario"
                value={form.fullName} onChange={e => set("fullName", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<CreditCard size={11} />} required>DNI</Label>
              <input style={IS} placeholder="12345678" maxLength={8}
                value={form.dni} onChange={e => set("dni", e.target.value)} onFocus={fi} onBlur={fo} />
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
              <input style={IS} placeholder="987654321"
                value={form.phone} onChange={e => set("phone", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<Heart size={11} />}>Tipo de sangre</Label>
              <select style={IS} value={form.bloodType} onChange={e => set("bloodType", e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b} style={{ background: "#0d1424" }}>{b}</option>)}
              </select>
            </div>
            <div>
              <Label icon={<Phone size={11} />}>Contacto de emergencia</Label>
              <input style={IS} placeholder="987654321 - Juan Pérez - Padre" maxLength={60}
                value={form.emergencyContact}
                onChange={e => handleEmergencyInput(e.target.value, v => set("emergencyContact", v))}
                onFocus={fi} onBlur={fo} />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Teléfono - Nombre - Parentesco</p>
            </div>

            <div>
              <Label icon={<Calendar size={11} />}>Fecha de nacimiento MM/DD/AAAA</Label>
              <input type="date" style={IS} value={form.birthDate} onChange={e => set("birthDate", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <Label icon={<User size={11} />}>Género</Label>
              <select style={IS} value={form.gender} onChange={e => set("gender", e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="M" style={{ background: "#0d1424" }}>Masculino</option>
                <option value="F" style={{ background: "#0d1424" }}>Femenino</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className="relative w-9 h-5 flex-shrink-0">
              <input type="checkbox" className="sr-only" checked={form.isStudent} onChange={e => set("isStudent", e.target.checked)} />
              <div className="w-9 h-5 rounded-full transition-all duration-200"
                style={{ background: form.isStudent ? BLUE : "rgba(255,255,255,0.12)" }}>
                <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200"
                  style={{ left: form.isStudent ? "19px" : "3px", top: "3px" }} />
              </div>
            </div>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>
              <GraduationCap size={13} className="inline mr-1" /> Es estudiante
            </span>
          </label>

          {form.isStudent && (
            <div>
              <Label icon={<GraduationCap size={11} />}>Institución</Label>
              <input style={IS} placeholder="Nombre de la institución"
                value={form.institution} onChange={e => set("institution", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
          )}
        </SectionCard>

        {/* SEDE Y MÓDULO */}
        <SectionCard title="Sede y módulo" icon={<Building2 size={14} color={BLUE_L} />}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label icon={<Building2 size={11} />}>Sede</Label>
              <select style={IS} value={form.sedeId} onChange={e => handleSedeChange(e.target.value)} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Seleccionar sede</option>
                {sedes.map(s => <option key={s.id} value={s.id} style={{ background: "#0d1424" }}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label icon={<Boxes size={11} />}>Módulo <span className="normal-case font-normal" style={{ color: "rgba(255,255,255,0.30)" }}>(opcional)</span></Label>
              <select style={{ ...IS, opacity: form.sedeId ? 1 : 0.5 }}
                value={form.moduleId} onChange={e => set("moduleId", e.target.value)}
                disabled={!form.sedeId} onFocus={fi} onBlur={fo}>
                <option value="" style={{ background: "#0d1424" }}>Sin módulo</option>
                {modules.map(m => <option key={m.id} value={m.id} style={{ background: "#0d1424" }}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </SectionCard>


        {/* FICHA SOCIAL / SEGURO */}
        <SectionCard title="Ficha Social" icon={<Heart size={14} color="#f472b6" />} accent="#f472b6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label icon={<FileText size={11} />}>PDF del seguro (opcional)</Label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: documents.seguro_vida ? "#f472b6" : "rgba(255,255,255,0.60)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                  <FileText size={14} />
                  <span>{documents.seguro_vida ? (documents.seguro_vida as File).name : "Seleccionar PDF del seguro"}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={e => setDocuments(d => ({ ...d, seguro_vida: e.target.files?.[0] ?? null }))} />
                </label>
                {documents.seguro_vida && (
                  <button onClick={() => setDocuments(d => ({ ...d, seguro_vida: null }))}
                    className="text-xs px-3 py-2 rounded-xl"
                    style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}>
                    Quitar
                  </button>
                )}
                <div className="col-span-2">
                  <Label icon={<FileText size={11} />}>Observaciones médicas (opcional)</Label>
                  <input style={IS} placeholder="Ej: condición médica relevante, alergias, etc..." 
                    value={form.disability ?? ""} 
                    onChange={e => set("disability", e.target.value)} 
                    onFocus={fi} onBlur={fo} />
                </div>
              </div>
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
                <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.75 transition-all duration-200"
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
                  <p className="text-xs p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}>
                    No hay periodos activos. Crea uno en la sección Periodos.
                  </p>
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
                          onChange={() => togglePosition(p.id)}
                          style={{ accentColor: "#9b6dff" }} className="w-4 h-4" />
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
                  onFocus={fi} onBlur={fo}
                  style={{ ...IS, resize: "none" }} />
              </div>
            </div>
          )}
        </SectionCard>

        {/* DOCUMENTOS */}
        <SectionCard title="Documentos" icon={<FileText size={14} color={BLUE_L} />}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Opcional — puedes subirlos después</p>
          <div className="space-y-2">
            {Object.entries(DOC_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
                <div className="flex items-center gap-2">
                  {(documents as any)[key] && (
                    <span className="text-xs" style={{ color: "#4ade80" }}>✓ {(documents as any)[key].name}</span>
                  )}
                  <label className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                    Adjuntar
                    <input type="file" className="hidden"
                      onChange={e => setDocuments(d => ({ ...d, [key]: e.target.files?.[0] ?? null }))} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* BOTONES */}
        <div className="flex gap-3 pb-6">
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
              color: "#fff", boxShadow: saving ? "none" : "0 4px 16px rgba(46,111,168,0.35)",
              cursor: saving ? "not-allowed" : "pointer",
            }}>
            {saving
              ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              : <Plus size={15} />}
            {saving ? "Creando..." : "Crear voluntario"}
          </button>
        </div>
      </div>
    </div>
  );
}