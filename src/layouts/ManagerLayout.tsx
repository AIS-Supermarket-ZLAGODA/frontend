import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/manager/dashboard", label: "Звіти" },
  { to: "/manager/employees", label: "Працівники" },
  { to: "/manager/categories", label: "Категорії" },
  { to: "/manager/products", label: "Товари" },
  { to: "/manager/store", label: "Склад" },
  { to: "/manager/clients", label: "Клієнти" },
  { to: "/manager/receipts", label: "Чеки" },
];

export default function ManagerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <span className="font-bold text-lg text-indigo-700">Zlagoda</span>
        </div>
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-100 text-indigo-800"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-2">
            {user?.empl_name} {user?.empl_surname}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
          >
            Вийти
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 shadow-sm flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-800">Панель управління</h1>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
