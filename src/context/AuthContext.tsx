import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "Cashier" | "Manager";

interface AuthUser {
  id_employee: string;
  empl_name: string;
  empl_surname: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (id_employee: string, name: string, surname: string, role: Role, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("token");
      }
    }
  }, []);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
