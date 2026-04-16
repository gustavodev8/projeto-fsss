import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "professor";

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Usuários do sistema (em produção, virão de um backend)
const USERS: Array<User & { password: string }> = [
  {
    name: "Administrador",
    email: "admin@fsss.edu.br",
    password: "admin@fsss",
    role: "admin",
  },
  {
    name: "Prof. Ana Silva",
    email: "ana.silva@fsss.edu.br",
    password: "professor",
    role: "professor",
  },
  {
    name: "Prof. Carlos Mendes",
    email: "carlos.mendes@fsss.edu.br",
    password: "professor",
    role: "professor",
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const found = USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (found) {
      setUser({ name: found.name, email: found.email, role: found.role });
      return true;
    }
    // Fallback: qualquer credencial válida entra como professor (para facilitar demo)
    if (email && password.length >= 4) {
      const name = email.split("@")[0].replace(/\./g, " ");
      const formatted = name.replace(/\b\w/g, (c) => c.toUpperCase());
      setUser({ name: `Prof. ${formatted}`, email, role: "professor" });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
