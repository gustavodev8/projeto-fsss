import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutGrid,
  BarChart2,
  Building2,
  Package,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import unnamedLogo from "@/assets/logo.png";

const navSections = [
  {
    label: "Geral",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutGrid },
      { label: "Painel Administrativo", path: "/admin", icon: BarChart2 },
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-zinc-900 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img src={unnamedLogo} alt="FSSS" className="h-6 w-6 object-contain" />
              <span className="text-sm font-bold text-white">FSSS</span>
            </button>
            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/60 rounded font-semibold uppercase tracking-wider">
              Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 px-2 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        active
                          ? "bg-white text-zinc-900 font-semibold"
                          : "text-white/60 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/8 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-white/45 truncate leading-tight mt-0.5">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-1 text-white/40 hover:text-white transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
