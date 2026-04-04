import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../../api/api";
import * as XLSX from "xlsx";
import type {ZmeulUniversalCategoryRow} from "../../../types/ZmeulUniversalCategory.ts";

export default function ZmeulUniversalCategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ZmeulUniversalCategoryRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get("reports/zmeul/universal-categories/");
                setCategories(res.data);
            } catch (err) {
                console.error("Помилка завантаження універсальних категорій:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const exportCSV = () => {
        const headers = ["Номер категорії", "Назва категорії"];
        const rows = categories.map(c => [
            c.category_number,
            `"${c.category_name.replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], {type: "text/csv;charset=utf-8;"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "universal_categories.csv";
        link.click();
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(categories.map(c => ({
            "Номер категорії": c.category_number,
            "Назва категорії": c.category_name
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Універсальні_категорії");
        XLSX.writeFile(wb, "universal_categories.xlsx");
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

            <button
                onClick={() => navigate("/manager/dashboard")}
                className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors duration-200 cursor-pointer w-fit"
            >
                <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
                Назад до панелі звітів
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Пошук найпопулярніших категорій</h2>
                </div>
            </div>

            <div
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <span>🏷️</span> Аналіз "Універсальних" категорій
                    </h3>
                    <p className="text-sm text-emerald-700 max-w-3xl leading-relaxed">
                        Цей звіт виконує перевірку бази даних: він знаходить такі категорії, товари з яких настільки популярні, що їх пробивав абсолютно 
                        <strong> кожен касир у цьому супермаркеті</strong>. Як працює подвійне заперечення (Реляційне ділення): Ми шукаємо таку категорію (Х), для якої НЕ існує касира, який би НЕ продав хоча б один товар із цієї категорії.
                    </p>
                </div>
            </div>

            <div
                className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden animate-in fade-in duration-500">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                    <span className="font-semibold text-gray-700 uppercase tracking-wider text-sm">
                        Категорії, що пройшли перевірку
                    </span>
                    <div className="flex items-center gap-4">
                        <span
                            className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full shadow-sm">
                            Знайдено збігів: {categories.length}
                        </span>
                        
                        <div className="relative group">
                            <button
                                disabled={categories.length === 0}
                                className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center bg-white"
                            >
                                Експорт ▼
                            </button>
                            {categories.length > 0 && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                                    <button onClick={exportCSV} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">CSV</button>
                                    <button onClick={exportExcel} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">Excel</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <ul className="divide-y divide-gray-100">
                    {loading ? (
                        <li className="px-6 py-16 flex justify-center items-center text-emerald-600 font-medium">
                            Аналізуємо БД...
                        </li>
                    ) : categories.length > 0 ? (
                        categories.map((cat) => (
                            <li key={cat.category_number}
                                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <div
                                    className="h-10 w-10 shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                    {cat.category_number}
                                </div>
                                <span className="text-lg font-medium text-gray-900">{cat.category_name}</span>
                            </li>
                        ))
                    ) : (
                        <li className="px-6 py-16 flex flex-col items-center text-center text-gray-500">
                            <div
                                className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                                <span className="text-2xl">🔍</span>
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-1">Немає універсальних категорій</p>
                            <p className="text-sm max-w-md">
                                Наразі в магазині немає жодної категорії, в якій абсолютно кожен касир продав би хоча б один товар.
                            </p>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
