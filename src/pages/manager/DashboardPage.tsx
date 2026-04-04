import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../api/api";
import type {StatCard} from "../../types/StatCard.ts";

export default function DashboardPage() {
    const navigate = useNavigate();

    const [stats, setStats] = useState<Record<string, number | null>>({
        employees: null,
        products: null,
        categories: null,
        storeProducts: null,
        customers: null,
        checks: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [empRes, prodRes, catRes, storeRes, custRes, checkRes] = await Promise.all([
                    api.get("/employees/").catch(() => ({data: []})),
                    api.get("/products/").catch(() => ({data: []})),
                    api.get("/categories/").catch(() => ({data: []})),
                    api.get("/store-products/").catch(() => ({data: []})),
                    api.get("/customers/").catch(() => ({data: []})),
                    api.get("/checks/").catch(() => ({data: []}))
                ]);
                setStats({
                    employees: empRes.data.length,
                    products: prodRes.data.length,
                    categories: catRes.data.length,
                    storeProducts: storeRes.data.length,
                    customers: custRes.data.length,
                    checks: checkRes.data.length
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards: StatCard[] = [
        {
            label: "Працівники",
            value: stats.employees,
            icon: "\uD83D\uDC65",
            color: "border-indigo-200",
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-600"
        },
        {
            label: "Товари в каталозі",
            value: stats.products,
            icon: "\uD83D\uDCE6",
            color: "border-emerald-200",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-600"
        },
        {
            label: "Категорії",
            value: stats.categories,
            icon: "\uD83D\uDCC1",
            color: "border-blue-200",
            bgColor: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            label: "Товари в магазині",
            value: stats.storeProducts,
            icon: "\uD83D\uDED2",
            color: "border-amber-200",
            bgColor: "bg-amber-50",
            textColor: "text-amber-600"
        },
        {
            label: "Клієнти",
            value: stats.customers,
            icon: "\uD83D\uDCB3",
            color: "border-purple-200",
            bgColor: "bg-purple-50",
            textColor: "text-purple-600"
        },
        {
            label: "Чеки",
            value: stats.checks,
            icon: "\uD83E\uDDFE",
            color: "border-rose-200",
            bgColor: "bg-rose-50",
            textColor: "text-rose-600"
        }
    ];

    const reportCards = [
        {
            title: "Ієрархія продажів (Безух)",
            description: "Аналіз виручки за категоріями та товарами з ПДВ",
            icon: "📊",
            path: "/manager/reports/sales-analysis",
            color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
        },
        {
            title: "Маркетинговий аналіз (Безух)",
            description: "Пошук категорій зі 100% акційним покриттям",
            icon: "🏷️",
            path: "/manager/reports/promo-categories",
            color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
        },
        {
            title: "Ефективність виробників (Змеул)",
            description: "Топ виробників у категорії",
            icon: "📈",
            path: "/manager/reports/producer-performance",
            color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
        },
        {
            title: "Універсальні категорії (Змеул)",
            description: "Категорії зі 100% покриттям по касирам",
            icon: "🏷️",
            path: "/manager/reports/universal-categories",
            color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-300">

            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Панель звітів</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className={`bg-white rounded-xl shadow-sm border ${card.color} p-6 transition-shadow hover:shadow-md`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${card.bgColor} rounded-lg p-3`}>
                                    <span className="text-2xl">{card.icon}</span>
                                </div>
                            </div>
                            <div>
                                {loading ? (
                                    <div className="h-9 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                                ) : (
                                    <p className={`text-3xl font-bold ${card.textColor}`}>
                                        {card.value !== null ? card.value : "—"}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-2">Детальна аналітика</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reportCards.map((report, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(report.path)}
                            className={`rounded-xl shadow-sm border p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${report.color}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl bg-white p-2 rounded-lg shadow-sm">{report.icon}</span>
                                <h3 className="font-bold text-lg leading-tight">{report.title}</h3>
                            </div>
                            <p className="text-sm opacity-80 font-medium">
                                {report.description}
                            </p>
                            <div className="mt-4 text-sm font-bold flex items-center gap-1">
                                Відкрити звіт <span className="text-lg">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
