import { useState, useEffect } from "react";
import api from "../../api/api";

interface StatCard {
  label: string;
  value: number | null;
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export default function DashboardPage() {
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
          api.get("/employees/").catch(() => ({ data: [] })),
          api.get("/products/").catch(() => ({ data: [] })),
          api.get("/categories/").catch(() => ({ data: [] })),
          api.get("/store-products/").catch(() => ({ data: [] })),
          api.get("/customers/").catch(() => ({ data: [] })),
          api.get("/checks/").catch(() => ({ data: [] }))
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Панель звітів</h2>

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
    </div>
  );
}
