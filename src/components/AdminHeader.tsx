import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutGrid, LayoutDashboard, Settings, LogOut } from "lucide-react";
import unnamedLogo from "@/assets/logo.png";

const navItems = [
  { label: "Hub", path: "/", icon: LayoutGrid },
  { label: "Painel Administrativo", path: "/admin", icon: LayoutDashboard },
  { label: "Gerenciar", path: "/gerenciar", icon: Settings },
] as const;

const AdminHeader = () => {
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
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 shrink-0">
          <img src={unnamedLogo} alt="FSSS" className="h-7 w-7 object-contain" />
          <div className="leading-none text-left">
            <p className="text-sm font-bold text-foreground tracking-tight">FSSS</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Sistema de Reservas
            </p>
          </div>
        </button>

        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded transition-colors ${
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-tight">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded bg-foreground text-background flex items-center justify-center text-[11px] font-bold shrink-0">
            {initials}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
