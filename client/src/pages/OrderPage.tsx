import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCatalogItemsApi,
  createCustomerOrderApi,
  type BakeryItemDto,
} from '../services/api';
import { BakeryItemCard } from '../components/BakeryItemCard';
import { OrderSummary } from '../components/OrderSummary';

export const OrderPage: React.FC = () => {
  const [items, setItems] = useState<BakeryItemDto[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pickupNote, setPickupNote] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectId = searchParams.get('itemId');

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setIsLoading(true);
        const data = await getCatalogItemsApi();
        if (isMounted) {
          const fetchedItems = data.items || [];
          setItems(fetchedItems);

          // Preselect item if specified in search query and in stock
          if (preselectId) {
            const match = fetchedItems.find(
              (i) => i.id === preselectId && i.stockQuantity > 0
            );
            if (match) {
              setQuantities({ [match.id]: 1 });
            }
          }
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
  }, [preselectId]);

  const handleQuantityChange = (itemId: string, newQty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [itemId]: newQty,
    }));
  };

  const selectedLines = items
    .filter((item) => (quantities[item.id] || 0) > 0)
    .map((item) => ({
      item,
      quantity: quantities[item.id] || 0,
    }));

  const handleOrderSubmit = async () => {
    if (selectedLines.length === 0) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        items: selectedLines.map(({ item, quantity }) => ({
          bakeryItemId: item.id,
          quantity,
        })),
        pickupNote: pickupNote.trim() || undefined,
      };

      const result = await createCustomerOrderApi(payload);
      navigate(`/orders/${result.order.id}`, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Order submission failed'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 tracking-tight">
          Create New Pre-Order
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Select your desired bakery items, adjust quantities, and specify any
          pickup notes for the morning batch.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mb-3" />
          <p className="text-sm font-medium">Loading items for order...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items Selection Grid (2 columns on large screen) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-stone-800">
              Select Batch Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <BakeryItemCard
                  key={item.id}
                  item={item}
                  selectedQuantity={quantities[item.id] || 0}
                  onQuantityChange={(q) => handleQuantityChange(item.id, q)}
                />
              ))}
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <OrderSummary
              selectedLines={selectedLines}
              pickupNote={pickupNote}
              onPickupNoteChange={setPickupNote}
              onSubmit={handleOrderSubmit}
              isSubmitting={isSubmitting}
              errorMessage={errorMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};
