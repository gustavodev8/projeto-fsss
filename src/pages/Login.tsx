import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import unnamedLogo from "@/unnamed.png";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      if (!ok) setError("E-mail ou senha inválidos. Verifique suas credenciais.");
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Topo institucional */}
      <header className="bg-card border-b border-border">
        <div className="h-1 bg-primary w-full" />
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <img src={unnamedLogo} alt="Logo FSSS" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-bold leading-tight tracking-tight text-foreground">FSSS</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              Faculdade e Escola — Sistema de Reservas
            </p>
          </div>
        </div>
      </header>

      {/* Formulário centralizado */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl text-foreground mb-1">Acesso ao Sistema</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Insira suas credenciais institucionais para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@fsss.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>

          {/* Credenciais de demonstração */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Credenciais de demonstração
            </p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between bg-muted/60 rounded px-3 py-1.5">
                <span className="font-medium text-foreground">Administrador</span>
                <span className="font-mono">admin@fsss.edu.br / admin@fsss</span>
              </div>
              <div className="flex justify-between bg-muted/60 rounded px-3 py-1.5">
                <span className="font-medium text-foreground">Professor</span>
                <span className="font-mono">ana.silva@fsss.edu.br / professor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        FSSS — Acesso restrito a professores e funcionários autorizados
      </footer>
    </div>
  );
};

export default Login;
