import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Мій профіль</h2>
      <div className="bg-white rounded-lg shadow p-6 max-w-md">
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-500">Ім'я:</span>
            <p className="font-medium">{user?.empl_name} {user?.empl_surname}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">ID:</span>
            <p className="font-medium">{user?.id_employee}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Роль:</span>
            <p className="font-medium">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
