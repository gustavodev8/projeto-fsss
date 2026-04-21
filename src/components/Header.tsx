import { useAuth } from "@/contexts/AuthContext";
import {
  SignOut,
  CalendarBlank,
  SquaresFour,
  User,
} from "@phosphor-icons/react";
import { useNavigate, useLocation } from "react-router-dom";
import unnamedLogo from "@/assets/logo.png";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
        >
          <img src={unnamedLogo} alt="FSSS" className="h-7 w-7 object-contain" />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold leading-none text-foreground tracking-tight">FSSS</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Sistema de Reservas</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {user?.role === "professor" && (
            <button
              onClick={() => navigate("/minhas-reservas")}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive("/minhas-reservas")
                  ? "text-primary bg-primary/8 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <CalendarBlank weight="bold" className="w-4 h-4" />
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
              <SquaresFour weight="bold" className="w-4 h-4" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
          )}

          <div className="w-px h-5 bg-border mx-2 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 pl-1 pr-2">
            <div className="w-7 h-7 rounded-full bg-[#E8F0FE] flex items-center justify-center text-[#1A56DB] shrink-0">
              <User weight="bold" className="w-4 h-4" />
            </div>
            <span className="text-sm text-foreground font-medium">{user?.name}</span>
          </div>

          <button
            onClick={logout}
            title="Sair"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent"
          >
            <SignOut weight="bold" className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
