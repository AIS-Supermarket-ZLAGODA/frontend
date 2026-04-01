import { useState, useEffect } from "react";
import type {Check, SaleItem} from "../../types/Check.ts";
import type {EmployeeShort} from "../../types/Employee.ts"
import api from "../../api/api";
import * as XLSX from "xlsx";


export default function ReceiptsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [employees, setEmployees] = useState<EmployeeShort[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [detailCheck, setDetailCheck] = useState<Check | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employees/");
        setEmployees(res.data);
      } catch (err) {
        console.error("Помилка завантаження працівників:", err);
      }
    };
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterEmployee) params.id_employee = filterEmployee;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get("/checks/", {params});
      setChecks(res.data);
    } catch (err) {
      console.error("Помилка завантаження чеків:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [filterEmployee, dateFrom, dateTo]);

  const handleViewDetail = async (check: Check) => {
    setDetailCheck(check);
    setDetailLoading(true);
    try {
      const res = await api.get(`/checks/${check.check_number}/`);
      setSaleItems(res.data.sales || res.data.items || []);
    } catch (err) {
      console.error(err);
      setSaleItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteError("");
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await api.delete(`/checks/${deleteConfirmId}/`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosErr.response?.data?.error || "Помилка при видаленні");
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id_employee === id);
    return emp ? `${emp.empl_surname} ${emp.empl_name}` : id;
  };

  const exportCSV = () => {
    const headers = ["Номер чеку", "Касир", "Картка клієнта", "Дата", "Сума", "ПДВ"];
    const rows = checks.map(c => [
      `"${c.check_number}"`,
      `"${(c.empl_surname ? c.empl_surname + " " + c.empl_name : getEmployeeName(c.id_employee)).replace(/"/g, '""')}"`,
      c.card_number || "",
      `"${c.print_date}"`,
      c.sum_total,
      c.vat
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "receipts.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(checks.map(c => ({
      "Номер чеку": c.check_number,
      "Касир": c.empl_surname ? c.empl_surname + " " + c.empl_name : getEmployeeName(c.id_employee),
      "Картка клієнта": c.card_number || "",
      "Дата": c.print_date,
      "Сума": c.sum_total,
      "ПДВ": c.vat
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Чеки");
    XLSX.writeFile(wb, "receipts.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Чеки</h2>
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
        </div>
      </div>

      <div
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
        <select
            value={filterEmployee}
            onChange={e => setFilterEmployee(e.target.value)}
            className="flex-1 sm:max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">Усі касири</option>
          {employees.map(e => (
              <option key={e.id_employee} value={e.id_employee}>{e.empl_surname} {e.empl_name}</option>
          ))}
        </select>

        <div className="flex-1 space-y-1">
          <label className="text-xs text-gray-500 ml-1">Дата з</label>
          <input
              type="datetime-local"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs text-gray-500 ml-1">Дата по</label>
          <input
              type="datetime-local"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setFilterEmployee("");
            }}
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Очистити все
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Номер чеку</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Касир</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Картка клієнта</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Сума</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ПДВ</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {checks.map((c) => (
              <tr key={c.check_number} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{c.check_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {c.empl_surname ? `${c.empl_surname} ${c.empl_name}` : getEmployeeName(c.id_employee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.card_number || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.print_date).toLocaleString('uk-UA')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Number(c.sum_total).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(c.vat).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleViewDetail(c)} className="text-indigo-600 hover:text-indigo-900 cursor-pointer">Деталі</button>
                  <button onClick={() => handleDeleteClick(c.check_number)} className="text-red-500 hover:text-red-700 cursor-pointer">Видалити</button>
                </td>
              </tr>
            ))}
            {checks.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Немає чеків</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Завантаження...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detailCheck && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Деталі чеку #{detailCheck.check_number}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Касир</span>
                <p className="font-medium text-gray-900">
                  {detailCheck.empl_surname ? `${detailCheck.empl_surname} ${detailCheck.empl_name}` : getEmployeeName(detailCheck.id_employee)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Картка клієнта</span>
                <p className="font-medium text-gray-900">{detailCheck.card_number || "—"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Дата</span>
                <p className="font-medium text-gray-900">{detailCheck.print_date}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Сума / ПДВ</span>
                <p className="font-medium text-gray-900">{Number(detailCheck.sum_total).toFixed(2)} / {Number(detailCheck.vat).toFixed(2)}</p>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">Товари в чеку</h4>
            {detailLoading ? (
              <p className="text-gray-500 text-center py-4">Завантаження...</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Товар</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">UPC</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Кількість</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ціна</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Сума</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {saleItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-900">{item.product_name || "—"}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.UPC}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.product_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{Number(item.selling_price).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{(item.product_number * Number(item.selling_price)).toFixed(2)}</td>
                    </tr>
                  ))}
                  {saleItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-500">Немає товарів</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDetailCheck(null)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors cursor-pointer"
              >
                Закрити
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
                  <p className="text-gray-600 mb-6">Ви дійсно хочете видалити цей чек? Усі незбережені дані будуть втрачені.</p>
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
