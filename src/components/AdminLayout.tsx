import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  SquaresFour,
  ChartBar,
  Buildings,
  Cube,
  Gear,
  SignOut,
  List,
  X,
} from "@phosphor-icons/react";
import unnamedLogo from "@/assets/logo.png";

const navSections = [
  {
    label: "Geral",
    items: [
      { label: "Dashboard", path: "/", icon: SquaresFour },
      { label: "Painel Admin", path: "/admin", icon: ChartBar },
    ],
  },
  {
    label: "Reservas",
    items: [
      { label: "Espaços", path: "/espacos", icon: Buildings },
      { label: "Equipamentos", path: "/instrumentos", icon: Cube },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Configurações", path: "/gerenciar", icon: Gear },
    ],
  },
] as const;

type AdminSection = "dashboard" | "gerenciar" | "espacos" | "instrumentos";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: AdminSection;
  onSectionChange?: (section: AdminSection) => void;
}

const AdminLayout = ({ children, activeSection, onSectionChange }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") ?? "AD";

  const pathToSection: Record<string, AdminSection> = {
    "/admin": "dashboard",
    "/gerenciar": "gerenciar",
    "/espacos": "espacos",
    "/instrumentos": "instrumentos",
  };

  const handleNavigate = (path: string) => {
    const section = pathToSection[path];
    
    if (section) {
      // Se já estivermos no /admin, usamos replace: true para não sujar o histórico
      const isAlreadyOnAdmin = location.pathname === "/admin";
      navigate("/admin", { 
        state: { adminSection: section }, 
        replace: isAlreadyOnAdmin 
      });
      if (onSectionChange) onSectionChange(section);
    } else {
      navigate(path);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside
        className={`
          w-[270px] shrink-0 flex flex-col bg-white border-r border-border
          fixed md:static inset-y-0 left-0 z-50
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile close button */}
        <button
          className="absolute top-3 right-3 md:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <button
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3.5 hover:opacity-80 transition-opacity w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <img src={unnamedLogo} alt="FSSS" className="h-7 w-7 object-contain" />
            </div>
            <div className="text-left">
              <p className="text-base font-bold text-foreground leading-none">FSSS</p>
              <p className="text-xs text-muted-foreground mt-1 leading-none">Sistema de Reservas</p>
            </div>
          </button>

          <div className="mt-6 h-px bg-border" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 pb-4">
          {navSections.map((section, si) => (
            <div key={section.label} style={{ animationDelay: `${si * 60}ms` }} className="animate-fade-in">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-2 mb-2">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const mappedSection = pathToSection[item.path];
                  const active = mappedSection
                    ? activeSection === mappedSection || (!activeSection && location.pathname === item.path)
                    : location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3.5 px-3 py-3 text-[15px] rounded-lg transition-all duration-150 text-left group relative ${
                        active
                          ? "bg-primary text-white font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <item.icon
                        weight="bold"
                        className={`w-5 h-5 shrink-0 transition-transform duration-150 ${
                          active ? "text-white" : "text-primary group-hover:scale-110"
                        }`}
                      />
                      <span className="truncate flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate leading-tight mt-1">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors shrink-0"
            >
              <SignOut weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Conteúdo ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-14 px-4 bg-white border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors mr-3"
          >
            <List weight="bold" className="w-5 h-5" />
          </button>
          <img src={unnamedLogo} alt="FSSS" className="h-6 w-6 object-contain mr-2" />
          <span className="text-sm font-bold text-foreground">FSSS</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="animate-slide-up">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
