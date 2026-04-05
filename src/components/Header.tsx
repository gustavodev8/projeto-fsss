import { useAuth } from "@/contexts/AuthContext";
import { LogOut, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <button onClick={() => navigate("/")} className="font-sans font-bold text-lg text-foreground tracking-tight">
        ReservaEdu
      </button>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/minhas-reservas")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Minhas Reservas</span>
        </button>
        <span className="text-sm text-foreground font-medium">{user?.name}</span>
        <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
