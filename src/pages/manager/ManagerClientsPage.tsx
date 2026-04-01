import { useState, useEffect, useCallback } from "react";
import type {CustomerCard} from "../../types/CustomerCard.ts";
import api from "../../api/api";
import * as XLSX from "xlsx";

export default function ManagerClientsPage() {
  const [customers, setCustomers] = useState<CustomerCard[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchSurname, setSearchSurname] = useState("");
  const [filterPercent, setFilterPercent] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerCard | null>(null);

  const [formData, setFormData] = useState({
    card_number: "",
    cust_surname: "",
    cust_name: "",
    cust_patronymic: "",
    phone_number: "",
    city: "",
    street: "",
    zip_code: "",
    percent: "0"
  });
  const [error, setError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      if (searchSurname)
        params.surname = searchSurname;
      else if (filterPercent !== "")
        params.percent = filterPercent;

      const res = await api.get("/customers/", {params});
      setCustomers(res.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchSurname, filterPercent]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  const handleSurnameChange = (val: string) => {
    setSearchSurname(val);
    if (val) setFilterPercent("");
  };

  const handlePercentChange = (val: string) => {
    setFilterPercent(val);
    if (val) setSearchSurname("");
  };

  const handleOpenModal = (customer?: CustomerCard) => {
    setError("");
    if (customer) {
      setCurrentCustomer(customer);
      setFormData({
        card_number: customer.card_number,
        cust_surname: customer.cust_surname,
        cust_name: customer.cust_name,
        cust_patronymic: customer.cust_patronymic || "",
        phone_number: customer.phone_number,
        city: customer.city || "",
        street: customer.street || "",
        zip_code: customer.zip_code || "",
        percent: String(customer.percent)
      });
    } else {
      setCurrentCustomer(null);
      setFormData({
        card_number: "",
        cust_surname: "",
        cust_name: "",
        cust_patronymic: "",
        phone_number: "",
        city: "",
        street: "",
        zip_code: "",
        percent: "0"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.card_number || !formData.cust_surname || !formData.cust_name || !formData.phone_number) {
      setError("Номер картки, прізвище, ім'я та телефон є обов'язковими");
      return;
    }
    try {
      const payload = {
        card_number: formData.card_number,
        cust_surname: formData.cust_surname,
        cust_name: formData.cust_name,
        cust_patronymic: formData.cust_patronymic || null,
        phone_number: formData.phone_number,
        city: formData.city || null,
        street: formData.street || null,
        zip_code: formData.zip_code || null,
        percent: Number(formData.percent)
      };
      if (currentCustomer) {
        await api.put(`/customers/${currentCustomer.card_number}/`, payload);
      } else {
        await api.post("/customers/", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      const data = axiosErr.response?.data;

      if (data && typeof data === "object") {
        if (typeof data.error === "string") {
          setError(data.error);
        } else {
          const errorMessages = Object.values(data)
              .flat()
              .join(" | ");
          setError(errorMessages || "Помилка при збереженні");
        }
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
      await api.delete(`/customers/${deleteConfirmId}/`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosErr.response?.data?.error || "Помилка при видаленні");
    }
  };

  const getDiscountBadge = (percent: number) => {
    if (percent >= 20) return "bg-purple-100 text-purple-800";
    if (percent >= 10) return "bg-green-100 text-green-800";
    if (percent >= 5) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const exportCSV = () => {
    const headers = ["Номер картки", "Прізвище", "Ім'я", "По батькові", "Телефон", "Місто", "Вулиця", "Індекс", "Знижка %"];
    const rows = customers.map(c => [
      `"${c.card_number}"`,
      `"${c.cust_surname.replace(/"/g, '""')}"`,
      `"${c.cust_name.replace(/"/g, '""')}"`,
      `"${(c.cust_patronymic || "").replace(/"/g, '""')}"`,
      `"${c.phone_number}"`,
      `"${(c.city || "").replace(/"/g, '""')}"`,
      `"${(c.street || "").replace(/"/g, '""')}"`,
      `"${c.zip_code || ""}"`,
      c.percent
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "customers.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers.map(c => ({
      "Номер картки": c.card_number,
      "Прізвище": c.cust_surname,
      "Ім'я": c.cust_name,
      "По батькові": c.cust_patronymic || "",
      "Телефон": c.phone_number,
      "Місто": c.city || "",
      "Вулиця": c.street || "",
      "Індекс": c.zip_code || "",
      "Знижка %": c.percent
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Клієнти");
    XLSX.writeFile(wb, "customers.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Клієнти</h2>
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
              + Додати клієнта
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        {/* Пошук за прізвищем */}
        <div className="flex-1 relative">
            <input
                type="text"
                placeholder="Шукати за прізвищем..."
                value={searchSurname}
                onChange={e => handleSurnameChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
        </div>

        <div className="hidden sm:flex items-center text-gray-300 font-light">АБО</div>

        {/* Пошук за відсотком */}
        <div className="w-full sm:w-64 relative">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">%</div>
            <input type="number" min="0" max="100"
                   placeholder="Фільтр за знижкою..."
                   value={filterPercent}
                   onChange={e => handlePercentChange(e.target.value)}
                   className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
        </div>
      </div>



      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Номер картки</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Прізвище</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ім'я</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">По батькові</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Телефон</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Місто</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Знижка %</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((c) => (
              <tr key={c.card_number} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.card_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.cust_surname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.cust_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.cust_patronymic || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.city || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDiscountBadge(c.percent)}`}>
                    {c.percent}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(c)} className="text-indigo-600 hover:text-indigo-900 cursor-pointer">Редагувати</button>
                  <button onClick={() => handleDeleteClick(c.card_number)} className="text-red-500 hover:text-red-700 cursor-pointer">Видалити</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Не знайдено клієнтів</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Завантаження...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentCustomer ? "Редагувати клієнта" : "Новий клієнт"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер картки</label>
                <input
                  type="text"
                  value={formData.card_number}
                  onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть номер картки"
                  disabled={!!currentCustomer}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище</label>
                  <input
                    type="text"
                    value={formData.cust_surname}
                    onChange={(e) => setFormData({...formData, cust_surname: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Прізвище"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я</label>
                  <input
                    type="text"
                    value={formData.cust_name}
                    onChange={(e) => setFormData({...formData, cust_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Ім'я"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">По батькові</label>
                <input
                  type="text"
                  value={formData.cust_patronymic}
                  onChange={(e) => setFormData({...formData, cust_patronymic: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="По батькові (необов'язково)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="+380..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Місто"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Індекс</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Поштовий індекс"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Вулиця</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({...formData, street: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Вулиця, будинок"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Знижка (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percent}
                  onChange={(e) => setFormData({...formData, percent: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="0"
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

      {/* Delete confirmation modal */}
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
                  <p className="text-gray-600 mb-6">Ви дійсно хочете видалити цього клієнта? Усі незбережені дані будуть втрачені.</p>
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
