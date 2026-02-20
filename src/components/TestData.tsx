import { useState, useEffect, useCallback } from 'react';
import api from "../api/test-data-api.ts";
import type {TestType} from "../types/DataTestType.ts";
import * as React from "react";

const TestData = () => {
    const [items, setItems] = useState<TestType[]>([]);
    const [fullName, setFullName] = useState('');

    const fetchItems = useCallback(async () => {
        try {
            const response = await api.get('test-data/');
            setItems(response.data);
        } catch (error) {
            console.error("Помилка при завантаженні:", error);
        }
    }, []);

    useEffect(() => {
       const loadData = async () => {
            await fetchItems();
        };

        loadData();
    }, [fetchItems]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('test-data/', { full_name: fullName });
            setFullName('');
            await fetchItems();
        } catch {
            alert("Помилка при створенні!");
        }
    };

    return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">🛒 ZLAGODA</h1>
          <p className="text-gray-500 mt-2">Тестова панель керування базою даних</p>
        </div>

        {/* Форма додавання */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Введіть повне ім'я..."
            required
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm"
          >
            Додати
          </button>
        </form>

        {/* Список даних */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Список записів:</h2>
          {items.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {items.map((item: TestType) => (
                <li key={item.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded-md transition-colors">
                  <span className="text-gray-600 font-mono text-sm">#{item.id}</span>
                  <span className="text-gray-800 font-medium">{item.full_name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400 py-4 italic">База поки що порожня...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestData;