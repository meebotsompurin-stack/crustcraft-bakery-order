import React, { useCallback, useEffect, useState } from 'react';
import {
  getOperatorCatalogApi,
  createOperatorCatalogItemApi,
  updateOperatorCatalogItemApi,
  type BakeryItemDto,
} from '../services/api';
import { formatTHB } from '../App';

const CATEGORIES = ['Pastry', 'Bread', 'Sweet Bread', 'Tart'] as const;

interface CatalogFormState {
  name: string;
  category: string;
  priceThb: string;
  stockQuantity: string;
  description: string;
  isAvailable: boolean;
}

const EMPTY_FORM: CatalogFormState = {
  name: '',
  category: 'Pastry',
  priceThb: '',
  stockQuantity: '0',
  description: '',
  isAvailable: true,
};

function sortCatalogItems(items: BakeryItemDto[]): BakeryItemDto[] {
  return [...items].sort((a, b) => {
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });
}

export const OperatorCatalogPage: React.FC = () => {
  const [items, setItems] = useState<BakeryItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOperatorCatalogApi();
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load catalog administration list'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openCreateForm = () => {
    if (isFormOpen && editingItemId === null) {
      setIsFormOpen(false);
      return;
    }
    setEditingItemId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (item: BakeryItemDto) => {
    setEditingItemId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      priceThb: (item.price / 100).toFixed(2),
      stockQuantity: String(item.stockQuantity),
      description: item.description,
      isAvailable: item.isAvailable,
    });
    setFormError(null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItemId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionError(null);
    setActionSuccess(null);

    const trimmedName = form.name.trim();
    const trimmedDesc = form.description.trim();
    const trimmedCategory = form.category.trim();
    const parsedThb = Number(form.priceThb);
    const parsedStock = Number(form.stockQuantity);

    if (!trimmedName) {
      setFormError('Item name is required.');
      return;
    }
    if (!trimmedDesc) {
      setFormError('Description is required.');
      return;
    }
    if (!trimmedCategory) {
      setFormError('Category is required.');
      return;
    }
    if (!Number.isFinite(parsedThb) || parsedThb <= 0) {
      setFormError('Price must be a positive THB amount (e.g., 95.00).');
      return;
    }
    const priceSatang = Math.round(parsedThb * 100);
    if (priceSatang <= 0) {
      setFormError('Price must be greater than ฿0.00.');
      return;
    }
    if (
      form.stockQuantity.trim() === '' ||
      !Number.isFinite(parsedStock) ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      setFormError('Stock quantity must be a whole number (0 or greater).');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingItemId) {
        const res = await updateOperatorCatalogItemApi(editingItemId, {
          name: trimmedName,
          category: trimmedCategory,
          price: priceSatang,
          stockQuantity: parsedStock,
          description: trimmedDesc,
          isAvailable: form.isAvailable,
        });
        setItems((prev) =>
          sortCatalogItems(
            prev.map((it) => (it.id === editingItemId ? res.item : it))
          )
        );
        setActionSuccess(`Updated "${res.item.name}" successfully.`);
      } else {
        const res = await createOperatorCatalogItemApi({
          name: trimmedName,
          category: trimmedCategory,
          price: priceSatang,
          stockQuantity: parsedStock,
          description: trimmedDesc,
          isAvailable: form.isAvailable,
        });
        setItems((prev) => sortCatalogItems([...prev, res.item]));
        setActionSuccess(`Created "${res.item.name}" successfully.`);
      }
      closeForm();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to save bakery item.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRestock = async (item: BakeryItemDto, delta = 10) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setBusyItemId(item.id);
      const nextStock = item.stockQuantity + delta;
      const res = await updateOperatorCatalogItemApi(item.id, {
        stockQuantity: nextStock,
      });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? res.item : it))
      );
      setActionSuccess(
        `Restocked "${res.item.name}" to ${res.item.stockQuantity} units.`
      );
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to restock item.'
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const handleToggleAvailability = async (item: BakeryItemDto) => {
    try {
      setActionError(null);
      setActionSuccess(null);
      setBusyItemId(item.id);
      const res = await updateOperatorCatalogItemApi(item.id, {
        isAvailable: !item.isAvailable,
      });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? res.item : it))
      );
      setActionSuccess(
        res.item.isAvailable
          ? `Restored "${res.item.name}" to active customer catalog.`
          : `Archived "${res.item.name}" (hidden from customer catalog).`
      );
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to update availability.'
      );
    } finally {
      setBusyItemId(null);
    }
  };

  const activeCount = items.filter((i) => i.isAvailable).length;
  const archivedCount = items.length - activeCount;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Catalog Administration
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage bakery items, pricing (THB), batch stock, and menu visibility
            ({activeCount} active, {archivedCount} archived)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadCatalog}
            className="px-3.5 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold"
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold shadow-sm"
          >
            {isFormOpen && editingItemId === null
              ? 'Close Form'
              : '+ Add Bakery Item'}
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {actionSuccess && (
        <div
          role="status"
          className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between"
        >
          <span>{actionSuccess}</span>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-900 text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Create / Edit Form */}
      {isFormOpen && (
        <section className="mb-6 bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900">
              {editingItemId ? 'Edit Bakery Item' : 'Add Bakery Item'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="catalog-name"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Item Name
                </label>
                <input
                  id="catalog-name"
                  type="text"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Cardamom Morning Bun"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="catalog-category"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="catalog-category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="catalog-price"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Price (THB)
                </label>
                <input
                  id="catalog-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.priceThb}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priceThb: e.target.value }))
                  }
                  placeholder="95.00"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="catalog-stock"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Batch Stock Quantity
                </label>
                <input
                  id="catalog-stock"
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={form.stockQuantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      stockQuantity: e.target.value,
                    }))
                  }
                  placeholder="25"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="catalog-description"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="catalog-description"
                rows={3}
                required
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe ingredients, texture, or baking notes..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="catalog-available"
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isAvailable: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-stone-300 text-amber-700 focus:ring-amber-500"
              />
              <label
                htmlFor="catalog-available"
                className="text-sm text-stone-700 font-medium"
              >
                Available in public customer catalog
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-sm font-semibold"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingItemId
                  ? 'Save Changes'
                  : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse flex flex-col gap-3"
            >
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-3 bg-stone-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800"
        >
          <p className="font-semibold">Unable to load catalog items</p>
          <p className="text-xs mt-1 text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadCatalog}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="text-4xl mb-2">🥐</div>
          <h3 className="text-base font-semibold text-stone-800">
            No bakery items in the catalog yet.
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Click &ldquo;Add Bakery Item&rdquo; to create your first product.
          </p>
        </div>
      )}

      {/* Catalog List — Desktop Table */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {items.map((item) => {
                  const isBusy = busyItemId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className={item.isAvailable ? 'bg-white' : 'bg-stone-50/70'}
                    >
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-stone-900 break-words">
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 line-clamp-2 break-words">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-700">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-stone-900">
                        {formatTHB(item.price)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            item.stockQuantity === 0
                              ? 'text-rose-700'
                              : 'text-stone-800'
                          }`}
                        >
                          {item.stockQuantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {item.isAvailable ? 'Active' : 'Archived'}
                          </span>
                          {item.stockQuantity === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleQuickRestock(item, 10)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 text-amber-900 text-xs font-semibold"
                          >
                            +10 Restock
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openEditForm(item)}
                            className="px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-100 disabled:opacity-50 text-stone-700 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                              item.isAvailable
                                ? 'border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                : 'border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.isAvailable ? 'Archive' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Catalog List — Mobile Cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => {
              const isBusy = busyItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border border-stone-200 p-4 shadow-sm ${
                    item.isAvailable ? 'bg-white' : 'bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-stone-900 break-words">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {item.category}
                      </p>
                    </div>
                    <span className="font-bold text-stone-900 whitespace-nowrap">
                      {formatTHB(item.price)}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-2 break-words">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-stone-100">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {item.isAvailable ? 'Active' : 'Archived'}
                      </span>
                      {item.stockQuantity === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Out of Stock
                        </span>
                      )}
                      <span className="text-xs text-stone-600 font-medium">
                        Stock: {item.stockQuantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleQuickRestock(item, 10)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 text-amber-900 text-xs font-semibold"
                    >
                      +10 Restock
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditForm(item)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-100 disabled:opacity-50 text-stone-700 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                        item.isAvailable
                          ? 'border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                          : 'border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.isAvailable ? 'Archive' : 'Restore'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
