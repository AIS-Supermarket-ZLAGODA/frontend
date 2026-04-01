import { useState, useEffect } from "react";
import type {Employee} from "../../types/Employee.ts";
import api from "../../api/api";
import * as XLSX from "xlsx";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchSurname, setSearchSurname] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    empl_surname: "",
    empl_name: "",
    empl_patronymic: "",
    empl_role: "Касир",
    salary: "",
    date_of_birth: "",
    date_of_start: "",
    phone_number: "",
    city: "",
    street: "",
    zip_code: "",
    password: ""
  });
  const [error, setError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employees/", { params: { empl_surname: searchSurname || undefined } });
      let data: Employee[] = res.data;
      if (filterRole) {
        data = data.filter((e) => e.empl_role === filterRole);
      }
      const sorted = data.sort((a, b) => a.empl_surname.localeCompare(b.empl_surname));
      setEmployees(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchSurname, filterRole]);

  const handleOpenModal = (employee?: Employee) => {
    setError("");
    if (employee) {
      setCurrentEmployee(employee);
      setFormData({
        empl_surname: employee.empl_surname,
        empl_name: employee.empl_name,
        empl_patronymic: employee.empl_patronymic || "",
        empl_role: employee.empl_role,
        salary: String(employee.salary),
        date_of_birth: employee.date_of_birth,
        date_of_start: employee.date_of_start,
        phone_number: employee.phone_number,
        city: employee.city,
        street: employee.street,
        zip_code: employee.zip_code,
        password: ""
      });
    } else {
      setCurrentEmployee(null);
      setFormData({
        empl_surname: "",
        empl_name: "",
        empl_patronymic: "",
        empl_role: "Касир",
        salary: "",
        date_of_birth: "",
        date_of_start: "",
        phone_number: "",
        city: "",
        street: "",
        zip_code: "",
        password: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.empl_surname || !formData.empl_name || !formData.empl_role || !formData.salary || !formData.date_of_birth || !formData.date_of_start || !formData.phone_number || !formData.city || !formData.street || !formData.zip_code) {
      setError("Усі обов'язкові поля мають бути заповнені");
      return;
    }
    if (!currentEmployee && !formData.password) {
      setError("Пароль є обов'язковим для нового працівника");
      return;
    }
    try {
      const payload: any = {
        empl_surname: formData.empl_surname,
        empl_name: formData.empl_name,
        empl_patronymic: formData.empl_patronymic || null,
        empl_role: formData.empl_role,
        salary: Number(formData.salary),
        date_of_birth: formData.date_of_birth,
        date_of_start: formData.date_of_start,
        phone_number: formData.phone_number,
        city: formData.city,
        street: formData.street,
        zip_code: formData.zip_code
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      if (currentEmployee) {
        await api.put(`/employees/${currentEmployee.id_employee}/`, payload);
      } else {
        await api.post("/employees/", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: any } };
      const data = axiosErr.response?.data;
      if (data?.error) {
        setError(data.error);
      } else if (data && typeof data === 'object') {
        const errorMessages = Object.values(data).flat().join(" | ");
        setError(errorMessages || "Помилка при збереженні");
      } else {
        setError("Помилка при збереженні");
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteError("");
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await api.delete(`/employees/${deleteConfirmId}/`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosErr.response?.data?.error || "Помилка при видаленні");
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Прізвище", "Ім'я", "По батькові", "Посада", "Зарплата", "Дата народження", "Дата початку роботи", "Телефон", "Місто", "Вулиця", "Поштовий індекс"];
    const rows = employees.map(e => [
      `"${e.id_employee}"`,
      `"${e.empl_surname.replace(/"/g, '""')}"`,
      `"${e.empl_name.replace(/"/g, '""')}"`,
      `"${(e.empl_patronymic || "").replace(/"/g, '""')}"`,
      `"${e.empl_role}"`,
      e.salary,
      e.date_of_birth,
      e.date_of_start,
      `"${e.phone_number}"`,
      `"${e.city.replace(/"/g, '""')}"`,
      `"${e.street.replace(/"/g, '""')}"`,
      `"${e.zip_code}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "employees.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(employees.map(e => ({
      "ID": e.id_employee,
      "Прізвище": e.empl_surname,
      "Ім'я": e.empl_name,
      "По батькові": e.empl_patronymic || "",
      "Посада": e.empl_role,
      "Зарплата": e.salary,
      "Дата народження": e.date_of_birth,
      "Дата початку роботи": e.date_of_start,
      "Телефон": e.phone_number,
      "Місто": e.city,
      "Вулиця": e.street,
      "Поштовий індекс": e.zip_code
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Працівники");
    XLSX.writeFile(wb, "employees.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Працівники</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative group">
              <button
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Експорт ▼
              </button>
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={exportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md cursor-pointer">CSV</button>
                <button onClick={exportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md cursor-pointer">Excel</button>
              </div>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              + Додати працівника
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Пошук за прізвищем..."
            value={searchSurname}
            onChange={e => setSearchSurname(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="flex-1 sm:max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Усі</option>
            <option value="Касир">Касир</option>
            <option value="Менеджер">Менеджер</option>
          </select>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table id="employees-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Прізвище</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ім'я</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">По батькові</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Посада</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Зарплата</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Телефон</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Адреса</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((e) => (
              <tr key={e.id_employee} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.id_employee}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{e.empl_surname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{e.empl_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.empl_patronymic || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    e.empl_role === "Касир"
                      ? "bg-green-100 text-green-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {e.empl_role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{e.salary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.phone_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{e.city}</span>
                    <span className="text-gray-500 text-xs">{`${e.street} (${e.zip_code})`}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(e)} className="text-indigo-600 hover:text-indigo-900 cursor-pointer">Редагувати</button>
                  <button onClick={() => handleDeleteClick(e.id_employee)} className="text-red-500 hover:text-red-700 cursor-pointer">Видалити</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Не знайдено працівників</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Завантаження...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentEmployee ? "Редагувати працівника" : "Новий працівник"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                <input
                  type="text"
                  value={formData.empl_surname}
                  onChange={(e) => setFormData({...formData, empl_surname: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть прізвище"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                <input
                  type="text"
                  value={formData.empl_name}
                  onChange={(e) => setFormData({...formData, empl_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть ім'я"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">По батькові</label>
                <input
                  type="text"
                  value={formData.empl_patronymic}
                  onChange={(e) => setFormData({...formData, empl_patronymic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть по батькові (необов'язково)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Посада</label>
                <select
                  value={formData.empl_role}
                  onChange={(e) => setFormData({...formData, empl_role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-shadow"
                >
                  <option value="Касир">Касир</option>
                  <option value="Менеджер">Менеджер</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Зарплата</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть зарплату"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата народження</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата початку роботи</label>
                <input
                  type="date"
                  value={formData.date_of_start}
                  onChange={(e) => setFormData({...formData, date_of_start: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="+380XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть місто"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Вулиця</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть вулицю"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Поштовий індекс</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть поштовий індекс"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder={currentEmployee ? "Залиште порожнім, щоб не змінювати" : "Введіть пароль"}
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm cursor-pointer"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модалка для підтвердження видалення / помилок */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
                {deleteError ? "Помилка видалення" : "Підтвердження"}
            </h3>

            {deleteError ? (
                <>
                  <p className="text-red-600 mb-6 font-medium">{deleteError}</p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setDeleteConfirmId(null);
                        setDeleteError("");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium cursor-pointer"
                    >
                      Зрозуміло
                    </button>
                  </div>
                </>
            ) : (
                <>
                  <p className="text-gray-600 mb-6">Ви дійсно хочете видалити цього працівника? Усі незбережені дані будуть втрачені.</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm cursor-pointer font-medium"
                    >
                      Видалити
                    </button>
                  </div>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
