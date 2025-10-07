'use client';

import { useState } from 'react';
import { MonthlySummary as MonthlySummaryType } from '@/types';
import { summaryApi } from '@/lib/api';
import { useStore } from '@/store/useStore';

interface MonthlySummaryProps {
  summary: MonthlySummaryType | null;
  loading: boolean;
}

export default function MonthlySummary({ summary, loading }: MonthlySummaryProps) {
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
      await summaryApi.updateMonthlyRate(user.username, currentMonth, parseFloat(newRate));
      setShowRateModal(false);
      setNewRate('');
      // Trigger parent refresh
      window.location.reload();
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
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const stats = [
    {
      label: 'Total Litres',
      value: summary.total_litres.toFixed(1),
      unit: 'L',
      icon: '🥛',
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Delivered Days',
      value: summary.total_delivered_days.toString(),
      unit: 'days',
      icon: '✅',
      color: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Absent Days',
      value: summary.total_absent_days.toString(),
      unit: 'days',
      icon: '❌',
      color: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Total Bill',
      value: summary.total_bill.toFixed(2),
      unit: '₹',
      icon: '💰',
      color: 'text-yellow-600 dark:text-yellow-400',
      isPrice: true,
    },
  ];

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Monthly Summary</h3>
          <button
            onClick={() => setShowRateModal(true)}
            className="btn-secondary btn-sm"
            title="Update monthly rate"
          >
            💵 Update Rate
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.isPrice && stat.unit}
                  {stat.value}
                  {!stat.isPrice && (
                    <span className="text-sm font-normal ml-1">{stat.unit}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Rate Information */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Average Rate per Litre
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {summary.average_rate > 0 ? `₹${summary.average_rate.toFixed(2)}` : 'Not set'}
              </span>
            </div>
            {summary.total_litres > 0 && summary.average_rate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Cost per Day
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ₹
                  {summary.total_delivered_days > 0
                    ? (summary.total_bill / summary.total_delivered_days).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Update Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => setShowRateModal(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  💵 Update Monthly Rate
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  This will update the rate for all deliveries in {currentMonth} that don't have a specific rate set.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    New Rate per Litre (₹)
                  </label>
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
                  <div className="mb-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Individual deliveries with custom rates will not be affected.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
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
