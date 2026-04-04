import { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContextLogic.ts"
import type {CheckDetail, SmallCheck} from "../../types/Check.ts";
import DatePicker from "../../components/DatePicker";

export default function MyReceiptsPage() {
  const { user } = useAuth();

  const [checks, setChecks] = useState<SmallCheck[]>([]);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedCheck, setSelectedCheck] = useState<CheckDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchChecks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {id_employee: user.id_employee};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await api.get("/checks/", {params});
      setChecks(res.data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, dateFrom, dateTo]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  const handleFilter = () => {
    fetchChecks();
  };

  const openDetail = async (checkNumber: string) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    setSelectedCheck(null);
    try {
      const res = await api.get(`/checks/${checkNumber}/`);
      setSelectedCheck(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const detailItems = selectedCheck?.items || selectedCheck?.sales || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Мої чеки</h2>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата від</label>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
        >
          Фільтрувати
        </button>
      </div>

      {/* Checks Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Номер чеку</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Картка клієнта</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Сума</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">ПДВ</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {checks.map((check) => (
              <tr
                key={check.check_number}
                className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                onClick={() => openDetail(check.check_number)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 font-mono">
                  {check.check_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {check.card_number || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(check.print_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-medium">
                  {Number(check.sum_total).toFixed(2)} грн
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {Number(check.vat).toFixed(2)} грн
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(check.check_number);
                    }}
                    className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
                  >
                    Деталі
                  </button>
                </td>
              </tr>
            ))}
            {checks.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                  Чеків не знайдено
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-emerald-500 font-medium">
                  <span className="animate-pulse">Завантаження...</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="py-12 text-center text-emerald-500 font-medium">
                <span className="animate-pulse">Завантаження...</span>
              </div>
            ) : selectedCheck ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Чек #{selectedCheck.check_number}
                  </h3>
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <span className="text-gray-500">Касир:</span>{" "}
                    <span className="font-medium text-gray-800">{selectedCheck.id_employee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Картка клієнта:</span>{" "}
                    <span className="font-medium text-gray-800">{selectedCheck.card_number || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Дата:</span>{" "}
                    <span className="font-medium text-gray-800">{formatDate(selectedCheck.print_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Загальна сума:</span>{" "}
                    <span className="font-bold text-gray-900">{Number(selectedCheck.sum_total).toFixed(2)} грн</span>
                  </div>
                </div>

                {detailItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Товари в чеку</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Назва</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">UPC</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">К-сть</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Ціна</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Сума</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {detailItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm text-gray-900">{item.product_name || "—"}</td>
                              <td className="px-4 py-2 text-sm text-gray-500 font-mono">{item.UPC}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{item.product_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-700 text-right">{Number(item.selling_price).toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                {(Number(item.selling_price) * item.product_number).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    ПДВ: <span className="font-medium">{Number(selectedCheck.vat).toFixed(2)} грн</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Всього: {Number(selectedCheck.sum_total).toFixed(2)} грн
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                  >
                    Закрити
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-red-500">Не вдалося завантажити деталі чеку</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
