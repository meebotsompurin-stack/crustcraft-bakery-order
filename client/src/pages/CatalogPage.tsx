import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCatalogItemsApi, type BakeryItemDto } from '../services/api';
import { BakeryItemCard } from '../components/BakeryItemCard';

export const CatalogPage: React.FC = () => {
  const [items, setItems] = useState<BakeryItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await getCatalogItemsApi();
        if (isMounted) {
          setItems(data.items || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Failed to load catalog items'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['ALL', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems =
    selectedCategory === 'ALL'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block mb-2">
            Freshly Baked Batches
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Artisan Bakery Catalog
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            Browse our hand-crafted sourdough loaves, French pastries, and seasonal
            specialties. Pre-order online for guaranteed morning counter pickup.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/orders/new')}
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          Create Pre-Order &rarr;
        </button>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* State Renderings */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading freshly baked menu...</p>
        </div>
      ) : errorMessage ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center">
          <p className="text-sm font-semibold">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <p className="text-base font-semibold text-stone-800">
            No bakery items available
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Our bakers are currently preparing new batches. Please check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <BakeryItemCard
              key={item.id}
              item={item}
              onSelect={() => navigate(`/orders/new?itemId=${item.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
