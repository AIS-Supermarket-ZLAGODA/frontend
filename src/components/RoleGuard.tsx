import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../context/AuthContext";
import type { ReactNode } from "react";

interface Props {
  allowedRole: Role;
  children: ReactNode;
}

export default function RoleGuard({ allowedRole, children }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== allowedRole) {
    const redirect = user?.role === "Manager" ? "/manager/dashboard" : "/cashier/pos";
    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}
