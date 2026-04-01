export type Role = "Cashier" | "Manager";

export interface AuthUser {
  id_employee: string;
  empl_name: string;
  empl_surname: string;
  role: Role;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (id_employee: string, name: string, surname: string, role: Role, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}