import { useState, useEffect, useCallback } from "react";
import api from "../../api/api";
import type {Product} from "../../types/Product.ts";
import type {Category} from "../../types/Category.ts";

export default function CashierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchName) params.product_name = searchName;
      if (searchCategory) params.category_name = searchCategory;

      const [catRes, prodRes] = await Promise.all([
        api.get("/categories/"),
        api.get("/products/", {params})
      ]);

      setCategories(catRes.data);
      const sorted = prodRes.data.sort((a: Product, b: Product) =>
          a.product_name.localeCompare(b.product_name)
      );
      setProducts(sorted);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchName, searchCategory]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Довідник товарів</h2>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Пошук за назвою..." 
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          <select 
            value={searchCategory}
            onChange={e => setSearchCategory(e.target.value)}
            className="flex-1 sm:max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">Усі категорії</option>
            {categories.map(c => (
              <option key={c.category_number} value={c.category_name}>{c.category_name}</option>
            ))}
          </select>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Назва</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Категорія</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Виробник</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Характеристики</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.map((p) => {
              const cat = categories.find(c => c.category_number === p.category_number);
              return (
                <tr key={p.id_product} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{p.id_product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{p.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {cat?.category_name || "Невідомо"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.producer}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={p.characteristics}>
                        {p.characteristics || "—"}
                    </div>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                    На жаль, товарів за вашим запитом не знайдено
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-indigo-500 font-medium">
                    <span className="animate-pulse">Завантаження...</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
