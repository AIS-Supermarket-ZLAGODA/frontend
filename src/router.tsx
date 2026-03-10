import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import CashierLayout from "./layouts/CashierLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import PosPage from "./pages/cashier/PosPage";
import CashierProductsPage from "./pages/cashier/CashierProductsPage";
import CashierClientsPage from "./pages/cashier/CashierClientsPage";
import MyReceiptsPage from "./pages/cashier/MyReceiptsPage";
import ProfilePage from "./pages/cashier/ProfilePage";
import DashboardPage from "./pages/manager/DashboardPage";
import EmployeesPage from "./pages/manager/EmployeesPage";
import CategoriesPage from "./pages/manager/CategoriesPage";
import ManagerProductsPage from "./pages/manager/ManagerProductsPage";
import StorePage from "./pages/manager/StorePage";
import ManagerClientsPage from "./pages/manager/ManagerClientsPage";
import ReceiptsPage from "./pages/manager/ReceiptsPage";
import RoleGuard from "./components/RoleGuard";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/cashier",
    element: (
      <RoleGuard allowedRole="Cashier">
        <CashierLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="pos" replace /> },
      { path: "pos", element: <PosPage /> },
      { path: "products", element: <CashierProductsPage /> },
      { path: "clients", element: <CashierClientsPage /> },
      { path: "receipts", element: <MyReceiptsPage /> },
      { path: "profile", element: <ProfilePage /> },
    ],
  },
  {
    path: "/manager",
    element: (
      <RoleGuard allowedRole="Manager">
        <ManagerLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "employees", element: <EmployeesPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "products", element: <ManagerProductsPage /> },
      { path: "store", element: <StorePage /> },
      { path: "clients", element: <ManagerClientsPage /> },
      { path: "receipts", element: <ReceiptsPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
