import { useState, useEffect } from "react";
import api from "../../api/api";
import type {CustomerCard} from "../../types/CustomerCard.ts";

export default function CashierClientsPage() {
  const [customers, setCustomers] = useState<CustomerCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchSurname, setSearchSurname] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [formCardNumber, setFormCardNumber] = useState("");
  const [formSurname, setFormSurname] = useState("");
  const [formName, setFormName] = useState("");
  const [formPatronymic, setFormPatronymic] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formZipCode, setFormZipCode] = useState("");
  const [formPercent, setFormPercent] = useState("0");

  const fetchCustomers = async (surname?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (surname?.trim()) params.surname = surname;
      const res = await api.get("/customers/", { params });
      const sorted = res.data.sort((a: CustomerCard, b: CustomerCard) =>
        a.cust_surname.localeCompare(b.cust_surname)
      );
      setCustomers(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchSurname);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchSurname]);

  const handleOpenModal = () => {
    setError("");
    setFormCardNumber("");
    setFormSurname("");
    setFormName("");
    setFormPatronymic("");
    setFormPhone("");
    setFormCity("");
    setFormStreet("");
    setFormZipCode("");
    setFormPercent("0");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formCardNumber.trim() || !formSurname.trim() || !formName.trim() || !formPhone.trim()) {
      setError("Заповніть обов'язкові поля: номер картки, прізвище, ім'я, телефон");
      return;
    }
    try {
      await api.post("/customers/", {
        card_number: formCardNumber,
        cust_surname: formSurname,
        cust_name: formName,
        cust_patronymic: formPatronymic || null,
        phone_number: formPhone,
        city: formCity || null,
        street: formStreet || null,
        zip_code: formZipCode || null,
        percent: parseInt(formPercent) || 0,
      });
      setIsModalOpen(false);
      fetchCustomers(searchSurname);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Клієнти</h2>
        <button
          onClick={handleOpenModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
        >
          + Додати клієнта
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Пошук за прізвищем..."
          value={searchSurname}
          onChange={(e) => setSearchSurname(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
        />
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Номер картки</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Прізвище</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ім'я</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">По батькові</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Телефон</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Місто</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Знижка %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.card_number} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{c.card_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.cust_surname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.cust_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.cust_patronymic || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.phone_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.city || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {c.percent}%
                  </span>
                </td>
              </tr>
            ))}
            {customers.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                  Клієнтів не знайдено
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-emerald-500 font-medium">
                  <span className="animate-pulse">Завантаження...</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Новий клієнт</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Номер картки *</label>
                <input
                  type="text"
                  value={formCardNumber}
                  onChange={(e) => setFormCardNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  placeholder="Введіть номер картки"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Прізвище *</label>
                  <input
                    type="text"
                    value={formSurname}
                    onChange={(e) => setFormSurname(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    placeholder="Прізвище"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ім'я *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    placeholder="Ім'я"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">По батькові</label>
                <input
                  type="text"
                  value={formPatronymic}
                  onChange={(e) => setFormPatronymic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  placeholder="По батькові"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  placeholder="+380..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Місто</label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    placeholder="Місто"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Вулиця</label>
                  <input
                    type="text"
                    value={formStreet}
                    onChange={(e) => setFormStreet(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    placeholder="Вулиця"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Поштовий індекс</label>
                  <input
                    type="text"
                    value={formZipCode}
                    onChange={(e) => setFormZipCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    placeholder="Індекс"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Знижка %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formPercent}
                    onChange={(e) => setFormPercent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
