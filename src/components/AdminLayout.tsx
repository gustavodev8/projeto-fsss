import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutGrid,
  BarChart2,
  Building2,
  Package,
  Settings,
  LogOut,
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
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 flex flex-col animate-slide-in-left bg-white border-r border-border">

        {/* Logo */}
        <div className="px-5 pt-5 pb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <img src={unnamedLogo} alt="FSSS" className="h-5 w-5 object-contain" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground leading-none">FSSS</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">Sistema de Reservas</p>
            </div>
          </button>

          <div className="mt-4 h-px bg-border" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-4 pb-3">
          {navSections.map((section, si) => (
            <div key={section.label} style={{ animationDelay: `${si * 60}ms` }} className="animate-fade-in">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-2 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] rounded-lg transition-all duration-150 text-left group relative ${
                        active
                          ? "bg-primary text-white font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon className={`w-[15px] h-[15px] shrink-0 transition-transform duration-150 ${
                        active ? "text-white" : "group-hover:scale-110"
                      }`} />
                      <span className="truncate flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{user?.name}</p>
              <p className="text-[9px] text-muted-foreground truncate leading-tight mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
