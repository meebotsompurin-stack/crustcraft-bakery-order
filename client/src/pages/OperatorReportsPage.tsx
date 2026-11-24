import React, { useCallback, useEffect, useState } from 'react';
import {
  getOperatorSalesSummaryApi,
  type OrderStatus,
  type SalesSummaryDto,
} from '../services/api';
import { formatTHB } from '../App';

const ORDER_STATUS_META: Array<{
  key: OrderStatus;
  label: string;
  badgeClass: string;
}> = [
  {
    key: 'PENDING',
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  {
    key: 'ACCEPTED',
    label: 'Accepted',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300',
  },
  {
    key: 'BAKING',
    label: 'Baking',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300',
  },
  {
    key: 'READY_FOR_PICKUP',
    label: 'Ready for Pickup',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-300',
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  },
  {
    key: 'CANCELLED',
    label: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300',
  },
];

export const OperatorReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<SalesSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [fromInput, setFromInput] = useState<string>('');
  const [toInput, setToInput] = useState<string>('');
  const [appliedFrom, setAppliedFrom] = useState<string>('');
  const [appliedTo, setAppliedTo] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadSummary = useCallback(async (from?: string, to?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getOperatorSalesSummaryApi({
        from: from || undefined,
        to: to || undefined,
      });
      setSummary(data.summary);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load sales summary report'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(appliedFrom, appliedTo);
  }, [loadSummary, appliedFrom, appliedTo]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromInput && toInput && fromInput > toInput) {
      setValidationError(
        'Invalid date range: "From" date must not be after "To" date.'
      );
      return;
    }
    setValidationError(null);
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
  };

  const handleResetFilter = () => {
    setValidationError(null);
    setFromInput('');
    setToInput('');
    setAppliedFrom('');
    setAppliedTo('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Sales &amp; Order Summary Reports
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Monitor completed bakery revenue, fulfillment status distribution,
            and top-selling items.
          </p>
        </div>
        {summary?.dateRange &&
          (summary.dateRange.from || summary.dateRange.to) && (
            <span className="inline-flex items-center self-start sm:self-auto px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
              Range: {summary.dateRange.from ?? 'Start'} to{' '}
              {summary.dateRange.to ?? 'Present'}
            </span>
          )}
      </div>

      {/* Date Range Filter Bar */}
      <section
        aria-label="Date Range Filter"
        className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm"
      >
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-col md:flex-row md:items-end gap-4"
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor="report-date-from"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1"
            >
              From
            </label>
            <input
              id="report-date-from"
              data-testid="reports-filter-from"
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label
              htmlFor="report-date-to"
              className="block text-xs font-semibold text-stone-700 uppercase tracking-wide mb-1"
            >
              To
            </label>
            <input
              id="report-date-to"
              data-testid="reports-filter-to"
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              data-testid="reports-filter-apply"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              data-testid="reports-filter-reset"
              onClick={handleResetFilter}
              className="px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 text-sm font-semibold transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        {validationError && (
          <div
            role="alert"
            data-testid="reports-validation-error"
            className="mt-3 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-800"
          >
            {validationError}
          </div>
        )}
      </section>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          data-testid="reports-error-banner"
          className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <p className="text-sm text-rose-800 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => loadSummary(appliedFrom, appliedTo)}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Placeholder */}
      {isLoading ? (
        <div
          data-testid="reports-loading"
          className="space-y-4 animate-pulse"
          aria-busy="true"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-stone-200 border border-stone-200"
              />
            ))}
          </div>
          <div className="h-36 rounded-xl bg-stone-200 border border-stone-200" />
          <div className="h-48 rounded-xl bg-stone-200 border border-stone-200" />
        </div>
      ) : summary ? (
        <>
          {/* KPI Summary Cards (3-column Desktop, 1-column Mobile) */}
          <section
            aria-label="Key Performance Indicators"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div
              data-testid="reports-kpi-revenue"
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Completed Revenue
              </p>
              <p className="mt-2 text-3xl font-bold text-amber-800 break-words">
                {formatTHB(summary.totalRevenueSatang)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                From completed orders only
              </p>
            </div>

            <div
              data-testid="reports-kpi-completed"
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Completed Orders
              </p>
              <p className="mt-2 text-3xl font-bold text-stone-900">
                {summary.completedOrderCount}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Out of {summary.totalOrderCount} total orders
              </p>
            </div>

            <div
              data-testid="reports-kpi-paid"
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Paid Orders
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {summary.paymentBreakdown.PAID}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {summary.paymentBreakdown.UNPAID} unpaid &middot;{' '}
                {summary.paymentBreakdown.FAILED} failed
              </p>
            </div>
          </section>

          {/* Order Status Breakdown Panel */}
          <section
            aria-label="Order Status Breakdown"
            data-testid="reports-status-breakdown"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Order Status Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ORDER_STATUS_META.map(({ key, label, badgeClass }) => (
                <div
                  key={key}
                  data-testid={`reports-status-${key}`}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-3 flex flex-col items-start justify-between gap-2"
                >
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                  >
                    {label}
                  </span>
                  <span className="text-2xl font-bold text-stone-900">
                    {summary.ordersByStatus[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Top-Selling Items Table / Cards */}
          <section
            aria-label="Top-Selling Bakery Items"
            data-testid="reports-top-items"
            className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              Top-Selling Items
            </h2>

            {summary.topSellingItems.length === 0 ? (
              <div
                data-testid="reports-empty-state"
                className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-sm text-stone-600"
              >
                No completed sales found for the selected period
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        <th className="py-2.5 pr-4">Rank</th>
                        <th className="py-2.5 pr-4">Item Name</th>
                        <th className="py-2.5 pr-4">Category</th>
                        <th className="py-2.5 pr-4 text-right">Units Sold</th>
                        <th className="py-2.5 text-right">Revenue (THB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {summary.topSellingItems.map((item, index) => (
                        <tr key={item.bakeryItemId} className="hover:bg-stone-50">
                          <td className="py-3 pr-4 font-semibold text-amber-800">
                            #{index + 1}
                          </td>
                          <td className="py-3 pr-4 font-medium text-stone-900">
                            {item.name}
                          </td>
                          <td className="py-3 pr-4 text-stone-600">
                            {item.category}
                          </td>
                          <td className="py-3 pr-4 text-right font-semibold text-stone-900">
                            {item.quantitySold}
                          </td>
                          <td className="py-3 text-right font-semibold text-emerald-700">
                            {formatTHB(item.revenueSatang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List (zero horizontal overflow at 375px) */}
                <div className="md:hidden space-y-3">
                  {summary.topSellingItems.map((item, index) => (
                    <div
                      key={item.bakeryItemId}
                      className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-amber-800 mr-1.5">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-stone-900 text-sm break-words">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-stone-600 pt-1 border-t border-stone-200">
                        <span>
                          Units Sold:{' '}
                          <strong className="text-stone-900">
                            {item.quantitySold}
                          </strong>
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {formatTHB(item.revenueSatang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};
