import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutGrid,
  BarChart2,
  Building2,
  Package,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import unnamedLogo from "@/assets/logo.png";

const navSections = [
  {
    label: "Geral",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutGrid },
      { label: "Painel Admin", path: "/admin", icon: BarChart2 },
    ],
  },
  {
    label: "Reservas",
    items: [
      { label: "Espaços", path: "/espacos", icon: Building2 },
      { label: "Equipamentos", path: "/instrumentos", icon: Package },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", path: "/gerenciar", icon: Settings },
    ],
  },
] as const;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") ?? "AD";

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1117]">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col animate-slide-in-left"
        style={{ background: "linear-gradient(180deg, #16181f 0%, #111318 100%)" }}>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <img src={unnamedLogo} alt="FSSS" className="h-5 w-5 object-contain" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white leading-none">FSSS</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-none">Sistema de Reservas</p>
            </div>
          </button>

          <div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-4 pb-3">
          {navSections.map((section, si) => (
            <div key={section.label} style={{ animationDelay: `${si * 60}ms` }} className="animate-fade-in">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25 px-2 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150 text-left group relative overflow-hidden ${
                        active
                          ? "bg-white/12 text-white font-semibold"
                          : "text-white/45 hover:text-white/90 hover:bg-white/6"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                      )}
                      <item.icon className={`w-[15px] h-[15px] shrink-0 transition-transform duration-150 ${active ? "text-white" : "text-white/40 group-hover:text-white/70 group-hover:scale-110"}`} />
                      <span className="truncate flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/6">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-1 ring-white/10">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[9px] text-white/35 truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-1 text-white/25 hover:text-red-400 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#f4f5f7]">
        <div className="animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
