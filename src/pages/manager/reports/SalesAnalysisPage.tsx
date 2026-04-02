import {useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../../api/api";
import * as XLSX from "xlsx";
import type {SalesAnalysisRow} from "../../../types/SalesAnalysis.ts";

export default function SalesAnalysisPage() {
    const navigate = useNavigate();
    const [salesData, setSalesData] = useState<SalesAnalysisRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            const res = await api.get("reports/bezukh/sales-analysis/", {params});
            setSalesData(res.data);
        } catch (err) {
            console.error("Помилка завантаження звіту:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        const headers = ["Категорія", "Товар", "Продано (шт)", "Виручка за товар", "Загалом по категорії"];
        const rows = salesData.map(r => [
            `"${r.category_name.replace(/"/g, '""')}"`,
            `"${r.product_name.replace(/"/g, '""')}"`,
            r.total_quantity_sold,
            Number(r.product_revenue).toFixed(2),
            Number(r.total_category_revenue).toFixed(2)
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], {type: "text/csv;charset=utf-8;"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "sales_analysis.csv";
        link.click();
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(salesData.map(r => ({
            "Категорія": r.category_name,
            "Товар": r.product_name,
            "Продано (шт)": r.total_quantity_sold,
            "Виручка за товар": Number(r.product_revenue).toFixed(2),
            "Загалом по категорії": Number(r.total_category_revenue).toFixed(2)
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Аналіз_продажів");
        XLSX.writeFile(wb, "sales_analysis.xlsx");
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

            <button
                onClick={() => navigate("/manager/dashboard")}
                className="group flex items-center gap-2 w-fit cursor-pointer"
            >
                <span
                    className="text-gray-500 transition-all duration-200 group-hover:-translate-x-1 group-hover:text-indigo-600">
                    ←
                </span>
                <span
                    className="text-sm font-medium text-gray-500 transition-colors duration-200 group-hover:text-indigo-600">
                    Назад до панелі звітів
                </span>
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Ієрархія продажів</h2>
                </div>
            </div>

            <div
                className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2">
                        <span>📊</span> Аналіз ієрархії виручки
                    </h3>
                    <p className="text-sm text-indigo-700 max-w-3xl leading-relaxed">
                        Цей звіт демонструє багаторівневу агрегацію даних. Він підраховує виручку для кожного окремого
                        товару, а також використовує <strong>віконні функції (Window Functions)</strong> для
                        паралельного розрахунку загального доходу всієї категорії в тому ж рядку. Це дозволяє менеджеру
                        миттєво оцінити частку конкретного товару в загальному обороті відділу.
                    </p>
                </div>
            </div>

            <div
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Період з</label>
                    <input
                        type="datetime-local"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Період по</label>
                    <input
                        type="datetime-local"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:bg-indigo-300 cursor-pointer h-[44px]"
                >
                    {loading ? "Формування..." : "Сформувати"}
                </button>

                {/* Новий випадаючий список Експорту */}
                <div className="relative group">
                    <button
                        disabled={salesData.length === 0}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 cursor-pointer h-[44px] flex items-center bg-white"
                    >
                        Експорт ▼
                    </button>
                    {salesData.length > 0 && (
                        <div
                            className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button onClick={exportCSV}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md cursor-pointer">CSV
                            </button>
                            <button onClick={exportExcel}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md cursor-pointer">Excel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Категорія</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Товар</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Продано
                            (шт)
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Виручка
                            товару
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-black text-indigo-700 uppercase bg-indigo-50/50 tracking-wider border-l border-indigo-100">
                            Загалом по категорії
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                    {salesData.map((row, idx) => {
                        // 1. Перевіряємо, чи це перший рядок нової категорії
                        const isFirstInCategory =
                            idx === 0 || salesData[idx - 1].category_name !== row.category_name;

                        // 2. Якщо так, рахуємо, скільки всього товарів у цій категорії
                        let rowSpan = 1;
                        if (isFirstInCategory) {
                            rowSpan = salesData.filter(
                                (r) => r.category_name === row.category_name
                            ).length;
                        }

                        return (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">

                                {isFirstInCategory && (
                                    <td
                                        rowSpan={rowSpan}
                                        className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-100 align-top bg-white"
                                    >
                                        {row.category_name}
                                    </td>
                                )}

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {row.product_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-medium">
                                    {row.total_quantity_sold}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                                    {Number(row.product_revenue).toFixed(2)} ₴
                                </td>

                                {isFirstInCategory && (
                                    <td
                                        rowSpan={rowSpan}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-indigo-700 bg-indigo-50/50 border-l border-indigo-100 align-top"
                                    >
                                        {Number(row.total_category_revenue).toFixed(2)} ₴
                                    </td>
                                )}
                            </tr>
                        );
                    })}

                    {salesData.length === 0 && !loading && (
                        <tr>
                            <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                                <span className="text-4xl mb-3 block">📊</span>
                                Вкажіть період та натисніть "Сформувати", щоб побачити аналітику
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}