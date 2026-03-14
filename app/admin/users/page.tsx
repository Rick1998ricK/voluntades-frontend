"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/services/users";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { Users, Plus, ChevronDown, Shield, ClipboardList, Trash2 } from "lucide-react";

const PAGE_SIZE = 15;
const BLUE   = "#2E6FA8";
const BLUE_L = "#4A90C4";
const ORANGE = "#E8722A";

const glass = () => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
});

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  super_admin: { label: "Super Admin", color: "#c084fc", bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.25)" },
  admin:       { label: "Admin",       color: BLUE_L,   bg: "rgba(74,144,196,0.12)",  border: "rgba(74,144,196,0.25)"  },
  registrador: { label: "Registrador", color: ORANGE,   bg: "rgba(232,114,42,0.12)",  border: "rgba(232,114,42,0.25)"  },
  voluntario:  { label: "Voluntario",  color: "#4ade80", bg: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.25)"  },
};

export default function UsersPage() {
  const router       = useRouter();
  const { user: me } = useAuth();
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await usersApi.getAll();
      setUsers([...res.data].sort((a, b) => b.id - a.id));
    } finally { setLoading(false); }
  }

  async function deactivate(id: number) {
    if (!confirm("¿Desactivar este usuario?")) return;
    await usersApi.deactivate(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: false } : u));
  }

  async function activate(id: number) {
    await usersApi.activate(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: true } : u));
  }

  async function remove(id: number, name: string) {
    if (!confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return;
    await usersApi.remove(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  async function goToFicha(userId: number) {
    try {
      const res = await api.get(`/volunteers/by-user/${userId}`);
      router.push(`/admin/volunteers/${res.data.id}`);
    } catch { alert("Este usuario no tiene ficha de voluntario"); }
  }

  const shown   = users.slice(0, visible);
  const hasMore = visible < users.length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen" style={{ background: "#070d14", color: "#e2e8f0" }}>

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: "#f1f5f9", letterSpacing: "-0.3px" }}>Usuarios</h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Gestión de usuarios del sistema</p>
        </div>
        <Link href="/admin/users/create"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ background: `linear-gradient(135deg,${BLUE},${BLUE_L})`, color: "#fff", boxShadow: `0 4px 16px rgba(46,111,168,0.35)` }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 24px rgba(46,111,168,0.50)`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 16px rgba(46,111,168,0.35)`)}>
          <Plus size={15} />
          <span className="hidden sm:inline">Nuevo usuario</span>
          <span className="sm:hidden">Nuevo</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full mx-auto animate-spin"
              style={{ border: `3px solid rgba(46,111,168,0.2)`, borderTopColor: BLUE }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden" style={glass()}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BLUE},transparent)` }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {["Usuario","Email","Rol","Estado","Acciones"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.30)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(46,111,168,0.12)" }}>
                            <Users size={22} color={BLUE_L} />
                          </div>
                          <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>No hay usuarios registrados</p>
                        </div>
                      </td>
                    </tr>
                  ) : shown.map((u, i) => {
                    const isActive = u.isActive !== false;
                    const roleName = u.role?.name ?? u.role;
                    const role = ROLE_STYLES[roleName] ?? {
                      label: roleName, color: "rgba(255,255,255,0.55)",
                      bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.12)",
                    };

                    return (
                      <tr key={u.id}
                        style={{
                          borderBottom: i < shown.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          opacity: isActive ? 1 : 0.50,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                        {/* Avatar + nombre */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: "rgba(46,111,168,0.20)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.25)" }}>
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm leading-tight" style={{ color: "#f1f5f9" }}>{u.name}</p>
                              {u.id === me?.id && (
                                <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Tú</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{u.email}</td>

                        {/* Rol */}
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: role.bg, color: role.color, border: `1px solid ${role.border}` }}>
                            {roleName === "super_admin" && <Shield size={9} />}
                            {role.label}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={isActive
                              ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" }
                              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                            {isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            <Link href={`/admin/users/${u.id}/edit`}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(232,114,42,0.10)", color: ORANGE, border: "1px solid rgba(232,114,42,0.18)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(232,114,42,0.20)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(232,114,42,0.10)")}>
                              Editar
                            </Link>
                            <button onClick={() => goToFicha(u.id)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                              style={{ background: "rgba(46,111,168,0.12)", color: BLUE_L, border: "1px solid rgba(46,111,168,0.22)" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(46,111,168,0.22)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(46,111,168,0.12)")}>
                              <ClipboardList size={11} /> Ficha
                            </button>
                            {isActive ? (
                              <button onClick={() => deactivate(u.id)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                                Desactivar
                              </button>
                            ) : (
                              <button onClick={() => activate(u.id)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.18)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.20)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.10)")}>
                                Activar
                              </button>
                            )}
                            {u.id !== me?.id && (me?.role === "super_admin" || (me?.role === "registrador" && roleName !== "super_admin")) && (
                              <button onClick={() => remove(u.id, u.name)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200"
                                style={{ background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.18)" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.20)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.10)")}>
                                <Trash2 size={11} /> Eliminar
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

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
                <ChevronDown size={15} /> Cargar más ({users.length - visible} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}