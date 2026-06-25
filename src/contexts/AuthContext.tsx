import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { restoreCurrentUser, signIn, signOut } from "@/services/auth";

export type UserRole = "admin" | "professor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const STORAGE_KEY = "fsss_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

interface StoredSession {
  user: User;
  expiresAt: number;
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session.user;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveSession(user: User): void {
  const session: StoredSession = { user, expiresAt: Date.now() + SESSION_TTL_MS };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const current = await restoreCurrentUser();
        if (cancelled) return;

        if (current) {
          const u: User = {
            id: current.id,
            name: current.name,
            email: current.email,
            role: current.role,
          };
          setUser(u);
          saveSession(u);
        } else {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        if (!cancelled) {
          const persisted = loadSession();
          setUser(persisted);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const dbUser = await signIn(email, password);
    if (!dbUser) return false;
    const u: User = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
    setUser(u);
    saveSession(u);
    return true;
  };

  const logout = () => {
    void signOut();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
