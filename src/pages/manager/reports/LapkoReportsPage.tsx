import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import DatePicker from "../../../components/DatePicker";
import type { Category } from "../../../types/Category.ts";

interface SpendingRow {
    card_number: string;
    cust_surname: string;
    cust_name: string;
    percent: number;
    total_checks: number;
    total_items: number;
    total_spent: string | number;
}

interface CustomerRow {
    card_number: string;
    cust_surname: string;
    cust_name: string;
    phone_number: string;
    percent: number;
}

export default function LapkoReportsPage() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);

    // --- State для Запиту 1 (GROUP BY) ---
    const [q1Category, setQ1Category] = useState("");
    const [q1DateFrom, setQ1DateFrom] = useState("");
    const [q1DateTo, setQ1DateTo] = useState("");
    const [q1Data, setQ1Data] = useState<SpendingRow[]>([]);
    const [q1Loading, setQ1Loading] = useState(false);
    const [q1Touched, setQ1Touched] = useState(false);

    // --- State для Запиту 2 (подвійне заперечення) ---
    const [q2Category, setQ2Category] = useState("");
    const [q2Data, setQ2Data] = useState<CustomerRow[]>([]);
    const [q2Loading, setQ2Loading] = useState(false);
    const [q2Touched, setQ2Touched] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("categories/");
                setCategories(res.data);
                if (res.data.length > 0) {
                    setQ1Category(res.data[0].category_name);
                    setQ2Category(res.data[0].category_name);
                }
            } catch (err) {
                console.error("Не вдалося завантажити категорії", err);
            }
        };
        fetchCategories();
    }, []);

    /**
     * =====================================================================
     * ПОВНИЙ КОД ПРИКЛАДНОЇ ПРОГРАМИ ДЛЯ ЗАПИТУ 1 (GROUP BY, параметричний)
     * =====================================================================
     *
     * Послідовність дій від натискання кнопки "Сформувати" до виводу:
     *
     *  1. Користувач обирає категорію у <select> та (опціонально) дати у
     *     компоненті DatePicker. Значення тримаються у React state:
     *     q1Category, q1DateFrom, q1DateTo.
     *
     *  2. Користувач натискає кнопку "Сформувати" — викликається fetchQ1().
     *
     *  3. Формуємо об'єкт query-параметрів. Порожні дати не додаємо, щоб
     *     бекенд не фільтрував за ними. Обов'язковий параметр — category_name.
     *
     *  4. api.get() — це налаштований екземпляр axios (див. api/api.ts), який
     *     автоматично:
     *       a) будує повний URL: http://<host>/api/reports/lapko/
     *          customers-category-spending/?category_name=...&date_from=...
     *       b) підставляє в заголовок Authorization токен Bearer з localStorage;
     *       c) серіалізує параметри URL-encoding.
     *
     *  5. HTTP-запит йде на Django-сервер. Router (ais/urls.py) співставляє
     *     шлях з LapkoCustomerSpendingView.get(). View валідує параметри
     *     через LapkoCustomerSpendingRequestSerializer (DRF перевіряє типи
     *     та обов'язковість поля category_name).
     *
     *  6. View викликає LapkoReportService.get_customers_category_spending(),
     *     сервіс — LapkoReportRepository, який:
     *       a) відкриває курсор на з'єднанні psycopg2 (connection.cursor);
     *       b) динамічно будує текст SQL-запиту, додаючи фільтри за датою
     *          тільки якщо вони задані (захист від SQL-ін'єкцій — параметри
     *          передаються окремим списком params, не конкатенацією);
     *       c) виконує cursor.execute(query, params) — драйвер psycopg2
     *          параметризує запит і відправляє його у PostgreSQL;
     *       d) PostgreSQL виконує SELECT з INNER JOIN по 6 таблицях
     *          (Customer_Card, Check, Sale, Store_Product, Product, Category),
     *          групує по клієнту, обчислює агрегати COUNT/SUM;
     *       e) отримані рядки перетворюються у список dict через
     *          zip(columns, row), де columns беруться з cursor.description.
     *
     *  7. Service повертає список у View, View загортає у rest_framework
     *     Response (JSON, HTTP 200). Бекенд відправляє відповідь.
     *
     *  8. axios resolve'иться. res.data — це масив SpendingRow. Записуємо у
     *     state через setQ1Data(...). React перерендерює компонент, і таблиця
     *     нижче наповнюється даними.
     *
     *  9. У випадку помилки (400 — невалідні параметри, 500 — БД):
     *     catch-блок логує помилку у консоль; finally гарантує вимкнення
     *     стану завантаження (setQ1Loading(false)).
     */
    const fetchQ1 = async () => {
        setQ1Loading(true);
        setQ1Touched(true);
        try {
            // Збираємо query-параметри (обов'язкові + опціональні)
            const params: Record<string, string> = { category_name: q1Category };
            if (q1DateFrom) params.date_from = q1DateFrom;
            if (q1DateTo) params.date_to = q1DateTo;

            // Надсилаємо GET-запит на бекенд (Django) через axios
            const res = await api.get("reports/lapko/customers-category-spending/", { params });

            // Отриманий JSON-масив кладемо у state — React перерендерить таблицю
            setQ1Data(res.data);
        } catch (err) {
            console.error("Помилка звіту 1:", err);
            setQ1Data([]);
        } finally {
            setQ1Loading(false);
        }
    };

    const fetchQ2 = async () => {
        setQ2Loading(true);
        setQ2Touched(true);
        try {
            const res = await api.get("reports/lapko/customers-bought-all/", {
                params: { category_name: q2Category },
            });
            setQ2Data(res.data);
        } catch (err) {
            console.error("Помилка звіту 2:", err);
            setQ2Data([]);
        } finally {
            setQ2Loading(false);
        }
    };

    return (
        <div className="space-y-8">
            <button
                onClick={() => navigate("/manager/dashboard")}
                className="group flex items-center gap-2 w-fit cursor-pointer"
            >
                <span className="text-gray-500 transition-all group-hover:-translate-x-1 group-hover:text-indigo-600">←</span>
                <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">Назад до панелі звітів</span>
            </button>

            <h2 className="text-2xl font-semibold text-gray-800">Звіти Лапка</h2>

            {/* ===== ЗАПИТ 1: GROUP BY ===== */}
            <section className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-indigo-800 mb-1">
                        Запит 1. Активність постійних клієнтів у категорії
                    </h3>
                    <p className="text-sm text-indigo-700 leading-relaxed">
                        Для кожного клієнта з карткою показати кількість чеків, загальну
                        кількість куплених одиниць та сумарну витрачену суму у заданій
                        категорії за вказаний період.
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Категорія</label>
                        <select
                            value={q1Category}
                            onChange={(e) => setQ1Category(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[42px]"
                        >
                            {categories.map((c) => (
                                <option key={c.category_number} value={c.category_name}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Період з</label>
                        <DatePicker
                            value={q1DateFrom}
                            onChange={setQ1DateFrom}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Період по</label>
                        <DatePicker
                            value={q1DateTo}
                            onChange={setQ1DateTo}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={fetchQ1}
                        disabled={q1Loading || !q1Category}
                        className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-colors shadow-sm disabled:bg-indigo-300 cursor-pointer h-[44px]"
                    >
                        {q1Loading ? "Формування..." : "Сформувати"}
                    </button>
                </div>

                <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Картка</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Прізвище</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ім'я</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Знижка</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Чеків</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Одиниць</th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-indigo-700 uppercase bg-indigo-50/50">Витрачено</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {q1Data.map((r) => (
                                <tr key={r.card_number} className="hover:bg-indigo-50/30">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.card_number}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.cust_surname}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.cust_name}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{r.percent}%</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{r.total_checks}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{r.total_items}</td>
                                    <td className="px-4 py-3 text-sm text-right font-bold text-indigo-700 bg-indigo-50/50">
                                        {Number(r.total_spent).toFixed(2)} ₴
                                    </td>
                                </tr>
                            ))}
                            {q1Data.length === 0 && !q1Loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        {q1Touched ? "Немає даних за вказаними параметрами" : "Оберіть категорію і натисніть \"Сформувати\""}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ===== ЗАПИТ 2: подвійне заперечення ===== */}
            <section className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                    <h3 className="text-lg font-bold text-emerald-800 mb-1">
                        Запит 2. Клієнти, які купили УСІ товари категорії
                    </h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                        Знайти постійних клієнтів (власників карток), що хоча б один раз
                        придбали кожен товар заданої категорії.
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Категорія</label>
                        <select
                            value={q2Category}
                            onChange={(e) => setQ2Category(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-[42px]"
                        >
                            {categories.map((c) => (
                                <option key={c.category_number} value={c.category_name}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchQ2}
                        disabled={q2Loading || !q2Category}
                        className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold transition-colors shadow-sm disabled:bg-emerald-300 cursor-pointer h-[44px]"
                    >
                        {q2Loading ? "Формування..." : "Сформувати"}
                    </button>
                </div>

                <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Картка</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Прізвище</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ім'я</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Телефон</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-emerald-700 uppercase bg-emerald-50/50">Знижка</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {q2Data.map((r) => (
                                <tr key={r.card_number} className="hover:bg-emerald-50/30">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.card_number}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.cust_surname}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{r.cust_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{r.phone_number}</td>
                                    <td className="px-4 py-3 text-sm text-center font-bold text-emerald-700 bg-emerald-50/50">
                                        {r.percent}%
                                    </td>
                                </tr>
                            ))}
                            {q2Data.length === 0 && !q2Loading && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        {q2Touched ? "Немає клієнтів, що придбали усі товари цієї категорії" : "Оберіть категорію і натисніть \"Сформувати\""}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
