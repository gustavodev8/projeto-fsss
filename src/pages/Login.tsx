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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm">
            <img src={unnamedLogo} alt="FSSS" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">FSSS</h1>
          <p className="text-sm text-muted-foreground mt-1">Sistema de Reservas Institucional</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white border border-border rounded-2xl p-7 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">Entrar na sua conta</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Use suas credenciais institucionais para continuar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
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
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
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
                className="h-10 text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/6 border border-destructive/15 rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 text-sm font-semibold rounded-xl mt-1"
              disabled={loading}
            >
              {loading ? "Verificando..." : "Entrar"}
            </Button>
          </form>
        </div>

        {/* Credenciais de demo */}
        <div className="mt-4 bg-white border border-border rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Credenciais de demonstração
          </p>
          <div className="space-y-2">
            {[
              { role: "Administrador", email: "admin@fsss.edu.br", pass: "admin@fsss" },
              { role: "Professor", email: "ana.silva@fsss.edu.br", pass: "professor" },
            ].map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => { setEmail(c.email); setPassword(c.pass); }}
                className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted rounded-xl px-3 py-2 transition-colors group"
              >
                <span className="text-xs font-semibold text-foreground">{c.role}</span>
                <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{c.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Acesso restrito a professores e funcionários autorizados
        </p>
      </div>
    </div>
  );
};

export default Login;
