import { useState, useEffect } from "react";
import api from "../../api/api";
import * as XLSX from "xlsx";

interface StoreProduct {
  UPC: string;
  UPC_prom: string | null;
  id_product: number;
  selling_price: number;
  products_number: number;
  promotional_product: boolean;
  product_name?: string;
}

interface Product {
  id_product: number;
  product_name: string;
}

export default function StorePage() {
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [orderByQuantity, setOrderByQuantity] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<StoreProduct | null>(null);

  const [formData, setFormData] = useState({
    UPC: "",
    id_product: "",
    selling_price: "",
    products_number: "",
    promotional_product: false,
    UPC_prom: ""
  });
  const [error, setError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchName) params.product_name = searchName;
      if (orderByQuantity) params.order_by_products_number = true;

      const [prodRes, storeRes] = await Promise.all([
        api.get("/products/"),
        api.get("/store-products/", { params })
      ]);
      setProducts(prodRes.data);
      setStoreProducts(storeRes.data);
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
  }, [searchName, orderByQuantity]);

  const handleOpenModal = (item?: StoreProduct) => {
    setError("");
    if (item) {
      setCurrentItem(item);
      setFormData({
        UPC: item.UPC,
        id_product: String(item.id_product),
        selling_price: String(item.selling_price),
        products_number: String(item.products_number),
        promotional_product: item.promotional_product,
        UPC_prom: item.UPC_prom || ""
      });
    } else {
      setCurrentItem(null);
      setFormData({
        UPC: "",
        id_product: products.length > 0 ? String(products[0].id_product) : "",
        selling_price: "",
        products_number: "",
        promotional_product: false,
        UPC_prom: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.UPC || !formData.id_product || !formData.selling_price || !formData.products_number) {
      setError("Усі обов'язкові поля мають бути заповнені");
      return;
    }
    try {
      const payload = {
        UPC: formData.UPC,
        id_product: Number(formData.id_product),
        selling_price: Number(formData.selling_price),
        products_number: Number(formData.products_number),
        promotional_product: formData.promotional_product,
        UPC_prom: formData.UPC_prom || null
      };
      if (currentItem) {
        await api.put(`/store-products/${currentItem.UPC}/`, payload);
      } else {
        await api.post("/store-products/", payload);
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

  const handleDeleteClick = (upc: string) => {
    setDeleteError("");
    setDeleteConfirmId(upc);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await api.delete(`/store-products/${deleteConfirmId}/`);
      setDeleteConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(axiosErr.response?.data?.error || "Помилка при видаленні");
    }
  };

  const getProductName = (id: number) => {
    const prod = products.find(p => p.id_product === id);
    return prod?.product_name || "Невідомо";
  };

  const exportCSV = () => {
    const headers = ["UPC", "Товар", "Ціна", "Кількість", "Акційний", "Акційний UPC"];
    const rows = storeProducts.map(sp => [
      `"${sp.UPC}"`,
      `"${(sp.product_name || getProductName(sp.id_product)).replace(/"/g, '""')}"`,
      sp.selling_price,
      sp.products_number,
      sp.promotional_product ? "Так" : "Ні",
      sp.UPC_prom || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "store-products.csv";
    link.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(storeProducts.map(sp => ({
      "UPC": sp.UPC,
      "Товар": sp.product_name || getProductName(sp.id_product),
      "Ціна": sp.selling_price,
      "Кількість": sp.products_number,
      "Акційний": sp.promotional_product ? "Так" : "Ні",
      "Акційний UPC": sp.UPC_prom || ""
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Товари в магазині");
    XLSX.writeFile(wb, "store-products.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Товари в магазині</h2>
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
            placeholder="Пошук за назвою товару..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">UPC</th>
              <th
                  onClick={() => setOrderByQuantity(false)}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                  Товар {orderByQuantity ? "↕" : "▼"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ціна</th>
              <th
                  onClick={() => setOrderByQuantity(true)}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                  Кількість {orderByQuantity ? "▼" : "↕"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Акційний</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Акційний UPC</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Дії</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {storeProducts.map((sp) => (
              <tr key={sp.UPC} className="hover:bg-indigo-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{sp.UPC}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sp.product_name || getProductName(sp.id_product)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{Number(sp.selling_price).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sp.products_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {sp.promotional_product ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Так</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Ні</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sp.UPC_prom || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right space-x-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(sp)} className="text-indigo-600 hover:text-indigo-900 cursor-pointer">Редагувати</button>
                  <button onClick={() => handleDeleteClick(sp.UPC)} className="text-red-500 hover:text-red-700 cursor-pointer">Видалити</button>
                </td>
              </tr>
            ))}
            {storeProducts.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Не знайдено товарів</td>
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

      {/* Add/Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">{currentItem ? "Редагувати товар" : "Новий товар в магазині"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPC</label>
                <input
                  type="text"
                  value={formData.UPC}
                  onChange={(e) => setFormData({...formData, UPC: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="Введіть UPC"
                  disabled={!!currentItem}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Товар</label>
                <select
                  value={formData.id_product}
                  onChange={(e) => setFormData({...formData, id_product: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-shadow"
                >
                  <option value="" disabled>Оберіть товар</option>
                  {products.map(p => (
                    <option key={p.id_product} value={p.id_product}>{p.product_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ціна продажу</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кількість</label>
                <input
                  type="number"
                  value={formData.products_number}
                  onChange={(e) => setFormData({...formData, products_number: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="promotional"
                  checked={formData.promotional_product}
                  onChange={(e) => setFormData({...formData, promotional_product: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="promotional" className="text-sm font-medium text-gray-700 cursor-pointer">Акційний товар</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Акційний UPC (необов'язково)</label>
                <select
                  value={formData.UPC_prom}
                  onChange={(e) => setFormData({...formData, UPC_prom: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-shadow"
                >
                  <option value="">Немає</option>
                  {storeProducts.filter(sp => sp.UPC !== formData.UPC).map(sp => (
                    <option key={sp.UPC} value={sp.UPC}>{sp.UPC} — {sp.product_name || getProductName(sp.id_product)}</option>
                  ))}
                </select>
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
                  <p className="text-gray-600 mb-6">Ви дійсно хочете видалити цей товар з магазину? Усі незбережені дані будуть втрачені.</p>
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
