import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import unnamedLogo from "@/assets/logo.png";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(email, password);
    if (!ok) setError("E-mail ou senha inválidos. Verifique suas credenciais.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-[#F3F4F6]">

      {/* ── Painel esquerdo — identidade visual (desktop) ── */}
      <div className="hidden lg:flex w-[44%] bg-primary flex-col justify-between p-14 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <img src={unnamedLogo} alt="Logo FSSS" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-base font-bold text-white leading-tight">FSSS</p>
            <p className="text-xs text-white/60 leading-tight">Sistema de Reservas</p>
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="text-[2.6rem] font-extrabold text-white leading-tight">
            Reserve espaços e equipamentos com facilidade.
          </h2>
          <p className="text-base text-white/65 leading-relaxed max-w-xs">
            Plataforma institucional da Faculdade e Escola para gestão de reservas de salas, laboratórios e equipamentos.
          </p>
        </div>

        <p className="text-sm text-white/35">
          Acesso restrito a professores e funcionários autorizados.
        </p>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="flex-1 flex flex-col">

        {/* Header mobile */}
        <header className="lg:hidden bg-white border-b border-border">
          <div className="h-1 bg-primary w-full" />
          <div className="px-6 py-4 flex items-center gap-3">
            <img src={unnamedLogo} alt="Logo FSSS" className="h-8 w-8 object-contain" />
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">FSSS</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Faculdade e Escola — Sistema de Reservas
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-extrabold text-[#0D1F3C] mb-1.5">Acesso ao Sistema</h1>
            <p className="text-base text-muted-foreground mb-8">
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
                  className="h-11 bg-white"
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
                  className="h-11 bg-white"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Verificando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                Credenciais de demonstração
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-white border border-border rounded-lg px-3 py-2.5">
                  <span className="font-medium text-foreground">Administrador</span>
                  <span className="font-mono text-muted-foreground">admin@fsss.edu.br / admin@fsss</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-border rounded-lg px-3 py-2.5">
                  <span className="font-medium text-foreground">Professor</span>
                  <span className="font-mono text-muted-foreground">ana.silva@fsss.edu.br / professor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="lg:hidden py-4 text-center text-xs text-muted-foreground border-t border-border">
          FSSS — Acesso restrito a professores e funcionários autorizados
        </footer>
      </div>
    </div>
  );
};

export default Login;
