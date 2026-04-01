import { useState, useEffect } from "react";
import type {Category} from "../../types/Category.ts";
import type {Product} from "../../types/Product.ts";
import api from "../../api/api";
import * as XLSX from "xlsx";

export default function ManagerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsProduct, setStatsProduct] = useState<Product | null>(null);
  const [totalSold, setTotalSold] = useState<number | null>(null);
  const [statsDateFrom, setStatsDateFrom] = useState("");
  const [statsDateTo, setStatsDateTo] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);

  const [formData, setFormData] = useState({
    category_number: "",
    product_name: "",
    producer: "",
    characteristics: ""
  });
  const [error, setError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/categories/"),
        api.get("/products/", { params: { product_name: searchName, category_name: searchCategory } })
      ]);
      setCategories(catRes.data);
      const sorted = prodRes.data.sort((a: Product, b: Product) => a.product_name.localeCompare(b.product_name));
      setProducts(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchName, searchCategory]);

  const fetchProductStats = async () => {
    if (!statsProduct) return;
    setStatsLoading(true);
    try {
      const params: any = {};
      if (statsDateFrom) params.date_from = statsDateFrom;
      if (statsDateTo) params.date_to = statsDateTo;

      const res = await api.get(`/products/${statsProduct.id_product}/stats/`, {params});
      setTotalSold(res.data.total_sold);
    } catch (err) {
      console.error("Помилка отримання статистики:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOpenStats = (product: Product) => {
    setStatsProduct(product);
    setTotalSold(null);
    setStatsDateFrom("");
    setStatsDateTo("");
    setIsStatsModalOpen(true);
  };

  const handleOpenModal = (product?: Product) => {
    setError("");
    if (product) {
      setCurrentProduct(product);
      setFormData({
        category_number: String(product.category_number),
        product_name: product.product_name,
        producer: product.producer,
        characteristics: product.characteristics
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        category_number: categories.length > 0 ? String(categories[0].category_number) : "",
        product_name: "",
        producer: "",
        characteristics: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.product_name || !formData.category_number || !formData.producer || !formData.characteristics) {
      setError("Усі поля є обов'язковими");
      return;
    }
    try {
      if (currentProduct) {
        await api.put(`/products/${currentProduct.id_product}/`, {
          ...formData,
          category_number: Number(formData.category_number)
        });
      } else {
        await api.post("/products/", {
          ...formData,
          category_number: Number(formData.category_number)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: any } };
      const data = axiosErr.response?.data;
      if (data?.error) {
        setError(data.error);
      } else if (data && typeof data === 'object') {
        const errorMessages = Object.values(data).flat().join(" | ");
        setError(errorMessages || "Помилка при збереженні");
      } else {
        setError("Помилка при збереженні");
      }
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteError("");
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await api.delete(`/products/${deleteConfirmId}/`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosErr.response?.data?.error || "Помилка при видаленні");
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Назва", "Категорія", "Виробник", "Характеристики"];
    const rows = products.map(p => {
      const cat = categories.find(c => c.category_number === p.category_number);
      return [
        p.id_product,
        `"${p.product_name.replace(/"/g, '""')}"`,
        `"${(cat?.category_name || "Невідомо").replace(/"/g, '""')}"`,
        `"${p.producer.replace(/"/g, '""')}"`,
        `"${p.characteristics.replace(/"/g, '""')}"`
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(products.map(p => {
      const cat = categories.find(c => c.category_number === p.category_number);
      return {
        "ID": p.id_product,
        "Назва": p.product_name,
        "Категорія": cat?.category_name || "Невідомо",
        "Виробник": p.producer,
        "Характеристики": p.characteristics
      };
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Товари");
    XLSX.writeFile(wb, "products.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Товари в каталозі</h2>
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
            <button
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              + Додати товар
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
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

      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table id="products-table" className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Назва</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Категорія</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Виробник</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((p) => {
              const cat = categories.find(c => c.category_number === p.category_number);
              return (
                <tr key={p.id_product} className="hover:bg-indigo-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.id_product}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{p.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cat?.category_name || "Невідомо"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.producer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleOpenStats(p)}
                        className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
                    >
                      Статистика
                    </button>
                    <button onClick={() => handleOpenModal(p)}
                            className="text-indigo-600 hover:text-indigo-900 cursor-pointer">Редагувати
                    </button>
                    <button onClick={() => handleDeleteClick(p.id_product)}
                            className="text-red-500 hover:text-red-700 cursor-pointer">Видалити
                    </button>
                  </td>
                </tr>
              )
            })}
            {products.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Не знайдено товарів</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Завантаження...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentProduct ? "Редагувати товар" : "Новий товар"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Назва товару</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть назву"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категорія</label>
                <select
                  value={formData.category_number}
                  onChange={(e) => setFormData({...formData, category_number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-shadow"
                >
                  <option value="" disabled>Оберіть категорію</option>
                  {categories.map(c => (
                     <option key={c.category_number} value={c.category_number}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Виробник</label>
                <input
                  type="text"
                  value={formData.producer}
                  onChange={(e) => setFormData({...formData, producer: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Назва виробника"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Характеристики</label>
                <textarea
                  value={formData.characteristics}
                  onChange={(e) => setFormData({...formData, characteristics: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  rows={3}
                  placeholder="Об'єм, вага, склад тощо"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm cursor-pointer"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модалка для підтвердження видалення / помилок */}
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
                  <p className="text-gray-600 mb-6">Ви дійсно хочете видалити цей товар? Усі незбережені дані будуть втрачені.</p>
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

      {isStatsModalOpen && statsProduct && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
              <h3 className="text-xl font-bold mb-2 text-gray-800">Статистика продажів</h3>
              <p className="text-sm text-gray-500 mb-6">{statsProduct.product_name} ({statsProduct.producer})</p>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1 ml-1">Дата з</label>
                    <input
                        type="date"
                        value={statsDateFrom}
                        onChange={e => setStatsDateFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1 ml-1">Дата по</label>
                    <input
                        type="date"
                        value={statsDateTo}
                        onChange={e => setStatsDateTo(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                    onClick={fetchProductStats}
                    disabled={statsLoading}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:bg-emerald-300"
                >
                  {statsLoading ? "Рахуємо..." : "Визначити кількість"}
                </button>
              </div>

              {totalSold !== null && (
                  <div
                      className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
                    <span
                        className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Продано одиниць</span>
                    <div className="text-5xl font-black text-emerald-800 mt-1">
                      {totalSold}
                    </div>
                    <p className="text-[10px] text-emerald-400 mt-2 uppercase">за вказаний період</p>
                  </div>
              )}

              <div className="mt-8">
                <button
                    onClick={() => setIsStatsModalOpen(false)}
                    className="w-full px-5 py-2 text-gray-500 font-medium hover:text-gray-800 transition-colors"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
