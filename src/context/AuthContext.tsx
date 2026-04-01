import { useState, type ReactNode } from "react";
import type { Role, AuthUser } from "../types/Auth";
import { AuthContext } from "./AuthContextLogic.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("token");
        return null;
      }
    }
    return null;
  });

  const login = (id_employee: string, name: string, surname: string, role: Role, token: string) => {
    const authUser: AuthUser = { id_employee, empl_name: name, empl_surname: surname, role };
    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}