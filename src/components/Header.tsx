import { useAuth } from "@/contexts/AuthContext";
import { LogOut, CalendarDays, LayoutDashboard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import unnamedLogo from "@/assets/logo.png";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <img src={unnamedLogo} alt="FSSS" className="h-4 w-4 object-contain" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold leading-none text-foreground tracking-tight">FSSS</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Sistema de Reservas</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {user?.role === "professor" && (
            <button
              onClick={() => navigate("/minhas-reservas")}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive("/minhas-reservas")
                  ? "text-primary bg-primary/8 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minhas Reservas</span>
            </button>
          )}

          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/")}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive("/admin")
                  ? "text-primary bg-primary/8 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
          )}

          <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-1.5 px-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {user?.name?.trim()[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="text-sm text-foreground font-medium">{user?.name}</span>
          </div>

          <button
            onClick={logout}
            title="Sair"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-accent"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
