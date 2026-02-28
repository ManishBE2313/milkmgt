'use client';

import { useState } from 'react';
import { MonthlySummary as MonthlySummaryType } from '@/types';
import { summaryApi } from '@/lib/api';
import { useStore } from '@/store/useStore';

interface MonthlySummaryProps {
  summary: MonthlySummaryType | null;
  loading: boolean;
  onRateUpdated?: () => Promise<void> | void;
}

export default function MonthlySummary({ summary, loading, onRateUpdated }: MonthlySummaryProps) {
  const user = useStore((state) => state.user);
  const currentMonth = useStore((state) => state.currentMonth);

  const [showRateModal, setShowRateModal] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateRate = async () => {
    if (!user || !newRate || parseFloat(newRate) <= 0) {
      setError('Please enter a valid rate');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await summaryApi.updateMonthlyRate(currentMonth, parseFloat(newRate));
      setShowRateModal(false);
      setNewRate('');
      if (onRateUpdated) {
        await onRateUpdated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update rate');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300/70 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-300/70 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      label: 'Total Litres',
      value: summary.total_litres.toFixed(1),
      unit: 'L',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Delivered Days',
      value: summary.total_delivered_days.toString(),
      unit: 'days',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Absent Days',
      value: summary.total_absent_days.toString(),
      unit: 'days',
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Total Bill',
      value: summary.total_bill.toFixed(2),
      unit: 'INR',
      color: 'text-indigo-600 dark:text-indigo-400',
      isPrice: true,
    },
  ];

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Summary</h3>
          <button
            onClick={() => setShowRateModal(true)}
            className="btn-secondary btn-sm"
            title="Update monthly rate"
          >
            Update Rate
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 bg-white/35 dark:bg-white/5 border border-white/35"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.isPrice ? `Rs ${stat.value}` : `${stat.value} ${stat.unit}`}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Rate per Litre</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {summary.average_rate > 0 ? `Rs ${summary.average_rate.toFixed(2)}` : 'Not set'}
              </span>
            </div>
            {summary.total_litres > 0 && summary.average_rate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cost per Day</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Rs{' '}
                  {summary.total_delivered_days > 0
                    ? (summary.total_bill / summary.total_delivered_days).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setShowRateModal(false)}
            ></div>

            <div className="inline-block align-bottom card text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="px-1 pt-1 pb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Update Monthly Rate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Apply a uniform rate for deliveries in {currentMonth}.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">New Rate per Litre (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="input"
                    placeholder="e.g., 55.00"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl bg-red-100/70 dark:bg-red-900/60 text-red-700 dark:text-red-200 px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-900/30 p-3 mb-4">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Tip: Set delivery-level custom rates when a specific day differs from the monthly default.
                  </p>
                </div>
              </div>

              <div className="px-1 pb-1 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRateModal(false);
                    setNewRate('');
                    setError('');
                  }}
                  className="btn-secondary"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRate}
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Rate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
