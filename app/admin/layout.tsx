"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Building2, Boxes, Users, Heart,
  CalendarDays, ClipboardCheck, FileText, Clock,
  Award, Star, LogOut, ChevronRight, Menu, X,
} from "lucide-react";

// ── Nav items con roles permitidos ───────────────────────────────
const ALL_NAV_ITEMS = [
  { href: "/admin",                label: "Dashboard",       icon: LayoutDashboard, roles: ["super_admin", "admin", "registrador", "voluntario"] },
  { href: "/admin/sedes",          label: "Sedes",           icon: Building2,       roles: ["super_admin"] },
  { href: "/admin/modules",        label: "Módulos",         icon: Boxes,           roles: ["super_admin"] },
  { href: "/admin/periods",        label: "Periodos",        icon: Clock,           roles: ["super_admin"] },
  { href: "/admin/positions",      label: "Cargos",          icon: Award,           roles: ["super_admin"] },
  { href: "/admin/volunteers",     label: "Voluntarios",     icon: Heart,           roles: ["super_admin", "admin", "registrador"] },
  { href: "/admin/users",          label: "Usuarios",        icon: Users,           roles: ["super_admin", "registrador"] },
  { href: "/admin/sessions",       label: "Sesiones",        icon: CalendarDays,    roles: ["super_admin", "admin", "registrador"] },
  { href: "/admin/attendance",     label: "Asistencia",      icon: ClipboardCheck,  roles: ["super_admin", "admin", "registrador"] },
  { href: "/admin/justifications", label: "Justificaciones", icon: FileText,        roles: ["super_admin", "registrador"] },
  { href: "/admin/management",     label: "Gestión",         icon: Star,            roles: ["super_admin", "admin"] },
  { href: "/admin/profile",        label: "Perfil",          icon: Users,           roles: ["voluntario"] },
];

// ── Prefijos de rutas permitidas por rol ─────────────────────────
const ALLOWED_PREFIXES: Record<string, string[]> = {
  super_admin: ["/admin"],
  admin:       ["/admin", "/admin/volunteers", "/admin/sessions", "/admin/attendance", "/admin/justifications", "/admin/management", "/admin/profile"],
  registrador: ["/admin", "/admin/volunteers", "/admin/users", "/admin/sessions", "/admin/attendance", "/admin/profile"],
  voluntario:  ["/admin", "/admin/profile"],
};

function canAccess(role: string, pathname: string): boolean {
  if (role === "super_admin") return true;
  const allowed = ALLOWED_PREFIXES[role] ?? [];
  return allowed.some(p => pathname === p || pathname.startsWith(p + "/"));
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", color: "#c084fc", bg: "rgba(192,132,252,0.15)" },
  admin:       { label: "Admin",       color: "#4A90C4", bg: "rgba(74,144,196,0.15)"  },
  registrador: { label: "Registrador", color: "#E8722A", bg: "rgba(232,114,42,0.15)"  },
  voluntario:  { label: "Voluntario",  color: "#4ade80", bg: "rgba(74,222,128,0.15)"  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    const role = user?.role ?? "";
    if (!["super_admin", "admin", "registrador", "voluntario"].includes(role)) {
      router.push("/unauthorized"); return;
    }
    // Bloquear acceso por URL directa
    if (!canAccess(role, pathname)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, user, pathname]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const role     = user?.role ?? "";
  const roleMeta = ROLE_META[role] ?? ROLE_META.voluntario;
  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(role));

  const SidebarContent = () => (
    <>
      {/* LOGO */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <img src="/voluntades_plus.png" alt="Voluntades+" className="h-10 w-auto" />
        <button className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)" }}
          onClick={() => setSidebarOpen(false)}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
          <X size={16} />
        </button>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        <p className="text-xs px-3 pb-2 pt-1 font-medium"
          style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Principal
        </p>
        {navItems.map((item) => {
          const Icon     = item.icon;
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={isActive
                ? { background: "linear-gradient(90deg, rgba(46,111,168,0.30), rgba(46,111,168,0.08))", color: "#ffffff", boxShadow: "inset 3px 0 0 #2E6FA8" }
                : { color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)"; }}}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent";            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}}>
              <Icon size={16} strokeWidth={1.8} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-3 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>

        {/* Badge rol */}
        <div className="mb-3 px-1">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: roleMeta.bg, color: roleMeta.color }}>
            {roleMeta.label}
          </span>
        </div>

        {/* USUARIO */}
        <Link href="/admin/profile"
          className="flex items-center gap-3 mb-3 rounded-xl p-2 transition-all duration-200"
          style={{ background: "rgba(255,255,255,0.04)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}>
          {user?.photoUrl ? (
            <img
              src={user.photoUrl.startsWith("http") ? user.photoUrl : `${process.env.NEXT_PUBLIC_API_URL}/${user.photoUrl}`}
              className="w-8 h-8 rounded-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #2E6FA8, #4A90C4)" }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>Ver mi perfil</p>
          </div>
          <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
        </Link>

        {/* CERRAR SESIÓN */}
        <button onClick={() => { logout(); router.push("/login"); }}
          className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-xl font-medium transition-all duration-200"
          style={{ background: "rgba(232,114,42,0.10)", color: "#E8722A", border: "1px solid rgba(232,114,42,0.20)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,114,42,0.22)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,114,42,0.40)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,114,42,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(232,114,42,0.20)"; }}>
          <LogOut size={14} />
          Cerrar sesión
        </button>

        <div className="mt-3 text-center">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>Desarrollado por</p>
          <a href="https://rickdev.net.pe" target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold transition" style={{ color: "#4A90C4" }}>
            rick.dev
          </a>
          <div className="my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>Versión 1.0.0</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#070d14" }}>

      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed inset-0 z-40 transition-all duration-300"
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "auto" : "none" }}
        onClick={() => setSidebarOpen(false)} />

      <aside className="lg:hidden fixed top-0 left-0 h-full z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ background: "#0d1424", borderRight: "1px solid rgba(255,255,255,0.09)", boxShadow: sidebarOpen ? "8px 0 40px rgba(0,0,0,0.70)" : "none", transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 flex-shrink-0"
          style={{ height: "60px", background: "rgba(13,20,36,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.70)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
            <Menu size={18} />
          </button>
          <img src="/voluntades_plus.png" alt="Voluntades+" className="h-8 w-auto" />
          <Link href="/admin/profile">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6FA8, #4A90C4)", boxShadow: "0 2px 10px rgba(46,111,168,0.40)" }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
          </Link>
        </header>

        <main className="flex-1 overflow-auto" style={{ background: "#070d14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}