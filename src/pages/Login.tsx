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

    // Simula latência de rede
    setTimeout(() => {
      const ok = login(email, password);
      if (!ok) {
        setError("E-mail ou senha inválidos. Verifique suas credenciais.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Coluna esquerda — identidade visual */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-primary text-primary-foreground p-10">
        <div className="flex items-center gap-3">
          <img src={unnamedLogo} alt="Logo FSSS" className="h-10 w-10 object-contain brightness-0 invert" />
          <div>
            <p className="font-bold text-lg leading-tight tracking-tight">FSSS</p>
            <p className="text-primary-foreground/70 text-xs leading-tight">
              Faculdade e Escola
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-3xl text-primary-foreground leading-snug mb-4">
            Sistema de Reserva de Espaços e Equipamentos
          </h2>
          <p className="text-primary-foreground/75 text-sm leading-relaxed">
            Plataforma institucional para gerenciamento de reservas de salas,
            laboratórios e equipamentos pelos docentes e colaboradores da FSSS.
          </p>
        </div>

        <p className="text-primary-foreground/50 text-xs">
          Acesso restrito a professores e funcionários autorizados.
        </p>
      </div>

      {/* Coluna direita — formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src={unnamedLogo} alt="Logo FSSS" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-bold text-base leading-tight">FSSS</p>
              <p className="text-muted-foreground text-xs">Faculdade e Escola</p>
            </div>
          </div>

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
    </div>
  );
};

export default Login;
