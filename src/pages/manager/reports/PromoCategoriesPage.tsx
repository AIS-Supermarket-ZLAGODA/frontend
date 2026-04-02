import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../../api/api";
import type {PromoCategoryRow} from "../../../types/PromoCategory.ts";

export default function PromoCategoriesPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<PromoCategoryRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get("reports/bezukh/promotional-categories/");
                setCategories(res.data);
            } catch (err) {
                console.error("Помилка завантаження акційних категорій:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                    <h2 className="text-2xl font-semibold text-gray-800">Маркетинговий аналіз акцій</h2>
                </div>
            </div>

            <div
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
                <div>
                    <h3 className="text-lg font-bold text-emerald-800 mb-2 flex items-center gap-2">
                        <span>🏷️</span> Аналіз асортименту
                    </h3>
                    <p className="text-sm text-emerald-700 max-w-3xl leading-relaxed">
                        Цей звіт виконує перевірку бази даних: він знаходить ті відділи магазину, де
                        <strong> кожен без винятку товар</strong> має хоча б одну активну акційну позицію.
                        Якщо в категорії є хоча б один товар, який продається тільки за повною ціною, ця категорія сюди
                        не потрапить.
                    </p>
                </div>
            </div>

            <div
                className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden animate-in fade-in duration-500">
                <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <span className="font-semibold text-gray-700 uppercase tracking-wider text-sm">
            Категорії, що пройшли перевірку
          </span>
                    <span
                        className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full shadow-sm">
            Знайдено збігів: {categories.length}
          </span>
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
                            <p className="text-lg font-medium text-gray-900 mb-1">Немає повністю акційних категорій</p>
                            <p className="text-sm max-w-md">
                                Наразі в магазині немає жодної категорії, в якій абсолютно всі товари були б
                                представлені на полицях за акційною ціною.
                            </p>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}