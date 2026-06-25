import { apiGet, apiPost } from "@/lib/api";
import type { UserRole } from "@/types";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

type LoginResponse = {
  user: { id: string; name: string; email: string; role: UserRole } | null;
  expiresAt?: number | null;
};

export async function signIn(email: string, password: string): Promise<DbUser | null> {
  const data = await apiPost<LoginResponse>("/auth/login", { email, password });
  if (!data.user) return null;

  return {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
}

export async function restoreCurrentUser(): Promise<DbUser | null> {
  const data = await apiGet<LoginResponse & { expired?: boolean }>("/auth/me");
  if (!data.user || data.expired) return null;
  return {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
  };
}

export async function signOut(): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } catch {
    // Ignore logout failures and clear locally.
  }
}
