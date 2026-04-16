import { useAuth } from "@/contexts/AuthContext";
import { LogOut, CalendarDays, LayoutDashboard } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import unnamedLogo from "@/unnamed.png";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card border-b border-border">
      {/* Tira de identidade visual institucional */}
      <div className="h-1 bg-primary w-full" />

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + nome */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
        >
          <img src={unnamedLogo} alt="Logo FSSS" className="h-8 w-8 object-contain" />
          <div className="text-left">
            <p className="text-sm font-bold leading-tight tracking-tight">FSSS</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Sistema de Reservas</p>
          </div>
        </button>

        {/* Navegação */}
        <nav className="flex items-center gap-1">
          {/* Link Minhas Reservas — apenas professores */}
          {user?.role === "professor" && (
            <button
              onClick={() => navigate("/minhas-reservas")}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/minhas-reservas")
                  ? "text-primary bg-primary/8 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Minhas Reservas</span>
            </button>
          )}

          {/* Link Painel Admin — apenas admin */}
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors ${
                isActive("/admin")
                  ? "text-primary bg-primary/8 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
          )}

          {/* Divisor */}
          <span className="w-px h-4 bg-border mx-1 hidden sm:block" />

          {/* Nome do usuário */}
          <span className="text-sm text-foreground font-medium hidden sm:inline px-2">
            {user?.name}
          </span>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sair"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded hover:bg-muted"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
