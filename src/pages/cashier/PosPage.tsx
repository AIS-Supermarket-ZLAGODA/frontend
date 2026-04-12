import { useState, useEffect } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContextLogic";
import type {SmallCustomerCard} from "../../types/CustomerCard.ts";
import type {PosCartItem} from "../../types/StatCard.ts";
import type {StoreProduct} from "../../types/StoreProduct.ts";

export default function PosPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState("");

  const [cart, setCart] = useState<PosCartItem[]>([]);

  const [customers, setCustomers] = useState<SmallCustomerCard[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<SmallCustomerCard | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/store-products/");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (customerSearch.trim()) {
        try {
          const res = await api.get("/customers/", { params: { surname: customerSearch } });
          setCustomers(res.data);
          setShowCustomerDropdown(true);
        } catch (err) {
          console.error(err);
        }
      } else {
        setCustomers([]);
        setShowCustomerDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch]);

  const filteredProducts = products
    .filter((p) => p.products_number > 0)
    .filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      return name.includes(searchName.toLowerCase());
    })
    .sort((a, b) => (a.product_name || "").localeCompare(b.product_name || ""));

  const addToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.upc === product.upc);
      if (existing) {
        if (existing.quantity >= existing.max_quantity) return prev;
        return prev.map((item) =>
          item.upc === product.upc ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          upc: product.upc,
          product_name: product.product_name || product.upc,
          selling_price: Number(product.selling_price),
          quantity: 1,
          max_quantity: product.products_number,
        },
      ];
    });
  };

  const updateCartQuantity = (upc: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.upc !== upc) return item;
        const newQty = Math.max(1, Math.min(qty, item.max_quantity));
        return { ...item, quantity: newQty };
      })
    );
  };

  const removeFromCart = (upc: string) => {
    setCart((prev) => prev.filter((item) => item.upc !== upc));
  };

  const selectCustomer = (customer: SmallCustomerCard) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.cust_surname} ${customer.cust_name}`);
    setShowCustomerDropdown(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomers([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const discount = selectedCustomer ? subtotal * (selectedCustomer.percent / 100) : 0;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * 0.2;
  const total = afterDiscount;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage("Кошик порожній");
      return;
    }
    setCheckoutLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const body = {
        id_employee: user?.id_employee,
        card_number: selectedCustomer?.card_number || null,
        items: cart.map((item) => ({
          upc: item.upc,
          product_number: item.quantity,
        })),
      };
      const res = await api.post("/checks/", body);
      const checkNumber = res.data?.check_number || res.data?.id || "OK";
      setSuccessMessage(`Чек #${checkNumber} успішно створено!`);
      setCart([]);
      clearCustomer();
      fetchProducts();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      const data = axiosErr.response?.data;

      if (data && typeof data === "object") {
        if (typeof data.error === "string") {
          setErrorMessage(data.error);
        } else {
          const errorMessages = Object.values(data)
              .flat()
              .join(" | ");
          setErrorMessage(errorMessages || "Помилка при збереженні");
        }
      } else {
        setErrorMessage("Помилка при збереженні");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">Каса</h2>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg font-medium">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL - Product Search */}
        <div className="flex-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <input
              type="text"
              placeholder="Пошук товару за назвою..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-x-auto" style={{ maxHeight: "65vh", overflowY: "auto" }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Назва</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">upc</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ціна</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Залишок</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((c) => c.upc === p.upc);
                  return (
                    <tr key={p.upc} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {p.product_name || "—"}
                        {p.promotional_product && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">Акція</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{p.upc}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-right font-medium">{Number(p.selling_price).toFixed(2)} грн</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{p.products_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => addToCart(p)}
                          disabled={inCart ? inCart.quantity >= inCart.max_quantity : false}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          {inCart ? `+ (${inCart.quantity})` : "+"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      Товарів не знайдено
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-emerald-500 font-medium">
                      <span className="animate-pulse">Завантаження...</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL - Cart */}
        <div className="w-full lg:w-96 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Кошик{" "}
              <span className="text-sm font-normal text-gray-500">
                ({cart.reduce((s, i) => s + i.quantity, 0)} шт.)
              </span>
            </h3>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">Кошик порожній</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.upc} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{item.selling_price.toFixed(2)} грн/шт</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQuantity(item.upc, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.upc, parseInt(e.target.value) || 1)}
                        className="w-12 text-center text-sm border border-gray-200 rounded py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => updateCartQuantity(item.upc, item.quantity + 1)}
                        disabled={item.quantity >= item.max_quantity}
                        className="w-7 h-7 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 w-20 text-right">
                      {(item.selling_price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.upc)}
                      className="text-red-400 hover:text-red-600 text-lg font-bold transition-colors cursor-pointer ml-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Картка клієнта (необов'язково)</h4>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedCustomer.cust_surname} {selectedCustomer.cust_name}
                  </p>
                  <p className="text-xs text-gray-500">Картка: {selectedCustomer.card_number}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Знижка {selectedCustomer.percent}%
                  </span>
                </div>
                <button
                  onClick={clearCustomer}
                  className="text-gray-400 hover:text-red-500 text-lg font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Пошук за прізвищем..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onFocus={() => customers.length > 0 && setShowCustomerDropdown(true)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-colors"
                />
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {customers.map((c) => (
                      <button
                        key={c.card_number}
                        onClick={() => selectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm transition-colors cursor-pointer"
                      >
                        <span className="font-medium">{c.cust_surname} {c.cust_name}</span>
                        <span className="text-gray-400 ml-2">({c.percent}%)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Сума</span>
              <span>{subtotal.toFixed(2)} грн</span>
            </div>
            {selectedCustomer && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Знижка ({selectedCustomer.percent}%)</span>
                <span>-{discount.toFixed(2)} грн</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>ПДВ (20%)</span>
              <span>{vat.toFixed(2)} грн</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold text-gray-900">
              <span>До сплати</span>
              <span>{total.toFixed(2)} грн</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold text-lg transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {checkoutLoading ? "Обробка..." : "Створити чек"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
